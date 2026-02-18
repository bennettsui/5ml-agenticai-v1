'use client';

import Link from 'next/link';
import {
  Layers, ArrowRight, LayoutDashboard, Sparkles, TrendingUp, Brain,
  Monitor, Tv2, Rocket, Building2, ChevronRight,
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
  CSuite: Building2,
  Platform: Layers,
};

const LINE_BORDER: Record<SolutionLineKey, string> = {
  GrowthOS: 'border-l-purple-500',
  IntelStudio: 'border-l-teal-500',
  TechNexus: 'border-l-blue-500',
  ExpLab: 'border-l-indigo-500',
  MediaChannel: 'border-l-rose-500',
  FrontierVentures: 'border-l-amber-500',
  CSuite: 'border-l-emerald-500',
  Platform: 'border-l-slate-500',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const liveCount = USE_CASES.filter(u => u.status === 'live').length;
  const buildCount = USE_CASES.filter(u => u.status === 'in_progress').length;
  const totalAgents = USE_CASES.reduce((s, u) => s + (u.agentCount || 0), 0);

  // 7 product solution lines (exclude Platform)
  const solutionLineEntries = (Object.entries(SOLUTION_LINES) as [SolutionLineKey, typeof SOLUTION_LINES[SolutionLineKey]][]).filter(([k]) => k !== 'Platform');

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

        {/* SOLUTION LINES WITH USE CASE CARDS */}
        {solutionLineEntries.map(([key, line]) => {
          const cases = USE_CASES.filter(u => u.solutionLine === key);
          const Icon = LINE_ICONS[key] || Sparkles;

          return (
            <section key={key} className="mb-16">
              {/* Solution Line Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-lg ${line.darkBg}`}>
                  <Icon className={`w-6 h-6 ${line.textColor}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{line.name}</h2>
                  <p className="text-sm text-slate-500">{line.tagline}</p>
                </div>
              </div>

              {/* Use Cases Grid - Big Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cases.map((uc) => {
                  const sc = STATUS_CONFIG[uc.status];
                  return (
                    <Link
                      key={uc.id}
                      href={uc.path}
                      className={`group rounded-xl border-l-4 ${LINE_BORDER[uc.solutionLine] || 'border-l-slate-500'} border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] hover:border-slate-600 p-6 transition-all hover:shadow-lg`}
                    >
                      {/* Top row: status + agent count */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {sc.label}
                        </span>
                        {uc.agentCount && (
                          <span className="text-xs text-slate-500 font-medium">{uc.agentCount} agents</span>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">{uc.name}</h3>

                      {/* Description */}
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{uc.description}</p>

                      {/* Features as tags */}
                      {uc.features && uc.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {uc.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-white/[0.06] rounded text-slate-400">{f}</span>
                          ))}
                          {uc.features.length > 3 && (
                            <span className="text-xs text-slate-600 font-medium">+{uc.features.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Progress bar */}
                      {uc.progress > 0 && (
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-4">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500/70 to-cyan-400/40 transition-all"
                            style={{ width: `${uc.progress * 100}%` }}
                          />
                        </div>
                      )}

                      {/* Footer link */}
                      <div className="flex items-center text-sm text-slate-500 group-hover:text-blue-400 transition-colors font-medium">
                        Access Now <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* PLATFORM SECTION */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 rounded-lg ${SOLUTION_LINES.Platform.darkBg}`}>
              <Layers className={`w-6 h-6 ${SOLUTION_LINES.Platform.textColor}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{SOLUTION_LINES.Platform.name}</h2>
              <p className="text-sm text-slate-500">{SOLUTION_LINES.Platform.tagline}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USE_CASES.filter(u => u.solutionLine === 'Platform').map((uc) => {
              const sc = STATUS_CONFIG[uc.status];
              return (
                <Link
                  key={uc.id}
                  href={uc.path}
                  className="group rounded-xl border-l-4 border-l-slate-500 border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] hover:border-slate-600 p-6 transition-all hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {sc.label}
                    </span>
                    {uc.agentCount && (
                      <span className="text-xs text-slate-500 font-medium">{uc.agentCount} agents</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">{uc.name}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{uc.description}</p>
                  {uc.features && uc.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {uc.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-white/[0.06] rounded text-slate-400">{f}</span>
                      ))}
                    </div>
                  )}
                  {uc.progress > 0 && (
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-4">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500/70 to-cyan-400/40 transition-all" style={{ width: `${uc.progress * 100}%` }} />
                    </div>
                  )}
                  <div className="flex items-center text-sm text-slate-500 group-hover:text-blue-400 transition-colors font-medium">
                    Access Now <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* QUICK STATS */}
        <section className="mb-16">
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

        {/* SOCIAL CONTENT OPS HIGHLIGHT */}
        <section className="mb-16">
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400 mb-3">
                  <Sparkles className="w-3 h-3" /> Brand Management
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Social Content Operations</h3>
                <p className="text-slate-400 max-w-2xl">
                  AI-powered multi-brand social media strategy, content planning, and performance tracking. Complete brand onboarding, content calendar, and real-time analytics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Brand Setup', desc: 'Interactive onboarding wizard' },
                { label: 'Content Calendar', desc: 'AI-generated content plans' },
                { label: 'Performance Dashboard', desc: 'Real-time KPI tracking' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                  <div className="font-semibold text-white mb-1">{item.label}</div>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/brand-setup"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
            >
              Explore Social Ops <ArrowRight className="w-4 h-4" />
            </Link>
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
