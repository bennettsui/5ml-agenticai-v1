'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Target, Search, Calendar, Pencil, Sparkles,
  DollarSign, Users, BarChart3, AlertCircle,
  TrendingUp, Activity, Bot, Shield, ArrowRight,
  Brain, Database, Zap, Network, Clock, Eye,
  MousePointer, Loader2, Image, Video, FileText,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Dashboard Data ────────────────────── */

const KPI_CARDS = [
  { label: 'Scheduled Posts', value: '6', change: '+3 this week', icon: Calendar, color: 'text-emerald-400' },
  { label: 'Total Impressions', value: '533K', change: '+12% MoM', icon: Eye, color: 'text-blue-400' },
  { label: 'Total Clicks', value: '9.3K', change: '+8% MoM', icon: MousePointer, color: 'text-amber-400' },
  { label: 'Ad Spend (MTD)', value: '$2,820', change: '67% of budget', icon: DollarSign, color: 'text-cyan-400' },
];

const RECENT_POSTS = [
  { date: '2026-03-03', platform: 'IG', format: 'Reel', title: 'Why AI Agents Save 10x Time', pillar: 'Educate', status: 'Scheduled', adPlan: 'Boost candidate' },
  { date: '2026-03-05', platform: 'FB', format: 'Static', title: 'March Offer – Free Audit', pillar: 'Conversion', status: 'Draft', adPlan: 'Ad version' },
  { date: '2026-03-07', platform: 'IG', format: 'Carousel', title: 'Top 5 Social Trends 2026', pillar: 'Authority', status: 'Approved', adPlan: 'Organic only' },
  { date: '2026-03-10', platform: 'Both', format: 'Carousel', title: 'Case Study: 3x ROAS in 30 Days', pillar: 'Authority', status: 'Scheduled', adPlan: 'Boost candidate' },
  { date: '2026-03-12', platform: 'IG', format: 'Reel', title: 'Behind the Scenes: AI Pipeline', pillar: 'Showcase', status: 'Draft', adPlan: 'Organic only' },
  { date: '2026-03-14', platform: 'FB', format: 'Static', title: 'Team Spotlight: Creative Director', pillar: 'Community', status: 'In Review', adPlan: 'Organic only' },
];

const AD_CAMPAIGNS = [
  { name: 'Spring Awareness', platform: 'Meta', spend: '$1,200', impressions: '245K', clicks: '4.2K', ctr: '1.71%', roas: '2.8x', status: 'Live' },
  { name: 'Free Audit Offer', platform: 'Meta', spend: '$820', impressions: '156K', clicks: '2.8K', ctr: '1.79%', roas: '3.2x', status: 'Live' },
  { name: 'Retargeting Q1', platform: 'Meta', spend: '$500', impressions: '89K', clicks: '1.5K', ctr: '1.69%', roas: '4.1x', status: 'Live' },
  { name: 'TikTok Test', platform: 'TikTok', spend: '$300', impressions: '43K', clicks: '780', ctr: '1.81%', roas: '1.9x', status: 'Paused' },
];

const PIPELINE_STATUS = [
  { label: 'Draft', count: 2, color: 'bg-slate-700/50 text-slate-400' },
  { label: 'In Review', count: 1, color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Approved', count: 1, color: 'bg-emerald-500/20 text-emerald-400' },
  { label: 'Scheduled', count: 2, color: 'bg-purple-500/20 text-purple-400' },
  { label: 'Published', count: 0, color: 'bg-green-500/20 text-green-400' },
];

const FORMAT_ICONS: Record<string, typeof Image> = { Reel: Video, Static: Image, Carousel: FileText };

const PILLAR_COLORS: Record<string, string> = {
  Educate: 'bg-blue-500/20 text-blue-400',
  Authority: 'bg-purple-500/20 text-purple-400',
  Conversion: 'bg-amber-500/20 text-amber-400',
  Showcase: 'bg-emerald-500/20 text-emerald-400',
  Community: 'bg-pink-500/20 text-pink-400',
};

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-700/50 text-slate-400',
  'In Review': 'bg-amber-500/20 text-amber-400',
  Approved: 'bg-emerald-500/20 text-emerald-400',
  Scheduled: 'bg-purple-500/20 text-purple-400',
  Published: 'bg-green-500/20 text-green-400',
  Live: 'bg-green-500/20 text-green-400',
  Paused: 'bg-blue-500/20 text-blue-400',
};

const MODULES = [
  { name: 'Social Strategy', href: '/use-cases/social-content-ops/strategy', icon: Target, color: 'purple' },
  { name: 'Content Calendar', href: '/use-cases/social-content-ops/calendar', icon: Calendar, color: 'emerald' },
  { name: 'Content Dev', href: '/use-cases/social-content-ops/content-dev', icon: Pencil, color: 'amber' },
  { name: 'Interactive', href: '/use-cases/social-content-ops/interactive', icon: Sparkles, color: 'pink' },
  { name: 'Media Buy', href: '/use-cases/social-content-ops/media-buy', icon: DollarSign, color: 'cyan' },
  { name: 'Trend Research', href: '/use-cases/social-content-ops/trend-research', icon: TrendingUp, color: 'indigo' },
  { name: 'Monitoring', href: '/use-cases/social-content-ops/monitoring', icon: Activity, color: 'red' },
  { name: 'Community', href: '/use-cases/social-content-ops/community', icon: Users, color: 'orange' },
  { name: 'Ad Performance', href: '/use-cases/social-content-ops/ad-performance', icon: BarChart3, color: 'rose' },
  { name: 'Research', href: '/use-cases/social-content-ops/research', icon: Search, color: 'blue' },
];

const moduleColorMap: Record<string, string> = {
  purple: 'bg-purple-500/10 text-purple-400 border-purple-700/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-700/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-700/30',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-700/30',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-700/30',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-700/30',
  red: 'bg-red-500/10 text-red-400 border-red-700/30',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-700/30',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-700/30',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-700/30',
};

/* ── 7-Layer Agentic Architecture ──────── */
const AGENT_LAYERS = [
  { layer: 1, name: 'Orchestrator', icon: Network, color: 'text-purple-400' },
  { layer: 2, name: 'Strategy', icon: Target, color: 'text-blue-400' },
  { layer: 3, name: 'Content', icon: Pencil, color: 'text-amber-400' },
  { layer: 4, name: 'Distribution', icon: Zap, color: 'text-emerald-400' },
  { layer: 5, name: 'Community', icon: Users, color: 'text-orange-400' },
  { layer: 6, name: 'Analytics', icon: BarChart3, color: 'text-rose-400' },
  { layer: 7, name: 'Knowledge', icon: Database, color: 'text-indigo-400' },
];

/* ── Component ──────────────────────────── */

export default function SocialContentOpsPage() {
  const { selectedBrand } = useBrandProject();
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleAiSummary = useCallback(async () => {
    if (!selectedBrand) return;
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `As Social Media Director for "${selectedBrand.name}", provide a concise executive summary of our social content operations:

1. **Progress**: What's been built and what's working
2. **LLM Model Performance**: How AI agents are performing (content quality, speed, cost)
3. **Key Metrics**: Engagement trends, content pipeline status, ad performance
4. **What to Improve**: Top 3 priorities for next sprint
5. **Recommendations**: Immediate action items

Keep it under 200 words. Be specific and data-driven.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Overview',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.message || '');
      }
    } catch { /* silent */ }
    setLoadingSummary(false);
  }, [selectedBrand]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Content Ops</h1>
          <p className="text-sm text-slate-400 mt-1">
            Dashboard — content pipeline, ads performance, and AI operations overview
          </p>
        </div>
        <button
          disabled={!selectedBrand || loadingSummary}
          onClick={handleAiSummary}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          {loadingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Progress Summary
        </button>
      </div>

      {/* Brand context bar */}
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
            <p className="text-[10px] text-slate-400">Active Brand</p>
            <p className="text-sm font-semibold text-white">{selectedBrand.name}</p>
          </div>
        </div>
      )}

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI_CARDS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[10px] text-slate-500">{kpi.change}</span>
              </div>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* AI Progress Summary */}
      {aiSummary && (
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-700/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-semibold text-white">AI Director Summary</h2>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">Sarah</span>
          </div>
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Approval Pipeline Status */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content Pipeline Status</h2>
        </div>
        <div className="flex items-center gap-2">
          {PIPELINE_STATUS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium ${s.color}`}>
                {s.label}
                <span className="px-1.5 py-0.5 bg-white/10 rounded text-[9px]">{s.count}</span>
              </div>
              {i < PIPELINE_STATUS.length - 1 && <ArrowRight className="w-3 h-3 text-slate-700 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Latest Calendar Posts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest Calendar Posts</h2>
          <Link href="/use-cases/social-content-ops/calendar" className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1">
            View All <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                {['Date', 'Platform', 'Format', 'Post Title', 'Pillar', 'Ad Plan', 'Status'].map(col => (
                  <th key={col} className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_POSTS.map(post => {
                const FormatIcon = FORMAT_ICONS[post.format] || Image;
                return (
                  <tr key={post.date + post.title} className="border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-xs text-white font-mono">{post.date}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-300">{post.platform}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <FormatIcon className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-300">{post.format}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-white font-medium max-w-[200px] truncate">{post.title}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PILLAR_COLORS[post.pillar] || ''}`}>{post.pillar}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-500">{post.adPlan}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[post.status] || ''}`}>{post.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ads Performance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ads Performance</h2>
          <Link href="/use-cases/social-content-ops/ad-performance" className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1">
            View All <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                {['Campaign', 'Platform', 'Spend', 'Impressions', 'Clicks', 'CTR', 'ROAS', 'Status'].map(col => (
                  <th key={col} className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AD_CAMPAIGNS.map(c => (
                <tr key={c.name} className="border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-xs text-white font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{c.platform}</td>
                  <td className="px-4 py-2.5 text-xs text-emerald-400 font-medium">{c.spend}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">{c.impressions}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">{c.clicks}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{c.ctr}</td>
                  <td className="px-4 py-2.5 text-xs text-amber-400 font-medium">{c.roas}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Director Card + 7-Layer Architecture (compact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Director */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-700/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white mb-1">Sarah — Social Director</h2>
              <p className="text-[10px] text-slate-400 mb-2">
                AI-powered Creative Director with 12+ years of expertise. Provides guidance, evaluation, and content assistance across all modules.
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {['Strategy', 'Copy', 'Review', 'Media Buy', 'Forms'].map(cap => (
                  <span key={cap} className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-700/20">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 7-Layer Architecture (compact horizontal) */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-semibold text-white">7-Layer Agentic Architecture</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AGENT_LAYERS.map(agent => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.layer}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] border border-slate-700/30 rounded-lg"
                >
                  <span className={`text-[9px] font-mono font-bold ${agent.color}`}>L{agent.layer}</span>
                  <Icon className={`w-3 h-3 ${agent.color}`} />
                  <span className="text-[10px] text-slate-400">{agent.name}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            L1 orchestrates all agents. L7 knowledge layer is shared across modules.
          </p>
        </div>
      </div>

      {/* Module Quick Access */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {MODULES.map(mod => {
            const Icon = mod.icon;
            const colors = moduleColorMap[mod.color] || moduleColorMap.purple;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`group flex items-center gap-2.5 px-3 py-2.5 ${colors} border rounded-xl hover:scale-[1.02] transition-all`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">{mod.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto flex-shrink-0" title="Live" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Human Review & Approval Process */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
