import type { LogEvent } from '@/sim/types';
import { cn } from '@/lib/utils';

const toneFor = (severity: LogEvent['severity']) => {
  switch (severity) {
    case 'INFO': return 'border-info-500/40 bg-info-500/10 text-info-400';
    case 'WARNING': return 'border-warn-500/40 bg-warn-500/10 text-warn-400';
    case 'CRITICAL': return 'border-bad-500/40 bg-bad-500/10 text-bad-400';
    case 'ACTION': return 'border-brand-500/40 bg-brand-500/10 text-brand-300';
    case 'RECOVERY': return 'border-ok-500/40 bg-ok-500/10 text-ok-400';
  }
};

export function AttackTimeline({ events }: { events: LogEvent[] }) {
  const timelineEvents = events.filter((e) => e.severity !== 'INFO' || e.message.includes('baseline') || e.message.includes('normalized')).slice(0, 8);

  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/5" />
      <div className="space-y-3">
        {timelineEvents.map((e) => (
          <div key={e.id} className="relative">
            <div className={cn('absolute -left-[18px] top-1 h-3.5 w-3.5 rounded-full border-2', toneFor(e.severity))} />
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">{e.time}</span>
              <span className={cn('text-sm font-medium', toneFor(e.severity).split(' ').find((c) => c.startsWith('text-')))}>
                {e.message}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 ml-1">
              {e.source} · {e.action} · Risk {e.riskScore}
            </div>
          </div>
        ))}
        {timelineEvents.length === 0 && (
          <div className="text-sm text-slate-500 py-4">No attack events yet.</div>
        )}
      </div>
    </div>
  );
}
