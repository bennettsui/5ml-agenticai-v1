'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader, Brain, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ZiweiCustomSelect } from '@/components/ZiweiCustomSelect';
import { ZiweiTimeSelector } from '@/components/ZiweiTimeSelector';
import { ZiweiChartGrid } from '@/components/ZiweiChartGrid';
import ZiweiChartSummary from '@/components/ZiweiChartSummary';

interface ChartInput {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
  gender: string;
  name: string;
  placeOfBirth?: string;
  timezone?: string;
  calendarType?: 'gregorian' | 'lunar';
}

const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const palaceNames = ['命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮', '遷移宮', '僕役宮', '官祿宮', '田宅宮', '福德宮', '父母宮'];

// Helper function to calculate age
function calculateAge(year: number): number {
  return new Date().getFullYear() - year;
}

// Calculate year stem and branch from lunar year
// Formula: (year - 4) % 10 = stem index, (year - 4) % 12 = branch index
function calculateYearStemBranch(lunarYear: number): { stem: string; branch: string } {
  const stemIndex = (lunarYear - 4) % 10;
  const branchIndex = (lunarYear - 4) % 12;
  return {
    stem: stems[stemIndex],
    branch: branches[branchIndex]
  };
}

// Timezone mapping for common cities
const TIMEZONES: Record<string, string> = {
  'Hong Kong': 'Asia/Hong_Kong',
  '香港': 'Asia/Hong_Kong',
  'Taiwan': 'Asia/Taipei',
  '台灣': 'Asia/Taipei',
  'Beijing': 'Asia/Shanghai',
  '北京': 'Asia/Shanghai',
  'Shanghai': 'Asia/Shanghai',
  '上海': 'Asia/Shanghai',
  'Singapore': 'Asia/Singapore',
  '新加坡': 'Asia/Singapore',
};

export function ChartCalculator() {
  const searchParams = useSearchParams();
  const chartId = searchParams?.get('chartId');

  const [input, setInput] = useState<ChartInput>({
    lunarYear: new Date().getFullYear(),
    lunarMonth: 1,
    lunarDay: 1,
    hourBranch: '子',
    gender: '男',
    name: '',
    placeOfBirth: '',
    timezone: 'UTC',
    calendarType: 'lunar'
  });

  const [chart, setChart] = useState<any>(null);
  const [interpretations, setInterpretations] = useState<any>(null);
  const [ruleEvaluation, setRuleEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [interpretLoading, setInterpretLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedChartData, setLoadedChartData] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(true);

  const currentAge = calculateAge(input.lunarYear);

  // Load chart data from URL parameter
  useEffect(() => {
    if (chartId) {
      loadChartData(chartId);
    }
  }, [chartId]);

  const loadChartData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ziwei/charts/${id}`);
      if (!response.ok) throw new Error('Failed to load chart');

      const data = await response.json();
      const chartData = data.chart; // API wraps in 'chart' object
      setLoadedChartData(chartData);

      // Parse birth_info if it's a string (from database)
      const birthInfo = typeof chartData.birth_info === 'string'
        ? JSON.parse(chartData.birth_info)
        : chartData.birth_info;

      // Pre-fill the form with the loaded chart data
      if (birthInfo) {
        setInput({
          lunarYear: birthInfo.lunarYear,
          lunarMonth: birthInfo.lunarMonth,
          lunarDay: birthInfo.lunarDay,
          hourBranch: birthInfo.hourBranch,
          gender: birthInfo.gender,
          name: chartData.name || birthInfo.name,
          placeOfBirth: birthInfo.placeOfBirth,
          timezone: birthInfo.timezone,
          calendarType: birthInfo.calendarType
        });
      }

      // Load the chart automatically - parse chart_data if it's a string
      if (chartData.chart_data) {
        const chartDataParsed = typeof chartData.chart_data === 'string'
          ? JSON.parse(chartData.chart_data)
          : chartData.chart_data;
        setChart(chartDataParsed);
        // Auto-generate interpretations
        await generateInterpretations(chartDataParsed, id);
        await evaluateRules(chartDataParsed);
      }
    } catch (err: any) {
      console.error('Error loading chart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setChart(null);
    setInterpretations(null);
    setRuleEvaluation(null);
    try {
      // Auto-calculate year stem and branch
      const { stem, branch } = calculateYearStemBranch(input.lunarYear);
      const payload = {
        ...input,
        yearStem: stem,
        yearBranch: branch
      };

      const response = await fetch('/api/ziwei/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Chart calculation failed');
      }

      const data = await response.json();
      setChart(data.chart);

      // Auto-generate interpretations and evaluate rules
      if (data.chart) {
        await generateInterpretations(data.chart, data.chartId);
        await evaluateRules(data.chart);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInterpretations = async (chartData: any, chartId?: string) => {
    setInterpretLoading(true);
    try {
      const response = await fetch('/api/ziwei/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart: chartData,
          chartId,
          consensusLevel: 'consensus'
        })
      });

      if (!response.ok) {
        throw new Error('Interpretation generation failed');
      }

      const data = await response.json();
      setInterpretations(data);
    } catch (err: any) {
      console.error('Interpretation error:', err);
    } finally {
      setInterpretLoading(false);
    }
  };

  const evaluateRules = async (chartData: any) => {
    setRulesLoading(true);
    try {
      const response = await fetch('/api/ziwei/evaluate-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart: chartData,
          minConsensus: 'consensus'
        })
      });

      if (!response.ok) {
        console.warn('Rule evaluation failed:', await response.text());
        return;
      }

      const data = await response.json();
      setRuleEvaluation(data.evaluation);
    } catch (err: any) {
      console.error('Rule evaluation error:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          計算紫微排盤 Calculate Your Birth Chart
        </h3>

        {/* Personal Information Section */}
        <div className="space-y-4 mb-6 pb-6 border-b border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300">📋 基本信息 Personal Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">名字 Name *</label>
              <input
                type="text"
                value={input.name}
                onChange={(e) => setInput({ ...input, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <ZiweiCustomSelect
                label="性別 Gender *"
                value={input.gender}
                onChange={(value) => setInput({ ...input, gender: String(value) })}
                options={[
                  { value: '男', label: '男 Male' },
                  { value: '女', label: '女 Female' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">年齡 Current Age</label>
              <div className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/50 text-slate-300 text-sm flex items-center">
                <span className="text-white font-semibold">{currentAge}</span>
                <span className="ml-2 text-xs text-slate-500">years old</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">出生地 Place of Birth *</label>
            <input
              type="text"
              value={input.placeOfBirth || ''}
              onChange={(e) => {
                const place = e.target.value;
                setInput({
                  ...input,
                  placeOfBirth: place,
                  timezone: TIMEZONES[place] || input.timezone
                });
              }}
              placeholder="e.g., Hong Kong / 香港"
              list="places"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
            />
            <datalist id="places">
              {Object.keys(TIMEZONES).map(place => (
                <option key={place} value={place} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Birth Date Section */}
        <div className="space-y-4 mb-6 pb-6 border-b border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300">📅 出生日期 Birth Date</h4>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInput({ ...input, calendarType: 'lunar' })}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                input.calendarType === 'lunar' || !input.calendarType
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              農曆 Lunar
            </button>
            <button
              onClick={() => setInput({ ...input, calendarType: 'gregorian' })}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                input.calendarType === 'gregorian'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              西曆 Gregorian
            </button>
            <span className="text-xs text-slate-500 ml-auto self-center">
              💡 Tip: Use 萬年曆 (perpetual calendar) to convert Gregorian to Lunar
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">年 Year *</label>
              <input
                type="number"
                value={input.lunarYear}
                onChange={(e) => setInput({ ...input, lunarYear: parseInt(e.target.value) })}
                min="1900"
                max="2100"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <ZiweiCustomSelect
                label="月 Month *"
                value={input.lunarMonth}
                onChange={(value) => setInput({ ...input, lunarMonth: Number(value) })}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i + 1,
                  label: `${i + 1}月`
                }))}
              />
            </div>
            <div>
              <ZiweiCustomSelect
                label="日 Day *"
                value={input.lunarDay}
                onChange={(value) => setInput({ ...input, lunarDay: Number(value) })}
                options={Array.from({ length: 30 }, (_, i) => ({
                  value: i + 1,
                  label: `${i + 1}日`
                }))}
              />
            </div>
            <div>
              <ZiweiTimeSelector
                label="時 Time (Hour Branch) *"
                value={input.hourBranch}
                onChange={(value) => setInput({ ...input, hourBranch: value })}
              />
            </div>
          </div>
        </div>

        {/* Note: Year Stem-Branch (天干地支) is auto-calculated and will be editable in the advanced circular method (coming soon) */}

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              計算中 Calculating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              計算排盤 Calculate Chart
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Chart Summary (When loaded from library) */}
      {loadedChartData && showSummary && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">📊 Chart Summary</h3>
            <button
              onClick={() => setShowSummary(false)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          <ZiweiChartSummary
            name={loadedChartData.name || input.name}
            lunarYear={input.lunarYear}
            lunarMonth={input.lunarMonth}
            lunarDay={input.lunarDay}
            hourBranch={input.hourBranch}
            gender={input.gender}
            placeOfBirth={input.placeOfBirth}
            gan_zhi={loadedChartData.gan_zhi}
            created_at={loadedChartData.created_at}
          />
        </div>
      )}

      {/* Chart Display - Canvas-Based Rendering */}
      {chart && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-8">
          <h3 className="text-xl font-bold text-white mb-8">命盤 Birth Chart (紫微斗數排盤)</h3>

          {/* Grid Chart Display */}
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/30 overflow-x-auto">
            <ZiweiChartGrid
              houses={chart.houses}
              lifeHouseIndex={chart.lifeHouseIndex}
              personName={input.name}
              birthDate={`${input.lunarYear}年 ${input.lunarMonth}月 ${input.lunarDay}日`}
              hourBranch={input.hourBranch}
              gender={input.gender}
              fiveElementBureau={chart.fiveElementBureau}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-500">Total Stars</div>
              <div className="text-xl font-bold text-purple-400">{Object.keys(chart.starPositions).length}</div>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-500">Life Palace</div>
              <div className="text-sm font-bold text-blue-400">{palaceNames[chart.lifeHouseIndex]}</div>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-500">Five Elements</div>
              <div className="text-sm font-bold text-amber-400">{chart.fiveElementBureau}</div>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-500">Year Stem-Branch</div>
              <div className="text-sm font-bold text-teal-400">
                {(() => {
                  const { stem, branch } = calculateYearStemBranch(input.lunarYear);
                  return `${stem}${branch}`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interpretations Display */}
      {interpretations && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-400" />
            Chart Interpretations
          </h3>

          {interpretLoading && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader className="w-4 h-4 animate-spin" />
              Generating interpretations...
            </div>
          )}

          {!interpretLoading && interpretations.grouped && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <div className="text-xs text-slate-500 mb-1">Total</div>
                  <div className="text-xl font-bold text-blue-400">
                    {interpretations.summary.totalInterpretations}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <div className="text-xs text-slate-500 mb-1">Consensus</div>
                  <div className="text-xl font-bold text-green-400">
                    {interpretations.summary.filteredCount}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <div className="text-xs text-slate-500 mb-1">Dimensions</div>
                  <div className="text-xl font-bold text-purple-400">
                    {interpretations.summary.dimensionCount}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <div className="text-xs text-slate-500 mb-1">Confidence</div>
                  <div className="text-xl font-bold text-amber-400">
                    {(interpretations.summary.avgConfidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Grouped Interpretations */}
              <div className="space-y-4">
                {interpretations.grouped.map((group: any) => (
                  <div key={group.dimension} className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white">{group.dimension}</h4>
                      <span className="text-xs text-slate-400">
                        {(group.avgConfidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.interpretations.map((interp: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-sm text-slate-300 bg-slate-800/50 rounded px-3 py-2 border-l-2 border-teal-500"
                        >
                          {interp.text}
                          <div className="text-xs text-slate-500 mt-1">
                            {interp.consensus === 'consensus' && '✓ Consensus'} • {interp.scope}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rule Evaluation Display */}
      {ruleEvaluation && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Pattern Recognition & Star Groups (格局星群分析)
          </h3>

          {rulesLoading && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader className="w-4 h-4 animate-spin" />
              Evaluating patterns...
            </div>
          )}

          {!rulesLoading && ruleEvaluation.results && (
            <div className="space-y-6">
              {/* Statistics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-slate-900/50 p-4">
                  <div className="text-xs text-slate-500 mb-1">Matched Rules</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {ruleEvaluation.results.length}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-4">
                  <div className="text-xs text-slate-500 mb-1">Total Rules</div>
                  <div className="text-2xl font-bold text-slate-400">
                    {ruleEvaluation.totalRules}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-4">
                  <div className="text-xs text-slate-500 mb-1">Match Rate</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {ruleEvaluation.matchPercentage}%
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-4">
                  <div className="text-xs text-slate-500 mb-1">Avg Confidence</div>
                  <div className="text-2xl font-bold text-green-400">
                    {(parseFloat(ruleEvaluation.stats?.avgConfidence || '0') * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Summary - Dominant Patterns */}
              {ruleEvaluation.summary?.dominantPatterns && ruleEvaluation.summary.dominantPatterns.length > 0 && (
                <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-4">
                  <h4 className="font-semibold text-white mb-2">🎯 Dominant Patterns (主格局)</h4>
                  <div className="flex flex-wrap gap-2">
                    {ruleEvaluation.summary.dominantPatterns.map((pattern: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium"
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Rules List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Matched Patterns:</h4>
                {ruleEvaluation.results.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4"
                  >
                    {/* Rule Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-white">{result.ruleName}</h5>
                        <p className="text-xs text-slate-400 mt-1">
                          {result.interpretation.zh}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-400">
                          {(result.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-slate-500">
                          {result.consensusLabel === 'consensus' ? '✓' : '?'} {result.consensusLabel}
                        </div>
                      </div>
                    </div>

                    {/* Relevant Stars & Palaces */}
                    {(result.relevantStars?.length > 0 || result.relevantPalaces?.length > 0) && (
                      <div className="flex flex-wrap gap-4 mt-3 text-xs">
                        {result.relevantStars?.length > 0 && (
                          <div>
                            <span className="text-slate-500">Stars: </span>
                            <span className="text-blue-300">{result.relevantStars.join(', ')}</span>
                          </div>
                        )}
                        {result.relevantPalaces?.length > 0 && (
                          <div>
                            <span className="text-slate-500">Palaces: </span>
                            <span className="text-amber-300">{result.relevantPalaces.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
