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
  ChevronDown,
  ChevronUp,
  Link2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
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

interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  business_name?: string;
}

interface SyncResult {
  accountId: string;
  status: 'syncing' | 'success' | 'error';
  message?: string;
  fetched?: number;
  upserted?: number;
}

const ACCOUNT_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  2: { label: 'Disabled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  3: { label: 'Unsettled', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  7: { label: 'Pending Risk Review', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  8: { label: 'Pending Settlement', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  9: { label: 'In Grace Period', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  100: { label: 'Pending Closure', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  101: { label: 'Closed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  201: { label: 'Any Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  202: { label: 'Any Closed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
};

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

  // Ad Account Discovery state
  const [accountsPanelOpen, setAccountsPanelOpen] = useState(false);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [syncDateFrom, setSyncDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [syncDateTo, setSyncDateTo] = useState(() => new Date().toISOString().split('T')[0]);

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

  // Ad Account Discovery functions
  const fetchAdAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ads/meta/adaccounts`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `Failed to fetch ad accounts (${res.status})`);
      }
      const json = await res.json();
      setAdAccounts(json.data || []);
    } catch (err) {
      setAccountsError(err instanceof Error ? err.message : 'Failed to fetch ad accounts');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const syncAccount = useCallback(async (account: MetaAdAccount) => {
    const accountId = account.id;
    setSyncResults((prev) => ({
      ...prev,
      [accountId]: { accountId, status: 'syncing' },
    }));

    try {
      const res = await fetch(`${API_BASE}/api/ads/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: '5ml-internal',
          since: syncDateFrom,
          until: syncDateTo,
          platforms: ['meta'],
          meta_account_id: accountId,
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.meta) {
        setSyncResults((prev) => ({
          ...prev,
          [accountId]: {
            accountId,
            status: 'success',
            fetched: json.data.meta.fetched,
            upserted: json.data.meta.upserted,
            message: `Synced ${json.data.meta.upserted} rows`,
          },
        }));
        // Refresh dashboard data after successful sync
        fetchData();
      } else {
        const errMsg = json.data?.errors?.[0]?.error || json.error || 'Sync returned no data';
        setSyncResults((prev) => ({
          ...prev,
          [accountId]: { accountId, status: 'error', message: errMsg },
        }));
      }
    } catch (err) {
      setSyncResults((prev) => ({
        ...prev,
        [accountId]: {
          accountId,
          status: 'error',
          message: err instanceof Error ? err.message : 'Sync failed',
        },
      }));
    }
  }, [syncDateFrom, syncDateTo, fetchData]);

  const syncAllAccounts = useCallback(async () => {
    const activeAccounts = adAccounts.filter((a) => a.account_status === 1);
    for (const account of activeAccounts) {
      await syncAccount(account);
    }
  }, [adAccounts, syncAccount]);

  useEffect(() => {
    if (accountsPanelOpen && adAccounts.length === 0 && !accountsLoading) {
      fetchAdAccounts();
    }
  }, [accountsPanelOpen, adAccounts.length, accountsLoading, fetchAdAccounts]);

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
        {/* Connect Ad Accounts Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => setAccountsPanelOpen(!accountsPanelOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Connect Ad Accounts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discover and sync your Meta ad accounts
                </p>
              </div>
            </div>
            {accountsPanelOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {accountsPanelOpen && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              {/* Sync Date Range */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Sync From:</label>
                  <input
                    type="date"
                    value={syncDateFrom}
                    onChange={(e) => setSyncDateFrom(e.target.value)}
                    className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Sync To:</label>
                  <input
                    type="date"
                    value={syncDateTo}
                    onChange={(e) => setSyncDateTo(e.target.value)}
                    className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={fetchAdAccounts}
                  disabled={accountsLoading}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${accountsLoading ? 'animate-spin' : ''}`} />
                  Refresh Accounts
                </button>
                {adAccounts.filter((a) => a.account_status === 1).length > 0 && (
                  <button
                    onClick={syncAllAccounts}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync All Active
                  </button>
                )}
              </div>

              {accountsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {accountsError}
                </div>
              )}

              {accountsLoading && adAccounts.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading ad accounts...
                </div>
              ) : adAccounts.length === 0 && !accountsLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No ad accounts found. Make sure META_ACCESS_TOKEN is set in your environment.
                </div>
              ) : (
                <div className="grid gap-3">
                  {adAccounts.map((account) => {
                    const status = ACCOUNT_STATUS_MAP[account.account_status] || {
                      label: `Status ${account.account_status}`,
                      color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
                    };
                    const sync = syncResults[account.id];
                    const isSyncing = sync?.status === 'syncing';

                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {account.name || 'Unnamed Account'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{account.id}</span>
                            {account.currency && <span>{account.currency}</span>}
                            {account.business_name && <span>{account.business_name}</span>}
                          </div>
                          {sync && sync.status !== 'syncing' && (
                            <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                              sync.status === 'success'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {sync.status === 'success' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {sync.message}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => syncAccount(account)}
                          disabled={isSyncing}
                          className="ml-3 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Sync Data
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

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
