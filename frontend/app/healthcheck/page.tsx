'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  Search,
  Globe,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  Link2,
  Smartphone,
  Zap,
  Lock,
  Shield,
  Eye,
  Code2,
  Brain,
  Layers,
  Server,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Copy,
  Check,
  ChevronsDown,
  ChevronsUp,
  BookOpen,
  Cpu,
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

const severityConfig: Record<string, { color: string; bg: string; barColor: string; label: string; icon: typeof XCircle }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', barColor: 'bg-red-500', label: 'Critical', icon: XCircle },
  major: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', barColor: 'bg-orange-500', label: 'Major', icon: AlertTriangle },
  minor: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', barColor: 'bg-amber-500', label: 'Minor', icon: AlertTriangle },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', barColor: 'bg-blue-500', label: 'Info', icon: CheckCircle2 },
};

// ---------------------------------------------------------------------------
// 7-Layer Architecture Config
// ---------------------------------------------------------------------------

interface LayerDef {
  id: string;
  name: string;
  icon: typeof Globe;
  color: string;
  barColor: string;
  description: string;
  areas: string[];          // Map issue.area values to this layer
  modules: string[];        // Map issue.module values to this layer (fallback)
}

const LAYERS: LayerDef[] = [
  { id: 'L1', name: 'Infrastructure & Server', icon: Server, color: 'text-emerald-400', barColor: 'bg-emerald-500', description: 'HTTP status, response time, HTTPS, encoding', areas: ['Health'], modules: ['website_health'] },
  { id: 'L2', name: 'Security & Privacy', icon: Shield, color: 'text-red-400', barColor: 'bg-red-500', description: 'Data leakage, XSS vectors, headers, cookies, API keys', areas: ['Security', 'Privacy'], modules: ['security_scan'] },
  { id: 'L3', name: 'Performance & Speed', icon: Zap, color: 'text-amber-400', barColor: 'bg-amber-500', description: 'Page size, compression, mobile, Core Web Vitals', areas: ['Performance', 'Mobile'], modules: [] },
  { id: 'L4', name: 'SEO Foundation', icon: Search, color: 'text-blue-400', barColor: 'bg-blue-500', description: 'Meta tags, headings, structured data, linking', areas: ['SEO'], modules: ['seo_aiseo'] },
  { id: 'L5', name: 'AI & Content Intelligence', icon: Brain, color: 'text-purple-400', barColor: 'bg-purple-500', description: 'E-E-A-T signals, content quality, AI readability', areas: ['AI SEO'], modules: [] },
  { id: 'L6', name: 'Accessibility (WCAG)', icon: Eye, color: 'text-cyan-400', barColor: 'bg-cyan-500', description: 'WCAG 2.2 compliance, ARIA, forms, keyboard nav', areas: ['Accessibility'], modules: ['wcag_accessibility'] },
  { id: 'L7', name: 'Quality & Standards', icon: Code2, color: 'text-indigo-400', barColor: 'bg-indigo-500', description: 'HTML standards, deprecated tags, UX, code quality', areas: ['Standards', 'Maintainability', 'UX', 'QC'], modules: ['web_qc'] },
];

function getLayerForIssue(issue: DebugIssue): string {
  for (const layer of LAYERS) {
    if (layer.areas.includes(issue.area)) return layer.id;
  }
  for (const layer of LAYERS) {
    if (layer.modules.includes(issue.module)) return layer.id;
  }
  return 'L7'; // default to Quality
}

// ---------------------------------------------------------------------------
// Module config for summary cards
// ---------------------------------------------------------------------------

const moduleConfig: Record<string, { icon: typeof Globe; color: string; label: string }> = {
  website_health: { icon: Activity, color: 'text-emerald-400', label: 'Infrastructure & Performance' },
  security_scan: { icon: Shield, color: 'text-red-400', label: 'Security & Privacy' },
  seo_aiseo: { icon: Search, color: 'text-blue-400', label: 'SEO & AI Content' },
  wcag_accessibility: { icon: Eye, color: 'text-cyan-400', label: 'Accessibility (WCAG)' },
  web_qc: { icon: Code2, color: 'text-indigo-400', label: 'Quality & Standards' },
};

// ---------------------------------------------------------------------------
// Module info cards (shown before running)
// ---------------------------------------------------------------------------

const moduleCards = [
  { icon: Server, title: 'Infrastructure & Performance', subtitle: 'Layers 1 & 3', checks: ['HTTP status & response time', 'HTTPS & SSL validation', 'Compression (gzip/brotli)', 'Page size optimization', 'Mobile-friendliness', 'Character encoding'], color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Shield, title: 'Security & Privacy', subtitle: 'Layer 2', checks: ['API key exposure scan', 'XSS vector detection', 'Security headers audit', 'Cookie security flags', 'Data leakage (emails, PII)', 'SRI & CORS checks'], color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { icon: Search, title: 'SEO & AI Content Intelligence', subtitle: 'Layers 4 & 5', checks: ['Meta tags & headings', 'Schema.org structured data', 'E-E-A-T signals analysis', 'Content quality & readability', 'Internal linking audit', 'Image SEO & hreflang'], color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: Eye, title: 'Accessibility (WCAG 2.2)', subtitle: 'Layer 6', checks: ['ARIA landmarks', 'Form labels & inputs', 'Image alt attributes', 'Skip navigation links', 'Focus management', 'Video captions'], color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { icon: Code2, title: 'Quality & Standards', subtitle: 'Layer 7', checks: ['HTML5 validation', 'Deprecated tags', 'Mixed content detection', 'Inline style audit', 'Favicon presence', 'Link text quality'], color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
];

// All 5 modules for the health check
const ALL_MODULE_IDS = ['website_health', 'security_scan', 'seo_aiseo', 'wcag_accessibility', 'web_qc'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HealthCheckPage() {
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<DebugSession | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());

  const runCheck = useCallback(async () => {
    if (!url.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setExpandedIssues(new Set());
    setModuleFilter(null);
    setCollapsedLayers(new Set());
    try {
      const data = await crmApi.debug.createSession({
        subject_type: 'web_page',
        subject_ref: url.trim(),
        module_ids: ALL_MODULE_IDS,
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
    setCollapsedLayers(new Set());
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

  const issuesByLayer = useMemo(() => {
    const byLayer: Record<string, DebugIssue[]> = {};
    for (const layer of LAYERS) byLayer[layer.id] = [];
    for (const issue of filteredIssues) {
      const layerId = getLayerForIssue(issue);
      if (!byLayer[layerId]) byLayer[layerId] = [];
      byLayer[layerId].push(issue);
    }
    return byLayer;
  }, [filteredIssues]);

  const layerScores = useMemo(() => {
    const scores: Record<string, { score: number; total: number; critical: number; major: number; minor: number; info: number }> = {};
    for (const layer of LAYERS) {
      const layerIssues = issuesByLayer[layer.id] || [];
      let impact = 0;
      let critical = 0, major = 0, minor = 0, info = 0;
      for (const i of layerIssues) {
        impact += i.score_impact || 0;
        if (i.severity === 'critical') critical++;
        else if (i.severity === 'major') major++;
        else if (i.severity === 'minor') minor++;
        else info++;
      }
      scores[layer.id] = {
        score: Math.max(0, 100 - impact * 3), // Scale impact for per-layer display
        total: layerIssues.length,
        critical, major, minor, info,
      };
    }
    return scores;
  }, [issuesByLayer]);

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const majorCount = issues.filter((i) => i.severity === 'major').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;
  const actionableCount = criticalCount + majorCount + minorCount;

  // --- Expand/Collapse All ---
  const allExpanded = filteredIssues.length > 0 && filteredIssues.every((i) => expandedIssues.has(i.id));
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIssues(new Set());
    } else {
      setExpandedIssues(new Set(filteredIssues.map((i) => i.id)));
    }
  };

  // --- Copy All Errors ---
  const copyErrors = () => {
    const errorIssues = issues.filter((i) => i.severity !== 'info');
    if (errorIssues.length === 0) return;
    const text = errorIssues.map((i, idx) => {
      const lines = [`${idx + 1}. [${i.severity.toUpperCase()}] ${i.finding}`];
      if (i.recommendation) lines.push(`   Fix: ${i.recommendation}`);
      return lines.join('\n');
    }).join('\n\n');
    navigator.clipboard.writeText(`Health Check Errors for ${result?.subject_ref}\nScore: ${result?.overall_score}/100\n${'='.repeat(50)}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Toggle Layer Collapse ---
  const toggleLayer = (layerId: string) => {
    setCollapsedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Platform
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Activity className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Website Health Check</h1>
                <p className="text-slate-400 text-sm">7-Layer AI-Orchestrated Analysis</p>
              </div>
            </div>
            {/* Submenu */}
            <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg border border-slate-700/50 p-1">
              <span className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600/20 border border-emerald-500/30 rounded-md">
                Health Check
              </span>
              <Link
                href="/healthcheck/best-practices"
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
              >
                <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Best Practices</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* URL Input Hero */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 rounded-2xl border border-emerald-500/20 p-8">
          <h2 className="text-xl font-bold text-white mb-2">Check Any Website</h2>
          <p className="text-slate-400 text-sm mb-6">
            5 modules across 7 infrastructure layers — orchestrated by an AI agent for cost-efficient analysis.
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
        {/* RESULTS                                                          */}
        {/* ================================================================ */}
        {result && (
          <>
            {/* Score Hero + Severity Distribution */}
            <div className={`bg-gradient-to-br ${scoreBg(result.overall_score)} rounded-2xl border border-slate-700/30 p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">
                    Results for {result.subject_ref}
                  </h2>
                  {result.subject_ref && (
                    <a href={result.subject_ref.startsWith('http') ? result.subject_ref : `https://${result.subject_ref}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0">
                      <ExternalLink className="w-3 h-3" /> Visit
                    </a>
                  )}
                </div>
                <button onClick={clearResults} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex-shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" /> New Check
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
                {/* Large Score Circle */}
                <div className="flex-shrink-0 text-center">
                  <div className={`w-28 h-28 rounded-full bg-slate-900/60 flex items-center justify-center ring-4 ${
                    result.overall_score === null ? 'ring-slate-700' :
                    result.overall_score >= 80 ? 'ring-green-500/30' :
                    result.overall_score >= 60 ? 'ring-amber-500/30' :
                    'ring-red-500/30'
                  }`}>
                    {result.overall_score !== null ? (
                      <span className={`text-4xl font-bold ${scoreColor(result.overall_score)}`}>{result.overall_score}</span>
                    ) : (
                      <Clock className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${scoreColor(result.overall_score)}`}>
                    {scoreLabel(result.overall_score)}
                  </p>
                </div>

                {/* Summary + Severity Bars */}
                <div className="min-w-0">
                  {result.overall_summary && (
                    <p className="text-slate-300 text-sm mb-3">{result.overall_summary}</p>
                  )}
                  {/* Severity Distribution Bar */}
                  <div className="mb-3">
                    <div className="flex h-3 rounded-full overflow-hidden bg-slate-800/80">
                      {criticalCount > 0 && <div className="bg-red-500" style={{ width: `${(criticalCount / Math.max(issues.length, 1)) * 100}%` }} />}
                      {majorCount > 0 && <div className="bg-orange-500" style={{ width: `${(majorCount / Math.max(issues.length, 1)) * 100}%` }} />}
                      {minorCount > 0 && <div className="bg-amber-500" style={{ width: `${(minorCount / Math.max(issues.length, 1)) * 100}%` }} />}
                      {infoCount > 0 && <div className="bg-blue-500/50" style={{ width: `${(infoCount / Math.max(issues.length, 1)) * 100}%` }} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    {criticalCount > 0 && <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" />{criticalCount} Critical</span>}
                    {majorCount > 0 && <span className="flex items-center gap-1 text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-500" />{majorCount} Major</span>}
                    {minorCount > 0 && <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" />{minorCount} Minor</span>}
                    {infoCount > 0 && <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-500/50" />{infoCount} Info</span>}
                    {issues.length === 0 && <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3 h-3" /> All passed</span>}
                  </div>
                </div>

                {/* Orchestration Stats */}
                {result.orchestration && (
                  <div className="bg-slate-900/40 rounded-xl border border-slate-700/30 p-3 text-xs space-y-1.5 min-w-[140px]">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1"><Cpu className="w-3 h-3" /> Orchestrator</div>
                    <div className="flex justify-between"><span className="text-slate-500">Modules:</span><span className="text-slate-300">{result.orchestration.modules_run}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Fetch:</span><span className="text-slate-300">{result.orchestration.fetch_time_ms}ms</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Cost:</span><span className="text-emerald-400">{result.orchestration.total_cost}/{result.orchestration.budget}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* 7-Layer Health Infographic */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">7-Layer Infrastructure Health</h2>
              </div>
              <div className="space-y-2.5">
                {LAYERS.map((layer) => {
                  const Icon = layer.icon;
                  const ls = layerScores[layer.id];
                  const hasIssues = ls && ls.total > 0;
                  const barWidth = ls ? Math.max(5, ls.score) : 100;
                  const barColorClass = ls
                    ? ls.score >= 80 ? 'bg-emerald-500' : ls.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    : 'bg-slate-600';

                  return (
                    <div key={layer.id} className="group">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <span className="text-[10px] text-slate-500 font-mono w-5">{layer.id}</span>
                          <Icon className={`w-4 h-4 ${layer.color} flex-shrink-0`} />
                          <span className="text-xs text-white font-medium truncate">{layer.name}</span>
                        </div>
                        {/* Health Bar */}
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-4 rounded-full bg-slate-700/50 overflow-hidden">
                            <div className={`h-full rounded-full ${barColorClass} transition-all duration-500`} style={{ width: `${barWidth}%` }} />
                          </div>
                          <span className={`text-xs font-mono w-8 text-right ${ls && ls.score >= 80 ? 'text-emerald-400' : ls && ls.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {ls ? ls.score : '—'}
                          </span>
                        </div>
                        {/* Severity Badges */}
                        <div className="flex items-center gap-1 min-w-[120px] justify-end">
                          {ls && ls.critical > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-full">{ls.critical}C</span>}
                          {ls && ls.major > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded-full">{ls.major}M</span>}
                          {ls && ls.minor > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-full">{ls.minor}m</span>}
                          {ls && ls.info > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full">{ls.info}i</span>}
                          {(!hasIssues) && <span className="text-[10px] text-slate-600">—</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(result.modules_invoked || []).map((mod, idx) => {
                const conf = moduleConfig[mod.module] || { icon: Globe, color: 'text-slate-400', label: mod.module };
                const Icon = conf.icon;
                const modIssues = issuesByModule[mod.module] || [];
                const modCritical = modIssues.filter((i) => i.severity === 'critical').length;
                const isActive = moduleFilter === mod.module;

                return (
                  <button
                    key={idx}
                    onClick={() => setModuleFilter(isActive ? null : mod.module)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      isActive ? 'bg-slate-700/50 border-slate-500' : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                      <span className="text-[11px] font-medium text-white truncate">{conf.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{modIssues.length} findings</span>
                      {modCritical > 0 && <span className="text-red-400">{modCritical}C</span>}
                      {mod.status === 'skipped' && <span className="text-amber-400">skipped</span>}
                    </div>
                    {isActive && <p className="text-[10px] text-emerald-400 mt-1">Filtered</p>}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons: Expand/Collapse All + Copy Errors */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {moduleFilter ? `${moduleConfig[moduleFilter]?.label || moduleFilter}` : 'All Findings'}
                </h2>
                <span className="text-xs text-slate-500">({filteredIssues.length} total, {actionableCount} actionable)</span>
                {moduleFilter && (
                  <button onClick={() => setModuleFilter(null)} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors ml-2">
                    Clear filter
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleExpandAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  {allExpanded ? <ChevronsUp className="w-3.5 h-3.5" /> : <ChevronsDown className="w-3.5 h-3.5" />}
                  {allExpanded ? 'Collapse All' : 'Expand All'}
                </button>
                <button
                  onClick={copyErrors}
                  disabled={actionableCount === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : `Copy Errors (${actionableCount})`}
                </button>
              </div>
            </div>

            {/* Issues Grouped by Layer */}
            {filteredIssues.length === 0 ? (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">{moduleFilter ? 'No issues in this module' : 'No issues found'}</p>
                <p className="text-slate-500 text-sm mt-1">All checks passed successfully</p>
              </div>
            ) : (
              <div className="space-y-4">
                {LAYERS.map((layer) => {
                  const layerIssues = (issuesByLayer[layer.id] || []).sort((a, b) => {
                    const sevOrder: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
                    return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
                  });
                  if (layerIssues.length === 0) return null;
                  const Icon = layer.icon;
                  const isCollapsed = collapsedLayers.has(layer.id);
                  const ls = layerScores[layer.id];

                  return (
                    <div key={layer.id} className="rounded-xl border border-slate-700/50 overflow-hidden">
                      {/* Layer Header */}
                      <button
                        onClick={() => toggleLayer(layer.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
                      >
                        <span className="text-[10px] text-slate-500 font-mono">{layer.id}</span>
                        <Icon className={`w-4 h-4 ${layer.color}`} />
                        <span className="text-sm font-semibold text-white flex-1">{layer.name}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">{layerIssues.length} findings</span>
                          {ls && ls.critical > 0 && <span className="text-red-400 font-medium">{ls.critical}C</span>}
                          {ls && ls.major > 0 && <span className="text-orange-400 font-medium">{ls.major}M</span>}
                        </div>
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
                      </button>

                      {/* Layer Issues */}
                      {!isCollapsed && (
                        <div className="divide-y divide-white/[0.03]">
                          {layerIssues.map((issue) => {
                            const sev = severityConfig[issue.severity] || severityConfig.info;
                            const SevIcon = sev.icon;
                            const expanded = expandedIssues.has(issue.id);

                            return (
                              <div key={issue.id} className={`${issue.severity !== 'info' ? 'bg-white/[0.01]' : ''}`}>
                                <button onClick={() => toggleIssue(issue.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
                                  <SevIcon className={`w-3.5 h-3.5 flex-shrink-0 ${sev.color}`} />
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sev.bg} ${sev.color}`}>{sev.label}</span>
                                  <p className="text-xs text-white flex-1 truncate">{issue.finding}</p>
                                  {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                                </button>

                                {expanded && (
                                  <div className="px-4 pb-4 ml-7 space-y-3 border-t border-white/[0.03]">
                                    <div className="pt-3">
                                      <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Finding</h4>
                                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{issue.finding}</p>
                                    </div>

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
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================================================================ */}
        {/* WHAT WE CHECK (shown only when no results)                       */}
        {/* ================================================================ */}
        {!result && !running && (
          <>
            {/* 7-Layer Architecture Overview */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">7-Layer AI-Orchestrated Architecture</h2>
              </div>
              <p className="text-slate-400 text-xs mb-5">Each URL is analyzed across 7 infrastructure layers. An orchestrating agent coordinates module execution for cost-efficient, comprehensive analysis.</p>
              <div className="space-y-2">
                {LAYERS.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <div key={layer.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                      <span className="text-[10px] font-mono text-slate-600 w-5">{layer.id}</span>
                      <Icon className={`w-4 h-4 ${layer.color}`} />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-white">{layer.name}</span>
                        <span className="text-[10px] text-slate-500 ml-2">{layer.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Cards */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">What We Check</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {moduleCards.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.title} className={`rounded-xl border p-4 ${mod.bg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${mod.color}`} />
                        <div>
                          <h3 className="text-xs font-bold text-white">{mod.title}</h3>
                          <p className="text-[10px] text-slate-500">{mod.subtitle}</p>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {mod.checks.map((check, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <CheckCircle2 className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
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
                { icon: Cpu, label: 'AI Orchestration', detail: 'Cost-efficient routing', color: 'text-emerald-400' },
                { icon: Shield, label: 'Security Scan', detail: 'XSS, leaks, headers', color: 'text-red-400' },
                { icon: Eye, label: 'WCAG 2.2', detail: 'Accessibility audit', color: 'text-cyan-400' },
                { icon: Brain, label: 'AI SEO', detail: 'E-E-A-T & content', color: 'text-purple-400' },
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
