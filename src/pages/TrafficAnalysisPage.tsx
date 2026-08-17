import { BarChart3, Activity, Network, Cpu } from 'lucide-react';
import { useSim } from '@/sim/SimContext';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { TrafficChart } from '@/components/ui/TrafficChart';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { TrafficSourceTable } from '@/components/features/TrafficSourceTable';
import { PageHeader } from '@/components/ui/PageHeader';

export function TrafficAnalysisPage() {
  const { state } = useSim();

  return (
    <div>
      <PageHeader
        title="Traffic Analysis"
        subtitle="Deep-dive into traffic patterns, features, and source analysis"
        icon={<BarChart3 className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total RPS" value={state.totalRps.toLocaleString()} tone="neutral" icon={<Activity className="h-4 w-4" />} />
          <MetricCard label="Unique IPs" value={state.features.find((f) => f.key === 'uniqueIps')?.display ?? '—'} tone="info" icon={<Network className="h-4 w-4" />} />
          <MetricCard label="New IP Ratio" value={state.features.find((f) => f.key === 'newIpRatio')?.display ?? '—'} tone={state.features.find((f) => f.key === 'newIpRatio')?.anomaly ? 'bad' : 'ok'} />
          <MetricCard label="UA Similarity" value={state.features.find((f) => f.key === 'uaSimilarity')?.display ?? '—'} tone={state.features.find((f) => f.key === 'uaSimilarity')?.anomaly ? 'bad' : 'neutral'} />
        </div>

        <Card title="Traffic Overview" subtitle="Requests per second over time" icon={<Activity className="h-4 w-4" />}>
          <TrafficChart data={state.trafficHistory} height={300} />
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card title="Feature Analysis" subtitle="Behavioral features with anomaly detection" icon={<Cpu className="h-4 w-4" />}>
            <FeatureGrid features={state.features} />
          </Card>
          <Card title="Top Traffic Sources" subtitle="Live request origins and status" icon={<Network className="h-4 w-4" />}>
            <TrafficSourceTable sources={state.sources} />
          </Card>
        </div>
      </div>
    </div>
  );
}
