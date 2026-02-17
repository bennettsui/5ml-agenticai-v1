'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Shield,
  Search,
  Globe,
  Zap,
  Link2,
  Smartphone,
  Lock,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { crmApi, type DebugSession, type DebugIssue } from '@/lib/crm-kb-api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const severityConfig: Record<string, { color: string; bg: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Critical', icon: XCircle },
  major: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Major', icon: AlertTriangle },
  minor: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Minor', icon: AlertTriangle },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Info', icon: CheckCircle2 },
};

const moduleConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  seo_aiseo: { icon: Search, color: 'text-blue-400', label: 'SEO / AI SEO' },
  website_health: { icon: Activity, color: 'text-emerald-400', label: 'Website Health' },
  web_qc: { icon: Globe, color: 'text-purple-400', label: 'Web QC' },
};

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Pending';
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Needs Work';
  return 'Poor';
}

function scoreBg(score: number | null): string {
  if (score === null) return 'from-slate-800 to-slate-800';
  if (score >= 80) return 'from-green-900/30 to-emerald-900/20';
  if (score >= 60) return 'from-amber-900/30 to-orange-900/20';
  return 'from-red-900/30 to-rose-900/20';
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
// Component
// ---------------------------------------------------------------------------

export default function HealthCheckDetail({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<DebugSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Try sessionStorage first (populated by the create+run call)
      try {
        const cached = sessionStorage.getItem(`healthcheck-${sessionId}`);
        if (cached) {
          setSession(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {}

      // Fall back to API fetch
      try {
        const data = await crmApi.debug.getSession(sessionId);
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading health check results...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center max-w-md">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 font-medium">Error loading results</p>
          <p className="text-sm text-red-400/80 mt-1">{error || 'Session not found'}</p>
          <Link href="/healthcheck" className="text-sm text-emerald-400 hover:text-emerald-300 mt-4 inline-block">
            &larr; Back to Health Check
          </Link>
        </div>
      </div>
    );
  }

  const issues = session.issues || [];
  const filteredIssues = moduleFilter
    ? issues.filter((i) => i.module === moduleFilter)
    : issues;

  // Group issues by module
  const issuesByModule: Record<string, DebugIssue[]> = {};
  for (const issue of issues) {
    if (!issuesByModule[issue.module]) issuesByModule[issue.module] = [];
    issuesByModule[issue.module].push(issue);
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const majorCount = issues.filter((i) => i.severity === 'major').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  // Module summaries from modules_invoked
  const modules = session.modules_invoked || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/healthcheck" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Health Check
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-emerald-500/10 rounded-xl flex-shrink-0">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white truncate">
                  {session.subject_ref || 'Health Check Results'}
                </h1>
                <p className="text-slate-500 text-xs mt-0.5">{formatDate(session.created_at)}</p>
              </div>
            </div>
            {session.subject_ref && (
              <a
                href={session.subject_ref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Site
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Score Hero */}
        <div className={`bg-gradient-to-br ${scoreBg(session.overall_score)} rounded-2xl border border-slate-700/30 p-8`}>
          <div className="flex items-center gap-8">
            {/* Large Score */}
            <div className="flex-shrink-0 text-center">
              <div className={`w-28 h-28 rounded-3xl bg-slate-900/60 flex items-center justify-center ring-4 ${
                session.overall_score === null ? 'ring-slate-700' :
                session.overall_score >= 80 ? 'ring-green-500/30' :
                session.overall_score >= 60 ? 'ring-amber-500/30' :
                'ring-red-500/30'
              }`}>
                {session.overall_score !== null ? (
                  <span className={`text-4xl font-bold ${scoreColor(session.overall_score)}`}>{session.overall_score}</span>
                ) : (
                  <Clock className="w-10 h-10 text-slate-500" />
                )}
              </div>
              <p className={`text-sm font-medium mt-2 ${scoreColor(session.overall_score)}`}>
                {scoreLabel(session.overall_score)}
              </p>
            </div>

            <div className="flex-1 min-w-0">
              {session.overall_summary && (
                <p className="text-slate-300 text-sm mb-4">{session.overall_summary}</p>
              )}

              {/* Severity bar */}
              <div className="flex items-center gap-5">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-medium">{criticalCount} Critical</span>
                  </div>
                )}
                {majorCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-400 font-medium">{majorCount} Major</span>
                  </div>
                )}
                {minorCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400 font-medium">{minorCount} Minor</span>
                  </div>
                )}
                {infoCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400 font-medium">{infoCount} Info</span>
                  </div>
                )}
                {issues.length === 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">All checks passed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod, idx) => {
            const conf = moduleConfig[mod.module] || { icon: Globe, color: 'text-slate-400', label: mod.module };
            const Icon = conf.icon;
            const modIssues = issuesByModule[mod.module] || [];
            const modCritical = modIssues.filter((i) => i.severity === 'critical').length;
            const modMajor = modIssues.filter((i) => i.severity === 'major').length;
            const isActive = moduleFilter === mod.module;

            return (
              <button
                key={idx}
                onClick={() => setModuleFilter(isActive ? null : mod.module)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  isActive
                    ? 'bg-slate-700/50 border-slate-500'
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${conf.color}`} />
                    <span className="text-sm font-medium text-white">{conf.label}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    mod.status === 'success'
                      ? 'bg-green-500/10 text-green-300 border-green-500/20'
                      : 'bg-red-500/10 text-red-300 border-red-500/20'
                  }`}>
                    {mod.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{modIssues.length} issue(s)</span>
                  {mod.execution_time_ms && <span>{mod.execution_time_ms}ms</span>}
                  {modCritical > 0 && <span className="text-red-400">{modCritical} critical</span>}
                  {modMajor > 0 && <span className="text-orange-400">{modMajor} major</span>}
                </div>
                {isActive && (
                  <p className="text-xs text-emerald-400 mt-2">Showing only these issues</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Issues List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">
              {moduleFilter ? `${moduleConfig[moduleFilter]?.label || moduleFilter} Issues` : 'All Issues'}
            </h2>
            {moduleFilter && (
              <button
                onClick={() => setModuleFilter(null)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Show all
              </button>
            )}
          </div>

          {filteredIssues.length === 0 ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">
                {moduleFilter ? 'No issues in this module' : 'No issues found'}
              </p>
              <p className="text-slate-500 text-sm mt-1">All checks passed successfully</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredIssues
                .sort((a, b) => {
                  const sevOrder: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
                  return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
                })
                .map((issue) => {
                  const sev = severityConfig[issue.severity] || severityConfig.info;
                  const SevIcon = sev.icon;
                  const expanded = expandedIssues.has(issue.id);
                  const modConf = moduleConfig[issue.module];

                  return (
                    <div
                      key={issue.id}
                      className={`rounded-xl border ${sev.bg} overflow-hidden`}
                    >
                      <button
                        onClick={() => toggleIssue(issue.id)}
                        className="w-full flex items-center gap-3 p-4 text-left"
                      >
                        <SevIcon className={`w-4 h-4 flex-shrink-0 ${sev.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${sev.color}`}>{sev.label}</span>
                            {modConf && (
                              <span className="text-xs text-slate-500">{modConf.label}</span>
                            )}
                            <span className="text-xs text-slate-600">{issue.area}</span>
                          </div>
                          <p className="text-sm text-white mt-1 truncate">{issue.finding}</p>
                        </div>
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
                              <span>Business: <span className="text-amber-400">{issue.business_impact}</span></span>
                            )}
                            {issue.user_impact && (
                              <span>User: <span className="text-amber-400">{issue.user_impact}</span></span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
