import { Network } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ArchitectureDiagram } from '@/components/features/ArchitectureDiagram';
import { PageHeader } from '@/components/ui/PageHeader';

export function ArchitecturePage() {
  return (
    <div>
      <PageHeader
        title="Technical Architecture"
        subtitle="End-to-end SentinelMesh architecture — from traffic sources to monitoring"
        icon={<Network className="h-5 w-5" />}
      />
      <div className="space-y-5">
        <Card title="System Architecture" subtitle="Complete technical approach" icon={<Network className="h-4 w-4" />}>
          <ArchitectureDiagram />
        </Card>
      </div>
    </div>
  );
}
