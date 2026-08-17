import { User, Globe, Shield, Server, Activity, Cpu, Gauge, Zap } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

const stages = [
  { key: 'user', label: 'User', icon: User },
  { key: 'internet', label: 'Internet', icon: Globe },
  { key: 'edge', label: 'Edge Protection', icon: Shield },
  { key: 'app', label: 'Application', icon: Server },
  { key: 'telemetry', label: 'Telemetry', icon: Activity },
  { key: 'analysis', label: 'Analysis', icon: Cpu },
  { key: 'risk', label: 'Risk Decision', icon: Gauge },
  { key: 'action', label: 'Action', icon: Zap },
];

const toneFor = (state: SimState) => {
  if (state.systemState === 'MALICIOUS') return { line: 'bg-bad-500', text: 'text-bad-400', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]' };
  if (state.systemState === 'SUSPICIOUS') return { line: 'bg-warn-500', text: 'text-warn-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' };
  if (state.systemState === 'RECOVERING' || state.systemState === 'RESTORED') return { line: 'bg-info-500', text: 'text-info-400', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.4)]' };
  return { line: 'bg-ok-500', text: 'text-ok-400', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]' };
};

export function RequestFlow({ state, vertical = false }: { state: SimState; vertical?: boolean }) {
  const tone = toneFor(state);
  const active = state.attackActive || state.systemState === 'RECOVERING';

  if (vertical) {
    return (
      <div className="flex flex-col items-stretch gap-0">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const last = i === stages.length - 1;
          return (
            <div key={s.key} className="flex items-stretch">
              <div className="flex flex-col items-center">
                <div className={cn('grid place-items-center h-11 w-11 rounded-xl border bg-ink-850 transition-all', active ? cn('border-white/10', tone.glow) : 'border-white/5')}>
                  <Icon className={cn('h-5 w-5', active ? tone.text : 'text-slate-400')} />
                </div>
                {!last && <div className={cn('w-0.5 flex-1 min-h-[28px] my-1 rounded', active ? tone.line : 'bg-white/10')} />}
              </div>
              <div className="ml-3 pb-4">
                <div className="text-sm font-semibold text-white">{s.label}</div>
                <div className="text-[11px] text-slate-500">{stageDetail(s.key, state)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-0 min-w-max">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const last = i === stages.length - 1;
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn('grid place-items-center h-12 w-12 rounded-xl border bg-ink-850 transition-all', active ? cn('border-white/10', tone.glow) : 'border-white/5')}>
                  <Icon className={cn('h-5 w-5', active ? tone.text : 'text-slate-400')} />
                </div>
                <span className="text-[11px] font-medium text-slate-300 whitespace-nowrap">{s.label}</span>
              </div>
              {!last && (
                <div className={cn('h-0.5 w-8 lg:w-12 mx-1 rounded', active ? cn(tone.line, 'animate-flowDash') : 'bg-white/10')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function stageDetail(key: string, state: SimState): string {
  switch (key) {
    case 'user': return 'Client request';
    case 'internet': return 'Inbound traffic';
    case 'edge': return state.mitigationActive ? 'Filtering & blocking' : 'CDN + WAF';
    case 'app': return 'Application servers';
    case 'telemetry': return 'Dual-plane collection';
    case 'analysis': return 'Feature extraction';
    case 'risk': return `Score: ${Math.round(state.riskScore)}/100`;
    case 'action': return state.threatLevel;
    default: return '';
  }
}
