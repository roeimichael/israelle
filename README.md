<div align="center">

# 🇮🇱 Israelle

**A Wordle-style geography game scoped to Israel.**
Click the satellite map where you think the named place is. Close → big score. Wrong end of the country → nothing.

![Python](https://img.shields.io/badge/python-3.10%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre%20GL-4.7-396CB1?logo=maplibre&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

<img src="docs/homepage.png" alt="Israelle gameplay" width="780" />

</div>

---

## How it works

- 5 rounds per game, random places drawn from ~3.3k Israeli locations
- Each round shows a place name in **English + Hebrew**; you click the satellite map
- Score per round = `base × multiplier` (max **300**); total max **1500**
- Inspired by [maptap.gg](https://maptap.gg), but the map is **just Israel** and the targets go beyond cities — kibbutzim, mountains, archaeological sites, museums, monuments, nature reserves…

### Scoring

Quadratic falloff — wrong-end-of-country guesses are basically worthless.

| Distance | Base | Notes |
|---:|---:|---|
| 0–1 km | **100** | bullseye |
| 10 km | 92 | close |
| 50 km | 64 | wrong neighborhood |
| 100 km | 36 | wrong region |
| 200 km | 4 | trivial |
| 250 km+ | **0** | giving up |

Multiplier depends on the target:

| Category | Multiplier | Examples |
|---|:-:|---|
| City | **1×** | Tel Aviv, Jerusalem, Haifa, Eilat |
| Settlement | **2×** | villages, kibbutzim, moshavim |
| Landmark | **3×** | mountains, museums, archaeological sites, monuments… |

## Quick start

```bash
git clone https://github.com/roeimichael/israelle
cd israelle
python -m venv .venv
.venv/Scripts/activate            # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt

uvicorn backend.main:app --host 127.0.0.1 --port 8123
```

Open **http://127.0.0.1:8123** → click *Play*.

### Share with friends — quick (your PC must stay on)

```bash
cloudflared tunnel --url http://127.0.0.1:8123
```

Public `*.trycloudflare.com` URL. No signup, no DNS, no cost. Dies when you close the terminal.

### Deploy permanently — free Render hosting

A `render.yaml` ships in the repo. To go live:

1. Sign up at [render.com](https://render.com) (free, GitHub login)
2. New → **Blueprint** → connect this repo
3. Render reads `render.yaml`, builds, deploys
4. You get `https://israelle.onrender.com` — share with anyone

Free tier sleeps after 15 min idle (~30 s cold start on first hit). 750 h/mo runtime. Every `git push` to `main` redeploys automatically.

## Tech

| Layer | Choice | Why |
|---|---|---|
| Basemap | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) | Free satellite tiles, deep zoom (z19), no API key, no labels |
| Map engine | [MapLibre GL JS](https://maplibre.org/) | Open-source, WebGL vector/raster rendering |
| Backend | FastAPI + uvicorn | Async, schema-validated, ships static assets too |
| Data | OpenStreetMap via [Overpass API](https://overpass-api.de) | One-shot fetch → committed CSV; no live deps |

## Repo layout

```
backend/        FastAPI app — routes, scoring, session state, CSV loader
frontend/       index.html, app.js, style.css (vanilla, no build step)
scripts/        one-time data ETL (Overpass fetch + merge)
data/           places.csv (committed, ~3.3k entries)
docs/           screenshots
```

## API

| Method | Path | Returns |
|---|---|---|
| `POST` | `/api/game/new` | `{game_id, rounds: [5 ids]}` |
| `GET`  | `/api/round/{id}` | `{name_en, name_he, type, category, multiplier}` |
| `POST` | `/api/round/{id}/guess` | `{distance_km, base_score, multiplier, round_score, true_lat, true_lon, round_number, total_score, done}` |

## Rebuilding the place data

The shipped `data/places.csv` is enough to play. To refresh it from current OSM:

```bash
python scripts/fetch_overpass.py    # ~30s, writes data/raw/overpass.json
python scripts/build_places.py      # cleans, merges, writes data/places.csv
```

## License

MIT — see [LICENSE](LICENSE).

Map data © OpenStreetMap contributors. Satellite imagery © Esri.
