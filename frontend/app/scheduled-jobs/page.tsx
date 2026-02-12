'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-400/10', Icon: Clock },
  running:   { label: 'Running',   color: 'text-amber-400', bg: 'bg-amber-400/10', Icon: PlayCircle },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-400/10', Icon: CheckCircle2 },
  failed:    { label: 'Failed',    color: 'text-rose-400', bg: 'bg-rose-400/10', Icon: XCircle },
  disabled:  { label: 'Disabled',  color: 'text-slate-500', bg: 'bg-slate-500/10', Icon: PauseCircle },
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
// Page
// ────────────────────────────────────────────

export default function ScheduledJobsPage() {
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

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh every 15s
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

  // Sort: running first, then scheduled, then failed, then disabled
  const statusOrder: Record<string, number> = { running: 0, failed: 1, scheduled: 2, completed: 3, disabled: 4 };
  const sortedJobs = [...filteredJobs].sort(
    (a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Scheduled Jobs
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  All cron jobs and scheduled tasks across the platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>

              {/* Manual refresh */}
              <button
                onClick={() => { setLoading(true); fetchJobs(); }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                title="Refresh now"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            Failed to load scheduled jobs: {error}
          </div>
        )}

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              label="Total Jobs"
              value={data.summary.total}
              icon={Server}
              color="text-blue-400"
            />
            <SummaryCard
              label="Running"
              value={data.summary.statuses.running || 0}
              icon={PlayCircle}
              color="text-amber-400"
            />
            <SummaryCard
              label="Scheduled"
              value={data.summary.statuses.scheduled || 0}
              icon={Clock}
              color="text-emerald-400"
            />
            <SummaryCard
              label="Failed"
              value={data.summary.statuses.failed || 0}
              icon={XCircle}
              color="text-rose-400"
            />
          </div>
        )}

        {/* Group filter tabs */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto">
            <FilterTab
              active={filterGroup === 'all'}
              onClick={() => setFilterGroup('all')}
              label="All"
              count={data?.summary.total || 0}
            />
            {groups.map(g => (
              <FilterTab
                key={g}
                active={filterGroup === g}
                onClick={() => setFilterGroup(g)}
                label={g}
                count={data?.summary.groups[g] || 0}
              />
            ))}
          </div>
        )}

        {/* Jobs list */}
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
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
      </main>
    </div>
  );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
          : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-300'
      }`}
    >
      {label}
      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${active ? 'bg-blue-600/30' : 'bg-slate-700/50'}`}>
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
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 rounded-lg bg-slate-700/50">
            <GroupIcon className="w-4 h-4 text-slate-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{job.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{job.description}</p>
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

        {/* Right: last run info */}
        <div className="text-right shrink-0">
          {job.lastRunAt && (
            <div className="text-xs text-slate-400">
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
            <div className="text-xs text-rose-400 mt-0.5 max-w-[200px] truncate" title={job.lastResult}>
              {job.lastResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
