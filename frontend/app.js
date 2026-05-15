// ─── i18n ──────────────────────────────────────────────────────────────────
const STRINGS = {
  he: {
    site_title: "IsraelE — פאזל יומי של מקומות בישראל",
    site_desc: "פאזל יומי בסגנון וורדל לישראל. 6 מקומות. נקודה אחת על המפה. כמה אתם מכירים את הארץ?",
    splash_loading: "טוען",
    tagline: "כמה טוב אתם מכירים את ישראל?",
    tagline_sub: "6 מקומות חדשים בכל יום, אותו סט לכולם.",
    legend_cities: "2 ערים",
    legend_settlements: "2 יישובים",
    legend_landmarks: "2 אתרים",
    game_total_hint_pre: "עד",
    game_total_hint_post: "נקודות",
    btn_signin_google: "התחברות עם Google",
    or_divider: "או",
    btn_play_guest: "התחל כאורח",
    btn_play: "התחל",
    guest_hint: "משחק כאורח לא ישמור היסטוריה ארוכת-טווח.",
    next_puzzle_in: "פאזל הבא בעוד",
    name_prompt: "מה השם שלכם?",
    name_subtitle: "יוצג בלוח התוצאות.",
    name_placeholder: "ישראל ישראלי",
    btn_save: "שמור",
    btn_signout: "התנתק",
    end_title: "סיום משחק",
    final_max: "מתוך 1000",
    btn_share: "📋 העתק תוצאה",
    btn_leaderboard: "🏆 לוח יומי",
    places_title: "המקומות של היום",
    btn_fresh_guest: "↺ התחל מחדש כאורח חדש",
    history_title: "היסטוריה",
    btn_close: "סגור",
    lb_title: "לוח יומי",
    stats_title: "סטטיסטיקות",
    stats_games: "משחקים",
    stats_streak: "רצף נוכחי",
    stats_max: "רצף שיא",
    stats_avg: "ממוצע",
    histogram_title: "פיזור ניקוד",
    howto_title: "איך משחקים?",
    howto_p1: "בכל סבב יופיע שם של מקום בישראל. <b>לחצו על המפה</b> איפה לדעתכם הוא נמצא.",
    howto_scoring_title: "ניקוד",
    howto_scoring_p: "ככל שלחצתם <b>קרוב יותר</b>, יותר נקודות. עד 250 לסבב בודד, עד <b>1000</b> בכל יום.",
    howto_daily_title: "פאזל יומי",
    howto_daily_p1: "כולם משחקים את אותם 6 מקומות. הפאזל מתחלף ב-<b>00:00</b> שעון ישראל.",
    howto_daily_p2: "אפשר לשתף את התוצאה כמו בוורדל ולהשוות לחברים.",
    howto_back: "חזור",
    howto_next: "הבא",
    howto_start: "התחל",
    howto_skip: "דלגו ←",
    btn_stats_tooltip: "סטטיסטיקות",
    btn_sound_tooltip: "צליל",
    btn_history_tooltip: "היסטוריה",
    btn_signout_tooltip: "התנתק מהחשבון",
    btn_help_tooltip: "איך משחקים",
    prompt_where: "איפה",
    where_q: "?",
    round_n_of: "סבב {n} / 6",
    score_label: "ניקוד",
    km_from_you: "ק״מ ממך",
    btn_summary: "סיכום",
    btn_next: "הבא ←",
    click_inside_israel: "לחצו בתוך ישראל",
    score_save_fail: "שגיאה בשמירת הניקוד",
    puzzle_load_fail: "נכשלה טעינת הפאזל. נסו שוב.",
    stats_load_fail: "טעינת סטטיסטיקות נכשלה",
    sign_in_for_history: "התחברו כדי לראות היסטוריה",
    supabase_not_configured: "חיבור Supabase לא הוגדר",
    confirm_fresh_guest: "יישחק לך פאזל חדש כאורח. ההיסטוריה המקומית תאופס. להמשיך?",
    share_intro: "בואו נראה כמה אתם מכירים את ישראל",
    share_final: "ניקוד סופי",
    copied: "הועתק ללוח",
    copy_failed: "העתקה נכשלה",
    sound_on: "צליל: פעיל",
    sound_off: "צליל: כבוי",
    no_lb_yet: "אין עדיין תוצאות.",
    no_games_yet: "עדיין לא שיחקתם.",
    info_link: "מידע נוסף ↗",
    archive_banner: "ארכיון: {date}",
    play_today: "→ לפאזל של היום",
    link_privacy: "פרטיות",
    link_terms: "תנאי שימוש",
    type_city: "עיר", type_village: "יישוב", type_mountain: "הר", type_ruins: "חורבה",
    type_viewpoint: "תצפית", type_archaeological: "אתר ארכיאולוגי",
    type_memorial: "אנדרטה", type_attraction: "אתר תיירות", type_museum: "מוזיאון",
    type_monument: "אנדרטה", type_battlefield: "שדה קרב", type_tomb: "קבר",
    type_castle: "טירה", type_fort: "מבצר", type_nature_reserve: "שמורת טבע",
    type_theme_park: "פארק שעשועים", type_city_gate: "שער עיר",
    type_wayside_shrine: "מקדש דרך", type_christian_site: "אתר נוצרי",
    type_jewish_site: "אתר יהודי", type_druze_site: "אתר דרוזי",
    type_religious_site: "אתר דתי",
    cat_city: "עיר", cat_settlement: "יישוב", cat_landmark: "אתר",
  },
  en: {
    site_title: "IsraelE — Daily Israel Geography Puzzle",
    site_desc: "Daily Wordle-style geography puzzle for Israel. 6 places, one map, up to 1000 points.",
    splash_loading: "Loading",
    tagline: "How well do you know Israel?",
    tagline_sub: "6 fresh places every day. Same set for everyone.",
    legend_cities: "2 cities",
    legend_settlements: "2 settlements",
    legend_landmarks: "2 landmarks",
    game_total_hint_pre: "Up to",
    game_total_hint_post: "points",
    btn_signin_google: "Sign in with Google",
    or_divider: "or",
    btn_play_guest: "Play as guest",
    btn_play: "Play",
    guest_hint: "Guest mode doesn't save long-term history.",
    next_puzzle_in: "Next puzzle in",
    name_prompt: "What's your name?",
    name_subtitle: "Shown on the leaderboard.",
    name_placeholder: "Your name",
    btn_save: "Save",
    btn_signout: "Sign out",
    end_title: "Game over",
    final_max: "out of 1000",
    btn_share: "📋 Copy result",
    btn_leaderboard: "🏆 Daily board",
    places_title: "Today's places",
    btn_fresh_guest: "↺ Start fresh as guest",
    history_title: "History",
    btn_close: "Close",
    lb_title: "Daily leaderboard",
    stats_title: "Stats",
    stats_games: "games",
    stats_streak: "current streak",
    stats_max: "max streak",
    stats_avg: "average",
    histogram_title: "Score distribution",
    howto_title: "How to play",
    howto_p1: "Each round shows the name of a place in Israel. <b>Click on the map</b> where you think it is.",
    howto_scoring_title: "Scoring",
    howto_scoring_p: "The <b>closer</b> your click, the more points. Up to 250 per round, up to <b>1000</b> per day.",
    howto_daily_title: "Daily puzzle",
    howto_daily_p1: "Everyone plays the same 6 places. Resets at <b>midnight</b> Israel time.",
    howto_daily_p2: "Share your result Wordle-style and compare with friends.",
    howto_back: "Back",
    howto_next: "Next",
    howto_start: "Play",
    howto_skip: "Skip →",
    btn_stats_tooltip: "Stats",
    btn_sound_tooltip: "Sound",
    btn_history_tooltip: "History",
    btn_signout_tooltip: "Sign out",
    btn_help_tooltip: "How to play",
    prompt_where: "Where is",
    where_q: "?",
    round_n_of: "Round {n} / 6",
    score_label: "Score",
    km_from_you: "km away",
    btn_summary: "Summary",
    btn_next: "Next →",
    click_inside_israel: "Click inside Israel",
    score_save_fail: "Score save failed",
    puzzle_load_fail: "Failed to load puzzle. Try again.",
    stats_load_fail: "Stats load failed",
    sign_in_for_history: "Sign in to see your history",
    supabase_not_configured: "Supabase not configured",
    confirm_fresh_guest: "A fresh guest puzzle will start. Local history will be wiped. Continue?",
    share_intro: "How well do you know Israel?",
    share_final: "Final score",
    copied: "Copied to clipboard",
    copy_failed: "Copy failed",
    sound_on: "Sound: on",
    sound_off: "Sound: off",
    no_lb_yet: "No results yet.",
    no_games_yet: "No games yet.",
    info_link: "Read more ↗",
    archive_banner: "Archive: {date}",
    play_today: "→ Play today's puzzle",
    link_privacy: "Privacy",
    link_terms: "Terms",
    type_city: "city", type_village: "village", type_mountain: "mountain", type_ruins: "ruins",
    type_viewpoint: "viewpoint", type_archaeological: "archaeological site",
    type_memorial: "memorial", type_attraction: "attraction", type_museum: "museum",
    type_monument: "monument", type_battlefield: "battlefield", type_tomb: "tomb",
    type_castle: "castle", type_fort: "fort", type_nature_reserve: "nature reserve",
    type_theme_park: "theme park", type_city_gate: "city gate",
    type_wayside_shrine: "wayside shrine", type_christian_site: "christian site",
    type_jewish_site: "jewish site", type_druze_site: "druze site",
    type_religious_site: "religious site",
    cat_city: "city", cat_settlement: "settlement", cat_landmark: "landmark",
  },
};

function _pickLang() {
  // Explicit user choice always wins (URL or previous toggle). Default Hebrew
  // for everyone else — site is Israel-focused.
  const urlLang = new URLSearchParams(location.search).get("lang");
  if (urlLang === "he" || urlLang === "en") return urlLang;
  const saved = localStorage.getItem("israelle_lang");
  if (saved === "he" || saved === "en") return saved;
  return "he";
}
let LANG = _pickLang();

function T(key, vars) {
  let s = STRINGS[LANG]?.[key] ?? STRINGS.en[key] ?? key;
  if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
}

function typeLabel(t) {
  const key = "type_" + t.replace(/\s+/g, "_").replace("archaeological_site", "archaeological");
  const v = STRINGS[LANG][key];
  return v || t;
}
function categoryLabel(c) {
  return STRINGS[LANG]["cat_" + c] || c;
}

function applyI18n() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "he" ? "rtl" : "ltr";
  document.title = T("site_title");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const attr = el.getAttribute("data-i18n-attr");
    if (attr) {
      el.setAttribute(attr, T(key));
    } else if (!el.hasAttribute("data-i18n-html")) {
      el.textContent = T(key);
    }
  });
  document.querySelectorAll("[data-i18n-text]").forEach((el) => {
    el.textContent = T(el.getAttribute("data-i18n-text"));
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = T(el.getAttribute("data-i18n-html"));
  });
  const btn = document.getElementById("btn-lang");
  if (btn) btn.textContent = LANG === "he" ? "EN" : "עב";
}

function toggleLang() {
  LANG = LANG === "he" ? "en" : "he";
  localStorage.setItem("israelle_lang", LANG);
  applyI18n();
  // Re-render any dynamic strings on screen
  repaintDynamic();
  // Start/signin card buttons depend on session+lang
  try { renderUserChip(); } catch {}
}

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
  // Per-round truth coords decoded client-side from /api/today.tile_hash,
  // used to start the reveal animation before /api/today/guess returns.
  _idx: null,
  // Archive mode: when ?date=YYYY-MM-DD set, play a past day stateless (no save).
  archive: null,
};

// Pull ?date= from URL once; null on the live daily puzzle.
function _readArchiveDate() {
  const d = new URLSearchParams(location.search).get("date");
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return d;
}

function _isArchive() { return !!state.archive; }
function _puzzleUrl() { return state.archive ? `/api/puzzle/${state.archive}` : "/api/today"; }
function _guessUrl() { return state.archive ? `/api/puzzle/${state.archive}/guess` : "/api/today/guess"; }

function repaintDynamic() {
  // Called after lang toggle. Re-render anything not handled by applyI18n.
  if (state.rounds.length && state.cursor < state.rounds.length && state.awaitingClick) {
    const r = state.rounds[state.cursor];
    document.getElementById("place-name-he").textContent = LANG === "he" ? r.name_he : (r.name_en || r.name_he);
    document.getElementById("place-type").textContent =
      `${typeLabel(r.type)} · ${categoryLabel(r.category)}`;
    document.getElementById("round-num").textContent = T("round_n_of", { n: state.cursor + 1 });
    document.getElementById("round-score").textContent = `${T("score_label")}: ${state.totalScore}`;
  }
  // Re-render reveal place name if visible
  const revPlace = document.getElementById("reveal-place");
  if (revPlace && !document.getElementById("reveal-card").classList.contains("hidden")) {
    const r = state.rounds[state.cursor];
    if (r) revPlace.textContent = LANG === "he" ? r.name_he : (r.name_en || r.name_he);
  }
  // Re-render archive banner text
  if (state.archive) {
    const tEl = document.getElementById("archive-banner-text");
    if (tEl) tEl.textContent = T("archive_banner", { date: state.archive });
  }
  // Re-render howto next button
  if (typeof state._howtoIdx === "number") {
    const nextBtn = document.getElementById("btn-howto-next");
    if (nextBtn) nextBtn.textContent = state._howtoIdx === 2 ? T("howto_start") : T("howto_next");
  }
  // Re-render places list (if on end-card)
  if (state.played.length && !document.getElementById("end-card").classList.contains("hidden")) {
    renderPlacesList();
  }
}

// Israel-themed score emojis (5 buckets, best → worst):
// flag, star of david, dove (peace), camel (desert grind), cactus (סבר/ouch)
const PALETTE = ["🇮🇱", "✡️", "🕊️", "🐪", "🌵"];

// ─── Boot ───────────────────────────────────────────────────────────────────
const _splashStart = performance.now();
const MIN_SPLASH_MS = 900; // long enough to read the wordmark, short enough not to annoy

async function init() {
  // Apply language + direction before anything visible renders.
  applyI18n();
  // Detect archive mode early so loadTodayIntoState routes correctly.
  state.archive = _readArchiveDate();
  if (state.archive) {
    document.getElementById("archive-banner").classList.remove("hidden");
    document.getElementById("archive-banner-text").textContent = T("archive_banner", { date: state.archive });
  }

  // load config + supabase
  const cfg = await fetch("/api/config").then((r) => r.json());
  if (cfg.supabase_url && cfg.supabase_key) {
    sb = window.supabase.createClient(cfg.supabase_url, cfg.supabase_key, {
      auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    });
    const { data } = await sb.auth.getSession();
    session = data.session;
    sb.auth.onAuthStateChange((evt, s) => {
      const wasSignedOut = !session;
      session = s;
      renderUserChip();
      // On sign-in (not initial load), re-check today's state under the auth
      // identity — they may have already played today via a different
      // browser/guest session.
      if (evt === "SIGNED_IN" && wasSignedOut && s) {
        resyncForAuth();
      }
    });
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
  document.getElementById("btn-fresh-guest").onclick = onFreshGuest;

  // toolbar
  document.getElementById("btn-help").onclick = () => openHowto(0, true);
  document.getElementById("btn-stats").onclick = openStats;
  document.getElementById("btn-stats-close").onclick = closeModal;
  document.getElementById("btn-sound").onclick = toggleSound;
  document.getElementById("btn-lang").onclick = toggleLang;
  document.getElementById("btn-howto-next").onclick = () => moveHowto(+1);
  document.getElementById("btn-howto-prev").onclick = () => moveHowto(-1);
  document.getElementById("btn-howto-skip").onclick = skipHowto;

  startCountdown();
  const alreadyDone = await loadTodayIntoState();

  // render Lucide icons
  if (window.lucide?.createIcons) window.lucide.createIcons();

  // first-visit howto
  if (!alreadyDone) {
    if (!localStorage.getItem("israelle_seen_howto")) {
      openHowto(0);
    } else {
      animateCardIn("start-card");
    }
  }

  const elapsed = performance.now() - _splashStart;
  if (elapsed < MIN_SPLASH_MS) await sleep(MIN_SPLASH_MS - elapsed);
  hideSplash();
}

function hideSplash() {
  const s = document.getElementById("splash");
  if (!s) return;
  s.classList.add("fading");
  setTimeout(() => s.remove(), 600);
}

// Failsafe: kill splash after 8s no matter what. Railway is warm, so a long
// hang means something's wrong; show the start card so the user can retry.
setTimeout(() => {
  const s = document.getElementById("splash");
  if (s && !s.classList.contains("fading")) hideSplash();
}, 8000);

async function loadTodayIntoState() {
  try {
    const t = await fetchJSON(_puzzleUrl());
    state.dayNumber = t.day_number;
    state.date = t.date;
    state.rounds = t.rounds;
    // Hydrate the per-round paint index — used to draw the reveal line
    // without waiting for the score round-trip.
    if (t.tile_hash) {
      try {
        state._idx = await _initPaintIndex(t.tile_hash, t.date);
        console.log("[ils] paint index ready, rounds=", state._idx?.length);
      } catch (e) {
        state._idx = null;
        console.warn("[ils] paint index failed:", e);
      }
    } else {
      console.warn("[ils] puzzle missing tile_hash");
    }
    const tag = document.getElementById("day-num-start");
    if (tag) tag.textContent = `#${t.day_number}`;

    // Archive mode: skip the "have I played today" lookup — past days are
    // stateless replay. Always start fresh.
    if (state.archive) {
      state.played = [];
      state.totalScore = 0;
      return false;
    }

    // Prefer auth identity when signed in: the canonical player_id may differ
    // from whatever's in localStorage (e.g. user signed out, played as guest,
    // then signed back in). Backend looks up by auth_user_id, returns the row
    // that owns today's game if any.
    let me = null;
    if (session?.access_token) {
      try {
        // Pass the current localStorage id as a hint so the backend can
        // claim a guest player row this account hasn't seen yet (e.g. user
        // played as guest, then signed in for the first time today).
        const url = `/api/me/today?hint=${encodeURIComponent(playerId)}`;
        const authMe = await fetchJSON(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (authMe.player_id && authMe.player_id !== playerId) {
          playerId = authMe.player_id;
          localStorage.setItem("israelle_player_id", playerId);
        }
        if (authMe.name) {
          playerName = authMe.name;
          localStorage.setItem("israelle_player_name", playerName);
        }
        me = authMe;
      } catch (e) {
        console.warn("auth /me/today failed, falling back to anon", e);
      }
    }
    if (!me) {
      me = await fetchJSON(`/api/today/me?player_id=${encodeURIComponent(playerId)}`, authHeaders());
    }

    if (me.done) {
      state.played = me.guesses || [];
      state.totalScore = me.total_score || 0;
      showEnd(true);
      return true;
    }
  } catch (e) {
    console.warn("puzzle load failed", e);
  }
  return false;
}

async function resyncForAuth() {
  // Called after a SIGNED_IN event mid-session. Re-resolve today's state
  // using auth identity and jump to the end card if the user already played.
  const wasDone = await loadTodayIntoState();
  if (wasDone) {
    // Hide any mid-game UI; showEnd already swapped to end-card.
    document.getElementById("hud").classList.add("hidden");
    state.awaitingClick = false;
  }
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
  const statsBtn = document.getElementById("btn-stats");
  const startBtn = document.getElementById("btn-start");
  const guestHint = document.querySelector("#start-card .signin-hint");
  if (session) {
    chip.classList.remove("hidden");
    document.getElementById("user-name").textContent =
      session.user.user_metadata?.full_name || session.user.email || "";
    signinArea?.classList.add("hidden");
    statsBtn?.classList.remove("hidden");
    if (startBtn) {
      startBtn.textContent = T("btn_play");
      startBtn.classList.remove("btn-secondary");
    }
    guestHint?.classList.add("hidden");
  } else {
    chip.classList.add("hidden");
    signinArea?.classList.remove("hidden");
    statsBtn?.classList.add("hidden");
    if (startBtn) {
      startBtn.textContent = T("btn_play_guest");
      startBtn.classList.add("btn-secondary");
    }
    guestHint?.classList.remove("hidden");
  }
}

async function onSignIn() {
  if (!sb) { flashToast(T("supabase_not_configured")); return; }
  await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.origin },
  });
}

async function onSignOut() {
  if (!sb) return;
  try { await sb.auth.signOut(); } catch {}
  resetToGuest();
}

function resetToGuest() {
  localStorage.removeItem("israelle_player_id");
  localStorage.removeItem("israelle_player_name");
  location.reload();
}

function onFreshGuest() {
  if (!confirm(T("confirm_fresh_guest"))) return;
  // If signed in too, sign out first so we don't immediately re-resume the account
  if (sb && session) {
    sb.auth.signOut().finally(resetToGuest);
  } else {
    resetToGuest();
  }
}

// ─── Israel mask + border ───────────────────────────────────────────────────
// data/israel.geojson is curated land-only (Natural Earth 10m, IL ∪ PSE).
// Use as-is for both the dark mask hole and the border outline.

function _pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

async function addIsraelMask() {
  const border = await fetch("/api/israel-border").then((r) => r.json());
  const polys = border.geometry.type === "Polygon"
    ? [border.geometry.coordinates[0]]
    : border.geometry.coordinates.map((p) => p[0]);
  state._borderRings = polys;     // cached for point-in-polygon click filter
  const worldRing = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
  map.addSource("il-mask", { type: "geojson",
    data: { type: "Feature", geometry: { type: "Polygon", coordinates: [worldRing, ...polys] } } });
  map.addLayer({ id: "il-mask-fill", type: "fill", source: "il-mask",
    paint: { "fill-color": "#0a1424", "fill-opacity": 0.65 } });
  map.addSource("il-border", { type: "geojson",
    data: { type: "Feature", geometry: { type: "Polygon", coordinates: polys } } });
  map.addLayer({ id: "il-border-glow", type: "line", source: "il-border",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#4d7df0", "line-width": 6, "line-opacity": 0.25, "line-blur": 3 } });
  map.addLayer({ id: "il-border-line", type: "line", source: "il-border",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 2.4, "line-opacity": 0.85, "line-blur": 0.3 } });
}

// ─── Game flow ──────────────────────────────────────────────────────────────
async function onStart() {
  // Archive mode: skip the name prompt entirely. Scores aren't saved.
  if (!state.archive && !playerName) {
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
    if (state.archive) {
      const today = await fetchJSON(_puzzleUrl());
      state.date = today.date;
      state.dayNumber = today.day_number;
      state.rounds = today.rounds;
      state.played = [];
      state.totalScore = 0;
      state.cursor = 0;
    } else {
      const [today, me] = await Promise.all([
        fetchJSON("/api/today"),
        fetchJSON(`/api/today/me?player_id=${encodeURIComponent(playerId)}`, authHeaders()),
      ]);
      state.date = today.date;
      state.dayNumber = today.day_number;
      state.rounds = today.rounds;
      state.played = me.guesses || [];
      state.totalScore = me.total_score || 0;
      state.cursor = state.played.length;
    }
  } catch (e) {
    flashToast(T("puzzle_load_fail"));
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
  document.getElementById("place-name-he").textContent = LANG === "he" ? r.name_he : (r.name_en || r.name_he);
  document.getElementById("place-type").textContent =
    `${typeLabel(r.type)} · ${categoryLabel(r.category)}`;
  document.getElementById("day-num").textContent = `#${state.dayNumber}`;
  document.getElementById("round-num").textContent = T("round_n_of", { n: state.cursor + 1 });
  const multEl = document.getElementById("round-mult");
  multEl.textContent = `×${r.multiplier}`;
  multEl.className = `mult ${multClass(r.multiplier)}`;
  document.getElementById("round-score").textContent = `${T("score_label")}: ${state.totalScore}`;
  document.getElementById("hud").classList.remove("hidden");
  state.awaitingClick = true;
}

// ─── Click handler ──────────────────────────────────────────────────────────
// Hard check: ray-cast against the actual Israel polygon. Fall back to the
// permissive bbox only if the border hasn't loaded yet (offline / first paint).
function insideIsrael(lng, lat) {
  if (state._borderRings && state._borderRings.length) {
    for (const ring of state._borderRings) {
      if (_pointInRing(lng, lat, ring)) return true;
    }
    return false;
  }
  return lng >= ISRAEL_CLICK_BBOX.minLng && lng <= ISRAEL_CLICK_BBOX.maxLng
      && lat >= ISRAEL_CLICK_BBOX.minLat && lat <= ISRAEL_CLICK_BBOX.maxLat;
}

async function onMapClick(e) {
  if (!state.awaitingClick) return;
  const { lng, lat } = e.lngLat;
  if (!insideIsrael(lng, lat)) {
    flashToast(T("click_inside_israel"));
    return;
  }
  state.awaitingClick = false;
  chime(420);

  state.guessMarker = new maplibregl.Marker({ element: makeDot("guess") })
    .setLngLat([lng, lat]).addTo(map);
  popMarker(state.guessMarker);
  spawnRipple([lng, lat], "#ffb86b", 3.4, 1100, 2);

  // Kick off the score request in the background. Don't await yet — start
  // the reveal animation in parallel using the locally-known truth coords.
  const headers = { "Content-Type": "application/json" };
  if (!state.archive && session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
  const body = state.archive
    ? { player_id: playerId, round_idx: state.cursor, lat, lon: lng }
    : { player_id: playerId, name: playerName, round_idx: state.cursor, lat, lon: lng };
  const fetchP = fetch(_guessUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).then((r) => r.json()).catch((err) => ({ _err: err }));

  const localTruth = state._idx?.[state.cursor];   // [lat, lon] or undefined
  console.log("[ils] click", { round: state.cursor, fast: !!localTruth, t: Math.round(performance.now()) });
  if (localTruth) {
    const truthLngLat = [localTruth[1], localTruth[0]];
    // Simple bbox from guess+truth so the camera frames both immediately;
    // refined later if the server gives us a polygon.
    map.fitBounds([
      [Math.min(lng, truthLngLat[0]), Math.min(lat, truthLngLat[1])],
      [Math.max(lng, truthLngLat[0]), Math.max(lat, truthLngLat[1])],
    ], { padding: 120, duration: 900, maxZoom: 13 });

    await animateLine([lng, lat], truthLngLat, 3000);

    spawnRipple(truthLngLat, "#4d7df0", 5.2, 1500, 3);
    state.truthMarker = new maplibregl.Marker({ element: makeDot("truth") })
      .setLngLat(truthLngLat).addTo(map);
    popMarker(state.truthMarker, true);
  }

  const res = await fetchP;
  if (res._err || res.detail) {
    flashToast(res.detail || T("score_save_fail"));
    return;
  }

  // Archive: track score locally (no game_id, no total from server).
  if (state.archive) {
    res.total_score = (state.totalScore || 0) + res.round_score;
  }
  state.totalScore = res.total_score;
  state.played.push({ ...res, name_he: state.rounds[state.cursor].name_he, name_en: state.rounds[state.cursor].name_en });

  // If we didn't have local truth (no idx, e.g. first boot before hydrate),
  // run the full reveal sequence now that we have the server data.
  if (!localTruth) {
    const truthLngLat = [res.true_lon, res.true_lat];
    drawPolygon(res.polygon);
    const bbox = polygonBbox(res.polygon) ?? [
      [Math.min(lng, res.true_lon), Math.min(lat, res.true_lat)],
      [Math.max(lng, res.true_lon), Math.max(lat, res.true_lat)],
    ];
    map.fitBounds(bbox, { padding: 160, duration: 1200 });
    await animateLine([lng, lat], truthLngLat, 3000);
    spawnRipple(truthLngLat, "#4d7df0", 5.2, 1500, 3);
    state.truthMarker = new maplibregl.Marker({ element: makeDot("truth") })
      .setLngLat(truthLngLat).addTo(map);
    popMarker(state.truthMarker, true);
  } else {
    // Local-truth path already drew everything; just add the polygon if any.
    drawPolygon(res.polygon);
  }

  await sleep(300);
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
  // Start at ~60% scale (clearly visible on tap) and overshoot via outBack —
  // outElastic was slow at the start which read as "did my tap register?".
  el.style.transform = "scale(0.6)";
  if (!window.anime) { el.style.transform = "scale(1)"; return; }
  anime.animate(el, {
    scale: big ? [1.3, 1] : [1.2, 1],
    duration: 340,
    ease: "outBack(2)",
  });
  const pulseEl = marker.getElement().querySelector(".marker-pulse");
  if (pulseEl) {
    pulseEl.style.transform = "scale(0.5)";
    pulseEl.style.opacity = "0.75";
    anime.animate(pulseEl, {
      scale: 3,
      opacity: 0,
      duration: 900,
      ease: "outCubic",
      loop: big ? 1 : 3,           // guess pulses longer (covers fetch wait)
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
  const r = state.rounds[state.cursor];
  document.getElementById("reveal-place").textContent =
    LANG === "he" ? r.name_he : (r.name_en || r.name_he);
  const descEl = document.getElementById("reveal-desc");
  descEl.textContent = res.description || "";
  descEl.classList.toggle("hidden", !res.description);
  const srcEl = document.getElementById("reveal-source");
  if (res.source_url) {
    srcEl.href = res.source_url;
    srcEl.classList.remove("hidden");
  } else {
    srcEl.classList.add("hidden");
  }
  document.getElementById("reveal-dist").textContent = `${res.distance_km} ${T("km_from_you")}`;
  document.getElementById("btn-next").textContent = res.is_last ? T("btn_summary") : T("btn_next");
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
  renderPlacesList();
  showCard("end-card");
  if (restored) {
    document.getElementById("final-score").textContent = state.totalScore;
  } else {
    countUp(document.getElementById("final-score"), 0, state.totalScore, 1500);
  }
}

function renderPlacesList() {
  const list = document.getElementById("places-list");
  const title = document.getElementById("places-title");
  const sorted = state.played.slice().sort((a, b) => a.round_idx - b.round_idx);
  const anyEnriched = sorted.some((g) => g.description || g.image_url);
  title.classList.toggle("hidden", !anyEnriched);
  list.innerHTML = sorted.map((g) => {
    const nm = LANG === "he" ? (g.name_he || g.name_en) : (g.name_en || g.name_he);
    const img = g.image_url
      ? `<img src="${escapeHtml(g.image_url)}" alt="${escapeHtml(nm || "")}" loading="lazy" referrerpolicy="no-referrer"/>`
      : `<div class="no-image">🗺️</div>`;
    const desc = g.description
      ? `<div class="place-desc">${escapeHtml(g.description)}</div>`
      : "";
    const name = g.source_url
      ? `<a class="place-name" href="${escapeHtml(g.source_url)}" target="_blank" rel="noopener">${escapeHtml(nm || "")} ↗</a>`
      : `<div class="place-name">${escapeHtml(nm || "")}</div>`;
    return `
      <div class="place-tile">
        <div class="place-img">${img}</div>
        <div class="place-info">
          ${name}
          ${desc}
        </div>
      </div>`;
  }).join("");
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
    .map((g) => `${g.base_score}${scoreEmoji(g.base_score / 100)}`)
    .join(" ");
  return (
    `${T("share_intro")} ${location.origin}\n` +
    `\n` +
    `${line}\n` +
    `${T("share_final")}: ${state.totalScore}/1000`
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
    flashToast(T("copied"), "ok");
  } catch (e) {
    if (e?.name === "AbortError") return; // user cancelled native share
    try {
      await navigator.clipboard.writeText(txt);
      flashToast(T("copied"), "ok");
    } catch {
      flashToast(T("copy_failed"));
    }
  }
}

async function openLeaderboard() {
  const lb = await fetch(`/api/leaderboard?date=${state.date}`).then((r) => r.json());
  const list = document.getElementById("lb-list");
  list.innerHTML = lb.top.length
    ? lb.top.map((row, i) => `<div class="lb-row"><span>#${i + 1}</span><span>${escapeHtml(row.name)}</span><b>${row.score}</b></div>`).join("")
    : `<p>${T("no_lb_yet")}</p>`;
  openModal("lb-card");
}

async function openHistory() {
  if (!session) { flashToast(T("sign_in_for_history")); return; }
  const h = await fetch("/api/me/history", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).then((r) => r.json());
  const list = document.getElementById("history-list");
  list.innerHTML = h.games && h.games.length
    ? h.games.map((g) => `<div class="hist-row"><a href="/?date=${escapeHtml(g.puzzle_date)}">${escapeHtml(g.puzzle_date)}</a><b>${g.total_score}</b></div>`).join("")
    : `<p>${T("no_games_yet")}</p>`;
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
  let prevTotal = null;
  let reloaded = false;
  setInterval(() => {
    const now = new Date();
    const il = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
    const next = new Date(il);
    next.setHours(24, 0, 0, 0);
    const total = Math.max(0, Math.floor((next - il) / 1000));
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    let rem = total - h * 3600;
    const m = String(Math.floor(rem / 60)).padStart(2, "0");
    const ss = String(rem - m * 60).padStart(2, "0");
    const txt = `${h}:${m}:${ss}`;
    for (const id of ["cd", "cd2"]) {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    }
    // Detect midnight roll-over: countdown jumps from near-zero back near 24h.
    // Reload so an idle user picks up the fresh puzzle automatically.
    if (!reloaded && prevTotal !== null && prevTotal < 30 && total > 86000) {
      reloaded = true;
      setTimeout(() => location.reload(), 1500);
    }
    prevTotal = total;
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
    s = await fetchJSON(`/api/me/stats?player_id=${encodeURIComponent(playerId)}`, authHeaders());
  } catch {
    flashToast(T("stats_load_fail"));
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
  document.getElementById("btn-howto-next").textContent = state._howtoIdx === 2 ? T("howto_start") : T("howto_next");
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
  flashToast(soundOn ? T("sound_on") : T("sound_off"), "ok");
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

// Hydrate per-round paint coords from a packed source string. Kept simple
// on purpose — the score endpoint is still authoritative.
async function _initPaintIndex(seed, k) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode("ils-puzzle-" + k));
  const m = new Uint8Array(buf);
  const raw = Uint8Array.from(atob(seed), (c) => c.charCodeAt(0));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw[i] ^ m[i % m.length];
  return JSON.parse(new TextDecoder().decode(out));
}

// Pass to fetchJSON for any endpoint whose backend gates on player ownership.
// Returns `{}` (or `{headers}` with nothing) when guest — server-side guard
// then falls back to "guest player_id" rules.
function authHeaders() {
  return session?.access_token
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : {};
}

// ─── Fetch + spinner ────────────────────────────────────────────────────────
async function fetchJSON(url, opts = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}
function showSpinner(on) {
  document.getElementById("spinner").classList.toggle("hidden", !on);
}

init();
