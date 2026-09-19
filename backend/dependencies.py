from functools import lru_cache

from services.document_service import DocumentService
from services.rag_engine import RAGEngine


@lru_cache(maxsize=1)
def get_rag_engine() -> RAGEngine:
    """One RAGEngine per process — it owns the PersistentClient connection to
    Chroma and the (lazily-loaded) embedding model, both expensive to init."""
    return RAGEngine()


@lru_cache(maxsize=1)
def get_document_service() -> DocumentService:
    return DocumentService(get_rag_engine())
