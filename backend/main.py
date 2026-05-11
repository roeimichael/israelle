import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import game_state, places
from .scoring import base_score, haversine_km

app = FastAPI(title="israelle")

FRONTEND = Path(__file__).parent.parent / "frontend"
DATA = Path(__file__).parent.parent / "data"

ISRAEL_BORDER = json.loads((DATA / "israel.geojson").read_text(encoding="utf-8"))


class GuessIn(BaseModel):
    game_id: str
    lat: float
    lon: float


@app.get("/api/israel-border")
def israel_border():
    return ISRAEL_BORDER


@app.post("/api/game/new")
def new_game():
    round_ids = places.sample_round_ids()
    gid = game_state.create(round_ids)
    return {"game_id": gid, "rounds": round_ids}


@app.get("/api/round/{round_id}")
def get_round(round_id: int):
    p = places.get(round_id)
    if not p:
        raise HTTPException(404, "unknown round")
    return {
        "name_en": p["name_en"], "name_he": p["name_he"], "type": p["type"],
        "category": p["category"], "multiplier": p["multiplier"],
    }


@app.post("/api/round/{round_id}/guess")
def post_guess(round_id: int, body: GuessIn):
    g = game_state.get(body.game_id)
    if not g:
        raise HTTPException(404, "unknown game")
    if round_id in g["played"]:
        raise HTTPException(400, "round already played")
    if round_id not in g["rounds"]:
        raise HTTPException(400, "round not in game")
    p = places.get(round_id)
    if not p:
        raise HTTPException(404, "unknown round")
    dist = haversine_km(body.lat, body.lon, p["lat"], p["lon"])
    base = base_score(dist)
    round_score = base * p["multiplier"]
    rn, total, done = game_state.record_guess(body.game_id, round_id, round_score)
    return {
        "distance_km": round(dist, 2),
        "base_score": base,
        "multiplier": p["multiplier"],
        "round_score": round_score,
        "true_lat": p["lat"],
        "true_lon": p["lon"],
        "polygon": places.get_polygon(round_id),
        "round_number": rn,
        "total_score": total,
        "done": done,
    }


DOCS = Path(__file__).parent.parent / "docs"

app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")
app.mount("/docs", StaticFiles(directory=str(DOCS)), name="docs")


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")
