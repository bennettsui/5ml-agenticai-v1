'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bug,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ChevronRight,
  Globe,
  Play,
  Search,
  Activity,
} from 'lucide-react';
import {
  crmApi,
  type DebugSession,
  type DebugStats,
} from '@/lib/crm-kb-api';
import { useCrmAi } from '../context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const overallStatusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pass: { icon: CheckCircle2, color: 'text-green-400', label: 'Pass' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', label: 'Warning' },
  fail: { icon: XCircle, color: 'text-red-400', label: 'Fail' },
};

const sessionStatusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  in_review: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  addressed: 'bg-green-500/10 text-green-300 border-green-500/20',
  ignored: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DebugSessionsPage() {
  const router = useRouter();
  const { setPageState } = useCrmAi();
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [stats, setStats] = useState<DebugStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Quick URL check state
  const [quickUrl, setQuickUrl] = useState('');
  const [quickRunning, setQuickRunning] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const runQuickCheck = useCallback(async () => {
    if (!quickUrl.trim()) return;
    setQuickRunning(true);
    setQuickError(null);
    try {
      const result = await crmApi.debug.createSession({
        subject_type: 'web_page',
        subject_ref: quickUrl.trim(),
        module_ids: ['seo_aiseo', 'website_health', 'web_qc'],
        auto_run: true,
      });
      try { sessionStorage.setItem(`debug-session-${result.id}`, JSON.stringify(result)); } catch {}
      router.push(`/use-cases/crm/debug/${result.id}`);
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Failed to run check');
    } finally {
      setQuickRunning(false);
    }
  }, [quickUrl, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        crmApi.debug.sessions({ page, limit: 20 }),
        crmApi.debug.stats(),
      ]);
      setSessions(sessionsRes.items);
      setTotal(sessionsRes.total);
      setStats(statsRes);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load debug sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bug className="w-7 h-7 text-amber-400" />
            Debug QA Sessions
          </h1>
          <p className="text-slate-400 mt-1">
            Run AI-powered quality checks against deliverables using client knowledge base
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loaded ? 'Refresh' : 'Load Sessions'}
          </button>
          <Link
            href="/use-cases/crm/debug/new"
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Debug Session
          </Link>
        </div>
      </div>

      {/* Quick URL Check */}
      <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-xl border border-amber-500/20 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Quick Website Check</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Enter a URL to instantly run SEO audit, website health (PageSpeed), and web quality checks
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="url"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && quickUrl.trim()) runQuickCheck(); }}
              placeholder="https://example.com"
              disabled={quickRunning}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={runQuickCheck}
            disabled={quickRunning || !quickUrl.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {quickRunning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
            ) : (
              <><Play className="w-4 h-4" /> Run Check</>
            )}
          </button>
        </div>
        {quickError && (
          <p className="text-red-400 text-xs mt-2">{quickError}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Search className="w-3 h-3" /> SEO / AI SEO Audit</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Core Web Vitals</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Broken Links & QC</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="text-sm text-slate-400">Total Sessions</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total_sessions}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="text-sm text-slate-400">Avg Score</div>
            <div className={`text-2xl font-bold mt-1 ${scoreColor(stats.avg_score)}`}>
              {stats.avg_score !== null ? `${stats.avg_score}` : '—'}
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="text-sm text-slate-400">Open Issues</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.open_issues}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="text-sm text-slate-400">Critical Open</div>
            <div className="text-2xl font-bold text-red-400 mt-1">{stats.critical_open}</div>
          </div>
        </div>
      )}

      {/* Pass / Warning / Fail breakdown */}
      {stats && stats.total_sessions > 0 && (
        <div className="flex items-center gap-6 bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">{stats.pass_count} Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">{stats.warning_count} Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">{stats.fail_count} Fail</span>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {!loaded && !loading && (
        <div className="bg-slate-800/60 rounded-xl p-12 border border-slate-700/50 text-center">
          <Bug className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">Click &ldquo;Load Sessions&rdquo; to view debug history</p>
          <p className="text-slate-500 text-sm mt-1">Or create a new debug session to get started</p>
        </div>
      )}

      {loaded && sessions.length === 0 && (
        <div className="bg-slate-800/60 rounded-xl p-12 border border-slate-700/50 text-center">
          <Bug className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">No debug sessions yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first debug session to start quality checking deliverables</p>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => {
            const statusConf = session.overall_status
              ? overallStatusConfig[session.overall_status]
              : null;
            const StatusIcon = statusConf?.icon || Clock;
            const statusColor = statusConf?.color || 'text-slate-400';

            return (
              <Link
                key={session.id}
                href={`/use-cases/crm/debug/${session.id}`}
                className="group block bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Score badge */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-slate-900/50 flex items-center justify-center ${scoreColor(session.overall_score)}`}>
                      {session.overall_score !== null ? (
                        <span className="text-xl font-bold">{session.overall_score}</span>
                      ) : (
                        <Clock className="w-6 h-6 text-slate-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 flex-shrink-0 ${statusColor}`} />
                        <span className="text-white font-medium truncate">
                          {session.subject_type.replace(/_/g, ' ')} — {session.subject_ref || 'No reference'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span>{formatDate(session.created_at)}</span>
                        <span className={`px-2 py-0.5 rounded-full border ${sessionStatusColors[session.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          {session.status.replace(/_/g, ' ')}
                        </span>
                        {session.modules_invoked && (
                          <span>{session.modules_invoked.length} module(s)</span>
                        )}
                        {session.issue_count !== undefined && session.issue_count > 0 && (
                          <span className="text-amber-400">{session.issue_count} issue(s)</span>
                        )}
                        {session.critical_count !== undefined && session.critical_count > 0 && (
                          <span className="text-red-400">{session.critical_count} critical</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); fetchData(); }}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => { setPage((p) => p + 1); fetchData(); }}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
