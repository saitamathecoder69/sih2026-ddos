import { Radio, Server, ArrowDown } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

export function TelemetryPanel({ state }: { state: SimState }) {
  const active = state.attackActive || state.mode === 'spike' || state.mode === 'recovering';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Edge telemetry */}
        <div className="rounded-lg border border-tele-500/20 bg-tele-500/[0.04] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid place-items-center h-8 w-8 rounded-lg bg-tele-500/15 border border-tele-500/30">
              <Radio className="h-4 w-4 text-tele-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Edge Telemetry</div>
              <div className="text-[11px] text-slate-500">External / north-south</div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'WAF Logs', value: state.wafBlocked + 1240, tone: 'text-bad-400' },
              { label: 'CDN Logs', value: state.totalRps, tone: 'text-tele-400' },
              { label: 'Load Balancer Logs', value: state.activeConnections, tone: 'text-info-400' },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="text-sm text-slate-300">{m.label}</span>
                <span className={cn('text-sm font-mono font-medium', m.tone)}>{m.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Internal telemetry */}
        <div className="rounded-lg border border-brand-500/20 bg-brand-500/[0.04] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid place-items-center h-8 w-8 rounded-lg bg-brand-500/15 border border-brand-500/30">
              <Server className="h-4 w-4 text-brand-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Internal Telemetry</div>
              <div className="text-[11px] text-slate-500">East-west / internal</div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'East-West Flow Logs', value: state.activeConnections, tone: 'text-brand-300' },
              { label: 'Application Metrics', value: state.servers.reduce((a, s) => a + s.rps, 0), tone: 'text-ok-400' },
              { label: 'Server Metrics', value: state.servers.reduce((a, s) => a + s.cpu, 0) / state.servers.length, tone: 'text-warn-400' },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="text-sm text-slate-300">{m.label}</span>
                <span className={cn('text-sm font-mono font-medium', m.tone)}>
                  {m.label === 'Server Metrics' ? `${Math.round(m.value)}%` : m.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flow into feature extraction */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowDown className={cn('h-3.5 w-3.5', active && 'text-brand-300 animate-pulseDot')} />
          <span>Unified Feature Extraction</span>
          <ArrowDown className={cn('h-3.5 w-3.5', active && 'text-brand-300 animate-pulseDot')} />
        </div>
        <div className={cn('mt-2 rounded-lg border px-4 py-2.5 transition-all', active ? 'border-brand-500/40 bg-brand-500/10 shadow-glow' : 'border-white/5 bg-white/[0.02]')}>
          <span className="text-sm font-semibold text-white">Feature Extraction Engine</span>
          <span className="ml-2 text-xs text-slate-500">{state.features.length} live features</span>
        </div>
      </div>
    </div>
  );
}
