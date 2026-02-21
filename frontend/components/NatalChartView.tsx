'use client';

import React, { useState } from 'react';
import { NatalChart, ZiweiTab } from '@/types/ziwei';
import ZiWeiGrid from './ZiWeiGrid';
import { defaultStarVisualConfig } from '@/config/starVisualConfig';
import '@/styles/ziwei-theme.css';

interface NatalChartViewProps {
  chart: NatalChart;
  activeTab?: ZiweiTab;
  onTabChange?: (tab: ZiweiTab) => void;
}

/**
 * NatalChartView Component
 * Main display for a single natal chart (命盤)
 *
 * Includes:
 * - Top bar with product name and tabs
 * - ZiWeiGrid showing all 12 palaces
 * - Tab content for different views (Main Chart / Analysis / History)
 */
export const NatalChartView: React.FC<NatalChartViewProps> = ({
  chart,
  activeTab = 'generation',
  onTabChange,
}) => {
  const [selectedStar, setSelectedStar] = useState<string | null>(null);

  const tabs: { id: ZiweiTab; label: string }[] = [
    { id: 'generation', label: '✨ Chart' },
    { id: 'analysis', label: '🔍 Analysis' },
    { id: 'predictions', label: '🔮 Predictions' },
  ];

  const handleStarClick = (palaceId: string, starId: string) => {
    setSelectedStar(starId);
    console.log(`Selected: ${palaceId}/${starId}`);
  };

  return (
    <div className="space-y-4">
      {/* Visitor info bar — no standalone page header, embeddable */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-purple-800/30 bg-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-purple-300">紫</span>
          </div>
          <div>
            <div className="font-semibold text-white">{chart.birth.name || '命盤'}</div>
            <div className="text-xs text-purple-400/70">
              {chart.birth.yearGregorian}年 · {chart.birth.location || '中州派紫微斗數'}
            </div>
          </div>
        </div>
        {/* Inner view tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-700/60 text-purple-200 border border-purple-600/50'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-purple-900/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart content */}
      {activeTab === 'generation' && (
        <div>
          <h2 className="text-base font-bold text-white mb-4">命盤 Birth Chart</h2>
          <ZiWeiGrid
            layer={chart.layer}
            visualConfig={defaultStarVisualConfig}
            onStarClick={handleStarClick}
          />
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-8 text-center">
          <p className="text-purple-300 font-medium mb-2">Analysis — In Development</p>
          <p className="text-xs text-slate-400">Palace interpretations and relationship analysis coming soon</p>
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-8 text-center">
          <p className="text-purple-300 font-medium mb-2">Predictions — In Development</p>
          <p className="text-xs text-slate-400">Yearly forecasts and timing analysis coming soon</p>
        </div>
      )}

      {/* Selected Star Info */}
      {selectedStar && (
        <div className="p-3 rounded-xl border border-purple-700/30 bg-purple-900/20 text-sm text-slate-300 flex items-center justify-between">
          <span><span className="text-purple-300 font-semibold">Selected: </span>{selectedStar}</span>
          <button
            onClick={() => setSelectedStar(null)}
            className="text-xs px-2 py-1 bg-purple-900/50 hover:bg-purple-800/50 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default NatalChartView;
