// ─── Constants ──────────────────────────────────────────────────────────────
const ISRAEL_CENTER = [34.95, 31.5];
const ISRAEL_CLICK_BBOX = { minLng: 34.0, maxLng: 35.95, minLat: 29.3, maxLat: 33.4 };
const PAN_BOUNDS = [[32.5, 27.5], [38.5, 34.8]];

const SAT_STYLE = {
  version: 8,
  sources: {
    esri_sat: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256, maxzoom: 19,
      attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "esri_sat", type: "raster", source: "esri_sat" }],
};

const TYPE_HE = {
  city: "עיר", village: "יישוב", mountain: "הר", ruins: "חורבה",
  viewpoint: "תצפית", "archaeological site": "אתר ארכיאולוגי",
  memorial: "אנדרטה", attraction: "אתר תיירות", museum: "מוזיאון",
  monument: "אנדרטה", battlefield: "שדה קרב", tomb: "קבר",
  castle: "טירה", fort: "מבצר", "nature reserve": "שמורת טבע",
  "theme park": "פארק שעשועים", "city gate": "שער עיר",
  "wayside shrine": "מקדש דרך", "christian site": "אתר נוצרי",
  "jewish site": "אתר יהודי", "druze site": "אתר דרוזי",
  "religious site": "אתר דתי",
};
const CATEGORY_HE = { city: "עיר", settlement: "יישוב", landmark: "אתר" };
const multClass = (m) => (m === 1 ? "m1" : m === 1.5 ? "m2" : "m3");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── State ──────────────────────────────────────────────────────────────────
let map;
let sb;            // supabase client
let session = null;
let playerId, playerName;

const state = {
  rounds: [],          // [{round_idx, name_he, type, category, multiplier}, ...]
  played: [],          // [{round_idx, round_score, ...}, ...] from server
  cursor: 0,
  totalScore: 0,
  date: "",
  awaitingClick: false,
  // map artifacts
  guessMarker: null, truthMarker: null, cometMarker: null,
  lineId: null, polyId: null,
};

// ─── Boot ───────────────────────────────────────────────────────────────────
async function init() {
  // load config + supabase
  const cfg = await fetch("/api/config").then((r) => r.json());
  if (cfg.supabase_url && cfg.supabase_key) {
    sb = window.supabase.createClient(cfg.supabase_url, cfg.supabase_key, {
      auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    });
    const { data } = await sb.auth.getSession();
    session = data.session;
    sb.auth.onAuthStateChange((_evt, s) => { session = s; renderUserChip(); });
  }
  renderUserChip();

  // anonymous identity (persists per-browser even when signed in)
  playerId = localStorage.getItem("israelle_player_id");
  if (!playerId) {
    playerId = (crypto.randomUUID ? crypto.randomUUID() : ("p_" + Math.random().toString(36).slice(2)));
    localStorage.setItem("israelle_player_id", playerId);
  }
  playerName = localStorage.getItem("israelle_player_name") || "";

  // map
  map = new maplibregl.Map({
    container: "map", style: SAT_STYLE, center: ISRAEL_CENTER,
    zoom: 7.3, minZoom: 6, maxZoom: 18,
    maxBounds: PAN_BOUNDS, dragRotate: false, pitchWithRotate: false,
  });
  map.on("click", onMapClick);
  map.on("load", addIsraelMask);

  // wire buttons
  document.getElementById("btn-start").onclick = onStart;
  document.getElementById("btn-next").onclick = onNext;
  document.getElementById("btn-signin").onclick = onSignIn;
  document.getElementById("btn-signout").onclick = onSignOut;
  document.getElementById("btn-history").onclick = openHistory;
  document.getElementById("btn-history-close").onclick = () => showCard("start-card");
  document.getElementById("btn-leaderboard").onclick = openLeaderboard;
  document.getElementById("btn-lb-close").onclick = () => showCard("end-card");
  document.getElementById("btn-share").onclick = onShare;
  document.getElementById("btn-name-save").onclick = onSaveName;

  startCountdown();
}

// ─── Auth UI ────────────────────────────────────────────────────────────────
function renderUserChip() {
  const chip = document.getElementById("user-chip");
  const signinArea = document.getElementById("signin-area");
  if (session) {
    chip.classList.remove("hidden");
    document.getElementById("user-name").textContent =
      session.user.user_metadata?.full_name || session.user.email || "";
    signinArea?.classList.add("hidden");
  } else {
    chip.classList.add("hidden");
    signinArea?.classList.remove("hidden");
  }
}

async function onSignIn() {
  if (!sb) { flashToast("חיבור Supabase לא הוגדר"); return; }
  await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.origin },
  });
}

async function onSignOut() {
  if (!sb) return;
  await sb.auth.signOut();
}

// ─── Israel mask + border ───────────────────────────────────────────────────
async function addIsraelMask() {
  const border = await fetch("/api/israel-border").then((r) => r.json());
  const polys = border.geometry.type === "Polygon"
    ? [border.geometry.coordinates[0]]
    : border.geometry.coordinates.map((p) => p[0]);
  const worldRing = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
  map.addSource("il-mask", { type: "geojson",
    data: { type: "Feature", geometry: { type: "Polygon", coordinates: [worldRing, ...polys] } } });
  map.addLayer({ id: "il-mask-fill", type: "fill", source: "il-mask",
    paint: { "fill-color": "#0a1424", "fill-opacity": 0.95 } });
  map.addSource("il-border", { type: "geojson", data: border });
  map.addLayer({ id: "il-border-glow", type: "line", source: "il-border",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#4d7df0", "line-width": 6, "line-opacity": 0.25, "line-blur": 3 } });
  map.addLayer({ id: "il-border-line", type: "line", source: "il-border",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 2.4, "line-opacity": 0.85, "line-blur": 0.3 } });
}

// ─── Game flow ──────────────────────────────────────────────────────────────
async function onStart() {
  if (!playerName) {
    showCard("name-card");
    document.getElementById("name-input").value = "";
    setTimeout(() => document.getElementById("name-input").focus(), 50);
    return;
  }
  await beginDay();
}

async function onSaveName() {
  const v = document.getElementById("name-input").value.trim();
  if (!v) { document.getElementById("name-input").focus(); return; }
  playerName = v.slice(0, 20);
  localStorage.setItem("israelle_player_name", playerName);
  await beginDay();
}

async function beginDay() {
  // fetch today's puzzle + my progress
  const [today, me] = await Promise.all([
    fetch("/api/today").then((r) => r.json()),
    fetch(`/api/today/me?player_id=${encodeURIComponent(playerId)}`).then((r) => r.json()),
  ]);
  state.date = today.date;
  state.rounds = today.rounds;
  state.played = me.guesses || [];
  state.totalScore = me.total_score || 0;
  state.cursor = state.played.length;

  if (me.done) {
    showEnd(/*restored*/ true);
    return;
  }
  showCard(null);
  await loadRound();
}

async function loadRound() {
  const r = state.rounds[state.cursor];
  document.getElementById("place-name-he").textContent = r.name_he;
  document.getElementById("place-type").textContent =
    `${TYPE_HE[r.type] || r.type} · ${CATEGORY_HE[r.category] || r.category}`;
  document.getElementById("round-num").textContent = `סבב ${state.cursor + 1} / 6`;
  const multEl = document.getElementById("round-mult");
  multEl.textContent = `×${r.multiplier}`;
  multEl.className = `mult ${multClass(r.multiplier)}`;
  document.getElementById("round-score").textContent = `ניקוד: ${state.totalScore}`;
  document.getElementById("hud").classList.remove("hidden");
  state.awaitingClick = true;
}

// ─── Click handler ──────────────────────────────────────────────────────────
function insideIsrael(lng, lat) {
  return lng >= ISRAEL_CLICK_BBOX.minLng && lng <= ISRAEL_CLICK_BBOX.maxLng
      && lat >= ISRAEL_CLICK_BBOX.minLat && lat <= ISRAEL_CLICK_BBOX.maxLat;
}

async function onMapClick(e) {
  if (!state.awaitingClick) return;
  const { lng, lat } = e.lngLat;
  if (!insideIsrael(lng, lat)) {
    flashToast("לחצו בתוך ישראל");
    return;
  }
  state.awaitingClick = false;

  state.guessMarker = new maplibregl.Marker({ element: makeDot("guess") })
    .setLngLat([lng, lat]).addTo(map);

  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

  const res = await fetch("/api/today/guess", {
    method: "POST",
    headers,
    body: JSON.stringify({
      player_id: playerId,
      name: playerName,
      round_idx: state.cursor,
      lat, lon: lng,
    }),
  }).then((r) => r.json());

  if (res.detail) { flashToast(res.detail); return; }

  state.totalScore = res.total_score;
  state.played.push({ ...res, name_he: state.rounds[state.cursor].name_he });

  const truthLngLat = [res.true_lon, res.true_lat];
  drawPolygon(res.polygon);
  state.truthMarker = new maplibregl.Marker({ element: makeDot("truth") })
    .setLngLat(truthLngLat).addTo(map);

  const bbox = polygonBbox(res.polygon) ?? [
    [Math.min(lng, res.true_lon), Math.min(lat, res.true_lat)],
    [Math.max(lng, res.true_lon), Math.max(lat, res.true_lat)],
  ];
  bbox[0][0] = Math.min(bbox[0][0], lng);
  bbox[0][1] = Math.min(bbox[0][1], lat);
  bbox[1][0] = Math.max(bbox[1][0], lng);
  bbox[1][1] = Math.max(bbox[1][1], lat);
  map.fitBounds(bbox, { padding: 160, duration: 1200 });

  await animateLine([lng, lat], truthLngLat, 3000);

  showReveal(res);
}

// ─── Marker helpers (unchanged from previous) ───────────────────────────────
function makeDot(cls) {
  const wrap = document.createElement("div");
  wrap.className = "marker-wrap";
  wrap.innerHTML = `<div class="marker-pulse ${cls}"></div><div class="marker-dot ${cls}"></div>`;
  return wrap;
}

function polygonBbox(geom) {
  if (!geom) return null;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return [[minX, minY], [maxX, maxY]];
}

function drawPolygon(geom) {
  state.polyId = "truth-polygon";
  if (map.getLayer(state.polyId + "-fill")) map.removeLayer(state.polyId + "-fill");
  if (map.getLayer(state.polyId + "-line")) map.removeLayer(state.polyId + "-line");
  if (map.getSource(state.polyId)) map.removeSource(state.polyId);
  if (!geom) return;
  map.addSource(state.polyId, { type: "geojson",
    data: { type: "Feature", geometry: geom, properties: {} } });
  map.addLayer({ id: state.polyId + "-fill", type: "fill", source: state.polyId,
    paint: { "fill-color": "#4d7df0", "fill-opacity": 0.22 } });
  map.addLayer({ id: state.polyId + "-line", type: "line", source: state.polyId,
    paint: { "line-color": "#4d7df0", "line-width": 2.5, "line-opacity": 0.95, "line-blur": 0.3 } });
}

function animateLine(from, to, durationMs) {
  state.lineId = "guess-line";
  if (map.getSource(state.lineId)) {
    map.removeLayer(state.lineId + "-glow");
    map.removeLayer(state.lineId);
    map.removeSource(state.lineId);
  }
  map.addSource(state.lineId, { type: "geojson",
    data: { type: "Feature", geometry: { type: "LineString", coordinates: [from, from] } } });
  map.addLayer({ id: state.lineId + "-glow", type: "line", source: state.lineId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#4d7df0", "line-width": 9, "line-opacity": 0.35, "line-blur": 3 } });
  map.addLayer({ id: state.lineId, type: "line", source: state.lineId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 3, "line-dasharray": [1.5, 1.8], "line-opacity": 0.95 } });

  const wrap = document.createElement("div"); wrap.className = "marker-wrap";
  const headEl = document.createElement("div"); headEl.className = "comet-head";
  wrap.appendChild(headEl);
  state.cometMarker = new maplibregl.Marker({ element: wrap }).setLngLat(from).addTo(map);

  const src = map.getSource(state.lineId);
  const start = performance.now();
  const ease = (t) => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2);
  return new Promise((resolve) => {
    function step(t) {
      const u = Math.min(1, (t - start) / durationMs);
      const k = ease(u);
      const lng = from[0] + (to[0] - from[0]) * k;
      const lat = from[1] + (to[1] - from[1]) * k;
      src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [from, [lng, lat]] } });
      state.cometMarker.setLngLat([lng, lat]);
      if (u < 1) requestAnimationFrame(step);
      else {
        headEl.classList.add("fading");
        setTimeout(() => { state.cometMarker?.remove(); state.cometMarker = null; }, 400);
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// ─── Reveal / Next / End ────────────────────────────────────────────────────
function showReveal(res) {
  document.getElementById("hud").classList.add("hidden");
  document.getElementById("reveal-score").textContent = `+${res.round_score}`;
  document.getElementById("reveal-breakdown").textContent =
    `${res.base_score} × ${res.multiplier}`;
  document.getElementById("reveal-place").textContent =
    state.rounds[state.cursor].name_he;
  document.getElementById("reveal-dist").textContent = `${res.distance_km} ק״מ ממך`;
  document.getElementById("btn-next").textContent = res.is_last ? "סיכום" : "הבא ←";
  clearPolygon();
  showCard("reveal-card", true);
  state._lastWasFinal = res.is_last;
}

function onNext() {
  clearMarkers();
  if (state._lastWasFinal) {
    showEnd(false);
  } else {
    state.cursor++;
    showCard(null);
    loadRound();
    map.flyTo({ center: ISRAEL_CENTER, zoom: 7.3, duration: 800 });
  }
}

function showEnd(restored) {
  document.getElementById("final-score").textContent = state.totalScore;
  document.getElementById("emoji-strip").textContent = emojiStrip(state.played);
  showCard("end-card");
}

// ─── Share / leaderboard / history ──────────────────────────────────────────
function emojiStrip(played) {
  // bucket pct of max possible (= base 100 × multiplier) per round
  return played
    .sort((a, b) => a.round_idx - b.round_idx)
    .map((g) => {
      const max = 100 * (g.multiplier || state.rounds[g.round_idx]?.multiplier || 1);
      const pct = g.round_score / max;
      if (pct >= 0.9) return "🟩";
      if (pct >= 0.75) return "🟢";
      if (pct >= 0.5) return "🟡";
      if (pct >= 0.25) return "🟠";
      return "🔴";
    })
    .join("");
}

async function onShare() {
  const txt = `IsraelE ${state.date}\n${state.totalScore}/1000\n${emojiStrip(state.played)}\n${location.origin}`;
  try {
    await navigator.clipboard.writeText(txt);
    flashToast("הועתק ללוח", "ok");
  } catch {
    flashToast("העתקה נכשלה");
  }
}

async function openLeaderboard() {
  const lb = await fetch(`/api/leaderboard?date=${state.date}`).then((r) => r.json());
  const list = document.getElementById("lb-list");
  list.innerHTML = lb.top.length
    ? lb.top.map((row, i) => `<div class="lb-row"><span>#${i + 1}</span><span>${escapeHtml(row.name)}</span><b>${row.score}</b></div>`).join("")
    : "<p>אין עדיין תוצאות.</p>";
  showCard("lb-card");
}

async function openHistory() {
  if (!session) { flashToast("התחברו כדי לראות היסטוריה"); return; }
  const h = await fetch("/api/me/history", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).then((r) => r.json());
  const list = document.getElementById("history-list");
  list.innerHTML = h.games && h.games.length
    ? h.games.map((g) => `<div class="hist-row"><span>${g.puzzle_date}</span><b>${g.total_score}</b></div>`).join("")
    : "<p>עדיין לא שיחקתם.</p>";
  showCard("history-card");
}

// ─── UI utils ───────────────────────────────────────────────────────────────
function clearMarkers() {
  state.guessMarker?.remove(); state.guessMarker = null;
  state.truthMarker?.remove(); state.truthMarker = null;
  state.cometMarker?.remove(); state.cometMarker = null;
  if (state.lineId && map.getSource(state.lineId)) {
    if (map.getLayer(state.lineId + "-glow")) map.removeLayer(state.lineId + "-glow");
    if (map.getLayer(state.lineId)) map.removeLayer(state.lineId);
    map.removeSource(state.lineId);
  }
  state.lineId = null;
  clearPolygon();
}

function clearPolygon() {
  if (!state.polyId) return;
  if (map.getLayer(state.polyId + "-fill")) map.removeLayer(state.polyId + "-fill");
  if (map.getLayer(state.polyId + "-line")) map.removeLayer(state.polyId + "-line");
  if (map.getSource(state.polyId)) map.removeSource(state.polyId);
  state.polyId = null;
}

function showCard(cardId, passThrough = false) {
  const overlay = document.getElementById("overlay");
  for (const c of overlay.querySelectorAll(".card")) c.classList.add("hidden");
  if (cardId) {
    document.getElementById(cardId).classList.remove("hidden");
    overlay.classList.toggle("pass-through", passThrough);
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function flashToast(msg, kind = "err") {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.dataset.kind = kind;
  t.classList.add("show");
  clearTimeout(flashToast._h);
  flashToast._h = setTimeout(() => t.classList.remove("show"), 1700);
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function startCountdown() {
  setInterval(() => {
    const now = new Date();
    const il = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
    const next = new Date(il);
    next.setHours(24, 0, 0, 0);
    let s = Math.max(0, Math.floor((next - il) / 1000));
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    s -= h * 3600;
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s - m * 60).padStart(2, "0");
    const txt = `${h}:${m}:${ss}`;
    for (const id of ["cd", "cd2"]) {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    }
  }, 1000);
}

init();
