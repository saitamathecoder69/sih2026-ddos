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
    ip: r.sourceIp ?? synthIp(r, i),
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
  // Records are drawn in randomized sampled order, so the actual most
  // frequent service must be computed from a frequency count — records[0]
  // is arbitrary and not necessarily the mode.
  const serviceCounts = new Map<string, number>();
  for (const r of records) serviceCounts.set(r.service, (serviceCounts.get(r.service) ?? 0) + 1);
  let topServiceCount = 0;
  for (const count of serviceCounts.values()) if (count > topServiceCount) topServiceCount = count;
  const sameService = topServiceCount / records.length;

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
