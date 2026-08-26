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
  const header = splitCsv(lines[0].replace(/^﻿/, ''));
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
