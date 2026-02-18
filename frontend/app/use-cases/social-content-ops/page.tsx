'use client';

import Link from 'next/link';
import {
  Target, Search, Calendar, Pencil, Sparkles,
  DollarSign, Users, BarChart3, AlertCircle,
  TrendingUp, Activity, Bot, Shield, ArrowRight,
  Brain, Database, Zap, Network,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const MODULES = [
  {
    category: 'Planning & Analysis',
    items: [
      { name: 'Social Strategy', desc: 'Define social media strategy, goals, and KPIs', icon: Target, href: '/use-cases/social-content-ops/strategy', freq: 'Annually / One-off', color: 'purple' },
      { name: 'Brand & Competitive Research', desc: 'Monitor competitors, industry trends, and brand positioning', icon: Search, href: '/use-cases/social-content-ops/research', freq: 'Ongoing', color: 'blue' },
    ],
  },
  {
    category: 'Content Development',
    items: [
      { name: 'Content Calendar', desc: 'Plan, schedule, and manage content publishing across platforms', icon: Calendar, href: '/use-cases/social-content-ops/calendar', freq: 'Monthly', color: 'emerald' },
      { name: 'Content Development', desc: 'Full content cards with review/approval workflow and scheduling', icon: Pencil, href: '/use-cases/social-content-ops/content-dev', freq: 'Ongoing', color: 'amber' },
      { name: 'Interactive Content', desc: 'Plan interactive experiences: polls, quizzes, AR filters, stories', icon: Sparkles, href: '/use-cases/social-content-ops/interactive', freq: 'Campaign-based', color: 'pink' },
      { name: 'Media Buy', desc: 'Plan, approve, schedule, and deliver paid media across platforms', icon: DollarSign, href: '/use-cases/social-content-ops/media-buy', freq: 'Campaign-based', color: 'cyan' },
    ],
  },
  {
    category: 'Intelligence',
    items: [
      { name: 'Trend Research', desc: 'Shared knowledge base: format specs, platform SEO, trending topics', icon: TrendingUp, href: '/use-cases/social-content-ops/trend-research', freq: 'Real-time', color: 'indigo' },
      { name: 'Social Monitoring', desc: 'Spike detection, sentiment analysis, and instant alert notifications', icon: Activity, href: '/use-cases/social-content-ops/monitoring', freq: 'Real-time', color: 'red' },
    ],
  },
  {
    category: 'Management',
    items: [
      { name: 'Community Management', desc: 'Daily engagement, response management, sentiment tracking', icon: Users, href: '/use-cases/social-content-ops/community', freq: 'Daily', color: 'orange' },
      { name: 'Ad Performance', desc: 'Track and analyze social ad campaigns, ROAS, and optimization', icon: BarChart3, href: '/use-cases/social-content-ops/ad-performance', freq: 'Monthly', color: 'rose' },
    ],
  },
];

const colorMap: Record<string, string> = {
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-700/30 text-purple-400',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-700/30 text-blue-400',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-700/30 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-700/30 text-amber-400',
  pink: 'from-pink-500/20 to-pink-500/5 border-pink-700/30 text-pink-400',
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-700/30 text-cyan-400',
  orange: 'from-orange-500/20 to-orange-500/5 border-orange-700/30 text-orange-400',
  rose: 'from-rose-500/20 to-rose-500/5 border-rose-700/30 text-rose-400',
  indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-700/30 text-indigo-400',
  red: 'from-red-500/20 to-red-500/5 border-red-700/30 text-red-400',
};

/* ── 7-Layer Agentic Architecture ──────── */
const AGENT_LAYERS = [
  { layer: 1, name: 'Orchestrating Agent', desc: 'Master coordinator — routes tasks, manages workflow state, enforces approval gates', icon: Network, color: 'purple' },
  { layer: 2, name: 'Strategy Agent', desc: 'Develops social strategy, SWOT analysis, platform mix, KPI targets', icon: Target, color: 'blue' },
  { layer: 3, name: 'Content Agent', desc: 'Generates content cards, copy, scripts, visual briefs per format + platform', icon: Pencil, color: 'amber' },
  { layer: 4, name: 'Distribution Agent', desc: 'Manages scheduling, publishing, cross-platform delivery via Meta API', icon: Zap, color: 'emerald' },
  { layer: 5, name: 'Community Agent', desc: 'Monitors engagement, drafts responses, escalates sentiment spikes', icon: Users, color: 'orange' },
  { layer: 6, name: 'Analytics Agent', desc: 'Tracks performance, identifies optimization opportunities, reports ROAS', icon: BarChart3, color: 'rose' },
  { layer: 7, name: 'Knowledge Layer', desc: 'Shared trend database — format best practices, SEO signals, platform specs', icon: Database, color: 'indigo' },
];

const agentColorMap: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-700/30' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-700/30' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-700/30' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-700/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-700/30' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-700/30' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-700/30' },
};

export default function SocialContentOpsPage() {
  const { selectedBrand, selectedProject } = useBrandProject();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Social Content Ops</h1>
        <p className="text-sm text-slate-400 mt-1">
          End-to-end social content operations with AI director, human approval workflow, and shared knowledge base
        </p>
      </div>

      {/* Brand/Project context bar */}
      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            Select a brand from the sidebar to connect all modules to a single brand profile.
          </p>
        </div>
      )}

      {selectedBrand && (
        <div className="flex items-center gap-4 px-4 py-3 bg-purple-900/15 border border-purple-700/20 rounded-xl">
          <div>
            <p className="text-xs text-slate-400">Active Brand</p>
            <p className="text-sm font-semibold text-white">{selectedBrand.name}</p>
          </div>
          {selectedProject && (
            <>
              <div className="w-px h-8 bg-slate-700/50" />
              <div>
                <p className="text-xs text-slate-400">Active Project</p>
                <p className="text-sm font-semibold text-white">{selectedProject.name}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── AI Director Card ──────────────── */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-700/20 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Bot className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white mb-1">Sarah — Social Media Director & Creative Director</h2>
            <p className="text-xs text-slate-400 mb-3">
              Your AI-powered Social Studio director with 12+ years of expertise in social media strategy, content creation, and campaign optimization across HK, APAC, and global markets. She provides guidance, evaluation, and constructive criticism across all modules — and can help fill in forms.
            </p>
            <div className="flex gap-2 flex-wrap">
              {['Strategy Review', 'Content Critique', 'Copy Assistance', 'Media Buy Optimization', 'Trend Analysis', 'Form Filling'].map(cap => (
                <span key={cap} className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-700/20">
                  {cap}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-slate-500">Open via chat panel</p>
            <ArrowRight className="w-4 h-4 text-purple-400 mt-1 ml-auto" />
          </div>
        </div>
      </div>

      {/* ── Human Review & Approval Process ─ */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Human Review & Approval Workflow</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Content Pipeline */}
          <div>
            <p className="text-[10px] uppercase text-slate-500 font-semibold mb-2">Content Pipeline</p>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { label: 'Draft', color: 'bg-slate-700/50 text-slate-400' },
                { label: 'Submitted', color: 'bg-blue-500/20 text-blue-400' },
                { label: 'In Review', color: 'bg-amber-500/20 text-amber-400' },
                { label: 'Changes Req.', color: 'bg-red-500/20 text-red-400' },
                { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-400' },
                { label: 'Scheduled', color: 'bg-purple-500/20 text-purple-400' },
                { label: 'Published', color: 'bg-green-500/20 text-green-400' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${step.color}`}>{step.label}</span>
                  {i < 6 && <ArrowRight className="w-2.5 h-2.5 text-slate-700 mx-0.5" />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5">AI generates content → human reviews → approved → scheduled for publish</p>
          </div>
          {/* Media Buy Pipeline */}
          <div>
            <p className="text-[10px] uppercase text-slate-500 font-semibold mb-2">Media Buy Pipeline</p>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { label: 'Draft', color: 'bg-slate-700/50 text-slate-400' },
                { label: 'Pending', color: 'bg-amber-500/20 text-amber-400' },
                { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-400' },
                { label: 'Scheduled', color: 'bg-purple-500/20 text-purple-400' },
                { label: 'Live', color: 'bg-green-500/20 text-green-400' },
                { label: 'Paused', color: 'bg-blue-500/20 text-blue-400' },
                { label: 'Completed', color: 'bg-slate-600/50 text-slate-400' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${step.color}`}>{step.label}</span>
                  {i < 6 && <ArrowRight className="w-2.5 h-2.5 text-slate-700 mx-0.5" />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5">AI generates campaigns → human approves → scheduled → pushed to Meta</p>
          </div>
        </div>
      </div>

      {/* ── 7-Layer Agentic Architecture ───── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">7-Layer Agentic Architecture</h2>
          <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">AI-Powered Pipeline</span>
        </div>
        <div className="space-y-2">
          {AGENT_LAYERS.map((agent) => {
            const colors = agentColorMap[agent.color] || agentColorMap.purple;
            const Icon = agent.icon;
            return (
              <div key={agent.layer} className={`flex items-center gap-4 px-4 py-3 ${colors.bg} border ${colors.border} rounded-xl`}>
                <div className="flex items-center gap-2 w-8">
                  <span className={`text-xs font-mono font-bold ${colors.text}`}>L{agent.layer}</span>
                </div>
                <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-white">{agent.name}</h3>
                  <p className="text-[10px] text-slate-400">{agent.desc}</p>
                </div>
                {agent.layer === 1 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">Master</span>
                )}
                {agent.layer === 7 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full">Shared</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-600 mt-2 px-1">
          Each use case employs the orchestrating agent (L1) which coordinates specialist agents. The knowledge layer (L7) is shared across all modules — format specs, SEO signals, and trend data are checked at every step.
        </p>
      </div>

      {/* Modules grid by category */}
      {MODULES.map(section => (
        <div key={section.category}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            {section.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map(item => {
              const Icon = item.icon;
              const colors = colorMap[item.color] || colorMap.purple;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group bg-gradient-to-br ${colors} border rounded-xl p-5 hover:scale-[1.01] transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/[0.06] rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white group-hover:text-white/90">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-white/[0.06] rounded-full text-slate-400">
                        {item.freq}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
