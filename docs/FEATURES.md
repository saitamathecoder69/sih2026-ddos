# Expected Features — LakshmanRekha

Source: SIH 2026 submission deck (Team Stardust Crusaders, DJSW_96). Each feature is tagged with its current status in this repository:

- **✅ Simulated** — the dashboard visibly demonstrates this behavior today, driven by the client-side simulation engine (and, where noted, real dataset records via replay).
- **🚧 Partial** — some UI/data-shape exists but the real mechanism behind it does not.
- **⛔ Not started** — pitched in the deck, no corresponding code yet.

## 1. Two-Way (Dual-Plane) Traffic Monitoring

> "Uses NGINX logs for web traffic and eBPF/Suricata inside the cloud to catch both public floods and internal server attacks."

- Monitor external traffic (public internet → edge) — **✅ Simulated** (`LiveTrafficPage`, `TrafficSourceTable`, traffic history chart).
- Monitor internal, server-to-server ("east-west") traffic — **⛔ Not started**. The current dashboard has one traffic plane (external); nothing models internal cloud-workload-to-workload requests separately.
- Real NGINX / eBPF / Suricata log ingestion — **⛔ Not started**.

## 2. Smart AI Detector

> "Analyzes traffic entropy (chaos in request patterns) and timing to spot sneaky bots hiding within legitimate traffic."

- Risk score (0–100) with Normal/Suspicious/Malicious bands — **✅ Simulated** (`RiskGauge`, `state.riskScore`, `state.threatLevel`).
- Per-feature telemetry (request rate, unique IPs, IP concentration, error rate, packet rate, geographic distribution, new-IP ratio, UA similarity, etc.) — **✅ Simulated** (`TelemetryPanel`, 15 tracked features in `src/sim/types.ts`).
- Rule-based detection engine (high request rate, IP concentration, endpoint flooding, repeated spikes, known-bad UA/fingerprint) — **✅ Simulated** (`DetectionEngine` component, `defaultRules()` in `engine.ts`).
- ML anomaly model with confidence scores (behavior analysis, traffic anomaly detection, combined feature patterns, unknown-attack/zero-day detection) — **🚧 Partial**. The UI shows four "model" entries with confidence percentages, but these are hand-tuned constants per attack mode, not the output of a trained classifier. On the `Vihaan` branch, dataset replay substitutes *real record labels* (e.g. `neptune`, `Exploits`) for the attack-type display, which is closer to ground truth but is still label lookup, not inference.
- Real entropy/timing analysis on live traffic — **⛔ Not started**.

## 3. Automatic Security Guard

> "Applies WAF rate-limiting rules and blocks bad IPs the moment a cyberattack is confirmed."

- Visible mitigation actions (WAF rule updated, malicious IPs blocked, rate limit increased, suspicious clients challenged, traffic scrubbing/isolation) — **✅ Simulated** (`MitigationPanel`, `defaultMitigation()`).
- Traffic-source status classification (Legitimate / Suspicious / Blocked) — **✅ Simulated** (`TrafficSourceTable`).
- A real WAF (ModSecurity) actually enforcing these rules — **🚧 Partial**. Not ModSecurity specifically, but `server/src/ruleEngine.ts` (on `Vihaan`) is a real rate-limiter and rule engine enforced against genuine HTTP requests, verified end-to-end with a traffic-generator script — real detection, just not wired into this dashboard's UI yet.

## 4. Self-Healing Backup Route

> "Triggers circuit breakers to instantly shift real users to healthy backup servers if the primary origin is overwhelmed... Verifies that the backup server is healthy before completing traffic redirection."

- Server health cards (CPU, memory, RPS, latency, connections, status incl. `RECOVERING`/`REPLACING`) — **✅ Simulated** (`ServerHealthCard`, `updateServers()`).
- Recovery lifecycle (`recovering` → `restored` mode with a countdown timer) — **✅ Simulated** (`RecoveryPage`, `timeToRecover` in `SimState`).
- Actual circuit breakers / health-checked failover to a real backup replica — **⛔ Not started**.

## 5. Live Incident Dashboard

> "Tracks real-time Time-to-Detect (TTD), Time-to-Recover (TTR), and manages automatic rule rollbacks."

- Event/log feed with severity levels (INFO/WARNING/CRITICAL/ACTION/RECOVERY) — **✅ Simulated** (`EventFeed`, `LogsPage`).
- Attack lifecycle visualization (idle → attack → mitigating → recovering → restored) — **✅ Simulated** (`AttackTimeline`, `lifecyclePhase` in `SimState`).
- Explicit TTD/TTR metrics surfaced as named KPIs — **🚧 Partial**. `timeToRecover` exists as a countdown but there is no dedicated "Time to Detect" measurement displayed yet.
- Automatic rule rollback after traffic normalizes — **✅ Simulated** (mode transition back to `normal` resets mitigation state).

## Innovation & Uniqueness claims

| Claim | Status |
|---|---|
| Automated recovery script (isolate, reroute, verify) vs. just an alert | ✅ Simulated as a mode transition + mitigation action list; not a real script |
| Works across AWS/GCP/Docker without vendor lock-in | ⛔ N/A at this stage — no cloud deployment exists yet, only a static Vercel frontend |
| Protects internal server-to-server traffic, not just the front door | ⛔ Not started (see Dual-Plane Monitoring above) |
| Measures real user uptime, auto-cancels temporary block rules | 🚧 Partial — mitigation actions auto-clear when mode returns to `normal`, but there is no "real user uptime" metric distinct from `appHealth` |

## Risk-based decision model

The deck's core decision logic is fully represented in the current prototype:

| Risk score | Classification | Action | Implementation |
|---|---|---|---|
| 0–30 | Normal | Allow traffic | `mode: 'normal'`, `threatLevel: 'NORMAL'` |
| 31–70 | Suspicious | Challenge / rate-limit | `mode: 'spike'` or early attack states, `threatLevel: 'SUSPICIOUS'` |
| 71–100 | Malicious | Block + isolate + reroute to warm replica | `mode: 'httpflood' \| 'ddos' \| 'mitigating'`, `threatLevel: 'MALICIOUS'` |

## Dataset-driven simulation (feature built beyond the original deck)

Not in the original submission deck, but built on the `Vihaan` branch to make the prototype's numbers traceable to real-world data rather than pure randomness:

- A **Datasets** page (under the sidebar's "Reference" group) listing the six benchmark datasets named in the team's research: CICDDoS2019, CIC-IDS2017, CSE-CIC-IDS2018, CAIDA DDoS 2007, NSL-KDD, UNSW-NB15 — each with description, access type/note, and citation requirement.
- For NSL-KDD and UNSW-NB15 specifically, a "Use in simulator" action that switches the running dashboard from synthetic random data to **real sampled records**, changing attack category names, protocols, services, and telemetry values live across every page — see [`docs/TECH-STACK.md`](TECH-STACK.md) for how this is implemented and what is honestly real vs. scaled/synthesized.

## Feature status legend recap

| Symbol | Meaning |
|---|---|
| ✅ Simulated | Visibly working in the current dashboard demo |
| 🚧 Partial | Some UI/data exists; underlying mechanism is simplified or missing |
| ⛔ Not started | Pitched, not yet built |
