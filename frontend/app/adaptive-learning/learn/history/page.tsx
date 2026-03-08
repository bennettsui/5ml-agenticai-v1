'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Target, RefreshCw } from 'lucide-react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';

interface Session {
  id: string;
  mode: string;
  started_at: string;
  ended_at: string | null;
  duration_secs: number | null;
  questions_seen: number;
  questions_correct: number;
  ai_summary: any;
}

function fmtDuration(secs: number | null) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  return m < 1 ? `${secs}s` : `${m}m`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-HK', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const { student } = useStudentAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const LIMIT = 15;

  const load = async (off = 0) => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/adaptive-learning/student/sessions?student_id=${student.id}&limit=${LIMIT}&offset=${off}`
      );
      const data = await res.json();
      if (data.success) {
        setSessions(off === 0 ? data.sessions : prev => [...prev, ...data.sessions]);
        setTotal(data.total);
        setOffset(off + LIMIT);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (student) load(0); }, [student]);

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <Link href="/adaptive-learning/learn" className="text-indigo-400 text-sm underline">Sign in first</Link>
      </div>
    );
  }

  const lifetimeAccuracy = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + r.questions_correct, 0) /
        Math.max(1, sessions.reduce((s, r) => s + r.questions_seen, 0)) * 100)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Session History</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {total} sessions total
            {lifetimeAccuracy !== null ? ` · ${lifetimeAccuracy}% lifetime accuracy` : ''}
          </p>
        </div>
        <button onClick={() => load(0)} className={`text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && sessions.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-2">
        {sessions.map(s => {
          const acc = s.questions_seen > 0
            ? Math.round((s.questions_correct / s.questions_seen) * 100) : null;
          const accColor = acc === null ? 'text-slate-500'
            : acc >= 80 ? 'text-emerald-400' : acc >= 60 ? 'text-yellow-400' : 'text-red-400';
          const summaryText = s.ai_summary
            ? (typeof s.ai_summary === 'string'
                ? JSON.parse(s.ai_summary)?.summary
                : s.ai_summary?.summary)
            : null;

          return (
            <div key={s.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{fmtDate(s.started_at)}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{fmtDuration(s.duration_secs)}
                    </span>
                    <span>{s.questions_seen} questions</span>
                    {acc !== null && (
                      <span className={`flex items-center gap-1 ${accColor}`}>
                        <Target className="w-3 h-3" />{acc}%
                      </span>
                    )}
                  </div>
                </div>
                {s.ended_at ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 shrink-0">Done</span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 shrink-0">Incomplete</span>
                )}
              </div>
              {summaryText && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2 pl-12">{summaryText}</p>
              )}
            </div>
          );
        })}
      </div>

      {sessions.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sessions yet. Start practising!</p>
          <Link href="/adaptive-learning/learn/session" className="mt-3 inline-block text-indigo-400 text-sm underline">Start a session →</Link>
        </div>
      )}

      {sessions.length < total && (
        <button onClick={() => load(offset)} disabled={loading}
          className="w-full py-2.5 border border-slate-700/50 text-slate-400 rounded-xl text-sm hover:text-white hover:border-slate-600 transition-colors"
        >
          {loading ? 'Loading…' : `Load more (${total - sessions.length} remaining)`}
        </button>
      )}
    </div>
  );
}
