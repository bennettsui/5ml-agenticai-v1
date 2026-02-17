'use client';

import { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { GeneratedBrandStrategy } from '@/lib/brand-strategy-generator';

interface StrategyPreviewProps {
  strategy: GeneratedBrandStrategy;
}

export default function StrategyPreview({ strategy }: StrategyPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pillars: true,
    postTypes: true,
    calendar: false,
    kpis: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { summary, contentPillars, recommendedPostTypes, monthlyCalendarTemplate, kpiTargets } = strategy;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <div className="text-xs text-slate-500 mb-1">Your Strategy</div>
        <div className="text-sm font-bold text-white leading-tight">{summary.tagline}</div>
      </div>

      {/* Key Insights */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Key Insights
        </div>
        <div className="space-y-2">
          {summary.keyInsights.slice(0, 3).map((insight, i) => (
            <div key={i} className="text-xs text-slate-400 leading-relaxed">
              • {insight}
            </div>
          ))}
        </div>
      </div>

      {/* Content Pillars */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('pillars')}
          className="w-full px-4 py-3 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
        >
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Content Pillars
          </span>
          {expandedSections.pillars ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {expandedSections.pillars && (
          <div className="px-4 pb-3 space-y-2 border-t border-slate-700/30">
            {contentPillars.map((pillar, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-300">{pillar.name}</span>
                  <span className="text-xs font-bold text-purple-400">{pillar.allocation}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${pillar.allocation}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-600">
                  {pillar.postTypes.slice(0, 2).join(', ')}
                  {pillar.postTypes.length > 2 && ` +${pillar.postTypes.length - 2}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Type Distribution */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('postTypes')}
          className="w-full px-4 py-3 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
        >
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Post Type Mix
          </span>
          {expandedSections.postTypes ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {expandedSections.postTypes && (
          <div className="px-4 pb-3 space-y-2 border-t border-slate-700/30">
            {recommendedPostTypes.slice(0, 5).map((type, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 capitalize">{type.postType}</span>
                <div className="flex items-center gap-2">
                  <div className="text-right min-w-8">
                    <div className="font-semibold text-purple-400">{type.count}x</div>
                    <div className="text-[10px] text-slate-600">{type.allocation}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Calendar Preview */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('calendar')}
          className="w-full px-4 py-3 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
        >
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-400" />
            Calendar Preview ({monthlyCalendarTemplate.length} posts)
          </span>
          {expandedSections.calendar ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {expandedSections.calendar && (
          <div className="px-4 pb-3 space-y-1.5 border-t border-slate-700/30 max-h-64 overflow-y-auto">
            {monthlyCalendarTemplate.slice(0, 12).map((post, i) => (
              <div key={i} className="text-[11px] p-1.5 rounded bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="font-medium text-slate-300">{post.date}</span>
                  <span className="text-slate-600 text-[10px]">{post.platform}</span>
                </div>
                <div className="text-slate-400">
                  {post.format} · {post.postType}
                </div>
                <div className="text-slate-600 text-[10px] mt-0.5">{post.title}</div>
              </div>
            ))}
            {monthlyCalendarTemplate.length > 12 && (
              <div className="text-[10px] text-slate-600 text-center py-1">
                ... and {monthlyCalendarTemplate.length - 12} more posts
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Targets */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('kpis')}
          className="w-full px-4 py-3 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
        >
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-400" />
            KPI Targets
          </span>
          {expandedSections.kpis ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {expandedSections.kpis && (
          <div className="px-4 pb-3 space-y-2 border-t border-slate-700/30">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Engagement</div>
                <div className="font-bold text-slate-200">{kpiTargets.engagementRate}%</div>
              </div>
              <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Monthly Reach</div>
                <div className="font-bold text-slate-200">
                  {(kpiTargets.reach / 1000).toFixed(0)}K
                </div>
              </div>
              <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Ad ROAS</div>
                <div className="font-bold text-slate-200">{kpiTargets.adROAS}x</div>
              </div>
              <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Conversion</div>
                <div className="font-bold text-slate-200">{kpiTargets.conversionRate}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-300 mb-2">Recommended Actions</div>
        <div className="space-y-1.5 text-[11px]">
          {summary.recommendations.slice(0, 2).map((rec, i) => (
            <div key={i} className="text-slate-400">
              <span className="text-purple-400">→</span> {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
