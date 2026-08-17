import {
  Activity,
  ShieldX,
  Gauge,
  Network,
  AlertTriangle,
  HeartPulse,
  Radio,
  Cpu,
  Radar,
} from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { TrafficChart } from '@/components/ui/TrafficChart';
import { ThreatStatusBanner } from '@/components/ui/ThreatStatusBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestFlow } from '@/components/features/RequestFlow';
import { DecisionBranch } from '@/components/features/DecisionBranch';
import { EventFeed } from '@/components/features/EventFeed';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { LayoutDashboard } from 'lucide-react';

export function OverviewPage() {
  const { state } = useSim();

  const riskTone = state.threatLevel === 'NORMAL' ? 'ok' : state.threatLevel === 'SUSPICIOUS' ? 'warn' : 'bad';
  const errorTone = state.errorRate > 20 ? 'bad' : state.errorRate > 5 ? 'warn' : 'ok';
  const healthTone = state.appHealth < 70 ? 'bad' : state.appHealth < 90 ? 'warn' : 'ok';

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Real-time DDoS protection posture and system health"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <ThreatStatusBanner state={state} />

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard label="Total Requests/sec" value={state.totalRps.toLocaleString()} tone="neutral" icon={<Activity className="h-4 w-4" />} delta={state.attackActive ? 'up' : null} deltaLabel={state.attackActive ? 'elevated' : 'nominal'} deltaTone={state.attackActive ? 'bad' : 'neutral'} />
          <MetricCard label="Blocked Requests/sec" value={state.blockedRps.toLocaleString()} tone="bad" icon={<ShieldX className="h-4 w-4" />} delta={state.blockedRps > 1000 ? 'up' : null} deltaLabel={state.blockedRps > 1000 ? 'active' : ''} deltaTone="bad" />
          <MetricCard label="DDoS Risk Score" value={Math.round(state.riskScore)} unit="/ 100" tone={riskTone as 'ok' | 'warn' | 'bad'} icon={<Gauge className="h-4 w-4" />} />
          <MetricCard label="Active Connections" value={state.activeConnections.toLocaleString()} tone="info" icon={<Network className="h-4 w-4" />} />
          <MetricCard label="Error Rate" value={state.errorRate.toFixed(1)} unit="%" tone={errorTone as 'ok' | 'warn' | 'bad'} icon={<AlertTriangle className="h-4 w-4" />} />
          <MetricCard label="Application Health" value={state.appHealth.toFixed(1)} unit="%" tone={healthTone as 'ok' | 'warn' | 'bad'} icon={<HeartPulse className="h-4 w-4" />} />
        </div>

        {/* Traffic + Risk */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card title="Live Traffic" subtitle="Requests per second" icon={<Activity className="h-4 w-4" />} className="xl:col-span-2" action={
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-ok-400"><span className="h-2 w-2 rounded-full bg-ok-400" />Normal</span>
              <span className="flex items-center gap-1.5 text-warn-400"><span className="h-2 w-2 rounded-full bg-warn-400" />Suspicious</span>
              <span className="flex items-center gap-1.5 text-bad-400"><span className="h-2 w-2 rounded-full bg-bad-400" />Malicious</span>
            </div>
          }>
            <TrafficChart data={state.trafficHistory} height={260} />
          </Card>
          <RiskGauge score={state.riskScore} level={state.threatLevel} />
        </div>

        {/* Request flow */}
        <Card title="Request Flow" subtitle="User request journey through the protection pipeline" icon={<Radio className="h-4 w-4" />}>
          <RequestFlow state={state} />
        </Card>

        {/* Decision + Features */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card title="Decision Engine" subtitle="Risk-based traffic routing" icon={<Gauge className="h-4 w-4" />}>
            <DecisionBranch state={state} />
          </Card>
          <Card title="Feature Extraction" subtitle="Live behavioral features feeding detection" icon={<Cpu className="h-4 w-4" />}>
            <FeatureGrid features={state.features} />
          </Card>
        </div>

        {/* Detection + Events */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card title="Hybrid Detection Engine" subtitle="Rule-based + ML anomaly model" icon={<Radar className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/5 bg-ink-850/50 p-3">
                <div className="text-xs font-semibold text-brand-300 mb-2">Rule-Based</div>
                <div className="space-y-1.5">
                  {state.ruleEngine.slice(0, 3).map((r) => (
                    <div key={r.name} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{r.name}</span>
                      <span className={r.triggered ? 'text-bad-400 font-medium' : 'text-slate-500'}>{r.triggered ? 'TRIG' : 'IDLE'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-white/5 bg-ink-850/50 p-3">
                <div className="text-xs font-semibold text-tele-400 mb-2">ML Anomaly</div>
                <div className="space-y-1.5">
                  {state.mlModel.slice(0, 3).map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate mr-2">{m.name}</span>
                      <span className={m.confidence > 60 ? 'text-bad-400 font-mono' : m.confidence > 30 ? 'text-warn-400 font-mono' : 'text-ok-400 font-mono'}>{m.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <Card title="Event Feed" subtitle="Real-time security events" icon={<Activity className="h-4 w-4" />}>
            <EventFeed events={state.events} max={6} />
          </Card>
        </div>
      </div>
    </div>
  );
}
