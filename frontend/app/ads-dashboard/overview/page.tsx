'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface TenantOverview {
  tenant_id: string;
  total_spend: string | null;
  total_conversions: string | null;
  total_revenue: string | null;
  blended_roas: string | null;
  campaign_count: number;
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

function getRoasStatus(roas: number): { label: string; color: string; icon: typeof CheckCircle } {
  if (roas >= 3) return { label: 'Strong', color: 'text-green-600 dark:text-green-400', icon: CheckCircle };
  if (roas >= 1.5) return { label: 'On Target', color: 'text-blue-600 dark:text-blue-400', icon: TrendingUp };
  if (roas > 0) return { label: 'Below Target', color: 'text-yellow-600 dark:text-yellow-400', icon: AlertTriangle };
  return { label: 'No Data', color: 'text-slate-400', icon: AlertTriangle };
}

export default function AdsOverviewPage() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [tenants, setTenants] = useState<TenantOverview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`${API_BASE}/api/ads/overview?${params}`);
      if (res.ok) {
        const json = await res.json();
        setTenants(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSpend = tenants.reduce((sum, t) => sum + parseFloat(t.total_spend || '0'), 0);
  const totalRevenue = tenants.reduce((sum, t) => sum + parseFloat(t.total_revenue || '0'), 0);
  const totalConversions = tenants.reduce((sum, t) => sum + parseFloat(t.total_conversions || '0'), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ads-dashboard"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Users className="w-7 h-7 text-purple-500" />
                  Client Overview
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Multi-tenant ads performance across all clients
                </p>
              </div>
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
          </div>
        </div>

        {/* Aggregate KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Spend (All Clients)</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalSpend)}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Conversions</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(totalConversions)}</div>
          </div>
        </div>

        {/* Tenant Cards */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading client data...</div>
        ) : tenants.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Client Data Yet</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Add client credentials and run the daily sync to see data here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => {
              const roas = parseFloat(tenant.blended_roas || '0');
              const status = getRoasStatus(roas);
              const StatusIcon = status.icon;

              return (
                <Link
                  key={tenant.tenant_id}
                  href={`/clients/${tenant.tenant_id}/ads-dashboard`}
                  className="group block"
                >
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {tenant.tenant_id}
                      </h3>
                      <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Spend</span>
                        <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(tenant.total_spend)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Revenue</span>
                        <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(tenant.total_revenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">ROAS</span>
                        <span className="font-mono font-medium text-slate-900 dark:text-white">{roas.toFixed(2)}x</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Campaigns</span>
                        <span className="font-mono text-slate-900 dark:text-white">{tenant.campaign_count}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-medium">
                        View Dashboard
                      </span>
                      <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
