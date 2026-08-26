import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { ReplayBundle, ReplayRecord } from './types';

const MAX_BUFFER = 200;

interface TrafficEventRow {
  source_ip: string;
  endpoint: string;
  rule_score: number;
  rules_triggered: string[];
  risk_score: number;
  classification: 'LEGITIMATE' | 'SUSPICIOUS' | 'MALICIOUS';
}

const SELECT_COLUMNS = 'source_ip,endpoint,rule_score,rules_triggered,risk_score,classification';

/**
 * ReplayRecord only has a binary benign/attack label, but the real backend
 * has three classifications (LEGITIMATE/SUSPICIOUS/MALICIOUS). Only
 * MALICIOUS maps to 'attack' — SUSPICIOUS stays 'benign' here, and
 * recordsToSources() in replay.ts recovers the SUSPICIOUS distinction from
 * errorRate (set below to risk_score/100, so SUSPICIOUS's 31-70 risk band
 * lands above its > 0.3 threshold). Collapsing SUSPICIOUS into 'attack'
 * would make recordsToSources render challenged traffic as BLOCKED.
 */
function toLabel(classification: TrafficEventRow['classification']): 'benign' | 'attack' {
  return classification === 'MALICIOUS' ? 'attack' : 'benign';
}

function rowToRecord(row: TrafficEventRow): ReplayRecord {
  return {
    label: toLabel(row.classification),
    attackCat: row.rules_triggered?.[0] ?? row.classification,
    proto: 'http',
    service: row.endpoint,
    srcBytes: 0,
    dstBytes: 0,
    duration: 0,
    rate: row.rule_score,
    errorRate: row.risk_score / 100,
    count: 1,
    srvCount: 1,
    uniqueHosts: 1,
    sourceIp: row.source_ip,
  };
}

function toBundle(rows: TrafficEventRow[]): ReplayBundle {
  const benign = rows.filter((r) => toLabel(r.classification) === 'benign').map(rowToRecord);
  const attack = rows.filter((r) => toLabel(r.classification) === 'attack').map(rowToRecord);
  return {
    id: 'live-backend',
    name: 'Live Backend',
    sourceFile: 'supabase:traffic_events',
    generatedAt: new Date().toISOString(),
    benign,
    attack,
  };
}

/**
 * Subscribe to real detection events written by server/src/supabase.ts and
 * keep calling `onUpdate` with a fresh ReplayBundle built from the most
 * recent real rows. This deliberately reuses the same ReplayBundle shape
 * the static dataset bundles use (see src/sim/replay.ts) so the engine's
 * existing sampling/aggregation logic works unmodified on live data — the
 * only difference is where the records come from.
 *
 * Throws synchronously if Supabase isn't configured so the caller can fall
 * back to built-in simulation immediately, matching the graceful-degradation
 * pattern used everywhere else this project touches an optional external
 * service.
 */
export function subscribeLiveBackend(onUpdate: (bundle: ReplayBundle) => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing)');
  }
  const client = supabase;

  let buffer: TrafficEventRow[] = [];
  let cancelled = false;

  client
    .from('traffic_events')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(MAX_BUFFER)
    .then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.warn('[liveBackend] initial fetch failed:', error.message);
        return;
      }
      if (data) {
        buffer = data as unknown as TrafficEventRow[];
        onUpdate(toBundle(buffer));
      }
    });

  const channel = client
    .channel('traffic_events_live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'traffic_events' }, (payload) => {
      if (cancelled) return;
      buffer = [payload.new as TrafficEventRow, ...buffer].slice(0, MAX_BUFFER);
      onUpdate(toBundle(buffer));
    })
    .subscribe();

  return () => {
    cancelled = true;
    client.removeChannel(channel);
  };
}
