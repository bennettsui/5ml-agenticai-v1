'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Clock, Activity, RefreshCw, Play, Loader2 } from 'lucide-react';

// No mock data — all data comes from /api/tender-intel/logs

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: 'text-teal-400', dot: 'bg-teal-400', label: 'Success' },
  failed:  { icon: AlertTriangle, color: 'text-red-400', dot: 'bg-red-400', label: 'Failed' },
  partial: { icon: AlertTriangle, color: 'text-amber-400', dot: 'bg-amber-400', label: 'Partial' },
  running: { icon: Clock, color: 'text-blue-400', dot: 'bg-blue-400 animate-pulse', label: 'Running' },
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiLog(log: any) {
  // DB columns: log_id, agent_name, started_at, completed_at, status,
  //             items_processed, items_failed, error_detail, meta (JSONB)
  const startedAt = log.started_at ? new Date(log.started_at) : null;
  const completedAt = log.completed_at ? new Date(log.completed_at) : null;

  const meta = typeof log.meta === 'object' && log.meta !== null ? log.meta : {};
  const durationMs = meta.duration_ms
    || (startedAt && completedAt ? completedAt.getTime() - startedAt.getTime() : 0);

  const detail = log.error_detail || '';

  return {
    agent:           log.agent_name || 'UnknownAgent',
    run_id:          log.log_id || String(Math.random()),
    started_full:    startedAt
      ? startedAt.toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' })
      : '—',
    duration_ms:     durationMs,
    status:          log.status || 'success',
    items_processed: log.items_processed || 0,
    items_failed:    log.items_failed || 0,
    detail,
    new_items:       meta.new_items || 0,
  };
}

export default function LogsPage() {
  const [runs, setRuns] = useState<ReturnType<typeof mapApiLog>[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<'ingest' | 'evaluate' | null>(null);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  const loadLogs = () => {
    setLoading(true);
    fetch('/api/tender-intel/logs?limit=100')
      .then(r => r.ok ? r.json() : [])
      .then(data => setRuns(Array.isArray(data) ? data.map(mapApiLog) : []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, []);

  async function triggerRun(type: 'ingest' | 'evaluate') {
    setTriggering(type);
    setTriggerMsg(null);
    try {
      const res = await fetch(`/api/tender-intel/${type}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTriggerMsg(
          type === 'ingest'
            ? `Ingestion complete — ${data.newRawCaptures ?? 0} new captures, ${data.tendersInserted ?? 0} tenders`
            : `Evaluation complete — ${data.evaluated?.length ?? 0} tenders scored`
        );
        setTimeout(() => loadLogs(), 500);
      } else {
        setTriggerMsg(`Error: ${data.error || 'unknown'}`);
      }
    } catch {
      setTriggerMsg('Network error — server may be unavailable');
    } finally {
      setTriggering(null);
      setTimeout(() => setTriggerMsg(null), 6000);
    }
  }

  const totalItems = runs.reduce((s, r) => s + r.items_processed, 0);
  const failures = runs.filter(r => r.status === 'failed' || r.status === 'partial').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Ingestion Log</h1>
          <p className="text-sm text-slate-400">{loading ? 'Loading…' : `${runs.length} agent runs recorded`}</p>
        </div>
        <button onClick={loadLogs} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Manual trigger panel */}
      <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Manual Controls</p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => triggerRun('ingest')}
            disabled={triggering !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors disabled:opacity-50"
          >
            {triggering === 'ingest'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Play className="w-3.5 h-3.5" />}
            Run ingestion now
          </button>
          <button
            onClick={() => triggerRun('evaluate')}
            disabled={triggering !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
          >
            {triggering === 'evaluate'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Play className="w-3.5 h-3.5" />}
            Run evaluation now
          </button>
          <div className="flex-1 text-xs">
            {triggering && (
              <span className="text-slate-400">Running {triggering}… this may take 30–120 seconds</span>
            )}
            {triggerMsg && !triggering && (
              <span className={`font-medium ${triggerMsg.startsWith('Error') || triggerMsg.startsWith('Network') ? 'text-red-400' : 'text-teal-400'}`}>
                {triggerMsg}
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          Ingestion runs daily at 03:00 HKT · Evaluation at 04:00 HKT
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Runs total',      value: String(runs.length),  color: 'teal' },
          { label: 'Items processed', value: String(totalItems),   color: 'teal' },
          { label: 'Failures',        value: String(failures),     color: failures > 0 ? 'amber' : 'emerald' },
          { label: 'Last status',     value: runs[0]?.status ?? '—', color: 'teal' },
        ].map(s => (
          <div key={s.label} className={`p-3 rounded-xl border border-${s.color}-500/30 bg-white/[0.02]`}>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold text-${s.color}-400`}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Run log */}
      <div className="space-y-2">
        {loading && [1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-700 flex-shrink-0" />
              <div className="h-3 bg-slate-700/60 rounded w-40" />
              <div className="h-3 bg-slate-700/40 rounded w-16" />
            </div>
          </div>
        ))}
        {!loading && runs.map(run => {
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
                  </div>
                  {run.detail && <p className="text-xs text-slate-400 mb-2">{run.detail}</p>}
                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
                    <span>At: <span className="text-slate-400">{run.started_full}</span></span>
                    {run.duration_ms > 0 && (
                      <span>Duration: <span className="text-slate-400">{formatDuration(run.duration_ms)}</span></span>
                    )}
                    <span>Processed: <span className="text-teal-400">{run.items_processed}</span></span>
                    {run.new_items > 0 && (
                      <span>New: <span className="text-teal-400 font-medium">+{run.new_items}</span></span>
                    )}
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
        {!loading && runs.length === 0 && (
          <div className="rounded-xl border border-slate-700/30 bg-white/[0.01] p-8 text-center">
            <p className="text-sm text-slate-500 mb-3">No agent runs recorded yet.</p>
            <p className="text-xs text-slate-600">
              Click <span className="text-teal-400 font-medium">Run ingestion now</span> above to fetch the first batch of tenders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
