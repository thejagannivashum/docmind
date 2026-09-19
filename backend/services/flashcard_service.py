import json

import ollama

from config import settings

FLASHCARD_PROMPT = """Generate {count} flashcards (term/concept on the front, explanation on the back)
based on the text below, useful for studying it.

Respond with ONLY valid JSON (no markdown fences, no preamble), matching exactly this shape:
{{"flashcards": [{{"front": "...", "back": "..."}}]}}

Text:
{text}
"""


def generate_flashcards(text: str, count: int = 10, max_chars: int = 8000) -> list[dict]:
    prompt = FLASHCARD_PROMPT.format(count=count, text=text[:max_chars])
    response = ollama.chat(model=settings.LLM_MODEL, messages=[{"role": "user", "content": prompt}])
    raw = response["message"]["content"].strip()

    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]

    parsed = json.loads(raw)
    return parsed.get("flashcards", [])
