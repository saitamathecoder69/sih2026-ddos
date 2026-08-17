import { Radar, BrainCircuit, GitMerge, ArrowDown } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

export function DetectionEngine({ state }: { state: SimState }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rule-based */}
        <div className="rounded-lg border border-white/5 bg-ink-850/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid place-items-center h-8 w-8 rounded-lg bg-brand-500/15 border border-brand-500/30">
              <Radar className="h-4 w-4 text-brand-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Rule-Based Detection</div>
              <div className="text-[11px] text-slate-500">Deterministic threshold rules</div>
            </div>
          </div>
          <div className="space-y-2">
            {state.ruleEngine.map((r) => (
              <div key={r.name} className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm text-slate-200">{r.name}</div>
                  <div className="text-[11px] text-slate-500">{r.detail}</div>
                </div>
                <span className={cn('chip text-[10px] font-medium border shrink-0', r.triggered ? 'text-bad-400 bg-bad-500/10 border-bad-500/30' : 'text-slate-500 bg-white/[0.03] border-white/5')}>
                  {r.triggered ? 'TRIGGERED' : 'IDLE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ML model */}
        <div className="rounded-lg border border-white/5 bg-ink-850/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid place-items-center h-8 w-8 rounded-lg bg-tele-500/15 border border-tele-500/30">
              <BrainCircuit className="h-4 w-4 text-tele-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">ML Anomaly Model</div>
              <div className="text-[11px] text-slate-500">Behavioral anomaly detection</div>
            </div>
          </div>
          <div className="space-y-2">
            {state.mlModel.map((m) => (
              <div key={m.name} className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-200">{m.name}</span>
                  <span className={cn('text-xs font-mono font-medium', m.confidence > 60 ? 'text-bad-400' : m.confidence > 30 ? 'text-warn-400' : 'text-ok-400')}>
                    {m.confidence}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', m.confidence > 60 ? 'bg-bad-500' : m.confidence > 30 ? 'bg-warn-500' : 'bg-ok-500')}
                      style={{ width: `${m.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{m.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fusion */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowDown className="h-3.5 w-3.5" />
          <span>Risk Fusion</span>
          <ArrowDown className="h-3.5 w-3.5" />
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2.5">
          <GitMerge className="h-4 w-4 text-brand-300" />
          <span className="text-sm font-semibold text-white">Risk Scoring Engine</span>
          <span className="font-mono text-lg font-bold text-brand-300">{Math.round(state.riskScore)}</span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </div>
    </div>
  );
}
