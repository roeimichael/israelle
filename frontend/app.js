const ISRAEL_CENTER = [34.85, 31.5];
const ISRAEL_BOUNDS = [[33.8, 29.3], [36.0, 33.5]];

let map, state = {
  gameId: null, rounds: [], cursor: 0, totalScore: 0,
  awaitingClick: false, truthMarker: null, guessMarker: null, lineId: null,
};

async function init() {
  const cfg = await fetch("/api/config").then(r => r.json());
  const styleUrl = cfg.maptiler_key
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${cfg.maptiler_key}`
    : "https://demotiles.maplibre.org/style.json";

  map = new maplibregl.Map({
    container: "map",
    style: styleUrl,
    center: ISRAEL_CENTER,
    zoom: 7,
    minZoom: 6,
    maxBounds: ISRAEL_BOUNDS,
  });

  map.on("click", onMapClick);
  document.getElementById("btn-start").onclick = startGame;
  document.getElementById("btn-next").onclick = nextRound;
  document.getElementById("btn-restart").onclick = startGame;
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
  document.getElementById("place-name-en").textContent = r.name_en;
  document.getElementById("place-name-he").textContent = r.name_he;
  document.getElementById("place-type").textContent = r.type;
  document.getElementById("round-num").textContent = `Round ${state.cursor + 1} / 5`;
  document.getElementById("round-score").textContent = `Score: ${state.totalScore}`;
  document.getElementById("hud").classList.remove("hidden");
  state.awaitingClick = true;
}

async function onMapClick(e) {
  if (!state.awaitingClick) return;
  state.awaitingClick = false;
  const { lng, lat } = e.lngLat;
  const id = state.rounds[state.cursor];

  state.guessMarker = new maplibregl.Marker({ color: "#f56565" })
    .setLngLat([lng, lat]).addTo(map);

  const res = await fetch(`/api/round/${id}/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id: state.gameId, lat, lon: lng }),
  }).then(r => r.json());

  state.totalScore = res.total_score;
  state.truthMarker = new maplibregl.Marker({ color: "#4fd1c5" })
    .setLngLat([res.true_lon, res.true_lat]).addTo(map);

  drawLine([lng, lat], [res.true_lon, res.true_lat]);
  map.fitBounds([[Math.min(lng, res.true_lon), Math.min(lat, res.true_lat)],
                 [Math.max(lng, res.true_lon), Math.max(lat, res.true_lat)]],
                { padding: 120, duration: 800 });

  showReveal(res);
}

function drawLine(a, b) {
  state.lineId = "guess-line";
  if (map.getSource(state.lineId)) map.removeLayer(state.lineId), map.removeSource(state.lineId);
  map.addSource(state.lineId, {
    type: "geojson",
    data: { type: "Feature", geometry: { type: "LineString", coordinates: [a, b] } },
  });
  map.addLayer({
    id: state.lineId, type: "line", source: state.lineId,
    paint: { "line-color": "#f0f0f0", "line-width": 2, "line-dasharray": [2, 2] },
  });
}

function showReveal(res) {
  document.getElementById("hud").classList.add("hidden");
  document.getElementById("reveal-score").textContent = `+${res.score}`;
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
    map.flyTo({ center: ISRAEL_CENTER, zoom: 7, duration: 800 });
  }
}

function clearMarkers() {
  state.guessMarker?.remove(); state.guessMarker = null;
  state.truthMarker?.remove(); state.truthMarker = null;
  if (state.lineId && map.getSource(state.lineId)) {
    map.removeLayer(state.lineId); map.removeSource(state.lineId);
  }
  state.lineId = null;
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
