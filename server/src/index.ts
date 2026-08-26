import express from 'express';
import cors from 'cors';
import { recordAndEvaluate, currentStats, sweepStaleIps } from './ruleEngine.js';
import { classifyAnomaly, isGeminiConfigured } from './gemini.js';
import { recordEvent, isSupabaseConfigured } from './supabase.js';
import type { TrafficEventInput, DetectionResult, Classification } from './types.js';

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const ALLOW_SIMULATED_SOURCE_IP = process.env.ALLOW_SIMULATED_SOURCE_IP === 'true';
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: isGeminiConfigured,
    supabaseConfigured: isSupabaseConfigured,
    allowSimulatedSourceIp: ALLOW_SIMULATED_SOURCE_IP,
  });
});

app.get('/stats', (_req, res) => {
  res.json(currentStats());
});

function classify(riskScore: number): { classification: Classification; action: DetectionResult['action'] } {
  if (riskScore >= 71) return { classification: 'MALICIOUS', action: 'BLOCK' };
  if (riskScore >= 31) return { classification: 'SUSPICIOUS', action: 'CHALLENGE' };
  return { classification: 'LEGITIMATE', action: 'ALLOW' };
}

app.post('/ingest', async (req, res) => {
  const body = req.body as Partial<TrafficEventInput>;
  if (!body.endpoint || !body.method || !body.userAgent) {
    res.status(400).json({ error: 'endpoint, method, and userAgent are required' });
    return;
  }

  // Real deployments must never trust a client-supplied source IP. This
  // override exists only so the bundled traffic generator can simulate a
  // distributed swarm of attackers from a single process, and only when
  // explicitly enabled.
  const sourceIp =
    ALLOW_SIMULATED_SOURCE_IP && body.simulatedSourceIp ? body.simulatedSourceIp : req.ip ?? 'unknown';

  const { ruleScore, rulesTriggered, requestsInWindow } = recordAndEvaluate(sourceIp, body.endpoint, body.userAgent);

  // Only spend a Gemini call when the rule engine already found something
  // worth a second opinion — keeps well within the free-tier rate limit
  // even under sustained traffic-generator load.
  let mlConfidence: number | null = null;
  if (ruleScore > 0) {
    mlConfidence = await classifyAnomaly({
      requestsInWindow,
      windowSeconds: 10,
      rulesTriggered,
      endpoint: body.endpoint,
      userAgent: body.userAgent,
    });
  }

  const riskScore = mlConfidence !== null ? Math.round(ruleScore * 0.5 + mlConfidence * 0.5) : ruleScore;
  const { classification, action } = classify(riskScore);

  const result: DetectionResult = {
    sourceIp,
    endpoint: body.endpoint,
    ruleScore,
    rulesTriggered,
    mlConfidence,
    mlSource: mlConfidence !== null ? 'gemini' : 'rules-only',
    riskScore,
    classification,
    action,
  };

  void recordEvent(result);
  res.json(result);
});

setInterval(sweepStaleIps, 30_000);

app.listen(PORT, () => {
  console.log(`LakshmanRekha backend listening on :${PORT}`);
  console.log(`  Gemini configured:   ${isGeminiConfigured}`);
  console.log(`  Supabase configured: ${isSupabaseConfigured}`);
});
