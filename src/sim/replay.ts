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
