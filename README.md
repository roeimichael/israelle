# Israelle

Wordle-style geography game for Israel. Map full-screen, popup asks "Where is X?", click → distance-based score. 5 rounds per game. Inspired by [maptap.gg](https://maptap.gg) but scoped to Israel only — cities, kibbutzim, mountains, archaeological sites, museums, monuments, nature reserves.

## Stack
- **Backend**: Python 3.10 + FastAPI + uvicorn
- **Frontend**: vanilla HTML/JS + MapLibre GL JS
- **Data**: OpenStreetMap via Overpass API (one-time fetch → `data/places.csv`, ~4k places)

## Setup

```bash
python -m venv .venv
.venv/Scripts/activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp .env.example .env             # add your MapTiler key (free at maptiler.com)
```

## Run

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8123 --reload
```

Open http://127.0.0.1:8123 — without a MapTiler key the demo basemap is used (works but ugly).

## Share with friends (Cloudflared tunnel)

```bash
cloudflared tunnel --url http://127.0.0.1:8123
```

Prints a public `*.trycloudflare.com` URL. Send to friends, no signup needed.

## Rebuild place data

Already-built `data/places.csv` ships in the repo. To refresh:

```bash
python scripts/fetch_overpass.py   # ~30s, writes data/raw/overpass.json
python scripts/build_places.py     # writes data/places.csv
```

## Layout

```
backend/   FastAPI app, scoring, session state, CSV loader
frontend/  index.html, app.js, style.css
scripts/   one-time data fetch + merge
data/      places.csv (committed)
```

## API

- `POST /api/game/new` → `{game_id, rounds: [5 ids]}`
- `GET /api/round/{id}` → `{name_en, name_he, type}` (no coords)
- `POST /api/round/{id}/guess` body `{game_id, lat, lon}` → `{distance_km, score, true_lat, true_lon, round_number, total_score, done}`

## Scoring

`score = round(max(0, 100 * (1 - distance_km / 470)))`, distance < 1 km → flat 100. 470 km ≈ Israel N–S diagonal.
