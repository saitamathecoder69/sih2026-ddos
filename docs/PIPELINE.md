# Pipeline — How LakshmanRekha Works

Source: SIH 2026 submission deck, "Technical Approach" and "Feasibility and Viability" slides. This describes the **target architecture** the team pitched. See [`TECH-STACK.md`](TECH-STACK.md) for what of this actually exists in code today, and [`FEATURES.md`](FEATURES.md) for per-feature implementation status.

## The six-stage architecture

```
1. TRAFFIC SOURCES        2. CLOUD PROTECTION       3. PROTECTED APPLICATION
   Legitimate Users   ─┐      CDN/Reverse Proxy  ─┐     Load Balancer
   Internet            ├──▶   WAF                  ├──▶ Auto-Scaled App Servers
   Attackers/Botnet    ┘      Rate Limiting/       ┘     Database
                               Bot Control

4. DUAL-PLANE TELEMETRY & HYBRID DETECTION
   Edge Logs (WAF/CDN/LB) ──┐
                            ├──▶ Unified Feature Extraction ──▶ Rule-Based Detection ──┐
   Internal East-West Logs ─┘                                  ML Anomaly Model      ─┼──▶ Risk Score (0–100)
                                                                                        ┘

5. AUTOMATED MITIGATION & SELF-HEALING          6. MONITORING DASHBOARD
   0–30  Normal      → Allow Traffic                Time to Detect (TTD)
   31–70 Suspicious  → Challenge / Rate-Limit        Time to Recover (TTR)
   71–100 Malicious  → Block + Isolate + Reroute     Legit Traffic Served %
                        to Warm Replica              Attack Status
   (recovers)        → Auto-Rollback: Service Restored
```

### Stage 1 — Traffic sources

Three traffic populations feed the system: legitimate users, general internet traffic, and attackers/botnets. The system must distinguish between these without knowing in advance which is which.

### Stage 2 — Cloud protection (edge)

All traffic passes through a **CDN/reverse proxy** first, then a **WAF**, then **rate limiting / bot control**. This is the first filtering layer — cheap, fast checks that catch obviously malicious traffic before it reaches application infrastructure.

### Stage 3 — Protected application

Traffic that clears the edge reaches a **load balancer**, which distributes it across **auto-scaled application servers**, backed by a **database**. This is the resource the whole system exists to protect.

### Stage 4 — Dual-plane telemetry & hybrid detection

This is the analytical core:

- **Dual-plane telemetry** — two independent log/metric streams are collected: **edge logs** (from the WAF, CDN, and load balancer — visibility into what's hitting the front door) and **internal east-west flow logs** (server-to-server traffic inside the cloud — visibility into what's happening *after* traffic is let in, including compromised internal workloads attacking each other).
- Both streams feed a **unified feature-extraction** step, producing a consistent set of features regardless of which plane they came from.
- **Hybrid detection engine** — those features are scored by two complementary methods in parallel:
  - **Rule-based detection** — deterministic thresholds (e.g., request rate > 20k/s sustained, single ASN > 60% of traffic, single endpoint > 80% of traffic, 3σ deviation over a 30-second window, known bad UA/fingerprint match).
  - **ML anomaly model** — a learned model catching patterns rules can't enumerate in advance, particularly attacks that mimic legitimate traffic (low-and-slow, entropy-based).
- Both feed into a single **risk score (0–100)**.

### Stage 5 — Automated mitigation & self-healing

The risk score drives a **three-tier response**, not a binary block/allow:

| Score | Band | Response |
|---|---|---|
| 0–30 | Normal | Allow traffic through unchanged |
| 31–70 | Suspicious | Challenge the client (e.g., JS challenge) or apply rate limiting |
| 71–100 | Malicious | Block the source, isolate the affected path, and reroute legitimate traffic to a **warm standby replica** |

After a malicious episode subsides, the system **auto-rolls back** — mitigation rules are lifted and traffic returns to the normal path, restoring full service rather than leaving restrictive rules in place indefinitely.

### Stage 6 — Monitoring dashboard

Everything above is made visible through four headline metrics: **Time to Detect (TTD)**, **Time to Recover (TTR)**, **% of legitimate traffic served** (i.e., how many real users were *not* impacted), and current **attack status**.

## The 10-step user-journey view

The deck's "Feasibility and Viability" slide walks the same pipeline from a single request's point of view, plus a feedback loop:

1. **User accesses website** — a user opens the site/app.
2. **Request enters internet** — the request travels over the public internet.
3. **Edge protection** — traffic passes through CDN, WAF, and rate limiting at the edge.
4. **Protected application** — clean traffic reaches the load balancer and application servers.
5. **Telemetry collected** — logs and metrics are collected in real time from all layers.
6. **Traffic analyzed** — telemetry is processed and features are extracted.
7. **Threat assessment** — the hybrid detection engine evaluates traffic and computes a risk score.
8. **Risk score decision** — traffic is classified and routed per the three-tier table above.
9. **Automatic recovery** — the system stabilizes, reroutes traffic, heals unhealthy instances, and restores service.
10. **Monitor, learn & improve** — the system continuously monitors, logs events, and learns from patterns to improve protection.

A **monitoring & feedback loop** closes the cycle: insights from step 10 feed back into step 3, updating edge-protection rules over time.

## Mapping the pipeline onto this repository's pages

| Pipeline stage | Dashboard page(s) |
|---|---|
| Traffic sources / live traffic | `LiveTrafficPage`, `TrafficSourceTable` |
| Detection (rules + ML + risk score) | `DetectionPage`, `DetectionEngine`, `RiskGauge` |
| Telemetry / feature extraction | `TelemetryPanel` (15 tracked features) |
| Mitigation | `MitigationPage`, `MitigationPanel` |
| Self-healing / recovery | `RecoveryPage`, `RecoveryPanel`, `ServerHealthCard` |
| Monitoring dashboard | `OverviewPage`, `SystemHealthPage`, `LogsPage`/`EventFeed` |
| Attack simulation (for demos) | `AttackSimulatorPage`, `AttackTimeline` |
| Architecture explainer | `ArchitecturePage` (diagram of this same 6-stage flow) |
| User-journey explainer | `UserFlowPage` (diagram of the 10-step flow above) |
| Real-data grounding (added feature) | `DatasetsPage` — see [`TECH-STACK.md`](TECH-STACK.md#dataset-driven-replay-in-progress-vihaan-branch) |

As noted in [`TECH-STACK.md`](TECH-STACK.md), every one of these pages is currently populated by the **client-side simulation engine** (`src/sim/engine.ts`), not by a real edge/WAF/ML pipeline — the mapping above describes intended *conceptual* correspondence, not that a real backend is executing these steps yet.

## Feasibility notes (from the deck)

**Why the team believes this is buildable:**

- **Economic** — every component in the target stack is open-source (Envoy, ModSecurity, RabbitMQ, Prometheus, Grafana) running on scalable cloud infrastructure, keeping cost low.
- **Technical** — every individual piece (reverse proxy, WAF, rate limiting, load balancing, real-time telemetry, rule-based detection, ML anomaly detection) is proven, off-the-shelf technology; the novelty is in combining them into one dual-plane, risk-scored pipeline.
- **Operational** — centralized monitoring gives one place to see traffic, risk score, attack status, blocked requests, and application health.

**Known risks and how the team plans to address them:**

| Risk | Mitigation strategy |
|---|---|
| False positives block legitimate users during real traffic spikes | Hybrid detection (rules + ML) rather than a single aggressive threshold |
| Attackers evolve IPs/endpoints/behavior to evade static rules | Combine rule results with ML predictions into one continuous risk score rather than relying on any single signal |
| TLS encryption limits payload-level inspection | Rely on traffic *metadata* (rate, timing, entropy, connection patterns) rather than payload inspection alone |
| Large-scale attacks exhaust resources before mitigation kicks in | Layered response (rate-limit → challenge → block/isolate/reroute) scaled to severity, plus auto-scaling and health-checked failover |

## Research grounding

The detection approach is backed by four groups of published research the team cited:

| Focus area | Key idea |
|---|---|
| Core AI/ML detection methodology | Hybrid ML-based detection combining Random Forest + XGBoost, with feature engineering informed by an ML/DL taxonomy for DDoS detection |
| Low-rate & application-layer DDoS detection | Detecting "low-and-slow" attacks that stay under volumetric thresholds, using AI-based detection tuned for cloud environments |
| Cloud & dual-plane attack protection | DDoS detection that covers *both* external traffic and internal (compromised-workload) traffic inside cloud infrastructure |
| Real-time mitigation & adaptive defense | Lightweight, low-latency online defense mechanisms that minimize detection-to-response delay |

(See the submission deck's "Research and References" slide for the specific papers — Three-Tier Defense (Nature), Hybrid ML Detection (PMC), ML-Based Detection Survey (Wiley), LRDADF (ScienceDirect), Feature Engineering & ML (Sensors/PMC), E-Government Cloud DDoS Detection (ScienceDirect), IoT Attack Detection & Moving Target Defense (PMC), and SDN-Defend (PMC/Sensors).)
