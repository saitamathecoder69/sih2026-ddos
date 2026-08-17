import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ThreatLevel } from '@/sim/types';

interface RiskGaugeProps {
  score: number;
  level: ThreatLevel;
  size?: number;
  label?: string;
}

const levelColor = (level: ThreatLevel) => {
  if (level === 'NORMAL') return { stroke: '#34d399', text: 'text-ok-400', bg: 'from-ok-500/15', label: 'NORMAL' };
  if (level === 'SUSPICIOUS') return { stroke: '#fbbf24', text: 'text-warn-400', bg: 'from-warn-500/15', label: 'SUSPICIOUS' };
  return { stroke: '#ef4444', text: 'text-bad-400', bg: 'from-bad-500/15', label: 'MALICIOUS' };
};

export function RiskGauge({ score, level, size = 220, label = 'Risk Score' }: RiskGaugeProps) {
  const [display, setDisplay] = useState(score);
  const c = levelColor(level);

  useEffect(() => {
    const id = setInterval(() => {
      setDisplay((d) => {
        const diff = score - d;
        if (Math.abs(diff) < 0.4) return score;
        return d + diff * 0.15;
      });
    }, 30);
    return () => clearInterval(id);
  }, [score]);

  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius; // semicircle
  const pct = Math.max(0, Math.min(100, display)) / 100;
  const offset = circumference * (1 - pct);

  return (
    <div className={cn('relative rounded-xl border border-white/5 bg-gradient-to-b to-ink-850/40 p-5', c.bg)}>
      <div className="text-center mb-1">
        <div className="section-title">{label}</div>
      </div>
      <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 36 }}>
        <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
          {/* track */}
          <path
            d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* zones (subtle) */}
          <path
            d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${12 + (size - 24) * 0.3} ${size / 2 - radius * Math.sin(Math.PI * 0.3)}`}
            fill="none"
            stroke="rgba(52,211,153,0.12)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* value arc */}
          <path
            d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
            fill="none"
            stroke={c.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke 0.4s ease' }}
          />
          {/* needle */}
          {(() => {
            const angle = Math.PI - Math.PI * pct;
            const nx = size / 2 + radius * Math.cos(angle);
            const ny = size / 2 - radius * Math.sin(angle);
            return (
              <>
                <line x1={size / 2} y1={size / 2} x2={nx} y2={ny} stroke={c.stroke} strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.3s ease' }} />
                <circle cx={size / 2} cy={size / 2} r="5" fill={c.stroke} />
              </>
            );
          })()}
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <div className={cn('text-4xl font-bold tabular-nums leading-none', c.text)}>
            {Math.round(display)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">/ 100</div>
          <div className={cn('mt-2 chip border', c.text, level === 'NORMAL' ? 'border-ok-500/30 bg-ok-500/10' : level === 'SUSPICIOUS' ? 'border-warn-500/30 bg-warn-500/10' : 'border-bad-500/30 bg-bad-500/10')}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulseDot" />
            {c.label}
          </div>
        </div>
      </div>
      {/* scale */}
      <div className="mt-3 flex justify-between text-[10px] text-slate-500 font-mono">
        <span>0</span>
        <span className="text-ok-400/70">30</span>
        <span className="text-warn-400/70">70</span>
        <span className="text-bad-400/70">100</span>
      </div>
    </div>
  );
}
