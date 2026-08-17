import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrafficPoint } from '@/sim/types';

interface TrafficChartProps {
  data: TrafficPoint[];
  height?: number;
  showMalicious?: boolean;
  showSuspicious?: boolean;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="text-slate-400 mb-1 font-mono">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 capitalize" style={{ color: p.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono text-white">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function TrafficChart({ data, height = 280, showMalicious = true, showSuspicious = true }: TrafficChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gNormal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSusp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gMal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          minTickGap={40}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="normal" name="Normal" stroke="#34d399" strokeWidth={1.5} fill="url(#gNormal)" isAnimationActive={false} />
        {showSuspicious && (
          <Area type="monotone" dataKey="suspicious" name="Suspicious" stroke="#fbbf24" strokeWidth={1.5} fill="url(#gSusp)" isAnimationActive={false} />
        )}
        {showMalicious && (
          <Area type="monotone" dataKey="malicious" name="Malicious" stroke="#ef4444" strokeWidth={1.5} fill="url(#gMal)" isAnimationActive={false} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
