"""Match boundary polygons to places.csv. One-shot.

Output: data/polygons.json — { "<place_id>": <geojson_geometry>, ... }
Only places that have a matched polygon are present.
"""
import csv
import json
from pathlib import Path

RAW = Path(__file__).parent.parent / "data" / "raw" / "polygons.json"
PLACES_CSV = Path(__file__).parent.parent / "data" / "places.csv"
OUT = Path(__file__).parent.parent / "data" / "polygons.json"


def stitch_ways(ways: list[list[tuple[float, float]]]) -> list[list[tuple[float, float]]]:
    """Connect way segments by matching endpoints. Returns closed rings."""
    rings: list[list[tuple[float, float]]] = []
    pool = [w[:] for w in ways]
    while pool:
        ring = pool.pop(0)
        changed = True
        while changed and (not ring or ring[0] != ring[-1]):
            changed = False
            for i, w in enumerate(pool):
                if not w:
                    continue
                if w[0] == ring[-1]:
                    ring.extend(w[1:]); pool.pop(i); changed = True; break
                if w[-1] == ring[-1]:
                    ring.extend(w[-2::-1]); pool.pop(i); changed = True; break
                if w[-1] == ring[0]:
                    ring = w[:-1] + ring; pool.pop(i); changed = True; break
                if w[0] == ring[0]:
                    ring = w[::-1][:-1] + ring; pool.pop(i); changed = True; break
        if len(ring) >= 4:
            rings.append(ring)
    return rings


def relation_to_geom(rel: dict) -> dict | None:
    """Convert an Overpass relation into a GeoJSON Polygon/MultiPolygon."""
    outer_ways, inner_ways = [], []
    for m in rel.get("members", []):
        if m["type"] != "way":
            continue
        geom = m.get("geometry")
        if not geom:
            continue
        pts = [(round(p["lon"], 5), round(p["lat"], 5)) for p in geom]
        if m["role"] == "outer":
            outer_ways.append(pts)
        elif m["role"] == "inner":
            inner_ways.append(pts)
    outers = stitch_ways(outer_ways)
    inners = stitch_ways(inner_ways)
    if not outers:
        return None
    # Simple model: one outer ring with all inner holes. (Multi-outer is rare in
    # admin polygons; treat each outer as its own polygon if it happens.)
    if len(outers) == 1:
        coords = [[list(p) for p in outers[0]]]
        coords += [[list(p) for p in r] for r in inners]
        return {"type": "Polygon", "coordinates": coords}
    polys = [[[list(p) for p in r]] for r in outers]
    for r in inners:
        polys[0].append([list(p) for p in r])
    return {"type": "MultiPolygon", "coordinates": polys}


def _norm(s: str) -> str:
    return (s or "").strip().casefold().replace("'", "").replace("`", "").replace("-", " ").replace("  ", " ")


def main():
    data = json.loads(RAW.read_text(encoding="utf-8"))

    # name_en/name_he → geom (last write wins, fine for our scale)
    by_en: dict[str, dict] = {}
    by_he: dict[str, dict] = {}
    for rel in data["elements"]:
        tags = rel.get("tags", {})
        geom = relation_to_geom(rel)
        if not geom:
            continue
        if en := tags.get("name:en"):
            by_en[_norm(en)] = geom
        if he := tags.get("name:he"):
            by_he[_norm(he)] = geom
    print(f"polygons indexed: {len(by_en)} en, {len(by_he)} he")

    # Match against CSV
    result: dict[str, dict] = {}
    matched_by_en = matched_by_he = 0
    with PLACES_CSV.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = row["id"]
            en, he = _norm(row["name_en"]), _norm(row["name_he"])
            if en in by_en:
                result[pid] = by_en[en]
                matched_by_en += 1
            elif he in by_he:
                result[pid] = by_he[he]
                matched_by_he += 1

    OUT.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"matched: {matched_by_en} via en, {matched_by_he} via he, total {len(result)}")
    print(f"wrote {OUT} ({OUT.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
