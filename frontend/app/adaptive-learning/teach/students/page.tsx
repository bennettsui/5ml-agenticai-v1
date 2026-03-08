'use client';
import { useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

interface StudentRow {
  student_id: string;
  name: string;
  grade: string;
  preferred_language: string;
  total_sessions: number;
  total_questions: number;
  total_correct: number;
  objectives_seen: number;
  mastered_count: number;
  avg_mastery: string;
  last_active_at: string | null;
}

const MASTERY_BAR_COLORS = ['bg-slate-700', 'bg-blue-500', 'bg-yellow-400', 'bg-orange-400', 'bg-emerald-500'];

function MasteryBar({ value }: { value: number }) {
  const pct = (value / 4) * 100;
  const color = value >= 3.5 ? 'bg-emerald-500' : value >= 2.5 ? 'bg-yellow-400' : value >= 1 ? 'bg-orange-400' : 'bg-slate-600';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden w-20">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium w-6 text-right ${
        value >= 3.5 ? 'text-emerald-400' : value >= 2.5 ? 'text-yellow-400' : value >= 1 ? 'text-orange-400' : 'text-slate-500'
      }`}>{value > 0 ? parseFloat(value.toString()).toFixed(1) : '—'}</span>
    </div>
  );
}

export default function StudentsPage() {
  const { teacher } = useTeacherAuth();
  const [grade, setGrade] = useState('S1');
  const [className, setClassName] = useState('A');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [masteryDetail, setMasteryDetail] = useState<Record<string, any[]>>({});

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(
        `/api/adaptive-learning/teacher/classes/${className}/students?grade=${grade}`
      );
      const data = await res.json();
      if (data.success) setStudents(data.students);
      else setError(data.error);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadStudentDetail = async (studentId: string) => {
    if (masteryDetail[studentId]) return;
    try {
      const res = await fetch(`/api/adaptive-learning/student/concepts/overview?student_id=${studentId}`);
      const data = await res.json();
      if (data.success) setMasteryDetail(prev => ({ ...prev, [studentId]: data.objectives || [] }));
    } catch {}
  };

  const toggle = (studentId: string) => {
    if (expanded === studentId) { setExpanded(null); return; }
    setExpanded(studentId);
    loadStudentDetail(studentId);
  };

  const atRisk = students.filter(s => parseFloat(s.avg_mastery) < 1 && s.total_sessions > 0);
  const inactive = students.filter(s => !s.last_active_at ||
    new Date(s.last_active_at) < new Date(Date.now() - 7 * 86400_000));

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Grade</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >{['S1','S2'].map(g => <option key={g}>{g}</option>)}</select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Class</label>
          <select value={className} onChange={e => setClassName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >{['A','B','C','D','E'].map(c => <option key={c} value={c}>Class {c}</option>)}</select>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Load
        </button>
      </div>

      {students.length > 0 && (
        <div>
          <h1 className="text-2xl font-bold text-white">Class {grade}{className}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{students.length} students</p>
        </div>
      )}

      {/* Alert strips */}
      {atRisk.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300">
          ⚠ {atRisk.length} student{atRisk.length > 1 ? 's' : ''} at risk (avg mastery &lt; 1.0):&nbsp;
          {atRisk.map(s => s.name).join(', ')}
        </div>
      )}
      {inactive.length > 0 && (
        <div className="bg-slate-700/30 border border-slate-700/50 rounded-xl px-4 py-3 text-xs text-slate-400">
          💤 {inactive.length} student{inactive.length > 1 ? 's' : ''} inactive for 7+ days
        </div>
      )}

      {error && <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

      {/* Student list */}
      <div className="space-y-2">
        {students.map(s => {
          const avg = parseFloat(s.avg_mastery) || 0;
          const acc = s.total_questions > 0 ? Math.round((s.total_correct / s.total_questions) * 100) : null;
          const isOpen = expanded === s.student_id;
          const detail = masteryDetail[s.student_id] || [];

          return (
            <div key={s.student_id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
              <button onClick={() => toggle(s.student_id)}
                className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      {s.preferred_language && (
                        <span className="text-[10px] text-slate-500">{s.preferred_language}</span>
                      )}
                      {!s.last_active_at && <span className="text-[10px] text-slate-600">Never active</span>}
                      {s.last_active_at && new Date(s.last_active_at) < new Date(Date.now() - 7*86400_000) && (
                        <span className="text-[10px] text-amber-500">Inactive 7d+</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>{s.total_sessions} sessions</span>
                      {acc !== null && <span>{acc}% accuracy</span>}
                      <span>{s.mastered_count} mastered</span>
                    </div>
                  </div>
                  <div className="w-32 shrink-0">
                    <MasteryBar value={avg} />
                  </div>
                </div>
              </button>

              {/* Expanded mastery detail */}
              {isOpen && (
                <div className="border-t border-slate-700/30 px-5 py-4">
                  {detail.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      {masteryDetail[s.student_id] ? 'No mastery data yet.' : 'Loading…'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {detail.map((obj: any) => (
                        <div key={obj.code} className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${MASTERY_BAR_COLORS[obj.mastery_level] || 'bg-slate-600'}`} />
                          <p className="text-xs text-slate-300 flex-1 truncate">{obj.name_en}</p>
                          <span className="text-[10px] text-slate-500 shrink-0">{obj.evidence_count} attempts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!loading && students.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a class and click Load to view students.</p>
        </div>
      )}
    </div>
  );
}
