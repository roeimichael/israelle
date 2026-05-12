import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import places, supa
from .scoring import base_score, haversine_km

app = FastAPI(title="israelle")

FRONTEND = Path(__file__).parent.parent / "frontend"
DOCS = Path(__file__).parent.parent / "docs"
DATA = Path(__file__).parent.parent / "data"

ISRAEL_BORDER = json.loads((DATA / "israel.geojson").read_text(encoding="utf-8"))

IL_TZ = ZoneInfo("Asia/Jerusalem")


def _il_today_iso() -> str:
    return datetime.now(IL_TZ).date().isoformat()


def _jwt(request: Request) -> str | None:
    h = request.headers.get("Authorization", "")
    return h[7:].strip() if h.startswith("Bearer ") else None


# ─── static + map data ───────────────────────────────────────────────────────


@app.get("/api/israel-border")
def israel_border():
    return ISRAEL_BORDER


# ─── daily puzzle ────────────────────────────────────────────────────────────


@app.get("/api/today")
def today():
    date = _il_today_iso()
    place_ids = supa.rpc("pick_or_create_daily", {"p_date": date})
    rounds = []
    for ix, pid in enumerate(place_ids):
        p = places.get(int(pid))
        if not p:
            raise HTTPException(500, f"missing place id {pid} in local CSV")
        rounds.append({
            "round_idx": ix,
            "name_he": p["name_he"],
            "type": p["type"],
            "category": p["category"],
            "multiplier": p["multiplier"],
        })
    return {"date": date, "rounds": rounds}


@app.get("/api/today/me")
def today_me(player_id: str):
    date = _il_today_iso()
    games = supa.select(
        "games",
        select="id,total_score,completed_at",
        player_id=f"eq.{player_id}",
        puzzle_date=f"eq.{date}",
    )
    if not games:
        return {"played_rounds": [], "total_score": 0, "done": False}
    g = games[0]
    guesses = supa.select(
        "guesses",
        select="round_idx,place_id,distance_km,base_score,round_score,guess_lat,guess_lon",
        game_id=f"eq.{g['id']}",
        order="round_idx.asc",
    )
    # enrich with hebrew name + true coords for reveal-rendering on resume
    for gs in guesses:
        p = places.get(int(gs["place_id"]))
        if p:
            gs["name_he"] = p["name_he"]
            gs["type"] = p["type"]
            gs["category"] = p["category"]
            gs["multiplier"] = p["multiplier"]
            gs["true_lat"] = p["lat"]
            gs["true_lon"] = p["lon"]
            gs["polygon"] = places.get_polygon(int(gs["place_id"]))
    return {
        "game_id": g["id"],
        "total_score": g["total_score"],
        "guesses": guesses,
        "done": len(guesses) >= 6,
    }


class GuessIn(BaseModel):
    player_id: str
    name: str | None = None
    round_idx: int
    lat: float
    lon: float


@app.post("/api/today/guess")
def today_guess(body: GuessIn, request: Request):
    if not (0 <= body.round_idx < 6):
        raise HTTPException(400, "bad round_idx")

    date = _il_today_iso()
    place_ids = supa.rpc("pick_or_create_daily", {"p_date": date})
    place_id = int(place_ids[body.round_idx])
    p = places.get(place_id)
    if not p:
        raise HTTPException(500, "place missing locally")

    dist = haversine_km(body.lat, body.lon, p["lat"], p["lon"])
    base = base_score(dist)
    round_score = round(base * p["multiplier"])

    # Resolve auth (optional)
    auth_user_id = supa.verify_jwt(_jwt(request) or "")

    # 1) Upsert player. Ignore-duplicates so the row exists, then patch name/auth.
    try:
        row = {"id": body.player_id, "name": body.name or "אנונימי"}
        if auth_user_id:
            row["auth_user_id"] = auth_user_id
        supa.insert("players", row, prefer="return=minimal,resolution=ignore-duplicates")
    except httpx.HTTPStatusError:
        pass
    patch = {}
    if body.name:
        patch["name"] = body.name
    if auth_user_id:
        patch["auth_user_id"] = auth_user_id
    if patch:
        supa.update("players", {"id": f"eq.{body.player_id}"}, patch)

    # 2) Upsert game row (one per player per day).
    game_row = supa.upsert(
        "games",
        {"player_id": body.player_id, "puzzle_date": date, "total_score": 0},
        on_conflict="player_id,puzzle_date",
    )
    game_id = game_row[0]["id"]

    # 3) Insert guess (idempotent on (game_id, round_idx)).
    try:
        supa.insert(
            "guesses",
            {
                "game_id": game_id,
                "round_idx": body.round_idx,
                "place_id": place_id,
                "guess_lat": body.lat,
                "guess_lon": body.lon,
                "distance_km": round(dist, 2),
                "base_score": base,
                "round_score": round_score,
            },
            prefer="return=minimal",
        )
    except httpx.HTTPStatusError as e:
        if e.response is not None and "23505" in e.response.text:
            raise HTTPException(409, "round already played")
        raise

    # 4) Recompute total from rows (cheap; ≤6 rows).
    rows = supa.select("guesses", select="round_score", game_id=f"eq.{game_id}")
    total = sum(r["round_score"] for r in rows)
    supa.update("games", {"id": f"eq.{game_id}"}, {"total_score": total})

    return {
        "distance_km": round(dist, 2),
        "base_score": base,
        "multiplier": p["multiplier"],
        "round_score": round_score,
        "total_score": total,
        "true_lat": p["lat"],
        "true_lon": p["lon"],
        "polygon": places.get_polygon(place_id),
        "round_idx": body.round_idx,
        "is_last": body.round_idx == 5,
        "game_id": game_id,
    }


# ─── history + leaderboard ───────────────────────────────────────────────────


@app.get("/api/me/history")
def history(request: Request):
    jwt = _jwt(request)
    auth_user_id = supa.verify_jwt(jwt) if jwt else None
    if not auth_user_id:
        raise HTTPException(401, "sign in to view history")
    players = supa.select("players", select="id,name", auth_user_id=f"eq.{auth_user_id}")
    if not players:
        return {"games": [], "player_name": None}
    ids = ",".join(p["id"] for p in players)
    games = supa.select(
        "games",
        select="id,puzzle_date,total_score,completed_at",
        player_id=f"in.({ids})",
        order="puzzle_date.desc",
        limit=60,
    )
    return {"games": games, "player_name": players[0]["name"]}


@app.get("/api/leaderboard")
def leaderboard(date: str | None = None):
    date = date or _il_today_iso()
    rows = supa.select(
        "games",
        select="total_score,completed_at,players(name)",
        puzzle_date=f"eq.{date}",
        order="total_score.desc",
        limit=20,
    )
    out = [
        {"name": r["players"]["name"] if r.get("players") else "אנונימי",
         "score": r["total_score"],
         "completed_at": r["completed_at"]}
        for r in rows
    ]
    return {"date": date, "top": out}


# ─── tiny endpoint so frontend can find supabase client params ───────────────


@app.get("/api/config")
def config():
    # Publishable key is safe in the browser by design.
    return {"supabase_url": supa.URL, "supabase_key": supa.KEY}


# ─── static mounts + index ───────────────────────────────────────────────────


app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")
app.mount("/docs", StaticFiles(directory=str(DOCS)), name="docs")


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")
