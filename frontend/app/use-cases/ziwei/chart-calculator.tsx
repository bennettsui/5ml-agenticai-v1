'use client';

import { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

      {/* Chart Display */}
      {chart && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-8">
          <h3 className="text-xl font-bold text-white mb-6">Calculated Chart</h3>

          <div className="space-y-6">
            {/* Chart Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-slate-900/50 p-4">
                <div className="text-xs text-slate-500 mb-1">Five-Element Bureau</div>
                <div className="text-2xl font-bold text-amber-400">{chart.fiveElementBureau}</div>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-4">
                <div className="text-xs text-slate-500 mb-1">Life House</div>
                <div className="text-2xl font-bold text-blue-400">{palaceNames[chart.lifeHouseIndex]}</div>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-4">
                <div className="text-xs text-slate-500 mb-1">Body House</div>
                <div className="text-2xl font-bold text-green-400">{palaceNames[chart.bodyHouseIndex]}</div>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-4">
                <div className="text-xs text-slate-500 mb-1">Total Stars</div>
                <div className="text-2xl font-bold text-purple-400">{Object.keys(chart.starPositions).length}</div>
              </div>
            </div>

            {/* 12 Houses Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {chart.houses.map((house: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                  <div className="text-xs font-medium text-slate-400 mb-2">{house.name}</div>
                  <div className="text-xs text-slate-500 mb-3">{house.branch}</div>

                  {/* Major Stars */}
                  {house.majorStars.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-blue-400 mb-1">星</div>
                      <div className="space-y-1">
                        {house.majorStars.map((star: string) => (
                          <div key={star} className="text-xs bg-blue-500/20 text-blue-300 rounded px-2 py-1">
                            {star}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transformations */}
                  {house.transformations.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-amber-400">化</div>
                      <div className="flex gap-1 mt-1">
                        {house.transformations.map((t: string) => (
                          <span key={t} className="text-xs bg-amber-500/20 text-amber-300 rounded px-1.5 py-0.5">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
