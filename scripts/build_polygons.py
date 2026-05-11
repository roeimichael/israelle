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


def way_to_geom(way: dict) -> dict | None:
    """Convert a closed way to GeoJSON Polygon. Returns None if not a polygon."""
    geom = way.get("geometry")
    if not geom or len(geom) < 4:
        return None
    pts = [(round(p["lon"], 5), round(p["lat"], 5)) for p in geom]
    if pts[0] != pts[-1]:
        pts.append(pts[0])  # close it
    return {"type": "Polygon", "coordinates": [[list(p) for p in pts]]}


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

    # Index polygons by name (en/he) AND by wikidata Q-id (authoritative).
    by_en: dict[str, dict] = {}
    by_he: dict[str, dict] = {}
    by_wd: dict[str, dict] = {}
    skipped = 0
    for el in data["elements"]:
        tags = el.get("tags", {})
        if el["type"] == "relation":
            geom = relation_to_geom(el)
        elif el["type"] == "way":
            geom = way_to_geom(el)
        else:
            continue
        if not geom:
            skipped += 1
            continue
        if wd := tags.get("wikidata"):
            by_wd[wd] = geom
        for key in ("name:en", "int_name"):
            if v := tags.get(key):
                by_en[_norm(v)] = geom
        if v := tags.get("name:he"):
            by_he[_norm(v)] = geom
        if (n := tags.get("name")) and n not in (tags.get("name:en"), tags.get("name:he")):
            if any("֐" <= c <= "׿" for c in n):
                by_he[_norm(n)] = geom
            elif n.isascii():
                by_en[_norm(n)] = geom
    print(f"polygons indexed: {len(by_en)} en, {len(by_he)} he, {len(by_wd)} wikidata (skipped {skipped})")

    # Match against CSV (wikidata first — authoritative, then name fallbacks)
    result: dict[str, dict] = {}
    m_wd = m_en = m_he = 0
    with PLACES_CSV.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = row["id"]
            wd = row.get("wikidata", "")
            en, he = _norm(row["name_en"]), _norm(row["name_he"])
            if wd and wd in by_wd:
                result[pid] = by_wd[wd]; m_wd += 1
            elif en in by_en:
                result[pid] = by_en[en]; m_en += 1
            elif he in by_he:
                result[pid] = by_he[he]; m_he += 1

    OUT.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"matched: {m_wd} via wikidata, {m_en} via en, {m_he} via he — total {len(result)}")
    print(f"wrote {OUT} ({OUT.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
