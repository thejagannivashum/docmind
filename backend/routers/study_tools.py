import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from database.models import Document, User
from dependencies import get_rag_engine
from schemas.schemas import FlashcardResponse, QuizResponse, SummaryResponse
from security import get_current_user
from services.flashcard_service import generate_flashcards
from services.quiz_service import generate_quiz
from services.rag_engine import RAGEngine
from services.summary_service import generate_summary

router = APIRouter(prefix="/api/study", tags=["study-tools"])


def _load_document_text(document_id: int, user: User, db: Session, rag_engine: RAGEngine) -> str:
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    file_path = os.path.join(settings.UPLOAD_DIR, f"{doc.file_hash}_{doc.filename}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Source file is missing from disk.")
    return rag_engine.extract_text(file_path, doc.filename)


@router.post("/{document_id}/summary", response_model=SummaryResponse)
def summarize_document(
    document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db),
    rag_engine: RAGEngine = Depends(get_rag_engine),
):
    text = _load_document_text(document_id, user, db, rag_engine)
    return SummaryResponse(summary=generate_summary(text))


@router.post("/{document_id}/quiz", response_model=QuizResponse)
def quiz_document(
    document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db),
    rag_engine: RAGEngine = Depends(get_rag_engine),
):
    text = _load_document_text(document_id, user, db, rag_engine)
    try:
        questions = generate_quiz(text)
    except ValueError:
        raise HTTPException(status_code=502, detail="The model returned an unparseable quiz. Try again.")
    return QuizResponse(questions=questions)


@router.post("/{document_id}/flashcards", response_model=FlashcardResponse)
def flashcards_for_document(
    document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db),
    rag_engine: RAGEngine = Depends(get_rag_engine),
):
    text = _load_document_text(document_id, user, db, rag_engine)
    try:
        cards = generate_flashcards(text)
    except ValueError:
        raise HTTPException(status_code=502, detail="The model returned unparseable flashcards. Try again.")
    return FlashcardResponse(flashcards=cards)
