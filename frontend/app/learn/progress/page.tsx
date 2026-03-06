'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';

interface MasteryRow {
  objective_id: string;
  code: string;
  name_en: string;
  name_zh: string;
  topic: string;
  subtopic: string;
  grade: string;
  mastery_level: number;
  interest_level: number;
  evidence_count: number;
  last_practiced_at: string | null;
}

const LEVEL_CONFIG = [
  { label: 'Not seen',      color: 'bg-slate-700',     text: 'text-slate-400',   ring: 'ring-slate-600' },
  { label: 'Introduced',    color: 'bg-blue-600/60',   text: 'text-blue-300',    ring: 'ring-blue-500' },
  { label: 'Practising',    color: 'bg-yellow-500/60', text: 'text-yellow-300',  ring: 'ring-yellow-500' },
  { label: 'Consolidating', color: 'bg-orange-500/60', text: 'text-orange-300',  ring: 'ring-orange-500' },
  { label: 'Mastered',      color: 'bg-emerald-500/60',text: 'text-emerald-300', ring: 'ring-emerald-500' },
];

function groupByTopic(rows: MasteryRow[]): Record<string, MasteryRow[]> {
  return rows.reduce((acc, r) => {
    const key = r.topic || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, MasteryRow[]>);
}

export default function ProgressPage() {
  const { student } = useStudentAuth();
  const router = useRouter();
  const [rows, setRows] = useState<MasteryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'EN' | 'ZH'>('ZH');

  useEffect(() => {
    if (!student) return;
    setLanguage(student.language);
    loadProgress();
  }, [student]);

  const loadProgress = async () => {
    if (!student) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/adaptive-learning/student/concepts/overview?student_id=${student.id}`);
      const data = await res.json();
      if (data.success) setRows(data.objectives || []);
      else setError(data.error);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <button onClick={() => router.push('/learn')} className="text-indigo-400 text-sm underline">Sign in first</button>
      </div>
    );
  }

  const grouped = groupByTopic(rows);
  const mastered = rows.filter(r => r.mastery_level >= 4).length;
  const inProgress = rows.filter(r => r.mastery_level >= 1 && r.mastery_level < 4).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Progress</h1>
          <p className="text-slate-400 text-xs mt-0.5">{rows.length} objectives tracked</p>
        </div>
        <button onClick={loadProgress} className={`text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Mastered', value: mastered, color: 'text-emerald-400' },
          { label: 'In Progress', value: inProgress, color: 'text-yellow-400' },
          { label: 'Attempts', value: rows.reduce((s, r) => s + (r.evidence_count || 0), 0), color: 'text-indigo-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Level legend */}
      <div className="flex flex-wrap gap-2">
        {LEVEL_CONFIG.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${c.color}`} />
            <span className="text-[10px] text-slate-400">{c.label}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grouped by topic */}
      {!loading && Object.entries(grouped).map(([topic, items]) => {
        const avgLevel = items.reduce((s, r) => s + r.mastery_level, 0) / items.length;
        return (
          <div key={topic} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{topic}</p>
              <div className="flex gap-0.5">
                {[0,1,2,3,4].map(l => (
                  <div
                    key={l}
                    className={`w-4 h-1.5 rounded-sm ${LEVEL_CONFIG[l].color} ${avgLevel >= l ? 'opacity-100' : 'opacity-20'}`}
                  />
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-700/20">
              {items.map(r => {
                const cfg = LEVEL_CONFIG[r.mastery_level];
                return (
                  <div key={r.code} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-full min-h-[32px] rounded-sm ${cfg.color} shrink-0 w-1.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {language === 'ZH' ? r.name_zh : r.name_en}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {r.evidence_count} attempts
                        {r.last_practiced_at ? ` · ${new Date(r.last_practiced_at).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${cfg.text} shrink-0`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!loading && rows.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No progress yet — start a session first!</p>
        </div>
      )}
    </div>
  );
}
