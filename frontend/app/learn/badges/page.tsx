'use client';
import { useState, useEffect } from 'react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';
import Link from 'next/link';

interface Badge {
  code: string;
  icon: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  earned_at: string | null;
}

export default function BadgesPage() {
  const { student } = useStudentAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    fetch(`/api/adaptive-learning/student/badges?student_id=${student.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setBadges(d.badges); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student]);

  const language = student?.language ?? 'ZH';
  const earned = badges.filter(b => b.earned_at);
  const locked = badges.filter(b => !b.earned_at);

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <Link href="/learn" className="text-indigo-400 text-sm underline">Sign in first</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Badges</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          {loading ? 'Loading…' : `${earned.length} earned · ${locked.length} to unlock`}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-24">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Earned */}
      {earned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Earned</p>
          <div className="grid grid-cols-2 gap-3">
            {earned.map(b => (
              <div key={b.code} className="bg-gradient-to-br from-indigo-600/15 to-purple-600/10 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-2">
                <div className="text-3xl">{b.icon || '🏅'}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{language === 'ZH' ? b.name_zh : b.name_en}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{language === 'ZH' ? b.description_zh : b.description_en}</p>
                </div>
                <div className="mt-auto">
                  <span className="text-[10px] text-indigo-300 bg-indigo-600/20 border border-indigo-500/20 rounded-full px-2 py-0.5">
                    {new Date(b.earned_at!).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">To unlock</p>
          <div className="grid grid-cols-2 gap-3">
            {locked.map(b => (
              <div key={b.code} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-2 opacity-60">
                <div className="text-3xl grayscale">{b.icon || '🏅'}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{language === 'ZH' ? b.name_zh : b.name_en}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{language === 'ZH' ? b.description_zh : b.description_en}</p>
                </div>
                <div className="mt-auto">
                  <span className="text-[10px] text-slate-500 bg-slate-700/50 rounded-full px-2 py-0.5">Locked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && badges.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p className="text-sm">Complete a session to start earning badges!</p>
          <Link href="/learn/session" className="mt-3 inline-block text-indigo-400 text-sm underline">Start practising →</Link>
        </div>
      )}
    </div>
  );
}
