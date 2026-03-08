'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, TrendingUp, Clock, Target, ChevronRight } from 'lucide-react';

interface MasteryDelta {
  objective_code: string;
  name_en: string;
  name_zh: string;
  attempts: number;
  correct: number;
  current_mastery_level?: number;
}

interface Summary {
  session_id: string;
  duration_minutes: number;
  questions_done: number;
  correct_count: number;
  mastery_deltas: MasteryDelta[];
  session_summary: any;
  student_ux_text: string | null;
}

const LEVEL_LABELS = ['Not seen', 'Introduced', 'Practising', 'Consolidating', 'Mastered'];
const LEVEL_COLORS = ['text-slate-500', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-emerald-400'];

export default function SessionSummary() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [language, setLanguage] = useState<'EN' | 'ZH'>('ZH');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('al_last_summary');
      if (raw) setSummary(JSON.parse(raw));
      const student = localStorage.getItem('al_student');
      if (student) setLanguage(JSON.parse(student).language || 'ZH');
    } catch {}
  }, []);

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-400 text-sm">No recent session found.</p>
        <Link href="/adaptive-learning/learn/session" className="text-indigo-400 text-sm underline">Start a session</Link>
      </div>
    );
  }

  const accuracy = summary.questions_done > 0 ? Math.round((summary.correct_count / summary.questions_done) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center pt-2">
        <div className="text-4xl mb-2">{accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}</div>
        <h1 className="text-2xl font-bold text-white">Session Complete!</h1>
        <p className="text-slate-400 text-sm mt-1">
          {summary.duration_minutes} min · {summary.questions_done} questions · {accuracy}% correct
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Correct', value: `${summary.correct_count}/${summary.questions_done}`, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Accuracy', value: `${accuracy}%`, icon: Target, color: 'text-indigo-400' },
          { label: 'Duration', value: `${summary.duration_minutes}m`, icon: Clock, color: 'text-slate-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <div className="text-white font-bold">{value}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Mastery deltas */}
      {summary.mastery_deltas.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/40">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Concepts Practised
            </p>
          </div>
          <div className="divide-y divide-slate-700/30">
            {summary.mastery_deltas.map((d, i) => {
              const level = d.current_mastery_level ?? 0;
              const pct = d.attempts > 0 ? Math.round((d.correct / d.attempts) * 100) : 0;
              return (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {language === 'ZH' ? d.name_zh : d.name_en}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {d.attempts} attempts · {pct}% correct
                    </p>
                  </div>
                  <div className={`text-xs font-medium ${LEVEL_COLORS[level]}`}>
                    {LEVEL_LABELS[level]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI coach message */}
      {(summary.student_ux_text || summary.session_summary) && (
        <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-indigo-400 mb-2">AI Coach</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {summary.student_ux_text || (
              typeof summary.session_summary === 'string'
                ? summary.session_summary
                : summary.session_summary?.coach_message || 'Great work today! Keep practising regularly.'
            )}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pb-2">
        <Link
          href="/adaptive-learning/learn/session"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
        >
          Another Session
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          href="/adaptive-learning/learn/progress"
          className="flex items-center justify-center gap-2 w-full py-3 border border-slate-700/50 hover:border-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          View My Progress
        </Link>
        <Link
          href="/adaptive-learning/learn"
          className="flex items-center justify-center w-full py-3 text-slate-500 text-sm transition-colors hover:text-slate-400"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
