'use client';

import { useState } from 'react';
import {
  Target, Brain, Mail, BarChart3, RefreshCw, TrendingUp,
  Users, Zap, ChevronDown, ChevronUp, Loader2, CheckCircle2,
  AlertCircle, Sparkles, DollarSign, ArrowRight, Clock,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Static agent definitions
// ─────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'lead-scoring',
    name: 'Lead Scoring Agent',
    icon: Target,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    model: 'DeepSeek Reasoner',
    cost: '$0.0002/lead',
    description: '2-pass scoring: instant rule-based firmographics (company size, industry, UTM source, challenges) + AI intent pass. Outputs 0–100 score, tier (hot/warm/cold), SLA hours, and recommended action.',
    trigger: 'POST /api/sme/leads/score',
    outputs: ['score (0–100)', 'tier: hot/warm/cold', 'SLA hours', 'recommended_action', 'AI reasoning'],
  },
  {
    id: 'lead-intelligence',
    name: 'Lead Intelligence Agent',
    icon: Brain,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    model: 'DeepSeek Reasoner',
    cost: '$0.0006/lead',
    description: 'Enriches leads using static HK SME market knowledge + AI. Outputs ROI estimate (hours saved/week, break-even months), deal complexity, competitor awareness, first-touch angle, and predicted close date.',
    trigger: 'POST /api/sme/leads/enrich',
    outputs: ['ROI estimate', 'deal complexity', 'first-touch angle', 'competitor awareness', 'predicted deal value HKD'],
  },
  {
    id: 'email-nurture',
    name: 'Email Nurture Agent',
    icon: Mail,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    model: 'DeepSeek Reasoner',
    cost: '$0.0010/sequence',
    description: 'Generates a personalised 5-email sequence (T+0, +1d, +3d, +5d, +7d) in a single DeepSeek call. Tailored by industry, pain points, and lead tier. Includes subject, preview text, body, and CTA per email.',
    trigger: 'POST /api/sme/leads/nurture-sequence',
    outputs: ['5 personalised emails', 'industry-specific workflows', 'tier-aware urgency', 'CTA per email'],
  },
  {
    id: 'demo-closer',
    name: 'Demo Closer Agent',
    icon: Users,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    model: 'DeepSeek Reasoner',
    cost: '$0.0010/asset',
    description: '4 demo lifecycle stages: pre-demo sales briefing + prospect welcome email; post-demo follow-up with objection handling; 2-email no-show recovery sequence; live objection handler with proof points and closing question.',
    trigger: 'POST /api/sme/demo/:stage',
    outputs: ['sales briefing (prep)', 'prospect email (prep)', 'follow-up email', 'no-show recovery x2', 'objection response'],
  },
  {
    id: 'campaign-analytics',
    name: 'Campaign Analytics Agent',
    icon: BarChart3,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    model: 'DeepSeek Reasoner',
    cost: '$0.0006/analysis',
    description: 'Aggregates UTM-tagged lead data into channel-level metrics. Computes CPL, hot/warm/cold distribution, and demo rates per source. AI generates 4–5 prioritised optimisation recommendations vs. HKD 150 CPL target.',
    trigger: 'POST /api/sme/analytics/campaigns',
    outputs: ['CPL by channel', 'lead quality ranking', 'funnel by source', 'AI recommendations', 'best/worst channel'],
  },
  {
    id: 'retargeting',
    name: 'Retargeting Strategist Agent',
    icon: RefreshCw,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    model: 'DeepSeek Reasoner',
    cost: '$0.0006/segment',
    description: 'Generates 3 ad copy variations per retargeting audience (social proof / urgency / curiosity). Covers 4 pixel segments: page visitors, form abandoners, leads without demo, and demo no-shows. Includes format recommendation and daily budget.',
    trigger: 'POST /api/sme/retargeting',
    outputs: ['4 audience definitions', '3 ad variations × 4 segments', 'pixel audience rules', 'format + budget recommendation'],
  },
  {
    id: 'cro-optimizer',
    name: 'Conversion Optimizer Agent',
    icon: TrendingUp,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    model: 'DeepSeek Reasoner',
    cost: '$0.0008/run',
    description: 'Stage-by-stage funnel drop-off analysis with on_target / below_target / critical status. AI generates 3 ranked A/B tests, 3 same-day quick wins, a form recommendation, and a copy recommendation.',
    trigger: 'POST /api/sme/cro/optimize  |  GET /api/sme/analytics/funnel',
    outputs: ['drop-off by stage', 'vs. KPI targets', '3 A/B tests', '3 quick wins', 'form + copy rec'],
  },
];

const FUNNEL_KPI = [
  { label: 'Form Completion Rate', target: '>15%', metric: 'visitors → leads' },
  { label: 'Cost Per Lead (CPL)', target: '<HKD 150', metric: 'spend / total leads' },
  { label: 'Lead-to-Demo Rate', target: '>25%', metric: 'leads → demo booked' },
  { label: 'Demo-to-Close Rate', target: '>30%', metric: 'demos → closed won' },
  { label: 'Customer CAC', target: '<HKD 2,000', metric: 'spend / closed won' },
];

const ENDPOINTS = [
  { method: 'POST', path: '/api/sme/leads/process', desc: 'Full new-lead orchestration: Score + Enrich (parallel) → Nurture', badge: 'orchestrator' },
  { method: 'POST', path: '/api/sme/leads/score', desc: 'Score individual lead (rule-based + AI)', badge: 'agent' },
  { method: 'POST', path: '/api/sme/leads/enrich', desc: 'Enrich lead with intelligence brief', badge: 'agent' },
  { method: 'POST', path: '/api/sme/leads/nurture-sequence', desc: 'Generate 5-email personalised sequence', badge: 'agent' },
  { method: 'POST', path: '/api/sme/demo/:stage', desc: 'Demo asset — prep / follow_up / no_show / objection', badge: 'agent' },
  { method: 'POST', path: '/api/sme/analytics/campaigns', desc: 'Campaign attribution + CPL by channel', badge: 'analytics' },
  { method: 'GET', path: '/api/sme/analytics/funnel', desc: 'Live funnel metrics from DB + CRO recommendations', badge: 'analytics' },
  { method: 'POST', path: '/api/sme/retargeting', desc: '4-segment retargeting strategy + 3 ad variations each', badge: 'agent' },
  { method: 'POST', path: '/api/sme/cro/optimize', desc: 'CRO recommendations from custom funnel numbers', badge: 'agent' },
  { method: 'POST', path: '/api/sme/campaign-review', desc: 'Weekly orchestration: Analytics + CRO (parallel) → Retargeting', badge: 'orchestrator' },
];

const BADGE_COLORS: Record<string, string> = {
  orchestrator: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  agent: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  analytics: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
};

const METHOD_COLOR: Record<string, string> = {
  POST: 'bg-emerald-500/20 text-emerald-300',
  GET: 'bg-blue-500/20 text-blue-300',
};

// ─────────────────────────────────────────────────────────
// Lead Demo Panel
// ─────────────────────────────────────────────────────────

const DEMO_LEAD = {
  contact_name: 'Alice Ng',
  company_name: 'Green Leaf Café Group',
  email: 'alice@greenleaf.hk',
  industry: 'fnb',
  company_size: '11-50',
  challenges: ['manual_processes', 'customer_follow_up', 'reporting'],
  utm_source: 'facebook',
  utm_medium: 'social',
  utm_campaign: 'sme_launch_jan2026',
  phone: '+852 9123 4567',
};

type DemoMode = 'score' | 'enrich' | 'nurture' | 'process';

function LeadDemoPanel() {
  const [mode, setMode] = useState<DemoMode>('score');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MODES: { id: DemoMode; label: string; path: string; desc: string }[] = [
    { id: 'score', label: 'Score Lead', path: '/api/sme/leads/score', desc: 'Returns 0–100 score + tier' },
    { id: 'enrich', label: 'Enrich Lead', path: '/api/sme/leads/enrich', desc: 'Returns ROI + first-touch angle' },
    { id: 'nurture', label: 'Nurture Sequence', path: '/api/sme/leads/nurture-sequence', desc: 'Returns 5-email sequence' },
    { id: 'process', label: 'Full Pipeline', path: '/api/sme/leads/process', desc: 'Score + Enrich + Nurture' },
  ];

  async function runDemo() {
    setLoading(true);
    setResult(null);
    setError(null);

    const selected = MODES.find(m => m.id === mode)!;
    const body = mode === 'nurture'
      ? { lead: DEMO_LEAD, tier: 'warm' }
      : DEMO_LEAD;

    try {
      const resp = await fetch(selected.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Live Agent Demo</h3>
        <span className="text-xs text-slate-500 ml-auto">Uses Green Leaf Café Group (F&B, 11-50 staff)</span>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null); setError(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              mode === m.id
                ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                : 'bg-white/[0.04] text-slate-400 border-slate-700/50 hover:bg-white/[0.06]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Demo lead preview */}
      <div className="rounded-lg bg-white/[0.02] border border-slate-700/50 p-3 mb-4 font-mono text-xs text-slate-400 overflow-x-auto">
        <div className="text-slate-500 mb-1">// sample lead payload</div>
        <pre>{JSON.stringify(DEMO_LEAD, null, 2)}</pre>
      </div>

      <button
        onClick={runDemo}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {loading ? 'Running...' : `Run ${MODES.find(m => m.id === mode)?.label}`}
      </button>

      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/40 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">Response received</span>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-slate-700/50 p-3 font-mono text-xs text-slate-300 overflow-x-auto max-h-80 overflow-y-auto">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Agent Card
// ─────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: typeof AGENTS[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = agent.icon;

  return (
    <div className={`rounded-xl border ${agent.bg} p-4 transition-all`}>
      <button
        className="w-full flex items-start gap-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`p-2 rounded-lg bg-white/[0.06] mt-0.5`}>
          <Icon className={`w-4 h-4 ${agent.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{agent.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">{agent.model}</span>
            <span className={`text-xs font-mono ${agent.color}`}>{agent.cost}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{agent.description}</p>
        </div>
        <div className="shrink-0 mt-1">
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1.5">Trigger</div>
            <code className="text-xs font-mono text-slate-300 bg-white/[0.04] px-2 py-1 rounded">
              {agent.trigger}
            </code>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1.5">Outputs</div>
            <div className="flex flex-wrap gap-1.5">
              {agent.outputs.map(o => (
                <span key={o} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                  {o}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export default function SmeGrowthEngine() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">SME Growth Engine</h2>
          <p className="text-sm text-slate-400 mt-1">
            7-agent lead generation & campaign system — scoring, nurturing, analytics, retargeting, CRO, and demo pipeline
          </p>
        </div>
        <div className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          In Progress — 70%
        </div>
      </div>

      {/* KPI targets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Growth KPI Targets</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {FUNNEL_KPI.map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-slate-700/50 bg-white/[0.03] p-3">
              <div className="text-base font-bold text-white mb-0.5">{kpi.target}</div>
              <div className="text-xs font-medium text-slate-300">{kpi.label}</div>
              <div className="text-xs text-slate-500 mt-1">{kpi.metric}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline architecture */}
      <div className="rounded-xl border border-slate-700/50 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Event-Driven Pipeline</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            {
              trigger: 'NEW_LEAD',
              color: 'border-purple-500/40 bg-purple-500/5',
              labelColor: 'text-purple-300',
              steps: [
                '① Lead form submitted',
                '② PARALLEL: Score + Enrich',
                '③ Generate nurture sequence',
                '④ Slack alert with brief',
              ],
              cost: '~$0.002/lead',
            },
            {
              trigger: 'DEMO_EVENT',
              color: 'border-emerald-500/40 bg-emerald-500/5',
              labelColor: 'text-emerald-300',
              steps: [
                'prep → Sales briefing + prospect email',
                'follow_up → Personalised follow-up',
                'no_show → 2-email recovery sequence',
                'objection → Response + closing Q',
              ],
              cost: '~$0.001/stage',
            },
            {
              trigger: 'CAMPAIGN_REVIEW (weekly)',
              color: 'border-blue-500/40 bg-blue-500/5',
              labelColor: 'text-blue-300',
              steps: [
                '① PARALLEL: Campaign Analytics + CRO',
                '② Retargeting strategy refresh',
                '③ Executive summary report',
                '④ 4-segment ad copy update',
              ],
              cost: '~$0.003/week',
            },
          ].map(p => (
            <div key={p.trigger} className={`rounded-lg border ${p.color} p-3`}>
              <div className={`font-mono font-bold text-xs mb-2 ${p.labelColor}`}>{p.trigger}</div>
              <ul className="space-y-1">
                {p.steps.map(s => (
                  <li key={s} className="flex items-start gap-1.5 text-slate-400">
                    <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-slate-600" />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-1 text-slate-500">
                <DollarSign className="w-3 h-3" />
                <span>{p.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Agents */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">7 Agents</h3>
          <span className="text-xs text-slate-500">— click any agent to expand</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AGENTS.map(agent => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      </div>

      {/* Live demo panel */}
      <LeadDemoPanel />

      {/* API endpoints */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">API Endpoints</h3>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-white/[0.02] divide-y divide-slate-700/40">
          {ENDPOINTS.map(ep => (
            <div key={ep.path} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLOR[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-xs font-mono text-slate-300 shrink-0">{ep.path}</code>
              <span className="text-xs text-slate-500 flex-1 min-w-0 truncate">{ep.desc}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${BADGE_COLORS[ep.badge]}`}>
                {ep.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost summary */}
      <div className="rounded-xl border border-slate-700/50 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Cost Model</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Per Lead Processed', value: '~$0.002', sub: 'score + enrich + nurture' },
            { label: 'Per Demo Asset', value: '~$0.001', sub: 'per stage generated' },
            { label: 'Weekly Review', value: '~$0.003', sub: 'analytics + CRO + retargeting' },
            { label: '50 Leads / Month', value: '~$0.16', sub: 'total estimated cost' },
          ].map(c => (
            <div key={c.label} className="rounded-lg bg-white/[0.03] border border-slate-700/50 p-3">
              <div className="text-lg font-bold text-emerald-400">{c.value}</div>
              <div className="text-xs font-medium text-slate-300 mt-0.5">{c.label}</div>
              <div className="text-xs text-slate-500">{c.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          All agents route to DeepSeek Reasoner ($0.14/$0.28 per 1M tokens). Scales linearly — 200 leads/month ≈ $0.45.
        </p>
      </div>

    </div>
  );
}
