from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine  # noqa: F401 - importing runs table creation
from routers import auth, chat, collections, documents, study_tools, analytics

app = FastAPI(title="DocMind AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(study_tools.router)
app.include_router(collections.router)
app.include_router(analytics.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "DocMind AI API is running"}
