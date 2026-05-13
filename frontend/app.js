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
let soundOn = true;
let audioCtx;

const state = {
  rounds: [],
  played: [],
  cursor: 0,
  totalScore: 0,
  date: "",
  dayNumber: 0,
  awaitingClick: false,
  guessMarker: null, truthMarker: null, cometMarker: null,
  lineId: null, polyId: null,
};

// Israel-themed score emojis (5 buckets, best → worst):
// flag, star of david, dove (peace), camel (desert grind), cactus (סבר/ouch)
const PALETTE = ["🇮🇱", "✡️", "🕊️", "🐪", "🌵"];

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
  soundOn = localStorage.getItem("israelle_sound") !== "off";
  applyToggleVisuals();

  // map
  map = new maplibregl.Map({
    container: "map", style: SAT_STYLE, center: ISRAEL_CENTER,
    zoom: 7.3, minZoom: 6, maxZoom: 18,
    maxBounds: PAN_BOUNDS,
    dragRotate: false, pitchWithRotate: false, touchPitch: false,
    clickTolerance: 6,             // generous tap-vs-drag threshold
    fadeDuration: 80,              // faster style transitions
  });
  map.touchZoomRotate?.disableRotation();
  map.on("click", onMapClick);
  map.on("load", addIsraelMask);
  // Fast tap feedback: drop a transient ripple at touch-start so the user
  // sees something the instant they tap, while the real click event resolves.
  const onPress = (e) => {
    if (!state.awaitingClick) return;
    const ll = e.lngLat;
    if (!ll) return;
    spawnRipple([ll.lng, ll.lat], "#ffffff", 1.8, 380, 1);
  };
  map.on("mousedown", onPress);
  map.on("touchstart", onPress);

  // wire buttons
  document.getElementById("btn-start").onclick = onStart;
  document.getElementById("btn-next").onclick = onNext;
  document.getElementById("btn-signin").onclick = onSignIn;
  document.getElementById("btn-signout").onclick = onSignOut;
  document.getElementById("btn-history").onclick = openHistory;
  document.getElementById("btn-history-close").onclick = closeModal;
  document.getElementById("btn-leaderboard").onclick = openLeaderboard;
  document.getElementById("btn-lb-close").onclick = closeModal;
  document.getElementById("btn-share").onclick = onShare;
  document.getElementById("btn-name-save").onclick = onSaveName;

  // toolbar
  document.getElementById("btn-help").onclick = () => openHowto(0, true);
  document.getElementById("btn-stats").onclick = openStats;
  document.getElementById("btn-stats-close").onclick = closeModal;
  document.getElementById("btn-sound").onclick = toggleSound;
  document.getElementById("btn-howto-next").onclick = () => moveHowto(+1);
  document.getElementById("btn-howto-prev").onclick = () => moveHowto(-1);
  document.getElementById("btn-howto-skip").onclick = skipHowto;

  startCountdown();
  const alreadyDone = await loadTodayIntoState();

  // render Lucide icons
  if (window.lucide?.createIcons) window.lucide.createIcons();

  if (alreadyDone) return; // end card already shown

  // first-visit howto
  if (!localStorage.getItem("israelle_seen_howto")) {
    openHowto(0);
  } else {
    animateCardIn("start-card");
  }
}

async function loadTodayIntoState() {
  try {
    const [t, me] = await Promise.all([
      fetchJSON("/api/today"),
      fetchJSON(`/api/today/me?player_id=${encodeURIComponent(playerId)}`),
    ]);
    state.dayNumber = t.day_number;
    state.date = t.date;
    state.rounds = t.rounds;
    const tag = document.getElementById("day-num-start");
    if (tag) tag.textContent = `#${t.day_number}`;
    if (me.done) {
      state.played = me.guesses || [];
      state.totalScore = me.total_score || 0;
      showEnd(true);
      return true;
    }
  } catch (e) {
    console.warn("today load failed", e);
  }
  return false;
}

function animateCardIn(cardId) {
  if (!window.anime) return;
  const card = document.getElementById(cardId);
  if (!card || card.classList.contains("hidden")) return;
  card.style.opacity = "0";
  card.style.transform = "translateY(18px) scale(0.96)";
  anime.animate(card, {
    opacity: 1,
    translateY: 0,
    scale: 1,
    duration: 520,
    ease: "outCubic",
  });
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
  showSpinner(true);
  try {
    const [today, me] = await Promise.all([
      fetchJSON("/api/today"),
      fetchJSON(`/api/today/me?player_id=${encodeURIComponent(playerId)}`),
    ]);
    state.date = today.date;
    state.dayNumber = today.day_number;
    state.rounds = today.rounds;
    state.played = me.guesses || [];
    state.totalScore = me.total_score || 0;
    state.cursor = state.played.length;
  } catch (e) {
    flashToast("נכשלה טעינת הפאזל. נסו שוב.");
    showSpinner(false);
    return;
  }
  showSpinner(false);

  if (state.played.length >= 6) {
    showEnd(true);
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
  document.getElementById("day-num").textContent = `#${state.dayNumber}`;
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
  chime(420);

  state.guessMarker = new maplibregl.Marker({ element: makeDot("guess") })
    .setLngLat([lng, lat]).addTo(map);
  popMarker(state.guessMarker);
  spawnRipple([lng, lat], "#ffb86b", 3.4, 1100, 2);

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
  // chime on a "good" guess (>=80% of max for this round's multiplier)
  const r = state.rounds[state.cursor];
  if (res.round_score / (100 * r.multiplier) >= 0.8) chime(1100);

  const truthLngLat = [res.true_lon, res.true_lat];
  drawPolygon(res.polygon);

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

  // Truth reveal: shockwave + bouncy pop
  spawnRipple(truthLngLat, "#4d7df0", 5.2, 1500, 3);
  state.truthMarker = new maplibregl.Marker({ element: makeDot("truth") })
    .setLngLat(truthLngLat).addTo(map);
  popMarker(state.truthMarker, true);
  chime(880);

  await sleep(450);
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
    paint: { "line-color": "#4d7df0", "line-width": 11, "line-opacity": 0.45, "line-blur": 4 } });
  map.addLayer({ id: state.lineId, type: "line", source: state.lineId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 3, "line-dasharray": [1.5, 1.8], "line-opacity": 0.95 } });

  const wrap = document.createElement("div"); wrap.className = "marker-wrap";
  const headEl = document.createElement("div"); headEl.className = "comet-head";
  wrap.appendChild(headEl);
  state.cometMarker = new maplibregl.Marker({ element: wrap }).setLngLat(from).addTo(map);

  // gentle continuous pulse on the comet head
  const pulse = anime.animate(headEl, {
    scale: 1.25,
    duration: 480,
    ease: "inOutSine",
    loop: true,
    alternate: true,
  });

  const src = map.getSource(state.lineId);
  const obj = { t: 0 };
  return new Promise((resolve) => {
    anime.animate(obj, {
      t: 1, duration: durationMs, ease: "inOutQuint",
      onUpdate: () => {
        const k = obj.t;
        const lng = from[0] + (to[0] - from[0]) * k;
        const lat = from[1] + (to[1] - from[1]) * k;
        src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [from, [lng, lat]] } });
        state.cometMarker.setLngLat([lng, lat]);
      },
      onComplete: () => {
        pulse.pause?.();
        anime.animate(headEl, {
          scale: 2.4,
          opacity: 0,
          duration: 380,
          ease: "outQuad",
          onComplete: () => { state.cometMarker?.remove(); state.cometMarker = null; },
        });
        resolve();
      },
    });
  });
}

// ─── Anime.js-driven helpers ────────────────────────────────────────────────
function popMarker(marker, big = false) {
  const el = marker.getElement().querySelector(".marker-dot");
  if (!el) return;
  // Set starting state inline so anime reads it; fallback is visible at scale 1.
  el.style.transform = "scale(0)";
  if (!window.anime) { el.style.transform = "scale(1)"; return; }
  anime.animate(el, {
    scale: 1,
    duration: 720,
    ease: big ? "outBack(2.4)" : "outElastic(1, .5)",
  });
  const pulseEl = marker.getElement().querySelector(".marker-pulse");
  if (pulseEl) {
    pulseEl.style.transform = "scale(0.5)";
    pulseEl.style.opacity = "0.75";
    anime.animate(pulseEl, {
      scale: 3,
      opacity: 0,
      duration: 1100,
      ease: "outCubic",
      loop: 2,
    });
  }
}

function spawnRipple(lngLat, color = "#4d7df0", maxScale = 3.6, duration = 1300, count = 1) {
  if (!window.anime) return;
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement("div");
    wrap.className = "marker-wrap";
    const ring = document.createElement("div");
    ring.className = "ripple-ring";
    ring.style.borderColor = color;
    ring.style.boxShadow = `0 0 18px ${color}88`;
    ring.style.transform = "scale(0.2)";
    ring.style.opacity = "0.95";
    wrap.appendChild(ring);
    const m = new maplibregl.Marker({ element: wrap }).setLngLat(lngLat).addTo(map);
    anime.animate(ring, {
      scale: maxScale,
      opacity: 0,
      duration,
      delay: i * 200,
      ease: "outCubic",
      onComplete: () => m.remove(),
    });
  }
}

// ─── Reveal / Next / End ────────────────────────────────────────────────────
function showReveal(res) {
  chime(660);
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
  document.getElementById("emoji-strip").textContent = emojiStrip(state.played);
  showCard("end-card");
  if (restored) {
    document.getElementById("final-score").textContent = state.totalScore;
  } else {
    countUp(document.getElementById("final-score"), 0, state.totalScore, 1500);
  }
}

function countUp(el, from, to, ms) {
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function step(t) {
    const u = Math.min(1, (t - start) / ms);
    el.textContent = Math.round(from + (to - from) * ease(u));
    if (u < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── Share / leaderboard / history ──────────────────────────────────────────
function scoreEmoji(pct) {
  if (pct >= 0.95) return PALETTE[0]; // 🇮🇱
  if (pct >= 0.80) return PALETTE[1]; // ✡️
  if (pct >= 0.60) return PALETTE[2]; // 🕊️
  if (pct >= 0.30) return PALETTE[3]; // 🐪
  return PALETTE[4];                  // 🌵
}

function emojiStrip(played) {
  return played
    .slice()
    .sort((a, b) => a.round_idx - b.round_idx)
    .map((g) => {
      const max = 100 * (g.multiplier || state.rounds[g.round_idx]?.multiplier || 1);
      return scoreEmoji(g.round_score / max);
    })
    .join(" ");
}

function buildShareText() {
  const games = state.played.slice().sort((a, b) => a.round_idx - b.round_idx);
  const line = games
    .map((g) => {
      const max = 100 * (g.multiplier || state.rounds[g.round_idx]?.multiplier || 1);
      return `${g.round_score}${scoreEmoji(g.round_score / max)}`;
    })
    .join(" ");
  return (
    `IsraelE #${state.dayNumber}\n` +
    `${line}\n` +
    `ניקוד סופי: ${state.totalScore}/1000\n` +
    `${location.origin}`
  );
}

async function onShare() {
  const txt = buildShareText();
  try {
    if (navigator.share) {
      await navigator.share({ title: `IsraelE #${state.dayNumber}`, text: txt });
      return;
    }
    await navigator.clipboard.writeText(txt);
    flashToast("הועתק ללוח", "ok");
  } catch (e) {
    if (e?.name === "AbortError") return; // user cancelled native share
    try {
      await navigator.clipboard.writeText(txt);
      flashToast("הועתק ללוח", "ok");
    } catch {
      flashToast("העתקה נכשלה");
    }
  }
}

async function openLeaderboard() {
  const lb = await fetch(`/api/leaderboard?date=${state.date}`).then((r) => r.json());
  const list = document.getElementById("lb-list");
  list.innerHTML = lb.top.length
    ? lb.top.map((row, i) => `<div class="lb-row"><span>#${i + 1}</span><span>${escapeHtml(row.name)}</span><b>${row.score}</b></div>`).join("")
    : "<p>אין עדיין תוצאות.</p>";
  openModal("lb-card");
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
  openModal("history-card");
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
    animateCardIn(cardId);
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

// ─── Modals (stats / leaderboard / history) — preserve underlying state ────
let _modalSnap = null;
function openModal(cardId) {
  // Snapshot whatever's currently visible so closeModal can restore it.
  const overlay = document.getElementById("overlay");
  const visibleCard = Array.from(overlay.querySelectorAll(".card"))
    .find((c) => !c.classList.contains("hidden"));
  _modalSnap = {
    hudVisible: !document.getElementById("hud").classList.contains("hidden"),
    cardId: visibleCard ? visibleCard.id : null,
  };
  document.getElementById("hud").classList.add("hidden");
  showCard(cardId);
}
function closeModal() {
  const s = _modalSnap; _modalSnap = null;
  if (!s) { showCard("start-card"); return; }
  if (s.hudVisible) {
    showCard(null);
    document.getElementById("hud").classList.remove("hidden");
  } else if (s.cardId) {
    showCard(s.cardId);
  } else {
    showCard("start-card");
  }
}

async function openStats() {
  showSpinner(true);
  let s;
  try {
    s = await fetchJSON(`/api/me/stats?player_id=${encodeURIComponent(playerId)}`);
  } catch {
    flashToast("טעינת סטטיסטיקות נכשלה");
    showSpinner(false);
    return;
  }
  showSpinner(false);
  document.getElementById("stat-games").textContent = s.games_played;
  document.getElementById("stat-streak").textContent = s.current_streak;
  document.getElementById("stat-max").textContent = s.max_streak;
  document.getElementById("stat-avg").textContent = s.avg_score;
  const hist = document.getElementById("histogram");
  const labels = ["0-200", "200-400", "400-600", "600-800", "800-1000"];
  const max = Math.max(1, ...s.histogram);
  hist.innerHTML = s.histogram.map((n, i) =>
    `<div class="hist-row-bar">
       <span class="hist-label">${labels[i]}</span>
       <div class="hist-bar" style="width:${(n / max) * 100}%">${n || ""}</div>
     </div>`).join("");
  openModal("stats-card");
}

// ─── How-to-play modal ──────────────────────────────────────────────────────
function openHowto(start, asModal = false) {
  state._howtoIdx = start || 0;
  paintHowto();
  if (asModal) openModal("howto-card");
  else showCard("howto-card");
}
function moveHowto(delta) {
  const next = state._howtoIdx + delta;
  if (next < 0) return;
  if (next > 2) {
    skipHowto();
    return;
  }
  state._howtoIdx = next;
  paintHowto();
}
function skipHowto() {
  localStorage.setItem("israelle_seen_howto", "1");
  if (_modalSnap) closeModal();
  else showCard("start-card");
}
function paintHowto() {
  const slides = document.querySelectorAll(".howto-slide");
  slides.forEach((s) => s.classList.toggle("hidden", Number(s.dataset.i) !== state._howtoIdx));
  document.getElementById("btn-howto-prev").classList.toggle("hidden", state._howtoIdx === 0);
  document.getElementById("btn-howto-next").textContent = state._howtoIdx === 2 ? "התחל" : "הבא";
  const dots = document.getElementById("howto-dots");
  dots.innerHTML = [0, 1, 2].map((i) => `<span class="dot${i === state._howtoIdx ? " on" : ""}"></span>`).join("");
}

// ─── Toggles ────────────────────────────────────────────────────────────────
function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem("israelle_sound", soundOn ? "on" : "off");
  applyToggleVisuals();
  toggleSoundToast();
  if (soundOn) chime(800);
}
function toggleSoundToast() {
  flashToast(`צליל: ${soundOn ? "פעיל" : "כבוי"}`, "ok");
}
function applyToggleVisuals() {
  const s = document.getElementById("btn-sound");
  if (s) s.textContent = soundOn ? "🔊" : "🔇";
}

// ─── Sound (Web Audio chime) ────────────────────────────────────────────────
function chime(freq = 880) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.36);
  } catch {}
}

// ─── Fetch + spinner ────────────────────────────────────────────────────────
async function fetchJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
function showSpinner(on) {
  document.getElementById("spinner").classList.toggle("hidden", !on);
}

init();
