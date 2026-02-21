'use client';

import { useState } from 'react';
import { TrendingUp, Target, BarChart2, Lightbulb, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const INDUSTRIES = [
  'Retail & eCommerce',
  'Food & Beverage',
  'Professional Services',
  'Health & Wellness',
  'Technology',
  'Education & Training',
  'Hospitality & Tourism',
  'Manufacturing',
  'Finance & Insurance',
  'Creative & Media',
];

const GROWTH_STAGES = [
  { value: 'startup', label: 'Startup', desc: 'Pre-revenue or < HK$500K/yr' },
  { value: 'early', label: 'Early Growth', desc: 'HK$500K – HK$3M/yr' },
  { value: 'scaling', label: 'Scaling', desc: 'HK$3M – HK$20M/yr' },
  { value: 'established', label: 'Established', desc: 'HK$20M+/yr' },
];

const GOALS = [
  'Increase brand awareness',
  'Generate more leads',
  'Improve customer retention',
  'Launch new products/services',
  'Expand to new markets',
  'Reduce customer acquisition cost',
  'Build online presence',
  'Improve conversion rates',
];

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';

interface GrowthPlan {
  overview: string;
  strategies: { title: string; description: string; timeline: string; impact: 'high' | 'medium' | 'low' }[];
  quickWins: string[];
  kpis: string[];
}

function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[impact]}`}>
      {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
    </span>
  );
}

export default function SmeGrowthPage() {
  const [business, setBusiness] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GrowthPlan | null>(null);
  const [error, setError] = useState('');

  const toggleGoal = (g: string) => {
    setSelectedGoals(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 3 ? [...prev, g] : prev
    );
  };

  const canGenerate = business.trim() && industry && stage && selectedGoals.length > 0;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError('');
    setPlan(null);

    const prompt = `You are a senior business growth consultant specialising in Hong Kong SMEs.

Business: ${business.trim()}
Industry: ${industry}
Growth Stage: ${stage}
Primary Goals: ${selectedGoals.join(', ')}
${challenge.trim() ? `Key Challenge: ${challenge.trim()}` : ''}

Generate a concise, actionable growth plan in valid JSON with this exact structure:
{
  "overview": "2-3 sentence executive summary of the growth opportunity",
  "strategies": [
    {
      "title": "Strategy name",
      "description": "What to do and why it works for this business",
      "timeline": "e.g. Month 1-3",
      "impact": "high" | "medium" | "low"
    }
  ],
  "quickWins": ["Action you can take this week", "..."],
  "kpis": ["KPI to track", "..."]
}

Include 4-5 strategies, 4 quick wins, and 4 KPIs. Focus on practical, cost-effective actions for HK SMEs. Return only the JSON object.`;

    try {
      const res = await fetch(`${API_BASE}/api/workflow-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          systemPrompt: 'You are a business growth consultant. Respond only with valid JSON.',
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const text: string = data.response || data.message || data.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse growth plan');
      const parsed: GrowthPlan = JSON.parse(match[0]);
      setPlan(parsed);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SME Growth Advisor</h1>
              <p className="text-slate-400 text-sm">AI-powered growth strategy for Hong Kong small businesses</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-6 space-y-5">
          {/* Business name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Business Name / Description</label>
            <input
              value={business}
              onChange={e => setBusiness(e.target.value)}
              placeholder="e.g. Bloom Florals — a boutique flower shop in Sheung Wan"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Industry + Stage */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Growth Stage</label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select stage…</option>
                {GROWTH_STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Primary Goals <span className="text-slate-500">(pick up to 3)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedGoals.includes(g)
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Challenge */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Biggest Challenge <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={challenge}
              onChange={e => setChallenge(e.target.value)}
              rows={2}
              placeholder="e.g. Hard to stand out against bigger competitors, low foot traffic on weekdays…"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate || loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating your growth plan…</>
            ) : (
              <><Lightbulb className="w-4 h-4" /> Generate Growth Plan</>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
        </div>

        {/* Results */}
        {plan && (
          <div className="space-y-5">
            {/* Overview */}
            <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Growth Overview</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{plan.overview}</p>
            </div>

            {/* Strategies */}
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-400" /> Growth Strategies
              </h2>
              <div className="space-y-3">
                {plan.strategies.map((s, i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-500">{s.timeline}</span>
                        <ImpactBadge impact={s.impact} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins + KPIs */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">⚡ Quick Wins This Week</h3>
                <ul className="space-y-2">
                  {plan.quickWins.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">📊 KPIs to Track</h3>
                <ul className="space-y-2">
                  {plan.kpis.map((k, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Regenerate */}
            <div className="flex justify-center">
              <button
                onClick={generate}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-sm rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
