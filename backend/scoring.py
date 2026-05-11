from math import asin, cos, radians, sin, sqrt

# Distance at which base score hits 0. Tuned for game feel in Israel:
# 0 km → 100, 50 km → 64, 100 km → 36, 200 km → 4, 250+ km → 0.
ZERO_AT_KM = 250.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def base_score(distance_km: float) -> int:
    """Quadratic falloff in [0, 100]. Bullseye <1 km clamped to 100."""
    if distance_km < 1.0:
        return 100
    frac = max(0.0, 1 - distance_km / ZERO_AT_KM)
    return round(100 * frac * frac)
