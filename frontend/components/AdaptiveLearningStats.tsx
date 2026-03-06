'use client';
import { useState } from 'react';
import { Users, Brain, TrendingUp, BookOpen, Activity, RefreshCw, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';

interface PilotStats {
  total_students: number;
  total_sessions: number;
  sessions_this_week: number;
  avg_accuracy: number;
  avg_mastery: number;
  mastered_objectives: number;
  total_questions_answered: number;
  top_weak_topics: { objective_code: string; name_en: string; avg_mastery: number }[];
  grade_breakdown: { grade: string; count: number }[];
}

export default function AdaptiveLearningStats() {
  const [stats, setStats] = useState<PilotStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/adaptive-learning/teacher/pilot-stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Adaptive Learning — Pilot Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">HK S1–S3 Mathematics · BKT mastery tracking · AI explanations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {stats ? 'Refresh' : 'Load Stats'}
          </button>
          <Link href="/learn" target="_blank"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Student Portal
          </Link>
          <Link href="/teach" target="_blank"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Teacher Portal
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {!stats && !loading && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-10 text-center">
          <Brain className="w-10 h-10 text-indigo-400/40 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Click "Load Stats" to fetch live pilot metrics from the database.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading pilot stats…</span>
        </div>
      )}

      {stats && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Pilot Students" value={stats.total_students} color="text-sky-400" />
            <KpiCard icon={Activity} label="Total Sessions" value={stats.total_sessions} sub={`${stats.sessions_this_week} this week`} color="text-emerald-400" />
            <KpiCard icon={Brain} label="Avg Accuracy" value={`${Math.round(stats.avg_accuracy * 100)}%`} color="text-violet-400" />
            <KpiCard icon={BookOpen} label="Questions Done" value={stats.total_questions_answered} color="text-amber-400" />
          </div>

          {/* Mastery progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Overall mastery */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <p className="text-sm font-semibold text-white">Cohort Mastery</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Average mastery level</span>
                    <span className="text-white font-medium">{stats.avg_mastery.toFixed(2)} / 4.0</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${(stats.avg_mastery / 4) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Objectives mastered (all students):</span>
                  <span className="text-white font-medium">{stats.mastered_objectives}</span>
                </div>
              </div>
            </div>

            {/* Grade breakdown */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-sky-400" />
                <p className="text-sm font-semibold text-white">Students by Grade</p>
              </div>
              {stats.grade_breakdown.length === 0 ? (
                <p className="text-xs text-slate-500">No students enrolled yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.grade_breakdown.map(g => (
                    <div key={g.grade} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400 w-8">{g.grade}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${stats.total_students ? (g.count / stats.total_students) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-white w-6 text-right">{g.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weak topics */}
          {stats.top_weak_topics.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-white">Weakest Topics (cohort-wide)</p>
              </div>
              <div className="space-y-2">
                {stats.top_weak_topics.map((t, i) => (
                  <div key={t.objective_code} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{t.name_en}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{t.objective_code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(t.avg_mastery / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{t.avg_mastery.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Student Portal', href: '/learn', desc: 'Practice & progress' },
              { label: 'Teacher Dashboard', href: '/teach', desc: 'Class overview' },
              { label: 'Syllabus Browser', href: '/teach/syllabus', desc: 'S1–S3 curriculum' },
              { label: 'Upload Papers', href: '/teach/upload', desc: 'Add past papers' },
            ].map(l => (
              <Link key={l.href} href={l.href} target="_blank"
                className="bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/80 rounded-xl p-3.5 transition-colors group"
              >
                <p className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">{l.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{l.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Users; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
      <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
