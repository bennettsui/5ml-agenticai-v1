'use client';

import { BarChart3, AlertCircle, TrendingUp, DollarSign, Eye, MousePointer } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const KPI_CARDS = [
  { label: 'Total Spend', value: '$0', change: '--', icon: DollarSign, color: 'text-cyan-400' },
  { label: 'Impressions', value: '0', change: '--', icon: Eye, color: 'text-blue-400' },
  { label: 'Clicks', value: '0', change: '--', icon: MousePointer, color: 'text-emerald-400' },
  { label: 'ROAS', value: '0x', change: '--', icon: TrendingUp, color: 'text-purple-400' },
];

const CAMPAIGNS = [
  { name: 'Sample Campaign', platform: 'Meta', status: 'Draft', spend: '$0', impressions: '0', clicks: '0', ctr: '--', cpc: '--', roas: '--' },
];

export default function AdPerformancePage() {
  const { selectedBrand } = useBrandProject();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-rose-400" />
          <h1 className="text-2xl font-bold text-white">Social Ad Performance</h1>
        </div>
        <p className="text-sm text-slate-400">
          Track and analyze social ad campaigns, ROAS, and optimization — monthly review
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to view ad performance.</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[10px] text-slate-500">{kpi.change}</span>
              </div>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Performance Trend</h2>
        <div className="h-48 bg-white/[0.02] border border-slate-700/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Performance charts will appear here</p>
            <p className="text-[10px] text-slate-600 mt-1">Connect ad accounts to start tracking</p>
          </div>
        </div>
      </div>

      {/* Campaign Table */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Campaigns</h2>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Campaign</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Platform</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Spend</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Impressions</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">CTR</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map(c => (
                <tr key={c.name} className="border-b border-slate-700/30 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm text-white">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.platform}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50">{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.spend}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.impressions}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.ctr}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.roas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
