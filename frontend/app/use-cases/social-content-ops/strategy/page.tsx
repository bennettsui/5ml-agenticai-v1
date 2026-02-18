'use client';

import { useState } from 'react';
import { Target, Loader2, CheckCircle2, AlertCircle, TrendingUp, Users, Globe, Megaphone } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const STRATEGY_PILLARS = [
  { icon: Users, label: 'Audience Personas', desc: 'Define target segments and their social behaviors' },
  { icon: Globe, label: 'Platform Selection', desc: 'Choose optimal platforms based on audience fit' },
  { icon: TrendingUp, label: 'Growth Goals', desc: 'Set measurable KPIs: followers, engagement, conversion' },
  { icon: Megaphone, label: 'Content Themes', desc: 'Define brand voice, content pillars, and posting cadence' },
];

const PHASES = [
  { label: 'Audit', desc: 'Review current social presence and performance baseline', status: 'ready' },
  { label: 'Research', desc: 'Competitive analysis, audience research, platform trends', status: 'ready' },
  { label: 'Strategy Draft', desc: 'AI-assisted strategy document with goals and tactics', status: 'ready' },
  { label: 'Review & Refine', desc: 'Stakeholder review with business analyst critique', status: 'ready' },
  { label: 'Publish & Brief', desc: 'Finalize strategy and create execution brief', status: 'ready' },
];

export default function SocialStrategyPage() {
  const { selectedBrand } = useBrandProject();
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Social Strategy</h1>
        </div>
        <p className="text-sm text-slate-400">
          Define comprehensive social media strategy — typically one-off or annual review
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand from the sidebar to generate a strategy.</p>
        </div>
      )}

      {/* Strategy Pillars */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Strategy Pillars</h2>
        <div className="grid grid-cols-2 gap-4">
          {STRATEGY_PILLARS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">{p.label}</h3>
                </div>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy Process */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Strategy Process</h2>
        <div className="space-y-2">
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-slate-700/30 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-xs text-slate-400 font-medium">
                {i + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">{phase.label}</h3>
                <p className="text-xs text-slate-500">{phase.desc}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="flex gap-3">
        <button
          disabled={!selectedBrand || generating}
          onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 2000); }}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          {generating ? 'Generating Strategy...' : 'Generate Strategy'}
        </button>
        <p className="text-xs text-slate-500 self-center">
          Use the AI assistant on the right for guided strategy development
        </p>
      </div>
    </div>
  );
}
