import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DetectionResult } from './types.js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;
if (url && serviceKey) {
  client = createClient(url, serviceKey, { auth: { persistSession: false } });
} else {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — persistence and live push disabled.');
}

export const isSupabaseConfigured = client !== null;

/**
 * Persist one detection result. Never throws — a demo backend must keep
 * answering /ingest even if the database is unreachable or not yet
 * configured; the caller already has the result it needs to return to the
 * traffic generator regardless of whether this succeeds.
 */
export async function recordEvent(result: DetectionResult): Promise<void> {
  if (!client) return;
  const { error } = await client.from('traffic_events').insert({
    source_ip: result.sourceIp,
    endpoint: result.endpoint,
    rule_score: result.ruleScore,
    rules_triggered: result.rulesTriggered,
    ml_confidence: result.mlConfidence,
    ml_source: result.mlSource,
    risk_score: result.riskScore,
    classification: result.classification,
    action: result.action,
  });
  if (error) console.warn('[supabase] insert failed:', error.message);
}
