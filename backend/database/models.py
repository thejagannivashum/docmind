from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    collections = relationship("Collection", back_populates="owner", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class Collection(Base):
    """A named group of documents, e.g. 'Thesis sources' or 'Contracts 2026'."""
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="collections")
    documents = relationship("Document", back_populates="collection")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    filename = Column(String, nullable=False)
    file_hash = Column(String, index=True, nullable=False)  # sha256 of file bytes, used for dedup
    file_type = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    status = Column(String, default="processing")  # processing | indexed | failed
    error_message = Column(String, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=True)

    owner = relationship("User", back_populates="documents")
    collection = relationship("Collection", back_populates="documents")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New chat")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    confidence = Column(Float, nullable=True)  # 0-1, assistant messages only
    conflict_detected = Column(Boolean, default=False)
    sources_json = Column(Text, nullable=True)  # serialized list[SourceRef]
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
