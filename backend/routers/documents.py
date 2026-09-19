from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database import get_db
from database.models import Document, User
from dependencies import get_document_service
from schemas.schemas import DocumentResponse, DocumentUploadResponse
from security import get_current_user
from services.document_service import DocumentService

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    collection_id: int | None = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(get_document_service),
):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in {".pdf", ".docx", ".txt"}:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

    result = document_service.upload_and_index(file, user.id, db, collection_id)

    if result.is_duplicate:
        message = "This document was already uploaded and indexed — skipped re-processing."
    elif result.document.status == "indexed":
        message = f"Indexed {result.chunk_count} chunks."
    else:
        message = result.document.error_message or "Processing failed."

    return DocumentUploadResponse(document=result.document, is_duplicate=result.is_duplicate, message=message)


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    collection_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Document).filter(Document.owner_id == user.id)
    if collection_id is not None:
        query = query.filter(Document.collection_id == collection_id)
    return query.order_by(Document.upload_date.desc()).all()


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_service: DocumentService = Depends(get_document_service),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    document_service.delete_document(doc, db)
