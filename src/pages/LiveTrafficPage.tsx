import { Activity, Radio, Server, Network } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { TrafficChart } from '@/components/ui/TrafficChart';
import { TrafficSourceTable } from '@/components/features/TrafficSourceTable';
import { RequestFlow } from '@/components/features/RequestFlow';
import { EdgePipeline } from '@/components/features/EdgePipeline';
import { PageHeader } from '@/components/ui/PageHeader';

export function LiveTrafficPage() {
  const { state } = useSim();

  return (
    <div>
      <PageHeader
        title="Live Traffic"
        subtitle="Real-time request visualization, traffic sources, and edge pipeline"
        icon={<Activity className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <Card title="Traffic Graph" subtitle="Requests per second — Normal, Suspicious, Malicious" icon={<Activity className="h-4 w-4" />} action={
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-ok-400"><span className="h-2 w-2 rounded-full bg-ok-400" />Normal</span>
            <span className="flex items-center gap-1.5 text-warn-400"><span className="h-2 w-2 rounded-full bg-warn-400" />Suspicious</span>
            <span className="flex items-center gap-1.5 text-bad-400"><span className="h-2 w-2 rounded-full bg-bad-400" />Malicious</span>
          </div>
        }>
          <TrafficChart data={state.trafficHistory} height={320} />
        </Card>

        <Card title="Request Flow" subtitle="Color-coded by current threat level" icon={<Radio className="h-4 w-4" />}>
          <RequestFlow state={state} />
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card title="Traffic Sources" subtitle="Live incoming request origins" icon={<Network className="h-4 w-4" />}>
            <TrafficSourceTable
              sources={state.sources}
              replay={state.datasetStatus === 'replay' && state.usingReplayData}
              ipsAreReal={state.datasetId === 'live-backend' && state.usingReplayData}
            />
          </Card>
          <Card title="Edge & Cloud Protection" subtitle="Request-processing pipeline" icon={<Server className="h-4 w-4" />}>
            <EdgePipeline state={state} />
          </Card>
        </div>
      </div>
    </div>
  );
}
