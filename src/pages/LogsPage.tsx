import { ScrollText, Activity } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { EventFeed } from '@/components/features/EventFeed';
import { PageHeader } from '@/components/ui/PageHeader';
import type { LogEvent } from '@/sim/types';
import { cn } from '@/lib/utils';

const severityTone: Record<LogEvent['severity'], string> = {
  INFO: 'text-info-400 bg-info-500/10 border-info-500/20',
  WARNING: 'text-warn-400 bg-warn-500/10 border-warn-500/20',
  CRITICAL: 'text-bad-400 bg-bad-500/10 border-bad-500/20',
  ACTION: 'text-brand-300 bg-brand-500/10 border-brand-500/20',
  RECOVERY: 'text-ok-400 bg-ok-500/10 border-ok-500/20',
};

export function LogsPage() {
  const { state } = useSim();

  return (
    <div>
      <PageHeader
        title="Logs & Events"
        subtitle="Real-time security event log with severity, source, and risk score"
        icon={<ScrollText className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['INFO', 'WARNING', 'CRITICAL', 'ACTION', 'RECOVERY'] as LogEvent['severity'][]).map((sev) => {
            const count = state.events.filter((e) => e.severity === sev).length;
            return (
              <div key={sev} className={cn('rounded-lg border p-3', severityTone[sev])}>
                <div className="text-[11px] uppercase tracking-wider opacity-80">{sev}</div>
                <div className="text-2xl font-bold font-mono mt-1">{count}</div>
              </div>
            );
          })}
        </div>

        <Card title="Event Log" subtitle="Full real-time event feed" icon={<Activity className="h-4 w-4" />} action={
          <span className="text-xs text-slate-500 font-mono">{state.events.length} events</span>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <th className="py-2 pr-3 font-medium">Timestamp</th>
                  <th className="py-2 pr-3 font-medium">Event</th>
                  <th className="py-2 pr-3 font-medium">Severity</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {state.events.slice(0, 30).map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-3 font-mono text-slate-500 text-xs">{e.time}</td>
                    <td className="py-2.5 pr-3 text-slate-200">{e.message}</td>
                    <td className="py-2.5 pr-3">
                      <span className={cn('chip text-[10px] font-medium border', severityTone[e.severity])}>{e.severity}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-400">{e.source}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{e.action}</td>
                    <td className="py-2.5 pr-3 font-mono text-slate-300">{e.riskScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Live Event Feed" subtitle="Most recent events" icon={<ScrollText className="h-4 w-4" />}>
          <EventFeed events={state.events} max={15} />
        </Card>
      </div>
    </div>
  );
}
