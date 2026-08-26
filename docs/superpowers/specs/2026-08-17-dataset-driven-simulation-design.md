# Dataset-Driven Simulation — Design

**Date:** 2026-08-17
**Status:** Approved, ready for implementation planning
**Project:** LakshmanRekha (`sih2026-ddos`)

## Problem

The dashboard's six public datasets (CICDDoS2019, CIC-IDS2017, CSE-CIC-IDS2018, CAIDA DDoS 2007, NSL-KDD, UNSW-NB15) are currently reference material only — a page of links, access notes, and a static 15-row NSL-KDD table that nothing consumes. Every number the dashboard displays still comes from `Math.random()`-driven constants in `src/sim/engine.ts`.

The goal: let a user **select a dataset and have the entire dashboard run on that dataset's real records**, so the simulator demonstrates behavior grounded in published benchmark data rather than invented numbers.

## Success criteria

1. Selecting a dataset visibly changes attack names, protocols, services, and telemetry values across all pages.
2. Switching between two datasets produces recognizably different dashboards (NSL-KDD shows `neptune`/`smurf`; UNSW-NB15 shows `Exploits`/`Fuzzers`).
3. The existing mode buttons and scripted demo continue to work, now driven by real records.
4. With no dataset selected, behavior is identical to today.
5. Nothing synthetic is ever presented as real dataset data.

## Key architectural finding

Every reading in the app funnels through one 9-field object returned by `profileFor(mode)` (`src/sim/engine.ts:165`), and **no leaf component holds data of its own** — all 12 pages read from `useSim()` and pass slices down as props. Replay therefore plugs in at the engine layer, and the entire UI inherits it without component rewrites.

## Architecture

### Data flow

```text
public/data/datasets/<id>.json   (preprocessed bundle, ~1-2 MB)
        │  fetched once on selection
        ▼
SimContext  ── holds bundle in a ref, exposes setDataset(id | null)
        │
        ▼
engine.tick(state, bundle?)
        │  mode decides benign/attack blend
        ▼
replay.ts  ── sampleRecords → deriveProfile → recordsToSources/Features
        │
        ▼
SimState  ──► all 12 pages (unchanged)
```

### 1. Normalized record shape

Each dataset has entirely different columns (NSL-KDD: 41 features; UNSW-NB15: 45; CIC: ~80). Preprocessing flattens them into one common shape at build time so the engine never branches per dataset:

```ts
interface ReplayRecord {
  label: 'benign' | 'attack';
  attackCat: string;      // 'neptune', 'Syn', 'Exploits', 'Benign'
  proto: string;          // tcp | udp | icmp
  service: string;        // http | dns | ftp_data | '-'
  srcBytes: number;
  dstBytes: number;
  duration: number;
  rate: number;           // packets/sec; adapters normalize to this unit
  errorRate: number;      // 0-1, from serror_rate / connection state
  count: number;          // connection count feature
  srvCount: number;
  uniqueHosts: number;    // dst_host_count / ct_srv_src
}
```

Bundle format (`public/data/datasets/<id>.json`):

```jsonc
{
  "id": "nsl-kdd",
  "name": "NSL-KDD",
  "sourceFile": "KDDTrain+.txt",
  "generatedAt": "2026-08-17T00:00:00Z",
  "benign": [ /* ~600 ReplayRecord */ ],
  "attack": [ /* ~600 ReplayRecord */ ]
}
```

### 2. Label-filtered sampling

The selected dataset decides **which corpus** supplies the numbers; the existing mode buttons decide **which records within it**:

| Mode | benign | attack |
|---|---|---|
| `normal` | 100% | 0% |
| `spike` | 80% | 20% |
| `httpflood` | 25% | 75% |
| `ddos` | 10% | 90% |
| `mitigating` | 30% | 70% |
| `recovering` | 75% | 25% |
| `restored` | 100% | 0% |

New module `src/sim/replay.ts`, all pure functions:

- `sampleRecords(bundle, mode, n): ReplayRecord[]` — draws `n` records at the mode's blend
- `deriveProfile(records, mode): Profile` — aggregates records into the existing 9-field profile
- `recordsToSources(records): TrafficSource[]` — real proto/service/bytes into the sources table
- `recordsToFeatures(records, prev): TelemetryFeature[]` — real values into the 15 telemetry cards

`profileFor` currently returns an **anonymous inline type** (`engine.ts:165-175`). Extract it into a named exported `interface Profile` in `src/sim/types.ts` so `profileFor` and `deriveProfile` share one contract — a prerequisite refactor, not optional.

`profileFor(mode)` gains an optional replay argument. **Replay is purely additive:** when no dataset is selected the existing code path runs untouched, and a failed bundle fetch falls back to it silently.

### 3. State and context

`SimState` gains three fields:

```ts
datasetId: string | null;              // null = built-in synthetic
datasetName: string | null;
datasetStatus: 'synthetic' | 'replay';
```

`SimContext` gains `setDataset(id: string | null)`, which fetches the bundle, stores it in a ref, and updates state. The 1s tick interval is unchanged.

### 4. What is real and what is not

These datasets are *feature-extracted connection records*, not packet captures with addresses and per-second rates. The design is explicit about this:

| Element | Status |
|---|---|
| Attack categories, labels | **Real** — straight from the records |
| Protocol, service, state | **Real** |
| Byte counts, durations, error rates, connection counts | **Real** |
| Benign/attack ratios and distributions | **Real** |
| Aggregate RPS / connection totals | **Scaled** — real ratios mapped onto the dashboard's display magnitude |
| Source IP addresses | **Synthesized** — NSL-KDD and UNSW-NB15 contain no addresses |

`TrafficSourceTable` shows a footnote while replay is active stating that IPs are synthesized and all other columns are real record values. The README documents the scaling decision.

### 5. Preprocessing script

`scripts/prepare-dataset.mjs` — plain Node, no new runtime dependencies.

```bash
node scripts/prepare-dataset.mjs --dataset nsl-kdd --input path/to/KDDTrain+.txt
```

One column-mapping adapter per dataset, balanced sampling (~600 benign + ~600 attack), writes the bundle to `public/data/datasets/`. Handles quoted CSV fields for the CIC exports.

This is what makes the coverage gap tractable: drop a downloaded CIC CSV in, run one command, and that dataset flips from reference-only to replay-ready with no code changes.

### 6. Dataset availability

| Dataset | Replay | Reason |
|---|---|---|
| NSL-KDD | ✅ ships | Public mirror verified, 41 features + labels |
| UNSW-NB15 | ✅ ships | Public mirror verified, 45 columns incl. `attack_cat` |
| CICDDoS2019 | ⚠️ drop-in | Official distribution redirect-gated, CSVs ~20 GB |
| CIC-IDS2017 | ⚠️ drop-in | `MachineLearningCSV.zip` not directly fetchable |
| CSE-CIC-IDS2018 | ⚠️ drop-in | AWS S3 requester-pays |
| CAIDA DDoS 2007 | ❌ never | Restricted licence; must not be redistributed |

`src/data/datasets.ts` gains a `replay: { available: boolean; bundlePath?: string; note?: string }` field. CAIDA is permanently `available: false` — the preprocessing script refuses it by design.

### 7. UI surface

- **Datasets page** — each card gains a `REPLAY READY` / `REFERENCE ONLY` badge and a "Use in simulator" button (disabled when unavailable).
- **Attack Simulator page** — a "Data source" dropdown listing "Built-in simulation" (default) plus available datasets.
- **TopBar** — a persistent "Replaying: NSL-KDD" chip so the active source is never ambiguous.
- **TrafficSourceTable** — the synthesized-IP footnote described above.

### 8. Testing

The project has no test framework today. The replay math (blend ratios, aggregation, scaling) is pure and is exactly the kind of logic that fails subtly during a live demo, so:

- Add Vitest as a dev dependency with a `npm test` script.
- One spec file, `src/sim/replay.test.ts`, covering `sampleRecords` blend ratios, `deriveProfile` aggregation, label filtering, and empty/malformed-bundle handling.

Deliberately not a broad testing initiative — existing untested code stays as it is.

## Error handling

- Bundle fetch fails or returns malformed JSON → log once, fall back to built-in synthetic, leave `datasetStatus: 'synthetic'`.
- Bundle has no records for a required label → fall back to the available label rather than dividing by zero.
- Selecting an unavailable dataset is prevented at the UI layer, and guarded in `setDataset` regardless.

## Out of scope

- Replacing the packet-level pipeline visuals with real pcap data.
- Training or running an actual ML model on the datasets.
- Shipping full datasets — only bounded samples, with citation.
- Refactoring the existing lint errors in `engine.ts` and the feature components.
