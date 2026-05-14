"""Fetch a high-detail land-only polygon for Israel + Palestinian territories.

Source: geoBoundaries Open (gbOpen) ADM0 boundaries — curated land-only,
much more detailed than Natural Earth (13k+ points per country vs 400).

We pull Israel + Palestine and union them so the rendered outline has no
internal seams between Israel proper, the West Bank, and Gaza.

One-shot. Writes data/israel.geojson — a Feature with the country polygon.
"""
import json
from pathlib import Path

import httpx
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union

API = "https://www.geoboundaries.org/api/current/gbOpen/{iso}/ADM0/"
ISOS = ["ISR", "PSE"]


def fetch_country(iso: str):
    print(f"querying geoBoundaries for {iso} ...")
    meta = httpx.get(API.format(iso=iso), timeout=60).json()
    url = meta["gjDownloadURL"]
    print(f"  download: {url}")
    fc = httpx.get(url, follow_redirects=True, timeout=120).json()
    return shape(fc["features"][0]["geometry"])


def _clean(geom):
    """Drop alignment artifacts: keep largest piece, fill all interior holes.
    geoBoundaries IL + PSE don't share identical vertices on their shared
    border, so unary_union leaves thousands of sliver holes and tiny outer
    polygons. Dropping them removes visual noise without changing the shape."""
    polys = [geom] if isinstance(geom, Polygon) else list(geom.geoms)
    main_poly = max(polys, key=lambda p: p.area)
    return Polygon(main_poly.exterior)  # exterior only, drops all holes


def main():
    geoms = [fetch_country(iso) for iso in ISOS]
    merged = unary_union(geoms)
    cleaned = _clean(merged)
    geom = mapping(cleaned)
    print(f"merged -> {merged.geom_type}, cleaned -> {geom['type']} "
          f"({len(geom['coordinates'][0])} pts)")
    feature = {"type": "Feature",
               "properties": {"name": "Israel (ISR + PSE, land only, geoBoundaries)"},
               "geometry": geom}
    out = Path(__file__).parent.parent / "data" / "israel.geojson"
    out.write_text(json.dumps(feature, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
