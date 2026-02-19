'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Loader2, AlertCircle, Sparkles, Wand2 } from 'lucide-react';

interface InsightsResult {
  guidance: string;
  lifeStage: string;
}

interface ZiweiInsightsProps {
  chartId?: string;
  chartData?: any;
}

export default function ZiweiInsights({ chartId, chartData }: ZiweiInsightsProps) {
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lifeStage, setLifeStage] = useState('current');
  const [error, setError] = useState<string | null>(null);

  const lifeStages = [
    { value: 'current', label: 'Current Life Stage' },
    { value: 'youth', label: 'Youth (0-16)' },
    { value: 'young-adult', label: 'Young Adult (17-30)' },
    { value: 'adult', label: 'Adult (31-45)' },
    { value: 'midlife', label: 'Midlife (46-60)' },
    { value: 'senior', label: 'Senior (61+)' }
  ];

  const generateInsights = async () => {
    if (!chartId) {
      setError('Chart ID is required');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ziwei/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartId,
          lifeStage,
          analysisDepth: 'detailed'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInsights({
          guidance: data.guidance,
          lifeStage: lifeStage
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate insights');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate insights for current stage on mount
    if (chartId && !insights) {
      setTimeout(generateInsights, 500);
    }
  }, [chartId, insights]);

  if (!chartId) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/40 rounded-lg border border-slate-700/50">
        <div className="text-center">
          <Lightbulb className="mx-auto mb-4 w-12 h-12 text-slate-400" />
          <p className="text-slate-400">No chart selected for insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Life Stage Selector */}
      <div className="bg-slate-900/40 rounded-lg border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Personalized Life Guidance</h3>
        </div>

        <div className="space-y-4">
          {/* Life Stage Selection */}
          <div>
            <label className="block text-sm text-slate-300 mb-3">Select Life Stage</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {lifeStages.map(stage => (
                <button
                  key={stage.value}
                  onClick={() => {
                    setLifeStage(stage.value);
                    setInsights(null);
                  }}
                  className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
                    lifeStage === stage.value
                      ? 'bg-purple-600/60 border-purple-500/50 text-white'
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-400 hover:text-slate-300 hover:border-slate-500/50'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-red-900/20 border border-red-700/50">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateInsights}
            disabled={loading}
            className="w-full px-4 py-3 bg-purple-600/60 hover:bg-purple-500/60 disabled:opacity-50 border border-purple-500/50 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Insights...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Insights
              </>
            )}
          </button>
        </div>
      </div>

      {/* Insights Display */}
      {insights && (
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-lg border border-purple-700/50 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-purple-600/40 border border-purple-500/50">
              <Lightbulb className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-purple-100 mb-1">Your Life Guidance</h4>
              <p className="text-sm text-purple-300/60">
                Insights tailored to your birth chart for {lifeStages.find(s => s.value === lifeStage)?.label.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none bg-slate-900/30 rounded-lg p-6 border border-purple-600/30">
            <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed font-light">
              {insights.guidance}
            </p>
          </div>

          {/* Key Takeaways */}
          <div className="mt-6 p-4 rounded-lg bg-purple-600/20 border border-purple-500/30">
            <h5 className="text-sm font-semibold text-purple-200 mb-3">💡 Key Takeaways</h5>
            <ul className="space-y-2 text-sm text-purple-100/80">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">•</span>
                <span>Pay attention to chart patterns and how they manifest in this life stage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">•</span>
                <span>Use this guidance to make informed decisions aligned with your destiny</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">•</span>
                <span>Remember: the chart shows tendencies, not absolutes. You have agency in your choices</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-6 p-4 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <p className="text-sm text-slate-300">
              💬 Want to explore deeper? <span className="text-purple-300 cursor-pointer hover:text-purple-200">Start a conversation with the Ziwei chatbot</span> to ask specific questions about this guidance.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64 bg-slate-900/40 rounded-lg border border-slate-700/50">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 w-12 h-12 text-purple-400 animate-spin" />
            <p className="text-slate-300">Consulting your birth chart...</p>
            <p className="text-xs text-slate-400 mt-2">Using DeepSeek AI for deep analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}
