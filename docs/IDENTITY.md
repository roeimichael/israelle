# Identity & lifecycle

How IsraelE tracks who's playing, and what happens on connect / disconnect /
reconnect. The goal: one canonical identity per real person, even when they
hop devices, sign out, or play as a guest first.

## Storage

### Browser (localStorage)
| Key | Set when | Cleared when |
|---|---|---|
| `israelle_player_id` | first visit / after fresh-guest reset | `התנתק` button, `התחל אורח חדש` button |
| `israelle_player_name` | name prompt accepted | same as above |
| `israelle_sound` | sound toggle | never |
| `israelle_seen_howto` | first howto dismissed | never |

`israelle_player_id` is a UUID v4 generated client-side. It's the *current*
local identity — the row in `players` this browser is acting as. It can be
swapped at runtime when sign-in reveals a different canonical row.

### Supabase (server)
```
auth.users           ← Supabase Auth (Google OAuth)
  id (uuid)          ← the google identity, immutable across sessions
  email, raw_user_meta_data { full_name, avatar_url, ... }

public.players       ← one row per person who has ever played
  id (uuid, pk)              ← matches israelle_player_id in some browser
  name (text 1..32)          ← display name
  created_at                 ← first time we saw this player
  auth_user_id (uuid, unique, fk → auth.users.id, nullable)
    ↑ when set, this player row IS owned by that Google account.
      UNIQUE means: at most one player row per Google account.

public.games         ← one row per player per day
  player_id (fk)             ← who played
  puzzle_date (fk)           ← which daily puzzle
  total_score (0..1000)      ← sum of round_scores
  UNIQUE (player_id, puzzle_date)

public.guesses       ← one row per round
  PK (game_id, round_idx)
```

### Why `auth_user_id` is `UNIQUE` on `players`
Without it, a person could end up with multiple `players` rows linked to
the same Google account (one per device they signed in from). That fragments
history and breaks the one-shot-per-day rule. With it, the second device's
sign-in is forced to *re-use* the existing player row, not create a new one.

## State machine

There are three identity states the client can be in. Sign-in / sign-out
transitions between them.

```
                ┌─────────────────┐
                │      GUEST      │   no session
                │  player_id is   │   players.auth_user_id IS NULL
                │  anon-only      │
                └────────┬────────┘
       sign in /         │           ↑ sign out
       OAuth callback    │           │ + reset-to-guest
                         ▼           │
                ┌─────────────────┐  │
                │     CLAIMING    │  │   transient, lives in /api/me/today
                │ "is there an    │  │
                │  existing       │  │
                │  player row for │  │
                │  this auth_id?" │  │
                └────────┬────────┘  │
                         │           │
        ┌────────────────┼───────────┘
        │                │
   yes (rebind)     no (claim)
        │                │
        ▼                ▼
   ┌─────────────────────────────┐
   │           AUTHED            │   session present
   │  player_id matches the      │   players.auth_user_id = session.user.id
   │  one row that has           │
   │  auth_user_id = session.id  │
   └─────────────────────────────┘
```

## Lifecycle events

### Connect (sign in)
1. Supabase fires `SIGNED_IN`. Frontend calls `resyncForAuth()`.
2. `loadTodayIntoState()` re-runs. Because `session?.access_token` is now
   set, it hits **`GET /api/me/today`** (Bearer JWT) instead of the
   anon-identity endpoint.
3. Backend `me_today`:
   - Verifies JWT → `auth_user_id`.
   - `SELECT id, name FROM players WHERE auth_user_id = $1`.
   - If a player row exists: returns its `id`. Frontend rebinds
     `localStorage.israelle_player_id` to it. If that player already has
     today's game, end-card is shown immediately.
   - If no player row exists: returns `player_id: null`. The current
     localStorage guest id stays — it will be "claimed" on the next guess.
4. On the next call to `/api/today/guess` while signed in, the backend
   upserts the guest's player row with `auth_user_id = session.user.id`,
   transferring ownership. The `UNIQUE(auth_user_id)` constraint guarantees
   we can never end up with two player rows for the same Google account.

### Disconnect (sign out)
Two paths exist intentionally:

| Trigger | What happens |
|---|---|
| `התנתק` button (in chip) | `sb.auth.signOut()` → wipe localStorage → reload. DB row stays. |
| `התחל מחדש כאורח חדש` link on end-card | Same as above, even if there's no session. Escape hatch. |

The reload is what guarantees a clean state — there's no half-state where
the UI still shows the old player's score but the session is gone.

### Reconnect (sign back in)
Same as Connect. The unique `auth_user_id` means the player row created
during the previous session is found, localStorage rebinds, and any prior
today-game shows up on the end-card. Nothing is lost.

## Edge cases handled

- **Multiple devices, same Google account.** Each device starts as a guest.
  First device that signs in claims the player row. Other devices that sign
  in get the same canonical `player_id` via the rebind step.
- **Guest plays half a game, then signs in.** Backend update sets
  `auth_user_id` on the existing guest row → game stays attached.
- **Guest plays a full game, then signs in for the first time.** End-card
  was shown under the guest id. On sign-in, the frontend sends the guest
  `player_id` as a `?hint=` to `/api/me/today`. If this account has no
  claimed player row yet, the backend issues an `UPDATE players SET
  auth_user_id = $auth WHERE id = $hint AND auth_user_id IS NULL` (forwarded
  with the user's JWT, so RLS permits the claim). The guest player row
  becomes the user's canonical row and their finished game is now part of
  their account history.
- **Sign in, sign out, sign in again** (the bug we hit): the second sign-in
  resolves back to the same player row by `auth_user_id`, end-card returns.

## Edge cases *not* handled (intentional)

- **Anonymous game history across browsers.** Anonymous players are tied to
  one browser's localStorage. There's no recovery mechanism if you clear
  localStorage as a guest — by design, you become a new person.
- **Claiming a guest game from a *different* browser into your account.**
  We don't try to merge histories beyond what `auth_user_id` already
  connects.

## RLS recap

Brief — full policies in `supabase/migrations/...`:
- `players_insert`: anon may insert with `auth_user_id IS NULL`; authed user
  may insert with `auth_user_id = auth.uid()`.
- `players_update`: row's `auth_user_id` must be NULL or match `auth.uid()`.
  Backend forwards the user JWT (via `supa.update(..., jwt=user_jwt)`) so
  this check passes for legitimate claims.
- `games_insert`: total_score in [0, 1000]; if the player has an
  `auth_user_id`, the inserter must match it (prevents foreign claim).
- `guesses_insert`: shape bounds (base_score 0..100, round_idx 0..5, etc).

## Backend endpoints involved

| Endpoint | Identity source | Purpose |
|---|---|---|
| `GET /api/today` | none | Today's puzzle list (no answers) |
| `GET /api/today/me?player_id=…` | localStorage id (query param) | Guest's today state |
| `GET /api/me/today` | JWT | Authed user's today state via `auth_user_id` |
| `POST /api/today/guess` | JWT (optional) + body.player_id | Record a guess; on auth, claim the player row |
| `GET /api/me/history` | JWT (required) | Past games under this auth account |
| `GET /api/me/stats?player_id=…` | localStorage id | Streak + histogram (works for guests too, but UI hides it) |
| `GET /api/leaderboard?date=…` | none | Public daily top |
