import { ScrollText, AlertTriangle, ShieldAlert, Wrench, HeartPulse, Info } from 'lucide-react';
import type { LogEvent } from '@/sim/types';
import { cn } from '@/lib/utils';

const severityConfig: Record<LogEvent['severity'], { icon: typeof Info; tone: string; dot: string; label: string }> = {
  INFO: { icon: Info, tone: 'text-info-400', dot: 'bg-info-400', label: 'INFO' },
  WARNING: { icon: AlertTriangle, tone: 'text-warn-400', dot: 'bg-warn-400', label: 'WARN' },
  CRITICAL: { icon: ShieldAlert, tone: 'text-bad-400', dot: 'bg-bad-400', label: 'CRIT' },
  ACTION: { icon: Wrench, tone: 'text-brand-300', dot: 'bg-brand-400', label: 'ACT' },
  RECOVERY: { icon: HeartPulse, tone: 'text-ok-400', dot: 'bg-ok-400', label: 'REC' },
};

export function EventFeed({ events, max = 12 }: { events: LogEvent[]; max?: number }) {
  const shown = events.slice(0, max);
  return (
    <div className="space-y-1.5">
      {shown.map((e) => {
        const cfg = severityConfig[e.severity];
        const Icon = cfg.icon;
        return (
          <div key={e.id} className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 animate-slideUp">
            <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', cfg.tone)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-slate-500">{e.time}</span>
                <span className={cn('text-[10px] font-bold px-1.5 rounded', cfg.tone, 'bg-current/10')} style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {cfg.label}
                </span>
                <span className="text-sm text-slate-200">{e.message}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                <span>Source: <span className="text-slate-400">{e.source}</span></span>
                <span>·</span>
                <span>Action: <span className="text-slate-400">{e.action}</span></span>
                {e.riskScore > 0 && (
                  <>
                    <span>·</span>
                    <span>Risk: <span className="font-mono text-slate-400">{e.riskScore}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {shown.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <ScrollText className="h-4 w-4" />
          No events recorded
        </div>
      )}
    </div>
  );
}
