import hashlib
import os
import shutil
from dataclasses import dataclass

from fastapi import UploadFile
from sqlalchemy.orm import Session

from config import settings
from database.models import Document
from services.rag_engine import RAGEngine


@dataclass
class UploadResult:
    document: Document
    is_duplicate: bool
    chunk_count: int


def _hash_file(path: str) -> str:
    sha256 = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(8192), b""):
            sha256.update(block)
    return sha256.hexdigest()


class DocumentService:
    def __init__(self, rag_engine: RAGEngine):
        self.rag_engine = rag_engine

    def upload_and_index(
        self, file: UploadFile, user_id: int, db: Session, collection_id: int | None = None
    ) -> UploadResult:
        ext = os.path.splitext(file.filename)[1].lower()
        temp_path = os.path.join(settings.UPLOAD_DIR, f"_tmp_{file.filename}")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_hash = _hash_file(temp_path)

        # Duplicate detection: same content hash already indexed for this user.
        existing = (
            db.query(Document)
            .filter(Document.owner_id == user_id, Document.file_hash == file_hash, Document.status == "indexed")
            .first()
        )
        if existing:
            os.remove(temp_path)
            return UploadResult(document=existing, is_duplicate=True, chunk_count=existing.chunk_count)

        final_path = os.path.join(settings.UPLOAD_DIR, f"{file_hash}_{file.filename}")
        shutil.move(temp_path, final_path)

        doc = Document(
            title=file.filename,
            filename=file.filename,
            file_hash=file_hash,
            file_type=ext,
            file_size_bytes=os.path.getsize(final_path),
            status="processing",
            owner_id=user_id,
            collection_id=collection_id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        try:
            chunk_count = self.rag_engine.index_document(final_path, file.filename, str(user_id), doc.id)
            doc.chunk_count = chunk_count
            doc.status = "indexed" if chunk_count > 0 else "failed"
            if chunk_count == 0:
                doc.error_message = "No extractable text found in this file."
        except Exception as e:
            doc.status = "failed"
            doc.error_message = str(e)
            chunk_count = 0

        db.commit()
        db.refresh(doc)
        return UploadResult(document=doc, is_duplicate=False, chunk_count=chunk_count)

    def delete_document(self, doc: Document, db: Session) -> None:
        self.rag_engine.delete_document(doc.id)
        file_path = os.path.join(settings.UPLOAD_DIR, f"{doc.file_hash}_{doc.filename}")
        if os.path.exists(file_path):
            os.remove(file_path)
        db.delete(doc)
        db.commit()
