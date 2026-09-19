"""
Retrieval-time conflict detection.

Deliberately does NOT ask the generation LLM "do these sources conflict?" —
that conflates two different jobs (retrieval judgment vs. answer generation)
and is unreliable/unverifiable. Instead this module runs a small, dedicated
NLI (natural language inference) cross-encoder over every pair of retrieved
chunks and classifies each pair as entailment / neutral / contradiction.

This keeps conflict detection fast, local, and independent of the LLM used
for generation — swap Ollama models freely without touching this module.
"""
from dataclasses import dataclass, field
from functools import lru_cache
from itertools import combinations
from typing import List

from config import settings

# Label order for cross-encoder/nli-deberta-v3-small (and most sentence-transformers
# NLI cross-encoders trained on SNLI/MultiNLI). If you swap NLI_MODEL, verify this
# order against that model's card before trusting output.
NLI_LABELS = ["contradiction", "entailment", "neutral"]

CONTRADICTION_THRESHOLD = 0.55  # pair-level probability above which we call it a conflict


@dataclass
class ConflictPair:
    source_a: str
    source_b: str
    text_a: str
    text_b: str
    contradiction_score: float


@dataclass
class ConflictReport:
    has_conflict: bool
    conflict_score: float  # 0 (no conflict) - 1 (strong conflict), max over pairs
    conflicting_pairs: List[ConflictPair] = field(default_factory=list)


@lru_cache(maxsize=1)
def _get_model():
    """Lazy-loaded, process-wide singleton so the model loads once, not per-request."""
    from sentence_transformers import CrossEncoder
    return CrossEncoder(settings.NLI_MODEL)


class ConflictDetector:
    def __init__(self, contradiction_threshold: float = CONTRADICTION_THRESHOLD):
        self.contradiction_threshold = contradiction_threshold

    def _pairwise_contradiction(self, text_a: str, text_b: str) -> float:
        import numpy as np

        model = _get_model()
        logits = model.predict([(text_a, text_b)])[0]
        exp = np.exp(logits - np.max(logits))
        probs = exp / exp.sum()
        return float(probs[NLI_LABELS.index("contradiction")])

    def detect(self, chunks: List[dict]) -> ConflictReport:
        """chunks: list of {"text": str, "source": str, ...} as returned by RAGEngine.search().

        Runs pairwise NLI over every chunk pair (bounded by top_k, so this stays
        cheap — 5 chunks = 10 pairs, each a single small cross-encoder forward pass).
        """
        if len(chunks) < 2:
            return ConflictReport(has_conflict=False, conflict_score=0.0)

        conflicting_pairs: List[ConflictPair] = []
        max_score = 0.0

        for a, b in combinations(chunks, 2):
            # Skip pairs from the same document — internal restatement isn't a conflict signal
            if a["source"] == b["source"]:
                continue
            score = self._pairwise_contradiction(a["text"], b["text"])
            max_score = max(max_score, score)
            if score >= self.contradiction_threshold:
                conflicting_pairs.append(ConflictPair(
                    source_a=a["source"], source_b=b["source"],
                    text_a=a["text"], text_b=b["text"],
                    contradiction_score=score,
                ))

        return ConflictReport(
            has_conflict=len(conflicting_pairs) > 0,
            conflict_score=round(max_score, 4),
            conflicting_pairs=conflicting_pairs,
        )
