import { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Gauge, Play, Pause, RotateCcw, Zap, TrendingUp, Skull } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { cn } from '@/lib/utils';
import type { SimMode } from '@/sim/types';

function StatusPill({ label, dotClass, textClass }: { label: string; dotClass: string; textClass: string }) {
  return (
    <div className="hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulseDot', dotClass)} />
      <span className={cn('text-xs font-medium', textClass)}>{label}</span>
    </div>
  );
}

function SimButton({
  active,
  onClick,
  icon: Icon,
  label,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Zap;
  label: string;
  variant: 'ok' | 'warn' | 'bad';
}) {
  const variants = {
    ok: 'btn-ok',
    warn: 'btn-warn',
    bad: 'btn-bad',
  };
  return (
    <button onClick={onClick} className={cn(variants[variant], active && 'ring-2 ring-offset-2 ring-offset-ink-900', active && variant === 'ok' && 'ring-ok-500/50', active && variant === 'warn' && 'ring-warn-500/50', active && variant === 'bad' && 'ring-bad-500/50')}>
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function TopBar() {
  const { state, setMode, startDemo, pauseDemo, restartDemo, isDemoRunning, demoStepIndex, demoTotalSteps } = useSim();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const isNormal = state.mode === 'normal' || state.mode === 'restored';
  const isSpike = state.mode === 'spike';
  const isAttack = state.mode === 'httpflood' || state.mode === 'ddos';

  const setSafe = (m: SimMode) => {
    if (!isDemoRunning) setMode(m);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-900/70 backdrop-blur-xl">
      <div className="flex flex-col gap-3 px-4 lg:px-6 py-3">
        {/* Row 1: brand + status + clock */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <div className="lg:hidden grid place-items-center h-8 w-8 rounded-lg bg-brand-500/15 border border-brand-500/30">
              <ShieldCheck className="h-4 w-4 text-brand-300" />
            </div>
            <div className="hidden lg:block">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Cloud DDoS Protection</div>
              <div className="text-sm font-semibold text-white">Security Operations Center</div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <StatusPill label="Protected" dotClass="bg-ok-400" textClass="text-ok-400" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-info-400" />
              <span className="text-xs font-medium text-slate-300">Production Simulation</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
              <Gauge className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs font-medium text-slate-300 font-mono">{time.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Row 2: simulation controls + demo */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline section-title mr-1">Simulate</span>
            <SimButton active={isNormal} onClick={() => setSafe('normal')} icon={Activity} label="Normal Traffic" variant="ok" />
            <SimButton active={isSpike} onClick={() => setSafe('spike')} icon={TrendingUp} label="Traffic Spike" variant="warn" />
            <SimButton active={isAttack} onClick={() => setSafe('ddos')} icon={Skull} label="DDoS Attack" variant="bad" />
            <button onClick={() => setSafe('normal')} className="btn-ghost border border-white/5">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Stop Attack</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isDemoRunning ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-xs text-brand-300">
                  <span className="font-mono">Step {demoStepIndex + 1}/{demoTotalSteps}</span>
                </div>
                <button onClick={pauseDemo} className="btn-warn">
                  <Pause className="h-4 w-4" />
                  <span className="hidden sm:inline">Pause Demo</span>
                </button>
                <button onClick={restartDemo} className="btn-ghost border border-white/5">
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Restart</span>
                </button>
              </>
            ) : (
              <button onClick={startDemo} className="btn-primary">
                <Play className="h-4 w-4" />
                Start Live Demo
              </button>
            )}
          </div>
        </div>

        {/* Demo progress bar */}
        {isDemoRunning && (
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-500"
              style={{ width: `${((demoStepIndex + 1) / demoTotalSteps) * 100}%` }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
