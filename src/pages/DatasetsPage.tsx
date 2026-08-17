import { useEffect, useState } from 'react';
import { Database, ExternalLink, Lock, GraduationCap, Download, Quote } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { DATASETS, type DatasetAccessType } from '@/data/datasets';
import { cn } from '@/lib/utils';

const accessStyle: Record<DatasetAccessType, string> = {
  free: 'text-ok-400 bg-ok-500/10 border-ok-500/20',
  academic: 'text-brand-300 bg-brand-500/10 border-brand-500/20',
  restricted: 'text-warn-400 bg-warn-500/10 border-warn-500/20',
};

const accessIcon = {
  free: Download,
  academic: GraduationCap,
  restricted: Lock,
};

const accessLabel: Record<DatasetAccessType, string> = {
  free: 'FREE',
  academic: 'ACADEMIC',
  restricted: 'RESTRICTED',
};

const SAMPLE_COLUMNS = [
  'duration',
  'protocol_type',
  'service',
  'flag',
  'src_bytes',
  'dst_bytes',
  'count',
  'srv_count',
  'serror_rate',
  'same_srv_rate',
  'dst_host_count',
  'class',
];

interface SampleData {
  source: string;
  note: string;
  records: Record<string, string>[];
}

export function DatasetsPage() {
  const [sample, setSample] = useState<SampleData | null>(null);

  useEffect(() => {
    fetch('/data/nsl-kdd-sample.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setSample)
      .catch(() => setSample(null));
  }, []);

  return (
    <div>
      <PageHeader
        title="Datasets"
        subtitle="Public benchmark datasets referenced for DDoS detection research and model evaluation"
        icon={<Database className="h-5 w-5" />}
      />

      <div className="space-y-5">
        <Card
          title="Reference Datasets"
          subtitle="Standard benchmarks used to train, tune and validate DDoS detection models"
          icon={<Database className="h-4 w-4" />}
        >
          <div className="space-y-3">
            {DATASETS.map((d) => {
              const Icon = accessIcon[d.accessType];
              return (
                <div
                  key={d.id}
                  className="glass card-hover rounded-lg p-4 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{d.name}</span>
                      <span className={cn('chip border', accessStyle[d.accessType])}>
                        <Icon className="h-3 w-3" />
                        {accessLabel[d.accessType]}
                      </span>
                      {d.citationRequired && (
                        <span className="chip border text-slate-300 bg-white/5 border-white/10">
                          <Quote className="h-3 w-3" />
                          CITATION REQUIRED
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-400">{d.description}</p>
                    <p className="mt-1.5 text-[11px] text-slate-500">{d.accessNote}</p>
                  </div>
                  <a
                    href={d.link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost shrink-0 border border-white/10 self-start"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                </div>
              );
            })}
          </div>
        </Card>

        {sample && sample.records?.length > 0 && (
          <Card
            title="NSL-KDD — Sample Records"
            subtitle={sample.note}
            icon={<Database className="h-4 w-4" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                    {SAMPLE_COLUMNS.map((c) => (
                      <th key={c} className="py-2 pr-3 font-medium whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sample.records.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      {SAMPLE_COLUMNS.map((c) => (
                        <td
                          key={c}
                          className={cn(
                            'py-2.5 pr-3 font-mono whitespace-nowrap',
                            c === 'class'
                              ? r[c] === 'normal'
                                ? 'text-ok-400'
                                : 'text-bad-400'
                              : 'text-slate-300'
                          )}
                        >
                          {r[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Showing {sample.records.length} of 125,973 records from KDDTrain+. Full 41-feature dataset available at the
              official link above.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
