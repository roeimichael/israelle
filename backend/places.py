import csv
import random
from pathlib import Path

CSV_PATH = Path(__file__).parent.parent / "data" / "places.csv"


def _load() -> dict[int, dict]:
    out: dict[int, dict] = {}
    with CSV_PATH.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[int(row["id"])] = {
                "id": int(row["id"]),
                "name_en": row["name_en"],
                "name_he": row["name_he"],
                "type": row["type"],
                "lat": float(row["lat"]),
                "lon": float(row["lon"]),
                "importance": float(row["importance"]),
            }
    return out


PLACES: dict[int, dict] = _load()

DIFFICULTY_TYPES = {
    "easy":   {"city"},
    "medium": {"city", "village", "mountain"},
    "hard":   None,  # all types
}


def _pool(difficulty: str) -> list[int]:
    allowed = DIFFICULTY_TYPES.get(difficulty, None)
    if allowed is None:
        return list(PLACES.keys())
    return [pid for pid, p in PLACES.items() if p["type"] in allowed]


def sample_round_ids(n: int = 5, difficulty: str = "medium") -> list[int]:
    """Weighted-random sample without replacement, biased to important places."""
    ids = _pool(difficulty)
    if len(ids) < n:
        raise ValueError(f"not enough places for difficulty={difficulty}")
    weights = [PLACES[i]["importance"] ** 2 for i in ids]
    chosen: list[int] = []
    for _ in range(n):
        i = random.choices(range(len(ids)), weights=weights, k=1)[0]
        chosen.append(ids[i])
        ids.pop(i)
        weights.pop(i)
    return chosen


def get(round_id: int) -> dict | None:
    return PLACES.get(round_id)
