import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from database.models import ChatMessage, ChatSession, User
from dependencies import get_rag_engine
from schemas.schemas import ChatRequest
from security import get_current_user
from services.rag_engine import RAGEngine

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.post("/stream")
async def chat_stream(
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    rag_engine: RAGEngine = Depends(get_rag_engine),
):
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == payload.session_id, ChatSession.user_id == user.id
        ).first()
    if session is None:
        session = ChatSession(title=payload.query[:60], user_id=user.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    db.add(ChatMessage(session_id=session.id, role="user", content=payload.query))
    db.commit()

    # Capture plain values BEFORE entering the generator. `event_generator`
    # runs after this request handler returns (StreamingResponse iterates its
    # body lazily), by which point the `db` session above has been closed by
    # FastAPI's dependency teardown and `user`/`session` are ORM instances
    # detached from any session — touching an attribute that got expired by
    # the db.commit() calls above (SQLAlchemy's default expire_on_commit)
    # raises DetachedInstanceError. Only plain values are safe to close over.
    user_id = user.id
    session_id = session.id
    query = payload.query
    history = [m.model_dump() for m in payload.history]

    def event_generator():
        full_response = ""
        meta: dict = {}
        for event in rag_engine.generate_response_stream(query, history, str(user_id)):
            if event["type"] == "meta":
                meta = event
                yield _sse({**event, "session_id": session_id})
            elif event["type"] == "token":
                full_response += event["content"]
                yield _sse(event)
            elif event["type"] == "done":
                yield _sse(event)

        # Persist the assistant turn after the stream completes, using a
        # fresh session — the request-scoped one is already closed by now.
        write_db = SessionLocal()
        try:
            write_db.add(ChatMessage(
                session_id=session_id,
                role="assistant",
                content=full_response,
                confidence=meta.get("confidence"),
                conflict_detected=meta.get("conflict_detected", False),
                sources_json=json.dumps(meta.get("sources", [])),
            ))
            write_db.commit()
        finally:
            write_db.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/sessions")
def list_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == user.id).order_by(ChatSession.created_at.desc()).all()
    return [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions]


@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user.id).first()
    if not session:
        return []
    return [
        {
            "id": m.id, "role": m.role, "content": m.content, "confidence": m.confidence,
            "conflict_detected": m.conflict_detected,
            "sources": json.loads(m.sources_json) if m.sources_json else [],
            "timestamp": m.timestamp,
        }
        for m in session.messages
    ]
