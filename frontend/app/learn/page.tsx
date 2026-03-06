'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Flame, ChevronRight, Clock, Star, BookOpen, BarChart3 } from 'lucide-react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';

interface PersonalisedConfig {
  suggested_duration_mins: number;
  target_difficulty: number;
  review_objectives: string[];
}

const GRADES = ['S1', 'S2'];
const CLASSES = ['A', 'B', 'C', 'D'];
const LANGUAGES = [{ value: 'ZH', label: '中文' }, { value: 'EN', label: 'English' }];

export default function LearnHome() {
  const router = useRouter();
  const { student, loading, login } = useStudentAuth();
  const [config, setConfig] = useState<PersonalisedConfig | null>(null);
  const [loginForm, setLoginForm] = useState({ name: '', grade: 'S1', class: 'A', language: 'ZH' as 'EN' | 'ZH' });
  const [loginError, setLoginError] = useState('');
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (!student) return;
    fetch(`/api/adaptive-learning/student/config?student_id=${student.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setConfig(d); })
      .catch(() => {});
  }, [student]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true); setLoginError('');
    try {
      await login(loginForm.name.trim(), `${loginForm.grade}${loginForm.class}`, loginForm.grade, loginForm.language);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!student) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center pt-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">MathAI</h1>
          <p className="text-slate-400 text-sm">Personalised learning for S1–S2 Mathematics</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg">Get started</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Your name</label>
            <input
              value={loginForm.name}
              onChange={e => setLoginForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Alice Chan"
              required
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Grade</label>
              <select
                value={loginForm.grade}
                onChange={e => setLoginForm(f => ({ ...f, grade: e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Class</label>
              <select
                value={loginForm.class}
                onChange={e => setLoginForm(f => ({ ...f, class: e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Language</label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.value} type="button"
                  onClick={() => setLoginForm(f => ({ ...f, language: l.value as 'EN' | 'ZH' }))}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                    loginForm.language === l.value
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
                  }`}
                >{l.label}</button>
              ))}
            </div>
          </div>
          {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
          <button
            type="submit" disabled={logging}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {logging ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {logging ? 'Joining...' : 'Start Learning →'}
          </button>
        </form>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const reviewDue = config?.review_objectives?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
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
          </div>
          {config && (
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock className="w-3 h-3" />
              {config.suggested_duration_mins} min
            </div>
          )}
        </div>
        <Link
          href="/learn/session"
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Start Session
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Streak', value: '—', sub: 'days', icon: Flame, color: 'text-orange-400' },
          { label: 'Mastered', value: '—', sub: 'concepts', icon: Star, color: 'text-yellow-400' },
          { label: 'Sessions', value: '—', sub: 'total', icon: BookOpen, color: 'text-indigo-400' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <div className="text-white font-bold text-lg">{value}</div>
            <div className="text-slate-500 text-[10px]">{sub}</div>
            <div className="text-slate-400 text-[10px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Nav cards */}
      <div className="space-y-2">
        {[
          { href: '/learn/progress', icon: BarChart3, title: 'My Progress', desc: 'Mastery across all topics' },
          { href: '/learn/concepts', icon: BookOpen, title: 'Browse Concepts', desc: 'All S1–S2 learning objectives' },
          { href: '/learn/badges', icon: Award, title: 'My Badges', desc: 'Achievements earned' },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href} href={href}
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

function Award(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
}
