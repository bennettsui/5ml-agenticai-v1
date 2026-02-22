'use client';

import Link from 'next/link';
import {
  Layers, ArrowRight, LayoutDashboard, Sparkles, TrendingUp, Brain,
  Monitor, Tv2, Rocket, Building2, ChevronRight, Briefcase,
} from 'lucide-react';
import {
  USE_CASES, SOLUTION_LINES, STATUS_CONFIG,
  type SolutionLineKey,
} from '@/lib/platform-config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LINE_ICONS: Record<SolutionLineKey, typeof TrendingUp> = {
  GrowthOS: TrendingUp,
  IntelStudio: Brain,
  TechNexus: Monitor,
  ExpLab: Sparkles,
  MediaChannel: Tv2,
  FrontierVentures: Rocket,
  GovProcurement: Briefcase,
  CSuite: Building2,
  Platform: Layers,
};

// Big gradient accents for each solution line (card top bar + section bg)
const LINE_GRADIENT: Record<SolutionLineKey, { card: string; glow: string; border: string }> = {
  GrowthOS:          { card: 'from-purple-600 to-pink-500',    glow: 'bg-purple-500/8',   border: 'border-purple-500/30' },
  IntelStudio:       { card: 'from-teal-600 to-cyan-500',     glow: 'bg-teal-500/8',     border: 'border-teal-500/30' },
  TechNexus:         { card: 'from-blue-600 to-sky-500',      glow: 'bg-blue-500/8',     border: 'border-blue-500/30' },
  ExpLab:            { card: 'from-indigo-600 to-violet-500',  glow: 'bg-indigo-500/8',   border: 'border-indigo-500/30' },
  MediaChannel:      { card: 'from-rose-600 to-pink-500',     glow: 'bg-rose-500/8',     border: 'border-rose-500/30' },
  FrontierVentures:  { card: 'from-amber-600 to-orange-500',  glow: 'bg-amber-500/8',    border: 'border-amber-500/30' },
  GovProcurement:    { card: 'from-indigo-600 to-cyan-500',    glow: 'bg-indigo-500/8',   border: 'border-indigo-500/30' },
  CSuite:            { card: 'from-emerald-600 to-green-500',  glow: 'bg-emerald-500/8',  border: 'border-emerald-500/30' },
  Platform:          { card: 'from-slate-600 to-slate-500',    glow: 'bg-slate-500/8',    border: 'border-slate-500/30' },
};

// Solution lines in user's priority order (a→h)
const PRIORITY_ORDER: SolutionLineKey[] = [
  'GrowthOS',          // a. Growth Hacking Studio
  'IntelStudio',       // b. ExcelIntel Studio
  'TechNexus',         // c. NexTech Studio
  'ExpLab',            // d. Agentic Experience Lab
  'MediaChannel',      // e. Media Channel
  'FrontierVentures',  // f. Frontier Ventures
  'GovProcurement',    // g. Government Procurement
  'CSuite',            // h. C-Suite Management
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const liveCount = USE_CASES.filter(u => u.status === 'live').length;
  const buildCount = USE_CASES.filter(u => u.status === 'in_progress').length;
  const totalAgents = USE_CASES.reduce((s, u) => s + (u.agentCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">

      {/* HEADER */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-bold text-white">5ML</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">● System Online</div>
            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 mb-4">
          <Sparkles className="w-3 h-3" /> Multi-Agent Operating System
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          AI-Powered Tools &amp; Workflows<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            for Every Business Function
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-2">
          {USE_CASES.length} use cases with {totalAgents}+ specialized agents · {liveCount} live, {buildCount} building
        </p>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">

        {/* SOLUTION LINES — 4 per row with big color cards */}
        {PRIORITY_ORDER.map((key) => {
          const line = SOLUTION_LINES[key];
          const cases = USE_CASES.filter(u => u.solutionLine === key);
          const Icon = LINE_ICONS[key];
          const grad = LINE_GRADIENT[key];

          return (
            <section key={key} className="mb-14">
              {/* Solution Line Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${grad.card} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{line.name}</h2>
                  <p className="text-xs text-slate-500">{line.tagline}</p>
                </div>
                <span className="text-xs text-slate-600">{cases.length} use cases</span>
              </div>

              {/* 4-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cases.map((uc) => {
                  const sc = STATUS_CONFIG[uc.status];
                  const isClickable = uc.path !== '#';

                  return (
                    <Link
                      key={uc.id}
                      href={isClickable ? uc.path : '#'}
                      className={`group relative rounded-xl border ${grad.border} bg-slate-800/60 hover:bg-white/[0.03] overflow-hidden transition-all hover:shadow-xl hover:shadow-black/20 ${!isClickable ? 'pointer-events-none' : ''}`}
                    >
                      {/* Big color top bar */}
                      <div className={`h-2 bg-gradient-to-r ${grad.card}`} />

                      <div className="p-4">
                        {/* Status + agents */}
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} font-medium`}>
                            <span className="w-1 h-1 rounded-full bg-current" />
                            {sc.label}
                          </span>
                          {uc.agentCount ? (
                            <span className="text-[10px] text-slate-600 font-medium">{uc.agentCount} agents</span>
                          ) : null}
                        </div>

                        {/* Name */}
                        <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                          {uc.name}
                        </h3>

                        {/* Description */}
                        <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{uc.description}</p>

                        {/* Feature tags */}
                        {uc.features && uc.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {uc.features.slice(0, 2).map((f, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/[0.05] rounded text-slate-500">{f}</span>
                            ))}
                            {uc.features.length > 2 && (
                              <span className="text-[10px] text-slate-600">+{uc.features.length - 2}</span>
                            )}
                          </div>
                        )}

                        {/* Progress bar */}
                        {uc.progress > 0 && (
                          <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mb-3">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${grad.card} opacity-70 transition-all`}
                              style={{ width: `${uc.progress * 100}%` }}
                            />
                          </div>
                        )}

                        {/* Footer */}
                        {isClickable && (
                          <div className="flex items-center text-[11px] text-slate-600 group-hover:text-blue-400 transition-colors font-medium">
                            Open <ChevronRight className="w-3 h-3 ml-0.5" />
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* PLATFORM & INFRASTRUCTURE */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${LINE_GRADIENT.Platform.card} shadow-lg`}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{SOLUTION_LINES.Platform.name}</h2>
              <p className="text-xs text-slate-500">{SOLUTION_LINES.Platform.tagline}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {USE_CASES.filter(u => u.solutionLine === 'Platform').map((uc) => {
              const sc = STATUS_CONFIG[uc.status];
              const grad = LINE_GRADIENT.Platform;
              return (
                <Link
                  key={uc.id}
                  href={uc.path}
                  className={`group relative rounded-xl border ${grad.border} bg-slate-800/60 hover:bg-white/[0.03] overflow-hidden transition-all hover:shadow-xl hover:shadow-black/20`}
                >
                  <div className={`h-2 bg-gradient-to-r ${grad.card}`} />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} font-medium`}>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {sc.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-400 transition-colors leading-snug">{uc.name}</h3>
                    <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{uc.description}</p>
                    {uc.features && uc.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {uc.features.slice(0, 2).map((f, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/[0.05] rounded text-slate-500">{f}</span>
                        ))}
                      </div>
                    )}
                    {uc.progress > 0 && (
                      <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mb-3">
                        <div className={`h-full rounded-full bg-gradient-to-r ${grad.card} opacity-70`} style={{ width: `${uc.progress * 100}%` }} />
                      </div>
                    )}
                    <div className="flex items-center text-[11px] text-slate-600 group-hover:text-blue-400 transition-colors font-medium">
                      Open <ChevronRight className="w-3 h-3 ml-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* QUICK STATS */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: `${totalAgents}+`, label: 'Agents', sub: 'Growth, Intel, CRM, Finance', accent: 'border-t-purple-500', color: 'text-purple-400' },
              { value: `${USE_CASES.length}`, label: 'Use Cases', sub: `${liveCount} live · ${buildCount} building`, accent: 'border-t-blue-500', color: 'text-blue-400' },
              { value: '5+', label: 'AI Models', sub: 'Claude, DeepSeek, Perplexity', accent: 'border-t-teal-500', color: 'text-teal-400' },
              { value: '7', label: 'Solution Lines', sub: 'All active & running', accent: 'border-t-emerald-500', color: 'text-emerald-400' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-slate-800/60 rounded-lg border border-slate-700/50 border-t-2 ${stat.accent} p-4 text-center`}>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-300 mt-1 font-medium">{stat.label}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-600">
          <p>5ML Agentic AI Platform · 7 Solution Lines · Powered by Claude, DeepSeek, and Perplexity · All 7 layers active</p>
        </div>
      </footer>

    </div>
  );
}
