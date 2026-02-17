'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ChevronRight,
  ArrowLeft,
  Shield,
  Link2,
  Smartphone,
  Zap,
  Eye,
  Lock,
} from 'lucide-react';
import { crmApi, type DebugSession, type DebugStats } from '@/lib/crm-kb-api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBgRing(score: number | null): string {
  if (score === null) return 'ring-slate-700';
  if (score >= 80) return 'ring-green-500/40';
  if (score >= 60) return 'ring-amber-500/40';
  return 'ring-red-500/40';
}

function statusBadge(status: string | null) {
  if (!status) return null;
  const map: Record<string, { bg: string; label: string }> = {
    pass: { bg: 'bg-green-500/10 text-green-300 border-green-500/20', label: 'Pass' },
    warning: { bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20', label: 'Warning' },
    fail: { bg: 'bg-red-500/10 text-red-300 border-red-500/20', label: 'Fail' },
  };
  const conf = map[status];
  if (!conf) return null;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${conf.bg}`}>
      {conf.label}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Module info cards
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
  const router = useRouter();

  // Quick check
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [total, setTotal] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const runCheck = useCallback(async () => {
    if (!url.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const session = await crmApi.debug.createSession({
        subject_type: 'web_page',
        subject_ref: url.trim(),
        module_ids: ['seo_aiseo', 'website_health', 'web_qc'],
      });
      const result = await crmApi.debug.runSession(session.id);
      router.push(`/healthcheck/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run health check');
      setRunning(false);
    }
  }, [url, router]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await crmApi.debug.sessions({ page: 1, limit: 10 });
      // Filter to web_page sessions only
      setSessions(res.items.filter((s) => s.subject_type === 'web_page'));
      setTotal(res.total);
      setHistoryLoaded(true);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

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

        {/* Recent Checks (History) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Checks</h2>
            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {historyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {historyLoaded ? 'Refresh' : 'Load History'}
            </button>
          </div>

          {!historyLoaded && !historyLoading && (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-10 text-center">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Click "Load History" to view past checks</p>
              <p className="text-slate-500 text-sm mt-1">Or run your first health check above</p>
            </div>
          )}

          {historyLoaded && sessions.length === 0 && (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-10 text-center">
              <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No health checks yet</p>
              <p className="text-slate-500 text-sm mt-1">Enter a URL above to run your first check</p>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/healthcheck/${session.id}`}
                  className="group flex items-center gap-4 bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors p-4"
                >
                  {/* Score */}
                  <div className={`w-12 h-12 rounded-xl bg-slate-900/50 ring-2 ${scoreBgRing(session.overall_score)} flex items-center justify-center flex-shrink-0 ${scoreColor(session.overall_score)}`}>
                    {session.overall_score !== null ? (
                      <span className="text-lg font-bold">{session.overall_score}</span>
                    ) : (
                      <Clock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {session.subject_ref || 'Unknown URL'}
                      </span>
                      {statusBadge(session.overall_status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{formatDate(session.created_at)}</span>
                      {session.issue_count !== undefined && session.issue_count > 0 && (
                        <span className="text-amber-400">{session.issue_count} issue(s)</span>
                      )}
                      {session.critical_count !== undefined && session.critical_count > 0 && (
                        <span className="text-red-400">{session.critical_count} critical</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
