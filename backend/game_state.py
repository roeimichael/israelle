import uuid

_GAMES: dict[str, dict] = {}


def create(round_ids: list[int]) -> str:
    gid = uuid.uuid4().hex[:12]
    _GAMES[gid] = {"rounds": round_ids, "played": {}, "total": 0}
    return gid


def get(game_id: str) -> dict | None:
    return _GAMES.get(game_id)


def record_guess(game_id: str, round_id: int, score: int) -> tuple[int, int, bool]:
    """Returns (round_number_1_indexed, total_score, done)."""
    g = _GAMES[game_id]
    g["played"][round_id] = score
    g["total"] += score
    played_n = len(g["played"])
    return played_n, g["total"], played_n >= len(g["rounds"])
