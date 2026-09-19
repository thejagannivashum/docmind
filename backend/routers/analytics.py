from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from database import get_db
from database.models import ChatMessage, ChatSession, Document, User
from schemas.schemas import AnalyticsOverview
from security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.owner_id == user.id)
    total_documents = docs.count()
    indexed_documents = docs.filter(Document.status == "indexed").count()
    failed_documents = docs.filter(Document.status == "failed").count()
    total_chunks = db.query(func.coalesce(func.sum(Document.chunk_count), 0)).filter(
        Document.owner_id == user.id
    ).scalar()
    storage_bytes = db.query(func.coalesce(func.sum(Document.file_size_bytes), 0)).filter(
        Document.owner_id == user.id
    ).scalar()

    assistant_messages = (
        db.query(ChatMessage)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .filter(ChatSession.user_id == user.id, ChatMessage.role == "assistant")
    )
    questions_asked = assistant_messages.count()

    confidences = [m.confidence for m in assistant_messages if m.confidence is not None]
    avg_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 0.0

    conflicts = assistant_messages.filter(ChatMessage.conflict_detected == True).count()  # noqa: E712
    conflict_rate = round(conflicts / questions_asked, 4) if questions_asked else 0.0

    return AnalyticsOverview(
        total_documents=total_documents,
        indexed_documents=indexed_documents,
        failed_documents=failed_documents,
        total_chunks=total_chunks,
        questions_asked=questions_asked,
        avg_confidence=avg_confidence,
        conflict_rate=conflict_rate,
        storage_bytes=storage_bytes,
    )
