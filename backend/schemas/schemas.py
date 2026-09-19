from datetime import datetime

from pydantic import BaseModel


# ---- Auth ----

class UserCreate(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Collections ----

class CollectionCreate(BaseModel):
    name: str
    description: str | None = None


class CollectionResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Documents ----

class DocumentResponse(BaseModel):
    id: int
    title: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    status: str
    error_message: str | None
    upload_date: datetime
    collection_id: int | None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    document: DocumentResponse
    is_duplicate: bool
    message: str


# ---- Chat ----

class ChatMessageIn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str
    session_id: int | None = None
    history: list[ChatMessageIn] = []


class SourceRef(BaseModel):
    text: str
    source: str
    similarity: float


class ConflictPairOut(BaseModel):
    source_a: str
    source_b: str
    text_a: str
    text_b: str
    contradiction_score: float


class ChatResponse(BaseModel):
    response: str
    sources: list[SourceRef]
    confidence: float
    confidence_label: str
    conflict_detected: bool
    conflicting_pairs: list[ConflictPairOut] = []


# ---- Study tools ----

class SummaryResponse(BaseModel):
    summary: str


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_index: int


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]


class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardResponse(BaseModel):
    flashcards: list[Flashcard]


# ---- Analytics ----

class AnalyticsOverview(BaseModel):
    total_documents: int
    indexed_documents: int
    failed_documents: int
    total_chunks: int
    questions_asked: int
    avg_confidence: float
    conflict_rate: float  # fraction of assistant answers where a conflict was detected
    storage_bytes: int
