import { Crosshair, Activity, Clock } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { AttackSimulator } from '@/components/features/AttackSimulator';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { PageHeader } from '@/components/ui/PageHeader';

export function AttackSimulatorPage() {
  const { state } = useSim();

  return (
    <div>
      <PageHeader
        title="Attack Simulator"
        subtitle="Trigger traffic scenarios to demonstrate the full detection → mitigation → recovery lifecycle"
        icon={<Crosshair className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <Card title="Simulation Controls" subtitle="Select a traffic scenario to simulate" icon={<Activity className="h-4 w-4" />}>
          <AttackSimulator />
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="space-y-5">
            <RiskGauge score={state.riskScore} level={state.threatLevel} />
            <Card title="Current State" icon={<Clock className="h-4 w-4" />}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Mode</span><span className="text-slate-200 font-medium capitalize">{state.mode}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">System State</span><span className="text-slate-200 font-medium">{state.systemState}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Threat Level</span><span className={state.threatLevel === 'NORMAL' ? 'text-ok-400' : state.threatLevel === 'SUSPICIOUS' ? 'text-warn-400' : 'text-bad-400'}>{state.threatLevel}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Attack Active</span><span className={state.attackActive ? 'text-bad-400' : 'text-ok-400'}>{state.attackActive ? 'YES' : 'NO'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Mitigation</span><span className={state.mitigationActive ? 'text-bad-400' : 'text-ok-400'}>{state.mitigationActive ? 'ACTIVE' : 'STANDBY'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Recovery</span><span className={state.recoveryActive ? 'text-info-400' : 'text-slate-400'}>{state.recoveryActive ? 'ACTIVE' : 'STANDBY'}</span></div>
              </div>
            </Card>
          </div>
          <div className="xl:col-span-2">
            <Card title="Live Features" subtitle="Watch features change as you simulate attacks" icon={<Activity className="h-4 w-4" />}>
              <FeatureGrid features={state.features} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
