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
