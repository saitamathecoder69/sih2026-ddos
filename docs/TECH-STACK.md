# Tech Stack — LakshmanRekha

Source: SIH 2026 submission deck (Team Stardust Crusaders, DJSW_96, PS ID DJS_26_SW_05).

This document separates the **target architecture** pitched in the submission deck from what is **actually implemented** in this repository today, so the gap is explicit rather than assumed.

## Target stack (from the submission deck)

The deck's technical-approach slide lists this stack for the full production system:

| Layer | Technology | Role |
|---|---|---|
| Reverse proxy / edge | Envoy (or equivalent reverse proxy) | Terminates traffic at the edge, front door for CDN/WAF |
| Web Application Firewall | ModSecurity | Rule-based request filtering, rate limiting, bot control |
| Anomaly detection | Python / ML model (Random Forest, XGBoost per the research references) | Traffic entropy and timing analysis to catch attacks that blend in with legitimate traffic |
| Async processing | RabbitMQ (message queue) | Decouples telemetry ingestion from detection/mitigation processing |
| Metrics storage | Prometheus (time-series DB) | Stores traffic, risk-score, and system-health metrics over time |
| Visualization | Grafana | Operator-facing dashboards built on top of Prometheus data |
| Delivery | CI/CD pipeline | Automated build/test/deploy |
| Config/credentials | Secrets management | Keeps API keys, DB credentials, etc. out of source |

Additional infrastructure named in the explanation slides but not in the stack bar itself:

- **NGINX** — access logs for web traffic (external plane).
- **eBPF / Suricata** — kernel-level and network-level visibility into internal, server-to-server ("east-west") traffic.
- **CDN** — first hop for public traffic before it reaches the WAF.
- **Cloud targets**: AWS, GCP, and Docker containers — the pitch explicitly calls out avoiding vendor lock-in to any one provider.

## What is actually implemented (this repo)

This repository (`sih2026-ddos`) is the **frontend prototype** referenced by the deck's own disclaimer: *"This is basic prototype of application, more changes to be added."* It does not yet contain any of the backend/infra pieces above. What exists:

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 18 + TypeScript (strict) | Single-page app |
| Build tool | Vite 5 | Dev server + production build |
| Styling | Tailwind CSS | Dark-themed dashboard UI |
| Charts | Recharts | Traffic history area chart |
| Icons | lucide-react | All dashboard iconography |
| Testing | Vitest | Added for the dataset-replay logic (`src/sim/replay.ts`) |
| Deployment | Vercel | Live at the URL in the deck |
| "Backend" | None — client-side simulation | See below |

There is **no reverse proxy, WAF, ML model, message queue, time-series DB, or CI/CD pipeline** in this repo yet. Instead, all dashboard numbers are produced by a client-side simulation engine:

- `src/sim/engine.ts` — procedurally generates traffic, server-health, telemetry-feature, and event-log values based on a selected "mode" (`normal`, `spike`, `httpflood`, `ddos`, `mitigating`, `recovering`, `restored`).
- `src/sim/SimContext.tsx` — drives a 1-second tick loop and exposes the simulated state to every page via React context.
- A scripted **demo mode** auto-plays through the attack lifecycle (Normal → Spike → DDoS → Mitigation → Recovery) for presentation purposes.

### Dataset-driven replay (in progress, `Vihaan` branch)

A feature layered on top of the simulator lets it run on **real public benchmark datasets** instead of purely synthetic numbers, as a stand-in for the real ML/telemetry pipeline until the backend exists:

- `src/sim/replay.ts` — samples real records from a loaded dataset at a benign/attack blend chosen by the current mode, and derives the same `Profile` shape the synthetic engine produces.
- `scripts/prepare-dataset.mjs` — converts raw dataset CSVs (NSL-KDD, UNSW-NB15, and — via the same script — the CIC datasets once downloaded) into small JSON bundles (`public/data/datasets/*.json`), evenly sampled across the source file so all attack categories are represented.
- Real bundles currently shipped: **NSL-KDD** and **UNSW-NB15** (600 benign + 600 attack records each). CICDDoS2019, CIC-IDS2017, and CSE-CIC-IDS2018 are supported by the script but require a manual multi-GB download the automation could not perform; CAIDA DDoS 2007 is deliberately never bundled (restricted licence).

This is documented in full in [`docs/superpowers/specs/2026-08-17-dataset-driven-simulation-design.md`](superpowers/specs/2026-08-17-dataset-driven-simulation-design.md) and [`docs/superpowers/plans/2026-08-17-dataset-driven-simulation.md`](superpowers/plans/2026-08-17-dataset-driven-simulation.md).

### Real backend (`server/`, `Vihaan` branch) — free-tier stack

Unlike everything above, this is not a simulation: it is a small but real Node/Express service that receives actual HTTP requests, runs real rate-limiting and rule-based detection against them, and (once the free API keys in [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) are supplied) calls a real AI model and writes to a real database.

| Deck's stack item | Free-tier substitution | Why |
|---|---|---|
| Reverse proxy / CDN | Render (backend) + Vercel (frontend) edges | Both already terminate TLS and CDN-front their services on the free tier — no separate product needed |
| WAF (ModSecurity) | `server/src/ruleEngine.ts` — an in-memory sliding-window rate limiter plus rule checks (request rate, endpoint concentration, repeated user-agent, known automation signatures) | Genuinely enforced against real request timing/IP/UA, not a canned number — just not the ModSecurity product specifically |
| Python / ML anomaly model | `server/src/gemini.ts` — calls the Gemini API (`gemini-2.0-flash`, free tier via Google AI Studio) with a compact feature summary when the rule engine already flagged something | A real model call, but not a trained classifier — see the honest caveat in INSTRUCTIONS.md |
| Message queue (RabbitMQ) + time-series DB (Prometheus) | Supabase — one free Postgres project (`traffic_events` table) with Realtime enabled | The `@supabase/supabase-js` dependency was already sitting unused in `package.json`; one free service covers both roles |
| Grafana | The existing React dashboard | Purpose-built and already done — no reason to stand up a second, generic dashboard |
| CI/CD | `.github/workflows/ci.yml` (GitHub Actions, free minutes) | Typechecks/builds both the frontend and `server/` on every push |
| Secrets management | Render + Vercel environment variables | Built into both platforms' free tiers, nothing extra to install |

**Verified working locally** (no Gemini/Supabase keys required to run — both degrade gracefully when unconfigured):

```
$ curl -s -X POST http://localhost:8787/ingest -d '{"endpoint":"/api/login","method":"GET","userAgent":"python-requests/2.31","bytes":500,"simulatedSourceIp":"203.0.113.99"}' [x45 from one IP]
{"sourceIp":"203.0.113.99","endpoint":"/api/login","ruleScore":75,
 "rulesTriggered":["High request rate from single source (45 in 10s)",
                   "Repeated identical user-agent from one source (45x)",
                   "Known automation user-agent under load"],
 "mlSource":"rules-only","riskScore":75,"classification":"MALICIOUS","action":"BLOCK"}
```

Full setup (the free API keys and account signups needed to turn on the Gemini and Supabase pieces) is in [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) at the repo root.

## Deployment status check

The live deployment at the URL in the deck (`https://sih2026-ddos.vercel.app/`) currently serves the `main` branch, which has only the project rename (SentinelMesh → LakshmanRekha) applied — it still carries the original bolt.new scaffolding (the `og:image`/`twitter:image` meta tags in `index.html` still point at `bolt.new`), and it does **not** yet include the Datasets page or the dataset-replay feature described above. Those live only on the `Vihaan` branch pending merge.

## Gap summary

| Deck promises | Repo has today |
|---|---|
| Real reverse proxy / WAF / rate limiting | ✅ Real, on `Vihaan`: `server/src/ruleEngine.ts` enforces rate limiting and rule-based detection against actual requests |
| Real ML anomaly model | 🚧 Real API call (Gemini) wired up and working when a key is supplied; not a trained classifier. Dashboard UI itself is still simulated pending frontend integration |
| Real NGINX / eBPF / Suricata telemetry | ⛔ Still simulated — the new backend sees HTTP-level requests, not raw packets/kernel-level flow |
| Prometheus + Grafana monitoring | 🚧 Real storage (Supabase Postgres) wired up; the React dashboard doesn't read from it yet — still shows only the in-browser simulation |
| Multi-cloud (AWS/GCP/Docker) deployment | 🚧 Single Render service (free tier); documented Docker upgrade path in INSTRUCTIONS.md, not yet containerized |
| CI/CD pipeline | ✅ `.github/workflows/ci.yml` — typechecks/builds frontend and backend on every push |

Legend: ✅ real and working · 🚧 partially real, integration incomplete · ⛔ still simulated/not started. See [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) for what's needed to finish the 🚧 rows.

This is expected for a hackathon-stage prototype and matches the deck's own framing — it is listed here so the next engineering phase (building the real backend) has a precise starting line.
