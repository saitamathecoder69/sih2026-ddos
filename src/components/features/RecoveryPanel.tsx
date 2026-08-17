import { HeartPulse, Activity, RefreshCw, Server, CheckCircle2, ArrowDown } from 'lucide-react';
import type { SimState } from '@/sim/types';
import { cn } from '@/lib/utils';

const recoverySteps = [
  { key: 'impact', label: 'Attack Impact', icon: Activity },
  { key: 'health', label: 'Health Check', icon: HeartPulse },
  { key: 'unhealthy', label: 'Unhealthy Instance Detected', icon: Activity },
  { key: 'redistribute', label: 'Traffic Redistributed', icon: RefreshCw },
  { key: 'scaling', label: 'Auto Scaling', icon: Server },
  { key: 'restored', label: 'Service Restored', icon: CheckCircle2 },
];

export function RecoveryPanel({ state }: { state: SimState }) {
  const recovering = state.mode === 'recovering';
  const restored = state.mode === 'restored';
  const activeIndex = recovering ? 3 : restored ? 5 : -1;

  return (
    <div className="space-y-4">
      {/* Recovery flow */}
      <div className="rounded-lg border border-white/5 bg-ink-850/50 p-4">
        <div className="section-title mb-3">Self-Healing Pipeline</div>
        <div className="flex flex-col gap-0">
          {recoverySteps.map((s, i) => {
            const Icon = s.icon;
            const done = i <= activeIndex;
            const last = i === recoverySteps.length - 1;
            return (
              <div key={s.key} className="flex items-stretch">
                <div className="flex flex-col items-center">
                  <div className={cn('grid place-items-center h-9 w-9 rounded-lg border transition-all', done ? 'border-info-500/40 bg-info-500/15 text-info-400' : 'border-white/5 bg-ink-900/40 text-slate-600')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!last && <div className={cn('w-0.5 flex-1 min-h-[20px] my-1 rounded', i < activeIndex ? 'bg-info-500/50' : 'bg-white/5')} />}
                </div>
                <div className="ml-3 pb-3 flex items-center">
                  <span className={cn('text-sm', done ? 'text-white' : 'text-slate-500')}>{s.label}</span>
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-info-400 ml-2" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Server health grid */}
      <div>
        <div className="section-title mb-2">Application Server Health</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {state.servers.map((s) => {
            const isRec = s.status === 'RECOVERING' || s.status === 'UNHEALTHY';
            return (
              <div key={s.id} className={cn('rounded-lg border p-3.5', isRec ? 'border-info-500/30 bg-info-500/5' : s.status === 'UNDER_LOAD' ? 'border-warn-500/20 bg-warn-500/5' : 'border-ok-500/20 bg-ok-500/5')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{s.name}</span>
                  <span className={cn('h-2 w-2 rounded-full animate-pulseDot', isRec ? 'bg-info-400' : s.status === 'UNDER_LOAD' ? 'bg-warn-400' : 'bg-ok-400')} />
                </div>
                <div className={cn('text-xs font-medium', isRec ? 'text-info-400' : s.status === 'UNDER_LOAD' ? 'text-warn-400' : 'text-ok-400')}>
                  {s.status === 'UNHEALTHY' ? 'Replacing Instance...' : s.status}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                  <span>CPU: <span className="font-mono text-slate-300">{s.cpu}%</span></span>
                  <span>Mem: <span className="font-mono text-slate-300">{s.memory}%</span></span>
                  <span>Lat: <span className="font-mono text-slate-300">{s.latency}ms</span></span>
                  <span>Conn: <span className="font-mono text-slate-300">{s.connections.toLocaleString()}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time to recover */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn('rounded-lg border p-4 text-center', recovering ? 'border-info-500/30 bg-info-500/5' : 'border-ok-500/20 bg-ok-500/5')}>
          <div className="section-title">Time-to-Recover</div>
          <div className={cn('text-3xl font-bold font-mono mt-1', recovering ? 'text-info-400' : 'text-ok-400')}>
            {recovering ? state.timeToRecover : restored ? 0 : 45}
            <span className="text-sm text-slate-500 ml-1">sec</span>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <div className="section-title mb-2">Recovery Status</div>
          <div className={cn('flex items-center gap-2 text-sm font-medium', recovering ? 'text-info-400' : restored ? 'text-ok-400' : 'text-slate-400')}>
            {recovering ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {recovering ? 'Service Recovering' : restored ? 'Service Restored' : 'Standby'}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
            Auto-scaling is a resilience mechanism — not the primary DDoS defense. Main defense: Detection + WAF + Rate Limiting + Blocking + Challenge.
          </p>
        </div>
      </div>
    </div>
  );
}
