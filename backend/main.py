import json
from datetime import date, datetime
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
# Day #1 of IsraelE. All future "puzzle numbers" are (today - EPOCH).days + 1.
EPOCH = date(2026, 5, 12)


def _il_today_iso() -> str:
    return datetime.now(IL_TZ).date().isoformat()


def _day_number(d_iso: str) -> int:
    return (date.fromisoformat(d_iso) - EPOCH).days + 1


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
    d = _il_today_iso()
    place_ids = supa.rpc("pick_or_create_daily", {"p_date": d})
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
    return {"date": d, "day_number": _day_number(d), "rounds": rounds}


@app.get("/api/me/today")
def me_today(request: Request):
    """Canonical 'have I played today?' lookup by Google identity.
    Cross-references all player rows linked to auth_user_id, returning the
    one with today's game (if any) so the client can rebind localStorage."""
    jwt = _jwt(request)
    auth_user_id = supa.verify_jwt(jwt) if jwt else None
    if not auth_user_id:
        raise HTTPException(401, "sign in required")
    d = _il_today_iso()
    players = supa.select("players", select="id,name", auth_user_id=f"eq.{auth_user_id}")
    if not players:
        return {"player_id": None, "name": None, "done": False, "guesses": [], "total_score": 0}
    ids = ",".join(p["id"] for p in players)
    games = supa.select(
        "games",
        select="id,player_id,total_score,completed_at",
        player_id=f"in.({ids})",
        puzzle_date=f"eq.{d}",
    )
    if not games:
        return {"player_id": players[0]["id"], "name": players[0]["name"],
                "done": False, "guesses": [], "total_score": 0}
    g = games[0]
    guesses = supa.select(
        "guesses",
        select="round_idx,place_id,distance_km,base_score,round_score,guess_lat,guess_lon",
        game_id=f"eq.{g['id']}",
        order="round_idx.asc",
    )
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
            gs["description"] = p.get("description", "")
            gs["image_url"] = p.get("image_url", "")
    owner = next((pl for pl in players if pl["id"] == g["player_id"]), players[0])
    return {
        "player_id": g["player_id"],
        "name": owner["name"],
        "total_score": g["total_score"],
        "guesses": guesses,
        "done": len(guesses) >= 6,
    }


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
            gs["description"] = p.get("description", "")
            gs["image_url"] = p.get("image_url", "")
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

    # Resolve auth (optional). When signed in, forward the user's JWT so RLS
    # sees auth.uid() = their id; anon writes still go through the publishable key.
    jwt = _jwt(request)
    auth_user_id = supa.verify_jwt(jwt or "")
    user_jwt = jwt if auth_user_id else None

    # 1) Upsert player. Ignore-duplicates so the row exists, then patch name/auth.
    try:
        row = {"id": body.player_id, "name": body.name or "אנונימי"}
        if auth_user_id:
            row["auth_user_id"] = auth_user_id
        supa.insert(
            "players", row,
            prefer="return=minimal,resolution=ignore-duplicates",
            jwt=user_jwt,
        )
    except httpx.HTTPStatusError:
        pass
    patch = {}
    if body.name:
        patch["name"] = body.name
    if auth_user_id:
        patch["auth_user_id"] = auth_user_id
    if patch:
        supa.update("players", {"id": f"eq.{body.player_id}"}, patch, jwt=user_jwt)

    # 2) Upsert game row (one per player per day).
    game_row = supa.upsert(
        "games",
        {"player_id": body.player_id, "puzzle_date": date, "total_score": 0},
        on_conflict="player_id,puzzle_date",
        jwt=user_jwt,
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
            jwt=user_jwt,
        )
    except httpx.HTTPStatusError as e:
        if e.response is not None and "23505" in e.response.text:
            raise HTTPException(409, "round already played")
        raise

    # 4) Recompute total from rows (cheap; ≤6 rows).
    rows = supa.select("guesses", select="round_score", game_id=f"eq.{game_id}")
    total = sum(r["round_score"] for r in rows)
    supa.update("games", {"id": f"eq.{game_id}"}, {"total_score": total}, jwt=user_jwt)

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
        "description": p.get("description", ""),
        "image_url": p.get("image_url", ""),
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


@app.get("/api/me/stats")
def my_stats(player_id: str):
    """Returns games played, current streak, max streak, score histogram.
    Works anonymously (player_id from localStorage is enough)."""
    rows = supa.select(
        "games",
        select="puzzle_date,total_score",
        player_id=f"eq.{player_id}",
        order="puzzle_date.desc",
    )
    if not rows:
        return {"games_played": 0, "current_streak": 0, "max_streak": 0,
                "avg_score": 0, "best_score": 0, "histogram": [0]*5}

    dates = sorted({r["puzzle_date"] for r in rows}, reverse=True)
    scores = [r["total_score"] for r in rows]
    today_iso = _il_today_iso()
    # streaks
    from datetime import timedelta
    def streak_from(start_iso: str) -> int:
        cur = date.fromisoformat(start_iso)
        n = 0
        ds = set(date.fromisoformat(x) for x in dates)
        while cur in ds:
            n += 1
            cur -= timedelta(days=1)
        return n
    # current: start counting back from today (or yesterday if today not played)
    current = streak_from(today_iso)
    if current == 0:
        yest = (date.fromisoformat(today_iso) - timedelta(days=1)).isoformat()
        current = streak_from(yest)
    # max: longest consecutive run in dates set
    max_s = 0
    ds_set = set(date.fromisoformat(x) for x in dates)
    for d_ in ds_set:
        if (d_ - timedelta(days=1)) in ds_set:
            continue  # not a run start
        n = 0
        cur = d_
        while cur in ds_set:
            n += 1
            cur += timedelta(days=1)
        if n > max_s:
            max_s = n

    # 5-bucket histogram: 0-200, 200-400, 400-600, 600-800, 800-1000
    histogram = [0] * 5
    for s in scores:
        bucket = min(4, s // 200)
        histogram[bucket] += 1

    return {
        "games_played": len(rows),
        "current_streak": current,
        "max_streak": max_s,
        "avg_score": round(sum(scores) / len(scores)),
        "best_score": max(scores),
        "histogram": histogram,
    }


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


@app.middleware("http")
async def no_cache_static(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith(("/static/", "/")) and not request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
    return response


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html", headers={"Cache-Control": "no-cache, must-revalidate"})
