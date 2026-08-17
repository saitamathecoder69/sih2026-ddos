import { Server, Shield, Network, Database, Activity, Radar, Zap, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { ServerHealthCard } from '@/components/features/ServerHealthCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';

export function SystemHealthPage() {
  const { state } = useSim();

  const services = [
    { name: 'WAF', icon: Shield, status: state.systemState === 'MITIGATING' ? 'BLOCKING' : state.attackActive ? 'UNDER LOAD' : 'HEALTHY' },
    { name: 'Reverse Proxy', icon: Network, status: 'HEALTHY' },
    { name: 'Load Balancer', icon: Network, status: state.systemState === 'RECOVERING' ? 'REDISTRIBUTING' : state.systemState === 'MITIGATING' ? 'REDISTRIBUTING' : state.attackActive ? 'UNDER LOAD' : 'HEALTHY' },
    { name: 'Application Servers', icon: Server, status: `${state.servers.filter((s) => s.status === 'HEALTHY').length}/${state.servers.length} Healthy` },
    { name: 'Database', icon: Database, status: 'HEALTHY' },
    { name: 'Telemetry Pipeline', icon: Activity, status: 'HEALTHY' },
    { name: 'Detection Engine', icon: Radar, status: 'HEALTHY' },
    { name: 'Mitigation Engine', icon: Zap, status: state.mitigationActive ? 'ACTIVE' : 'HEALTHY' },
    { name: 'Recovery Engine', icon: HeartPulse, status: state.recoveryActive ? 'ACTIVE' : 'HEALTHY' },
  ];

  const toneFor = (status: string) => {
    if (status.includes('UNDER LOAD') || status === 'ACTIVE' || status === 'REDISTRIBUTING') return 'text-warn-400 bg-warn-500/10 border-warn-500/20';
    if (status === 'BLOCKING') return 'text-bad-400 bg-bad-500/10 border-bad-500/20';
    if (status === 'HEALTHY' || status.includes('Healthy')) return 'text-ok-400 bg-ok-500/10 border-ok-500/20';
    return 'text-slate-400 bg-white/[0.03] border-white/5';
  };

  return (
    <div>
      <PageHeader
        title="System Health"
        subtitle="Health status of all infrastructure and platform components"
        icon={<Server className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <Card title="Service Status" subtitle="All platform components" icon={<CheckCircle2 className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="grid place-items-center h-9 w-9 rounded-lg bg-ink-900/60 border border-white/10 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{s.name}</div>
                    <span className={cn('chip text-[10px] font-medium border mt-1', toneFor(s.status))}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulseDot" />
                      {s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Application Server Health" subtitle="Detailed per-instance metrics" icon={<Server className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.servers.map((s) => (
              <ServerHealthCard key={s.id} server={s} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
