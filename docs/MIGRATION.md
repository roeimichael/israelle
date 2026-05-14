# Migration: Render → Railway + Vercel + Cloudflare

Goal: backend on Railway (paid hobby), frontend on Vercel, domain on Cloudflare. Single public origin (e.g. `israelle.com`), API path-prefixed.

## Architecture after migration

```
Browser
  → https://israelle.com/*           (Vercel — static frontend)
  → https://israelle.com/api/*       (Vercel rewrite → Railway)
                                     → https://<svc>.up.railway.app
                                     → Supabase (DB + Auth)
```

Vercel rewrites `/api/*` to Railway. Frontend keeps relative `/api/*` paths — no CORS needed in browser; CORS middleware on backend is still kept loose for direct hits and local dev.

---

## 1. Backend → Railway

### 1a. New project from GitHub
1. railway.app → New Project → Deploy from GitHub repo → pick `israelle`.
2. Railway auto-detects `railway.json` (already committed) → Nixpacks builder, start command:
   `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### 1b. Env vars (Service → Variables)
| Key | Value | Notes |
|---|---|---|
| `SUPABASE_URL` | `https://<project>.supabase.co` | copy from Supabase project settings |
| `SUPABASE_KEY` | `<publishable / anon key>` | publishable key, NOT service-role |
| `ALLOWED_ORIGINS` | `https://israelle.com,https://www.israelle.com,https://<preview>.vercel.app` | comma-separated, no trailing slash |
| `PYTHON_VERSION` | `3.11.9` | optional, Nixpacks default usually fine |

### 1c. Generate public URL
Service → Settings → Networking → "Generate Domain" → `<svc>.up.railway.app`. Test:
```
curl https://<svc>.up.railway.app/api/today
```

### 1d. Health check
`railway.json` already pings `/api/israel-border`. Confirm green in Deployments.

---

## 2. Frontend → Vercel

### 2a. Import project
1. vercel.com → Add New → Project → import `israelle` repo.
2. Framework Preset: **Other** (no build).
3. Root Directory: leave as repo root (`./`).
4. Build & Output: leave empty — Vercel serves static files from repo.

### 2b. Patch `vercel.json`
Open `vercel.json` and replace `REPLACE-WITH-RAILWAY-URL` with the Railway domain from step 1c (no `https://` in the placeholder string — the destination already has it):

```json
{ "source": "/api/:path*", "destination": "https://<svc>.up.railway.app/api/:path*" }
```

Commit + push. Vercel auto-deploys.

### 2c. Verify
- `https://<project>.vercel.app/` → game loads.
- DevTools Network: `/api/today` → 200, served via Vercel edge, hops to Railway.

---

## 3. Domain → Cloudflare

### 3a. Buy
Cloudflare Registrar → search `israelle.com` (or your TLD) → checkout. ~$10/yr.

### 3b. Add to Vercel
Vercel project → Settings → Domains → Add `israelle.com` + `www.israelle.com`.
Vercel will display required DNS records (A `76.76.21.21` for apex, CNAME for `www`).

### 3c. DNS in Cloudflare
Cloudflare Dashboard → DNS → add records exactly as Vercel showed. **Proxy status = DNS only (grey cloud)** for Vercel — Vercel handles TLS and proxying through Cloudflare orange-cloud causes redirect loops.

### 3d. SSL/TLS mode in Cloudflare
Cloudflare → SSL/TLS → Overview → set to **Full**. (Not Flexible — Vercel demands HTTPS to origin.)

### 3e. Wait + verify
DNS propagation: 1–30 min. Then `https://israelle.com/` should serve the game.

---

## 4. Supabase auth redirect URLs

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://israelle.com`
- **Redirect URLs** (add all that apply):
  - `https://israelle.com/**`
  - `https://www.israelle.com/**`
  - `https://<project>.vercel.app/**` (preview deploys)
  - `http://localhost:8000/**` (local dev)

---

## 5. Google OAuth console

console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client used by Supabase:

**Authorized JavaScript origins:**
- `https://israelle.com`
- `https://www.israelle.com`
- `https://<supabase-project>.supabase.co`
- `http://localhost:8000`

**Authorized redirect URIs:**
- `https://<supabase-project>.supabase.co/auth/v1/callback`

(That is the only redirect Google needs — Supabase forwards back to your Site URL itself.)

---

## 6. Decommission Render
After 24h of stable Cloudflare traffic:
1. Render dashboard → suspend `israelle` service.
2. After another week → delete.

`render.yaml` can stay in the repo or be deleted — Railway ignores it.

---

## 7. Smoke test checklist
- [ ] `https://israelle.com/` loads, splash → start card
- [ ] Guest play through 6 rounds → end card
- [ ] Google sign-in → redirected back to `israelle.com`, user chip shows
- [ ] Signed-in play persists; reload returns to end card
- [ ] `/api/leaderboard?date=...` shows today's players
- [ ] Mobile (real device, not emulated) reaches site over 4G/5G

---

## Rollback
DNS in Cloudflare → point apex/www CNAME back to Render. Re-enable Render service. Total downtime ~ 5 min after DNS propagates.
