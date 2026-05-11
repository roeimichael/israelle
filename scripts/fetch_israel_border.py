"""Fetch Israel's national boundary (admin_level=2) as a single GeoJSON.

One-shot. Writes data/israel.geojson — a Feature with the country polygon.
"""
import json
from pathlib import Path

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Israel admin relation. (Overpass area-id = 3600000000 + relation-id.)
QUERY = """
[out:json][timeout:180];
relation(1473946);
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
    rel = data["elements"][0]

    outer_ways = []
    for m in rel.get("members", []):
        if m.get("role") == "outer" and m["type"] == "way" and "geometry" in m:
            outer_ways.append([(round(p["lon"], 5), round(p["lat"], 5)) for p in m["geometry"]])
    rings = stitch(outer_ways)
    rings.sort(key=lambda r: -len(r))
    print(f"stitched {len(rings)} rings (largest has {len(rings[0])} points)")

    geom = (
        {"type": "Polygon", "coordinates": [[list(p) for p in rings[0]]]}
        if len(rings) == 1
        else {"type": "MultiPolygon", "coordinates": [[[list(p) for p in r]] for r in rings]}
    )
    feature = {"type": "Feature", "properties": {"name": "Israel"}, "geometry": geom}

    out = Path(__file__).parent.parent / "data" / "israel.geojson"
    out.write_text(json.dumps(feature, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
