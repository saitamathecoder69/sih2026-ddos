import { Activity, TrendingUp, Crosshair, Skull, Square, Play } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import type { SimMode } from '@/sim/types';
import { cn } from '@/lib/utils';

interface SimOption {
  mode: SimMode;
  label: string;
  desc: string;
  icon: typeof Activity;
  tone: 'ok' | 'warn' | 'bad';
}

const options: SimOption[] = [
  { mode: 'normal', label: 'Normal Traffic', desc: 'Return to healthy baseline', icon: Activity, tone: 'ok' },
  { mode: 'spike', label: 'Traffic Spike', desc: 'Moderate surge · Suspicious range', icon: TrendingUp, tone: 'warn' },
  { mode: 'httpflood', label: 'HTTP Flood', desc: 'Application-layer flood on /api/login', icon: Crosshair, tone: 'bad' },
  { mode: 'ddos', label: 'Distributed DDoS', desc: 'Multiple sources · Critical risk', icon: Skull, tone: 'bad' },
];

const toneClasses = {
  ok: { btn: 'btn-ok', active: 'ring-ok-500/50', label: 'text-ok-400' },
  warn: { btn: 'btn-warn', active: 'ring-warn-500/50', label: 'text-warn-400' },
  bad: { btn: 'btn-bad', active: 'ring-bad-500/50', label: 'text-bad-400' },
};

export function AttackSimulator() {
  const { state, setMode, isDemoRunning } = useSim();

  const handle = (mode: SimMode) => {
    if (!isDemoRunning) setMode(mode);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((o) => {
          const Icon = o.icon;
          const active = state.mode === o.mode || (o.mode === 'ddos' && state.mode === 'httpflood');
          const tc = toneClasses[o.tone];
          return (
            <button
              key={o.mode}
              onClick={() => handle(o.mode)}
              disabled={isDemoRunning}
              className={cn(
                'group text-left rounded-xl border p-4 transition-all',
                active
                  ? cn('border-white/10 bg-white/[0.04] ring-2 ring-offset-2 ring-offset-ink-900', tc.active)
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn('grid place-items-center h-10 w-10 rounded-lg bg-ink-900/60 border border-white/10', tc.label)}>
                  <Icon className="h-5 w-5" />
                </div>
                {active && <span className={cn('h-2 w-2 rounded-full animate-pulseDot', o.tone === 'ok' ? 'bg-ok-400' : o.tone === 'warn' ? 'bg-warn-400' : 'bg-bad-400')} />}
              </div>
              <div className={cn('text-sm font-bold', tc.label)}>{o.label}</div>
              <div className="mt-1 text-[11px] text-slate-500 leading-relaxed">{o.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => handle('normal')} disabled={isDemoRunning} className="btn-ghost border border-white/5">
          <Square className="h-4 w-4" />
          Stop Attack
        </button>
        <div className="text-xs text-slate-500 ml-auto flex items-center gap-1.5">
          <Play className="h-3 w-3" />
          Or use the <span className="text-brand-300 font-medium">Start Live Demo</span> button in the top bar
        </div>
      </div>
    </div>
  );
}
