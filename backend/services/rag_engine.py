import os
from functools import lru_cache
from typing import Dict, Generator, List

import chromadb
import ollama
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from config import settings
from services.confidence import compute_confidence
from services.conflict_detector import ConflictDetector

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


@lru_cache(maxsize=1)
def _get_embedding_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(settings.EMBEDDING_MODEL)


class RAGEngine:
    """Owns chunking, embedding, vector storage, retrieval, and answer generation.

    Conflict detection and confidence scoring are intentionally separate
    modules (services/conflict_detector.py, services/confidence.py) — this
    class calls them but doesn't implement that logic itself, keeping each
    file to one responsibility.
    """

    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(
            path=str(settings.CHROMA_DIR),
            settings=chromadb.Settings(anonymized_telemetry=False),
        )
        self.collection = self.chroma_client.get_or_create_collection(name="docmind_kb")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP
        )
        self.conflict_detector = ConflictDetector()

    # ---- Ingestion ----------------------------------------------------

    def extract_text(self, file_path: str, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")

        if ext == ".pdf":
            reader = PdfReader(file_path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        if ext == ".docx":
            doc = DocxDocument(file_path)
            return "\n".join(p.text for p in doc.paragraphs)
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def index_document(self, file_path: str, filename: str, user_id: str, document_id: int) -> int:
        """Chunks, embeds, and stores a document. Returns the chunk count.

        document_id (the SQL row id) is embedded in every chunk's metadata so
        we can delete/filter by document later without string-matching filenames.
        """
        text = self.extract_text(file_path, filename)
        if not text.strip():
            return 0

        chunks = self.text_splitter.split_text(text)
        if not chunks:
            return 0

        embeddings = _get_embedding_model().encode(chunks).tolist()
        ids = [f"doc{document_id}_chunk{i}" for i in range(len(chunks))]
        metadatas = [
            {"source": filename, "user_id": user_id, "document_id": document_id}
            for _ in chunks
        ]
        self.collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)
        return len(chunks)

    def delete_document(self, document_id: int) -> None:
        self.collection.delete(where={"document_id": document_id})

    # ---- Retrieval ------------------------------------------------------

    def search(self, query: str, user_id: str, top_k: int | None = None) -> List[Dict]:
        top_k = top_k or settings.TOP_K
        query_vector = _get_embedding_model().encode([query]).tolist()
        results = self.collection.query(
            query_embeddings=query_vector, n_results=top_k, where={"user_id": user_id}
        )

        formatted: List[Dict] = []
        if results["documents"] and results["documents"][0]:
            for i, doc_text in enumerate(results["documents"][0]):
                distance = results["distances"][0][i] if results.get("distances") else 1.0
                similarity = max(0.0, min(1.0, 1.0 - distance))  # distance -> similarity in [0,1]
                formatted.append({
                    "text": doc_text,
                    "source": results["metadatas"][0][i]["source"],
                    "similarity": similarity,
                })
        return formatted

    # ---- Generation -------------------------------------------------------

    def _build_messages(self, query: str, history: List[dict], retrieved: List[Dict], conflict_flagged: bool) -> list[dict]:
        context_text = "\n\n".join(f"Source ({r['source']}): {r['text']}" for r in retrieved)

        system_prompt = (
            "You are DocMind AI, a document research assistant. Answer using ONLY the "
            "provided context. Use markdown formatting and cite sources by name inline."
        )
        if conflict_flagged:
            system_prompt += (
                " IMPORTANT: the retrieved sources contain contradictory information. "
                "Do not silently pick one version — explicitly tell the user which "
                "sources disagree and what each one claims."
            )

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history[-5:])
        messages.append({"role": "user", "content": f"Context:\n{context_text}\n\nUser Question: {query}"})
        return messages

    def generate_response(self, query: str, history: List[dict], user_id: str) -> Dict:
        """Non-streaming path — used for tests / non-chat callers. Chat router uses generate_response_stream."""
        retrieved = self.search(query, user_id)
        if not retrieved:
            return {
                "response": "I couldn't find relevant information in your documents.",
                "sources": [], "confidence": 0.0, "conflict_detected": False, "conflicting_pairs": [],
            }

        conflict_report = self.conflict_detector.detect(retrieved)
        confidence = compute_confidence([r["similarity"] for r in retrieved], conflict_report.conflict_score)
        messages = self._build_messages(query, history, retrieved, conflict_report.has_conflict)

        response = ollama.chat(model=settings.LLM_MODEL, messages=messages)
        return {
            "response": response["message"]["content"],
            "sources": retrieved,
            "confidence": confidence.score,
            "confidence_label": confidence.label,
            "conflict_detected": conflict_report.has_conflict,
            "conflicting_pairs": [vars(p) for p in conflict_report.conflicting_pairs],
        }

    def generate_response_stream(self, query: str, history: List[dict], user_id: str) -> Generator[dict, None, None]:
        """Yields dict events: {"type": "meta", ...} first, then {"type": "token", "content": str}*,
        then {"type": "done"}. The chat router turns these into SSE frames."""
        retrieved = self.search(query, user_id)
        if not retrieved:
            yield {"type": "meta", "sources": [], "confidence": 0.0, "confidence_label": "low",
                   "conflict_detected": False, "conflicting_pairs": []}
            yield {"type": "token", "content": "I couldn't find relevant information in your documents."}
            yield {"type": "done"}
            return

        conflict_report = self.conflict_detector.detect(retrieved)
        confidence = compute_confidence([r["similarity"] for r in retrieved], conflict_report.conflict_score)

        yield {
            "type": "meta",
            "sources": retrieved,
            "confidence": confidence.score,
            "confidence_label": confidence.label,
            "conflict_detected": conflict_report.has_conflict,
            "conflicting_pairs": [vars(p) for p in conflict_report.conflicting_pairs],
        }

        messages = self._build_messages(query, history, retrieved, conflict_report.has_conflict)
        stream = ollama.chat(model=settings.LLM_MODEL, messages=messages, stream=True)
        for chunk in stream:
            token = chunk.get("message", {}).get("content", "")
            if token:
                yield {"type": "token", "content": token}
        yield {"type": "done"}
