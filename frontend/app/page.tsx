'use client';

import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  LayoutDashboard,
  GitBranch,
  Shield,
  Cpu,
  Server,
  Users,
  Database,
  FileText,
  Workflow,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Brain,
  Globe,
  ExternalLink,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import {
  USE_CASES,
  SOLUTION_LINES,
  ROADMAP_ITEMS,
  STATUS_CONFIG,
  SEVEN_LAYERS,
  type UseCaseConfig,
} from '@/lib/platform-config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusBadge = (status: UseCaseConfig['status']) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const liveCount = USE_CASES.filter(u => u.status === 'live').length;
  const buildCount = USE_CASES.filter(u => u.status === 'in_progress').length;
  const totalAgents = USE_CASES.reduce((s, u) => s + (u.agentCount || 0), 0);

  const solutionLineEntries = Object.values(SOLUTION_LINES).filter(s => s.id !== 'Platform');
  const useCasesByLine = (lineId: string) => USE_CASES.filter(u => u.solutionLine === lineId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">

      {/* ================================================================ */}
      {/* SECTION 1: HERO                                                  */}
      {/* ================================================================ */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-bold text-white">5ML</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">
              ● System Online
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
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
          Multi-agent OS for strategy, growth, ops and finance — already powering {USE_CASES.length} real use cases with {totalAgents}+ specialized agents.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="#solution-lines"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors"
          >
            View Product Lines <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Open Live Dashboard
          </Link>
        </div>
        <p className="text-xs text-slate-600 mt-3">Dashboard is the internal / power user view</p>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 pb-20">

        {/* ================================================================ */}
        {/* SECTION 2: SOLUTION LINES                                       */}
        {/* ================================================================ */}
        <section id="solution-lines">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Solution Lines</h2>
            <p className="text-slate-400">Four product families powered by the agentic platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {solutionLineEntries.map((line) => {
              const cases = useCasesByLine(line.id);
              const liveCases = cases.filter(c => c.status === 'live');
              const buildCases = cases.filter(c => c.status === 'in_progress');
              const plannedCases = cases.filter(c => c.status === 'planned' || c.status === 'prototype');

              return (
                <div
                  key={line.id}
                  className={`rounded-2xl border p-6 ${line.darkBg}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className={`w-5 h-5 ${line.textColor}`} />
                    <h3 className="text-lg font-bold text-white">{line.name}</h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{line.tagline}</p>

                  <div className="space-y-2">
                    {liveCases.length > 0 && (
                      <div>
                        <span className="text-[10px] text-green-400 uppercase tracking-wider font-medium">Live</span>
                        {liveCases.map(c => (
                          <Link key={c.id} href={c.path} className="flex items-center gap-2 py-1.5 text-sm text-white hover:text-blue-400 transition-colors group">
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
                            {c.name}
                            {c.agentCount && <span className="text-[10px] text-slate-500">{c.agentCount} agents</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                    {buildCases.length > 0 && (
                      <div>
                        <span className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">In Build</span>
                        {buildCases.map(c => (
                          <Link key={c.id} href={c.path} className="flex items-center gap-2 py-1.5 text-sm text-slate-300 hover:text-blue-400 transition-colors group">
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {plannedCases.length > 0 && (
                      <div>
                        <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">Planned</span>
                        {plannedCases.map(c => (
                          <div key={c.id} className="flex items-center gap-2 py-1.5 text-sm text-slate-500">
                            <ChevronRight className="w-3 h-3 text-slate-700" />
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 3: AGENTIC INFRASTRUCTURE & DASHBOARD                   */}
        {/* ================================================================ */}
        <section id="infrastructure">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Agentic Infrastructure Powering Everything</h2>
            <p className="text-slate-400">7-layer architecture, internal dashboard, and workflow engine</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Control Dashboard */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <LayoutDashboard className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">Control Dashboard</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Central view for system status, all use cases, agents, and tenants. Real-time monitoring and analytics.
              </p>
              <ul className="space-y-1.5 mb-5">
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {totalAgents}+ specialized agents</li>
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {USE_CASES.length} production use cases</li>
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Multi-tenant ready</li>
              </ul>
              <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                Open Dashboard <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 2: Workflow & Orchestration */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <GitBranch className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white">Workflow & Orchestration</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Agents are not standalone prompts — they are composed into multi-step workflows with stateful, event-driven execution.
              </p>
              <ul className="space-y-1.5 mb-5">
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-purple-500" /> Composable flows across domains</li>
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-purple-500" /> n8n-style visual orchestration</li>
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-purple-500" /> 6+ workflow pipelines</li>
              </ul>
              <Link href="/agentic-workflows" className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">
                View Workflows <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 3: 7-Layer Architecture & Governance */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white">7-Layer Architecture</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Infrastructure, execution engine, agents, knowledge, tasks, orchestration, and governance — all layers active.
              </p>
              <ul className="space-y-1.5 mb-5">
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Multi-model support (5+ providers)</li>
                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Central logging & monitoring</li>
                <li className="flex items-center gap-2 text-xs text-slate-400"><Clock className="w-3 h-3 text-amber-500" /> Role-based access (coming soon)</li>
              </ul>
              <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Architecture Tab <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* 7-Layer Mini Diagram */}
          <div className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Architecture Stack</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {SEVEN_LAYERS.map((layer) => {
                const colors = ['text-purple-400', 'text-indigo-400', 'text-blue-400', 'text-cyan-400', 'text-green-400', 'text-orange-400', 'text-red-400'];
                const bgColors = ['bg-purple-500/8', 'bg-indigo-500/8', 'bg-blue-500/8', 'bg-cyan-500/8', 'bg-green-500/8', 'bg-orange-500/8', 'bg-red-500/8'];
                const idx = 7 - layer.number;
                return (
                  <div key={layer.number} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${bgColors[idx]} border border-white/[0.03]`}>
                    <span className={`text-xs font-mono font-bold ${colors[idx]} w-5`}>L{layer.number}</span>
                    <span className="text-sm text-white font-medium flex-1">{layer.name}</span>
                    <span className="text-[10px] text-slate-500 hidden md:block">{layer.components.slice(0, 4).join(' · ')}</span>
                    <span className="text-[10px] text-green-500">Active</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 4: PLATFORM INFORMATION (stats)                         */}
        {/* ================================================================ */}
        <section id="platform-info">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5 text-center">
              <div className="text-3xl font-bold text-white">{totalAgents}+</div>
              <div className="text-xs text-slate-400 mt-1">Specialized Agents</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Marketing, Ads, Intelligence, Finance, Experience</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5 text-center">
              <div className="text-3xl font-bold text-white">5+</div>
              <div className="text-xs text-slate-400 mt-1">Model Providers</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Claude, DeepSeek, Perplexity, ComfyUI, OCR</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5 text-center">
              <div className="text-3xl font-bold text-white">{USE_CASES.length}</div>
              <div className="text-xs text-slate-400 mt-1">Use Cases</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{liveCount} live, {buildCount} in build</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5 text-center">
              <div className="text-3xl font-bold text-emerald-400">1</div>
              <div className="text-xs text-slate-400 mt-1">Unified Agentic OS</div>
              <div className="text-[10px] text-slate-600 mt-0.5">7 layers, fully active</div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 5: PUBLIC ROADMAP                                       */}
        {/* ================================================================ */}
        <section id="roadmap">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Public Roadmap</h2>
            <p className="text-slate-400">Building on the infrastructure to deliver new capabilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { key: 'now' as const, label: 'Now', sub: '0-3 months', accent: 'border-l-green-500', badgeBg: 'bg-green-500/10 text-green-400' },
              { key: 'next' as const, label: 'Next', sub: '3-9 months', accent: 'border-l-amber-500', badgeBg: 'bg-amber-500/10 text-amber-400' },
              { key: 'later' as const, label: 'Later', sub: '9-18 months', accent: 'border-l-blue-500', badgeBg: 'bg-blue-500/10 text-blue-400' },
            ].map((bucket) => {
              const items = ROADMAP_ITEMS.filter(r => r.timeframe === bucket.key).slice(0, 5);
              return (
                <div key={bucket.key} className={`rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 border-l-4 ${bucket.accent}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${bucket.badgeBg} font-medium`}>{bucket.label}</span>
                    <span className="text-[10px] text-slate-500">{bucket.sub}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <Zap className={`w-3 h-3 mt-0.5 flex-shrink-0 ${SOLUTION_LINES[item.solutionLine]?.textColor || 'text-slate-500'}`} />
                        <div>
                          <div className="text-sm text-white font-medium">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {SOLUTION_LINES[item.solutionLine]?.name || item.solutionLine}
                            {item.type === 'csuite' && ' · C-Suite'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6">
            <Link href="/dashboard/roadmap" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Open Full Roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 6: ALL USE CASES                                        */}
        {/* ================================================================ */}
        <section id="use-cases">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">All Use Cases</h2>
            <p className="text-slate-400">Every current and experimental use case — all entry points</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => {
              const line = SOLUTION_LINES[uc.solutionLine];
              return (
                <Link
                  key={uc.id}
                  href={uc.path}
                  className="group rounded-xl border border-slate-700/50 bg-slate-800/60 hover:border-slate-600 p-5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-medium ${line?.textColor || 'text-slate-500'}`}>
                      {line?.name || uc.solutionLine}
                    </span>
                    {statusBadge(uc.status)}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {uc.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {uc.description}
                  </p>
                  {uc.features && (
                    <div className="flex flex-wrap gap-1.5">
                      {uc.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/[0.03] rounded text-slate-500">{f}</span>
                      ))}
                      {uc.features.length > 3 && (
                        <span className="text-[10px] text-slate-600">+{uc.features.length - 3}</span>
                      )}
                    </div>
                  )}
                  {/* Progress bar */}
                  {uc.progress > 0 && uc.progress < 1 && (
                    <div className="mt-3 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${uc.progress * 100}%` }} />
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center text-xs text-slate-600">
            <p>5ML Agentic AI Platform v1.0 · Powered by Claude, DeepSeek, and Perplexity</p>
            <p className="mt-1">Deployed on Fly.io · 7-Layer Architecture · All layers active</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
