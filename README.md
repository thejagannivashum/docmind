# DocMind AI

Offline intelligent document processing assistant with conflict-aware retrieval and confidence-based answer verification. Built as an evolution of ScholarsDock, with a dedicated NLI-based conflict detection module (not an LLM self-report) as the core research contribution.

## Status

This is under active incremental development. Below is an honest account of what's real vs. what's still ahead — check this before assuming a feature works.

### Working end-to-end (verified by running it, not just reading the code)
- **Auth**: register, login (JWT via OAuth2 password flow), route protection
- **Document upload**: PDF/DOCX/TXT, SHA-256 hash-based duplicate detection, background indexing into ChromaDB
- **Chat**: SSE-streamed responses, session persistence in SQLite
- **Conflict detection**: dedicated `services/conflict_detector.py` — pairwise NLI cross-encoder over retrieved chunks, not an LLM asking itself
- **Confidence scoring**: `services/confidence.py` — fuses retrieval similarity + conflict signal
- **Study tools API**: summary, quiz (structured JSON), flashcards — backend endpoints exist and are wired into `RAGEngine.extract_text`
- **Frontend**: Landing, Login, Register, Dashboard, Chat pages are real (not mocked) — chat page calls the actual streaming API, shows real confidence badges and conflict warnings from live data
- Full frontend production build (`npm run build`) passes clean
- Full backend imports and boots clean (`uvicorn main:app`); manually verified register → login → upload → list flow against a live server

### Not built yet
- Document Manager, Knowledge Base, Collections UI, Analytics, Settings, Profile pages (backend APIs for collections exist; document listing works; no dedicated pages yet)
- Voice input/output (offline STT/TTS) — chat UI has a disabled mic button as a placeholder, not wired
- Study tools (summary/quiz/flashcards) have no frontend UI yet — API-only
- Knowledge graph (marked optional in the original brief)

### Known limitations
- Never tested against a real Ollama instance or with `sentence-transformers` actually installed — that requires a GPU-capable / longer-running environment than this sandbox. The code paths are implemented and importable, but embedding/generation calls themselves are unverified beyond code review + the error-handling path (confirmed a missing-dependency failure surfaces cleanly as a "failed" document status instead of crashing).
- ChromaDB 0.4.24 has a harmless known bug where it attempts a telemetry call regardless of the `anonymized_telemetry=False` setting — logs a warning, doesn't affect functionality.

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env      # edit DOCMIND_SECRET_KEY at minimum
uvicorn main:app --reload
```
Requires [Ollama](https://ollama.com/) running locally with your chosen model pulled (`ollama pull llama3` — or set `DOCMIND_LLM_MODEL` to match whatever you've pulled).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `NEXT_PUBLIC_API_URL` in a `.env.local` if your backend isn't on `http://localhost:8000`.

## Architecture

```
frontend/          Next.js 15 App Router — pages, components, API client
backend/
  main.py          App entrypoint — router registration only
  config.py        Env-based settings
  security.py      JWT + password hashing
  dependencies.py  Shared singleton providers (RAGEngine, DocumentService)
  database/        SQLAlchemy models + session
  schemas/         Pydantic request/response models
  routers/         Thin HTTP layer — one file per domain
  services/        Business logic — RAG engine, conflict detector, confidence
                    scorer, document service, study tools
```

## Research contribution

`services/conflict_detector.py` runs a small NLI cross-encoder (`cross-encoder/nli-deberta-v3-small` by default) pairwise over retrieved chunks to detect genuine contradictions, independent of the generation LLM. `services/confidence.py` fuses that signal with retrieval similarity into a single calibrated confidence score, shown to the user per answer. See prior conversation history for the full research framing (problem statement, related work, novelty argument) — not duplicated here to avoid drift between the paper and the code.
