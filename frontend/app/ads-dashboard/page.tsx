'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  BarChart3,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface KpiData {
  total_spend: string | null;
  total_conversions: string | null;
  total_revenue: string | null;
  blended_roas: string | null;
  total_impressions: string | null;
  total_clicks: string | null;
  avg_ctr: string | null;
  top_campaigns_by_roas: Array<{
    platform: string;
    campaign_name: string;
    roas: string;
    spend: string;
  }>;
}

interface AggregatedRow {
  date: string;
  spend: string;
  conversions: string;
  revenue: string;
  roas: string;
  impressions: string;
  clicks: string;
}

interface CampaignRow {
  platform: string;
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  clicks: string;
  spend: string;
  conversions: string;
  revenue: string;
  roas: string;
  avg_cpc: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function formatCurrency(val: string | number | null): string {
  if (val === null || val === undefined) return '$0.00';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(val: string | number | null): string {
  if (val === null || val === undefined) return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return num.toLocaleString('en-US');
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().split('T')[0];
  return { from, to };
}

export default function AdsDashboardPage() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [platform, setPlatform] = useState<'all' | 'meta' | 'google'>('all');
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [chartData, setChartData] = useState<AggregatedRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      from,
      to,
      platform,
      tenant_id: '5ml-internal',
    });

    try {
      const [kpiRes, aggRes, campRes] = await Promise.all([
        fetch(`${API_BASE}/api/ads/performance/kpis?${params}`),
        fetch(`${API_BASE}/api/ads/performance/aggregated?${params}`),
        fetch(`${API_BASE}/api/ads/performance/campaigns?${params}`),
      ]);

      if (kpiRes.ok) {
        const kpiJson = await kpiRes.json();
        setKpis(kpiJson.data);
      }
      if (aggRes.ok) {
        const aggJson = await aggRes.json();
        setChartData(aggJson.data || []);
      }
      if (campRes.ok) {
        const campJson = await campRes.json();
        setCampaigns(campJson.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [from, to, platform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lineChartData = chartData.map((row) => ({
    date: row.date,
    spend: parseFloat(row.spend) || 0,
    conversions: parseFloat(row.conversions) || 0,
    revenue: parseFloat(row.revenue) || 0,
  }));

  const barChartData = campaigns.slice(0, 15).map((c) => ({
    name: c.campaign_name.length > 25 ? c.campaign_name.slice(0, 22) + '...' : c.campaign_name,
    roas: parseFloat(c.roas) || 0,
    platform: c.platform,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Megaphone className="w-7 h-7 text-orange-500" />
                  Social Ad Performance
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Meta & Google Ads dashboard for 5ML internal accounts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/ads-dashboard/overview"
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Client Overview
              </Link>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">From:</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">To:</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform:</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'all' | 'meta' | 'google')}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Platforms</option>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Spend</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis ? formatCurrency(kpis.total_spend) : '--'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Conversions</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis ? formatNumber(kpis.total_conversions) : '--'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Blended ROAS</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis ? `${parseFloat(kpis.blended_roas || '0').toFixed(2)}x` : '--'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Top Campaign ROAS</span>
            </div>
            {kpis?.top_campaigns_by_roas?.[0] ? (
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {parseFloat(kpis.top_campaigns_by_roas[0].roas).toFixed(2)}x
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                  {kpis.top_campaigns_by_roas[0].campaign_name}
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-white">--</div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spend vs Conversions Line Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Spend vs Conversions by Day
            </h3>
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    name="Spend ($)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    name="Conversions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                {loading ? 'Loading...' : 'No data available for selected range'}
              </div>
            )}
          </div>

          {/* ROAS by Campaign Bar Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              ROAS by Campaign
            </h3>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}x`, 'ROAS']}
                  />
                  <Bar dataKey="roas" name="ROAS" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                {loading ? 'Loading...' : 'No campaign data available'}
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Campaigns Table */}
        {kpis?.top_campaigns_by_roas && kpis.top_campaigns_by_roas.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Top 3 Campaigns by ROAS
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Campaign</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Platform</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-400">ROAS</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.top_campaigns_by_roas.map((camp, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 dark:border-slate-700/50"
                    >
                      <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">#{idx + 1}</td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">{camp.campaign_name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            camp.platform === 'meta'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {camp.platform === 'meta' ? 'Meta' : 'Google'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white">
                        {parseFloat(camp.roas).toFixed(2)}x
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white">
                        {formatCurrency(camp.spend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Campaign Details Table */}
        {campaigns.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              All Campaigns ({campaigns.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Campaign</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Platform</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Impressions</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Clicks</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Spend</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Conv.</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Revenue</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">ROAS</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600 dark:text-slate-400">Avg CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((camp, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      <td className="py-2.5 px-3 text-slate-900 dark:text-white max-w-[200px] truncate">
                        {camp.campaign_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            camp.platform === 'meta'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {camp.platform === 'meta' ? 'Meta' : 'Google'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatNumber(camp.impressions)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatNumber(camp.clicks)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(camp.spend)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatNumber(camp.conversions)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(camp.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                        {parseFloat(camp.roas || '0').toFixed(2)}x
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(camp.avg_cpc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
