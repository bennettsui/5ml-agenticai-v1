'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, AlertTriangle, Clock, Activity, RefreshCw, Play, Loader2,
  Zap, Globe, CheckCheck, XCircle, SkipForward, Cpu, ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type IngestEvent =
  | { type: 'init';        total: number; sources: { source_id: string; name: string; type: string }[] }
  | { type: 'source_start'; source: string; source_id: string; index: number; total: number }
  | { type: 'source_done'; source: string; status: 'ok' | 'error' | 'skipped'; found: number; new: number; tenders: number; durationMs?: number; error?: string; skippedHoursAgo?: string }
  | { type: 'done';        newCaptures: number; tendersInserted: number; sources: number; skipped: number; errors: number; durationMs: number }
  | { type: 'error';       error: string };

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: 'text-teal-400',  dot: 'bg-teal-400',  label: 'Success' },
  failed:  { icon: AlertTriangle, color: 'text-red-400',   dot: 'bg-red-400',   label: 'Failed'  },
  partial: { icon: AlertTriangle, color: 'text-amber-400', dot: 'bg-amber-400', label: 'Partial' },
  running: { icon: Clock,         color: 'text-blue-400',  dot: 'bg-blue-400 animate-pulse', label: 'Running' },
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiLog(log: any) {
  const startedAt   = log.started_at   ? new Date(log.started_at)   : null;
  const completedAt = log.completed_at ? new Date(log.completed_at) : null;
  const meta        = typeof log.meta === 'object' && log.meta !== null ? log.meta : {};
  const durationMs  = meta.duration_ms
    || (startedAt && completedAt ? completedAt.getTime() - startedAt.getTime() : 0);
  return {
    agent:           log.agent_name || 'UnknownAgent',
    run_id:          log.log_id || String(Math.random()),
    started_full:    startedAt
      ? startedAt.toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' })
      : '—',
    duration_ms:     durationMs,
    status:          log.status || 'success',
    items_processed: log.items_processed || 0,
    items_failed:    log.items_failed    || 0,
    detail:          log.error_detail    || '',
    new_items:       meta.new_items      || 0,
  };
}

// ─── Ingestion Progress Log Line ──────────────────────────────────────────────

function IngestLogLine({ ev }: { ev: IngestEvent }) {
  if (ev.type === 'init') {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Globe className="w-3 h-3 flex-shrink-0 text-teal-400" />
        <span>Scanning <span className="text-white">{ev.total}</span> sources…</span>
      </div>
    );
  }
  if (ev.type === 'source_start') {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin text-slate-500" />
        <span className="text-slate-500">[{ev.index}/{ev.total}]</span>
        <span className="truncate">{ev.source}</span>
      </div>
    );
  }
  if (ev.type === 'source_done') {
    if (ev.status === 'skipped') {
      return (
        <div className="flex items-center gap-2 pl-1 text-slate-600">
          <SkipForward className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{ev.source}</span>
          <span className="ml-auto text-[11px]">skipped ({ev.skippedHoursAgo}h ago)</span>
        </div>
      );
    }
    const isOk  = ev.status === 'ok';
    const isErr = ev.status === 'error';
    return (
      <div className={`flex items-center gap-2 pl-1 ${isErr ? 'text-red-400' : isOk && ev.new > 0 ? 'text-teal-400' : 'text-slate-500'}`}>
        {isErr
          ? <XCircle    className="w-3 h-3 flex-shrink-0" />
          : isOk && ev.new > 0
          ? <CheckCheck className="w-3 h-3 flex-shrink-0" />
          : <span className="w-3 h-3 flex-shrink-0 text-center text-[10px] leading-4">·</span>
        }
        <span className="truncate font-medium">{ev.source}</span>
        {isErr && <span className="text-[11px] text-red-400/70 ml-1 truncate">— {ev.error}</span>}
        {isOk && (
          <span className="ml-auto flex-shrink-0 flex items-center gap-2 text-[11px]">
            <span className="text-slate-500">{ev.found} found</span>
            {ev.new > 0 && <span className="text-teal-400 font-medium">+{ev.new} new · {ev.tenders} tenders</span>}
            {ev.durationMs && <span className="text-slate-600">{formatDuration(ev.durationMs)}</span>}
          </span>
        )}
      </div>
    );
  }
  if (ev.type === 'done') {
    return (
      <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-700/40 text-slate-300 font-medium">
        <Zap className="w-3 h-3 flex-shrink-0 text-amber-400" />
        <span>
          Done —{' '}
          <span className={ev.newCaptures > 0 ? 'text-teal-400' : 'text-slate-400'}>
            {ev.newCaptures} new captures
          </span>
          {ev.tendersInserted > 0 && (
            <span className="text-teal-400"> · {ev.tendersInserted} tenders</span>
          )}
          {' '}from {ev.sources} sources
          {ev.skipped > 0 && <span className="text-slate-500"> ({ev.skipped} skipped)</span>}
          {ev.errors > 0  && <span className="text-amber-400"> · {ev.errors} errors</span>}
          <span className="text-slate-600 font-normal ml-2">in {(ev.durationMs / 1000).toFixed(1)}s</span>
        </span>
      </div>
    );
  }
  if (ev.type === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <XCircle className="w-3 h-3 flex-shrink-0" />
        <span>Error: {ev.error}</span>
      </div>
    );
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [runs,        setRuns]        = useState<ReturnType<typeof mapApiLog>[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [evaluating,  setEvaluating]  = useState(false);
  const [evalMsg,     setEvalMsg]     = useState<string | null>(null);
  const [ingesting,   setIngesting]   = useState(false);
  const [ingestLog,   setIngestLog]   = useState<IngestEvent[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const loadLogs = () => {
    setLoading(true);
    fetch('/api/tender-intel/logs?limit=100')
      .then(r => r.ok ? r.json() : [])
      .then(data => setRuns(Array.isArray(data) ? data.map(mapApiLog) : []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, []);

  // Auto-scroll ingestion log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ingestLog]);

  // ── Ingestion: SSE stream ─────────────────────────────────────────────────
  async function runIngestion() {
    setIngesting(true);
    setIngestLog([]);

    try {
      const response = await fetch('/api/tender-intel/ingest', { method: 'POST' });
      if (!response.body) throw new Error('No streaming response body');

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let gotDone   = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const ev: IngestEvent = JSON.parse(line.slice(6));
            setIngestLog(prev => [...prev, ev]);
            if (ev.type === 'done') {
              gotDone = true;
              setTimeout(() => loadLogs(), 800);
            }
          } catch (_) {}
        }
      }
      if (!gotDone) setIngesting(false);
    } catch (err) {
      setIngestLog(prev => [...prev, { type: 'error', error: String(err) }]);
    } finally {
      setIngesting(false);
    }
  }

  // ── Evaluation: simple JSON (fast) ───────────────────────────────────────
  async function runEvaluation() {
    setEvaluating(true);
    setEvalMsg(null);
    try {
      const res  = await fetch('/api/tender-intel/evaluate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setEvalMsg(`Evaluation complete — ${data.evaluated?.length ?? 0} tenders scored`);
        setTimeout(() => loadLogs(), 500);
      } else {
        setEvalMsg(`Error: ${data.error || 'unknown'}`);
      }
    } catch {
      setEvalMsg('Network error — server may be unavailable');
    } finally {
      setEvaluating(false);
      setTimeout(() => setEvalMsg(null), 8000);
    }
  }

  const totalItems = runs.reduce((s, r) => s + r.items_processed, 0);
  const failures   = runs.filter(r => r.status === 'failed' || r.status === 'partial').length;
  const totalNew   = runs.reduce((s, r) => s + r.new_items, 0);
  const doneEvent  = ingestLog.find((e): e is Extract<IngestEvent, {type:'done'}> => e.type === 'done');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Ingestion Log</h1>
          <p className="text-sm text-slate-400">
            {loading ? 'Loading…' : `${runs.length} agent runs · ${totalNew} new items total`}
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700/50 hover:border-slate-600 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Manual trigger panel ── */}
      <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manual Controls</p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={runIngestion}
            disabled={ingesting || evaluating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors disabled:opacity-50"
          >
            {ingesting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Play    className="w-3.5 h-3.5" />
            }
            Run ingestion now
          </button>
          <button
            onClick={runEvaluation}
            disabled={ingesting || evaluating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
          >
            {evaluating
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Cpu     className="w-3.5 h-3.5" />
            }
            Run evaluation now
          </button>
          {evalMsg && !evaluating && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${evalMsg.startsWith('Error') || evalMsg.startsWith('Network') ? 'text-red-400' : 'text-teal-400'}`}>
                {evalMsg}
              </span>
              {!evalMsg.startsWith('Error') && !evalMsg.startsWith('Network') && (
                <Link
                  href="/use-cases/hk-sg-tender-intel/tenders"
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors underline underline-offset-2"
                >
                  View tenders <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-600">
          Ingestion runs daily at 03:00 HKT · Evaluation at 04:00 HKT ·
          Manual runs always scan all sources (no skip)
        </p>
      </div>

      {/* ── Live Ingestion Progress ── */}
      {ingestLog.length > 0 && (
        <div className="rounded-xl border border-slate-700/40 bg-black/40 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-700/30 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Ingestion Progress</span>
              {ingesting && (
                <span className="flex items-center gap-1 text-[10px] text-teal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Running
                </span>
              )}
              {doneEvent && (
                <span className="flex items-center gap-1 text-[10px] text-teal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Complete
                </span>
              )}
            </div>
            {doneEvent && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-600">
                  +{doneEvent.newCaptures} new · {doneEvent.tendersInserted} tenders · {(doneEvent.durationMs / 1000).toFixed(1)}s
                </span>
                <Link
                  href="/use-cases/hk-sg-tender-intel/tenders"
                  className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 transition-colors font-medium"
                >
                  View All Tenders <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            )}
          </div>
          <div className="p-3 font-mono text-[11px] leading-relaxed space-y-1.5 max-h-80 overflow-y-auto">
            {ingestLog.map((ev, i) => (
              <IngestLogLine key={i} ev={ev} />
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Runs total',      value: String(runs.length),       color: 'teal'   },
          { label: 'Items processed', value: String(totalItems),         color: 'teal'   },
          { label: 'New items total', value: `+${totalNew}`,             color: 'teal'   },
          { label: 'Failures',        value: String(failures),           color: failures > 0 ? 'amber' : 'emerald' },
        ].map(s => (
          <div key={s.label} className={`p-3 rounded-xl border border-${s.color}-500/30 bg-white/[0.02]`}>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold text-${s.color}-400`}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Run history ── */}
      <div className="space-y-2">
        {loading && [1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-700 flex-shrink-0" />
              <div className="h-3 bg-slate-700/60 rounded w-40" />
              <div className="h-3 bg-slate-700/40 rounded w-16 ml-auto" />
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
