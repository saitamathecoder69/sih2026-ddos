import { Check, AlertTriangle, ShieldX, ArrowRight } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

const branches = [
  {
    key: 'normal',
    range: '0 – 30',
    label: 'NORMAL',
    action: 'ALLOW TRAFFIC',
    icon: Check,
    tone: 'text-ok-400',
    border: 'border-ok-500/30',
    bg: 'bg-ok-500/5',
    activeBg: 'bg-ok-500/15 border-ok-500/50',
  },
  {
    key: 'suspicious',
    range: '31 – 70',
    label: 'SUSPICIOUS',
    action: 'CHALLENGE / RATE LIMIT',
    icon: AlertTriangle,
    tone: 'text-warn-400',
    border: 'border-warn-500/30',
    bg: 'bg-warn-500/5',
    activeBg: 'bg-warn-500/15 border-warn-500/50',
  },
  {
    key: 'malicious',
    range: '71 – 100',
    label: 'MALICIOUS',
    action: 'AUTOMATIC MITIGATION',
    icon: ShieldX,
    tone: 'text-bad-400',
    border: 'border-bad-500/30',
    bg: 'bg-bad-500/5',
    activeBg: 'bg-bad-500/15 border-bad-500/50',
  },
];

export function DecisionBranch({ state }: { state: SimState }) {
  const activeKey = state.threatLevel.toLowerCase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {branches.map((b) => {
        const Icon = b.icon;
        const active = b.key === activeKey;
        return (
          <div
            key={b.key}
            className={cn(
              'rounded-xl border p-4 transition-all duration-300',
              active ? cn(b.activeBg, 'scale-[1.02]') : cn(b.bg, b.border, 'opacity-60')
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('grid place-items-center h-10 w-10 rounded-lg bg-ink-900/60 border border-white/10', b.tone)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn('text-xs font-mono font-medium', b.tone)}>{b.range}</span>
            </div>
            <div className={cn('text-base font-bold tracking-wide', b.tone)}>{b.label}</div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-300">
              <ArrowRight className={cn('h-3.5 w-3.5', active ? b.tone : 'text-slate-600')} />
              <span>{b.action}</span>
            </div>
            {active && (
              <div className={cn('mt-2 text-[11px] font-medium animate-slideUp', b.tone)}>
                ● Active
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
