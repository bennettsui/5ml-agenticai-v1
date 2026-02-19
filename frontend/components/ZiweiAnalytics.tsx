'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Save, Copy, ArrowRight } from 'lucide-react';

interface ChartInput {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
  yearStem: string;
  yearBranch: string;
  gender: string;
  name: string;
  placeOfBirth?: string;
  timezone?: string;
  calendarType?: 'gregorian' | 'lunar';
}

const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

function calculateAge(year: number): number {
  return new Date().getFullYear() - year;
}

export default function ZiweiAnalytics() {
  const [input, setInput] = useState<ChartInput>({
    lunarYear: 1990,
    lunarMonth: 6,
    lunarDay: 15,
    hourBranch: '午',
    yearStem: '庚',
    yearBranch: '午',
    gender: '女',
    name: 'Sample Person',
    placeOfBirth: 'Hong Kong',
    timezone: 'Asia/Hong_Kong',
    calendarType: 'lunar'
  });

  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartId, setChartId] = useState<string | null>(null);

  const currentAge = calculateAge(input.lunarYear);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ziwei/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!response.ok) throw new Error('Calculation failed');
      const data = await response.json();
      setChart(data.chart);
      setChartId(data.chartId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate chart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Ziwei Chart Generator
        </h2>
        <p className="text-sm text-slate-400">Enter your birth information to generate your 命盤 (birth chart)</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">Name</label>
              <input
                type="text"
                value={input.name}
                onChange={(e) => setInput({...input, name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                placeholder="Your name"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">Gender</label>
              <select
                value={input.gender}
                onChange={(e) => setInput({...input, gender: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
              >
                <option value="男">Male (男)</option>
                <option value="女">Female (女)</option>
              </select>
            </div>

            {/* Birth Year */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                Birth Year (農曆) — Age: {currentAge}
              </label>
              <input
                type="number"
                value={input.lunarYear}
                onChange={(e) => setInput({...input, lunarYear: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            {/* Birth Month & Day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Month</label>
                <input
                  type="number"
                  value={input.lunarMonth}
                  onChange={(e) => setInput({...input, lunarMonth: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                  min="1"
                  max="12"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Day</label>
                <input
                  type="number"
                  value={input.lunarDay}
                  onChange={(e) => setInput({...input, lunarDay: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                  min="1"
                  max="30"
                />
              </div>
            </div>

            {/* Hour Branch */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">Hour Branch (時辰)</label>
              <select
                value={input.hourBranch}
                onChange={(e) => setInput({...input, hourBranch: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
              >
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Year Stem & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Year Stem (天干)</label>
                <select
                  value={input.yearStem}
                  onChange={(e) => setInput({...input, yearStem: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                >
                  {stems.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Year Branch (地支)</label>
                <select
                  value={input.yearBranch}
                  onChange={(e) => setInput({...input, yearBranch: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Calculate Chart
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!chart ? (
            <div className="rounded-lg border border-dashed border-slate-700/50 bg-slate-800/30 p-8 text-center flex items-center justify-center min-h-[300px]">
              <div>
                <p className="text-slate-400 mb-2">No chart generated yet</p>
                <p className="text-xs text-slate-500">Fill in your birth info and click Calculate</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-3">Chart Generated</h3>
                <div className="text-sm space-y-2 text-slate-400">
                  <p>Name: <span className="text-white">{input.name}</span></p>
                  <p>Gender: <span className="text-white">{input.gender}</span></p>
                  <p>Birth: <span className="text-white">{input.lunarYear}/{input.lunarMonth}/{input.lunarDay} {input.hourBranch}時</span></p>
                  <p>Age: <span className="text-white">{currentAge} years</span></p>
                  {chartId && <p>Chart ID: <span className="font-mono text-amber-400 text-xs">{chartId}</span></p>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/50 space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  View Full Analysis
                </button>
                <button className="w-full px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Save to Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-slate-700/50 bg-white/[0.02] p-4">
        <p className="text-xs text-slate-400">
          💡 <strong>Note:</strong> Enter your lunar birth date (農曆), gender, and time of birth. The system will calculate your 命盤 using Zhongzhou school (中州派) methods. Results are saved automatically to your chart history.
        </p>
      </div>
    </div>
  );
}
