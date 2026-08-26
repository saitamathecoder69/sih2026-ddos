export interface TrafficEventInput {
  endpoint: string;
  method: string;
  userAgent: string;
  bytes: number;
  country?: string;
  /**
   * Only honored when ALLOW_SIMULATED_SOURCE_IP=true. Lets the bundled
   * traffic generator simulate a distributed swarm of attackers from one
   * process. A real deployment must set that flag to false so the source
   * IP always comes from the actual connection (req.ip / X-Forwarded-For),
   * never a value the caller can supply.
   */
  simulatedSourceIp?: string;
}

export type Classification = 'LEGITIMATE' | 'SUSPICIOUS' | 'MALICIOUS';

export interface DetectionResult {
  sourceIp: string;
  endpoint: string;
  ruleScore: number;
  rulesTriggered: string[];
  mlConfidence: number | null;
  mlSource: 'gemini' | 'rules-only';
  riskScore: number;
  classification: Classification;
  action: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
}
