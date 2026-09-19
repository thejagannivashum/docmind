"""
Calibrated confidence scoring.

Fuses two independent signals into one 0-1 confidence value shown to the user:
  1. Retrieval similarity — how well the retrieved chunks match the query
     (from vector distance; already computed during search, not re-derived here).
  2. Conflict signal — whether retrieved chunks contradict each other
     (from ConflictDetector; a contradiction should lower confidence even if
     retrieval similarity is high, because a confident answer built on
     contradictory sources is worse than an uncertain one).

Kept as a pure function of its inputs (no I/O, no model calls) so it's cheap
to call on every request and trivial to unit test / recalibrate later.
"""
from dataclasses import dataclass

CONFLICT_PENALTY_WEIGHT = 0.6  # how much a maximal conflict score can reduce confidence


@dataclass
class ConfidenceResult:
    score: float  # 0-1
    label: str  # "high" | "medium" | "low"


def compute_confidence(retrieval_scores: list[float], conflict_score: float) -> ConfidenceResult:
    """retrieval_scores: per-chunk similarity in [0, 1]. conflict_score: from ConflictDetector, in [0, 1]."""
    if not retrieval_scores:
        return ConfidenceResult(score=0.0, label="low")

    avg_similarity = sum(retrieval_scores) / len(retrieval_scores)
    penalty = conflict_score * CONFLICT_PENALTY_WEIGHT
    raw = avg_similarity * (1 - penalty)
    score = round(max(0.0, min(1.0, raw)), 4)

    if score >= 0.7:
        label = "high"
    elif score >= 0.4:
        label = "medium"
    else:
        label = "low"

    return ConfidenceResult(score=score, label=label)
