import {
  User,
  Globe,
  Shield,
  Server,
  Activity,
  Cpu,
  Gauge,
  Check,
  AlertTriangle,
  ShieldX,
  HeartPulse,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainFlow = [
  { label: 'User Accesses Website', icon: User },
  { label: 'Request Enters Internet', icon: Globe },
  { label: 'Edge Protection', icon: Shield },
  { label: 'Protected Application', icon: Server },
  { label: 'Telemetry Collected', icon: Activity },
  { label: 'Traffic Analyzed', icon: Cpu },
  { label: 'Threat Assessed', icon: Gauge },
  { label: 'Risk Score Decision', icon: Gauge },
];

const branches = [
  {
    label: 'NORMAL',
    tone: 'text-ok-400',
    border: 'border-ok-500/30',
    bg: 'bg-ok-500/5',
    icon: Check,
    steps: ['Allow Traffic', 'Website Served'],
  },
  {
    label: 'SUSPICIOUS',
    tone: 'text-warn-400',
    border: 'border-warn-500/30',
    bg: 'bg-warn-500/5',
    icon: AlertTriangle,
    steps: ['Challenge / Rate Limit', 'Behavior Improves?', 'Yes → Allow', 'No → Mitigate'],
  },
  {
    label: 'MALICIOUS',
    tone: 'text-bad-400',
    border: 'border-bad-500/30',
    bg: 'bg-bad-500/5',
    icon: ShieldX,
    steps: ['Automatic Mitigation', 'Malicious Traffic Blocked'],
  },
];

const recovery = ['Automatic Recovery', 'Service Restored', 'Monitoring / Learning'];

export function UserFlowDiagram() {
  return (
    <div className="space-y-3">
      {/* Main flow */}
      <div className="rounded-xl border border-white/5 bg-ink-850/50 p-4">
        <div className="section-title mb-3">Request Journey</div>
        <div className="flex flex-col gap-0">
          {mainFlow.map((s, i) => {
            const Icon = s.icon;
            const last = i === mainFlow.length - 1;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex items-center gap-3 py-1.5">
                  <div className="grid place-items-center h-9 w-9 rounded-lg bg-ink-900/60 border border-white/10 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-200">{s.label}</span>
                </div>
                {!last && <ArrowDown className="h-3.5 w-3.5 text-slate-600 ml-[18px] -mt-1 mb-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Branches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {branches.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.label} className={cn('rounded-xl border p-4', b.border, b.bg)}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('grid place-items-center h-9 w-9 rounded-lg bg-ink-900/60 border border-white/10', b.tone)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={cn('text-sm font-bold tracking-wide', b.tone)}>{b.label}</span>
              </div>
              <div className="space-y-1.5">
                {b.steps.map((s, idx) => (
                  <div key={s} className="flex items-center gap-2 text-xs text-slate-300">
                    {idx === 0 ? <ArrowRight className="h-3 w-3 text-slate-500" /> : <ArrowDown className="h-3 w-3 text-slate-600 ml-3" />}
                    {s}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recovery */}
      <div className="rounded-xl border border-info-500/20 bg-info-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="h-4 w-4 text-info-400" />
          <span className="section-title text-info-400">Recovery & Feedback</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {recovery.map((r, i) => (
            <div key={r} className="flex items-center gap-2">
              <span className="chip text-sm text-info-400 bg-info-500/10 border border-info-500/20">{r}</span>
              {i < recovery.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-info-400/60" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
