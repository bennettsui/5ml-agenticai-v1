'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle, ChevronRight, Users, BarChart2, TrendingDown, CheckCircle2, BookOpenCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

interface PilotStats {
  total_students: number;
  total_sessions: number;
  sessions_this_week: number;
  avg_accuracy: number;
  avg_mastery: number;
  mastered_objectives: number;
  total_questions_answered: number;
  grade_breakdown: Array<{ grade: string; count: number }>;
  top_weak_topics: Array<{ objective_code: string; name_en: string; avg_mastery: number }>;
}

function PilotOverview() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<PilotStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (stats) { setOpen(o => !o); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/adaptive-learning/teacher/pilot-stats');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
      setOpen(true);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <button
        onClick={load}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">Pilot Overview</span>
          {stats && (
            <span className="text-[10px] text-slate-500 font-normal">
              {stats.total_students} students · {stats.sessions_this_week} sessions this week
            </span>
          )}
        </div>
        {loading
          ? <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
          : open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />
        }
      </button>

      {error && <p className="px-5 pb-4 text-red-400 text-xs">{error}</p>}

      {open && stats && (
        <div className="border-t border-slate-700/30 px-5 py-4 space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Students',        value: stats.total_students,                       icon: Users,         color: 'text-indigo-400' },
              { label: 'Sessions / week', value: stats.sessions_this_week,                   icon: BarChart2,     color: 'text-purple-400' },
              { label: 'Avg accuracy',    value: `${Math.round(stats.avg_accuracy * 100)}%`, icon: CheckCircle2,  color: 'text-emerald-400' },
              { label: 'Mastered obj.',   value: stats.mastered_objectives,                  icon: BookOpenCheck, color: 'text-amber-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/[0.03] rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                <div>
                  <p className="text-lg font-bold text-white leading-none">{value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Grade breakdown */}
          {stats.grade_breakdown.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-slate-500">Grade:</span>
              {stats.grade_breakdown.map(({ grade, count }) => (
                <span key={grade} className="text-xs bg-slate-700/50 text-slate-300 rounded-full px-3 py-1">
                  {grade} · <span className="font-semibold text-white">{count}</span>
                </span>
              ))}
              <span className="text-xs text-slate-500 ml-auto">{stats.total_questions_answered.toLocaleString()} Qs answered total</span>
            </div>
          )}

          {/* Weakest topics */}
          {stats.top_weak_topics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                Weakest objectives across all students
              </p>
              <div className="space-y-2">
                {stats.top_weak_topics.map(t => (
                  <div key={t.objective_code} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500 w-20 shrink-0">{t.objective_code}</span>
                    <span className="text-xs text-slate-300 flex-1 truncate">{t.name_en}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-400" style={{ width: `${(t.avg_mastery / 4) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-red-400 w-6 text-right">{t.avg_mastery.toFixed(1)}</span>
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

interface ClassMasteryRow {
  objective_code: string;
  name_en: string;
  name_zh: string;
  topic: string;
  subtopic: string;
  avg_mastery: string;
  avg_interest: string;
  student_count: string;
  not_seen: string;
  introduced: string;
  practicing: string;
  consolidating: string;
  mastered: string;
}

interface AiSummary {
  insight?: string;
  recommendations?: string[];
}

const GRADE_OPTIONS = ['S1', 'S2'];
const CLASS_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

function LoginForm({ onLogin }: { onLogin: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await onLogin(name.trim()); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Teacher Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Enter your name to continue</p>
      </div>
      <form onSubmit={submit} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <input
          value={name} onChange={e => setName(e.target.value)} required
          placeholder="Your name (e.g. Ms Chan)"
          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? 'Signing in…' : 'Enter Portal →'}
        </button>
      </form>
    </div>
  );
}

export default function TeachDashboard() {
  const { teacher, login } = useTeacherAuth();
  const [grade, setGrade] = useState('S1');
  const [className, setClassName] = useState('A');
  const [rows, setRows] = useState<ClassMasteryRow[]>([]);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!teacher) return <LoginForm onLogin={login} />;

  const loadClass = async () => {
    setLoading(true); setError(''); setRows([]); setAiSummary(null);
    try {
      const res = await fetch(`/api/adaptive-learning/teacher/classes/${className}/mastery?grade=${grade}&language=EN`);
      const data = await res.json();
      if (data.success) { setRows(data.objectives || []); setAiSummary(data.ai_summary); }
      else setError(data.error);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const weakSpots = rows.filter(r => parseFloat(r.avg_mastery) < 1.5 && parseInt(r.student_count) > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Class Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Mastery overview by learning objective</p>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {GRADE_OPTIONS.map(g => (
            <button key={g} onClick={() => setGrade(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${grade === g ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
            >{g}</button>
          ))}
          <select value={className} onChange={e => setClassName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
          >
            {CLASS_OPTIONS.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <button onClick={loadClass}
            className={`flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors ${loading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Load
          </button>
        </div>
      </div>

      {/* Pilot overview — loads on click */}
      <PilotOverview />

      {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

      {/* AI Insight */}
      {aiSummary && (
        <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/5 border border-purple-500/20 rounded-2xl p-5">
          <p className="text-xs font-semibold text-purple-400 mb-2">AI Insight</p>
          <p className="text-sm text-slate-200 leading-relaxed">{aiSummary.insight || 'Class analysis complete.'}</p>
          {aiSummary.recommendations && (
            <ul className="mt-3 space-y-1">
              {aiSummary.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-purple-400">→</span>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Weak spots callout */}
      {weakSpots.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Areas needing attention</p>
            <p className="text-xs text-amber-400/70 mt-0.5">{weakSpots.map(w => w.name_en).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Heatmap table */}
      {rows.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/30 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Mastery Heatmap — {grade}{className}</p>
            <p className="text-xs text-slate-500">{rows.length} objectives</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/30 text-slate-500">
                  <th className="text-left px-5 py-2.5 font-medium">Objective</th>
                  <th className="px-2 py-2.5 font-medium whitespace-nowrap">⬜ Not seen</th>
                  <th className="px-2 py-2.5 font-medium whitespace-nowrap">🔵 Intro</th>
                  <th className="px-2 py-2.5 font-medium whitespace-nowrap">🟡 Prac</th>
                  <th className="px-2 py-2.5 font-medium whitespace-nowrap">🟠 Con</th>
                  <th className="px-2 py-2.5 font-medium whitespace-nowrap">✅ Mast</th>
                  <th className="px-3 py-2.5 font-medium">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {rows.map(r => {
                  const avg = parseFloat(r.avg_mastery);
                  const avgColor = avg >= 3.5 ? 'text-emerald-400' : avg >= 2.5 ? 'text-yellow-400' : avg >= 1 ? 'text-orange-400' : 'text-slate-500';
                  const sc = parseInt(r.student_count) || 1;
                  return (
                    <tr key={r.objective_code} className={`hover:bg-white/[0.02] transition-colors ${avg < 1.5 && sc > 0 ? 'bg-red-500/5' : ''}`}>
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{r.name_en}</p>
                        <p className="text-slate-500 mt-0.5 font-mono text-[10px]">{r.objective_code}</p>
                      </td>
                      {[r.not_seen, r.introduced, r.practicing, r.consolidating, r.mastered].map((v, i) => {
                        const count = parseInt(v) || 0;
                        const pct = sc > 0 ? Math.round((count / sc) * 100) : 0;
                        return (
                          <td key={i} className="px-2 py-3 text-center">
                            {count > 0 ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-slate-300 font-medium">{count}</span>
                                <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            ) : <span className="text-slate-700">—</span>}
                          </td>
                        );
                      })}
                      <td className={`px-3 py-3 text-center font-bold ${avgColor}`}>{avg.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a class and click Load to view mastery data.</p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/adaptive-learning/teach/upload',            label: 'Upload Past Paper',    desc: 'Add questions via PDF' },
          { href: '/adaptive-learning/teach/questions/pending', label: 'Review Questions',     desc: 'Approve AI-generated Qs' },
          { href: '/adaptive-learning/teach/reports',           label: 'Generate Report',      desc: 'Term or class summary' },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 p-4 bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
