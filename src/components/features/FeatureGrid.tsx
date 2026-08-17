import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { TelemetryFeature } from '@/sim/types';
import { cn } from '@/lib/utils';

export function FeatureGrid({ features }: { features: TelemetryFeature[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
      {features.map((f) => (
        <div
          key={f.key}
          className={cn(
            'rounded-lg border p-3 transition-colors',
            f.anomaly
              ? 'border-bad-500/30 bg-bad-500/[0.06]'
              : 'border-white/5 bg-white/[0.02] hover:border-white/10'
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 leading-tight">{f.label}</span>
            {f.delta === 'up' && <ArrowUpRight className={cn('h-3 w-3 shrink-0', f.anomaly ? 'text-bad-400' : 'text-warn-400')} />}
            {f.delta === 'down' && <ArrowDownRight className="h-3 w-3 shrink-0 text-info-400" />}
            {f.delta == null && <Minus className="h-3 w-3 shrink-0 text-slate-600" />}
          </div>
          <div className={cn('mt-1.5 text-lg font-bold tabular-nums', f.anomaly ? 'text-bad-400' : 'text-slate-100')}>
            {f.display}
          </div>
        </div>
      ))}
    </div>
  );
}
