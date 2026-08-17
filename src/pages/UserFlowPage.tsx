import { GitBranch } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { UserFlowDiagram } from '@/components/features/UserFlowDiagram';
import { PageHeader } from '@/components/ui/PageHeader';

export function UserFlowPage() {
  return (
    <div>
      <PageHeader
        title="User Flow"
        subtitle="Simplified user/request journey through the SentinelMesh protection lifecycle"
        icon={<GitBranch className="h-5 w-5" />}
      />
      <div className="space-y-5">
        <Card title="Request Journey & Decision Flow" subtitle="From user access to service restoration" icon={<GitBranch className="h-4 w-4" />}>
          <UserFlowDiagram />
        </Card>
      </div>
    </div>
  );
}
