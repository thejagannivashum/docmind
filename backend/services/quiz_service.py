import json

import ollama

from config import settings

QUIZ_PROMPT = """Generate a {count}-question multiple-choice quiz based on the text below.

Respond with ONLY valid JSON (no markdown fences, no preamble), matching exactly this shape:
{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], "correct_index": 0}}]}}

Text:
{text}
"""


def generate_quiz(text: str, count: int = 5, max_chars: int = 8000) -> list[dict]:
    prompt = QUIZ_PROMPT.format(count=count, text=text[:max_chars])
    response = ollama.chat(model=settings.LLM_MODEL, messages=[{"role": "user", "content": prompt}])
    raw = response["message"]["content"].strip()

    # Models sometimes wrap JSON in ```json fences despite instructions — strip defensively.
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]

    parsed = json.loads(raw)
    return parsed.get("questions", [])
