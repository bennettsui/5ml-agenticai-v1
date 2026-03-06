'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Flame, ChevronRight, Clock, Star, BookOpen, BarChart3, Award } from 'lucide-react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';

interface Stats {
  total_sessions: number;
  mastered_count: number;
  streak_days: number;
  total_questions: number;
  total_correct: number;
}

interface PersonalisedConfig {
  suggested_duration_mins: number;
  target_difficulty: number;
  review_objectives: string[];
}

const GRADES = ['S1', 'S2'];
const CLASSES = ['A', 'B', 'C', 'D'];
const LANGUAGES = [{ value: 'ZH', label: '中文' }, { value: 'EN', label: 'English' }];

function LoginForm({ onLogin }: { onLogin: (name: string, cls: string, grade: string, lang: 'EN' | 'ZH') => Promise<void> }) {
  const [form, setForm] = useState({ name: '', grade: 'S1', class: 'A', language: 'ZH' as 'EN' | 'ZH' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await onLogin(form.name.trim(), `${form.grade}${form.class}`, form.grade, form.language); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center pt-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">MathAI</h1>
        <p className="text-slate-400 text-sm">Personalised learning for S1–S2 Mathematics</p>
      </div>
      <form onSubmit={submit} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 space-y-4">
        <h2 className="text-white font-semibold text-lg">Get started</h2>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Your name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Alice Chan" required
            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Grade</label>
            <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >{GRADES.map(g => <option key={g}>{g}</option>)}</select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Class</label>
            <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >{CLASSES.map(c => <option key={c}>{c}</option>)}</select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Language</label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(l => (
              <button key={l.value} type="button" onClick={() => setForm(f => ({ ...f, language: l.value as 'EN' | 'ZH' }))}
                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                  form.language === l.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
                }`}
              >{l.label}</button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Joining...' : 'Start Learning →'}
        </button>
      </form>
    </div>
  );
}

export default function LearnHome() {
  const router = useRouter();
  const { student, loading: authLoading, login } = useStudentAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<PersonalisedConfig | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    if (!student) return;
    // Fetch stats and config in parallel on home load — expected for a home screen
    Promise.all([
      fetch(`/api/adaptive-learning/student/stats?student_id=${student.id}`).then(r => r.json()),
      fetch(`/api/adaptive-learning/student/config?student_id=${student.id}`).then(r => r.json()),
    ]).then(([s, c]) => {
      if (s.success) setStats(s);
      if (c.success) setConfig(c);
    }).catch(() => {});

    // Check for any newly earned badges (e.g. if session just ended)
    const justEndedSession = sessionStorage.getItem('al_session_just_ended');
    if (justEndedSession) {
      sessionStorage.removeItem('al_session_just_ended');
      fetch('/api/adaptive-learning/student/badges/check', {
        method: 'POST',
        headers: { 'X-Student-Id': student.id },
      }).then(r => r.json()).then(d => {
        if (d.newly_earned?.length > 0) setNewBadges(d.newly_earned);
      }).catch(() => {});
    }
  }, [student]);

  if (authLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!student) {
    return <LoginForm onLogin={login} />;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const reviewDue = config?.review_objectives?.length ?? 0;
  const accuracy = stats && stats.total_questions > 0
    ? Math.round((stats.total_correct / stats.total_questions) * 100)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* New badge toast */}
      {newBadges.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div>
            <p className="text-amber-300 text-sm font-semibold">New badge{newBadges.length > 1 ? 's' : ''} earned!</p>
            <p className="text-amber-400/70 text-xs mt-0.5">{newBadges.join(' · ')}</p>
          </div>
          <Link href="/learn/badges" className="ml-auto text-xs text-amber-400 underline shrink-0">View</Link>
        </div>
      )}

      {/* Greeting */}
      <div className="pt-2">
        <p className="text-slate-400 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-white">{student.name} 👋</h1>
      </div>

      {/* Session CTA */}
      <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold text-lg">Ready to practise?</h2>
            {reviewDue > 0 && (
              <p className="text-indigo-300 text-sm mt-0.5">
                {reviewDue} concept{reviewDue > 1 ? 's' : ''} due for review
              </p>
            )}
            {accuracy !== null && (
              <p className="text-slate-400 text-xs mt-1">Lifetime accuracy: {accuracy}%</p>
            )}
          </div>
          {config && (
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock className="w-3 h-3" />
              {config.suggested_duration_mins} min
            </div>
          )}
        </div>
        <Link href="/learn/session"
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Start Session
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Streak', sub: 'days', icon: Flame, color: 'text-orange-400',
            value: stats ? (stats.streak_days > 0 ? stats.streak_days.toString() : '0') : '…',
          },
          {
            label: 'Mastered', sub: 'concepts', icon: Star, color: 'text-yellow-400',
            value: stats ? stats.mastered_count.toString() : '…',
          },
          {
            label: 'Sessions', sub: 'total', icon: BookOpen, color: 'text-indigo-400',
            value: stats ? stats.total_sessions.toString() : '…',
          },
        ].map(({ label, sub, icon: Icon, color, value }) => (
          <div key={label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <div className="text-white font-bold text-lg leading-none">{value}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">{sub}</div>
            <div className="text-slate-400 text-[10px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Streak encouragement */}
      {stats && stats.streak_days === 0 && stats.total_sessions > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-xs text-orange-300">
          🔥 You had a streak going! Practice today to restart it.
        </div>
      )}
      {stats && stats.streak_days >= 3 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-xs text-orange-300">
          🔥 {stats.streak_days}-day streak! Keep it up!
        </div>
      )}

      {/* Nav cards */}
      <div className="space-y-2">
        {[
          { href: '/learn/progress', icon: BarChart3, title: 'My Progress', desc: 'Mastery across all topics' },
          { href: '/learn/concepts', icon: BookOpen,  title: 'Browse Concepts', desc: 'All S1–S2 learning objectives' },
          { href: '/learn/badges',   icon: Award,     title: 'My Badges', desc: `${stats ? stats.mastered_count : '…'} concepts mastered` },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 p-4 bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{title}</div>
              <div className="text-slate-400 text-xs">{desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}
