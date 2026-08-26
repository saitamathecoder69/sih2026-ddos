const WINDOW_MS = 10_000;
const RATE_THRESHOLD_PER_WINDOW = 40; // > ~4 req/s sustained from one IP
const ENDPOINT_CONCENTRATION_THRESHOLD = 0.7; // one endpoint > 70% of recent traffic
const UA_REPEAT_THRESHOLD = 25; // identical UA string seen this many times in the window

interface Hit {
  t: number;
  endpoint: string;
  userAgent: string;
}

// In-memory sliding window. Fine for a single free-tier instance; a real
// multi-instance deployment would move this to Redis (also free-tier
// available on Upstash) so counters are shared across replicas.
const hitsByIp = new Map<string, Hit[]>();
const globalHits: Hit[] = [];

function prune(list: Hit[], now: number): Hit[] {
  const cutoff = now - WINDOW_MS;
  let start = 0;
  while (start < list.length && list[start].t < cutoff) start++;
  return start === 0 ? list : list.slice(start);
}

export interface RuleResult {
  ruleScore: number;
  rulesTriggered: string[];
  requestsInWindow: number;
}

export function recordAndEvaluate(sourceIp: string, endpoint: string, userAgent: string): RuleResult {
  const now = Date.now();
  const hit: Hit = { t: now, endpoint, userAgent };

  const ipHits = prune(hitsByIp.get(sourceIp) ?? [], now);
  ipHits.push(hit);
  hitsByIp.set(sourceIp, ipHits);

  const pruned = prune(globalHits, now);
  globalHits.length = 0;
  globalHits.push(...pruned, hit);

  const rulesTriggered: string[] = [];
  let ruleScore = 0;

  if (ipHits.length > RATE_THRESHOLD_PER_WINDOW) {
    rulesTriggered.push(`High request rate from single source (${ipHits.length} in ${WINDOW_MS / 1000}s)`);
    ruleScore += 40;
  }

  const endpointCounts = new Map<string, number>();
  for (const h of globalHits) endpointCounts.set(h.endpoint, (endpointCounts.get(h.endpoint) ?? 0) + 1);
  const topEndpointShare = Math.max(...endpointCounts.values()) / globalHits.length;
  if (globalHits.length >= 20 && topEndpointShare > ENDPOINT_CONCENTRATION_THRESHOLD) {
    rulesTriggered.push(`Endpoint flooding (${Math.round(topEndpointShare * 100)}% of traffic to one endpoint)`);
    ruleScore += 25;
  }

  const sameUaCount = ipHits.filter((h) => h.userAgent === userAgent).length;
  if (sameUaCount > UA_REPEAT_THRESHOLD) {
    rulesTriggered.push(`Repeated identical user-agent from one source (${sameUaCount}x)`);
    ruleScore += 15;
  }

  if (/curl|python-requests|bot|scrapy/i.test(userAgent) && ipHits.length > 10) {
    rulesTriggered.push('Known automation user-agent under load');
    ruleScore += 20;
  }

  return { ruleScore: Math.min(100, ruleScore), rulesTriggered, requestsInWindow: ipHits.length };
}

/** Drop IPs with no hits left in the window so the map doesn't grow forever. */
export function sweepStaleIps() {
  const now = Date.now();
  for (const [ip, hits] of hitsByIp) {
    const pruned = prune(hits, now);
    if (pruned.length === 0) hitsByIp.delete(ip);
    else hitsByIp.set(ip, pruned);
  }
}

export function currentStats() {
  const now = Date.now();
  const pruned = prune(globalHits, now);
  return {
    requestsInWindow: pruned.length,
    uniqueSources: hitsByIp.size,
    windowSeconds: WINDOW_MS / 1000,
  };
}
