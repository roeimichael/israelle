from math import asin, cos, radians, sin, sqrt

# Israel N-S diagonal (Metula → Eilat) ≈ 470 km. Used to normalize score.
MAX_DIST_KM = 470.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def score_from_distance(distance_km: float) -> int:
    if distance_km < 1.0:
        return 100
    raw = 100 * (1 - distance_km / MAX_DIST_KM)
    return max(0, round(raw))
