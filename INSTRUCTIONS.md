# Setup Instructions — What I Need From You

This turns LakshmanRekha from a frontend-only simulator into a real, if small, working pipeline: real HTTP requests hit a real backend, get scored by real rate-limit/rule logic plus a real AI call, get stored in a real database, and push to the dashboard in real time. Everything below is **free tier, no credit card required** unless a step says otherwise.

Do these in order. Each one produces a value you paste into a `.env` file — nothing gets typed into code.

## 1. Gemini API key (the "ML anomaly model")

**Important distinction:** your Gemini **Pro subscription** (gemini.google.com, the chat app) does **not** by itself grant API access or extra API quota. The API is a separate product with its own free tier, unrelated to whether you pay for the consumer app. You still don't need a credit card for this — the free tier is genuinely free, just rate-limited (currently ~15 requests/minute, 1500/day on `gemini-2.0-flash` — plenty for a demo).

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with the same Google account as your Pro subscription (doesn't matter which account, but keeping it together is simpler).
3. Click **"Create API key"** → choose "Create key in new project" if asked.
4. Copy the key (starts with `AIza...`).

→ This becomes `GEMINI_API_KEY` in `server/.env`.

## 2. Supabase project (database + real-time push — free forever tier)

This project already had `@supabase/supabase-js` sitting in `package.json` unused — this is where it gets used, as both the "time-series DB" and the "message queue" the pitch deck calls for.

1. Go to **https://supabase.com** → sign up (GitHub login is fastest) → **New Project**.
2. Pick any name/region, set a database password (save it somewhere — you likely won't need it again since we use the API keys below, not a direct DB connection).
3. Wait ~2 minutes for the project to provision.
4. In the project, go to **Settings → API**. Copy three values:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **`anon` `public` key** — safe for the frontend
   - **`service_role` key** — **backend only, never expose this in frontend code or commit it**
5. Go to **SQL Editor**, paste the contents of `server/db/schema.sql` (already written for you in this repo), and run it. This creates the `traffic_events` and `risk_snapshots` tables the backend writes to.
6. Go to **Database → Replication** and enable replication on both new tables (this is what makes Supabase Realtime push updates to the dashboard the instant a row is inserted).

→ These become `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend) and `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend) respectively.

## 3. Render account (hosts the backend — free tier, spins down when idle)

1. Go to **https://render.com** → sign up (GitHub login is fastest).
2. **New → Web Service** → connect this GitHub repo.
3. Render will detect `render.yaml` in the repo root and pre-fill the settings (root directory `server`, build command, start command). Confirm and click **Create Web Service**.
4. Once created, go to the service's **Environment** tab and add these (values from steps 1–2 above):
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGIN` — set this to your Vercel frontend URL once you know it (step 5), e.g. `https://sih2026-ddos.vercel.app`
5. Free-tier note: the service **sleeps after 15 minutes of no traffic** and takes ~30–50 seconds to wake on the next request. Fine for a demo; mention it if you're presenting live so the first request's delay doesn't look broken.
6. Copy the service's public URL (`https://your-service-name.onrender.com`) — you'll need it in step 5.

→ No new `.env` values here; this is where the backend's env vars actually live (Render's dashboard **is** the "secrets management" piece from the pitch deck — nothing to install).

## 4. Vercel environment variables (frontend)

You're presumably already deploying the frontend to Vercel (the live URL in the pitch deck). Add these in **Vercel → Project → Settings → Environment Variables**:

- `VITE_SUPABASE_URL` (from step 2)
- `VITE_SUPABASE_ANON_KEY` (from step 2)
- `VITE_BACKEND_URL` — the Render URL from step 3

Redeploy after adding them (Vercel doesn't apply new env vars to already-built deployments).

## 5. GitHub Actions (CI — no keys needed)

Already wired up in `.github/workflows/ci.yml`: runs typecheck/test/build on every push, for both the frontend and the new `server/`. Nothing to configure — it just needs the repo to be on GitHub, which it already is.

If you later want CI to also *deploy* on merge to `main`, Render and Vercel both auto-deploy on push once connected (step 3/4) — you don't need GitHub Actions to do this part.

## Local development

To run the backend on your own machine instead of waiting on Render:

```bash
cd server
cp .env.example .env      # fill in the values from steps 1-2
npm install
npm run dev                # starts on http://localhost:8787
```

Then in the frontend's `.env` (repo root, not `server/`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_BACKEND_URL=http://localhost:8787
```

## What you get once all keys are in place

- A real `/ingest` endpoint on the backend that accepts traffic events, runs them through real rate-limiting and rule-based detection, calls Gemini for an anomaly-confidence score on suspicious batches, and writes the result to Supabase.
- A traffic generator script (`server/scripts/generate-traffic.mjs`) you can run to throw realistic legitimate + attack-shaped load at your own backend, so the dashboard has something real to show.
- The dashboard's existing "Datasets" pattern gets a sibling: a **Live Backend** mode, alongside "Built-in Simulation" and the dataset-replay modes, that subscribes to Supabase Realtime and shows genuinely live data instead of anything generated in the browser.

## What is still not real (honest gaps)

- No actual reverse proxy / CDN / WAF product sits in front of the backend — Render's own edge terminates TLS, but there's no ModSecurity or Envoy. The rule engine in `server/src/ruleEngine.ts` re-implements the *logic* (rate thresholds, IP concentration, endpoint flooding) in plain code, which is real enforcement, just not that specific product.
- No multi-cloud deployment (AWS/GCP/Docker) — single Render service. Swapping this later means containerizing `server/` (a `Dockerfile` would work on Render, AWS App Runner, or Google Cloud Run's free tiers with no code changes).
- The Gemini call classifies a *summary* of recent traffic features, not raw packets — there's no real packet capture or eBPF/Suricata layer feeding it.
