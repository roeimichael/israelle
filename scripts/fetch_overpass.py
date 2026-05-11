"""Fetch Israeli places from Overpass API. One-shot. Writes data/raw/overpass.json."""
import json
from pathlib import Path
import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# ISO area code IL = 3601473946 (Israel relation). Use area for clean clipping
# vs bbox (which would include West Bank / parts of Lebanon).
QUERY = """
[out:json][timeout:180];
area(3601473946)->.il;
(
  node["place"~"^(city|town|village|hamlet|suburb|neighbourhood)$"](area.il);
  node["natural"="peak"](area.il);
  node["historic"](area.il);
  node["tourism"~"^(attraction|museum|theme_park|viewpoint)$"](area.il);
  node["leisure"="nature_reserve"](area.il);
  way["leisure"="nature_reserve"](area.il);
  node["amenity"="place_of_worship"]["wikipedia"](area.il);
);
out center tags;
"""


def main():
    out = Path(__file__).parent.parent / "data" / "raw" / "overpass.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    print(f"querying overpass...")
    r = httpx.post(
        OVERPASS_URL,
        data={"data": QUERY},
        headers={"User-Agent": "israelle-game/0.1 (one-time data fetch)"},
        timeout=300,
    )
    r.raise_for_status()
    d = r.json()
    print(f"got {len(d['elements'])} elements")
    out.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
