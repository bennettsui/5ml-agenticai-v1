'use client';

import { useState } from 'react';
import { TrendingUp, BarChart2, AlertCircle } from 'lucide-react';
import { useGrowthHackingStudio } from '../context';

export default function PerformancePage() {
  const { selectedBrand, currentPlan } = useGrowthHackingStudio();
  const [timeRange, setTimeRange] = useState('7d');

  const channels = [
    { name: 'Facebook', ctr: '2.5%', cpc: '$0.45', cvr: '3.2%', roas: '4.2x' },
    { name: 'Google Search', ctr: '4.1%', cpc: '$1.20', cvr: '5.8%', roas: '6.1x' },
    { name: 'LinkedIn', ctr: '1.8%', cpc: '$2.10', cvr: '2.1%', roas: '2.8x' },
    { name: 'Email', ctr: '12.3%', cpc: 'N/A', cvr: '8.5%', roas: '12.5x' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-blue-500" />
            Performance & Optimization
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedBrand} • Monitor and analyze channel performance
          </p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">Total Spend</p>
          <p className="text-2xl font-bold text-white">$—</p>
          <p className="text-xs text-slate-500 mt-2">↗ +0% vs last period</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">$—</p>
          <p className="text-xs text-slate-500 mt-2">↗ +0% vs last period</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">Blended ROAS</p>
          <p className="text-2xl font-bold text-blue-400">—</p>
          <p className="text-xs text-slate-500 mt-2">Target: 5.0x</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">Cost/Acquisition</p>
          <p className="text-2xl font-bold text-yellow-400">$—</p>
          <p className="text-xs text-slate-500 mt-2">Target: under $50</p>
        </div>
      </div>

      {/* Channel Performance Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">CTR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">CPC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">CVR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">ROAS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel, idx) => (
                <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium">{channel.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{channel.ctr}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{channel.cpc}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{channel.cvr}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{channel.roas}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts & Recommendations */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Alerts & Recommendations</h2>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-200 mb-1">Lower CVR on Facebook</p>
            <p className="text-sm text-yellow-100">Conversion rate dropped 12% this week. Consider A/B testing landing pages.</p>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex gap-3">
          <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-200 mb-1">Email Campaign Outperforming</p>
            <p className="text-sm text-green-100">Email channel showing 12.5x ROAS. Consider increasing email budget allocation.</p>
          </div>
        </div>
      </div>

      {/* Optimization Opportunities */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Optimization Opportunities</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-emerald-300">1</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scale Email Channel</p>
              <p className="text-xs text-slate-400">Highest ROAS. Budget increase recommended.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-yellow-300">2</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Test Facebook Creatives</p>
              <p className="text-xs text-slate-400">CVR decline suggests creative fatigue. Launch A/B tests.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-blue-300">3</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Optimize Google Bids</p>
              <p className="text-xs text-slate-400">CPC trending up. Review keyword strategies and bid adjustments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Real-time Integration:</strong> Connect your ad accounts to automatically pull performance data and get
          AI-powered optimization recommendations.
        </p>
      </div>
    </div>
  );
}
