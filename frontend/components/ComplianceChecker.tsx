'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lightbulb,
  Zap,
  BarChart3,
} from 'lucide-react';

interface ComplianceScore {
  overall_score: number;
  voice_alignment: {
    score: number;
    feedback: string;
    issues: string[];
    suggestions: string[];
  };
  color_compliance: {
    score: number;
    feedback: string;
    used_colors: string[];
    misaligned_colors: string[];
  };
  guidelines_compliance: {
    score: number;
    feedback: string;
    violations: string[];
  };
  brand_fit: {
    score: number;
    feedback: string;
  };
  summary: string;
  can_proceed: boolean;
  action: 'approve' | 'revise' | 'block';
}

interface ComplianceCheckerProps {
  brandId: string;
  brandProfile?: {
    voiceTone?: string;
    brandPersonality?: string[];
    colorPalette?: { primary: string; secondary: string; accent: string };
    visualStyle?: string;
  };
  content?: {
    copy?: string;
    colors?: string[];
  };
  onCheck?: (score: ComplianceScore) => void;
  autoCheck?: boolean;
}

const ScoreGauge = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const getColor = (s: number) => {
    if (s >= 8) return 'text-emerald-400';
    if (s >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getPercentage = (s: number) => (s / 10) * 100;

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto mb-2`}>
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-700"
        />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${getPercentage(score)} 100`}
          className={`${getColor(score)} transition-all`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px' }}
        />
        <text x="18" y="18" textAnchor="middle" dy=".3em" className={`text-sm font-bold ${getColor(score)}`}>
          {score.toFixed(1)}
        </text>
      </svg>
    </div>
  );
};

export default function ComplianceChecker({
  brandId,
  brandProfile,
  content,
  onCheck,
  autoCheck = false,
}: ComplianceCheckerProps) {
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCompliance = useCallback(async () => {
    if (!content?.copy && content?.colors?.length === 0) {
      setError('No content to check');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          copy: content?.copy,
          colors: content?.colors,
          brand_profile: brandProfile,
        }),
      });

      if (!response.ok) throw new Error('Compliance check failed');

      const data = await response.json();
      setScore(data.compliance);
      onCheck?.(data.compliance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  }, [brandId, content, brandProfile, onCheck]);

  // Auto-check on content change if enabled
  React.useEffect(() => {
    if (autoCheck && content?.copy) {
      const timer = setTimeout(() => checkCompliance(), 500);
      return () => clearTimeout(timer);
    }
  }, [content?.copy, autoCheck, checkCompliance]);

  if (!score) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Brand Compliance Check</h3>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={checkCompliance}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Check Brand Compliance
            </>
          )}
        </button>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    if (action === 'approve') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    if (action === 'revise') return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    return 'bg-red-500/10 border-red-500/30 text-red-300';
  };

  const getActionIcon = (action: string) => {
    if (action === 'approve') return <CheckCircle2 className="w-5 h-5" />;
    if (action === 'revise') return <AlertCircle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Brand Compliance Score
        </h3>

        <div className="flex items-start gap-6">
          {/* Score Gauge */}
          <div className="flex-shrink-0">
            <ScoreGauge score={score.overall_score} size="md" />
            <p className="text-xs text-slate-400 text-center">Overall</p>
          </div>

          {/* Action Badge & Summary */}
          <div className="flex-1">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 ${getActionColor(score.action)}`}>
              {getActionIcon(score.action)}
              <span className="text-sm font-medium capitalize">{score.action}</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">{score.summary}</p>
            <p className="text-xs text-slate-400">{score.brand_fit.feedback}</p>
          </div>
        </div>
      </div>

      {/* Voice Alignment */}
      {score.voice_alignment.issues.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-white">Voice & Tone Alignment</h4>
            <ScoreGauge score={score.voice_alignment.score} size="sm" />
          </div>

          {score.voice_alignment.issues.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs text-slate-400">Issues:</p>
              <ul className="space-y-1">
                {score.voice_alignment.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {score.voice_alignment.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Suggestions:
              </p>
              <ul className="space-y-1">
                {score.voice_alignment.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs text-emerald-300">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Color Compliance */}
      {score.color_compliance.misaligned_colors.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-white">Color Compliance</h4>
            <ScoreGauge score={score.color_compliance.score} size="sm" />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400">Off-brand colors:</p>
            <div className="flex flex-wrap gap-2">
              {score.color_compliance.misaligned_colors.map((color, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded text-xs"
                >
                  <div
                    className="w-4 h-4 rounded border border-slate-500"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-300">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex gap-2">
        <button
          onClick={checkCompliance}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          Re-check
        </button>
        {score.action === 'revise' && (
          <button className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
            Review Suggestions
          </button>
        )}
        {score.action === 'approve' && (
          <button className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
            Approve & Publish
          </button>
        )}
      </div>
    </div>
  );
}
