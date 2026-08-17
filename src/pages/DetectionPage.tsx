import { Radar, Cpu, Gauge, Radio, Activity } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { DetectionEngine } from '@/components/features/DetectionEngine';
import { DecisionBranch } from '@/components/features/DecisionBranch';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { TelemetryPanel } from '@/components/features/TelemetryPanel';
import { PageHeader } from '@/components/ui/PageHeader';

export function DetectionPage() {
  const { state } = useSim();

  return (
    <div>
      <PageHeader
        title="DDoS Detection"
        subtitle="Hybrid rule-based + ML detection engine with risk scoring"
        icon={<Radar className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <Card title="Hybrid Detection Engine" subtitle="Rule-based + ML anomaly model → Risk fusion" icon={<Radar className="h-4 w-4" />}>
              <DetectionEngine state={state} />
            </Card>
            <Card title="Decision Engine" subtitle="Three-way risk-based traffic routing" icon={<Gauge className="h-4 w-4" />}>
              <DecisionBranch state={state} />
            </Card>
          </div>
          <div className="space-y-5">
            <RiskGauge score={state.riskScore} level={state.threatLevel} />
            <Card title="Detection Status" icon={<Activity className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Threat Level</span>
                  <span className={state.threatLevel === 'NORMAL' ? 'text-ok-400 font-semibold' : state.threatLevel === 'SUSPICIOUS' ? 'text-warn-400 font-semibold' : 'text-bad-400 font-semibold'}>
                    {state.threatLevel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">System State</span>
                  <span className="text-slate-200 font-medium">{state.systemState}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Rules Triggered</span>
                  <span className="font-mono text-slate-200">{state.ruleEngine.filter((r) => r.triggered).length}/{state.ruleEngine.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">ML Confidence</span>
                  <span className="font-mono text-slate-200">{Math.round(state.mlModel.reduce((a, m) => a + m.confidence, 0) / state.mlModel.length)}%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card title="Dual-Plane Telemetry" subtitle="Edge + internal telemetry → unified feature extraction" icon={<Radio className="h-4 w-4" />}>
          <TelemetryPanel state={state} />
        </Card>

        <Card title="Feature Extraction" subtitle="Live behavioral features — anomalies highlighted in red" icon={<Cpu className="h-4 w-4" />}>
          <FeatureGrid features={state.features} />
        </Card>
      </div>
    </div>
  );
}
