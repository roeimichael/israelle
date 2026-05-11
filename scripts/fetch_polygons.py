"""Fetch admin boundary polygons for Israeli settlements from Overpass.

One-shot. Writes data/raw/polygons.json (raw Overpass response with geometry).
"""
import json
from pathlib import Path

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# admin_level=8 = municipalities/local councils, admin_level=7 = regional councils.
# Both cover cities, towns, kibbutzim/moshavim (as part of regional councils).
QUERY = """
[out:json][timeout:300];
area(3601473946)->.il;
(
  relation["boundary"="administrative"]["admin_level"="8"](area.il);
  way["leisure"="nature_reserve"]["name"](area.il);
  relation["leisure"="nature_reserve"]["name"](area.il);
  way["boundary"="national_park"]["name"](area.il);
  relation["boundary"="national_park"]["name"](area.il);
  way["boundary"="protected_area"]["name"](area.il);
  relation["boundary"="protected_area"]["name"](area.il);
  way["historic"="archaeological_site"]["name"](area.il);
  way["historic"="castle"]["name"](area.il);
  way["historic"="fort"]["name"](area.il);
  way["historic"="ruins"]["name"](area.il);
  way["historic"="monument"]["name"](area.il);
  way["historic"="memorial"]["name"](area.il);
  way["tourism"~"^(theme_park|attraction|museum)$"]["name"](area.il);
);
out geom;
"""


def main():
    out = Path(__file__).parent.parent / "data" / "raw" / "polygons.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    print("querying overpass for admin boundaries...")
    r = httpx.post(
        OVERPASS_URL,
        data={"data": QUERY},
        headers={"User-Agent": "israelle-game/0.1 (one-time data fetch)"},
        timeout=600,
    )
    r.raise_for_status()
    d = r.json()
    print(f"got {len(d['elements'])} boundary relations")
    out.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
