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
    { id: 'generation', label: '✨ Generation' },
    { id: 'analysis', label: '🔍 Analysis' },
    { id: 'reference', label: '📖 Reference' },
    { id: 'predictions', label: '🔮 Predictions' },
  ];

  const handleStarClick = (palaceId: string, starId: string) => {
    setSelectedStar(starId);
    console.log(`Selected: ${palaceId}/${starId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ================================================================ */}
      {/* TOP BAR                                                           */}
      {/* ================================================================ */}
      <header className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <span className="text-lg font-bold text-amber-400">紫</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ZI WEI ANALYTICS</h1>
              <p className="text-xs text-slate-500">中州派紫微斗數排盤系統</p>
            </div>
          </div>
          {/* Birth Info */}
          <div className="text-right text-sm">
            <div className="text-slate-300">{chart.birth.name || 'Demo Chart'}</div>
            <div className="text-slate-500 text-xs">
              {chart.birth.yearGregorian} · {chart.birth.location}
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <nav className="border-t border-slate-700/50 bg-slate-800/50">
          <div className="max-w-6xl mx-auto px-6 flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* ================================================================ */}
      {/* MAIN CONTENT                                                     */}
      {/* ================================================================ */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'generation' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Birth Chart (命盤)</h2>
            <ZiWeiGrid
              layer={chart.layer}
              visualConfig={defaultStarVisualConfig}
              onStarClick={handleStarClick}
            />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50 text-center text-slate-400">
            <p>Analysis panel coming soon...</p>
            <p className="text-xs mt-2">Will include palace interpretations and relationship analysis</p>
          </div>
        )}

        {activeTab === 'reference' && (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50 text-center text-slate-400">
            <p>Reference guide coming soon...</p>
            <p className="text-xs mt-2">Star meanings, palace interpretations, and traditional rules</p>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50 text-center text-slate-400">
            <p>Predictions coming soon...</p>
            <p className="text-xs mt-2">Yearly forecasts and timing analysis</p>
          </div>
        )}
      </main>

      {/* Selected Star Info (Debug) */}
      {selectedStar && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-amber-500/30 rounded-lg p-4 text-sm text-slate-300 max-w-xs">
          <p className="text-amber-400 font-semibold">Selected Star</p>
          <p>{selectedStar}</p>
          <button
            onClick={() => setSelectedStar(null)}
            className="text-xs mt-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default NatalChartView;
