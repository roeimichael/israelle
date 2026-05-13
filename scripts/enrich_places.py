"""One-shot: add description + image_url columns to data/places.csv.

For each place with a Wikidata Q-id:
  1. Resolve hewiki/enwiki page titles via wbgetentities (batched).
  2. Hit Wikipedia REST 'summary' (he first, en fallback) to get extract + thumbnail.

Persistent on-disk caches so a partial run can be resumed without re-hitting
Wikidata. Retry-with-backoff on 429s.
"""
import csv
import json
import time
import urllib.parse
from pathlib import Path

import httpx

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "places.csv"
CACHE_DIR = ROOT / "data" / "raw"
TITLES_CACHE = CACHE_DIR / "wd_titles_cache.json"
SUMMARIES_CACHE = CACHE_DIR / "wp_summaries_cache.json"

UA = "israelle-game/0.1 (one-time enrichment; contact: github.com/roei-michael/israelle)"
WD_API = "https://www.wikidata.org/w/api.php"
HE_SUMMARY = "https://he.wikipedia.org/api/rest_v1/page/summary/{}"
EN_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"

BATCH = 25                  # smaller batches → friendlier to Wikidata
INTER_BATCH_SLEEP = 0.6     # base delay between wikidata batches
INTER_SUMMARY_SLEEP = 0.15  # base delay between summary fetches (unused with batched path)

HE_API = "https://he.wikipedia.org/w/api.php"
EN_API = "https://en.wikipedia.org/w/api.php"
TITLES_BATCH = 20           # MediaWiki extracts API silently drops past 20 per request


def _load_cache(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def _save_cache(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def get_titles_batch(qids: list[str]) -> dict[str, dict]:
    for attempt in range(6):
        try:
            r = httpx.get(WD_API, params={
                "action": "wbgetentities", "ids": "|".join(qids),
                "props": "sitelinks", "format": "json",
                "sitefilter": "hewiki|enwiki",
            }, headers={"User-Agent": UA}, timeout=30)
            r.raise_for_status()
            break
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (429, 502, 503, 504):
                wait = (2 ** attempt) * 3
                print(f"    {e.response.status_code}; sleep {wait}s")
                time.sleep(wait)
                continue
            raise
    else:
        return {}
    out: dict[str, dict] = {}
    for qid, entity in r.json().get("entities", {}).items():
        sl = entity.get("sitelinks", {})
        out[qid] = {
            "he": sl.get("hewiki", {}).get("title", ""),
            "en": sl.get("enwiki", {}).get("title", ""),
        }
    return out


def get_summaries_batch(lang: str, titles: list[str]) -> dict[str, dict]:
    """Returns {title: {'extract': str, 'thumb': str}} via MediaWiki query API."""
    if not titles:
        return {}
    api = HE_API if lang == "he" else EN_API
    for attempt in range(5):
        try:
            r = httpx.get(api, params={
                "action": "query",
                "format": "json",
                "redirects": 1,
                "titles": "|".join(titles),
                "prop": "extracts|pageimages",
                "exintro": 1,
                "explaintext": 1,
                "exchars": 280,
                "exlimit": "max",
                "piprop": "thumbnail",
                "pithumbsize": 400,
                "pilimit": "max",
            }, headers={"User-Agent": UA}, timeout=30)
            if r.status_code == 429:
                time.sleep((2 ** attempt) * 2)
                continue
            r.raise_for_status()
            break
        except httpx.HTTPError:
            time.sleep((2 ** attempt) * 2)
            continue
    else:
        return {}
    out: dict[str, dict] = {}
    data = r.json().get("query", {})
    # normalized: requested name → resolved name (e.g. spaces, normalization)
    norm_map: dict[str, str] = {}
    for n in data.get("normalized", []):
        norm_map[n.get("to")] = n.get("from")
    for r_ in data.get("redirects", []):
        norm_map[r_.get("to")] = norm_map.get(r_.get("from"), r_.get("from"))
    for pg in data.get("pages", {}).values():
        if "missing" in pg:
            continue
        title = pg.get("title", "")
        # map back to the originally requested title
        original = norm_map.get(title, title)
        out[original] = {
            "extract": (pg.get("extract") or "").strip(),
            "thumb": (pg.get("thumbnail") or {}).get("source", ""),
        }
    return out


def main():
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8")))
    qid_rows = [r for r in rows if r.get("wikidata")]
    print(f"{len(rows)} places, {len(qid_rows)} with wikidata")

    titles_cache: dict = _load_cache(TITLES_CACHE)
    summaries_cache: dict = _load_cache(SUMMARIES_CACHE)
    print(f"cache: {len(titles_cache)} titles, {len(summaries_cache)} summaries")

    # 1) titles (batched, with cache + backoff)
    todo = [r["wikidata"] for r in qid_rows if r["wikidata"] not in titles_cache]
    print(f"need titles for {len(todo)} qids")
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        got = get_titles_batch(batch)
        titles_cache.update(got)
        # record empty for any qid that returned no data, so we don't retry forever
        for q in batch:
            titles_cache.setdefault(q, {"he": "", "en": ""})
        if i % (BATCH * 5) == 0:
            _save_cache(TITLES_CACHE, titles_cache)
        print(f"  titles {min(i + BATCH, len(todo))}/{len(todo)}")
        time.sleep(INTER_BATCH_SLEEP)
    _save_cache(TITLES_CACHE, titles_cache)

    # 2) summaries — batched per lang.
    # Build {qid: {lang: title}} for places that don't have full cached summary yet.
    pending = [r for r in qid_rows if r["wikidata"] not in summaries_cache or
               not (summaries_cache[r["wikidata"]].get("extract") and summaries_cache[r["wikidata"]].get("thumb"))]
    print(f"need summaries for {len(pending)} places")

    for lang in ("he", "en"):
        # group by lang title
        title_to_qid: dict[str, str] = {}
        for r in pending:
            qid = r["wikidata"]
            t = (titles_cache.get(qid) or {}).get(lang, "")
            if not t:
                continue
            # only call if this lang+qid still needs something
            cur = summaries_cache.get(qid, {})
            if cur.get("extract") and cur.get("thumb"):
                continue
            title_to_qid[t] = qid
        ts = list(title_to_qid.keys())
        print(f"  {lang}: {len(ts)} titles to fetch in batches of {TITLES_BATCH}")
        for i in range(0, len(ts), TITLES_BATCH):
            batch = ts[i:i + TITLES_BATCH]
            got = get_summaries_batch(lang, batch)
            for title, data in got.items():
                qid = title_to_qid.get(title)
                if not qid:
                    continue
                cur = summaries_cache.get(qid, {"extract": "", "thumb": ""})
                if not cur.get("extract") and data["extract"]:
                    cur["extract"] = data["extract"][:280]
                if not cur.get("thumb") and data["thumb"]:
                    cur["thumb"] = data["thumb"]
                summaries_cache[qid] = cur
            if (i // TITLES_BATCH) % 5 == 0:
                _save_cache(SUMMARIES_CACHE, summaries_cache)
            print(f"    {lang} {min(i + TITLES_BATCH, len(ts))}/{len(ts)}")
            time.sleep(0.4)
        _save_cache(SUMMARIES_CACHE, summaries_cache)

    # 3) Direct-by-name fallback on Hebrew Wikipedia.
    # Runs even when qid path produced *something* — the qid path sometimes
    # caches English content (when wikidata only knew the enwiki sitelink), and
    # the user wants Hebrew. We re-query by name_he so the description is
    # actually in Hebrew when a Hebrew article exists.
    by_name_cache: dict = _load_cache(CACHE_DIR / "wp_by_name_cache.json")

    def _is_hebrew(s: str) -> bool:
        return any("֐" <= c <= "׿" for c in (s or "")[:30])

    def needs_more(qid: str, name_he: str) -> bool:
        # Skip only when both name-cache description is already Hebrew + we have an image.
        nc = by_name_cache.get(name_he, {})
        if _is_hebrew(nc.get("extract", "")) and nc.get("thumb"):
            return False
        return True

    missing_names = []
    seen_names: set[str] = set()
    for r in rows:
        nh = r.get("name_he", "").strip()
        if not nh or nh in seen_names:
            continue
        seen_names.add(nh)
        qid = r.get("wikidata", "")
        if needs_more(qid, nh):
            missing_names.append(nh)
    print(f"name-based fallback: {len(missing_names)} titles to try")
    for i in range(0, len(missing_names), TITLES_BATCH):
        batch = missing_names[i:i + TITLES_BATCH]
        got = get_summaries_batch("he", batch)
        for title, data in got.items():
            # title from API after redirect — also store under the original we queried
            for orig in batch:
                if orig == title or orig.replace(" ", "_") == title.replace(" ", "_"):
                    cur = by_name_cache.get(orig, {"extract": "", "thumb": ""})
                    if not cur.get("extract") and data["extract"]:
                        cur["extract"] = data["extract"][:280]
                    if not cur.get("thumb") and data["thumb"]:
                        cur["thumb"] = data["thumb"]
                    by_name_cache[orig] = cur
                    break
            else:
                # API-resolved title that didn't match a literal request title (redirect target)
                by_name_cache[title] = {
                    "extract": (data.get("extract") or "")[:280],
                    "thumb": data.get("thumb", ""),
                }
        if (i // TITLES_BATCH) % 5 == 0:
            _save_cache(CACHE_DIR / "wp_by_name_cache.json", by_name_cache)
        print(f"    name {min(i + TITLES_BATCH, len(missing_names))}/{len(missing_names)}")
        time.sleep(0.4)
    _save_cache(CACHE_DIR / "wp_by_name_cache.json", by_name_cache)

    # Apply: prefer name-cache (Hebrew via he.wiki) for description; fall back
    # to qid-cache (which may be English). For image, take whichever has one.
    n_desc = n_img = 0
    for row in rows:
        row["description"] = ""
        row["image_url"] = ""
        qid = row.get("wikidata", "")
        nh = row.get("name_he", "").strip()
        name_c = by_name_cache.get(nh, {})
        qid_c = summaries_cache.get(qid, {}) if qid else {}
        # Description: prefer Hebrew name-cache extract
        if _is_hebrew(name_c.get("extract", "")):
            row["description"] = name_c["extract"]
        elif _is_hebrew(qid_c.get("extract", "")):
            row["description"] = qid_c["extract"]
        else:
            row["description"] = name_c.get("extract") or qid_c.get("extract", "")
        # Image: either source
        row["image_url"] = name_c.get("thumb") or qid_c.get("thumb", "")
        if row["description"]:
            n_desc += 1
        if row["image_url"]:
            n_img += 1

    fieldnames = ["id", "name_en", "name_he", "type", "lat", "lon",
                  "importance", "wikidata", "description", "image_url"]
    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"DONE: {n_desc} with description, {n_img} with image")


if __name__ == "__main__":
    main()
