import {
  Users,
  Globe,
  Shield,
  Server,
  Activity,
  Cpu,
  Gauge,
  Zap,
  HeartPulse,
  BarChart3,
  Network,
  Database,
  Brain,
  Radar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Block {
  key: string;
  label: string;
  icon: typeof Users;
  tone: string;
  items?: string[];
}

const blocks: Block[] = [
  { key: 'sources', label: 'Traffic Sources', icon: Users, tone: 'text-slate-300', items: ['Legitimate Users', 'Attackers / Botnet'] },
  { key: 'edge', label: 'Edge & Cloud Protection', icon: Shield, tone: 'text-info-400', items: ['CDN / Reverse Proxy', 'WAF', 'Rate Limiting / Bot Control'] },
  { key: 'app', label: 'Protected Application', icon: Server, tone: 'text-ok-400', items: ['Load Balancer', 'Auto-Scaled App Servers', 'Database'] },
  { key: 'telemetry', label: 'Dual-Plane Telemetry', icon: Activity, tone: 'text-tele-400', items: ['Edge Logs', 'Internal Flow Logs', 'App / Server Metrics'] },
  { key: 'features', label: 'Unified Feature Extraction', icon: Cpu, tone: 'text-brand-300', items: ['Behavioral features', 'Traffic patterns'] },
  { key: 'detection', label: 'Hybrid DDoS Detection', icon: Radar, tone: 'text-warn-400', items: ['Rule-Based Detection', 'ML Anomaly Model'] },
  { key: 'risk', label: 'Risk Scoring', icon: Gauge, tone: 'text-brand-300', items: ['0–100 score', 'Normal / Suspicious / Malicious'] },
  { key: 'mitigation', label: 'Automated Mitigation', icon: Zap, tone: 'text-bad-400', items: ['Allow', 'Challenge / Rate Limit', 'Block / Isolate / Scrub'] },
  { key: 'recovery', label: 'Self-Healing / Recovery', icon: HeartPulse, tone: 'text-info-400', items: ['Auto Scaling', 'Health Checks', 'Traffic Redistribution', 'Service Restoration'] },
  { key: 'monitoring', label: 'Monitoring', icon: BarChart3, tone: 'text-ok-400', items: ['Traffic graph', 'Risk score', 'Attack timeline', 'System health'] },
];

function Connector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-6 w-0.5 bg-gradient-to-b from-white/10 to-white/20 rounded" />
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <div className="space-y-0">
      {blocks.map((b, i) => {
        const Icon = b.icon;
        const last = i === blocks.length - 1;
        return (
          <div key={b.key}>
            <div className={cn('rounded-xl border border-white/5 bg-ink-850/50 p-4 transition-colors hover:border-white/10')}>
              <div className="flex items-start gap-3">
                <div className={cn('grid place-items-center h-11 w-11 rounded-lg bg-ink-900/60 border border-white/10 shrink-0', b.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{b.label}</div>
                  {b.items && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {b.items.map((it) => (
                        <span key={it} className="chip text-[11px] text-slate-300 bg-white/[0.03] border border-white/5">
                          {it}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!last && <Connector />}
          </div>
        );
      })}
    </div>
  );
}
