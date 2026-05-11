"""Merge raw OSM data into data/places.csv. One-shot.

Output schema: id,name_en,name_he,type,lat,lon,importance
"""
import csv
import json
import re
from pathlib import Path

RAW = Path(__file__).parent.parent / "data" / "raw" / "overpass.json"
OUT = Path(__file__).parent.parent / "data" / "places.csv"

# place tag → (display type, base importance). Hamlet/suburb/neighbourhood dropped.
PLACE_WEIGHTS = {
    "city": ("city", 1.0),
    "town": ("city", 0.85),   # collapse town into city — same Hebrew "עיר"
    "village": ("village", 0.65),
}

# historic values that aren't useful as game targets
HISTORIC_DROP = {"yes", "building", "tank", "cannon", "wreck", "aircraft",
                 "boundary_stone", "citywalls", "water_well"}


def classify(tags: dict) -> tuple[str, float] | None:
    """Return (type_label, base_importance) or None to drop."""
    if (p := tags.get("place")) and p in PLACE_WEIGHTS:
        return PLACE_WEIGHTS[p]
    if tags.get("natural") == "peak":
        return ("mountain", 0.55)
    if h := tags.get("historic"):
        if h in HISTORIC_DROP:
            return None
        if h in {"archaeological_site", "monument", "memorial", "castle", "fort"}:
            return (h.replace("_", " "), 0.55)
        if h == "ruins":
            return ("ruins", 0.45)
        return (h.replace("_", " "), 0.35)
    if t := tags.get("tourism"):
        if t == "museum":
            return ("museum", 0.6)
        if t == "viewpoint":
            return ("viewpoint", 0.45)
        if t == "theme_park":
            return ("theme park", 0.6)
        if t == "attraction":
            return ("attraction", 0.5)
    if tags.get("leisure") == "nature_reserve":
        return ("nature reserve", 0.6)
    if tags.get("amenity") == "place_of_worship":
        rel = tags.get("religion", "")
        return (f"{rel} site".strip() if rel else "religious site", 0.5)
    return None


_LEAD_JUNK = re.compile(r"^[\d\s\-_/.,]+")  # strip elevation prefixes etc.


def _clean(s: str) -> str:
    return _LEAD_JUNK.sub("", s).strip()


def pick_name(tags: dict) -> tuple[str, str] | None:
    """Return (name_en, name_he) — both required."""
    he = tags.get("name:he") or tags.get("name:he-latn")
    en = tags.get("name:en") or tags.get("int_name")
    fallback = tags.get("name", "")
    if not en and fallback and fallback.isascii():
        en = fallback
    if not he and fallback and any("֐" <= c <= "׿" for c in fallback):
        he = fallback
    if not en or not he:
        return None
    en, he = _clean(en), _clean(he)
    if not en or not he:
        return None
    return (en, he)


def coord(el: dict) -> tuple[float, float] | None:
    if "lat" in el and "lon" in el:
        return (el["lat"], el["lon"])
    c = el.get("center")
    if c:
        return (c["lat"], c["lon"])
    return None


def main():
    data = json.loads(RAW.read_text(encoding="utf-8"))
    rows: dict[tuple[float, float], dict] = {}
    skipped_no_name = skipped_no_class = skipped_no_coord = 0

    for el in data["elements"]:
        tags = el.get("tags", {})
        c = coord(el)
        if not c:
            skipped_no_coord += 1
            continue
        cls = classify(tags)
        if not cls:
            skipped_no_class += 1
            continue
        names = pick_name(tags)
        if not names:
            skipped_no_name += 1
            continue
        type_label, base_imp = cls
        bonus = 0.0
        if "wikipedia" in tags or "wikidata" in tags:
            bonus += 0.2
        if pop := tags.get("population"):
            try:
                bonus += min(0.15, int(pop.replace(",", "")) / 1_000_000)
            except ValueError:
                pass
        importance = min(1.0, base_imp + bonus)

        key = (round(c[0], 3), round(c[1], 3))
        if key in rows and rows[key]["importance"] >= importance:
            continue
        rows[key] = {
            "id": el["id"],
            "name_en": names[0],
            "name_he": names[1],
            "type": type_label,
            "lat": c[0],
            "lon": c[1],
            "importance": round(importance, 3),
        }

    final = [r for r in rows.values() if r["importance"] >= 0.35]
    final.sort(key=lambda r: -r["importance"])

    OUT.parent.mkdir(exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "name_en", "name_he", "type", "lat", "lon", "importance"])
        w.writeheader()
        w.writerows(final)

    print(f"input: {len(data['elements'])}")
    print(f"skipped: coord={skipped_no_coord} class={skipped_no_class} name={skipped_no_name}")
    print(f"deduped: {len(rows)}")
    print(f"final (importance>=0.35): {len(final)}")
    print(f"wrote {OUT}")
    print("\ntop 10:")
    for r in final[:10]:
        print(f"  {r['importance']:.2f} {r['type']:12} {r['name_en']:30} ({r['name_he']})")


if __name__ == "__main__":
    main()
