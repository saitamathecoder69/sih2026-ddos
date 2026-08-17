import { type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info' | 'brand' | 'tele';

const toneText: Record<Tone, string> = {
  neutral: 'text-slate-200',
  ok: 'text-ok-400',
  warn: 'text-warn-400',
  bad: 'text-bad-400',
  info: 'text-info-400',
  brand: 'text-brand-300',
  tele: 'text-tele-400',
};

const toneGlow: Record<Tone, string> = {
  neutral: 'from-white/5',
  ok: 'from-ok-500/10',
  warn: 'from-warn-500/10',
  bad: 'from-bad-500/10',
  info: 'from-info-500/10',
  brand: 'from-brand-500/10',
  tele: 'from-tele-500/10',
};

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: Tone;
  icon?: ReactNode;
  delta?: 'up' | 'down' | null;
  deltaLabel?: string;
  deltaTone?: 'ok' | 'bad' | 'neutral';
  hint?: string;
}

export function MetricCard({ label, value, unit, tone = 'neutral', icon, delta, deltaLabel, deltaTone = 'neutral', hint }: MetricCardProps) {
  return (
    <div className={cn('card card-hover relative overflow-hidden p-4')}>
      <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-60 pointer-events-none', toneGlow[tone])} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
          {icon && <span className={cn('opacity-80', toneText[tone])}>{icon}</span>}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-2xl font-bold tabular-nums', toneText[tone])}>{value}</span>
          {unit && <span className="text-xs text-slate-500">{unit}</span>}
        </div>
        {(delta || deltaLabel) && (
          <div className="mt-2 flex items-center gap-1.5">
            {delta === 'up' && <ArrowUpRight className={cn('h-3.5 w-3.5', deltaTone === 'bad' ? 'text-bad-400' : deltaTone === 'ok' ? 'text-ok-400' : 'text-slate-400')} />}
            {delta === 'down' && <ArrowDownRight className={cn('h-3.5 w-3.5', deltaTone === 'bad' ? 'text-bad-400' : deltaTone === 'ok' ? 'text-ok-400' : 'text-slate-400')} />}
            {deltaLabel && <span className={cn('text-xs', deltaTone === 'bad' ? 'text-bad-400' : deltaTone === 'ok' ? 'text-ok-400' : 'text-slate-400')}>{deltaLabel}</span>}
          </div>
        )}
        {hint && <div className="mt-1.5 text-[11px] text-slate-500">{hint}</div>}
      </div>
    </div>
  );
}
