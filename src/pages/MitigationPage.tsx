import { Shield, Clock, Activity } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { MitigationPanel } from '@/components/features/MitigationPanel';
import { AttackTimeline } from '@/components/features/AttackTimeline';
import { PageHeader } from '@/components/ui/PageHeader';

export function MitigationPage() {
  const { state } = useSim();

  return (
    <div>
      <PageHeader
        title="Mitigation"
        subtitle="Automatic DDoS mitigation actions and attack response timeline"
        icon={<Shield className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <Card title="Mitigation Status" subtitle="Attack details and automated response" icon={<Shield className="h-4 w-4" />}>
          <MitigationPanel state={state} />
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card title="Automated Response Timeline" subtitle="Chronological attack response events" icon={<Clock className="h-4 w-4" />}>
            <AttackTimeline events={state.events} />
          </Card>
          <Card title="Mitigation Metrics" subtitle="Live response counters" icon={<Activity className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">WAF Blocked</div>
                <div className="text-xl font-bold font-mono text-bad-400 mt-1">{state.wafBlocked.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Rate Limited</div>
                <div className="text-xl font-bold font-mono text-warn-400 mt-1">{state.rateLimited.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Challenged</div>
                <div className="text-xl font-bold font-mono text-brand-300 mt-1">{state.challenged.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Blocked/sec</div>
                <div className="text-xl font-bold font-mono text-bad-400 mt-1">{state.blockedRps.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
