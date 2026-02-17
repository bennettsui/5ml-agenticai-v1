'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Search,
  Globe,
  Play,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  Link2,
  Smartphone,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { crmApi, type DebugSession, type DebugIssue } from '@/lib/crm-kb-api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const severityConfig: Record<string, { color: string; bg: string; label: string; icon: typeof XCircle }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Critical', icon: XCircle },
  major: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Major', icon: AlertTriangle },
  minor: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Minor', icon: AlertTriangle },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Info', icon: CheckCircle2 },
};

const moduleConfig: Record<string, { icon: typeof Globe; color: string; label: string }> = {
  seo_aiseo: { icon: Search, color: 'text-blue-400', label: 'SEO / AI SEO' },
  website_health: { icon: Activity, color: 'text-emerald-400', label: 'Website Health' },
  web_qc: { icon: Globe, color: 'text-purple-400', label: 'Web QC' },
};

// ---------------------------------------------------------------------------
// Module info cards (shown before running)
// ---------------------------------------------------------------------------

const moduleCards = [
  {
    icon: Search,
    title: 'SEO / AI SEO Audit',
    subtitle: 'Ahrefs-style analysis',
    checks: ['Meta tags & headings', 'Schema.org structured data', 'Internal linking audit', 'AI content signals (E-E-A-T)', 'Keyword density', 'Core Web Vitals SEO'],
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Activity,
    title: 'Website Health',
    subtitle: 'Google PageSpeed standards',
    checks: ['LCP (Largest Contentful Paint)', 'INP (Interaction to Next Paint)', 'CLS (Cumulative Layout Shift)', 'Broken link detection', 'Mobile-friendliness', 'HTTPS & security headers', 'WCAG 2.2 accessibility', 'Performance budget'],
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Globe,
    title: 'Web Quality Control',
    subtitle: 'Comprehensive QC scan',
    checks: ['Broken links & 404s', 'Accessibility issues', 'Performance bottlenecks', 'Content quality'],
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HealthCheckPage() {
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state — shown inline
  const [result, setResult] = useState<DebugSession | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    if (!url.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setExpandedIssues(new Set());
    setModuleFilter(null);
    try {
      const data = await crmApi.debug.createSession({
        subject_type: 'web_page',
        subject_ref: url.trim(),
        module_ids: ['seo_aiseo', 'website_health', 'web_qc'],
        auto_run: true,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run health check');
    } finally {
      setRunning(false);
    }
  }, [url]);

  const clearResults = () => {
    setResult(null);
    setError(null);
    setExpandedIssues(new Set());
    setModuleFilter(null);
  };

  const toggleIssue = (id: string) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Derived data from result
  const issues = result?.issues || [];
  const filteredIssues = moduleFilter
    ? issues.filter((i) => i.module === moduleFilter)
    : issues;
  const issuesByModule: Record<string, DebugIssue[]> = {};
  for (const issue of issues) {
    if (!issuesByModule[issue.module]) issuesByModule[issue.module] = [];
    issuesByModule[issue.module].push(issue);
  }
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const majorCount = issues.filter((i) => i.severity === 'major').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Platform
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Activity className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Website Health Check</h1>
              <p className="text-slate-400 text-sm">SEO audit, Core Web Vitals, broken links, and quality analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* URL Input Hero */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 rounded-2xl border border-emerald-500/20 p-8">
          <h2 className="text-xl font-bold text-white mb-2">Check Any Website</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter a URL to run a comprehensive health check — SEO audit, Google PageSpeed analysis, broken link detection, and more.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && url.trim() && !running) runCheck(); }}
                placeholder="https://example.com"
                disabled={running}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white text-base placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 transition-colors"
              />
            </div>
            <button
              onClick={runCheck}
              disabled={running || !url.trim()}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {running ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                <><Play className="w-5 h-5" /> Run Check</>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm font-medium">Health check failed</p>
              <p className="text-red-400/80 text-xs mt-1">{error}</p>
              <p className="text-slate-500 text-xs mt-2">This may happen if the backend server was recently restarted. Please try again.</p>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* RESULTS (shown inline when available)                            */}
        {/* ================================================================ */}
        {result && (
          <>
            {/* Score Hero */}
            <div className={`bg-gradient-to-br ${scoreBg(result.overall_score)} rounded-2xl border border-slate-700/30 p-8`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">
                    Results for {result.subject_ref}
                  </h2>
                  {result.subject_ref && (
                    <a
                      href={result.subject_ref.startsWith('http') ? result.subject_ref : `https://${result.subject_ref}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit
                    </a>
                  )}
                </div>
                <button
                  onClick={clearResults}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> New Check
                </button>
              </div>

              <div className="flex items-center gap-8">
                {/* Large Score */}
                <div className="flex-shrink-0 text-center">
                  <div className={`w-24 h-24 rounded-3xl bg-slate-900/60 flex items-center justify-center ring-4 ${
                    result.overall_score === null ? 'ring-slate-700' :
                    result.overall_score >= 80 ? 'ring-green-500/30' :
                    result.overall_score >= 60 ? 'ring-amber-500/30' :
                    'ring-red-500/30'
                  }`}>
                    {result.overall_score !== null ? (
                      <span className={`text-3xl font-bold ${scoreColor(result.overall_score)}`}>{result.overall_score}</span>
                    ) : (
                      <Clock className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${scoreColor(result.overall_score)}`}>
                    {scoreLabel(result.overall_score)}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  {result.overall_summary && (
                    <p className="text-slate-300 text-sm mb-4">{result.overall_summary}</p>
                  )}
                  <div className="flex items-center gap-5 flex-wrap">
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
              {(result.modules_invoked || []).map((mod, idx) => {
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
                      {mod.execution_time_ms !== undefined && <span>{mod.execution_time_ms}ms</span>}
                      {modCritical > 0 && <span className="text-red-400">{modCritical} critical</span>}
                      {modMajor > 0 && <span className="text-orange-400">{modMajor} major</span>}
                    </div>
                    {isActive && <p className="text-xs text-emerald-400 mt-2">Filtering by this module</p>}
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
                  <button onClick={() => setModuleFilter(null)} className="text-xs text-slate-400 hover:text-white transition-colors">
                    Show all
                  </button>
                )}
              </div>

              {filteredIssues.length === 0 ? (
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">{moduleFilter ? 'No issues in this module' : 'No issues found'}</p>
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
                        <div key={issue.id} className={`rounded-xl border ${sev.bg} overflow-hidden`}>
                          <button onClick={() => toggleIssue(issue.id)} className="w-full flex items-center gap-3 p-4 text-left">
                            <SevIcon className={`w-4 h-4 flex-shrink-0 ${sev.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${sev.color}`}>{sev.label}</span>
                                {modConf && <span className="text-xs text-slate-500">{modConf.label}</span>}
                                <span className="text-xs text-slate-600">{issue.area}</span>
                              </div>
                              <p className="text-sm text-white mt-1 truncate">{issue.finding}</p>
                            </div>
                            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                          </button>

                          {expanded && (
                            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.03]">
                              <div className="pt-3">
                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Finding</h4>
                                <p className="text-sm text-slate-300 whitespace-pre-wrap">{issue.finding}</p>
                              </div>

                              {/* Evidence details */}
                              {issue.evidence && Object.keys(issue.evidence).length > 0 && (
                                <div>
                                  <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Evidence</h4>
                                  <div className="bg-white/[0.02] rounded-lg border border-white/[0.05] p-3 space-y-1.5">
                                    {Object.entries(issue.evidence).map(([key, value]) => {
                                      if (key === 'status' && value === 'good') return null;
                                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                      let displayValue: string;
                                      if (Array.isArray(value)) {
                                        displayValue = value.join(', ');
                                      } else if (typeof value === 'object' && value !== null) {
                                        displayValue = JSON.stringify(value);
                                      } else {
                                        displayValue = String(value ?? '—');
                                      }
                                      return (
                                        <div key={key} className="flex items-start gap-2 text-xs">
                                          <span className="text-slate-500 min-w-[100px] flex-shrink-0">{label}:</span>
                                          <span className="text-slate-300 break-all font-mono">{displayValue}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {issue.recommendation && (
                                <div>
                                  <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">How to Fix</h4>
                                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{issue.recommendation}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                {issue.score_impact > 0 && (
                                  <span>Score impact: <span className="text-red-400">-{issue.score_impact}</span></span>
                                )}
                                {issue.business_impact && issue.business_impact !== 'none' && (
                                  <span>Business: <span className="text-amber-400">{issue.business_impact}</span></span>
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
          </>
        )}

        {/* ================================================================ */}
        {/* WHAT WE CHECK (shown only when no results)                       */}
        {/* ================================================================ */}
        {!result && !running && (
          <>
            {/* What We Check — Module Cards */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">What We Check</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {moduleCards.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.title} className={`rounded-xl border p-5 ${mod.bg}`}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <Icon className={`w-5 h-5 ${mod.color}`} />
                        <div>
                          <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                          <p className="text-xs text-slate-500">{mod.subtitle}</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {mod.checks.map((check, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-slate-600 flex-shrink-0" />
                            {check}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Metrics Highlight */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Zap, label: 'Core Web Vitals', detail: 'LCP, INP, CLS', color: 'text-amber-400' },
                { icon: Link2, label: 'Broken Links', detail: '404 detection', color: 'text-red-400' },
                { icon: Smartphone, label: 'Mobile Ready', detail: 'Responsive check', color: 'text-blue-400' },
                { icon: Lock, label: 'Security', detail: 'HTTPS & headers', color: 'text-green-400' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                    <div>
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
