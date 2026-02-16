'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  Timer,
  Loader2,
  Calendar,
  Globe,
  Newspaper,
  Megaphone,
  Server,
} from 'lucide-react';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface ScheduledJob {
  id: string;
  group: string;
  name: string;
  description: string;
  schedule: string;
  timezone: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'disabled';
  lastRunAt: string | null;
  lastResult: string | null;
  lastDurationMs: number | null;
  nextRunAt: string | null;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

interface ScheduleSummary {
  total: number;
  groups: Record<string, number>;
  statuses: Record<string, number>;
}

interface APIResponse {
  timestamp: string;
  summary: ScheduleSummary;
  jobs: ScheduledJob[];
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const GROUP_ICONS: Record<string, typeof Newspaper> = {
  'Topic Intelligence': Newspaper,
  'Ads Performance': Megaphone,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle2 }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-400/10',    border: 'border-blue-200 dark:border-blue-500/30',    Icon: Clock },
  running:   { label: 'Running',   color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-400/10',  border: 'border-amber-200 dark:border-amber-500/30',  Icon: PlayCircle },
  completed: { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-500/30', Icon: CheckCircle2 },
  failed:    { label: 'Failed',    color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-100 dark:bg-rose-400/10',    border: 'border-rose-200 dark:border-rose-500/30',    Icon: XCircle },
  disabled:  { label: 'Disabled',  color: 'text-slate-500 dark:text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-500/10',  border: 'border-slate-200 dark:border-slate-600/30',  Icon: PauseCircle },
};

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = Math.round(secs % 60);
  return `${mins}m ${remSecs}s`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  } catch {
    return iso;
  }
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export default function ScheduledJobs() {
  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduled-jobs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: APIResponse = await res.json();
      setData(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchJobs, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobs]);

  const groups = data ? Object.keys(data.summary.groups) : [];
  const filteredJobs = data
    ? filterGroup === 'all'
      ? data.jobs
      : data.jobs.filter(j => j.group === filterGroup)
    : [];

  const statusOrder: Record<string, number> = { running: 0, failed: 1, scheduled: 2, completed: 3, disabled: 4 };
  const sortedJobs = [...filteredJobs].sort(
    (a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scheduled Jobs</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            All cron jobs and scheduled tasks across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh
                ? 'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={() => { setLoading(true); fetchJobs(); }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/30 text-red-700 dark:text-rose-300 text-sm">
          Failed to load scheduled jobs: {error}
        </div>
      )}

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Jobs" value={data.summary.total} icon={Server} color="text-blue-500 dark:text-blue-400" />
          <SummaryCard label="Running" value={data.summary.statuses.running || 0} icon={PlayCircle} color="text-amber-500 dark:text-amber-400" />
          <SummaryCard label="Scheduled" value={data.summary.statuses.scheduled || 0} icon={Clock} color="text-emerald-500 dark:text-emerald-400" />
          <SummaryCard label="Failed" value={data.summary.statuses.failed || 0} icon={XCircle} color="text-rose-500 dark:text-rose-400" />
        </div>
      )}

      {/* Group filter tabs */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          <FilterTab active={filterGroup === 'all'} onClick={() => setFilterGroup('all')} label="All" count={data?.summary.total || 0} />
          {groups.map(g => (
            <FilterTab key={g} active={filterGroup === g} onClick={() => setFilterGroup(g)} label={g} count={data?.summary.groups[g] || 0} />
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading scheduled jobs...</p>
          </div>
        </div>
      ) : sortedJobs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No scheduled jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Timestamp */}
      {data && (
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last refreshed: {new Date(data.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Clock; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function FilterTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
          : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {label}
      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${active ? 'bg-blue-200 dark:bg-blue-600/30' : 'bg-slate-200 dark:bg-slate-700/50'}`}>
        {count}
      </span>
    </button>
  );
}

function JobCard({ job }: { job: ScheduledJob }) {
  const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.scheduled;
  const StatusIcon = statusCfg.Icon;
  const GroupIcon = GROUP_ICONS[job.group] || Server;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border ${statusCfg.border} p-5 hover:shadow-xl transition-shadow`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
            <GroupIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{job.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{job.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {job.timezone}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {job.schedule === 'disabled' ? 'disabled' : job.schedule}
              </span>
              {job.nextRunAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {job.nextRunAt}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          {job.lastRunAt && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Last run: {formatRelative(job.lastRunAt)}
            </div>
          )}
          {job.lastDurationMs != null && (
            <div className="flex items-center gap-1 text-xs text-slate-500 justify-end mt-0.5">
              <Timer className="w-3 h-3" />
              {formatDuration(job.lastDurationMs)}
            </div>
          )}
          {job.lastResult && job.lastResult !== 'success' && (
            <div className="text-xs text-rose-500 dark:text-rose-400 mt-0.5 max-w-[200px] truncate" title={job.lastResult}>
              {job.lastResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
