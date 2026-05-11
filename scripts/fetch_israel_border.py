"""Fetch Israel's national boundary (admin_level=2) as a single GeoJSON.

One-shot. Writes data/israel.geojson — a Feature with the country polygon.
"""
import json
from pathlib import Path

import httpx
from shapely.geometry import Polygon, mapping
from shapely.ops import unary_union

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Full territorial extent — what's actually under Israeli control post-1967:
#   1473946  Israel proper (admin_level=2)
#   1803010  Judea and Samaria area (admin_level=4) — Israeli civil admin of
#            the West Bank, covers what OSM models as the geographical West
#            Bank including Area C. OSM's 1613659 "West Bank" is only the PA-
#            administered Areas A+B, which would leave gaping holes; do not
#            use that one alone.
#   1473938  Gaza Strip (admin_level=4) — included for geographical complete-
#            ness even though Israel does not currently administer it.
QUERY = """
[out:json][timeout:180];
(
  relation(1473946);
  relation(1803010);
  relation(1473938);
);
out geom;
"""


def stitch(ways):
    rings = []
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


def main():
    print("querying overpass for Israel boundary...")
    r = httpx.post(
        OVERPASS_URL,
        data={"data": QUERY},
        headers={"User-Agent": "israelle-game/0.1 (one-time data fetch)"},
        timeout=300,
    )
    r.raise_for_status()
    data = r.json()
    print(f"got {len(data['elements'])} relations")

    all_rings: list[list[tuple[float, float]]] = []
    for rel in data["elements"]:
        outer_ways = []
        for m in rel.get("members", []):
            if m.get("role") == "outer" and m["type"] == "way" and "geometry" in m:
                outer_ways.append([(round(p["lon"], 7), round(p["lat"], 7)) for p in m["geometry"]])
        rings = stitch(outer_ways)
        rings.sort(key=lambda r: -len(r))
        name = rel.get("tags", {}).get("name:en") or rel.get("tags", {}).get("name", "?")
        # Keep only the largest ring per relation. Smaller rings are interior
        # enclaves (e.g., individual Israeli settlements modeled as separate
        # boundary segments) — irrelevant for a country-level mask.
        if not rings:
            continue
        kept = [rings[0]]
        print(f"  {name}: stitched {len(rings)} ring(s), kept largest ({len(kept[0])} pts)")
        all_rings.extend(kept)

    # Union Israel + West Bank + Gaza into a single outer boundary so the
    # rendered border line has no internal seams.
    polys = [Polygon(r) for r in all_rings]
    merged = unary_union(polys)
    geom = mapping(merged)
    print(f"unioned -> {geom['type']}, "
          f"{len(geom['coordinates']) if geom['type'] == 'MultiPolygon' else 1} polygon(s)")
    feature = {"type": "Feature", "properties": {"name": "Israel (full extent)"}, "geometry": geom}

    out = Path(__file__).parent.parent / "data" / "israel.geojson"
    out.write_text(json.dumps(feature, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
