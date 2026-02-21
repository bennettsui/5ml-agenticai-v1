'use client';

import { useState } from 'react';
import { Save, RotateCcw, Info } from 'lucide-react';

interface WeightGroup {
  label: string;
  description: string;
  weights: { key: string; label: string; value: number; description: string }[];
}

const DEFAULT_CAPABILITY_FIT: WeightGroup = {
  label: 'Capability Fit Weights',
  description: 'How we assess whether we can deliver this tender (55% of overall score)',
  weights: [
    { key: 'categoryMatch', label: 'Category Match', value: 0.35, description: 'How well the tender category aligns with our services' },
    { key: 'agencyFamiliarity', label: 'Agency Familiarity', value: 0.15, description: 'Whether we have a prior relationship with this buyer' },
    { key: 'deliveryScale', label: 'Delivery Scale', value: 0.20, description: 'Whether the scope fits our team capacity' },
    { key: 'keywordOverlap', label: 'Keyword Overlap', value: 0.20, description: 'Title/description similarity to our track record' },
    { key: 'geographicFit', label: 'Geographic Fit', value: 0.10, description: 'HK primary, SG secondary, other lower' },
  ],
};

const DEFAULT_BUSINESS_POTENTIAL: WeightGroup = {
  label: 'Business Potential Weights',
  description: 'Commercial and strategic attractiveness (45% of overall score)',
  weights: [
    { key: 'budget', label: 'Budget (if stated)', value: 0.30, description: 'Contract value vs our thresholds' },
    { key: 'budgetProxy', label: 'Budget Proxy', value: 0.15, description: 'Estimated value when budget not stated' },
    { key: 'strategicBeachhead', label: 'Strategic Beachhead', value: 0.20, description: 'New agency = relationship-building opportunity' },
    { key: 'categoryGrowth', label: 'Category Growth', value: 0.15, description: 'Categories with growing government spend' },
    { key: 'timeToDeadline', label: 'Time to Deadline', value: 0.10, description: 'More days = more preparation time' },
    { key: 'recurrencePotential', label: 'Recurrence Potential', value: 0.10, description: 'Framework/multi-year contracts score higher' },
  ],
};

const COMPETENCIES = [
  'Digital Marketing & Strategy',
  'Events & Experiential',
  'Brand Communications',
  'Management Consultancy',
  'IT Systems (light — AV, signage)',
];

const KNOWN_AGENCIES = ['LCSD', 'ISD', 'EMSD', 'HK Tourism Board', 'HKTDC', 'Enterprise Singapore'];

const TRACK_RECORD_KEYWORDS = [
  'digital marketing', 'brand campaign', 'event management', 'experiential',
  'digital transformation', 'communications strategy', 'content creation',
  'social media', 'exhibition', 'conference',
];

function WeightSlider({
  weight,
  onChange,
}: {
  weight: { key: string; label: string; value: number; description: string };
  onChange: (key: string, value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-slate-200">{weight.label}</span>
          <p className="text-xs text-slate-500 mt-0.5">{weight.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={weight.value}
            onChange={e => onChange(weight.key, parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-xs text-right text-slate-200 font-mono focus:outline-none focus:border-teal-500/50"
          />
        </div>
      </div>
      <div className="relative h-1.5 bg-slate-700/60 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-teal-400 rounded-full"
          style={{ width: `${weight.value * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={weight.value}
          onChange={e => onChange(weight.key, parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

export default function EvalSettingsPage() {
  const [capFit, setCapFit] = useState(DEFAULT_CAPABILITY_FIT.weights.map(w => ({ ...w })));
  const [bizPot, setBizPot] = useState(DEFAULT_BUSINESS_POTENTIAL.weights.map(w => ({ ...w })));
  const [overallCapWeight, setOverallCapWeight] = useState(0.55);
  const [saved, setSaved] = useState(false);

  function updateCapFit(key: string, value: number) {
    setCapFit(prev => prev.map(w => w.key === key ? { ...w, value } : w));
  }
  function updateBizPot(key: string, value: number) {
    setBizPot(prev => prev.map(w => w.key === key ? { ...w, value } : w));
  }
  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  function handleReset() {
    setCapFit(DEFAULT_CAPABILITY_FIT.weights.map(w => ({ ...w })));
    setBizPot(DEFAULT_BUSINESS_POTENTIAL.weights.map(w => ({ ...w })));
    setOverallCapWeight(0.55);
  }

  const capFitSum = capFit.reduce((s, w) => s + w.value, 0);
  const bizPotSum = bizPot.reduce((s, w) => s + w.value, 0);
  const warnCapFit = Math.abs(capFitSum - 1) > 0.02;
  const warnBizPot = Math.abs(bizPotSum - 1) > 0.02;

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Evaluation Settings</h1>
          <p className="text-sm text-slate-400">Tune scoring weights and capability profile</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Formula overview */}
      <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Scoring Formula</p>
        <div className="font-mono text-sm text-slate-300 space-y-1">
          <div>overall = (capability_fit × <span className="text-teal-400">{overallCapWeight.toFixed(2)}</span>) + (business_potential × <span className="text-blue-400">{(1 - overallCapWeight).toFixed(2)}</span>)</div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Capability weight: <span className="text-teal-400 font-medium">{(overallCapWeight * 100).toFixed(0)}%</span></span>
            <span className="text-xs text-slate-400">Potential weight: <span className="text-blue-400 font-medium">{((1 - overallCapWeight) * 100).toFixed(0)}%</span></span>
          </div>
          <div className="relative h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-teal-400/60 rounded-l-full" style={{ width: `${overallCapWeight * 100}%` }} />
            <div className="absolute right-0 top-0 h-full bg-blue-400/60 rounded-r-full" style={{ width: `${(1 - overallCapWeight) * 100}%` }} />
            <input
              type="range" min={0.3} max={0.8} step={0.05} value={overallCapWeight}
              onChange={e => setOverallCapWeight(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Capability Fit Weights */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">{DEFAULT_CAPABILITY_FIT.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{DEFAULT_CAPABILITY_FIT.description}</p>
          </div>
          {warnCapFit && (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs flex-shrink-0 ml-3">
              <Info className="w-3.5 h-3.5" />
              Sum: {capFitSum.toFixed(2)} (should be 1.0)
            </div>
          )}
        </div>
        <div className="space-y-5 divide-y divide-slate-700/30">
          {capFit.map(w => (
            <div key={w.key} className="pt-4 first:pt-0">
              <WeightSlider weight={w} onChange={updateCapFit} />
            </div>
          ))}
        </div>
      </div>

      {/* Business Potential Weights */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">{DEFAULT_BUSINESS_POTENTIAL.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{DEFAULT_BUSINESS_POTENTIAL.description}</p>
          </div>
          {warnBizPot && (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs flex-shrink-0 ml-3">
              <Info className="w-3.5 h-3.5" />
              Sum: {bizPotSum.toFixed(2)} (should be 1.0)
            </div>
          )}
        </div>
        <div className="space-y-5 divide-y divide-slate-700/30">
          {bizPot.map(w => (
            <div key={w.key} className="pt-4 first:pt-0">
              <WeightSlider weight={w} onChange={updateBizPot} />
            </div>
          ))}
        </div>
      </div>

      {/* Capability Profile */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Capability Profile</h3>
        <div className="space-y-5">
          {/* Competencies */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2">Core Competencies</p>
            <div className="flex flex-wrap gap-2">
              {COMPETENCIES.map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {c}
                  <button className="text-teal-600 hover:text-teal-400">×</button>
                </span>
              ))}
              <button className="px-2.5 py-1 rounded-lg text-xs text-slate-500 border border-dashed border-slate-600 hover:border-slate-500 hover:text-slate-400 transition-colors">
                + Add
              </button>
            </div>
          </div>
          {/* Known agencies */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2">Known Agencies (familiarity boost)</p>
            <div className="flex flex-wrap gap-2">
              {KNOWN_AGENCIES.map(a => (
                <span key={a} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {a}
                  <button className="text-blue-600 hover:text-blue-400">×</button>
                </span>
              ))}
              <button className="px-2.5 py-1 rounded-lg text-xs text-slate-500 border border-dashed border-slate-600 hover:border-slate-500 hover:text-slate-400 transition-colors">
                + Add
              </button>
            </div>
          </div>
          {/* Track record keywords */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2">Track Record Keywords</p>
            <div className="flex flex-wrap gap-2">
              {TRACK_RECORD_KEYWORDS.map(k => (
                <span key={k} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-slate-700/40 text-slate-400 border border-slate-600/30">
                  {k}
                  <button className="text-slate-600 hover:text-slate-400">×</button>
                </span>
              ))}
              <button className="px-2 py-0.5 rounded text-[10px] text-slate-500 border border-dashed border-slate-600 hover:text-slate-400 transition-colors">
                + Add keyword
              </button>
            </div>
          </div>
          {/* Budget thresholds */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2">Budget Thresholds (for scoring)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'HK High (≥)', value: 'HK$500,000' },
                { label: 'HK Low (≤)', value: 'HK$50,000' },
                { label: 'SG High (≥)', value: 'SGD$100,000' },
                { label: 'SG Low (≤)', value: 'SGD$20,000' },
              ].map(t => (
                <div key={t.label}>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">{t.label}</label>
                  <input
                    type="text"
                    defaultValue={t.value}
                    className="mt-1 w-full px-3 py-1.5 bg-slate-700/40 border border-slate-600/50 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Label thresholds */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Label Thresholds</h3>
        <div className="space-y-3">
          {[
            { label: 'Priority', min: 0.70, max: 1.0, color: 'emerald' },
            { label: 'Consider', min: 0.50, max: 0.69, color: 'cyan' },
            { label: 'Partner-only', min: 0.35, max: 0.49, color: 'amber' },
            { label: 'Ignore', min: 0.0, max: 0.34, color: 'slate' },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-${t.color}-400 flex-shrink-0`} />
              <span className={`text-xs font-medium text-${t.color}-400 w-20`}>{t.label}</span>
              <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${t.color}-400/60`}
                  style={{ marginLeft: `${t.min * 100}%`, width: `${(t.max - t.min) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono w-16 text-right">
                {t.min.toFixed(2)} – {t.max.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
