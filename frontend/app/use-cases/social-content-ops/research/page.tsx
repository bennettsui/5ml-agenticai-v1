'use client';

import { useState } from 'react';
import { Search, AlertCircle, Globe, TrendingUp, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const RESEARCH_AREAS = [
  { label: 'Competitor Monitoring', desc: 'Track competitor social activity, content strategy, and engagement rates', icon: BarChart3, freq: 'Weekly' },
  { label: 'Industry Trends', desc: 'Identify emerging trends, hashtags, and content formats in your industry', icon: TrendingUp, freq: 'Weekly' },
  { label: 'Audience Insights', desc: 'Analyze audience demographics, behavior patterns, and content preferences', icon: Globe, freq: 'Monthly' },
  { label: 'Brand Sentiment', desc: 'Monitor brand mentions, sentiment analysis, and share of voice', icon: Search, freq: 'Daily' },
];

export default function ResearchPage() {
  const { selectedBrand } = useBrandProject();
  const [scanning, setScanning] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-5 h-5 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Brand & Competitive Research</h1>
        </div>
        <p className="text-sm text-slate-400">
          Ongoing competitive intelligence and market research for social strategy
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to run competitive research.</p>
        </div>
      )}

      {/* Research Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RESEARCH_AREAS.map(area => {
          const Icon = area.icon;
          return (
            <div key={area.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">{area.label}</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">
                  {area.freq}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{area.desc}</p>
              <div className="h-24 bg-white/[0.02] border border-slate-700/30 rounded-lg flex items-center justify-center">
                <p className="text-xs text-slate-600">Research data will appear here</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scan button */}
      <div className="flex gap-3">
        <button
          disabled={!selectedBrand || scanning}
          onClick={() => { setScanning(true); setTimeout(() => setScanning(false), 3000); }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors flex items-center gap-2"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {scanning ? 'Scanning...' : 'Run Research Scan'}
        </button>
      </div>
    </div>
  );
}
