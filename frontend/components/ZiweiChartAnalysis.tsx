'use client';

import { useState, useEffect } from 'react';
import { Loader2, ChevronDown, TrendingUp, Heart, Briefcase, Activity, Bug, RefreshCw } from 'lucide-react';
import { ZiweiChartCanvas } from './ZiweiChartCanvas';
import ZiweiChartSteps from './ZiweiChartSteps';

interface SavedChart {
  id:          string;
  name:        string;
  birth_info?: Record<string, unknown>;
  gan_zhi?:    Record<string, string>;
  base_chart?: Record<string, unknown>;
  created_at?: string;
}

type LifeDimension = 'career' | 'love' | 'finance' | 'health';

const DIMENSION_ICONS: Record<LifeDimension, typeof Briefcase> = {
  career: Briefcase, love: Heart, finance: TrendingUp, health: Activity,
};
const DIMENSION_LABELS: Record<LifeDimension, string> = {
  career:  '事業 Career',
  love:    '感情 Love',
  finance: '財運 Finance',
  health:  '健康 Health',
};

const BUREAU_LABEL: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局',
};

export default function ZiweiChartAnalysis() {
  const [charts,          setCharts]          = useState<SavedChart[]>([]);
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [selectedChart,   setSelectedChart]   = useState<Record<string, unknown> | null>(null);
  const [analysis,        setAnalysis]        = useState<Record<string, string> | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [chartLoading,    setChartLoading]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [activeDim,       setActiveDim]       = useState<LifeDimension>('career');
  const [expandedPalace,  setExpandedPalace]  = useState<string | null>(null);
  const [showDebug,       setShowDebug]       = useState(false);

  useEffect(() => { loadCharts(); }, []);
  useEffect(() => { if (selectedId) loadChart(selectedId); }, [selectedId]);

  async function loadCharts() {
    setLoading(true);
    try {
      const res  = await fetch('/api/ziwei/charts');
      const data = await res.json() as { charts?: SavedChart[] };
      const list = data.charts ?? [];
      setCharts(list);
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load charts');
    } finally {
      setLoading(false);
    }
  }

  async function loadChart(id: string) {
    setChartLoading(true);
    try {
      const res  = await fetch(`/api/ziwei/charts/${id}`);
      const data = await res.json() as { chart?: Record<string, unknown> };
      setSelectedChart(data.chart ?? null);
      // Try to load AI analysis (non-fatal if missing)
      const aRes = await fetch(`/api/ziwei/analyses/${id}`).catch(() => null);
      if (aRes?.ok) setAnalysis(await aRes.json() as Record<string, string>);
    } catch (e) {
      console.error('loadChart error:', e);
    } finally {
      setChartLoading(false);
    }
  }

  // ── Derived chart data ────────────────────────────────────────────────
  const baseChart  = selectedChart?.base_chart as Record<string, unknown> | undefined;
  const birthInfo  = selectedChart?.birth_info as Record<string, unknown> | undefined;
  const lifePalace = baseChart?.life_palace  as Record<string, string>  | undefined;
  const bureauNum  = baseChart?.five_element_bureau as number | undefined;
  const bureauText = bureauNum ? (BUREAU_LABEL[bureauNum] ?? `${bureauNum}局`) : '—';

  const lunarDate = [
    birthInfo?.lunarYear  ? `${birthInfo.lunarYear}年`  : '',
    birthInfo?.lunarMonth ? `${birthInfo.lunarMonth}月` : '',
    birthInfo?.lunarDay   ? `${birthInfo.lunarDay}日`   : '',
  ].filter(Boolean).join(' ');

  const palaces = (baseChart?.palaces as Record<string, unknown>[] | undefined) ?? [];

  const PALACE_DESC: Record<string, string> = {
    '命宮': '核心命格、個性潛能',
    '兄弟宮': '兄弟姊妹、同僚關係',
    '夫妻宮': '婚姻感情、伴侶關係',
    '子女宮': '子女、創意、下屬',
    '財帛宮': '財運、收入、理財',
    '疾厄宮': '健康、意外、疾病',
    '遷移宮': '遷移、出行、外在表現',
    '奴僕宮': '部屬、朋友、貴人',
    '官祿宮': '事業、工作、成就',
    '田宅宮': '不動產、家庭環境',
    '福德宮': '福氣、享受、精神生活',
    '父母宮': '父母、上司、文書',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">🔍 命盤分析 Chart Analysis</h2>
          <p className="text-xs text-slate-400 mt-0.5">算法知識庫輸出 · Ziwei algorithm output</p>
        </div>
        <button
          onClick={loadCharts}
          className="p-1.5 rounded-lg hover:bg-teal-900/40 text-slate-500 hover:text-teal-400 transition-colors"
          title="Refresh chart list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {charts.length === 0 && (
        <div className="p-5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-sm text-cyan-300">
          No saved charts. Generate one in the <strong>✨ Charts</strong> tab first.
        </div>
      )}

      {charts.length > 0 && (
        <div className="flex gap-6 items-start">

          {/* ============================================================ */}
          {/* LEFT COLUMN — canvas chart + step-by-step                   */}
          {/* ============================================================ */}
          <div className="flex-1 min-w-0 space-y-4">

            {chartLoading && (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                <span className="text-slate-400 text-sm">Loading chart…</span>
              </div>
            )}

            {selectedChart && baseChart && !chartLoading && (
              <>
                {/* Canvas chart */}
                <div className="rounded-xl border border-teal-800/30 bg-[#070f18] p-3">
                  <ZiweiChartCanvas
                    houses={(baseChart.palaces as Record<string, unknown>[])?.map(p => ({
                      palace_id:       p.palace_id as number,
                      palace_name:     p.palace_name as string,
                      branch:          p.branch as string,
                      stem:            p.stem as string,
                      stem_branch:     p.stem_branch as string,
                      major_stars:     (p.major_stars as string[]) ?? [],
                      transformations: (p.transformations as Record<string, string>) ?? {},
                    })) ?? []}
                    lifePalaceBranch={lifePalace?.branch}
                    personName={selectedChart.name as string || 'Unknown'}
                    lunarDate={lunarDate}
                    hourBranch={birthInfo?.hourBranch as string || ''}
                    gender={birthInfo?.gender === 'M' ? '男' : birthInfo?.gender === 'F' ? '女' : '—'}
                    fiveElementBureau={bureauNum ?? 'Unknown'}
                    lifeStemBranch={lifePalace?.stem_branch}
                  />
                </div>

                {/* Step-by-step */}
                <ZiweiChartSteps baseChart={baseChart as Parameters<typeof ZiweiChartSteps>[0]['baseChart']} />
              </>
            )}

            {/* Debug panel */}
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden">
              <button
                onClick={() => setShowDebug(s => !s)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-600 hover:text-slate-400 hover:bg-slate-800/30 transition-colors"
              >
                <span className="flex items-center gap-1.5"><Bug className="w-3.5 h-3.5" /> Debug</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
              </button>
              {showDebug && selectedChart && (
                <div className="px-4 pb-4 space-y-1 text-[10px] font-mono">
                  <div className="text-slate-500">base_chart keys: <span className="text-emerald-400">{Object.keys(baseChart ?? {}).join(', ')}</span></div>
                  <div className="text-slate-500">palaces: <span className="text-emerald-400">{palaces.length}</span> · bureau: <span className="text-emerald-400">{String(bureauNum)}</span></div>
                  <div className="text-slate-500">life_palace: <span className="text-amber-400">{JSON.stringify(lifePalace)}</span></div>
                  {palaces[0] && (
                    <div className="text-slate-500">palace[0] keys: <span className="text-amber-400">{Object.keys(palaces[0]).join(', ')}</span></div>
                  )}
                  {palaces[0] && (
                    <div className="text-slate-500 break-all">palace[0]: <span className="text-amber-400">{JSON.stringify(palaces[0]).slice(0, 300)}</span></div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN — selector + analysis panels (sticky)          */}
          {/* ============================================================ */}
          <div className="w-72 flex-shrink-0 space-y-4 sticky top-[130px] self-start">

            {/* Chart selector */}
            <div className="rounded-xl border border-teal-800/30 bg-teal-950/30 p-4">
              <label className="text-xs font-semibold text-slate-400 mb-2 block">命盤選擇</label>
              <select
                value={selectedId || ''}
                onChange={e => { setSelectedId(e.target.value); setAnalysis(null); }}
                className="w-full px-3 py-2 bg-[#071420]/80 border border-teal-800/40 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                {charts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.created_at ? new Date(c.created_at).toLocaleDateString() : '?'}
                  </option>
                ))}
              </select>
            </div>

            {/* Person info banner */}
            {selectedChart && (
              <div className="rounded-xl border border-teal-700/30 bg-teal-900/20 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-lg font-bold text-cyan-300 flex-shrink-0">
                    {(selectedChart.name as string || '?').charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{selectedChart.name as string || 'Unknown'}</div>
                    <div className="text-xs text-cyan-300/70">{bureauText} · {lifePalace?.stem_branch ?? '—'}命</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {[
                    { l: '性別',   v: birthInfo?.gender === 'M' ? '男' : '女'   },
                    { l: '農曆',   v: lunarDate                                  },
                    { l: '時辰',   v: `${birthInfo?.hourBranch as string}時`     },
                    { l: '出生地', v: birthInfo?.placeOfBirth as string || '—'  },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div className="text-slate-500">{l}</div>
                      <div className="text-slate-200 font-medium">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Life dimension analysis */}
            {selectedChart && (
              <div className="rounded-xl border border-teal-800/30 bg-teal-950/30 p-4">
                <h3 className="text-xs font-semibold text-white mb-3">人生維度 Life Dimensions</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(Object.keys(DIMENSION_LABELS) as LifeDimension[]).map(dim => {
                    const Icon = DIMENSION_ICONS[dim];
                    return (
                      <button
                        key={dim}
                        onClick={() => setActiveDim(dim)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          activeDim === dim
                            ? 'bg-teal-700/60 text-white border border-teal-600/50'
                            : 'border border-teal-900/40 text-slate-400 hover:text-cyan-300'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {DIMENSION_LABELS[dim]}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-lg bg-teal-900/20 border border-teal-800/20 p-3 min-h-[80px]">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {analysis?.[activeDim] || '需連接 AI 解讀引擎生成分析內容。'}
                  </p>
                </div>
              </div>
            )}

            {/* Palace accordion */}
            {selectedChart && palaces.length > 0 && (
              <div className="rounded-xl border border-teal-800/30 bg-teal-950/30 p-4">
                <h3 className="text-xs font-semibold text-white mb-3">宮位詳情 Palace Details</h3>
                <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                  {palaces.map((p) => {
                    const pn  = p.palace_name as string;
                    const br  = p.branch      as string;
                    const st  = (p.major_stars as string[] | undefined) ?? [];
                    const isLife = br === lifePalace?.branch;
                    return (
                      <div key={br} className="border border-teal-900/30 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedPalace(expandedPalace === br ? null : br)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-teal-950/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`w-3 h-3 text-teal-500 transition-transform ${expandedPalace === br ? 'rotate-180' : ''}`} />
                            <span className={`text-[11px] font-medium ${isLife ? 'text-amber-300' : 'text-slate-200'}`}>
                              {pn}{isLife ? ' ★' : ''}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{br}</span>
                        </button>
                        {expandedPalace === br && (
                          <div className="px-3 pb-3 border-t border-teal-900/30 space-y-1.5">
                            <p className="text-[10px] text-slate-500 italic pt-1.5">
                              {PALACE_DESC[pn] || '—'}
                            </p>
                            {st.length > 0 && (
                              <div>
                                <div className="text-[10px] text-slate-500 mb-0.5">主星</div>
                                <div className="flex flex-wrap gap-1">
                                  {st.map(s => (
                                    <span key={s} className="text-[10px] text-blue-300 bg-blue-900/30 px-1 rounded">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
