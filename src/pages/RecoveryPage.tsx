import { HeartPulse, Server } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { RecoveryPanel } from '@/components/features/RecoveryPanel';
import { ServerHealthCard } from '@/components/features/ServerHealthCard';
import { PageHeader } from '@/components/ui/PageHeader';

export function RecoveryPage() {
  const { state } = useSim();

  return (
    <div>
      <PageHeader
        title="Recovery"
        subtitle="Self-healing: health checks, traffic redistribution, and auto-scaling"
        icon={<HeartPulse className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <Card title="Automatic Recovery / Self-Healing" subtitle="Attack impact → health check → redistribute → auto-scale → restore" icon={<HeartPulse className="h-4 w-4" />}>
          <RecoveryPanel state={state} />
        </Card>

        <Card title="Application Servers" subtitle="Detailed per-instance health metrics" icon={<Server className="h-4 w-4" />}>
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
