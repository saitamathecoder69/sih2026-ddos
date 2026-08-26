import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialState, setMode, tick, DEMO_STEPS } from './engine';
import type { ReplayBundle } from './types';

function loadBundle(file: string): ReplayBundle {
  const p = path.resolve(__dirname, '../../public/data/datasets', file);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

const nsl = loadBundle('nsl-kdd.json');
const unsw = loadBundle('unsw-nb15.json');

describe('engine + replay integration against the real shipped dataset bundles', () => {
  it('default path (no bundle) is unchanged: usingReplayData stays false', () => {
    let state = createInitialState();
    state = setMode(state, 'ddos', null);
    for (let i = 0; i < 3; i++) state = tick(state, null);
    expect(state.usingReplayData).toBe(false);
    expect(state.sources.length).toBeGreaterThan(0);
  });

  it('NSL-KDD in ddos mode surfaces a real NSL-KDD attack category', () => {
    let state = createInitialState();
    state = setMode(state, 'ddos', nsl);
    for (let i = 0; i < 5; i++) state = tick(state, nsl);
    expect(state.usingReplayData).toBe(true);
    const knownNslAttacks = ['neptune', 'satan', 'smurf', 'ipsweep', 'portsweep', 'teardrop', 'nmap', 'back', 'pod', 'warezclient', 'guess_passwd', 'rootkit'];
    expect(knownNslAttacks).toContain(state.attackType);
    const categoriesSeen = new Set(state.sources.map((s) => s.userAgent));
    expect([...categoriesSeen].some((c) => knownNslAttacks.includes(c))).toBe(true);
  });

  it('UNSW-NB15 in ddos mode surfaces a real UNSW category, distinct from NSL-KDD categories', () => {
    let state = createInitialState();
    state = setMode(state, 'ddos', unsw);
    for (let i = 0; i < 5; i++) state = tick(state, unsw);
    expect(state.usingReplayData).toBe(true);
    const knownUnswAttacks = ['Exploits', 'Fuzzers', 'Backdoor', 'Analysis', 'DoS', 'Generic', 'Reconnaissance', 'Shellcode', 'Worms'];
    expect(knownUnswAttacks).toContain(state.attackType);
    const knownNslAttacks = ['neptune', 'satan', 'smurf', 'ipsweep', 'portsweep', 'teardrop', 'nmap', 'back', 'pod', 'warezclient', 'guess_passwd', 'rootkit'];
    expect(knownNslAttacks).not.toContain(state.attackType);
  });

  it('mode filtering: normal mode on a dataset shows mostly-benign, ddos mode shows mostly-malicious', () => {
    let normalState = createInitialState();
    normalState = setMode(normalState, 'normal', nsl);
    for (let i = 0; i < 5; i++) normalState = tick(normalState, nsl);
    const normalLegit = normalState.sources.filter((s) => s.status === 'LEGITIMATE').length;

    let ddosState = createInitialState();
    ddosState = setMode(ddosState, 'ddos', nsl);
    for (let i = 0; i < 5; i++) ddosState = tick(ddosState, nsl);
    const ddosBlocked = ddosState.sources.filter((s) => s.status === 'BLOCKED').length;

    expect(normalLegit).toBeGreaterThan(0);
    expect(ddosBlocked).toBeGreaterThan(0);
    expect(normalState.riskScore).toBeLessThan(ddosState.riskScore);
  });

  it('graceful fallback: an empty bundle does not throw and falls back to synthetic data', () => {
    const empty: ReplayBundle = { id: 'empty', name: 'Empty', sourceFile: '', generatedAt: '', benign: [], attack: [] };
    let state = createInitialState();
    expect(() => {
      state = setMode(state, 'ddos', empty);
      state = tick(state, empty);
    }).not.toThrow();
    expect(state.usingReplayData).toBe(false);
    expect(state.sources.length).toBeGreaterThan(0);
  });

  it('the scripted demo sequence runs against a selected dataset without throwing', () => {
    let state = createInitialState();
    expect(DEMO_STEPS.length).toBeGreaterThan(0);
    for (const step of DEMO_STEPS) {
      expect(() => {
        state = setMode(state, step.mode, nsl);
        state = tick(state, nsl);
      }).not.toThrow();
    }
  });
});
