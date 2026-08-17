import { Cpu, MemoryStick, Activity, Clock, Network } from 'lucide-react';
import type { ServerHealth } from '@/sim/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ServerHealth['status'], { label: string; dot: string; text: string; border: string }> = {
  HEALTHY: { label: 'Healthy', dot: 'bg-ok-400', text: 'text-ok-400', border: 'border-ok-500/20' },
  UNDER_LOAD: { label: 'Under Load', dot: 'bg-warn-400', text: 'text-warn-400', border: 'border-warn-500/20' },
  UNHEALTHY: { label: 'Unhealthy', dot: 'bg-bad-400', text: 'text-bad-400', border: 'border-bad-500/30' },
  RECOVERING: { label: 'Recovering', dot: 'bg-info-400', text: 'text-info-400', border: 'border-info-500/20' },
  REPLACING: { label: 'Replacing Instance...', dot: 'bg-info-400', text: 'text-info-400', border: 'border-info-500/30' },
};

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Cpu; label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-slate-500" />
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={cn('text-xs font-mono font-medium ml-auto', tone ?? 'text-slate-200')}>{value}</span>
    </div>
  );
}

function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-500', tone)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function ServerHealthCard({ server }: { server: ServerHealth }) {
  const cfg = statusConfig[server.status];
  const cpuTone = server.cpu > 85 ? 'bg-bad-500' : server.cpu > 60 ? 'bg-warn-500' : 'bg-ok-500';
  const memTone = server.memory > 85 ? 'bg-bad-500' : server.memory > 60 ? 'bg-warn-500' : 'bg-ok-500';

  return (
    <div className={cn('rounded-lg border bg-ink-900/40 p-3.5', cfg.border)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full animate-pulseDot', cfg.dot)} />
          <span className="text-sm font-semibold text-white">{server.name}</span>
        </div>
        <span className={cn('chip text-[10px] font-medium', cfg.text, 'bg-current/10')} style={{ background: 'rgba(255,255,255,0.03)' }}>
          {cfg.label}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Stat icon={Cpu} label="CPU" value={`${server.cpu}%`} tone={server.cpu > 85 ? 'text-bad-400' : server.cpu > 60 ? 'text-warn-400' : 'text-ok-400'} />
          </div>
          <Bar value={server.cpu} tone={cpuTone} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Stat icon={MemoryStick} label="Memory" value={`${server.memory}%`} tone={server.memory > 85 ? 'text-bad-400' : 'text-ok-400'} />
          </div>
          <Bar value={server.memory} tone={memTone} />
        </div>
        <div className="grid grid-cols-1 gap-1 pt-1">
          <Stat icon={Activity} label="Requests" value={server.rps.toLocaleString()} />
          <Stat icon={Clock} label="Latency" value={`${server.latency}ms`} tone={server.latency > 300 ? 'text-bad-400' : server.latency > 100 ? 'text-warn-400' : 'text-ok-400'} />
          <Stat icon={Network} label="Connections" value={server.connections.toLocaleString()} />
        </div>
      </div>
    </div>
  );
}
