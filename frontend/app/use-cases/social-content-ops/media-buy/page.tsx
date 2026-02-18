'use client';

import { useState } from 'react';
import { DollarSign, AlertCircle, TrendingUp, Target, Layers, PieChart } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const PLATFORMS_BUDGET = [
  { name: 'Meta (FB + IG)', allocation: 40, spend: '$0', cpm: '--', cpc: '--', color: 'bg-blue-500' },
  { name: 'Google/YouTube', allocation: 25, spend: '$0', cpm: '--', cpc: '--', color: 'bg-red-500' },
  { name: 'TikTok', allocation: 20, spend: '$0', cpm: '--', cpc: '--', color: 'bg-purple-500' },
  { name: 'LinkedIn', allocation: 10, spend: '$0', cpm: '--', cpc: '--', color: 'bg-cyan-500' },
  { name: 'X/Twitter', allocation: 5, spend: '$0', cpm: '--', cpc: '--', color: 'bg-slate-400' },
];

const OBJECTIVES = [
  { label: 'Brand Awareness', icon: Target, desc: 'Maximize reach and impressions' },
  { label: 'Traffic', icon: TrendingUp, desc: 'Drive clicks to landing pages' },
  { label: 'Conversions', icon: Layers, desc: 'Optimize for purchases/sign-ups' },
  { label: 'Engagement', icon: PieChart, desc: 'Maximize likes, shares, comments' },
];

export default function MediaBuyPage() {
  const { selectedBrand } = useBrandProject();
  const [budget, setBudget] = useState('');
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Media Buy</h1>
        </div>
        <p className="text-sm text-slate-400">
          Plan and optimize paid media placement across social platforms — campaign-based
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to plan media buys.</p>
        </div>
      )}

      {/* Budget input */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Campaign Budget</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="Monthly budget"
              className="w-full bg-white/[0.03] border border-slate-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
            />
          </div>
          <span className="text-xs text-slate-500">USD / month</span>
        </div>
      </div>

      {/* Campaign Objective */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Campaign Objective</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OBJECTIVES.map(obj => {
            const Icon = obj.icon;
            const active = selectedObjective === obj.label;
            return (
              <button
                key={obj.label}
                onClick={() => setSelectedObjective(obj.label)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  active
                    ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                <h3 className="text-xs font-medium text-white">{obj.label}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{obj.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform Allocation */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Platform Allocation</h2>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Platform</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Allocation</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Spend</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Est. CPM</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-400">Est. CPC</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS_BUDGET.map(p => (
                <tr key={p.name} className="border-b border-slate-700/30 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm text-white flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${p.color}`} />
                    {p.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.allocation}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{p.allocation}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{budget ? `$${(Number(budget) * p.allocation / 100).toFixed(0)}` : p.spend}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.cpm}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.cpc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
