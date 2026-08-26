export type ThreatLevel = 'NORMAL' | 'SUSPICIOUS' | 'MALICIOUS';

export type SimMode =
  | 'normal'
  | 'spike'
  | 'httpflood'
  | 'ddos'
  | 'mitigating'
  | 'recovering'
  | 'restored';

export type SystemState =
  | 'NORMAL'
  | 'SUSPICIOUS'
  | 'MALICIOUS'
  | 'MITIGATING'
  | 'RECOVERING'
  | 'RESTORED';

export interface TrafficPoint {
  t: number; // epoch ms
  label: string; // hh:mm:ss
  normal: number;
  suspicious: number;
  malicious: number;
}

export interface TrafficSource {
  id: string;
  ip: string;
  rps: number;
  country: string;
  asn: string;
  endpoint: string;
  userAgent: string;
  status: 'LEGITIMATE' | 'SUSPICIOUS' | 'BLOCKED';
}

export interface TelemetryFeature {
  key: string;
  label: string;
  value: number;
  display: string;
  delta?: 'up' | 'down' | null;
  anomaly: boolean;
  unit?: string;
}

export interface ServerHealth {
  id: string;
  name: string;
  status: 'HEALTHY' | 'UNDER_LOAD' | 'UNHEALTHY' | 'RECOVERING' | 'REPLACING';
  cpu: number;
  memory: number;
  rps: number;
  latency: number;
  connections: number;
}

export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'ACTION' | 'RECOVERY';

export interface LogEvent {
  id: string;
  t: number;
  time: string;
  severity: EventSeverity;
  source: string;
  message: string;
  action: string;
  riskScore: number;
}

export interface MitigationActionItem {
  id: string;
  label: string;
  active: boolean;
  detail: string;
}

export interface SimState {
  mode: SimMode;
  systemState: SystemState;
  threatLevel: ThreatLevel;
  riskScore: number;
  targetRiskScore: number;
  totalRps: number;
  blockedRps: number;
  activeConnections: number;
  errorRate: number;
  appHealth: number; // percent
  trafficHistory: TrafficPoint[];
  sources: TrafficSource[];
  features: TelemetryFeature[];
  servers: ServerHealth[];
  events: LogEvent[];
  mitigationActions: MitigationActionItem[];
  ruleEngine: { name: string; triggered: boolean; detail: string }[];
  mlModel: { name: string; confidence: number; detail: string }[];
  attackType: string;
  attackTarget: string;
  attackSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attackActive: boolean;
  mitigationActive: boolean;
  recoveryActive: boolean;
  timeToRecover: number;
  demoRunning: boolean;
  demoStep: number;
  demoSteps: { label: string; duration: number }[];
  lastUpdated: number;
  wafBlocked: number;
  rateLimited: number;
  challenged: number;
  lifecyclePhase: 'idle' | 'attack' | 'mitigating' | 'recovering' | 'restored';
  lifecycleStart: number;
  datasetId: string | null;
  datasetName: string | null;
  datasetStatus: 'synthetic' | 'replay';
  /**
   * True only when the most recent tick actually rendered features/sources
   * from real sampled records. datasetStatus flips to 'replay' the instant
   * a dataset is selected, before any data has necessarily arrived (e.g.
   * live-backend before its first real event, or a bundle that samples
   * empty for the current mode) — this field distinguishes "a replay
   * source is selected" from "the screen is currently showing real data",
   * so the UI never claims live/real data while actually still showing the
   * synthetic fallback.
   */
  usingReplayData: boolean;
}

export interface Profile {
  risk: number;
  totalRps: number;
  blockedRps: number;
  connections: number;
  errorRate: number;
  health: number;
  normalShare: number;
  suspShare: number;
  malShare: number;
}

export interface ReplayRecord {
  label: 'benign' | 'attack';
  attackCat: string;
  proto: string;
  service: string;
  srcBytes: number;
  dstBytes: number;
  duration: number;
  rate: number;
  errorRate: number;
  count: number;
  srvCount: number;
  uniqueHosts: number;
  /**
   * Real source IP, when the record actually has one (e.g. live backend
   * detections). Feature-extracted datasets like NSL-KDD/UNSW-NB15 have no
   * such field and leave this undefined, in which case the UI synthesizes
   * a stable pseudo-IP instead — see synthIp() in replay.ts.
   */
  sourceIp?: string;
}

export interface ReplayBundle {
  id: string;
  name: string;
  sourceFile: string;
  generatedAt: string;
  benign: ReplayRecord[];
  attack: ReplayRecord[];
}
