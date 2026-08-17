import { describe, it, expect } from 'vitest';
import { BLEND, sampleRecords, deriveProfile, recordsToSources, recordsToFeatures } from './replay';
import type { Profile, ReplayBundle, ReplayRecord, TelemetryFeature } from './types';

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

  // `rec()` only ever sets errorRate to 0 (benign) or 1 (attack), so it can
  // never exercise the `label === 'benign' && errorRate > 0.3` branch that
  // defines suspShare. Build dedicated high-error benign records here so
  // that branch is genuinely covered.
  const highErrorBenign = (i: number): ReplayRecord => ({
    label: 'benign',
    attackCat: 'Normal',
    proto: 'tcp',
    service: 'http',
    srcBytes: 100 + i,
    dstBytes: 200 + i,
    duration: 1,
    rate: 10,
    errorRate: 0.5,
    count: 5,
    srvCount: 5,
    uniqueHosts: 20,
  });

  it('derives suspShare from benign records with high error rates', () => {
    const records = [
      ...Array.from({ length: 5 }, (_, i) => rec('benign', i)), // errorRate 0, below threshold
      ...Array.from({ length: 3 }, (_, i) => highErrorBenign(i)), // errorRate 0.5, above threshold
      ...Array.from({ length: 2 }, (_, i) => rec('attack', i)),
    ];

    const p = deriveProfile(records, fallback);

    // 3 of the 10 records are benign with errorRate > 0.3.
    expect(p.suspShare).toBeGreaterThan(0);
    expect(p.suspShare).toBeCloseTo(0.3, 5);

    // malShare is fixed by the 2 attack records out of 10 (0.2). normalShare
    // must absorb suspShare on top of that — it is NOT simply `1 - malShare`
    // (which would be 0.8).
    expect(p.malShare).toBeCloseTo(0.2, 5);
    expect(p.normalShare).toBeCloseTo(0.5, 5);
    expect(p.normalShare).toBeLessThan(1 - p.malShare);
  });
});

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
