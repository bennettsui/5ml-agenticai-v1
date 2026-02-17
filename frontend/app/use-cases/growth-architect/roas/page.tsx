'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Plus, TrendingUp, ExternalLink, AlertCircle } from 'lucide-react';
import { useGrowthArchitect } from '../context';

export default function ROASPage() {
  const { selectedBrand, currentPlan } = useGrowthArchitect();
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-500" />
            ROAS & Financial Modeling
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedBrand} • Project revenue scenarios and optimize spending
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Analyze Performance
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">Base ROAS</p>
          <p className="text-2xl font-bold text-emerald-400">—</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">Break-even Spend</p>
          <p className="text-2xl font-bold text-blue-400">—</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">30-day Revenue</p>
          <p className="text-2xl font-bold text-yellow-400">—</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1 uppercase">90-day Projection</p>
          <p className="text-2xl font-bold text-purple-400">—</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-12 text-center">
        <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-300 font-medium mb-2">No ROAS Models Yet</p>
        <p className="text-slate-500 text-sm mb-4">
          Analyze your ad performance to generate financial projections and scenario modeling
        </p>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
          Analyze Ad Performance
        </button>
      </div>

      {/* Scenario Planning */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Spending Scenarios</h2>
        <p className="text-sm text-slate-400 mb-4">
          Model revenue projections at different spending levels (with diminishing returns factored in)
        </p>

        <div className="grid grid-cols-5 gap-3">
          {[
            { level: '50%', label: 'Conservative' },
            { level: '100%', label: 'Baseline' },
            { level: '150%', label: 'Moderate' },
            { level: '200%', label: 'Aggressive' },
            { level: '300%', label: 'Full Scale' },
          ].map((scenario, idx) => (
            <div key={idx} className="bg-slate-700/30 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-400 mb-2">{scenario.label}</p>
              <p className="text-lg font-bold text-white mb-2">{scenario.level}</p>
              <p className="text-xs text-slate-500">Spend: —</p>
              <p className="text-xs text-slate-500">Revenue: —</p>
              <p className="text-sm font-semibold text-emerald-400 mt-2">ROAS: —</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Financial Assumptions</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-300 font-medium mb-1">Channel Mix</p>
            <p className="text-sm text-slate-500">Facebook, Google, LinkedIn, Email</p>
          </div>
          <div>
            <p className="text-sm text-slate-300 font-medium mb-1">Scaling Impact</p>
            <p className="text-sm text-slate-500">5% ROAS decrease per 2x spend (diminishing returns)</p>
          </div>
          <div>
            <p className="text-sm text-slate-300 font-medium mb-1">LTV Assumptions</p>
            <p className="text-sm text-slate-500">Based on 12-month customer retention</p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-200 mb-1">Ad Performance Connected</p>
              <p className="text-xs text-blue-100 mb-3">
                Real-time data from Facebook, Google, and LinkedIn ads ready to analyze.
              </p>
              <Link
                href="/ads-dashboard/client"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors"
              >
                View Performance <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-200 mb-1">E-commerce & Lead Gen</p>
              <p className="text-xs text-amber-100 mb-3">
                Connect Shopify, WooCommerce, or lead forms for complete funnel analysis (Phase 5).
              </p>
              <Link
                href="/use-cases/growth-architect?tab=integrations"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded font-medium transition-colors"
              >
                View Roadmap <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Generate Feature Box */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <p className="text-sm text-green-200">
          💡 <strong>How to Use:</strong> With performance data connected, click "Analyze Performance" above to auto-generate ROAS
          models with actual channel mix, spend patterns, and revenue projections. Add ecommerce or lead generation data for
          complete funnel ROAS analysis.
        </p>
      </div>
    </div>
  );
}
