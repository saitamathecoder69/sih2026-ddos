import { Globe, ShieldX, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { TrafficSource } from '@/sim/types';
import { cn } from '@/lib/utils';

const statusStyle: Record<TrafficSource['status'], string> = {
  LEGITIMATE: 'text-ok-400 bg-ok-500/10 border-ok-500/20',
  SUSPICIOUS: 'text-warn-400 bg-warn-500/10 border-warn-500/20',
  BLOCKED: 'text-bad-400 bg-bad-500/10 border-bad-500/20',
};

const statusIcon = {
  LEGITIMATE: ShieldCheck,
  SUSPICIOUS: ShieldAlert,
  BLOCKED: ShieldX,
};

interface TrafficSourceTableProps {
  sources: TrafficSource[];
  replay?: boolean;
  /** True when the active replay source has genuine source IPs (e.g. the live backend), so the synthesized-IP disclaimer should not show. */
  ipsAreReal?: boolean;
}

export function TrafficSourceTable({ sources, replay = false, ipsAreReal = false }: TrafficSourceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
            <th className="py-2 pr-3 font-medium">IP / Range</th>
            <th className="py-2 pr-3 font-medium">Req/s</th>
            <th className="py-2 pr-3 font-medium">Country</th>
            <th className="py-2 pr-3 font-medium">{replay ? 'Protocol' : 'ASN'}</th>
            <th className="py-2 pr-3 font-medium">{replay ? 'Service' : 'Endpoint'}</th>
            <th className="py-2 pr-3 font-medium">User Agent</th>
            <th className="py-2 pr-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sources.map((s) => {
            const Icon = statusIcon[s.status];
            return (
              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-3 font-mono text-slate-200">{s.ip}</td>
                <td className="py-2.5 pr-3 font-mono text-slate-300">{s.rps.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-slate-500" />
                    {s.country}
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-mono text-slate-400">{s.asn}</td>
                <td className="py-2.5 pr-3 font-mono text-slate-300">{s.endpoint}</td>
                <td className="py-2.5 pr-3 text-slate-400">{s.userAgent}</td>
                <td className="py-2.5 pr-3">
                  <span className={cn('chip border', statusStyle[s.status])}>
                    <Icon className="h-3 w-3" />
                    {s.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {replay && !ipsAreReal && (
        <p className="mt-3 text-[11px] text-slate-500">
          IP addresses are synthesized — this dataset is feature-extracted and contains no source addresses.
          Protocol, service, rate and classification are real record values.
        </p>
      )}
      {replay && ipsAreReal && (
        <p className="mt-3 text-[11px] text-slate-500">
          Live data from the real backend — IP addresses, protocol, service, rate and classification are all genuine
          detection results, not simulated.
        </p>
      )}
    </div>
  );
}
