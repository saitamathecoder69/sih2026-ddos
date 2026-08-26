import { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  Radar,
  Crosshair,
  Shield,
  HeartPulse,
  BarChart3,
  ScrollText,
  Server,
  Settings,
  Network,
  GitBranch,
  Database,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageId =
  | 'overview'
  | 'live'
  | 'detection'
  | 'simulator'
  | 'mitigation'
  | 'recovery'
  | 'analysis'
  | 'logs'
  | 'health'
  | 'settings'
  | 'architecture'
  | 'userflow'
  | 'datasets';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Operations',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'live', label: 'Live Traffic', icon: Activity },
      { id: 'detection', label: 'DDoS Detection', icon: Radar },
      { id: 'simulator', label: 'Attack Simulator', icon: Crosshair },
    ],
  },
  {
    group: 'Response',
    items: [
      { id: 'mitigation', label: 'Mitigation', icon: Shield },
      { id: 'recovery', label: 'Recovery', icon: HeartPulse },
      { id: 'analysis', label: 'Traffic Analysis', icon: BarChart3 },
      { id: 'logs', label: 'Logs & Events', icon: ScrollText },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'health', label: 'System Health', icon: Server },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'architecture', label: 'Technical Architecture', icon: Network },
      { id: 'userflow', label: 'User Flow', icon: GitBranch },
      { id: 'datasets', label: 'Datasets', icon: Database },
    ],
  },
];

interface SidebarProps {
  current: PageId;
  onNavigate: (id: PageId) => void;
}

export function Sidebar({ current, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
        <div className="grid place-items-center h-9 w-9 rounded-lg bg-brand-500/15 border border-brand-500/30">
          <ShieldCheck className="h-5 w-5 text-brand-300" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-white">LakshmanRekha</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-brand-300/80">Detect. Defend. Deliver.</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = current === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                      active
                        ? 'bg-brand-500/15 text-white border border-brand-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300')} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/5">
        <div className="card px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-ok-400 animate-pulseDot" />
            <span>Engine v3.2 · Simulation</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 grid place-items-center h-10 w-10 rounded-lg bg-ink-850/90 border border-white/10 text-slate-200"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 border-r border-white/5 bg-ink-900/60 backdrop-blur-xl">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-ink-900 border-r border-white/10">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
