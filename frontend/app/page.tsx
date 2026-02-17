'use client';

import Link from 'next/link';
import {
  Layers, ArrowRight, LayoutDashboard, GitBranch, Shield,
  Sparkles, TrendingUp, Brain, DollarSign, Zap, ExternalLink,
} from 'lucide-react';
import {
  USE_CASES, SOLUTION_LINES, ROADMAP_ITEMS, STATUS_CONFIG, SEVEN_LAYERS,
} from '@/lib/platform-config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LINE_ICONS: Record<string, typeof TrendingUp> = {
  GrowthOS: TrendingUp,
  ExecIntel: Brain,
  OpsFinance: DollarSign,
  Experience: Sparkles,
};

const LAYER_COLORS = [
  // index 0 = L1 (bottom) → index 6 = L7 (top)
  { bar: 'from-violet-600/70 to-violet-500/40', text: 'text-violet-400', dot: 'bg-violet-400' },
  { bar: 'from-indigo-600/70 to-indigo-500/40', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  { bar: 'from-blue-600/70 to-blue-500/40', text: 'text-blue-400', dot: 'bg-blue-400' },
  { bar: 'from-cyan-600/70 to-cyan-500/40', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  { bar: 'from-emerald-600/70 to-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  { bar: 'from-amber-600/70 to-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-400' },
  { bar: 'from-rose-600/70 to-rose-500/40', text: 'text-rose-400', dot: 'bg-rose-400' },
];

const LINE_BORDER: Record<string, string> = {
  GrowthOS: 'border-l-purple-500',
  ExecIntel: 'border-l-teal-500',
  OpsFinance: 'border-l-blue-500',
  Experience: 'border-l-amber-500',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const liveCount = USE_CASES.filter(u => u.status === 'live').length;
  const buildCount = USE_CASES.filter(u => u.status === 'in_progress').length;
  const totalAgents = USE_CASES.reduce((s, u) => s + (u.agentCount || 0), 0);
  const solutionLineEntries = Object.entries(SOLUTION_LINES).filter(([k]) => k !== 'Platform');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">

      {/* NAV */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-bold text-white">5ML</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">● System Online</div>
            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* HERO                                                           */}
      {/* ============================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 mb-6">
          <Sparkles className="w-3 h-3" /> 7-Layer Agentic AI Infrastructure
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
          Build your own agentic AI team<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            on 5ML&apos;s 7-layer infrastructure.
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Multi-agent OS powering {USE_CASES.length} use cases with {totalAgents}+ specialized agents.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="#solution-lines" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors">
            View Product Lines <ArrowRight className="w-4 h-4" />
          </a>
          <Link href="/dashboard" className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Open Dashboard
          </Link>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16 pb-20">

        {/* ============================================================== */}
        {/* SOLUTION LINES — visual cards with count indicators            */}
        {/* ============================================================== */}
        <section id="solution-lines">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Solution Lines</h2>
          <p className="text-slate-500 text-center mb-8 text-sm">Four product families powered by the agentic platform</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {solutionLineEntries.map(([key, line]) => {
              const cases = USE_CASES.filter(u => u.solutionLine === key);
              const live = cases.filter(c => c.status === 'live').length;
              const building = cases.filter(c => c.status === 'in_progress').length;
              const planned = cases.filter(c => c.status === 'planned' || c.status === 'prototype').length;
              const agents = cases.reduce((s, c) => s + (c.agentCount || 0), 0);
              const Icon = LINE_ICONS[key] || Sparkles;

              return (
                <div key={key} className={`rounded-xl border-l-4 ${LINE_BORDER[key]} border border-slate-700/50 bg-slate-800/60 p-5`}>
                  {/* Header */}
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className={`p-1.5 rounded-lg ${line.darkBg}`}>
                      <Icon className={`w-4 h-4 ${line.textColor}`} />
                    </div>
                    <h3 className="text-base font-bold text-white">{line.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 ml-9">{line.tagline}</p>

                  {/* Visual status row */}
                  <div className="flex items-center gap-4 mb-3">
                    {live > 0 && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-green-400 font-medium">{live} Live</span>
                      </span>
                    )}
                    {building > 0 && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-amber-400 font-medium">{building} Building</span>
                      </span>
                    )}
                    {planned > 0 && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-blue-400 font-medium">{planned} Planned</span>
                      </span>
                    )}
                    {agents > 0 && (
                      <span className="text-[10px] text-slate-600 ml-auto">{agents} agents</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500/70 to-green-400/40 transition-all"
                      style={{ width: `${cases.length > 0 ? (live / cases.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 7-LAYER ARCHITECTURE — visual stack                            */}
        {/* ============================================================== */}
        <section id="infrastructure">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">7-Layer Agentic Infrastructure</h2>
          <p className="text-slate-500 text-center mb-8 text-sm">Every layer active and powering the platform</p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: LayoutDashboard, label: 'Control Dashboard', stat: 'Live', color: 'text-emerald-400', bg: 'bg-emerald-500/10', href: '/dashboard' },
              { icon: GitBranch, label: 'Workflow Engine', stat: '6 Pipelines', color: 'text-purple-400', bg: 'bg-purple-500/10', href: '/agentic-workflows' },
              { icon: Shield, label: 'Governance', stat: 'Multi-tenant', color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/dashboard' },
            ].map((card) => (
              <Link key={card.label} href={card.href} className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 hover:bg-white/[0.02] transition-colors group">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{card.label}</div>
                  <div className={`text-[10px] ${card.color} font-medium`}>{card.stat}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Layer stack */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-2">
            {SEVEN_LAYERS.map((layer) => {
              const colorIdx = layer.number - 1;
              const c = LAYER_COLORS[colorIdx];
              return (
                <div key={layer.number} className={`relative flex items-center gap-3 rounded-lg bg-gradient-to-r ${c.bar} px-4 py-3 border border-white/[0.04]`}>
                  <span className={`text-xs font-mono font-bold ${c.text} w-6 shrink-0`}>L{layer.number}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                  <span className="text-sm text-white font-medium">{layer.name}</span>
                  <div className="flex-1" />
                  <div className="hidden md:flex items-center gap-1.5">
                    {layer.components.slice(0, 4).map((comp, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">{comp}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-green-400 font-medium shrink-0 ml-2">Active</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* PLATFORM STATS                                                 */}
        {/* ============================================================== */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: `${totalAgents}+`, label: 'Agents', sub: 'Marketing, Ads, Intel, Finance', accent: 'border-t-purple-500', color: 'text-purple-400' },
              { value: '5+', label: 'Model Providers', sub: 'Claude, DeepSeek, Perplexity', accent: 'border-t-teal-500', color: 'text-teal-400' },
              { value: `${USE_CASES.length}`, label: 'Use Cases', sub: `${liveCount} live · ${buildCount} building`, accent: 'border-t-blue-500', color: 'text-blue-400' },
              { value: '1', label: 'Unified Agentic OS', sub: '7 layers, all active', accent: 'border-t-emerald-500', color: 'text-emerald-400' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-slate-800/60 rounded-xl border border-slate-700/50 border-t-2 ${stat.accent} p-5 text-center`}>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-300 mt-1 font-medium">{stat.label}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* ROADMAP                                                        */}
        {/* ============================================================== */}
        <section id="roadmap">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Public Roadmap</h2>
          <p className="text-slate-500 text-center mb-8 text-sm">What we&apos;re building, next, and later</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'now' as const, label: 'Now', sub: '0-3 months', color: 'border-l-green-500', dot: 'bg-green-400', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
              { key: 'next' as const, label: 'Next', sub: '3-9 months', color: 'border-l-amber-500', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { key: 'later' as const, label: 'Later', sub: '9-18 months', color: 'border-l-blue-500', dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            ].map((bucket) => {
              const items = ROADMAP_ITEMS.filter(r => r.timeframe === bucket.key).slice(0, 5);
              return (
                <div key={bucket.key} className={`rounded-xl border-l-4 ${bucket.color} border border-slate-700/50 bg-slate-800/60 p-5`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${bucket.badge}`}>{bucket.label}</span>
                    <span className="text-[10px] text-slate-600">{bucket.sub}</span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${bucket.dot} shrink-0`} />
                        <span className="text-sm text-white font-medium flex-1">{item.name}</span>
                        <span className={`text-[10px] ${SOLUTION_LINES[item.solutionLine]?.textColor || 'text-slate-500'}`}>
                          {SOLUTION_LINES[item.solutionLine]?.name?.replace(/ for Brands| Studio| & Finance| Lab| & Infrastructure/g, '') || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-5">
            <Link href="/dashboard/roadmap" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Open Full Roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ============================================================== */}
        {/* ALL USE CASES                                                  */}
        {/* ============================================================== */}
        <section id="use-cases">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">All Use Cases</h2>
          <p className="text-slate-500 text-center mb-8 text-sm">Complete directory of every product and tool</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {USE_CASES.map((uc) => {
              const line = SOLUTION_LINES[uc.solutionLine];
              const sc = STATUS_CONFIG[uc.status];
              return (
                <Link
                  key={uc.id}
                  href={uc.path}
                  className={`group rounded-lg border-l-4 ${LINE_BORDER[uc.solutionLine] || 'border-l-slate-500'} border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] p-4 transition-colors`}
                >
                  {/* Top row: line label + status */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-semibold ${line?.textColor || 'text-slate-500'}`}>
                      {line?.name?.replace(/ for Brands| Studio| & Finance| Lab| & Infrastructure/g, '') || uc.solutionLine}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {sc.label}
                    </span>
                  </div>
                  {/* Name */}
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{uc.name}</h3>
                  {/* Features as tags */}
                  {uc.features && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {uc.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] rounded text-slate-500">{f}</span>
                      ))}
                      {uc.features.length > 3 && <span className="text-[10px] text-slate-600">+{uc.features.length - 3}</span>}
                    </div>
                  )}
                  {/* Progress bar */}
                  {uc.progress > 0 && (
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500/60 to-cyan-400/40" style={{ width: `${uc.progress * 100}%` }} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-600">
          <p>5ML Agentic AI Platform · Powered by Claude, DeepSeek, and Perplexity · All 7 layers active</p>
        </div>
      </footer>
    </div>
  );
}
