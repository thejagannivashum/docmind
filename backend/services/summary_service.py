import ollama

from config import settings


def generate_summary(text: str, max_chars: int = 12000) -> str:
    """Summarizes text via the local LLM. Truncates very long input rather than
    failing outright — a partial summary is more useful than an error."""
    truncated = text[:max_chars]
    prompt = (
        "Provide a concise, well-structured summary of the following document. "
        "Use markdown with short headings for major sections if the content warrants it.\n\n"
        f"{truncated}"
    )
    response = ollama.chat(model=settings.LLM_MODEL, messages=[{"role": "user", "content": prompt}])
    return response["message"]["content"]
