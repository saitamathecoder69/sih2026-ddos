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
