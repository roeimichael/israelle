const ISRAEL_CENTER = [34.95, 31.5];
// Click-valid region (rough Israel bbox)
const ISRAEL_CLICK_BBOX = { minLng: 34.0, maxLng: 35.95, minLat: 29.3, maxLat: 33.4 };
// Pan-allowed region (wider, for comfortable dragging)
const PAN_BOUNDS = [[32.5, 27.5], [38.5, 34.8]];

const SAT_STYLE = {
  version: 8,
  sources: {
    esri_sat: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "esri_sat", type: "raster", source: "esri_sat" }],
};

let map, state = {
  gameId: null, rounds: [], cursor: 0, totalScore: 0, currentMult: 1,
  awaitingClick: false, truthMarker: null, guessMarker: null, lineId: null,
};

async function init() {
  map = new maplibregl.Map({
    container: "map",
    style: SAT_STYLE,
    center: ISRAEL_CENTER,
    zoom: 7.3,
    minZoom: 6,
    maxZoom: 18,
    maxBounds: PAN_BOUNDS,
    dragRotate: false,
    pitchWithRotate: false,
  });

  map.on("click", onMapClick);
  document.getElementById("btn-start").onclick = startGame;
  document.getElementById("btn-next").onclick = nextRound;
  document.getElementById("btn-restart").onclick = startGame;
}

function insideIsrael(lng, lat) {
  return lng >= ISRAEL_CLICK_BBOX.minLng && lng <= ISRAEL_CLICK_BBOX.maxLng
      && lat >= ISRAEL_CLICK_BBOX.minLat && lat <= ISRAEL_CLICK_BBOX.maxLat;
}

function flashToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(flashToast._h);
  flashToast._h = setTimeout(() => t.classList.remove("show"), 1500);
}

async function startGame() {
  clearMarkers();
  state.totalScore = 0;
  state.cursor = 0;
  const g = await fetch("/api/game/new", { method: "POST" }).then(r => r.json());
  state.gameId = g.game_id;
  state.rounds = g.rounds;
  showCard(null);
  await loadRound();
}

async function loadRound() {
  const id = state.rounds[state.cursor];
  const r = await fetch(`/api/round/${id}`).then(r => r.json());
  state.currentMult = r.multiplier;
  document.getElementById("place-name-en").textContent = r.name_en;
  document.getElementById("place-name-he").textContent = r.name_he;
  document.getElementById("place-type").textContent = `${r.type} · ${r.category}`;
  document.getElementById("round-num").textContent = `Round ${state.cursor + 1} / 5`;
  const multEl = document.getElementById("round-mult");
  multEl.textContent = `${r.multiplier}×`;
  multEl.className = `mult m${r.multiplier}`;
  document.getElementById("round-score").textContent = `Score: ${state.totalScore}`;
  document.getElementById("hud").classList.remove("hidden");
  state.awaitingClick = true;
}

function makeDot(cls) {
  // Wrap is what MapLibre positions (it overwrites .style.transform every frame),
  // inner dot owns the visual + animation so our transforms are not clobbered.
  const wrap = document.createElement("div");
  wrap.className = "marker-wrap";
  wrap.innerHTML = `
    <div class="marker-pulse ${cls}"></div>
    <div class="marker-dot ${cls}"></div>
  `;
  return wrap;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function onMapClick(e) {
  if (!state.awaitingClick) return;
  const { lng, lat } = e.lngLat;
  if (!insideIsrael(lng, lat)) {
    flashToast("Click inside Israel");
    return;
  }
  state.awaitingClick = false;
  const id = state.rounds[state.cursor];

  // 1) drop guess dot immediately
  state.guessMarker = new maplibregl.Marker({ element: makeDot("guess") })
    .setLngLat([lng, lat]).addTo(map);

  const res = await fetch(`/api/round/${id}/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id: state.gameId, lat, lon: lng }),
  }).then(r => r.json());

  state.totalScore = res.total_score;
  const truthLngLat = [res.true_lon, res.true_lat];

  // Polygon + truth dot appear immediately after the guess registers.
  drawPolygon(res.polygon);
  state.truthMarker = new maplibregl.Marker({ element: makeDot("truth") })
    .setLngLat(truthLngLat).addTo(map);

  // Fit camera (polygon bbox if available, otherwise just the two points).
  const bbox = polygonBbox(res.polygon) ?? [
    [Math.min(lng, res.true_lon), Math.min(lat, res.true_lat)],
    [Math.max(lng, res.true_lon), Math.max(lat, res.true_lat)],
  ];
  bbox[0][0] = Math.min(bbox[0][0], lng);
  bbox[0][1] = Math.min(bbox[0][1], lat);
  bbox[1][0] = Math.max(bbox[1][0], lng);
  bbox[1][1] = Math.max(bbox[1][1], lat);
  map.fitBounds(bbox, { padding: 160, duration: 1200 });

  // Slow, smooth line draw with a "comet" head dot.
  await animateLine([lng, lat], truthLngLat, 3000);

  showReveal(res);
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
  map.addSource(state.polyId, {
    type: "geojson",
    data: { type: "Feature", geometry: geom, properties: {} },
  });
  map.addLayer({
    id: state.polyId + "-fill",
    type: "fill",
    source: state.polyId,
    paint: { "fill-color": "#4d7df0", "fill-opacity": 0.22 },
  });
  map.addLayer({
    id: state.polyId + "-line",
    type: "line",
    source: state.polyId,
    paint: {
      "line-color": "#4d7df0",
      "line-width": 2.5,
      "line-opacity": 0.95,
      "line-blur": 0.3,
    },
  });
}

function animateLine(from, to, durationMs) {
  state.lineId = "guess-line";
  if (map.getSource(state.lineId)) {
    map.removeLayer(state.lineId + "-glow");
    map.removeLayer(state.lineId);
    map.removeSource(state.lineId);
  }
  map.addSource(state.lineId, {
    type: "geojson",
    data: { type: "Feature", geometry: { type: "LineString", coordinates: [from, from] } },
  });
  // Soft glow underlay
  map.addLayer({
    id: state.lineId + "-glow", type: "line", source: state.lineId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#4d7df0", "line-width": 9, "line-opacity": 0.35, "line-blur": 3 },
  });
  // Crisp dashed top line
  map.addLayer({
    id: state.lineId, type: "line", source: state.lineId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#ffffff",
      "line-width": 3,
      "line-dasharray": [1.5, 1.8],
      "line-opacity": 0.95,
    },
  });

  // Comet-head marker travels along with the line tip.
  const headEl = document.createElement("div");
  headEl.className = "comet-head";
  state.cometMarker = new maplibregl.Marker({ element: headEl }).setLngLat(from).addTo(map);

  const src = map.getSource(state.lineId);
  const start = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
        // fade out comet
        headEl.classList.add("fading");
        setTimeout(() => { state.cometMarker?.remove(); state.cometMarker = null; }, 400);
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

function showReveal(res) {
  document.getElementById("hud").classList.add("hidden");
  document.getElementById("reveal-score").textContent = `+${res.round_score}`;
  document.getElementById("reveal-breakdown").textContent =
    `${res.base_score} × ${res.multiplier}`;
  document.getElementById("reveal-place").textContent =
    document.getElementById("place-name-en").textContent;
  document.getElementById("reveal-dist").textContent = `${res.distance_km} km away`;
  document.getElementById("btn-next").textContent = res.done ? "See result" : "Next →";
  showCard("reveal-card", true);
  state._done = res.done;
}

function nextRound() {
  clearMarkers();
  if (state._done) {
    document.getElementById("final-score").textContent = state.totalScore;
    showCard("end-card");
  } else {
    state.cursor++;
    showCard(null);
    loadRound();
    map.flyTo({ center: ISRAEL_CENTER, zoom: 7.3, duration: 800 });
  }
}

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
  if (state.polyId) {
    if (map.getLayer(state.polyId + "-fill")) map.removeLayer(state.polyId + "-fill");
    if (map.getLayer(state.polyId + "-line")) map.removeLayer(state.polyId + "-line");
    if (map.getSource(state.polyId)) map.removeSource(state.polyId);
    state.polyId = null;
  }
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

init();
