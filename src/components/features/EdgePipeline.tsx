import { Globe, Network, Shield, Gauge, Server } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

const stages = [
  { key: 'cdn', label: 'CDN / Reverse Proxy', icon: Globe, status: 'ACTIVE' },
  { key: 'waf', label: 'WAF', icon: Shield, status: 'ACTIVE' },
  { key: 'rate', label: 'Rate Limiting / Bot Control', icon: Gauge, status: 'ACTIVE' },
  { key: 'lb', label: 'Load Balancer', icon: Network, status: 'ACTIVE' },
  { key: 'app', label: 'Application Servers', icon: Server, status: 'ACTIVE' },
];

export function EdgePipeline({ state }: { state: SimState }) {
  const attack = state.attackActive;
  const mitigating = state.systemState === 'MITIGATING';
  const recovering = state.systemState === 'RECOVERING';

  const liveStatus = (key: string): { label: string; tone: string } => {
    if (mitigating) {
      if (key === 'waf') return { label: 'BLOCKING', tone: 'text-bad-400 bg-bad-500/15 border-bad-500/30' };
      if (key === 'rate') return { label: 'RATE LIMITING', tone: 'text-warn-400 bg-warn-500/15 border-warn-500/30' };
      if (key === 'cdn') return { label: 'SCRUBBING', tone: 'text-bad-400 bg-bad-500/15 border-bad-500/30' };
      if (key === 'lb') return { label: 'REDISTRIBUTING', tone: 'text-info-400 bg-info-500/15 border-info-500/30' };
      if (key === 'app') return { label: 'STABILIZING', tone: 'text-warn-400 bg-warn-500/15 border-warn-500/30' };
    }
    if (attack) {
      if (key === 'waf') return { label: 'BLOCKING', tone: 'text-bad-400 bg-bad-500/15 border-bad-500/30' };
      if (key === 'rate') return { label: 'RATE LIMITING', tone: 'text-warn-400 bg-warn-500/15 border-warn-500/30' };
      if (key === 'cdn') return { label: 'SCRUBBING', tone: 'text-bad-400 bg-bad-500/15 border-bad-500/30' };
      if (key === 'lb') return { label: 'UNDER LOAD', tone: 'text-warn-400 bg-warn-500/15 border-warn-500/30' };
      if (key === 'app') return { label: 'STRESSED', tone: 'text-bad-400 bg-bad-500/15 border-bad-500/30' };
    }
    if (recovering) {
      if (key === 'app') return { label: 'RECOVERING', tone: 'text-info-400 bg-info-500/15 border-info-500/30' };
      if (key === 'lb') return { label: 'REDISTRIBUTING', tone: 'text-info-400 bg-info-500/15 border-info-500/30' };
    }
    return { label: 'HEALTHY', tone: 'text-ok-400 bg-ok-500/10 border-ok-500/20' };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Globe className="h-3.5 w-3.5" />
        <span>Internet</span>
        <div className={cn('flex-1 h-0.5 rounded', attack || mitigating ? 'bg-bad-500/60 animate-flowDash' : recovering ? 'bg-info-500/60' : 'bg-white/10')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {stages.map((s) => {
          const Icon = s.icon;
          const ls = liveStatus(s.key);
          return (
            <div key={s.key} className={cn('rounded-lg border bg-ink-850/60 p-3.5', ls.tone.split(' ').find((c) => c.startsWith('border-')) ?? 'border-white/5')}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('h-4 w-4', ls.tone.split(' ')[0])} />
                <span className={cn('chip text-[10px] font-medium border', ls.tone)}>{ls.label}</span>
              </div>
              <div className="text-sm font-semibold text-white">{s.label}</div>
              <div className="mt-2 text-[11px] text-slate-500">
                {s.key === 'waf' && `Blocked: ${state.wafBlocked.toLocaleString()}`}
                {s.key === 'rate' && `Actions: ${state.rateLimited.toLocaleString()}`}
                {s.key === 'cdn' && 'Global edge network'}
                {s.key === 'lb' && '3 backends'}
                {s.key === 'app' && `${state.servers.length} instances`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
