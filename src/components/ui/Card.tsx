import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  padding?: boolean;
}

export function Card({ children, className, title, subtitle, icon, action, padding = true }: CardProps) {
  return (
    <div className={cn('card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
            <div className="min-w-0">
              {title && <div className="text-sm font-semibold text-white truncate">{title}</div>}
              {subtitle && <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(padding && 'p-4')}>{children}</div>
    </div>
  );
}
