'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  BarChart3, AlertCircle, TrendingUp, DollarSign, Eye, MousePointer,
  Download, Loader2, Sparkles, Filter, ChevronDown, ChevronUp,
  Users, Play, Pause, Image, Video, FileText, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

interface CampaignData {
  id: string;
  brand: string;
  name: string;
  platform: string;
  objective: string;
  adFormat: string;
  status: 'Live' | 'Paused' | 'Completed';
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  views: number;
  cpv: number;
  conversions: number;
  roas: number;
  startDate: string;
  endDate: string;
}

/* ── Sample data (simulating ad account export) ── */

const AD_DATA: CampaignData[] = [
  {
    id: 'c1', brand: 'Meology HK', name: 'Spring Awareness – IG', platform: 'Meta',
    objective: 'Brand Awareness', adFormat: 'Video', status: 'Live',
    spend: 1200, impressions: 245000, reach: 168000, clicks: 4200,
    ctr: 1.71, cpm: 4.90, cpc: 0.29, views: 89000, cpv: 0.013,
    conversions: 42, roas: 2.8, startDate: '2026-02-15', endDate: '2026-03-15',
  },
  {
    id: 'c2', brand: 'Meology HK', name: 'Free Audit Offer – FB', platform: 'Meta',
    objective: 'Lead Generation', adFormat: 'Carousel', status: 'Live',
    spend: 820, impressions: 156000, reach: 112000, clicks: 2800,
    ctr: 1.79, cpm: 5.26, cpc: 0.29, views: 0, cpv: 0,
    conversions: 67, roas: 3.2, startDate: '2026-02-20', endDate: '2026-03-20',
  },
  {
    id: 'c3', brand: 'Meology HK', name: 'Retargeting Q1', platform: 'Meta',
    objective: 'Conversions', adFormat: 'Single Image', status: 'Live',
    spend: 500, impressions: 89000, reach: 45000, clicks: 1500,
    ctr: 1.69, cpm: 5.62, cpc: 0.33, views: 0, cpv: 0,
    conversions: 38, roas: 4.1, startDate: '2026-01-15', endDate: '2026-03-15',
  },
  {
    id: 'c4', brand: 'Meology HK', name: 'TikTok Test – Reel', platform: 'TikTok',
    objective: 'Brand Awareness', adFormat: 'Video', status: 'Paused',
    spend: 300, impressions: 43000, reach: 38000, clicks: 780,
    ctr: 1.81, cpm: 6.98, cpc: 0.38, views: 35000, cpv: 0.009,
    conversions: 8, roas: 1.9, startDate: '2026-02-01', endDate: '2026-02-28',
  },
  {
    id: 'c5', brand: 'Daikin HK', name: 'AC Spring Promo', platform: 'Meta',
    objective: 'Traffic', adFormat: 'Carousel', status: 'Completed',
    spend: 2100, impressions: 380000, reach: 260000, clicks: 6200,
    ctr: 1.63, cpm: 5.53, cpc: 0.34, views: 0, cpv: 0,
    conversions: 120, roas: 3.5, startDate: '2026-01-01', endDate: '2026-02-28',
  },
  {
    id: 'c6', brand: 'Daikin HK', name: 'Energy Efficiency Awareness', platform: 'Meta',
    objective: 'Brand Awareness', adFormat: 'Video', status: 'Live',
    spend: 950, impressions: 195000, reach: 142000, clicks: 3100,
    ctr: 1.59, cpm: 4.87, cpc: 0.31, views: 72000, cpv: 0.013,
    conversions: 28, roas: 2.4, startDate: '2026-02-10', endDate: '2026-03-10',
  },
];

const BRANDS = [...new Set(AD_DATA.map(d => d.brand))];

const STATUS_COLORS: Record<string, string> = {
  Live: 'bg-green-500/20 text-green-400',
  Paused: 'bg-blue-500/20 text-blue-400',
  Completed: 'bg-slate-700/50 text-slate-400',
};

/* ── Component ──────────────────────────── */

export default function AdPerformancePage() {
  const { selectedBrand } = useBrandProject();
  const [brandFilter, setBrandFilter] = useState<string | 'All'>('All');
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');

  const filtered = useMemo(() =>
    brandFilter === 'All' ? AD_DATA : AD_DATA.filter(d => d.brand === brandFilter),
  [brandFilter]);

  const totals = useMemo(() => ({
    spend: filtered.reduce((s, c) => s + c.spend, 0),
    impressions: filtered.reduce((s, c) => s + c.impressions, 0),
    reach: filtered.reduce((s, c) => s + c.reach, 0),
    clicks: filtered.reduce((s, c) => s + c.clicks, 0),
    views: filtered.reduce((s, c) => s + c.views, 0),
    conversions: filtered.reduce((s, c) => s + c.conversions, 0),
    avgCtr: filtered.length ? filtered.reduce((s, c) => s + c.ctr, 0) / filtered.length : 0,
    avgCpm: filtered.length ? filtered.reduce((s, c) => s + c.cpm, 0) / filtered.length : 0,
    avgCpc: filtered.length ? filtered.reduce((s, c) => s + c.cpc, 0) / filtered.length : 0,
    avgRoas: filtered.length ? filtered.reduce((s, c) => s + c.roas, 0) / filtered.length : 0,
  }), [filtered]);

  /* ── CSV Download ─────────────────────── */
  const handleDownload = useCallback(() => {
    const headers = ['Brand', 'Campaign', 'Platform', 'Objective', 'Format', 'Status', 'Spend', 'Impressions', 'Reach', 'Clicks', 'CTR%', 'CPM', 'CPC', 'Views', 'CPV', 'Conversions', 'ROAS', 'Start', 'End'];
    const rows = filtered.map(c => [
      c.brand, c.name, c.platform, c.objective, c.adFormat, c.status,
      c.spend, c.impressions, c.reach, c.clicks, c.ctr.toFixed(2),
      c.cpm.toFixed(2), c.cpc.toFixed(2), c.views, c.cpv.toFixed(3),
      c.conversions, c.roas.toFixed(1), c.startDate, c.endDate,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-performance-${brandFilter === 'All' ? 'all-brands' : brandFilter.replace(/\s/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, brandFilter]);

  /* ── AI Analysis ──────────────────────── */
  const handleAiAnalysis = useCallback(async () => {
    if (!selectedBrand) return;
    setAnalyzing(true);
    try {
      const summaryData = filtered.map(c => `${c.name}: $${c.spend} spend, ${c.impressions} impr, ${c.clicks} clicks, ${c.ctr.toFixed(2)}% CTR, $${c.cpm.toFixed(2)} CPM, ${c.roas.toFixed(1)}x ROAS`).join('\n');
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Analyze these ad performance results for "${selectedBrand.name}" and compare to HK industry benchmarks:

${summaryData}

Totals: $${totals.spend} total spend, ${totals.avgCtr.toFixed(2)}% avg CTR, $${totals.avgCpm.toFixed(2)} avg CPM, $${totals.avgCpc.toFixed(2)} avg CPC, ${totals.avgRoas.toFixed(1)}x avg ROAS

HK Social Ads Benchmarks: CPM $6-12, CPC $0.40-0.90, CTR 1.2-2.5%, ROAS 2-4x

Provide:
1. Overall Performance Score (vs HK benchmarks)
2. Best performing campaign and why
3. Underperforming areas
4. Budget reallocation recommendations
5. Creative/targeting optimization suggestions

Be concise and data-driven.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Ad Performance',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.message || '');
      }
    } catch { /* silent */ }
    setAnalyzing(false);
  }, [selectedBrand, filtered, totals]);

  const formatNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <h1 className="text-2xl font-bold text-white">Ad Performance</h1>
          </div>
          <p className="text-sm text-slate-400">
            Cross-brand ad results — download, compare, and optimize with AI insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!selectedBrand || analyzing}
            onClick={handleAiAnalysis}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Analyze
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs rounded-lg border border-rose-700/30 bg-rose-500/10 text-rose-400 hover:opacity-80 flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to view ad performance.</p>
        </div>
      )}

      {/* Brand Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3 h-3 text-slate-500" />
        <button
          onClick={() => setBrandFilter('All')}
          className={`px-2.5 py-1 text-[10px] rounded-full transition-colors ${brandFilter === 'All' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'}`}
        >
          All Brands ({AD_DATA.length})
        </button>
        {BRANDS.map(b => (
          <button
            key={b}
            onClick={() => setBrandFilter(brandFilter === b ? 'All' : b)}
            className={`px-2.5 py-1 text-[10px] rounded-full transition-colors ${brandFilter === b ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-white'}`}
          >
            {b} ({AD_DATA.filter(d => d.brand === b).length})
          </button>
        ))}
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Spend', value: `$${totals.spend.toLocaleString()}`, icon: DollarSign, color: 'text-cyan-400' },
          { label: 'Impressions', value: formatNum(totals.impressions), icon: Eye, color: 'text-blue-400' },
          { label: 'Clicks', value: formatNum(totals.clicks), icon: MousePointer, color: 'text-emerald-400' },
          { label: 'Avg ROAS', value: `${totals.avgRoas.toFixed(1)}x`, icon: TrendingUp, color: 'text-purple-400', highlight: totals.avgRoas >= 2.5 },
          { label: 'Conversions', value: totals.conversions.toString(), icon: ArrowUpRight, color: 'text-amber-400' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Avg Metrics Row */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg CPM', value: `$${totals.avgCpm.toFixed(2)}`, benchmark: '$6-12', ok: totals.avgCpm < 12 },
          { label: 'Avg CPC', value: `$${totals.avgCpc.toFixed(2)}`, benchmark: '$0.40-0.90', ok: totals.avgCpc < 0.9 },
          { label: 'Avg CTR', value: `${totals.avgCtr.toFixed(2)}%`, benchmark: '1.2-2.5%', ok: totals.avgCtr >= 1.2 },
          { label: 'Avg ROAS', value: `${totals.avgRoas.toFixed(1)}x`, benchmark: '2-4x', ok: totals.avgRoas >= 2 },
        ].map(m => (
          <div key={m.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <p className="text-[9px] text-slate-500 uppercase">{m.label}</p>
            <p className="text-sm font-bold text-white">{m.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[9px] ${m.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                {m.ok ? 'Within' : 'Above'} HK benchmark
              </span>
              <span className="text-[9px] text-slate-600">({m.benchmark})</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="bg-rose-900/10 border border-rose-700/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-semibold text-white">AI Performance Analysis</h2>
          </div>
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      {/* Campaign Table with full metrics */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Campaign Breakdown</h2>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                {['Brand', 'Campaign', 'Platform', 'Status', 'Spend', 'Impr.', 'Reach', 'Clicks', 'CTR', 'CPM', 'CPC', 'Views', 'CPV', 'Conv.', 'ROAS'].map(col => (
                  <th key={col} className="px-3 py-2.5 text-[10px] font-semibold uppercase text-slate-500 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 text-xs text-slate-400">{c.brand}</td>
                  <td className="px-3 py-2.5 text-xs text-white font-medium max-w-[180px] truncate">{c.name}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{c.platform}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-emerald-400 font-medium">${c.spend.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{formatNum(c.impressions)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{formatNum(c.reach)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{formatNum(c.clicks)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{c.ctr.toFixed(2)}%</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">${c.cpm.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">${c.cpc.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{c.views > 0 ? formatNum(c.views) : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{c.cpv > 0 ? `$${c.cpv.toFixed(3)}` : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-amber-400 font-medium">{c.conversions}</td>
                  <td className="px-3 py-2.5 text-xs text-purple-400 font-bold">{c.roas.toFixed(1)}x</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-white/[0.03] font-medium">
                <td className="px-3 py-2.5 text-xs text-white" colSpan={2}>Total / Average</td>
                <td className="px-3 py-2.5 text-xs text-slate-400" colSpan={2}>{filtered.length} campaigns</td>
                <td className="px-3 py-2.5 text-xs text-emerald-400 font-bold">${totals.spend.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-xs text-white">{formatNum(totals.impressions)}</td>
                <td className="px-3 py-2.5 text-xs text-white">{formatNum(totals.reach)}</td>
                <td className="px-3 py-2.5 text-xs text-white">{formatNum(totals.clicks)}</td>
                <td className="px-3 py-2.5 text-xs text-white">{totals.avgCtr.toFixed(2)}%</td>
                <td className="px-3 py-2.5 text-xs text-white">${totals.avgCpm.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-xs text-white">${totals.avgCpc.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-xs text-white">{formatNum(totals.views)}</td>
                <td className="px-3 py-2.5 text-xs text-slate-400">—</td>
                <td className="px-3 py-2.5 text-xs text-amber-400 font-bold">{totals.conversions}</td>
                <td className="px-3 py-2.5 text-xs text-purple-400 font-bold">{totals.avgRoas.toFixed(1)}x</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Data source note */}
      <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
          <h3 className="text-xs font-medium text-slate-400">Data Source</h3>
        </div>
        <p className="text-[10px] text-slate-500">
          Ad performance data is sourced from Meta Ads Manager and TikTok Business Center exports.
          Use &quot;Export CSV&quot; to download the current filtered view. Connect ad accounts via Media Buy module
          for automatic syncing. Results are separated by brand for cross-brand analysis.
        </p>
      </div>
    </div>
  );
}
