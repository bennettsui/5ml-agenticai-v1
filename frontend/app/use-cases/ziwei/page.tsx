'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import GenerationPanel from '@/components/GenerationPanel';
import NatalChartView from '@/components/NatalChartView';
import { NatalChart, BirthData, ZiweiTab } from '@/types/ziwei';
import { demoNatalLayer, demoBirthData } from '@/config/demoNatalLayer';
import { defaultStarVisualConfig } from '@/config/starVisualConfig';
import { convertBirthDataToAPI } from '@/utils/ziweiConvert';

type MainTab = 'generation' | 'analysis';

export default function ZiweiPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('generation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChart, setCurrentChart] = useState<NatalChart>({
    birth: demoBirthData,
    layer: demoNatalLayer,
    calculatedAt: Date.now(),
    version: '1.0.0',
  });

  const handleGenerate = async (birthData: BirthData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert frontend format to API format
      const apiData = convertBirthDataToAPI(birthData);

      // Call the backend API
      const response = await fetch('/api/ziwei/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lunarYear: birthData.yearGregorian,
          lunarMonth: birthData.monthLunar,
          lunarDay: birthData.dayLunar,
          hourBranch: apiData.hour_branch,
          yearStem: apiData.year_stem,
          yearBranch: apiData.year_branch,
          gender: birthData.gender || 'M',
          name: birthData.name || '',
          placeOfBirth: birthData.location || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.chart) {
        throw new Error('Invalid chart data from API');
      }

      // Transform API response to frontend format
      const newChart: NatalChart = {
        birth: birthData,
        layer: demoNatalLayer, // TODO: Transform API palaces to ChartLayer
        calculatedAt: Date.now(),
        version: '1.0.0',
      };

      setCurrentChart(newChart);
      // Auto-switch to analysis tab to show the generated chart
      setActiveTab('analysis');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate chart';
      setError(errorMessage);
      console.error('Chart generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Ziwei Astrology</h1>
              <p className="text-xs text-slate-500">紫微斗數 命盤排列系統</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ================================================================ */}
      {/* TAB NAVIGATION                                                   */}
      {/* ================================================================ */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('generation')}
              className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'generation'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }`}
            >
              ✨ Generation
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'analysis'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }`}
            >
              🔍 Analysis
            </button>
          </div>
        </div>
      </nav>

      {/* ================================================================ */}
      {/* MAIN CONTENT                                                     */}
      {/* ================================================================ */}
      <main className={activeTab === 'generation' ? 'max-w-7xl mx-auto px-4 sm:px-6 py-8' : ''}>
        {/* GENERATION TAB */}
        {activeTab === 'generation' && (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <GenerationPanel onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
        )}

        {/* ANALYSIS TAB - Natal Chart View */}
        {activeTab === 'analysis' && <NatalChartView chart={currentChart} />}
      </main>
    </div>
  );
}
