# Dataset-Driven Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user select a benchmark dataset and have the entire SentinelMesh dashboard run on that dataset's real records instead of `Math.random()` constants.

**Architecture:** Preprocessing flattens each dataset's differing columns into one `ReplayRecord` shape stored as a JSON bundle in `public/data/datasets/`. `SimContext` loads a bundle on selection and passes it to `tick()`. The existing mode buttons choose a benign/attack blend; pure functions in `src/sim/replay.ts` sample real records at that blend and aggregate them into the existing `Profile` object, so all 12 pages inherit real data with no component rewrites.

**Tech Stack:** React 18, TypeScript (strict), Vite 5, Tailwind, Recharts, lucide-react. Vitest added for the replay logic.

## Global Constraints

- Branch: `Vihaan`. Repo root: `v:\Projects\SIH\sih2026-ddos`.
- Replay is **purely additive**: when `datasetId === null` the existing code path must run byte-for-byte as today. A failed bundle fetch falls back to it silently.
- **Never present synthesized data as real.** Source IPs are synthesized (these datasets have no addresses); the traffic table footnotes this while replay is active.
- CAIDA DDoS 2007 is restricted-licence — never download, never bundle, `available: false` permanently, and the prep script must refuse it.
- TypeScript strict mode is on. `npm run typecheck` must pass at every commit.
- Do not fix the 14 pre-existing lint errors in `engine.ts` / `ArchitectureDiagram.tsx` / `RecoveryPanel.tsx` — out of scope.
- Bundles must stay under ~2 MB each (~600 benign + ~600 attack records).

---

### Task 1: Types and test infrastructure

**Files:**
- Modify: `src/sim/types.ts` (append)
- Modify: `package.json`
- Create: `vitest.config.ts`
- Test: `src/sim/replay.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `Profile`, `ReplayRecord`, `ReplayBundle` exported from `src/sim/types.ts`; `npm test` script

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^2.1.8
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Extract `Profile` and add replay types**

`profileFor` in `src/sim/engine.ts:165` currently returns an anonymous inline type. Append to `src/sim/types.ts`:

```ts
export interface Profile {
  risk: number;
  totalRps: number;
  blockedRps: number;
  connections: number;
  errorRate: number;
  health: number;
  normalShare: number;
  suspShare: number;
  malShare: number;
}

export interface ReplayRecord {
  label: 'benign' | 'attack';
  attackCat: string;
  proto: string;
  service: string;
  srcBytes: number;
  dstBytes: number;
  duration: number;
  rate: number;
  errorRate: number;
  count: number;
  srvCount: number;
  uniqueHosts: number;
}

export interface ReplayBundle {
  id: string;
  name: string;
  sourceFile: string;
  generatedAt: string;
  benign: ReplayRecord[];
  attack: ReplayRecord[];
}
```

- [ ] **Step 5: Use the named type in `engine.ts`**

In `src/sim/engine.ts`, add `Profile` to the existing type import block at the top, then replace the inline return annotation on `profileFor` (lines 165-175) so the signature reads:

```ts
function profileFor(mode: SimMode): Profile {
```

Delete the nine-line inline `{ risk: number; ... malShare: number; }` annotation that followed. The function body is unchanged.

- [ ] **Step 6: Add `SimState` fields**

In `src/sim/types.ts`, inside `interface SimState`, add:

```ts
  datasetId: string | null;
  datasetName: string | null;
  datasetStatus: 'synthetic' | 'replay';
```

- [ ] **Step 7: Initialise the new fields**

In `src/sim/engine.ts`, inside `createInitialState()`'s returned object (after `lifecycleStart: 0,`), add:

```ts
    datasetId: null,
    datasetName: null,
    datasetStatus: 'synthetic',
```

- [ ] **Step 8: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/sim/types.ts src/sim/engine.ts
git commit -m "Add replay types and Vitest infrastructure"
```

---

### Task 2: `sampleRecords` — label-filtered blending

**Files:**
- Create: `src/sim/replay.ts`
- Test: `src/sim/replay.test.ts`

**Interfaces:**
- Consumes: `ReplayRecord`, `ReplayBundle` from `src/sim/types.ts`
- Produces: `BLEND: Record<SimMode, number>` (attack fraction per mode) and `sampleRecords(bundle, mode, n, rng?): ReplayRecord[]`

- [ ] **Step 1: Write the failing test**

Create `src/sim/replay.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { BLEND, sampleRecords } from './replay';
import type { ReplayBundle, ReplayRecord } from './types';

const rec = (label: 'benign' | 'attack', i: number): ReplayRecord => ({
  label,
  attackCat: label === 'benign' ? 'Normal' : 'neptune',
  proto: 'tcp',
  service: 'http',
  srcBytes: 100 + i,
  dstBytes: 200 + i,
  duration: 1,
  rate: 10,
  errorRate: label === 'attack' ? 1 : 0,
  count: 5,
  srvCount: 5,
  uniqueHosts: 20,
});

const bundle: ReplayBundle = {
  id: 'test',
  name: 'Test',
  sourceFile: 'test.csv',
  generatedAt: '2026-08-17T00:00:00Z',
  benign: Array.from({ length: 50 }, (_, i) => rec('benign', i)),
  attack: Array.from({ length: 50 }, (_, i) => rec('attack', i)),
};

describe('sampleRecords', () => {
  it('returns only benign records in normal mode', () => {
    const out = sampleRecords(bundle, 'normal', 20, () => 0.5);
    expect(out).toHaveLength(20);
    expect(out.every((r) => r.label === 'benign')).toBe(true);
  });

  it('returns mostly attack records in ddos mode', () => {
    const out = sampleRecords(bundle, 'ddos', 100, () => 0.5);
    const attacks = out.filter((r) => r.label === 'attack').length;
    expect(attacks / out.length).toBeGreaterThan(0.5);
  });

  it('orders the blend table from calm to hostile', () => {
    expect(BLEND.normal).toBe(0);
    expect(BLEND.restored).toBe(0);
    expect(BLEND.spike).toBeLessThan(BLEND.httpflood);
    expect(BLEND.httpflood).toBeLessThan(BLEND.ddos);
  });

  it('falls back to the available label when one side is empty', () => {
    const benignOnly = { ...bundle, attack: [] };
    const out = sampleRecords(benignOnly, 'ddos', 10, () => 0.5);
    expect(out).toHaveLength(10);
    expect(out.every((r) => r.label === 'benign')).toBe(true);
  });

  it('returns an empty array for an empty bundle', () => {
    const empty = { ...bundle, benign: [], attack: [] };
    expect(sampleRecords(empty, 'normal', 10, () => 0.5)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./replay"`.

- [ ] **Step 3: Write the implementation**

Create `src/sim/replay.ts`:

```ts
import type { Profile, ReplayBundle, ReplayRecord, SimMode, TelemetryFeature, TrafficSource } from './types';

/** Fraction of sampled records drawn from the attack pool, per mode. */
export const BLEND: Record<SimMode, number> = {
  normal: 0,
  spike: 0.2,
  httpflood: 0.75,
  ddos: 0.9,
  mitigating: 0.7,
  recovering: 0.25,
  restored: 0,
};

export function sampleRecords(
  bundle: ReplayBundle,
  mode: SimMode,
  n: number,
  rng: () => number = Math.random,
): ReplayRecord[] {
  const benign = bundle.benign ?? [];
  const attack = bundle.attack ?? [];
  if (benign.length === 0 && attack.length === 0) return [];

  const attackShare = BLEND[mode] ?? 0;
  const out: ReplayRecord[] = [];

  for (let i = 0; i < n; i++) {
    const wantAttack = rng() < attackShare;
    // Fall back to whichever pool has records rather than dividing by zero.
    let pool = wantAttack ? attack : benign;
    if (pool.length === 0) pool = wantAttack ? benign : attack;
    out.push(pool[Math.floor(rng() * pool.length) % pool.length]);
  }

  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 5 tests.

Note on the fixed `rng`: with `() => 0.5`, `0.5 < 0.9` is always true for ddos so every draw is an attack (ratio 1.0, satisfying `> 0.5`); for `normal` (share 0) `0.5 < 0` is always false, giving all benign. Do not assert an exact ratio against `BLEND[mode]` here — a constant rng cannot reproduce the blend proportion.

- [ ] **Step 5: Commit**

```bash
git add src/sim/replay.ts src/sim/replay.test.ts
git commit -m "Add label-filtered record sampling for replay"
```

---

### Task 3: `deriveProfile` — aggregate real records into the profile

**Files:**
- Modify: `src/sim/replay.ts`
- Test: `src/sim/replay.test.ts`

**Interfaces:**
- Consumes: `sampleRecords`, `BLEND` from Task 2
- Produces: `deriveProfile(records: ReplayRecord[], fallback: Profile): Profile`

- [ ] **Step 1: Write the failing test**

In `src/sim/replay.test.ts`, extend the existing import to `import { BLEND, sampleRecords, deriveProfile } from './replay';` and add `Profile` to the existing type import. Then append:

```ts
const fallback: Profile = {
  risk: 18, totalRps: 12480, blockedRps: 240, connections: 8421,
  errorRate: 0.8, health: 99.8, normalShare: 0.96, suspShare: 0.035, malShare: 0.005,
};

describe('deriveProfile', () => {
  it('returns the fallback for an empty record set', () => {
    expect(deriveProfile([], fallback)).toEqual(fallback);
  });

  it('reports low risk and near-full health for all-benign records', () => {
    const p = deriveProfile(Array.from({ length: 20 }, (_, i) => rec('benign', i)), fallback);
    expect(p.risk).toBeLessThan(10);
    expect(p.health).toBeGreaterThan(95);
    expect(p.malShare).toBe(0);
  });

  it('reports high risk and degraded health for all-attack records', () => {
    const p = deriveProfile(Array.from({ length: 20 }, (_, i) => rec('attack', i)), fallback);
    expect(p.risk).toBeGreaterThan(90);
    expect(p.health).toBeLessThan(60);
    expect(p.malShare).toBe(1);
  });

  it('scales totalRps upward with attack share', () => {
    const calm = deriveProfile(Array.from({ length: 10 }, (_, i) => rec('benign', i)), fallback);
    const storm = deriveProfile(Array.from({ length: 10 }, (_, i) => rec('attack', i)), fallback);
    expect(storm.totalRps).toBeGreaterThan(calm.totalRps);
  });

  it('keeps the three traffic shares summing to 1', () => {
    const mixed = [...Array.from({ length: 5 }, (_, i) => rec('benign', i)), ...Array.from({ length: 5 }, (_, i) => rec('attack', i))];
    const p = deriveProfile(mixed, fallback);
    expect(p.normalShare + p.suspShare + p.malShare).toBeCloseTo(1, 5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `deriveProfile is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/sim/replay.ts`:

```ts
// The dashboard's display range, matched to the existing synthetic profiles
// so replayed data occupies the same visual scale the gauges were built for.
const DISPLAY_RPS_BASE = 12480;
const DISPLAY_RPS_PEAK = 122000;
const CONNECTIONS_PER_RPS = 0.675;

const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Aggregate real records into the profile the engine already consumes.
 *
 * Ratios (attack share, error rate, traffic mix) are genuinely derived from
 * the records. Absolute RPS is scaled onto the dashboard's display range,
 * because these are per-connection record datasets, not per-second captures.
 */
export function deriveProfile(records: ReplayRecord[], fallback: Profile): Profile {
  if (records.length === 0) return fallback;

  const attacks = records.filter((r) => r.label === 'attack');
  const attackShare = attacks.length / records.length;

  const suspShare =
    records.filter((r) => r.label === 'benign' && r.errorRate > 0.3).length / records.length;
  const malShare = attackShare;
  const normalShare = Math.max(0, 1 - malShare - suspShare);

  const totalRps = Math.round(DISPLAY_RPS_BASE + (DISPLAY_RPS_PEAK - DISPLAY_RPS_BASE) * attackShare);

  return {
    risk: clamp(Math.round(attackShare * 100), 2, 99),
    totalRps,
    blockedRps: Math.round(totalRps * malShare * 0.95),
    connections: Math.round(totalRps * CONNECTIONS_PER_RPS),
    errorRate: clamp(mean(records.map((r) => r.errorRate)) * 100, 0, 100),
    health: clamp(100 - attackShare * 45, 40, 100),
    normalShare,
    suspShare,
    malShare,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 10 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/sim/replay.ts src/sim/replay.test.ts
git commit -m "Derive simulation profile from real dataset records"
```

---

### Task 4: Map records into sources and telemetry features

**Files:**
- Modify: `src/sim/replay.ts`
- Test: `src/sim/replay.test.ts`

**Interfaces:**
- Consumes: `deriveProfile` from Task 3
- Produces: `recordsToSources(records: ReplayRecord[]): TrafficSource[]` and `recordsToFeatures(prev: TelemetryFeature[], records: ReplayRecord[], profile: Profile): TelemetryFeature[]`

- [ ] **Step 1: Write the failing test**

In `src/sim/replay.test.ts`, extend the existing value import with `recordsToSources, recordsToFeatures` and the type import with `TelemetryFeature`. Then append:

```ts
describe('recordsToSources', () => {
  it('maps real protocol and service onto the sources table', () => {
    const out = recordsToSources(Array.from({ length: 6 }, (_, i) => rec('attack', i)));
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].endpoint).toBe('http');
    expect(out[0].asn).toBe('tcp');
    expect(out[0].status).toBe('BLOCKED');
  });

  it('marks benign records as legitimate', () => {
    const out = recordsToSources([rec('benign', 1)]);
    expect(out[0].status).toBe('LEGITIMATE');
    expect(out[0].userAgent).toBe('Normal');
  });

  it('returns an empty array for no records', () => {
    expect(recordsToSources([])).toEqual([]);
  });
});

describe('recordsToFeatures', () => {
  const prev: TelemetryFeature[] = [
    { key: 'rps', label: 'Requests/sec', value: 0, display: '0', anomaly: false },
    { key: 'errorRate', label: 'Error Rate', value: 0, display: '0%', anomaly: false },
    { key: 'uniqueIps', label: 'Unique IPs', value: 0, display: '0', anomaly: false },
  ];

  it('fills features from the profile and records', () => {
    const records = Array.from({ length: 10 }, (_, i) => rec('attack', i));
    const profile = deriveProfile(records, fallback);
    const out = recordsToFeatures(prev, records, profile);
    expect(out.find((f) => f.key === 'rps')!.value).toBe(profile.totalRps);
    expect(out.find((f) => f.key === 'uniqueIps')!.value).toBeGreaterThan(0);
  });

  it('preserves keys it has no mapping for', () => {
    const withUnknown = [...prev, { key: 'zzz', label: 'Unknown', value: 42, display: '42', anomaly: false }];
    const out = recordsToFeatures(withUnknown, [rec('benign', 0)], fallback);
    expect(out.find((f) => f.key === 'zzz')!.value).toBe(42);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `recordsToSources is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/sim/replay.ts`:

```ts
/**
 * Synthesize a stable pseudo-IP from record content.
 *
 * NSL-KDD and UNSW-NB15 are feature-extracted datasets containing no source
 * addresses, so the IP column cannot be real. The UI footnotes this while
 * replay is active. Every other column below is a genuine record value.
 */
function synthIp(r: ReplayRecord, i: number): string {
  const h = (r.srcBytes * 31 + r.dstBytes * 17 + i * 7) >>> 0;
  return `${(h % 223) + 1}.${(h >> 3) % 256}.${(h >> 6) % 256}.${((h >> 9) % 254) + 1}`;
}

export function recordsToSources(records: ReplayRecord[]): TrafficSource[] {
  return records.slice(0, 8).map((r, i) => ({
    id: `r${i}`,
    ip: synthIp(r, i),
    rps: Math.max(1, Math.round(r.rate)),
    country: r.label === 'attack' ? 'Unknown' : 'Observed',
    asn: r.proto,
    endpoint: r.service,
    userAgent: r.attackCat,
    status: r.label === 'attack' ? 'BLOCKED' : r.errorRate > 0.3 ? 'SUSPICIOUS' : 'LEGITIMATE',
  }));
}

export function recordsToFeatures(
  prev: TelemetryFeature[],
  records: ReplayRecord[],
  profile: Profile,
): TelemetryFeature[] {
  if (records.length === 0) return prev;

  const anomaly = profile.malShare > 0.4;
  const uniqueHosts = Math.round(mean(records.map((r) => r.uniqueHosts)));
  const avgCount = Math.round(mean(records.map((r) => r.count)));
  const avgSrvCount = Math.round(mean(records.map((r) => r.srvCount)));
  const bytes = Math.round(mean(records.map((r) => r.srcBytes + r.dstBytes)));
  const services = new Set(records.map((r) => r.service)).size;
  const protos = new Set(records.map((r) => r.proto)).size;
  const topService = records[0].service;
  const sameService = records.filter((r) => r.service === topService).length / records.length;

  // Service concentration drives two different cards; compute once.
  const concentration = () => {
    const v = Math.round(sameService * 100);
    return { value: v, display: `${v}%`, anomaly: v > 60, delta: (v > 60 ? 'up' : null) as 'up' | null };
  };

  const map: Record<string, () => Partial<TelemetryFeature>> = {
    rps: () => ({ value: profile.totalRps, display: profile.totalRps.toLocaleString(), anomaly, delta: anomaly ? 'up' : null }),
    reqPerIp: () => ({ value: avgCount, display: avgCount.toLocaleString(), anomaly, delta: anomaly ? 'up' : null }),
    uniqueIps: () => ({ value: uniqueHosts, display: uniqueHosts.toLocaleString(), anomaly, delta: anomaly ? 'up' : null }),
    ipConc: concentration,
    reqCountry: () => ({ value: protos, display: String(protos), anomaly, delta: null }),
    reqAsn: () => ({ value: protos, display: String(protos), anomaly, delta: null }),
    reqEndpoint: concentration,
    errorRate: () => ({ value: profile.errorRate, display: `${profile.errorRate.toFixed(1)}%`, anomaly: profile.errorRate > 10, delta: profile.errorRate > 5 ? 'up' : null }),
    concurrent: () => ({ value: profile.connections, display: profile.connections.toLocaleString(), anomaly, delta: anomaly ? 'up' : null }),
    bytes: () => ({ value: bytes, display: `${bytes.toLocaleString()} B avg`, anomaly, delta: anomaly ? 'up' : null }),
    packetRate: () => {
      const v = Math.round(mean(records.map((r) => r.rate)));
      return { value: v, display: `${v.toLocaleString()} pps`, anomaly, delta: anomaly ? 'up' : null };
    },
    timePattern: () => ({ value: anomaly ? 88 : 12, display: anomaly ? 'Bursty' : 'Steady', anomaly }),
    geoDist: () => ({ value: services, display: `${services} services`, anomaly, delta: anomaly ? 'down' : null }),
    newIpRatio: () => {
      const v = Math.round(profile.malShare * 100);
      return { value: v, display: `${v}%`, anomaly, delta: anomaly ? 'up' : null };
    },
    uaSimilarity: () => {
      const v = Math.round((avgSrvCount / Math.max(1, avgCount)) * 100);
      return { value: v, display: `${v}%`, anomaly, delta: anomaly ? 'up' : null };
    },
  };

  return prev.map((f) => ({ ...f, ...(map[f.key]?.() ?? {}) }) as TelemetryFeature);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 15 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/sim/replay.ts src/sim/replay.test.ts
git commit -m "Map dataset records into traffic sources and telemetry"
```

---

### Task 5: Preprocessing script and bundle generation

**Files:**
- Create: `scripts/prepare-dataset.mjs`
- Create: `public/data/datasets/nsl-kdd.json` (generated)
- Create: `public/data/datasets/unsw-nb15.json` (generated)
- Modify: `README.md`

**Interfaces:**
- Consumes: the `ReplayBundle` / `ReplayRecord` shape from Task 1
- Produces: bundle JSON files at `public/data/datasets/<id>.json`

- [ ] **Step 1: Write the script**

Create `scripts/prepare-dataset.mjs`:

```js
#!/usr/bin/env node
// Convert a raw benchmark dataset CSV into a bounded replay bundle.
//   node scripts/prepare-dataset.mjs --dataset nsl-kdd --input path/to/KDDTrain+.txt
import fs from 'node:fs';
import path from 'node:path';

const PER_LABEL = 600;

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Split a CSV line, honouring double-quoted fields (the CIC exports use them).
function splitCsv(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const ADAPTERS = {
  'nsl-kdd': {
    hasHeader: false,
    sourceFile: 'KDDTrain+.txt',
    map(c) {
      if (c.length < 43) return null;
      const cls = c[41];
      const duration = num(c[0]);
      const srcBytes = num(c[4]);
      return {
        label: cls === 'normal' ? 'benign' : 'attack',
        attackCat: cls,
        proto: c[1],
        service: c[2],
        srcBytes,
        dstBytes: num(c[5]),
        duration,
        rate: Math.round(srcBytes / Math.max(duration, 1)),
        errorRate: num(c[24]),
        count: num(c[22]),
        srvCount: num(c[23]),
        uniqueHosts: num(c[31]),
      };
    },
  },
  'unsw-nb15': {
    hasHeader: true,
    sourceFile: 'UNSW_NB15_training-set.csv',
    map(c, idx) {
      const state = c[idx.state];
      const cat = c[idx.attack_cat];
      return {
        label: c[idx.label] === '1' ? 'attack' : 'benign',
        attackCat: cat && cat !== '-' ? cat : 'Normal',
        proto: c[idx.proto],
        service: c[idx.service] === '-' ? 'other' : c[idx.service],
        srcBytes: num(c[idx.sbytes]),
        dstBytes: num(c[idx.dbytes]),
        duration: num(c[idx.dur]),
        rate: Math.round(num(c[idx.rate])),
        errorRate: ['REJ', 'RST', 'INT'].includes(state) ? 1 : 0,
        count: num(c[idx.ct_srv_src]),
        srvCount: num(c[idx.ct_srv_dst]),
        uniqueHosts: num(c[idx.ct_dst_ltm]),
      };
    },
  },
};

const id = args.dataset;
if (id === 'caida-ddos-2007') {
  console.error('CAIDA DDoS 2007 is restricted-licence and must not be bundled. Refusing.');
  process.exit(1);
}
const adapter = ADAPTERS[id];
if (!adapter) {
  console.error(`Unknown dataset "${id}". Known: ${Object.keys(ADAPTERS).join(', ')}`);
  process.exit(1);
}
if (!args.input || !fs.existsSync(args.input)) {
  console.error(`Input file not found: ${args.input}`);
  process.exit(1);
}

const lines = fs.readFileSync(args.input, 'utf8').split(/\r?\n/).filter(Boolean);
let idx = {};
let start = 0;
if (adapter.hasHeader) {
  const header = splitCsv(lines[0].replace(/^\uFEFF/, ''));
  header.forEach((name, i) => { idx[name] = i; });
  start = 1;
}

const benign = [];
const attack = [];
for (let i = start; i < lines.length; i++) {
  if (benign.length >= PER_LABEL && attack.length >= PER_LABEL) break;
  let r;
  try { r = adapter.map(splitCsv(lines[i]), idx); } catch { continue; }
  if (!r || !r.proto) continue;
  const bucket = r.label === 'attack' ? attack : benign;
  if (bucket.length < PER_LABEL) bucket.push(r);
}

const outDir = path.join('public', 'data', 'datasets');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${id}.json`);
fs.writeFileSync(outPath, JSON.stringify({
  id,
  name: args.name || id,
  sourceFile: adapter.sourceFile,
  generatedAt: new Date().toISOString(),
  benign,
  attack,
}));

const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(`Wrote ${outPath} — ${benign.length} benign, ${attack.length} attack, ${kb} KB`);
```

- [ ] **Step 2: Download the two obtainable source files**

```bash
mkdir -p .datasets
curl -L -o .datasets/KDDTrain+.txt "https://raw.githubusercontent.com/jmnwong/NSL-KDD-Dataset/master/KDDTrain%2B.txt"
curl -L -o .datasets/UNSW_NB15_training-set.csv "https://raw.githubusercontent.com/Nir-J/ML-Projects/master/UNSW-Network_Packet_Classification/UNSW_NB15_training-set.csv"
```

- [ ] **Step 3: Ignore the raw downloads**

Append to `.gitignore`:

```
.datasets
```

Raw sources are large (19 MB and 32 MB) and must not be committed — only the generated bundles are.

- [ ] **Step 4: Generate both bundles**

```bash
node scripts/prepare-dataset.mjs --dataset nsl-kdd --name "NSL-KDD" --input .datasets/KDDTrain+.txt
node scripts/prepare-dataset.mjs --dataset unsw-nb15 --name "UNSW-NB15" --input .datasets/UNSW_NB15_training-set.csv
```

Expected: two `Wrote public/data/datasets/….json — 600 benign, 600 attack, … KB` lines. Each file must be under 2 MB.

- [ ] **Step 5: Verify the bundles are well formed**

```bash
node -e "for (const f of ['nsl-kdd','unsw-nb15']) { const b = JSON.parse(require('fs').readFileSync('public/data/datasets/'+f+'.json')); console.log(f, b.benign.length, b.attack.length, 'cats:', [...new Set(b.attack.map(r=>r.attackCat))].slice(0,5).join(',')); }"
```

Expected: both report 600/600 with real attack category names (e.g. `neptune,satan,ipsweep` and `Exploits,Reconnaissance,Fuzzers`).

- [ ] **Step 6: Document the script in the README**

Append to `README.md`:

```markdown
## Dataset replay

The simulator can run on real benchmark records instead of synthetic values.
NSL-KDD and UNSW-NB15 bundles ship in `public/data/datasets/`.

To add another dataset, download its CSV and run:

```bash
node scripts/prepare-dataset.mjs --dataset cic-ids2017 --name "CIC-IDS2017" --input path/to/file.csv
```

Notes on fidelity: attack categories, protocols, services, byte counts and
error rates are real record values. Aggregate request rates are scaled onto
the dashboard's display range, because these are per-connection record
datasets rather than per-second captures. Source IP addresses are synthesized
— these datasets are feature-extracted and contain no addresses.

CAIDA DDoS 2007 is restricted-licence and is deliberately never bundled.
```

- [ ] **Step 7: Commit**

```bash
git add scripts/prepare-dataset.mjs public/data/datasets .gitignore README.md
git commit -m "Add dataset preprocessing script and NSL-KDD/UNSW-NB15 bundles"
```

---

### Task 6: Wire replay into the engine

**Files:**
- Modify: `src/sim/engine.ts`

**Interfaces:**
- Consumes: `sampleRecords`, `deriveProfile`, `recordsToSources`, `recordsToFeatures` from Tasks 2-4
- Produces: `tick(state: SimState, bundle?: ReplayBundle | null): SimState` and `setMode(state, mode, bundle?)`

- [ ] **Step 1: Import the replay helpers**

At the top of `src/sim/engine.ts`, add `ReplayBundle` to the type import block and add:

```ts
import { deriveProfile, recordsToFeatures, recordsToSources, sampleRecords } from './replay';
```

- [ ] **Step 2: Add a profile resolver**

Add just below `profileFor` in `src/sim/engine.ts`:

```ts
const SAMPLE_SIZE = 40;

/**
 * Resolve the profile for this tick. With a bundle loaded the numbers come
 * from real sampled records; without one the original synthetic profile runs
 * unchanged.
 */
function resolveProfile(mode: SimMode, bundle?: ReplayBundle | null): { profile: Profile; records: ReplayRecord[] } {
  const synthetic = profileFor(mode);
  if (!bundle) return { profile: synthetic, records: [] };
  const records = sampleRecords(bundle, mode, SAMPLE_SIZE);
  if (records.length === 0) return { profile: synthetic, records: [] };
  return { profile: deriveProfile(records, synthetic), records };
}
```

Add `ReplayRecord` and `Profile` to the type import block as well.

- [ ] **Step 3: Use it in `tick`**

In `tick` (line 282), replace the first line `const profile = profileFor(state.mode);` with:

```ts
export function tick(state: SimState, bundle?: ReplayBundle | null): SimState {
  const { profile, records } = resolveProfile(state.mode, bundle);
```

Then replace the features and sources lines:

```ts
  const features = records.length
    ? recordsToFeatures(state.features, records, profile)
    : updateFeatures(state.features, state.mode, totalRps, connections, errorRate, risk);

  const sources = records.length
    ? recordsToSources(records)
    : updateSources(state.sources, state.mode, totalRps);
```

- [ ] **Step 4: Use it in `setMode`**

Change the `setMode` signature (line 195) and its first line to:

```ts
export function setMode(state: SimState, mode: SimMode, bundle?: ReplayBundle | null): SimState {
  const { profile, records } = resolveProfile(mode, bundle);
```

At the end of `setMode`, inside the returned object, override `attackType` with the real category when replaying. Add immediately before `return {`:

```ts
  const replayAttackType = records.find((r) => r.label === 'attack')?.attackCat;
  const resolvedAttackType = replayAttackType && attackActive ? replayAttackType : attackType;
```

and change `attackType,` in the returned object to `attackType: resolvedAttackType,`.

- [ ] **Step 5: Verify typecheck and tests pass**

Run: `npm run typecheck && npm test`
Expected: typecheck silent; 15 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/sim/engine.ts
git commit -m "Drive engine profile from replay bundle when one is loaded"
```

---

### Task 7: Dataset selection in SimContext

**Files:**
- Modify: `src/sim/SimContext.tsx`
- Modify: `src/data/datasets.ts`

**Interfaces:**
- Consumes: `tick(state, bundle)` / `setMode(state, mode, bundle)` from Task 6
- Produces: `useSim()` gains `setDataset(id: string | null): void`; `DatasetInfo` gains `replay`

- [ ] **Step 1: Add the replay field to the registry**

In `src/data/datasets.ts`, extend the interface:

```ts
export interface DatasetReplay {
  available: boolean;
  bundlePath?: string;
  note?: string;
}
```

Add `replay: DatasetReplay;` to `DatasetInfo`, then add to each entry:

- `nsl-kdd`: `replay: { available: true, bundlePath: '/data/datasets/nsl-kdd.json' }`
- `unsw-nb15`: `replay: { available: true, bundlePath: '/data/datasets/unsw-nb15.json' }`
- `cicddos2019`, `cic-ids2017`, `cse-cic-ids2018`: `replay: { available: false, note: 'Run scripts/prepare-dataset.mjs on the downloaded CSV to enable replay.' }`
- `caida-ddos-2007`: `replay: { available: false, note: 'Restricted licence — cannot be bundled.' }`

- [ ] **Step 2: Hold the bundle in SimContext**

In `src/sim/SimContext.tsx`, add imports:

```ts
import type { ReplayBundle } from './types';
import { DATASETS } from '@/data/datasets';
```

Add to `SimContextValue`:

```ts
  setDataset: (id: string | null) => void;
```

Inside `SimProvider`, add the ref:

```ts
  const bundleRef = useRef<ReplayBundle | null>(null);
```

- [ ] **Step 3: Pass the bundle into the tick and mode changes**

Change the tick effect body to `setState((s) => tick(s, bundleRef.current));`, and every `applyMode(s, X)` call in the file to `applyMode(s, X, bundleRef.current)`. There are six such calls: in `advanceLifecycle`, `setMode`, `runDemoStep`, twice in the `runDemoStep` completion branch, and in `restartDemo`.

- [ ] **Step 4: Implement `setDataset`**

Add inside `SimProvider`:

```ts
  const setDataset = (id: string | null) => {
    if (id === null) {
      bundleRef.current = null;
      setState((s) => ({ ...s, datasetId: null, datasetName: null, datasetStatus: 'synthetic' }));
      return;
    }

    const meta = DATASETS.find((d) => d.id === id);
    if (!meta?.replay.available || !meta.replay.bundlePath) return;

    fetch(meta.replay.bundlePath)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((bundle: ReplayBundle) => {
        if (!bundle?.benign?.length && !bundle?.attack?.length) throw new Error('empty bundle');
        bundleRef.current = bundle;
        setState((s) => ({ ...s, datasetId: id, datasetName: meta.name, datasetStatus: 'replay' }));
      })
      .catch((err) => {
        console.warn(`Dataset "${id}" could not be loaded, staying on built-in simulation:`, err);
        bundleRef.current = null;
        setState((s) => ({ ...s, datasetId: null, datasetName: null, datasetStatus: 'synthetic' }));
      });
  };
```

Add `setDataset` to the `value` object.

- [ ] **Step 5: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/sim/SimContext.tsx src/data/datasets.ts
git commit -m "Add dataset selection and bundle loading to SimContext"
```

---

### Task 8: Selection UI and honesty disclosures

**Files:**
- Modify: `src/pages/DatasetsPage.tsx`
- Modify: `src/components/layout/TopBar.tsx`
- Modify: `src/components/features/TrafficSourceTable.tsx`

**Interfaces:**
- Consumes: `useSim().setDataset`, `state.datasetId`, `state.datasetName`, `state.datasetStatus` from Task 7

**Deliberate deviation from the spec:** the spec listed both a dropdown on the Attack Simulator page and a separate "Replaying: X" chip in the TopBar. These are consolidated into one TopBar `<select>`, which is visible on every page and shows the active dataset as its own selected value — it serves both roles. Do not also build a simulator-page dropdown.

- [ ] **Step 1: Add replay controls to the Datasets page**

In `src/pages/DatasetsPage.tsx`, import `useSim` from `@/sim/SimContext` and `Play` from `lucide-react`, then read `const { state, setDataset } = useSim();`.

Inside the dataset card, after the access-note paragraph, add:

```tsx
{d.replay.note && <p className="mt-1 text-[11px] text-slate-600">{d.replay.note}</p>}
```

and replace the single "Open" link with a column holding both controls:

```tsx
<div className="flex shrink-0 items-center gap-2 self-start">
  {d.replay.available && (
    <button
      onClick={() => setDataset(state.datasetId === d.id ? null : d.id)}
      className={state.datasetId === d.id ? 'btn-ok' : 'btn-ghost border border-white/10'}
    >
      <Play className="h-3.5 w-3.5" />
      {state.datasetId === d.id ? 'Active' : 'Use in simulator'}
    </button>
  )}
  <a href={d.link} target="_blank" rel="noreferrer" className="btn-ghost border border-white/10">
    <ExternalLink className="h-3.5 w-3.5" />
    Open
  </a>
</div>
```

Add a replay badge next to the existing access badge:

```tsx
<span className={cn('chip border', d.replay.available ? 'text-ok-400 bg-ok-500/10 border-ok-500/20' : 'text-slate-400 bg-white/5 border-white/10')}>
  {d.replay.available ? 'REPLAY READY' : 'REFERENCE ONLY'}
</span>
```

- [ ] **Step 2: Add the data-source selector and active chip to the TopBar**

In `src/components/layout/TopBar.tsx`, pull `setDataset` from `useSim()`, import `DATASETS` from `@/data/datasets` and `Database` from `lucide-react`.

Replace the static "Production Simulation" pill (lines 76-79) with:

```tsx
<div className="hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
  <Database className="h-3.5 w-3.5 text-info-400" />
  <select
    value={state.datasetId ?? ''}
    onChange={(e) => setDataset(e.target.value || null)}
    className="bg-transparent text-xs font-medium text-slate-300 outline-none"
  >
    <option value="" className="bg-ink-850">Built-in simulation</option>
    {DATASETS.filter((d) => d.replay.available).map((d) => (
      <option key={d.id} value={d.id} className="bg-ink-850">{d.name}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 3: Footnote the synthesized IP column**

In `src/components/features/TrafficSourceTable.tsx`, change the component signature to accept the flag:

```tsx
export function TrafficSourceTable({ sources, replay = false }: { sources: TrafficSource[]; replay?: boolean }) {
```

Because replayed records carry protocols and services rather than ASNs and URL paths, the two affected headers must follow suit. Replace the `<th>` cells for ASN and Endpoint with:

```tsx
<th className="py-2 pr-3 font-medium">{replay ? 'Protocol' : 'ASN'}</th>
<th className="py-2 pr-3 font-medium">{replay ? 'Service' : 'Endpoint'}</th>
```

Leave the `<td>` cells (`s.asn`, `s.endpoint`) unchanged — only the labels change.

Then add immediately before the closing `</div>`:

```tsx
{replay && (
  <p className="mt-3 text-[11px] text-slate-500">
    IP addresses are synthesized — this dataset is feature-extracted and contains no source
    addresses. Protocol, service, rate and classification are real record values.
  </p>
)}
```

- [ ] **Step 4: Pass the flag from the traffic page**

In `src/pages/LiveTrafficPage.tsx`, find the `<TrafficSourceTable sources={...} />` usage and add `replay={state.datasetStatus === 'replay'}`.

- [ ] **Step 5: Verify typecheck, tests and build**

Run: `npm run typecheck && npm test && npm run build`
Expected: typecheck silent, 15 tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/DatasetsPage.tsx src/components/layout/TopBar.tsx src/components/features/TrafficSourceTable.tsx src/pages/LiveTrafficPage.tsx
git commit -m "Add dataset selector, replay badges and IP disclosure"
```

---

### Task 9: End-to-end verification

**Files:** none modified unless a defect is found

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Confirm the default path is unchanged**

Open `http://localhost:5173`. The TopBar selector reads "Built-in simulation"; the Overview dashboard behaves exactly as before this feature.

- [ ] **Step 3: Confirm NSL-KDD replay**

Select **NSL-KDD** in the TopBar selector, then click **DDoS Attack**. Verify:
- Live Traffic sources show real protocols (`tcp`/`udp`/`icmp`) and services (`http`, `private`, `ecr_i`)
- The user-agent column shows real attack categories (`neptune`, `smurf`, `teardrop`)
- The synthesized-IP footnote appears under the sources table
- Telemetry values change and no console errors appear

- [ ] **Step 4: Confirm the datasets differ**

Switch to **UNSW-NB15**. Attack categories must change to `Exploits` / `Fuzzers` / `Reconnaissance` / `DoS`, confirming the selection genuinely drives the data.

- [ ] **Step 5: Confirm mode filtering**

With a dataset active, click **Normal Traffic** and verify sources return to `LEGITIMATE` with benign categories, then **DDoS Attack** and verify they flip back to `BLOCKED`.

- [ ] **Step 6: Confirm graceful fallback**

Temporarily rename `public/data/datasets/nsl-kdd.json`, reload, select NSL-KDD, and verify the dashboard keeps running on built-in simulation with a single console warning. Restore the file afterwards.

- [ ] **Step 7: Confirm the demo still runs**

Click **Start Live Demo** with a dataset active and verify all steps progress without error.

- [ ] **Step 8: Final check and commit**

```bash
npm run typecheck && npm test && npm run build
git add -A
git commit -m "Verify dataset-driven simulation end to end"
```

---

## Verification Summary

| Requirement | Verified by |
|---|---|
| Selection changes attack names/protocols/telemetry | Task 9 Step 3 |
| Two datasets look different | Task 9 Step 4 |
| Mode buttons and demo still work | Task 9 Steps 5, 7 |
| No dataset selected = today's behavior | Task 9 Step 2 |
| Nothing synthetic labeled as real | Task 8 Step 3, README (Task 5 Step 6) |
| Blend/scaling math correct | Tasks 2-4 unit tests |
| Fetch failure degrades gracefully | Task 9 Step 6 |
