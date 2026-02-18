'use client';

import { useState } from 'react';
import { Sparkles, Loader, Brain } from 'lucide-react';

interface ChartInput {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
  yearStem: string;
  yearBranch: string;
  gender: string;
  name: string;
}

const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const palaceNames = ['命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮', '遷移宮', '僕役宮', '官祿宮', '田宅宮', '福德宮', '父母宮'];

// Palace Card Component - Displays individual palace with stars
function PalaceCard({ house, ageMarkers, compact }: { house: any; ageMarkers: number[]; compact?: boolean }) {
  const starColors = {
    primary: 'text-blue-300 bg-blue-500/20',
    secondary: 'text-teal-300 bg-teal-500/20',
    transformation: 'text-amber-300 bg-amber-500/20',
    calamity: 'text-red-300 bg-red-500/20',
  };

  if (compact) {
    return (
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
        <div className="text-xs font-bold text-white mb-1">{house.name}</div>
        <div className="text-[10px] text-slate-500 mb-2">{house.branch}</div>
        {house.majorStars && house.majorStars.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {house.majorStars.slice(0, 3).map((star: string) => (
              <span key={star} className={`text-[9px] px-1.5 py-0.5 rounded ${starColors.primary}`}>
                {star}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 min-h-32">
      {/* Palace Header */}
      <div className="mb-3 pb-2 border-b border-slate-700/30">
        <div className="text-sm font-bold text-white">{house.name}</div>
        <div className="text-xs text-slate-500">{house.branch}</div>
      </div>

      {/* Age Markers */}
      <div className="text-[9px] text-slate-600 mb-2 leading-tight">
        <div>{ageMarkers.slice(0, 4).join(' ')}</div>
        <div>{ageMarkers.slice(4, 8).join(' ')}</div>
      </div>

      {/* Stars */}
      {house.majorStars && house.majorStars.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {house.majorStars.map((star: string) => (
            <span
              key={star}
              className={`text-[10px] px-2 py-1 rounded font-medium ${starColors.primary}`}
            >
              {star}
            </span>
          ))}
        </div>
      )}

      {/* Transformations */}
      {house.transformations && house.transformations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {house.transformations.map((t: string) => (
            <span
              key={t}
              className={`text-[10px] px-1.5 py-0.5 rounded ${starColors.transformation}`}
            >
              化{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartCalculator() {
  const [input, setInput] = useState<ChartInput>({
    lunarYear: 1990,
    lunarMonth: 6,
    lunarDay: 15,
    hourBranch: '午',
    yearStem: '庚',
    yearBranch: '午',
    gender: '女',
    name: 'Sample'
  });

  const [chart, setChart] = useState<any>(null);
  const [interpretations, setInterpretations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [interpretLoading, setInterpretLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setChart(null);
    setInterpretations(null);
    try {
      const response = await fetch('/api/ziwei/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error('Chart calculation failed');
      }

      const data = await response.json();
      setChart(data.chart);

      // Auto-generate interpretations
      if (data.chart) {
        await generateInterpretations(data.chart, data.chartId);
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

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Calculate Your Birth Chart
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">年 Year</label>
            <input
              type="number"
              value={input.lunarYear}
              onChange={(e) => setInput({ ...input, lunarYear: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">月 Month</label>
            <select
              value={input.lunarMonth}
              onChange={(e) => setInput({ ...input, lunarMonth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">日 Day</label>
            <select
              value={input.lunarDay}
              onChange={(e) => setInput({ ...input, lunarDay: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              {Array.from({ length: 30 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}日</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">時 Hour</label>
            <select
              value={input.hourBranch}
              onChange={(e) => setInput({ ...input, hourBranch: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              {branches.map((b) => (
                <option key={b} value={b}>{b}時</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">年干 Stem</label>
            <select
              value={input.yearStem}
              onChange={(e) => setInput({ ...input, yearStem: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              {stems.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">年支 Branch</label>
            <select
              value={input.yearBranch}
              onChange={(e) => setInput({ ...input, yearBranch: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">性別 Gender</label>
            <select
              value={input.gender}
              onChange={(e) => setInput({ ...input, gender: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">名字 Name</label>
            <input
              type="text"
              value={input.name}
              onChange={(e) => setInput({ ...input, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Calculate Chart
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Chart Display - Traditional 4x3 Grid Layout */}
      {chart && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-8">
          <h3 className="text-xl font-bold text-white mb-8">命盤 Birth Chart (紫微斗數排盤)</h3>

          {/* Chart Container */}
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/30">
            {/* 12-Palace Grid (4 cols x 3 rows) */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {/* Row 1: Top 4 palaces */}
              {[0, 1, 2, 3].map((idx) => (
                <PalaceCard key={idx} house={chart.houses[idx]} ageMarkers={[6, 18, 30, 42, 54, 66, 78, 90]} />
              ))}
            </div>

            {/* Center Info + Middle Row */}
            <div className="flex gap-4 mb-8">
              {/* Left Column - Palaces 11, 10, 9 */}
              <div className="flex flex-col gap-2 flex-1">
                {[11, 10, 9].map((idx) => (
                  <PalaceCard key={idx} house={chart.houses[idx]} ageMarkers={[6, 18, 30, 42, 54, 66, 78, 90]} compact />
                ))}
              </div>

              {/* Center Info Box */}
              <div className="w-48 flex-shrink-0 bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                <div className="text-center text-xs space-y-2">
                  <div className="font-bold text-white text-sm">{input.name}</div>
                  <div className="text-slate-400">
                    {input.lunarYear}年 {input.lunarMonth}月 {input.lunarDay}日
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {input.hourBranch}時 {input.gender}
                  </div>
                  <div className="border-t border-slate-700/30 pt-2 mt-2">
                    <div className="text-amber-400 font-medium">
                      {palaceNames[chart.lifeHouseIndex]}
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      五行: {chart.fiveElementBureau}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Palaces 4, 5, 6 */}
              <div className="flex flex-col gap-2 flex-1">
                {[4, 5, 6].map((idx) => (
                  <PalaceCard key={idx} house={chart.houses[idx]} ageMarkers={[6, 18, 30, 42, 54, 66, 78, 90]} compact />
                ))}
              </div>
            </div>

            {/* Row 3: Bottom 4 palaces */}
            <div className="grid grid-cols-4 gap-2">
              {[8, 7, 6, 5].map((idx) => (
                <PalaceCard key={idx} house={chart.houses[idx]} ageMarkers={[6, 18, 30, 42, 54, 66, 78, 90]} />
              ))}
            </div>
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
              <div className="text-xs text-slate-500">Body Palace</div>
              <div className="text-sm font-bold text-green-400">{palaceNames[chart.bodyHouseIndex]}</div>
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
    </div>
  );
}
