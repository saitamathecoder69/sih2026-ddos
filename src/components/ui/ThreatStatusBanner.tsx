import { AlertTriangle, ShieldCheck, Eye, ShieldAlert, HeartPulse, CheckCircle2, Zap, RotateCcw } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

const stateConfig: Record<SimState['systemState'], { label: string; sub: string; icon: typeof ShieldCheck; tone: string; ring: string; text: string }> = {
  NORMAL: { label: 'SYSTEM PROTECTED', sub: 'All traffic nominal · Detection engine online', icon: ShieldCheck, tone: 'border-ok-500/30 bg-ok-500/10', ring: 'bg-ok-400', text: 'text-ok-400' },
  SUSPICIOUS: { label: 'UNDER OBSERVATION', sub: 'Traffic anomaly detected · Monitoring behavior', icon: Eye, tone: 'border-warn-500/30 bg-warn-500/10', ring: 'bg-warn-400', text: 'text-warn-400' },
  MALICIOUS: { label: 'DDoS ATTACK DETECTED', sub: 'Automatic mitigation engaged · Blocking malicious traffic', icon: ShieldAlert, tone: 'border-bad-500/40 bg-bad-500/10', ring: 'bg-bad-400', text: 'text-bad-400' },
  MITIGATING: { label: 'MITIGATING ATTACK', sub: 'WAF rules deployed · Malicious IPs blocked · Traffic scrubbing active', icon: Zap, tone: 'border-warn-500/30 bg-warn-500/10', ring: 'bg-warn-400', text: 'text-warn-400' },
  RECOVERING: { label: 'SERVICE RECOVERY', sub: 'Health checks running · Traffic redistributed', icon: HeartPulse, tone: 'border-info-500/30 bg-info-500/10', ring: 'bg-info-400', text: 'text-info-400' },
  RESTORED: { label: 'SERVICE RESTORED', sub: 'Application healthy · Threat level normalized', icon: CheckCircle2, tone: 'border-ok-500/30 bg-ok-500/10', ring: 'bg-ok-400', text: 'text-ok-400' },
};

const indicators = [
  { key: 'protection', label: 'Protection Active' },
  { key: 'detection', label: 'Detection Engine' },
  { key: 'mitigation', label: 'Automated Mitigation' },
  { key: 'healing', label: 'Self-Healing' },
];

const lifecycleSteps = [
  { phase: 'attack', label: 'Attack', icon: AlertTriangle },
  { phase: 'mitigating', label: 'Mitigating', icon: Zap },
  { phase: 'recovering', label: 'Recovering', icon: RotateCcw },
  { phase: 'restored', label: 'Restored', icon: CheckCircle2 },
];

export function ThreatStatusBanner({ state, compact = false }: { state: SimState; compact?: boolean }) {
  const cfg = stateConfig[state.systemState];
  const Icon = cfg.icon;
  const phase = state.lifecyclePhase;
  const showLifecycle = phase === 'attack' || phase === 'mitigating' || phase === 'recovering' || phase === 'restored';
  const activeStepIndex = lifecycleSteps.findIndex((s) => s.phase === phase);

  return (
    <div className={cn('relative overflow-hidden rounded-xl border p-4 lg:p-5', cfg.tone)}>
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn('grid place-items-center h-12 w-12 rounded-xl bg-ink-900/60 border border-white/10', cfg.text)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full animate-pulseDot', cfg.ring)} />
              <h2 className={cn('text-lg lg:text-xl font-bold tracking-wide', cfg.text)}>{cfg.label}</h2>
            </div>
            <p className="text-sm text-slate-300 mt-0.5">{cfg.sub}</p>
          </div>
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {indicators.map((ind) => (
              <div key={ind.key} className="flex items-center gap-2 rounded-lg bg-ink-900/50 border border-white/5 px-3 py-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full animate-pulseDot', cfg.ring)} />
                <span className="text-xs text-slate-300">{ind.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attack info */}
      {state.attackActive && !compact && (
        <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-bad-400" />
          <span className="text-bad-400 font-medium">{state.attackType}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Target:</span>
          <span className="font-mono text-slate-200">{state.attackTarget}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Severity:</span>
          <span className="text-bad-400 font-medium">{state.attackSeverity}</span>
        </div>
      )}

      {/* Auto-response lifecycle progress */}
      {showLifecycle && !compact && (
        <div className="relative mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Automatic Response Lifecycle</span>
            <span className={cn('text-[11px] font-medium', cfg.text)}>Auto-handling in progress</span>
          </div>
          <div className="flex items-center gap-1">
            {lifecycleSteps.map((s, i) => {
              const StepIcon = s.icon;
              const done = i < activeStepIndex;
              const active = i === activeStepIndex;
              const stepTone = done
                ? 'text-ok-400 border-ok-500/40 bg-ok-500/10'
                : active
                ? cn(cfg.text, 'border-white/20 bg-white/[0.06]')
                : 'text-slate-600 border-white/5 bg-white/[0.02]';
              return (
                <div key={s.phase} className="flex items-center flex-1 last:flex-none">
                  <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all', stepTone, active && 'ring-2 ring-offset-1 ring-offset-ink-900 ring-current/30')}>
                    <StepIcon className={cn('h-3.5 w-3.5', active && 'animate-pulseDot')} />
                    <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
                    {done && <CheckCircle2 className="h-3 w-3 text-ok-400" />}
                  </div>
                  {i < lifecycleSteps.length - 1 && (
                    <div className={cn('h-0.5 flex-1 mx-1 rounded transition-colors', done ? 'bg-ok-500/40' : 'bg-white/5')} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
