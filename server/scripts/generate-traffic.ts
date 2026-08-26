// Throws realistic legitimate + attack-shaped load at a running backend.
// Usage: BACKEND_URL=http://localhost:8787 npm run generate-traffic -- --mode ddos --duration 30
import { setTimeout as sleep } from 'node:timers/promises';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8787';
const args = Object.fromEntries(
  process.argv.slice(2).reduce<[string, string][]>((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] ?? 'true']);
    return acc;
  }, []),
);
const mode = args.mode ?? 'normal'; // normal | spike | ddos
const durationSec = Number(args.duration ?? 20);

const ENDPOINTS = ['/website', '/api/login', '/api/checkout', '/api/search', '/static/assets'];
const LEGIT_UAS = ['Mozilla/5.0 Chrome', 'Mozilla/5.0 Firefox', 'Mozilla/5.0 Safari'];
const ATTACK_UAS = ['python-requests/2.31', 'curl/8.4', 'Bot/1.0'];

const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const legitIp = () => `192.168.${Math.floor(rnd(0, 16))}.${Math.floor(rnd(1, 254))}`;
const attackIp = (poolIndex: number) => `203.0.113.${poolIndex}`;

async function fireOne(sourceIp: string, endpoint: string, userAgent: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint, method: 'GET', userAgent, bytes: Math.round(rnd(200, 2000)), simulatedSourceIp: sourceIp }),
    });
    return (await res.json()) as { classification: string; riskScore: number };
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Generating "${mode}" traffic against ${BACKEND_URL} for ${durationSec}s...`);
  const attackPool = Array.from({ length: 5 }, (_, i) => attackIp(i + 1));
  const counts = { LEGITIMATE: 0, SUSPICIOUS: 0, MALICIOUS: 0, failed: 0 };
  const end = Date.now() + durationSec * 1000;

  while (Date.now() < end) {
    const batch: Promise<void>[] = [];

    // Background legitimate traffic, always present.
    for (let i = 0; i < 3; i++) {
      batch.push(
        fireOne(legitIp(), pick(ENDPOINTS), pick(LEGIT_UAS)).then((r) => {
          if (!r) counts.failed++;
          else counts[r.classification as keyof typeof counts]++;
        }),
      );
    }

    // Attack traffic, scaled by mode.
    const attackBurst = mode === 'ddos' ? 15 : mode === 'spike' ? 5 : 0;
    for (let i = 0; i < attackBurst; i++) {
      const ip = pick(attackPool);
      batch.push(
        fireOne(ip, '/api/login', pick(ATTACK_UAS)).then((r) => {
          if (!r) counts.failed++;
          else counts[r.classification as keyof typeof counts]++;
        }),
      );
    }

    await Promise.all(batch);
    await sleep(200);
  }

  console.log('Done.', counts);
}

main();
