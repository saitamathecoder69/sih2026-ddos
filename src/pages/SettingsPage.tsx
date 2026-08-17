import { Settings as SettingsIcon, Shield, Gauge, Activity, HeartPulse } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={cn('relative h-6 w-11 rounded-full transition-colors shrink-0', on ? 'bg-brand-500' : 'bg-white/10')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function Threshold({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={cn('text-lg font-bold font-mono mt-1', color)}>{value}</div>
    </div>
  );
}

export function SettingsPage() {
  const [autoMitigation, setAutoMitigation] = useState(true);
  const [selfHealing, setSelfHealing] = useState(true);
  const [monitoring, setMonitoring] = useState(true);
  const [autoScaling, setAutoScaling] = useState(true);
  const [challengeMode, setChallengeMode] = useState(true);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Detection thresholds and automated response configuration"
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <Card title="Risk Thresholds" subtitle="Classification boundaries for DDoS risk scoring" icon={<Gauge className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Threshold label="Normal" value="0 – 30" color="text-ok-400" />
            <Threshold label="Suspicious" value="31 – 70" color="text-warn-400" />
            <Threshold label="Malicious" value="71 – 100" color="text-bad-400" />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Threshold label="Rate Limit" value="50 req/s per IP" color="text-slate-200" />
            <Threshold label="Challenge Mode" value="JS Challenge" color="text-slate-200" />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Automated Response" subtitle="Toggle automated defense mechanisms" icon={<Shield className="h-4 w-4" />}>
            <div className="space-y-2.5">
              <Toggle on={autoMitigation} onChange={setAutoMitigation} label="Automatic Mitigation" desc="Trigger WAF + blocking when risk > 70" />
              <Toggle on={challengeMode} onChange={setChallengeMode} label="Client Challenge" desc="Issue JS challenge to suspicious clients" />
            </div>
          </Card>
          <Card title="Resilience" subtitle="Self-healing and monitoring controls" icon={<HeartPulse className="h-4 w-4" />}>
            <div className="space-y-2.5">
              <Toggle on={selfHealing} onChange={setSelfHealing} label="Self-Healing" desc="Auto-replace unhealthy instances" />
              <Toggle on={autoScaling} onChange={setAutoScaling} label="Auto Scaling" desc="Scale application servers under load" />
              <Toggle on={monitoring} onChange={setMonitoring} label="Real-Time Monitoring" desc="Continuous telemetry collection" />
            </div>
          </Card>
        </div>

        <Card title="Detection Engine" subtitle="Hybrid detection configuration" icon={<Activity className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
              <div className="text-sm font-medium text-white">Rule-Based Engine</div>
              <div className="text-[11px] text-slate-500 mt-0.5">5 active threshold rules</div>
              <div className="mt-2 chip text-[10px] text-ok-400 bg-ok-500/10 border border-ok-500/20">ENABLED</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
              <div className="text-sm font-medium text-white">ML Anomaly Model</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Behavioral anomaly detection v2.1</div>
              <div className="mt-2 chip text-[10px] text-ok-400 bg-ok-500/10 border border-ok-500/20">ENABLED</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
