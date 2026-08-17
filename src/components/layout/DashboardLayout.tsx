import { type ReactNode } from 'react';
import { Sidebar, type PageId } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  current: PageId;
  onNavigate: (id: PageId) => void;
  children: ReactNode;
}

export function DashboardLayout({ current, onNavigate, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar current={current} onNavigate={onNavigate} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-4 lg:px-6 py-5 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
