'use client';

import { useState, useEffect } from 'react';
import { Loader2, ChevronDown, TrendingUp, Heart, Briefcase, Activity, Eye, Bug } from 'lucide-react';
import { ZiweiChartGrid } from './ZiweiChartGrid';
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
  const [chartViewMode, setChartViewMode] = useState<'grid' | 'circular'>('grid');
  const [showDebug, setShowDebug] = useState(false);

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
        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
      </div>
    );
  }

  const birthInfo = selectedChart?.birth_info;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
          🔍 Chart Analysis & Interpretation
        </h2>
        <p className="text-sm text-slate-400">Detailed 命盤 breakdown by palace, star, and life dimension</p>
      </div>

      {/* No charts state */}
      {charts.length === 0 && (
        <div className="p-5 bg-teal-500/10 border border-teal-500/30 rounded-xl">
          <p className="text-sm text-cyan-300">
            No saved charts found. Generate a chart in the <strong>Charts</strong> tab first.
          </p>
        </div>
      )}

      {/* Chart Selector */}
      {charts.length > 0 && (
        <div className="rounded-xl border border-teal-800/30 bg-teal-950/30 p-4">
          <label className="text-xs font-semibold text-slate-400 mb-2 block">Select Chart to Analyze</label>
          <select
            value={selectedChartId || ''}
            onChange={(e) => setSelectedChartId(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#071420]/80 border border-teal-800/40 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            {charts.map(chart => (
              <option key={chart.id} value={chart.id}>
                {chart.name} — {chart.created_at ? new Date(chart.created_at).toLocaleDateString() : 'Unknown date'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Debug panel */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden">
        <button
          onClick={() => setShowDebug(s => !s)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
        >
          <span className="flex items-center gap-1.5"><Bug className="w-3.5 h-3.5" /> Debug Info</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
        </button>
        {showDebug && (
          <div className="px-4 pb-4 space-y-2 text-[11px] font-mono">
            <div className="text-slate-400">
              <span className="text-slate-500">charts loaded: </span>
              <span className="text-cyan-300">{charts.length}</span>
              <span className="text-slate-500 ml-4">selected id: </span>
              <span className="text-cyan-300">{selectedChartId ?? 'none'}</span>
              <span className="text-slate-500 ml-4">loading: </span>
              <span className="text-cyan-300">{String(loading || analysisLoading)}</span>
            </div>
            {selectedChart && (
              <>
                <div className="text-slate-400">
                  <span className="text-slate-500">base_chart keys: </span>
                  <span className="text-emerald-300">{Object.keys(selectedChart.base_chart ?? {}).join(', ') || 'none'}</span>
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">palaces count: </span>
                  <span className="text-emerald-300">{selectedChart.base_chart?.palaces?.length ?? 'N/A'}</span>
                  <span className="text-slate-500 ml-4">five_element_bureau: </span>
                  <span className="text-emerald-300">{String(selectedChart.base_chart?.five_element_bureau ?? 'N/A')}</span>
                </div>
                {selectedChart.base_chart?.palaces?.[0] && (
                  <div className="text-slate-400">
                    <span className="text-slate-500">palace[0] keys: </span>
                    <span className="text-amber-300">{Object.keys(selectedChart.base_chart.palaces[0]).join(', ')}</span>
                  </div>
                )}
                {selectedChart.base_chart?.palaces?.[0] && (
                  <div className="text-slate-400">
                    <span className="text-slate-500">palace[0] sample: </span>
                    <span className="text-amber-300 break-all">
                      {JSON.stringify(selectedChart.base_chart.palaces[0]).slice(0, 200)}
                    </span>
                  </div>
                )}
              </>
            )}
            {!selectedChart && !loading && !analysisLoading && (
              <div className="text-rose-400">No chart loaded yet</div>
            )}
          </div>
        )}
      </div>

      {/* Loading analysis */}
      {analysisLoading && (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
          <span className="text-slate-400 text-sm">Loading analysis...</span>
        </div>
      )}

      {/* Main content when chart is loaded */}
      {selectedChart && !analysisLoading && (
        <div className="space-y-5">

          {/* Visitor info banner */}
          <div className="rounded-xl border border-teal-700/30 bg-gradient-to-r from-teal-900/30 to-cyan-900/20 p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl font-bold text-cyan-300 flex-shrink-0">
                  {(selectedChart.name || '?').charAt(0)}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{selectedChart.name || 'Unknown'}</div>
                  <div className="text-sm text-cyan-300/70">
                    {birthInfo?.lunarYear ? `農曆 ${birthInfo.lunarYear}年` : ''}
                    {birthInfo?.lunarMonth ? ` ${birthInfo.lunarMonth}月` : ''}
                    {birthInfo?.lunarDay ? `${birthInfo.lunarDay}日` : ''}
                    {birthInfo?.hourBranch ? ` · ${birthInfo.hourBranch}時` : ''}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1 text-sm">
                {[
                  { label: 'Gender',    value: birthInfo?.gender === 'M' ? '男 Male' : birthInfo?.gender === 'F' ? '女 Female' : '—' },
                  { label: 'Location',  value: birthInfo?.placeOfBirth || '—' },
                  { label: 'Calendar',  value: birthInfo?.calendarType === 'gregorian' ? '西曆' : '農曆' },
                  { label: 'Generated', value: selectedChart.created_at ? new Date(selectedChart.created_at).toLocaleDateString() : '—' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="text-slate-200 font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart view toggle */}
          <div className="flex items-center gap-2">
            {(['grid', 'circular'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setChartViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  chartViewMode === mode
                    ? 'bg-teal-800/60 text-white border border-teal-600/50'
                    : 'border border-teal-900/40 text-slate-400 hover:text-cyan-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {mode === 'grid' ? 'Grid View' : 'Circular View'}
              </button>
            ))}
          </div>

          {/* Chart Grid */}
          {chartViewMode === 'grid' && selectedChart?.base_chart && (
            <ZiweiChartGrid
              houses={selectedChart.base_chart.palaces || []}
              lifeHouseIndex={selectedChart.base_chart.life_palace?.palace_id ?? 0}
              personName={selectedChart.name || 'Unknown'}
              lunarDate={[
                birthInfo?.lunarYear  ? `${birthInfo.lunarYear}年` : '',
                birthInfo?.lunarMonth ? `${birthInfo.lunarMonth}月` : '',
                birthInfo?.lunarDay   ? `${birthInfo.lunarDay}日`   : '',
                birthInfo?.hourBranch ? `${birthInfo.hourBranch}時` : '',
              ].filter(Boolean).join(' ')}
              gender={birthInfo?.gender === 'M' ? '男' : birthInfo?.gender === 'F' ? '女' : '—'}
              fiveElementBureau={selectedChart.base_chart.five_element_bureau ?? 'Unknown'}
              lifeHouseStem={selectedChart.base_chart.life_palace?.stem}
              lifeHouseBranch={selectedChart.base_chart.life_palace?.branch}
              yearStemBranch={birthInfo ? `${selectedChart.gan_zhi?.yearStem ?? ''}${selectedChart.gan_zhi?.yearBranch ?? ''}` : undefined}
            />
          )}

          {/* Circular View */}
          {chartViewMode === 'circular' && selectedChart?.base_chart && (
            <div className="rounded-xl border border-teal-800/30 bg-teal-950/20 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">命盤 Circular View</h3>
              <div className="flex justify-center overflow-auto max-h-[600px]">
                <ZiweiChartCanvas
                  houses={selectedChart.base_chart.palaces || []}
                  lifeHouseIndex={selectedChart.base_chart.life_palace?.palace_id ?? 0}
                  personName={selectedChart.name || 'Unknown'}
                  birthDate={[
                    birthInfo?.lunarYear  ? `${birthInfo.lunarYear}年` : '',
                    birthInfo?.lunarMonth ? `${birthInfo.lunarMonth}月` : '',
                    birthInfo?.lunarDay   ? `${birthInfo.lunarDay}日`   : '',
                  ].filter(Boolean).join(' ')}
                  hourBranch={birthInfo?.hourBranch || ''}
                  gender={birthInfo?.gender === 'M' ? '男' : birthInfo?.gender === 'F' ? '女' : '—'}
                  fiveElementBureau={String(selectedChart.base_chart.five_element_bureau ?? 'Unknown')}
                  starCount={0}
                />
              </div>
            </div>
          )}

          {/* Life Dimension Analysis */}
          <div className="rounded-xl border border-teal-800/30 bg-teal-950/30 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Life Dimension Analysis</h3>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(Object.keys(dimensionLabels) as LifeDimension[]).map(dim => {
                const Icon = dimensionIcons[dim];
                return (
                  <button
                    key={dim}
                    onClick={() => setActiveDimension(dim)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      activeDimension === dim
                        ? 'bg-teal-800/60 text-white border border-teal-600/50'
                        : 'border border-teal-900/40 text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {dimensionLabels[dim]}
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg bg-teal-900/20 border border-teal-800/20 p-4 min-h-[100px]">
              <p className="text-sm font-medium text-cyan-200 mb-2">{dimensionLabels[activeDimension]}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {analysis?.[activeDimension] || 'Analysis data will be populated when you generate charts with the full interpretation engine.'}
              </p>
            </div>
          </div>

          {/* Palace Analysis */}
          <div className="rounded-xl border border-teal-800/30 bg-teal-950/30 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">宮位分析 Palace Analysis</h3>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {palaceNames.map((palace, idx) => {
                const PALACE_DESC: Record<string, string> = {
                  '命宮': 'Life palace — Core destiny, personality, and overall potential',
                  '官祿宮': 'Career palace — Work, ambitions, and professional achievements',
                  '夫妻宮': 'Marriage palace — Romantic partnerships and intimate relationships',
                  '財帛宮': 'Wealth palace — Finance, income, and material resources',
                  '疾厄宮': 'Health palace — Physical wellbeing and life challenges',
                  '兄弟宮': 'Siblings palace — Peers, close colleagues, and siblings',
                  '子女宮': 'Children palace — Children, creativity, and students',
                  '遷移宮': 'Travel palace — Relocation, overseas luck, and environment',
                  '僕役宮': 'Servants palace — Subordinates and social network',
                  '田宅宮': 'Property palace — Real estate and home environment',
                  '福德宮': 'Fortune palace — Happiness, hobbies, and spiritual life',
                  '父母宮': 'Parents palace — Elders, superiors, and academic life',
                };
                return (
                  <div key={palace} className="border border-teal-900/30 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedPalaces(p => ({ ...p, [palace]: !p[palace] }))}
                      className="w-full flex items-center justify-between p-3 hover:bg-teal-950/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-4 h-4 text-teal-400 transition-transform ${expandedPalaces[palace] ? 'rotate-180' : ''}`} />
                        <span className="font-medium text-sm text-white">{palace}</span>
                      </div>
                      <span className="text-xs text-slate-500">Palace {idx + 1}</span>
                    </button>
                    {expandedPalaces[palace] && (
                      <div className="px-4 pb-3 border-t border-teal-900/30">
                        <p className="text-xs text-slate-400 leading-relaxed pt-2 italic">
                          {PALACE_DESC[palace] || 'Interpretation coming soon'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pattern Recognition */}
          <div className="rounded-xl border border-teal-800/30 bg-teal-950/30 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">🔍 Major Patterns Detected</h3>
            <div className="rounded-lg bg-teal-900/20 border border-teal-800/20 p-4 text-xs text-slate-400">
              Pattern recognition activates when full interpretation data is available from the chart engine.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
