import { CheckCircle2, Circle, ArrowDown } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

export function MitigationPanel({ state }: { state: SimState }) {
  const maliciousBefore = state.mode === 'ddos' || state.mode === 'httpflood' ? 120000 : state.mode === 'recovering' ? 120000 : 0;
  const maliciousAfter = state.mode === 'recovering' ? 8000 : state.attackActive ? Math.max(8000, state.blockedRps) : 0;
  const reduction = maliciousBefore > 0 ? Math.round((1 - maliciousAfter / maliciousBefore) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Attack summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-bad-500/20 bg-bad-500/5 p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Attack Status</div>
          <div className={cn('text-base font-bold', state.attackActive ? 'text-bad-400' : 'text-ok-400')}>
            {state.attackActive ? 'ACTIVE' : state.mode === 'recovering' ? 'MITIGATED' : 'NONE'}
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Severity</div>
          <div className={cn('text-base font-bold', state.attackSeverity === 'CRITICAL' ? 'text-bad-400' : state.attackSeverity === 'HIGH' ? 'text-warn-400' : 'text-slate-200')}>
            {state.attackSeverity}
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Risk Score</div>
          <div className="text-base font-bold font-mono text-brand-300">{Math.round(state.riskScore)}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Attack Type</div>
          <div className="text-sm font-semibold text-slate-200">{state.attackType}</div>
        </div>
      </div>

      {/* Traffic reduction */}
      <div className="rounded-lg border border-white/5 bg-ink-850/50 p-4">
        <div className="section-title mb-3">Malicious Traffic Reduction</div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-bad-400">{maliciousBefore.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">req/s before</div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <ArrowDown className={cn('h-5 w-5 mb-1', reduction > 80 ? 'text-ok-400' : 'text-warn-400')} />
            <div className={cn('text-lg font-bold', reduction > 80 ? 'text-ok-400' : 'text-warn-400')}>
              {reduction}% reduced
            </div>
            <div className="mt-2 h-1.5 w-full max-w-[200px] rounded-full bg-white/5 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-700', reduction > 80 ? 'bg-ok-500' : 'bg-warn-500')} style={{ width: `${reduction}%` }} />
            </div>
          </div>
          <div className="text-center">
            <div className={cn('text-2xl font-bold font-mono', maliciousAfter > 20000 ? 'text-bad-400' : 'text-ok-400')}>{maliciousAfter.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">req/s after</div>
          </div>
        </div>
      </div>

      {/* Mitigation actions */}
      <div>
        <div className="section-title mb-2">Mitigation Actions</div>
        <div className="space-y-1.5">
          {state.mitigationActions.map((a) => (
            <div key={a.id} className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all', a.active ? 'border-ok-500/20 bg-ok-500/[0.06]' : 'border-white/5 bg-white/[0.02]')}>
              {a.active ? (
                <CheckCircle2 className="h-4 w-4 text-ok-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-600 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className={cn('text-sm font-medium', a.active ? 'text-white' : 'text-slate-400')}>{a.label}</div>
                <div className="text-[11px] text-slate-500">{a.detail}</div>
              </div>
              {a.active && <span className="chip text-[10px] text-ok-400 bg-ok-500/10 border border-ok-500/20">DONE</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
