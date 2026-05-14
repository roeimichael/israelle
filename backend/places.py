import csv
import json
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
                "description": row.get("description", ""),
                "image_url": row.get("image_url", ""),
                "source_url": row.get("source_url", ""),
            }
    return out


def _category(place_type: str) -> tuple[str, float]:
    """Max round score = base × mult. Composition sums to 1000:
      2 × city       (1.0×) →  2 × 100 = 200
      2 × settlement (1.5×) →  2 × 150 = 300
      2 × landmark   (2.5×) →  2 × 250 = 500
                                       ───────
                                         1000
    """
    if place_type == "city":
        return ("city", 1.0)
    if place_type == "village":
        return ("settlement", 1.5)
    return ("landmark", 2.5)


PLACES: dict[int, dict] = _load()
for _p in PLACES.values():
    cat, mult = _category(_p["type"])
    _p["category"] = cat
    _p["multiplier"] = mult


def get(round_id: int) -> dict | None:
    return PLACES.get(round_id)


def get_polygon(round_id: int) -> dict | None:
    return POLYGONS.get(str(round_id))
