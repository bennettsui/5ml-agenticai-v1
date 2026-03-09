'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Users, TrendingDown } from 'lucide-react';

interface MasteryRow {
  objective_code: string;
  name_en: string;
  name_zh: string;
  topic: string;
  avg_mastery: string;
  avg_interest: string;
  student_count: string;
  not_seen: string;
  introduced: string;
  practicing: string;
  consolidating: string;
  mastered: string;
}

const LEVEL_BG = ['bg-slate-700/50', 'bg-blue-500/30', 'bg-yellow-500/30', 'bg-orange-500/30', 'bg-emerald-500/40'];

function MiniBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-300 text-xs w-5 text-right">{value || ''}</span>
      {value > 0 && (
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden w-16">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function ClassDetailPage() {
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('S1');
  const [rows, setRows] = useState<MasteryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiSummary, setAiSummary] = useState<any>(null);

  // Read params from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cls = params.get('class') || 'A';
    const gr = params.get('grade') || 'S1';
    setClassName(cls); setGrade(gr);
  }, []);

  const load = async (cls = className, gr = grade) => {
    if (!cls) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/adaptive-learning/teacher/classes/${cls}/mastery?grade=${gr}&language=EN`);
      const data = await res.json();
      if (data.success) { setRows(data.objectives || []); setAiSummary(data.ai_summary); }
      else setError(data.error);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const weakSpots = rows.filter(r => parseFloat(r.avg_mastery) < 1.5);

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Grade</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            {['S1','S2'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Class</label>
          <select value={className} onChange={e => setClassName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            {['A','B','C','D','E'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <button onClick={() => load()}
          className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Load Data
        </button>
      </div>

      {rows.length > 0 && (
        <div>
          <h1 className="text-2xl font-bold text-white">Class {grade}{className}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{rows.length} objectives · {rows[0]?.student_count || 0} students</p>
        </div>
      )}

      {error && <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

      {/* AI insight */}
      {aiSummary?.insight && (
        <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-5">
          <p className="text-xs font-semibold text-purple-400 mb-2">AI Analysis</p>
          <p className="text-sm text-slate-200 leading-relaxed">{aiSummary.insight}</p>
        </div>
      )}

      {/* Weak spots */}
      {weakSpots.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Needs attention ({weakSpots.length})</p>
            <p className="text-xs text-amber-400/70 mt-0.5 leading-relaxed">{weakSpots.map(w => w.name_en).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Per-topic heatmap */}
      {rows.length > 0 && (() => {
        const byTopic = rows.reduce((acc, r) => {
          if (!acc[r.topic]) acc[r.topic] = [];
          acc[r.topic].push(r);
          return acc;
        }, {} as Record<string, MasteryRow[]>);

        return Object.entries(byTopic).map(([topic, items]) => (
          <div key={topic} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/30 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{topic}</p>
              <div className="flex gap-1">
                {['⬜','🔵','🟡','🟠','✅'].map((e, i) => (
                  <span key={i} className="text-xs">{e}</span>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-700/20">
              {items.map(r => {
                const sc = parseInt(r.student_count) || 1;
                const avg = parseFloat(r.avg_mastery);
                const levels = [r.not_seen, r.introduced, r.practicing, r.consolidating, r.mastered].map(v => parseInt(v) || 0);
                return (
                  <div key={r.objective_code} className={`px-5 py-3 ${avg < 1.5 ? 'bg-red-500/5' : ''}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{r.name_en}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{r.objective_code}</p>
                      </div>
                      <span className={`text-xs font-bold ${avg >= 3 ? 'text-emerald-400' : avg >= 2 ? 'text-yellow-400' : avg >= 1 ? 'text-orange-400' : 'text-slate-500'}`}>
                        {avg.toFixed(1)}
                      </span>
                    </div>
                    {/* Stacked distribution bar */}
                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                      {levels.map((v, i) => v > 0 && (
                        <div
                          key={i}
                          className={`${LEVEL_BG[i]} rounded-sm`}
                          style={{ width: `${(v / sc) * 100}%` }}
                          title={`${['Not seen','Introduced','Practising','Consolidating','Mastered'][i]}: ${v}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-slate-600">
                      {levels.map((v, i) => v > 0 && <span key={i}>{v}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })()}

      {!loading && rows.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a class and click Load Data.</p>
        </div>
      )}
    </div>
  );
}
