"""
Central application configuration.

Everything environment-specific (secrets, model names, paths) lives here so
no other module hardcodes them. Values load from a .env file if present,
falling back to sane local-dev defaults.
"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent


class Settings:
    # Auth
    SECRET_KEY: str = os.getenv("DOCMIND_SECRET_KEY", "dev-only-insecure-key-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Storage
    DATABASE_URL: str = os.getenv("DOCMIND_DATABASE_URL", f"sqlite:///{BASE_DIR / 'docmind.db'}")
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    CHROMA_DIR: Path = BASE_DIR / "chroma_db"

    # AI models
    EMBEDDING_MODEL: str = os.getenv("DOCMIND_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    NLI_MODEL: str = os.getenv("DOCMIND_NLI_MODEL", "cross-encoder/nli-deberta-v3-small")
    LLM_MODEL: str = os.getenv("DOCMIND_LLM_MODEL", "llama3")

    # RAG behavior
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K: int = 5

    # CORS
    ALLOWED_ORIGINS: list[str] = os.getenv("DOCMIND_ALLOWED_ORIGINS", "http://localhost:3000").split(",")


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
