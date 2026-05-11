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


def _category(place_type: str) -> tuple[str, int]:
    """Return (category_label, multiplier)."""
    if place_type == "city":
        return ("city", 1)
    if place_type == "village":
        return ("settlement", 2)
    return ("landmark", 3)


PLACES: dict[int, dict] = _load()
for _p in PLACES.values():
    cat, mult = _category(_p["type"])
    _p["category"] = cat
    _p["multiplier"] = mult


def sample_round_ids(n: int = 5) -> list[int]:
    """Weighted-random sample without replacement, biased to important places."""
    ids = list(PLACES.keys())
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
