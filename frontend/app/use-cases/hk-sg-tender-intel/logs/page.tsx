'use client';

import { CheckCircle2, AlertTriangle, Clock, Activity } from 'lucide-react';

const RUNS = [
  {
    agent: 'RSSXMLIngestorAgent',
    run_id: 'ing-20260221-001',
    started: '03:00:14',
    completed: '03:02:41',
    duration_ms: 147000,
    status: 'success',
    items_processed: 27,
    items_failed: 0,
    detail: '27 new items across GLD ETB XML, EMSD RSS ×2',
  },
  {
    agent: 'HTMLScraperAgent',
    run_id: 'ing-20260221-002',
    started: '03:00:22',
    completed: '03:05:09',
    duration_ms: 287000,
    status: 'success',
    items_processed: 8,
    items_failed: 0,
    detail: '8 new items from GeBIZ public listing (3 pages)',
  },
  {
    agent: 'CSVIngestorAgent',
    run_id: 'ing-20260221-003',
    started: '03:00:18',
    completed: '03:01:03',
    duration_ms: 45000,
    status: 'success',
    items_processed: 0,
    items_failed: 0,
    detail: 'GLD Tenders Awarded CSV unchanged since yesterday (Last-Modified header)',
  },
  {
    agent: 'TenderNormalizerAgent',
    run_id: 'norm-20260221-001',
    started: '03:06:00',
    completed: '03:07:22',
    duration_ms: 82000,
    status: 'success',
    items_processed: 35,
    items_failed: 0,
    detail: '35 raw captures normalised. 2 used Haiku fallback for date extraction.',
  },
  {
    agent: 'DeduplicationAgent',
    run_id: 'dedup-20260221-001',
    started: '03:07:25',
    completed: '03:07:44',
    duration_ms: 19000,
    status: 'success',
    items_processed: 35,
    items_failed: 0,
    detail: '3 duplicates merged (GLD ETB + EMSD RSS same tender). 32 canonical records.',
  },
  {
    agent: 'TenderEvaluatorAgent',
    run_id: 'eval-20260221-001',
    started: '04:00:02',
    completed: '04:02:15',
    duration_ms: 133000,
    status: 'success',
    items_processed: 32,
    items_failed: 0,
    detail: '32 tenders scored. 4 Priority, 5 Consider, 0 Partner-only, 23 Ignore.',
  },
  {
    agent: 'DigestGeneratorAgent',
    run_id: 'digest-20260221-001',
    started: '08:00:01',
    completed: '08:00:34',
    duration_ms: 33000,
    status: 'success',
    items_processed: 9,
    items_failed: 0,
    detail: 'Digest generated. 9 tenders surfaced (HK:6, SG:3). Email sent at 08:00:35.',
  },
  {
    agent: 'SourceDiscoveryAgent',
    run_id: 'disc-20260216-001',
    started: 'Sun 02:00:00',
    completed: 'Sun 02:18:44',
    duration_ms: 1124000,
    status: 'success',
    items_processed: 5,
    items_failed: 0,
    detail: '3 new candidate sources found from GovHK RSS directory. 2 validated and added to registry.',
  },
];

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: 'text-teal-400', dot: 'bg-teal-400', label: 'Success' },
  failed: { icon: AlertTriangle, color: 'text-red-400', dot: 'bg-red-400', label: 'Failed' },
  partial: { icon: AlertTriangle, color: 'text-amber-400', dot: 'bg-amber-400', label: 'Partial' },
  running: { icon: Clock, color: 'text-blue-400', dot: 'bg-blue-400 animate-pulse', label: 'Running' },
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export default function LogsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Ingestion Log</h1>
        <p className="text-sm text-slate-400">Agent run history for 21 Feb 2026</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Runs today', value: '7', color: 'teal' },
          { label: 'Items processed', value: '107', color: 'teal' },
          { label: 'Failures', value: '0', color: 'emerald' },
          { label: 'New tenders', value: '9', color: 'teal' },
        ].map(s => (
          <div key={s.label} className={`p-3 rounded-xl border border-${s.color}-500/30 bg-white/[0.02]`}>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Run log */}
      <div className="space-y-2">
        {RUNS.map(run => {
          const sc = STATUS_CONFIG[run.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.success;
          const StatusIcon = sc.icon;
          return (
            <div key={run.run_id} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sc.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm font-medium text-white">{run.agent}</span>
                    </div>
                    <span className={`text-xs ${sc.color} font-medium`}>{sc.label}</span>
                    <span className="text-xs text-slate-500 font-mono">{run.run_id}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{run.detail}</p>
                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
                    <span>Start: <span className="text-slate-400">{run.started}</span></span>
                    <span>End: <span className="text-slate-400">{run.completed}</span></span>
                    <span>Duration: <span className="text-slate-400">{formatDuration(run.duration_ms)}</span></span>
                    <span>Processed: <span className="text-teal-400">{run.items_processed}</span></span>
                    {run.items_failed > 0 && (
                      <span>Failed: <span className="text-red-400">{run.items_failed}</span></span>
                    )}
                  </div>
                </div>
                <StatusIcon className={`w-4 h-4 ${sc.color} flex-shrink-0 mt-0.5`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
