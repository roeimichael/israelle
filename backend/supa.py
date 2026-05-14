"""Thin Supabase REST + Auth wrapper. All writes via service-level publishable
key; RLS policies enforce shape, backend enforces ownership."""
import os
import time

import httpx

URL = os.environ.get("SUPABASE_URL", "")
KEY = os.environ.get("SUPABASE_KEY", "")

# JWT verify is called per guess; cache the auth/v1/user round-trip for 60s
# to keep latency low (LRU-style, but tiny).
_JWT_CACHE: dict[str, tuple[float, str | None]] = {}
_JWT_TTL = 60.0

_client: httpx.Client | None = None


def _c() -> httpx.Client:
    global _client
    if _client is None:
        if not URL or not KEY:
            raise RuntimeError("SUPABASE_URL / SUPABASE_KEY env vars not set")
        _client = httpx.Client(
            base_url=URL,
            headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
            timeout=30,
        )
    return _client


def rpc(name: str, params: dict):
    r = _c().post(f"/rest/v1/rpc/{name}", json=params)
    r.raise_for_status()
    return r.json()


def _auth_header(jwt: str | None) -> dict:
    """When acting on behalf of a signed-in user, forward their JWT so RLS
    sees auth.uid() = their id. Otherwise we stay on the publishable/anon key."""
    return {"Authorization": f"Bearer {jwt}"} if jwt else {}


def insert(table: str, row: dict | list[dict], prefer: str = "return=representation", jwt: str | None = None):
    headers = {"Prefer": prefer, **_auth_header(jwt)}
    r = _c().post(f"/rest/v1/{table}", json=row, headers=headers)
    r.raise_for_status()
    return r.json() if r.text else None


def upsert(table: str, row: dict, on_conflict: str, prefer: str = "return=representation", jwt: str | None = None):
    headers = {"Prefer": f"resolution=merge-duplicates,{prefer}", **_auth_header(jwt)}
    r = _c().post(
        f"/rest/v1/{table}",
        json=row,
        headers=headers,
        params={"on_conflict": on_conflict},
    )
    r.raise_for_status()
    return r.json()


def select(table: str, **params):
    r = _c().get(f"/rest/v1/{table}", params=params)
    r.raise_for_status()
    return r.json()


def update(table: str, filters: dict, patch: dict, jwt: str | None = None):
    r = _c().patch(f"/rest/v1/{table}", params=filters, json=patch, headers=_auth_header(jwt))
    r.raise_for_status()
    return r.json() if r.text else None


def verify_jwt(jwt: str) -> str | None:
    """Return auth.users.id if JWT valid, else None. Cached 60s per token."""
    if not jwt:
        return None
    now = time.time()
    hit = _JWT_CACHE.get(jwt)
    if hit and hit[0] > now:
        return hit[1]
    r = httpx.get(
        f"{URL}/auth/v1/user",
        headers={"apikey": KEY, "Authorization": f"Bearer {jwt}"},
        timeout=10,
    )
    uid = r.json().get("id") if r.status_code == 200 else None
    _JWT_CACHE[jwt] = (now + _JWT_TTL, uid)
    # Prune occasionally to bound memory; cheap O(n) under our load.
    if len(_JWT_CACHE) > 256:
        for k in [k for k, (exp, _) in _JWT_CACHE.items() if exp < now]:
            _JWT_CACHE.pop(k, None)
    return uid
