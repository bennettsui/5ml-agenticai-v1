'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Shield,
  BookOpen,
  Activity,
} from 'lucide-react';
import {
  crmApi,
  type DebugSession,
  type DebugIssue,
} from '@/lib/crm-kb-api';
import { useCrmAi } from '../../context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Critical' },
  major: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Major' },
  minor: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Minor' },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Info' },
};

const priorityColors: Record<string, string> = {
  P0: 'text-red-400',
  P1: 'text-orange-400',
  P2: 'text-amber-400',
  P3: 'text-slate-400',
};

const resolutionColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  resolved: 'bg-green-500/10 text-green-300 border-green-500/20',
  accepted_risk: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  wont_fix: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  duplicate: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number | null): string {
  if (score === null) return 'bg-slate-800';
  if (score >= 80) return 'bg-green-900/20 border-green-500/30';
  if (score >= 60) return 'bg-amber-900/20 border-amber-500/30';
  return 'bg-red-900/20 border-red-500/30';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = 'issues' | 'modules' | 'kb';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DebugSessionDetail({ sessionId }: { sessionId: string }) {
  const { setPageState } = useCrmAi();
  const [session, setSession] = useState<DebugSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('issues');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const data = await crmApi.debug.getSession(sessionId);
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const toggleIssue = (id: string) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-red-300">
        <p className="font-medium">Error loading debug session</p>
        <p className="text-sm mt-1">{error || 'Session not found'}</p>
        <Link href="/use-cases/crm/debug" className="text-sm text-red-400 hover:text-red-300 mt-3 inline-block">
          &larr; Back to sessions
        </Link>
      </div>
    );
  }

  const issues = session.issues || [];
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const majorCount = issues.filter((i) => i.severity === 'major').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }> = [
    { id: 'issues', label: 'Issues', icon: Bug, count: issues.length },
    { id: 'modules', label: 'Modules', icon: Activity, count: session.modules_invoked?.length || 0 },
    { id: 'kb', label: 'KB Used', icon: BookOpen, count: session.kb_entries_used?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/use-cases/crm/debug"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Debug Sessions
        </Link>
      </div>

      {/* Score & Summary */}
      <div className={`rounded-xl border p-6 ${scoreBg(session.overall_score)}`}>
        <div className="flex items-center gap-6">
          {/* Score */}
          <div className={`w-20 h-20 rounded-2xl bg-slate-900/50 flex items-center justify-center ${scoreColor(session.overall_score)}`}>
            {session.overall_score !== null ? (
              <span className="text-3xl font-bold">{session.overall_score}</span>
            ) : (
              <Clock className="w-8 h-8 text-slate-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">
                {session.subject_type.replace(/_/g, ' ')}
              </h1>
              {session.overall_status && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  session.overall_status === 'pass'
                    ? 'bg-green-500/10 text-green-300 border-green-500/20'
                    : session.overall_status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-red-500/10 text-red-300 border-red-500/20'
                }`}>
                  {session.overall_status.toUpperCase()}
                </span>
              )}
            </div>

            {session.subject_ref && (
              <p className="text-sm text-slate-400 mt-1 truncate">{session.subject_ref}</p>
            )}

            {session.overall_summary && (
              <p className="text-sm text-slate-300 mt-2">{session.overall_summary}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span>{formatDate(session.created_at)}</span>
              <span className="px-2 py-0.5 rounded-full border bg-slate-700/30 border-slate-600/30">{session.status.replace(/_/g, ' ')}</span>
              {session.trace_enabled && <span className="text-purple-400">Trace enabled</span>}
            </div>
          </div>
        </div>

        {/* Severity breakdown */}
        {issues.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.05]">
            {criticalCount > 0 && <span className="text-xs text-red-400 font-medium">{criticalCount} critical</span>}
            {majorCount > 0 && <span className="text-xs text-orange-400 font-medium">{majorCount} major</span>}
            {minorCount > 0 && <span className="text-xs text-amber-400 font-medium">{minorCount} minor</span>}
            {infoCount > 0 && <span className="text-xs text-blue-400 font-medium">{infoCount} info</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/40 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  active ? 'bg-slate-600 text-slate-200' : 'bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content: Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-2">
          {issues.length === 0 ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No issues found</p>
              <p className="text-slate-500 text-sm mt-1">All checks passed successfully</p>
            </div>
          ) : (
            issues
              .sort((a, b) => {
                const sevOrder: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
                return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
              })
              .map((issue) => {
                const sev = severityConfig[issue.severity] || severityConfig.info;
                const expanded = expandedIssues.has(issue.id);

                return (
                  <div
                    key={issue.id}
                    className={`rounded-xl border ${sev.bg} overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleIssue(issue.id)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <Shield className={`w-4 h-4 flex-shrink-0 ${sev.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${sev.color}`}>{sev.label}</span>
                          <span className={`text-xs font-mono ${priorityColors[issue.priority] || 'text-slate-400'}`}>{issue.priority}</span>
                          <span className="text-xs text-slate-500">{issue.module}</span>
                          <span className="text-xs text-slate-600">{issue.area}</span>
                        </div>
                        <p className="text-sm text-white mt-1 truncate">{issue.finding}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${resolutionColors[issue.resolution_status] || ''}`}>
                        {issue.resolution_status.replace(/_/g, ' ')}
                      </span>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/[0.03]">
                        <div className="pt-3">
                          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Finding</h4>
                          <p className="text-sm text-slate-300">{issue.finding}</p>
                        </div>

                        {issue.recommendation && (
                          <div>
                            <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommendation</h4>
                            <p className="text-sm text-slate-300">{issue.recommendation}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {issue.score_impact > 0 && (
                            <span>Score impact: <span className="text-red-400">-{issue.score_impact}</span></span>
                          )}
                          {issue.business_impact && issue.business_impact !== 'none' && (
                            <span>Business impact: <span className="text-amber-400">{issue.business_impact}</span></span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Tab Content: Modules */}
      {activeTab === 'modules' && (
        <div className="space-y-2">
          {(session.modules_invoked || []).map((mod, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-white">{mod.module}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {mod.execution_time_ms}ms
                  {mod.issues_found !== undefined && ` · ${mod.issues_found} issue(s)`}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                mod.status === 'success'
                  ? 'bg-green-500/10 text-green-300 border-green-500/20'
                  : mod.status === 'pending'
                    ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    : 'bg-red-500/10 text-red-300 border-red-500/20'
              }`}>
                {mod.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: KB Used */}
      {activeTab === 'kb' && (
        <div className="space-y-2">
          {(session.kb_entries_used || []).length === 0 ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-8 text-center">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No KB entries used</p>
              <p className="text-slate-500 text-sm mt-1">Configure client rules and patterns to enable KB-powered debugging</p>
            </div>
          ) : (
            (session.kb_entries_used || []).map((entry, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 flex items-center gap-3"
              >
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                  entry.type === 'rule'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                }`}>
                  {entry.type}
                </div>
                <span className="text-sm text-slate-400 font-mono truncate">{entry.id}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
