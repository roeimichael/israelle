import csv
import json
import random
from pathlib import Path

CSV_PATH = Path(__file__).parent.parent / "data" / "places.csv"
POLY_PATH = Path(__file__).parent.parent / "data" / "polygons.json"

POLYGONS: dict[str, dict] = (
    json.loads(POLY_PATH.read_text(encoding="utf-8")) if POLY_PATH.exists() else {}
)


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
    """Return (category_label, multiplier). Mults sum to 1000 in a fixed-mix game:
    2×city (1×) + 2×settlement (2×) + 1×landmark (4×) = 200 + 400 + 400 = 1000."""
    if place_type == "city":
        return ("city", 1)
    if place_type == "village":
        return ("settlement", 2)
    return ("landmark", 4)


PLACES: dict[int, dict] = _load()
for _p in PLACES.values():
    cat, mult = _category(_p["type"])
    _p["category"] = cat
    _p["multiplier"] = mult


# Fixed composition: every game draws exactly this many of each category.
GAME_COMPOSITION = [("city", 2), ("settlement", 2), ("landmark", 1)]


def _weighted_sample(ids: list[int], k: int) -> list[int]:
    """k distinct ids, biased to higher importance."""
    pool = ids[:]
    weights = [PLACES[i]["importance"] ** 2 for i in pool]
    out: list[int] = []
    for _ in range(k):
        i = random.choices(range(len(pool)), weights=weights, k=1)[0]
        out.append(pool[i])
        pool.pop(i); weights.pop(i)
    return out


def sample_round_ids() -> list[int]:
    """Fixed-composition draw, then shuffled order of presentation."""
    chosen: list[int] = []
    by_cat: dict[str, list[int]] = {"city": [], "settlement": [], "landmark": []}
    for pid, p in PLACES.items():
        by_cat[p["category"]].append(pid)
    for cat, n in GAME_COMPOSITION:
        chosen.extend(_weighted_sample(by_cat[cat], n))
    random.shuffle(chosen)
    return chosen


def get(round_id: int) -> dict | None:
    return PLACES.get(round_id)


def get_polygon(round_id: int) -> dict | None:
    return POLYGONS.get(str(round_id))
