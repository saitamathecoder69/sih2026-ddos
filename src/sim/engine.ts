import type {
  LogEvent,
  ServerHealth,
  SimMode,
  SimState,
  TelemetryFeature,
  TrafficPoint,
  TrafficSource,
} from './types';

let eventCounter = 0;
const now = () => Date.now();
const fmtTime = (t: number) => {
  const d = new Date(t);
  return d.toTimeString().slice(0, 8);
};

const COUNTRIES = ['India', 'USA', 'Germany', 'Brazil', 'Japan', 'Singapore', 'UK', 'Unknown'];
const ASNS = ['AS14618', 'AS16509', 'AS13335', 'AS15169', 'AS8075', 'AS32934'];
const ENDPOINTS = ['/website', '/api/login', '/api/checkout', '/api/search', '/static/assets'];
const UAS = ['Chrome', 'Firefox', 'Safari', 'Bot', 'curl/8', 'python-requests'];

const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const irnd = (min: number, max: number) => Math.floor(rnd(min, max + 1));
const pick = <T,>(arr: T[]): T => arr[irnd(0, arr.length - 1)];

function makeIp(blocked = false): string {
  if (blocked) return `${irnd(2, 223)}.${irnd(0, 255)}.${irnd(0, 255)}.${irnd(1, 254)}`;
  return `192.168.${irnd(0, 16)}.${irnd(1, 254)}`;
}

function defaultServers(): ServerHealth[] {
  return [
    { id: 's1', name: 'App Server 1', status: 'HEALTHY', cpu: 34, memory: 41, rps: 1800, latency: 42, connections: 1200 },
    { id: 's2', name: 'App Server 2', status: 'HEALTHY', cpu: 38, memory: 44, rps: 2100, latency: 48, connections: 1400 },
    { id: 's3', name: 'App Server 3', status: 'HEALTHY', cpu: 31, memory: 39, rps: 1650, latency: 39, connections: 1100 },
  ];
}

function defaultFeatures(): TelemetryFeature[] {
  return [
    { key: 'rps', label: 'Requests/sec', value: 12480, display: '12,480', anomaly: false, unit: 'rps' },
    { key: 'reqPerIp', label: 'Requests / IP', value: 42, display: '42', anomaly: false },
    { key: 'uniqueIps', label: 'Unique IPs', value: 2960, display: '2,960', anomaly: false },
    { key: 'ipConc', label: 'IP / Range Concentration', value: 18, display: '18%', anomaly: false, unit: '%' },
    { key: 'reqCountry', label: 'Requests / Country', value: 4, display: '4', anomaly: false },
    { key: 'reqAsn', label: 'Requests / ASN', value: 6, display: '6', anomaly: false },
    { key: 'reqEndpoint', label: 'Endpoint Concentration', value: 18, display: '18%', anomaly: false, unit: '%' },
    { key: 'errorRate', label: 'Error Rate', value: 0.8, display: '0.8%', anomaly: false, unit: '%' },
    { key: 'concurrent', label: 'Concurrent Connections', value: 8421, display: '8,421', anomaly: false },
    { key: 'bytes', label: 'Bytes In/Out', value: 320, display: '320 MB/s', anomaly: false },
    { key: 'packetRate', label: 'Packet Rate', value: 24, display: '24k pps', anomaly: false },
    { key: 'timePattern', label: 'Time-Based Pattern', value: 12, display: 'Steady', anomaly: false },
    { key: 'geoDist', label: 'Geographic Distribution', value: 22, display: '22 countries', anomaly: false },
    { key: 'newIpRatio', label: 'New IP Ratio', value: 12, display: '12%', anomaly: false, unit: '%' },
    { key: 'uaSimilarity', label: 'UA Similarity', value: 28, display: '28%', anomaly: false, unit: '%' },
  ];
}

function seedHistory(): TrafficPoint[] {
  const pts: TrafficPoint[] = [];
  const base = now() - 60 * 1000;
  for (let i = 0; i < 60; i++) {
    const t = base + i * 1000;
    pts.push({
      t,
      label: fmtTime(t),
      normal: irnd(8000, 14000),
      suspicious: irnd(200, 900),
      malicious: irnd(20, 120),
    });
  }
  return pts;
}

export function createInitialState(): SimState {
  return {
    mode: 'normal',
    systemState: 'NORMAL',
    threatLevel: 'NORMAL',
    riskScore: 18,
    targetRiskScore: 18,
    totalRps: 12480,
    blockedRps: 240,
    activeConnections: 8421,
    errorRate: 0.8,
    appHealth: 99.8,
    trafficHistory: seedHistory(),
    sources: defaultSources(),
    features: defaultFeatures(),
    servers: defaultServers(),
    events: [
      mkEvent('INFO', 'System', 'Traffic baseline established', 'Monitoring', 18),
      mkEvent('INFO', 'Detection', 'Detection engine online', 'Monitoring', 18),
    ],
    mitigationActions: defaultMitigation(),
    ruleEngine: defaultRules(),
    mlModel: defaultMl(),
    attackType: 'None',
    attackTarget: '—',
    attackSeverity: 'LOW',
    attackActive: false,
    mitigationActive: false,
    recoveryActive: false,
    timeToRecover: 0,
    demoRunning: false,
    demoStep: -1,
    demoSteps: [],
    lastUpdated: now(),
    wafBlocked: 240,
    rateLimited: 0,
    challenged: 0,
    lifecyclePhase: 'idle',
    lifecycleStart: 0,
  };
}

function defaultSources(): TrafficSource[] {
  return [
    { id: 'a', ip: '192.168.4.12', rps: 2340, country: 'India', asn: 'AS14618', endpoint: '/website', userAgent: 'Chrome', status: 'LEGITIMATE' },
    { id: 'b', ip: '192.168.8.205', rps: 1820, country: 'USA', asn: 'AS13335', endpoint: '/api/search', userAgent: 'Firefox', status: 'LEGITIMATE' },
    { id: 'c', ip: '192.168.2.77', rps: 1490, country: 'Germany', asn: 'AS16509', endpoint: '/api/checkout', userAgent: 'Safari', status: 'LEGITIMATE' },
    { id: 'd', ip: '203.0.113.5', rps: 180, country: 'Unknown', asn: 'AS32934', endpoint: '/api/login', userAgent: 'Bot', status: 'SUSPICIOUS' },
  ];
}

function defaultMitigation() {
  return [
    { id: 'waf', label: 'WAF Rule Updated', active: false, detail: 'Dynamic rate signature deployed' },
    { id: 'block', label: 'Malicious IPs Blocked', active: false, detail: 'IP ranges blacklisted at edge' },
    { id: 'rate', label: 'Rate Limit Increased', active: false, detail: 'Per-IP throttle 50 → 5 req/s' },
    { id: 'challenge', label: 'Suspicious Clients Challenged', active: false, detail: 'JS challenge issued' },
    { id: 'scrub', label: 'Traffic Scrubbing / Isolation', active: false, detail: 'Malicious flows rerouted to scrubbing center' },
  ];
}

function defaultRules() {
  return [
    { name: 'High request rate', triggered: false, detail: '> 20k req/s sustained' },
    { name: 'IP concentration', triggered: false, detail: 'Single ASN > 60% traffic' },
    { name: 'Endpoint flooding', triggered: false, detail: 'Single endpoint > 80% traffic' },
    { name: 'Repeated spikes', triggered: false, detail: '3σ deviation over 30s window' },
    { name: 'Known suspicious behavior', triggered: false, detail: 'Bot UA / fingerprint match' },
  ];
}

function defaultMl() {
  return [
    { name: 'Behavior analysis', confidence: 12, detail: 'Baseline behavioral profile' },
    { name: 'Traffic anomaly detection', confidence: 8, detail: 'Unsupervised clustering' },
    { name: 'Combined feature patterns', confidence: 6, detail: 'Multi-feature correlation' },
    { name: 'Unknown attack detection', confidence: 4, detail: 'Zero-day pattern recognition' },
  ];
}

function mkEvent(severity: LogEvent['severity'], source: string, message: string, action: string, riskScore: number): LogEvent {
  const t = now();
  eventCounter += 1;
  return { id: `e${eventCounter}-${t}`, t, time: fmtTime(t), severity, source, message, action, riskScore };
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Target profiles per mode
function profileFor(mode: SimMode): {
  risk: number;
  totalRps: number;
  blockedRps: number;
  connections: number;
  errorRate: number;
  health: number;
  normalShare: number;
  suspShare: number;
  malShare: number;
} {
  switch (mode) {
    case 'normal':
    case 'restored':
      return { risk: 18, totalRps: 12480, blockedRps: 240, connections: 8421, errorRate: 0.8, health: 99.8, normalShare: 0.96, suspShare: 0.035, malShare: 0.005 };
    case 'spike':
      return { risk: 56, totalRps: 38000, blockedRps: 4200, connections: 18000, errorRate: 6.5, health: 96.5, normalShare: 0.78, suspShare: 0.19, malShare: 0.03 };
    case 'httpflood':
      return { risk: 86, totalRps: 88000, blockedRps: 76000, connections: 42000, errorRate: 38, health: 71, normalShare: 0.18, suspShare: 0.22, malShare: 0.6 };
    case 'ddos':
      return { risk: 94, totalRps: 122000, blockedRps: 114000, connections: 62000, errorRate: 46, health: 58, normalShare: 0.08, suspShare: 0.17, malShare: 0.75 };
    case 'mitigating':
      return { risk: 78, totalRps: 94000, blockedRps: 88000, connections: 48000, errorRate: 32, health: 74, normalShare: 0.16, suspShare: 0.24, malShare: 0.6 };
    case 'recovering':
      return { risk: 41, totalRps: 24000, blockedRps: 8200, connections: 14000, errorRate: 7.2, health: 84, normalShare: 0.7, suspShare: 0.22, malShare: 0.08 };
    default:
      return { risk: 18, totalRps: 12480, blockedRps: 240, connections: 8421, errorRate: 0.8, health: 99.8, normalShare: 0.96, suspShare: 0.035, malShare: 0.005 };
  }
}

export function setMode(state: SimState, mode: SimMode): SimState {
  const profile = profileFor(mode);
  let threatLevel: SimState['threatLevel'] = 'NORMAL';
  let systemState: SimState['systemState'] = 'NORMAL';
  if (profile.risk > 70) { threatLevel = 'MALICIOUS'; systemState = 'MALICIOUS'; }
  else if (profile.risk > 30) { threatLevel = 'SUSPICIOUS'; systemState = 'SUSPICIOUS'; }
  if (mode === 'mitigating') { systemState = 'MITIGATING'; threatLevel = 'MALICIOUS'; }
  if (mode === 'recovering') { systemState = 'RECOVERING'; threatLevel = 'SUSPICIOUS'; }
  if (mode === 'restored') { systemState = 'RESTORED'; threatLevel = 'NORMAL'; }

  const attackActive = mode === 'httpflood' || mode === 'ddos' || mode === 'mitigating';
  const mitigationActive = attackActive || mode === 'recovering';
  const recoveryActive = mode === 'recovering' || mode === 'restored';

  let attackType = 'None';
  let attackTarget = '—';
  let attackSeverity: SimState['attackSeverity'] = 'LOW';
  if (mode === 'httpflood') { attackType = 'HTTP Flood'; attackTarget = '/api/login'; attackSeverity = 'HIGH'; }
  if (mode === 'ddos') { attackType = 'Distributed DDoS'; attackTarget = '/api/login'; attackSeverity = 'CRITICAL'; }
  if (mode === 'spike') { attackType = 'Traffic Spike'; attackTarget = '/api/search'; attackSeverity = 'MEDIUM'; }
  if (mode === 'mitigating') { attackType = state.attackType || 'Distributed DDoS'; attackTarget = state.attackTarget || '/api/login'; attackSeverity = 'HIGH'; }
  if (mode === 'recovering') { attackType = state.attackType || 'Distributed DDoS (mitigated)'; attackTarget = state.attackTarget || '/api/login'; attackSeverity = 'MEDIUM'; }

  const newEvents: LogEvent[] = [];
  if (mode === 'spike') {
    newEvents.push(mkEvent('WARNING', 'Monitoring', 'Traffic spike detected', 'Observation', 48));
  }
  if (mode === 'httpflood' || mode === 'ddos') {
    newEvents.push(mkEvent('WARNING', 'Detection', 'Traffic anomaly detected', 'Analysis', 52));
    newEvents.push(mkEvent('CRITICAL', 'Detection', `${attackType} detected`, 'Mitigation', profile.risk));
    newEvents.push(mkEvent('ACTION', 'WAF', 'WAF mitigation activated', 'Blocking', profile.risk));
  }
  if (mode === 'mitigating') {
    newEvents.push(mkEvent('ACTION', 'Mitigation', 'Mitigation actions deployed', 'Blocking + Rate Limit', profile.risk));
    newEvents.push(mkEvent('ACTION', 'Edge', 'Malicious IPs blocked at edge', 'IP Blacklist', profile.risk));
  }
  if (mode === 'recovering') {
    newEvents.push(mkEvent('RECOVERY', 'Recovery', 'Automatic recovery initiated', 'Health Check', profile.risk));
  }
  if (mode === 'restored') {
    newEvents.push(mkEvent('RECOVERY', 'Recovery', 'Application health restored', 'Service Restored', 18));
    newEvents.push(mkEvent('INFO', 'System', 'Threat level normalized', 'Monitoring', 18));
  }
  if (mode === 'mitigating' && (state.mode === 'httpflood' || state.mode === 'ddos')) {
    // no duplicate — events pushed above
  }
  if (mode === 'normal' && (state.mode === 'httpflood' || state.mode === 'ddos' || state.mode === 'mitigating' || state.mode === 'recovering' || state.mode === 'restored')) {
    newEvents.push(mkEvent('INFO', 'System', 'Traffic baseline restored', 'Monitoring', 18));
  }

  const mitigation = state.mitigationActions.map((m) => ({ ...m, active: mitigationActive }));
  const rules = state.ruleEngine.map((r) => ({ ...r, triggered: attackActive || mode === 'spike' || mode === 'recovering' }));
  const ml = state.mlModel.map((m, i) => ({
    ...m,
    confidence: attackActive ? [88, 92, 84, 76][i] : mode === 'spike' ? [42, 38, 30, 22][i] : mode === 'recovering' ? [38, 32, 26, 18][i] : [12, 8, 6, 4][i],
  }));

  return {
    ...state,
    mode,
    systemState,
    threatLevel,
    targetRiskScore: profile.risk,
    totalRps: profile.totalRps,
    blockedRps: profile.blockedRps,
    activeConnections: profile.connections,
    errorRate: profile.errorRate,
    appHealth: profile.health,
    attackType,
    attackTarget,
    attackSeverity,
    attackActive,
    mitigationActive,
    recoveryActive,
    timeToRecover: mode === 'recovering' ? 45 : mode === 'restored' ? 0 : 0,
    lifecyclePhase: mode === 'httpflood' || mode === 'ddos' ? 'attack' : mode === 'mitigating' ? 'mitigating' : mode === 'recovering' ? 'recovering' : mode === 'restored' ? 'restored' : 'idle',
    lifecycleStart: (mode === 'httpflood' || mode === 'ddos' || mode === 'spike') ? now() : state.lifecycleStart,
    mitigationActions: mitigation,
    ruleEngine: rules,
    mlModel: ml,
    events: [...newEvents, ...state.events].slice(0, 80),
    lastUpdated: now(),
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function tick(state: SimState): SimState {
  const profile = profileFor(state.mode);
  const t = now();

  // Smoothly interpolate risk score toward target
  const risk = lerp(state.riskScore, state.targetRiskScore, 0.12);
  const totalRps = Math.round(lerp(state.totalRps, profile.totalRps, 0.1) + rnd(-400, 400));
  const blockedRps = Math.round(lerp(state.blockedRps, profile.blockedRps, 0.1) + rnd(-200, 200));
  const connections = Math.round(lerp(state.activeConnections, profile.connections, 0.1) + rnd(-200, 200));
  const errorRate = lerp(state.errorRate, profile.errorRate, 0.1);
  const health = lerp(state.appHealth, profile.health, 0.08);

  // Push new traffic point
  const normalShare = profile.normalShare;
  const suspShare = profile.suspShare;
  const malShare = profile.malShare;
  const np = Math.max(0, Math.round(totalRps * normalShare));
  const sp = Math.max(0, Math.round(totalRps * suspShare));
  const mp = Math.max(0, Math.round(totalRps * malShare));
  const newPoint: TrafficPoint = { t, label: fmtTime(t), normal: np, suspicious: sp, malicious: mp };
  const history = [...state.trafficHistory.slice(-119), newPoint];

  // Features
  const features = updateFeatures(state.features, state.mode, totalRps, connections, errorRate, risk);

  // Servers
  const servers = updateServers(state.servers, state.mode, totalRps, health, state.recoveryActive);

  // Sources
  const sources = updateSources(state.sources, state.mode, totalRps);

  // Time-to-recover countdown
  let timeToRecover = state.timeToRecover;
  if (state.mode === 'recovering' && timeToRecover > 0) {
    timeToRecover = Math.max(0, timeToRecover - 1);
  }

  return {
    ...state,
    riskScore: risk,
    totalRps,
    blockedRps,
    activeConnections: connections,
    errorRate,
    appHealth: health,
    trafficHistory: history,
    features,
    servers,
    sources,
    timeToRecover,
    lastUpdated: t,
  };
}

function updateFeatures(
  prev: TelemetryFeature[],
  mode: SimMode,
  totalRps: number,
  connections: number,
  errorRate: number,
  risk: number,
): TelemetryFeature[] {
  const anomaly = mode === 'httpflood' || mode === 'ddos' || mode === 'mitigating';
  const spike = mode === 'spike';
  const rec = mode === 'recovering';

  const map: Record<string, () => Partial<TelemetryFeature>> = {
    rps: () => ({ value: totalRps, display: totalRps.toLocaleString(), anomaly, delta: anomaly ? 'up' : spike ? 'up' : null }),
    reqPerIp: () => {
      const v = anomaly ? 4820 : spike ? 420 : rec ? 280 : 42;
      return { value: v, display: v.toLocaleString(), anomaly: anomaly || spike, delta: anomaly || spike ? 'up' : null };
    },
    uniqueIps: () => {
      const v = mode === 'ddos' ? 24800 : anomaly ? 8200 : spike ? 6200 : rec ? 4200 : 2960;
      return { value: v, display: v.toLocaleString(), anomaly: anomaly && mode === 'ddos', delta: mode === 'ddos' ? 'up' : null };
    },
    ipConc: () => {
      const v = anomaly ? 91 : spike ? 38 : rec ? 32 : 18;
      return { value: v, display: `${v}%`, anomaly: anomaly || spike, delta: anomaly || spike ? 'up' : null };
    },
    reqCountry: () => ({ value: anomaly ? 1 : 4, display: anomaly ? '1' : '4', anomaly, delta: anomaly ? 'down' : null }),
    reqAsn: () => ({ value: anomaly ? 1 : 6, display: anomaly ? '1' : '6', anomaly, delta: anomaly ? 'down' : null }),
    reqEndpoint: () => {
      const v = anomaly ? 91 : spike ? 42 : rec ? 34 : 18;
      return { value: v, display: `${v}%`, anomaly: anomaly || spike, delta: anomaly || spike ? 'up' : null };
    },
    errorRate: () => ({ value: errorRate, display: `${errorRate.toFixed(1)}%`, anomaly: errorRate > 10, delta: errorRate > 5 ? 'up' : null }),
    concurrent: () => ({ value: connections, display: connections.toLocaleString(), anomaly: connections > 30000, delta: connections > 12000 ? 'up' : null }),
    bytes: () => {
      const v = anomaly ? 1240 : spike ? 540 : rec ? 360 : 320;
      return { value: v, display: `${v} MB/s`, anomaly, delta: anomaly || spike ? 'up' : null };
    },
    packetRate: () => {
      const v = anomaly ? 188 : spike ? 62 : rec ? 38 : 24;
      return { value: v, display: `${v}k pps`, anomaly, delta: anomaly || spike ? 'up' : null };
    },
    timePattern: () => ({ value: anomaly ? 88 : spike ? 52 : rec ? 30 : 12, display: anomaly ? 'Bursty' : spike ? 'Irregular' : 'Steady', anomaly: anomaly || spike }),
    geoDist: () => {
      const v = mode === 'ddos' ? 2 : anomaly ? 4 : spike ? 14 : rec ? 18 : 22;
      return { value: v, display: `${v} countries`, anomaly: anomaly, delta: anomaly ? 'down' : null };
    },
    newIpRatio: () => {
      const v = anomaly ? 84 : spike ? 42 : rec ? 28 : 12;
      return { value: v, display: `${v}%`, anomaly: anomaly || spike, delta: anomaly || spike ? 'up' : null };
    },
    uaSimilarity: () => {
      const v = anomaly ? 92 : spike ? 48 : rec ? 34 : 28;
      return { value: v, display: `${v}%`, anomaly: anomaly, delta: anomaly || spike ? 'up' : null };
    },
  };

  return prev.map((f) => {
    const update = map[f.key]?.() ?? {};
    return { ...f, ...update } as TelemetryFeature;
  });
}

function updateServers(prev: ServerHealth[], mode: SimMode, totalRps: number, health: number, recovery: boolean): ServerHealth[] {
  const attack = mode === 'httpflood' || mode === 'ddos';
  const mitigating = mode === 'mitigating';
  const spike = mode === 'spike';
  const rec = mode === 'recovering';

  const cpuTarget = attack ? 92 : mitigating ? 78 : spike ? 64 : rec ? 48 : 34;
  const memTarget = attack ? 88 : mitigating ? 72 : spike ? 62 : rec ? 52 : 42;
  const latTarget = attack ? 480 : mitigating ? 280 : spike ? 120 : rec ? 70 : 44;
  const connTarget = attack ? 21000 : mitigating ? 14000 : spike ? 6200 : rec ? 3200 : 1200;
  const rpsShare = Math.max(200, Math.round(totalRps / 3));

  return prev.map((s, i) => {
    const isRecovering = rec && i === 1;
    let status: ServerHealth['status'] = 'HEALTHY';
    if (attack) status = i === 1 ? 'UNHEALTHY' : 'UNDER_LOAD';
    else if (mitigating) status = i === 1 ? 'RECOVERING' : 'UNDER_LOAD';
    else if (spike) status = 'UNDER_LOAD';
    else if (isRecovering) status = 'RECOVERING';

    return {
      ...s,
      status,
      cpu: Math.round(lerp(s.cpu, cpuTarget + rnd(-3, 3), 0.12)),
      memory: Math.round(lerp(s.memory, memTarget + rnd(-2, 2), 0.1)),
      rps: Math.round(lerp(s.rps, rpsShare + rnd(-100, 100), 0.12)),
      latency: Math.round(lerp(s.latency, latTarget + rnd(-20, 20), 0.12)),
      connections: Math.round(lerp(s.connections, connTarget + rnd(-300, 300), 0.12)),
    };
  });
}

function updateSources(prev: TrafficSource[], mode: SimMode, totalRps: number): TrafficSource[] {
  const attack = mode === 'httpflood' || mode === 'ddos';
  const mitigating = mode === 'mitigating';
  const spike = mode === 'spike';
  const rec = mode === 'recovering';

  if (attack) {
    const malicious: TrafficSource[] = Array.from({ length: 6 }).map((_, i) => ({
      id: `m${i}`,
      ip: makeIp(true),
      rps: irnd(8000, 28000),
      country: pick(['Unknown', 'Russia', 'China', 'Brazil']),
      asn: pick(['AS32934', 'AS8075', 'AS13335']),
      endpoint: '/api/login',
      userAgent: pick(['Bot', 'curl/8', 'python-requests']),
      status: 'BLOCKED',
    }));
    const legit = prev.filter((s) => s.status === 'LEGITIMATE').slice(0, 3).map((s) => ({
      ...s,
      rps: irnd(800, 2400),
    }));
    return [...legit, ...malicious].slice(0, 9);
  }
  if (mitigating) {
    // some malicious sources remain but are being blocked, rps dropping
    const malicious: TrafficSource[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `m${i}`,
      ip: makeIp(true),
      rps: irnd(2000, 8000),
      country: pick(['Unknown', 'Russia', 'China', 'Brazil']),
      asn: pick(['AS32934', 'AS8075', 'AS13335']),
      endpoint: '/api/login',
      userAgent: pick(['Bot', 'curl/8', 'python-requests']),
      status: 'BLOCKED',
    }));
    const legit = prev.filter((s) => s.status === 'LEGITIMATE').slice(0, 3).map((s) => ({
      ...s,
      rps: irnd(900, 2200),
    }));
    return [...legit, ...malicious].slice(0, 8);
  }
  if (spike) {
    const susp: TrafficSource[] = Array.from({ length: 2 }).map((_, i) => ({
      id: `s${i}`,
      ip: makeIp(true),
      rps: irnd(4000, 9000),
      country: 'Unknown',
      asn: 'AS32934',
      endpoint: '/api/search',
      userAgent: 'Bot',
      status: 'SUSPICIOUS',
    }));
    const legit = prev.filter((s) => s.status === 'LEGITIMATE').slice(0, 3).map((s) => ({
      ...s,
      rps: irnd(1200, 2800),
    }));
    return [...legit, ...susp];
  }
  if (rec) {
    return prev.map((s) => s.status === 'BLOCKED'
      ? { ...s, rps: Math.round(s.rps * 0.1), status: 'SUSPICIOUS' as const }
      : { ...s, rps: irnd(900, 2400) });
  }
  // normal
  return defaultSources().map((s) => ({ ...s, rps: irnd(900, 2600) }));
}

// Demo sequence
export const DEMO_STEPS: { label: string; duration: number; mode: SimMode }[] = [
  { label: 'Normal Traffic', duration: 4000, mode: 'normal' },
  { label: 'Traffic Spike', duration: 4000, mode: 'spike' },
  { label: 'Suspicious Behavior', duration: 3000, mode: 'spike' },
  { label: 'DDoS Attack', duration: 6000, mode: 'ddos' },
  { label: 'Risk Score Rising', duration: 4000, mode: 'ddos' },
  { label: 'DDoS Detected', duration: 3000, mode: 'ddos' },
  { label: 'Automatic Mitigation', duration: 5000, mode: 'mitigating' },
  { label: 'Malicious Traffic Drops', duration: 4000, mode: 'recovering' },
  { label: 'Application Recovers', duration: 4000, mode: 'recovering' },
  { label: 'Risk Score Normalizes', duration: 3000, mode: 'recovering' },
  { label: 'System Protected', duration: 3000, mode: 'restored' },
];
