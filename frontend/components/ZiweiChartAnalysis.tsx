'use client';

import { useState, useEffect } from 'react';
import { Loader2, ChevronDown, TrendingUp, Heart, Briefcase, Activity } from 'lucide-react';
import { ZiweiChartCanvas } from './ZiweiChartCanvas';

interface SavedChart {
  id: string;
  name: string;
  birth_info?: any;
  gan_zhi?: any;
  base_chart?: any;
  created_at?: string;
}

type LifeDimension = 'career' | 'love' | 'finance' | 'health';

export default function ZiweiChartAnalysis() {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDimension, setActiveDimension] = useState<LifeDimension>('career');
  const [expandedPalaces, setExpandedPalaces] = useState<Record<string, boolean>>({});

  // Load saved charts on mount
  useEffect(() => {
    loadCharts();
  }, []);

  // Load analysis when chart is selected
  useEffect(() => {
    if (selectedChartId) {
      loadChartAnalysis(selectedChartId);
    }
  }, [selectedChartId]);

  const loadCharts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ziwei/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      const data = await response.json();
      setCharts(data.charts || []);
      if (data.charts?.length > 0) {
        setSelectedChartId(data.charts[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load charts');
    } finally {
      setLoading(false);
    }
  };

  const loadChartAnalysis = async (chartId: string) => {
    setAnalysisLoading(true);
    try {
      const response = await fetch(`/api/ziwei/charts/${chartId}`);
      if (!response.ok) throw new Error('Failed to fetch chart');
      const data = await response.json();
      setSelectedChart(data.chart || data);

      // Try to get detailed analysis
      const analysisResponse = await fetch(`/api/ziwei/analyses/${chartId}`);
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData);
      }
    } catch (err) {
      console.error('Error loading chart:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const dimensionIcons: Record<LifeDimension, typeof Briefcase> = {
    career: Briefcase,
    love: Heart,
    finance: TrendingUp,
    health: Activity
  };

  const dimensionLabels: Record<LifeDimension, string> = {
    career: 'Career & Work',
    love: 'Love & Relationships',
    finance: 'Finance & Wealth',
    health: 'Health & Wellness'
  };

  const palaceNames = [
    '命宮', '兄弟宮', '夫妻宮', '子女宮',
    '財帛宮', '疾厄宮', '遷移宮', '僕役宮',
    '官祿宮', '田宅宮', '福德宮', '父母宮'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          📊 Chart Analysis & Interpretation
        </h2>
        <p className="text-sm text-slate-400">Detailed breakdown of your 命盤 (birth chart) by palace, star, and life dimension</p>
      </div>

      {/* Chart Selector */}
      {charts.length > 0 && (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
          <label className="text-xs font-semibold text-slate-300 mb-2 block">Select Chart to Analyze</label>
          <select
            value={selectedChartId || ''}
            onChange={(e) => setSelectedChartId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
          >
            {charts.map(chart => (
              <option key={chart.id} value={chart.id}>
                {chart.name} — {chart.created_at ? new Date(chart.created_at).toLocaleDateString() : 'Unknown date'}
              </option>
            ))}
          </select>
        </div>
      )}

      {charts.length === 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400">No saved charts found. Generate a chart in the <strong>Ziwei Generator</strong> tab first.</p>
        </div>
      )}

      {selectedChart && !analysisLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Visualization (Left) */}
          <div className="lg:col-span-1 rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">命盤 (Birth Chart)</h3>

            {selectedChart?.base_chart && (
              <div className="overflow-auto max-h-[600px]">
                <ZiweiChartCanvas
                  houses={selectedChart.base_chart.palaces || []}
                  lifeHouseIndex={0}
                  personName={selectedChart.name || 'Unknown'}
                  birthDate={`${selectedChart.birth_info?.lunarYear}/${selectedChart.birth_info?.lunarMonth}/${selectedChart.birth_info?.lunarDay}`}
                  hourBranch={selectedChart.birth_info?.hourBranch || ''}
                  gender={selectedChart.birth_info?.gender || ''}
                  fiveElementBureau="Unknown"
                  starCount={0}
                />
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
              <div className="text-xs">
                <p className="text-slate-500">Name: <span className="text-white">{selectedChart.name}</span></p>
                <p className="text-slate-500">Gender: <span className="text-white">{selectedChart.birth_info?.gender}</span></p>
                <p className="text-slate-500">Birth: <span className="text-white">{selectedChart.birth_info?.lunarYear}/{selectedChart.birth_info?.lunarMonth}/{selectedChart.birth_info?.lunarDay}</span></p>
                <p className="text-slate-500">Hour: <span className="text-white">{selectedChart.birth_info?.hourBranch}時</span></p>
              </div>
            </div>
          </div>

          {/* Analysis (Right) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Life Dimension Tabs */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Life Dimension Analysis</h3>

              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {(Object.keys(dimensionLabels) as LifeDimension[]).map(dim => {
                  const Icon = dimensionIcons[dim];
                  return (
                    <button
                      key={dim}
                      onClick={() => setActiveDimension(dim)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        activeDimension === dim
                          ? 'bg-amber-600/80 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {dimensionLabels[dim]}
                    </button>
                  );
                })}
              </div>

              <div className="bg-slate-700/30 rounded p-4 min-h-[120px]">
                <p className="text-sm text-slate-300 mb-2">
                  <strong>{dimensionLabels[activeDimension]}:</strong>
                </p>
                <p className="text-xs text-slate-400">
                  {analysis?.[activeDimension] || 'No detailed analysis available yet. Analysis data will be populated when you generate charts with the full interpretation engine.'}
                </p>
              </div>
            </div>

            {/* Palace-by-Palace Breakdown */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <h3 className="text-sm font-semibold text-white mb-4">宮位分析 (Palace Analysis)</h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {palaceNames.map((palace, idx) => (
                  <div key={palace} className="border border-slate-700/30 rounded bg-slate-700/20">
                    <button
                      onClick={() => setExpandedPalaces(p => ({...p, [palace]: !p[palace]}))}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`w-4 h-4 text-amber-400 transition-transform ${
                            expandedPalaces[palace] ? 'rotate-180' : ''
                          }`}
                        />
                        <span className="font-medium text-sm text-white">{palace}</span>
                      </div>
                      <span className="text-xs text-slate-500">Palace {idx + 1}</span>
                    </button>

                    {expandedPalaces[palace] && (
                      <div className="px-3 pb-3 border-t border-slate-700/30 text-xs text-slate-400 space-y-2">
                        <p className="italic">
                          {palace === '命宮' && 'Life palace - Core destiny and personality'}
                          {palace === '官祿宮' && 'Career palace - Work and professional growth'}
                          {palace === '夫妻宮' && 'Marriage palace - Relationships and partnership'}
                          {palace === '財帛宮' && 'Wealth palace - Finance and material prosperity'}
                          {palace === '疾厄宮' && 'Health palace - Physical wellbeing'}
                          {!['命宮', '官祿宮', '夫妻宮', '財帛宮', '疾厄宮'].includes(palace) && 'Detailed interpretation coming soon'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Recognition */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">🔍 Major Patterns Detected</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400">
                  Analysis feature activates when full interpretation data is available
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {analysisLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin mr-2" />
          <span className="text-slate-400">Loading analysis...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
