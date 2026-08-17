import { useState } from 'react';
import { SimProvider } from '@/sim/SimContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { PageId } from '@/components/layout/Sidebar';
import { OverviewPage } from '@/pages/OverviewPage';
import { LiveTrafficPage } from '@/pages/LiveTrafficPage';
import { DetectionPage } from '@/pages/DetectionPage';
import { AttackSimulatorPage } from '@/pages/AttackSimulatorPage';
import { MitigationPage } from '@/pages/MitigationPage';
import { RecoveryPage } from '@/pages/RecoveryPage';
import { TrafficAnalysisPage } from '@/pages/TrafficAnalysisPage';
import { LogsPage } from '@/pages/LogsPage';
import { SystemHealthPage } from '@/pages/SystemHealthPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ArchitecturePage } from '@/pages/ArchitecturePage';
import { UserFlowPage } from '@/pages/UserFlowPage';
import { DatasetsPage } from '@/pages/DatasetsPage';

function App() {
  const [page, setPage] = useState<PageId>('overview');

  const renderPage = () => {
    switch (page) {
      case 'overview': return <OverviewPage />;
      case 'live': return <LiveTrafficPage />;
      case 'detection': return <DetectionPage />;
      case 'simulator': return <AttackSimulatorPage />;
      case 'mitigation': return <MitigationPage />;
      case 'recovery': return <RecoveryPage />;
      case 'analysis': return <TrafficAnalysisPage />;
      case 'logs': return <LogsPage />;
      case 'health': return <SystemHealthPage />;
      case 'settings': return <SettingsPage />;
      case 'architecture': return <ArchitecturePage />;
      case 'userflow': return <UserFlowPage />;
      case 'datasets': return <DatasetsPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <SimProvider>
      <DashboardLayout current={page} onNavigate={setPage}>
        {renderPage()}
      </DashboardLayout>
    </SimProvider>
  );
}

export default App;
