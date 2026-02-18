'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Layers,
  Users,
  Zap,
  Brain,
  Target,
  Shield,
  TrendingUp,
  Building2,
  Cpu,
  Network,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────

const SOLUTION_LINES = [
  {
    title: 'Enterprise / Big Corp',
    tag: 'Attack',
    description:
      'Listed companies, banks, property developers, large brands. Enterprise-grade agentic workflows and C-Suite intelligence at 10-20% below NDN/Fimmick pricing, with 3-7 day pilot deployment.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    icon: Building2,
  },
  {
    title: 'SME / Quick-win',
    tag: 'Defend',
    description:
      'HK/GBA/Mainland/SEA SMEs (clinics, insurance brokers, ecommerce). Pre-packaged agentic workflows at subscription price points with 3-day launch and clear ROI.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: Zap,
  },
];

const USE_CASE_GROUPS = [
  {
    label: 'Growth / Media',
    items: [
      'Social Media Team Agent — campaign research, brand config, 14-agent pipeline',
      'Ads Performance Intelligence — Meta + Google multi-tenant analysis, 8 agents',
      'Social reporting with visual monthly reports',
    ],
    icon: TrendingUp,
    color: 'text-pink-400',
  },
  {
    label: 'Exec & Intelligence',
    items: [
      'AI Executive Council / C-Suite — 5 AI executives (CEO, CMO, CFO, COO, CTO)',
      'Topic Intelligence — multi-topic news monitoring, daily scraping, weekly digests',
    ],
    icon: Brain,
    color: 'text-teal-400',
  },
  {
    label: 'Ops & Finance',
    items: [
      "Man's Accounting — receipt OCR, auto-categorisation, P&L tracking, HK compliance",
      'Internal finance automation — invoice tracking, client chasing',
    ],
    icon: Target,
    color: 'text-blue-400',
  },
  {
    label: 'Experience / Events',
    items: [
      'AI Photo Booth — 18th-century fashion portraits for live events, 9-agent pipeline',
      'Website Health Check — 7-layer AI-orchestrated SEO, security, WCAG audit',
      'Live Fictional Character — AI persona engine',
    ],
    icon: Globe,
    color: 'text-amber-400',
  },
  {
    label: 'Relationship Intelligence',
    items: [
      '18-agent Relationship Intelligence Platform with orchestrator, scoring, signal analysis',
      'Relationship Graph — brand evolution, team dynamics, personal preferences',
      'Signal Feed — real-time at-risk detection, positive signals, connection alerts',
    ],
    icon: Network,
    color: 'text-emerald-400',
  },
];

const SEVEN_LAYERS = [
  { n: 7, name: 'Governance & Compliance', desc: 'Tenant isolation, audit logging, access control, data retention' },
  { n: 6, name: 'Orchestration & Workflow', desc: 'Schedule registry, CSO Orchestrator, Scan Queue, WebSocket, Health Monitor' },
  { n: 5, name: 'Task Definitions', desc: 'DailySync, WeeklyAnalysis, MonthlyExecutive, NewsDiscovery, DigestWorkflow' },
  { n: 4, name: 'Knowledge Management', desc: 'pgvector, Notion Connector, Vector Embeddings, Semantic Search' },
  { n: 3, name: 'Roles & Agents', desc: '56+ agents across Growth Hacking (14+12), Photo Booth (9), Intel (3), CRM (18)' },
  { n: 2, name: 'Execution Engine', desc: 'DeepSeek, Claude API, Perplexity, ComfyUI, Model Router, Tesseract OCR' },
  { n: 1, name: 'Infrastructure & Storage', desc: 'PostgreSQL + pgvector, Express API, Fly.io, WebSocket, SSE Streaming' },
];

const MODEL_ROUTING = [
  { model: 'DeepSeek', cost: '$0.14 / $0.28 per 1M', role: 'Primary — most agent tasks', color: 'text-blue-400' },
  { model: 'Claude Haiku', cost: '$0.25 / $1.25 per 1M', role: 'Fallback — classification, extraction', color: 'text-purple-400' },
  { model: 'Perplexity Sonar', cost: '$3.00 / $15.00 per 1M', role: 'Research — web search tasks', color: 'text-teal-400' },
  { model: 'Claude Sonnet', cost: '$3.00 / $15.00 per 1M', role: 'Vision / complex strategy only', color: 'text-amber-400' },
];

const MARKETS = [
  { region: 'Hong Kong', status: 'Core' },
  { region: 'Greater Bay Area', status: 'Expansion' },
  { region: 'Mainland China', status: 'Via partners + alternative LLMs' },
  { region: 'Southeast Asia', status: 'Expansion' },
];

// ── Page ──────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Navigation */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Platform
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-6">
            <Cpu className="w-3.5 h-3.5" />
            Agentic AI Solutions Agency
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            5 Miles Lab <span className="text-emerald-400">(5ML)</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Hong Kong-based agentic AI solutions agency building workflow automation on our own
            7-layer Agentic OS infrastructure. We compete with agencies like NDN and Fimmick —
            not HR tech or generic AI tool vendors.
          </p>
        </section>

        {/* Solution Lines */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Solution Lines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOLUTION_LINES.map((line) => {
              const Icon = line.icon;
              return (
                <div key={line.title} className={'bg-slate-800/60 border rounded-xl p-6 ' + line.bg}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={'p-2 rounded-lg ' + line.bg}>
                      <Icon className={'w-5 h-5 ' + line.color} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{line.title}</h3>
                      <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + line.bg + ' ' + line.color}>
                        {line.tag}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{line.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Use Cases */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASE_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={'w-4 h-4 ' + group.color} />
                    <h3 className="text-sm font-semibold text-white">{group.label}</h3>
                  </div>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="text-xs text-slate-400 leading-relaxed pl-3 border-l-2 border-slate-700/50">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7-Layer Architecture */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            7-Layer Agentic Architecture
          </h2>
          <div className="space-y-2">
            {SEVEN_LAYERS.map((layer) => (
              <div key={layer.n} className="flex items-center gap-4 bg-slate-800/60 border border-slate-700/50 rounded-xl px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-purple-400">{layer.n}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{layer.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Model Routing */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-400" />
            Model Routing Strategy
          </h2>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Model</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Cost (in / out)</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_ROUTING.map((row) => (
                  <tr key={row.model} className="border-b border-slate-700/30 last:border-0">
                    <td className={'px-5 py-3 font-medium ' + row.color}>{row.model}</td>
                    <td className="px-5 py-3 text-slate-300 font-mono text-xs">{row.cost}</td>
                    <td className="px-5 py-3 text-slate-400">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Markets */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            Markets
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MARKETS.map((m) => (
              <div key={m.region} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-sm font-medium text-white mb-1">{m.region}</p>
                <p className="text-xs text-slate-400">{m.status}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing snapshot */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            Pricing Snapshot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/60 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Enterprise</h3>
              <p className="text-2xl font-bold text-white mb-1">~HK$500k <span className="text-sm font-normal text-slate-400">project fee</span></p>
              <p className="text-sm text-slate-400">Plus retainers at 10-20% below NDN/Fimmick. 3-7 day pilot deployment.</p>
            </div>
            <div className="bg-slate-800/60 border border-emerald-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">SME Subscription</h3>
              <p className="text-2xl font-bold text-white mb-1">HK$2k-5k <span className="text-sm font-normal text-slate-400">/month</span></p>
              <p className="text-sm text-slate-400">Pre-packaged agentic workflows with optional profit-sharing. 3-day launch.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center pb-8">
          <p className="text-sm text-slate-500">
            All use cases built on the same 7-layer Agentic OS infrastructure and re-use agents across pipelines.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Platform Dashboard
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/agentic-workflows" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Workflow Diagrams
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/use-cases/crm" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Relationship Intelligence
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
