'use client';

import { useState, useEffect } from 'react';
import { Users, Send, Loader2, AlertCircle, TrendingUp, TrendingDown, CheckCircle, Zap } from 'lucide-react';

interface CompatibilityResult {
  compatibilityScore: number;
  harmoniousElements: string[];
  conflictingElements: string[];
  report: string;
}

interface ZiweiCompatibilityProps {
  chartId?: string;
  chartData?: any;
}

export default function ZiweiCompatibility({ chartId, chartData }: ZiweiCompatibilityProps) {
  const [chart2Id, setChart2Id] = useState('');
  const [relationshipType, setRelationshipType] = useState('romantic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relationshipTypes = [
    { value: 'romantic', label: '💑 Romantic' },
    { value: 'business', label: '🤝 Business' },
    { value: 'family', label: '👨‍👩‍👧 Family' },
    { value: 'friendship', label: '👯 Friendship' }
  ];

  const analyzeCompatibility = async () => {
    if (!chartId || !chart2Id) {
      setError('Please enter both chart IDs');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ziwei/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart1Id: chartId,
          chart2Id,
          relationshipType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          compatibilityScore: data.compatibilityScore,
          harmoniousElements: data.harmoniousElements || [],
          conflictingElements: data.conflictingElements || [],
          report: data.report
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to analyze compatibility');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'from-green-900/40 to-green-900/20 border-green-700/50';
    if (score >= 50) return 'from-yellow-900/40 to-yellow-900/20 border-yellow-700/50';
    return 'from-red-900/40 to-red-900/20 border-red-700/50';
  };

  if (!chartId) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/40 rounded-lg border border-slate-700/50">
        <div className="text-center">
          <Users className="mx-auto mb-4 w-12 h-12 text-slate-400" />
          <p className="text-slate-400">No chart selected for compatibility analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-slate-900/40 rounded-lg border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Ziwei Compatibility Analysis</h3>
        </div>

        <div className="space-y-4">
          {/* Current Chart Info */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Your Chart ID</label>
            <div className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-300 font-mono text-sm">
              {chartId}
            </div>
          </div>

          {/* Other Chart ID */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Other Person's Chart ID</label>
            <input
              type="text"
              value={chart2Id}
              onChange={(e) => setChart2Id(e.target.value)}
              placeholder="Paste another chart ID..."
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-sm text-slate-300 mb-3">Relationship Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {relationshipTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setRelationshipType(type.value)}
                  className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
                    relationshipType === type.value
                      ? 'bg-purple-600/60 border-purple-500/50 text-white'
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-400 hover:text-slate-300 hover:border-slate-500/50'
                  }`}
                >
                  {type.label}
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

          {/* Submit Button */}
          <button
            onClick={analyzeCompatibility}
            disabled={loading || !chart2Id}
            className="w-full px-4 py-3 bg-purple-600/60 hover:bg-purple-500/60 disabled:opacity-50 border border-purple-500/50 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Compatibility...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Compatibility
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Score Card */}
          <div className={`bg-gradient-to-r ${getScoreBgColor(result.compatibilityScore)} rounded-lg border p-6`}>
            <div className="text-center mb-4">
              <div className="flex justify-center mb-4">
                <div className={`text-7xl font-bold ${getScoreColor(result.compatibilityScore)}`}>
                  {result.compatibilityScore}
                </div>
                <div className="text-4xl ml-2 pt-2">/100</div>
              </div>
              <p className="text-slate-300">
                {result.compatibilityScore >= 75 && "🌟 Excellent Compatibility"}
                {result.compatibilityScore >= 50 && result.compatibilityScore < 75 && "✨ Good Potential"}
                {result.compatibilityScore < 50 && "⚠️ Challenges Ahead"}
              </p>
            </div>
          </div>

          {/* Harmonious Elements */}
          {result.harmoniousElements.length > 0 && (
            <div className="bg-slate-900/40 rounded-lg border border-green-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-green-300">Harmonious Elements</h4>
              </div>
              <div className="space-y-2">
                {result.harmoniousElements.map((elem, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-100">{elem}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflicting Elements */}
          {result.conflictingElements.length > 0 && (
            <div className="bg-slate-900/40 rounded-lg border border-amber-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                <h4 className="font-semibold text-amber-300">Challenges to Navigate</h4>
              </div>
              <div className="space-y-2">
                {result.conflictingElements.map((elem, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-100">{elem}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Report */}
          <div className="bg-slate-900/40 rounded-lg border border-slate-700/50 p-6">
            <h4 className="font-semibold text-white mb-4">Detailed Analysis</h4>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                {result.report}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
