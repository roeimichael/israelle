"""Fetch admin boundary polygons for Israeli settlements from Overpass.

One-shot. Writes data/raw/polygons.json (raw Overpass response with geometry).
Split into a few smaller queries so Overpass doesn't time out.
"""
import json
from pathlib import Path

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

AREAS = """(
  area(3601473946);
  area(3601803010);
)->.il;"""

QUERIES = [
    # Administrative boundaries (municipalities + regional councils + sub-municipal)
    AREAS + """
    (
      relation["boundary"="administrative"]["admin_level"~"^(6|7|8|9|10)$"](area.il);
    );
    out geom;
    """,
    # Settlement footprints — residential blobs + place=village/town/hamlet polygons
    AREAS + """
    (
      way["landuse"="residential"]["name"](area.il);
      way["landuse"="industrial"]["name"](area.il);
      way["place"~"^(city|town|village|hamlet|suburb|neighbourhood|isolated_dwelling|locality|farm)$"]["name"](area.il);
      relation["place"~"^(city|town|village|hamlet|suburb|neighbourhood|locality)$"]["name"](area.il);
    );
    out geom;
    """,
    # Reserves, parks, protected areas, forests
    AREAS + """
    (
      way["leisure"="nature_reserve"]["name"](area.il);
      relation["leisure"="nature_reserve"]["name"](area.il);
      way["boundary"="national_park"]["name"](area.il);
      relation["boundary"="national_park"]["name"](area.il);
      way["boundary"="protected_area"]["name"](area.il);
      relation["boundary"="protected_area"]["name"](area.il);
      way["boundary"="forest"]["name"](area.il);
      relation["boundary"="forest"]["name"](area.il);
      way["landuse"="forest"]["name"](area.il);
    );
    out geom;
    """,
    # Historic + tourism + religious
    AREAS + """
    (
      way["historic"~"^(archaeological_site|castle|fort|ruins|monument|memorial|city_gate|tomb|battlefield)$"]["name"](area.il);
      relation["historic"="archaeological_site"]["name"](area.il);
      way["tourism"~"^(theme_park|attraction|museum|zoo)$"]["name"](area.il);
      relation["tourism"~"^(theme_park|attraction|museum|zoo)$"]["name"](area.il);
      way["amenity"="place_of_worship"]["name"]["wikipedia"](area.il);
    );
    out geom;
    """,
]


def main():
    out = Path(__file__).parent.parent / "data" / "raw" / "polygons.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    all_elements: list[dict] = []
    for i, q in enumerate(QUERIES, 1):
        print(f"[{i}/{len(QUERIES)}] querying overpass...")
        for attempt in range(3):
            try:
                r = httpx.post(
                    OVERPASS_URL,
                    data={"data": "[out:json][timeout:300];\n" + q},
                    headers={"User-Agent": "israelle-game/0.1 (one-time data fetch)"},
                    timeout=600,
                )
                r.raise_for_status()
                break
            except httpx.HTTPStatusError as e:
                if e.response.status_code in (429, 504, 502):
                    print(f"  retry {attempt+1}: {e.response.status_code}")
                    import time
                    time.sleep(20 * (attempt + 1))
                    continue
                raise
        else:
            raise RuntimeError(f"query {i} failed after 3 retries")
        d = r.json()
        print(f"  got {len(d['elements'])} elements")
        all_elements.extend(d["elements"])
    merged = {"elements": all_elements}
    out.write_text(json.dumps(merged, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size//1024} KB), total {len(all_elements)} elements")


if __name__ == "__main__":
    main()
