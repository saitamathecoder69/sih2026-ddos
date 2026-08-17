import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
