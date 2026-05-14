"""Fetch a clean Israel-including-Palestinian-territories LAND polygon.

Source: Natural Earth 1:10m cultural countries (nvkelso/natural-earth-vector).
This dataset is curated land-only — no EEZ/territorial-water bulges into the
Mediterranean — so it can be used directly as a country outline.

We pull Israel (ISR) + Palestine (PSE; WB+Gaza multipolygon) and union them
into a single boundary so the rendered border has no internal seams.

One-shot. Writes data/israel.geojson — a Feature with the country polygon.
"""
import json
from pathlib import Path

import httpx
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson"
TARGETS = {"ISR", "PSE"}


def main():
    print(f"downloading {URL} ...")
    r = httpx.get(URL, timeout=300)
    r.raise_for_status()
    data = r.json()
    print(f"got {len(data['features'])} countries")

    geoms = []
    for f in data["features"]:
        iso = f["properties"].get("ISO_A3")
        if iso in TARGETS:
            geoms.append(shape(f["geometry"]))
            print(f"  picked {iso} ({f['properties'].get('NAME')})")
    if not geoms:
        raise SystemExit("no ISR/PSE features found")

    merged = unary_union(geoms)
    geom = mapping(merged)
    print(f"unioned -> {geom['type']}, "
          f"{len(geom['coordinates']) if geom['type']=='MultiPolygon' else 1} polygon(s)")

    feature = {"type": "Feature",
               "properties": {"name": "Israel (full extent, land only)"},
               "geometry": geom}
    out = Path(__file__).parent.parent / "data" / "israel.geojson"
    out.write_text(json.dumps(feature, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
