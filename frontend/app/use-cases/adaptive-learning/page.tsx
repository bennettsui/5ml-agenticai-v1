'use client';

import { useState } from 'react';
import {
  BookOpen, Users, PenLine, Gamepad2, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, GraduationCap, Brain, Star
} from 'lucide-react';

type Tab = 'student' | 'teacher' | 'authoring' | 'gamification';
type Language = 'EN' | 'ZH';

interface ApiResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

const DEMO_QUESTION = {
  stem_en: 'Evaluate: 3/4 + 5/6',
  stem_zh: '計算：3/4 + 5/6',
  options_en: { A: '8/10', B: '8/12', C: '1 and 7/12', D: '19/24' },
  options_zh: { A: '8/10', B: '8/12', C: '1又7/12', D: '19/24' },
  answer: 'C',
  learning_objectives: [
    {
      code: 'MATH.S1.FRACTION.ADD',
      name_en: 'Addition and Subtraction of Fractions',
      name_zh: '分數的加法與減法',
      description_en: 'Add and subtract fractions with unlike denominators using LCM.',
      description_zh: '能利用最小公倍數對不同分母的分數進行加減運算。',
    },
  ],
};

const DEMO_SESSION = {
  session_info: { mode: 'adaptive', duration_mins: 20, started_at: new Date().toISOString() },
  interactions: [
    { objective_code: 'MATH.S1.FRACTION.ADD', is_correct: true, time_taken_secs: 45, self_understanding: 4, self_interest: 3 },
    { objective_code: 'MATH.S1.FRACTION.ADD', is_correct: false, time_taken_secs: 90, self_understanding: 2, self_interest: 3 },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', is_correct: true, time_taken_secs: 60, self_understanding: 4, self_interest: 4 },
    { objective_code: 'MATH.S1.MEASURE.CIRCLE', is_correct: true, time_taken_secs: 50, self_understanding: 3, self_interest: 5 },
  ],
  mastery_deltas: [
    { objective_code: 'MATH.S1.FRACTION.ADD', before: 1, after: 2 },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', before: 2, after: 3 },
    { objective_code: 'MATH.S1.MEASURE.CIRCLE', before: 3, after: 3 },
  ],
};

const DEMO_CLASS = {
  class_info: { grade: 'S1', class_name: '1A', student_count: 28 },
  objective_stats: [
    { objective_code: 'MATH.S1.FRACTION.ADD', name_en: 'Addition of Fractions', avg_mastery: 1.8, avg_interest: 2.9, not_seen: 2, introduced: 10, practicing: 12, consolidating: 3, mastered: 1 },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', name_en: 'Linear Equations in One Unknown', avg_mastery: 2.5, avg_interest: 3.2, not_seen: 0, introduced: 5, practicing: 14, consolidating: 7, mastered: 2 },
    { objective_code: 'MATH.S1.MEASURE.CIRCLE', name_en: 'Circumference and Area of Circle', avg_mastery: 3.1, avg_interest: 4.0, not_seen: 0, introduced: 2, practicing: 8, consolidating: 10, mastered: 8 },
    { objective_code: 'MATH.S1.PERCENT.BASIC', name_en: 'Percentages', avg_mastery: 1.2, avg_interest: 2.5, not_seen: 8, introduced: 14, practicing: 5, consolidating: 1, mastered: 0 },
  ],
  examples_of_common_errors: [
    'When adding 3/4 + 5/6, students add numerators and denominators separately to get 8/10',
    'Forgetting to find LCM before adding fractions',
  ],
};

const DEMO_RAW_QUESTION = {
  raw_text_en: 'If a shopkeeper buys an item for $80 and sells it for $100, what is the percentage profit?',
  raw_text_zh: '如果一個商販以80元購買一件物品，並以100元出售，利潤百分比是多少？',
  candidate_objectives: [
    { code: 'MATH.S1.PERCENT.BASIC', name_en: 'Percentages — Concepts and Applications' },
    { code: 'MATH.S1.RATIO.BASIC', name_en: 'Ratio and Rate' },
  ],
  grade_band: 'S1',
  topic: 'Number and Algebra',
  subtopic: 'Percentages',
};

const DEMO_GAMIFICATION = {
  recent_mastery_changes: [
    { objective_code: 'MATH.S1.FRACTION.ADD', old_level: 1, new_level: 2 },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', old_level: 2, new_level: 3 },
  ],
  recent_sessions: [
    { date: '2026-03-04', duration_mins: 20, correct_rate: 0.75 },
    { date: '2026-03-05', duration_mins: 20, correct_rate: 0.80 },
  ],
  current_badges: ['FIRST_SESSION', 'STREAK_3'],
};

function ResultPanel({ result, loading, error }: { result: Record<string, unknown> | null; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-8 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Agent thinking...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  if (!result) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        Agent response
      </div>
      <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 max-h-[480px] overflow-y-auto">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="mb-4 last:mb-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
            {Array.isArray(value) ? (
              <ul className="space-y-1">
                {(value as unknown[]).map((item, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-slate-500 shrink-0 mt-0.5">{i + 1}.</span>
                    <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                  </li>
                ))}
              </ul>
            ) : typeof value === 'object' && value !== null ? (
              <pre className="text-xs text-slate-300 bg-white/[0.02] rounded p-2 overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-slate-200">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MasteryBadge({ level }: { level: number }) {
  const labels = ['Not seen', 'Introduced', 'Practicing', 'Consolidating', 'Mastered'];
  const colors = [
    'bg-slate-700/60 text-slate-400',
    'bg-blue-500/20 text-blue-300',
    'bg-yellow-500/20 text-yellow-300',
    'bg-orange-500/20 text-orange-300',
    'bg-emerald-500/20 text-emerald-300',
  ];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[level] || colors[0]}`}>
      {labels[level] || 'Unknown'}
    </span>
  );
}

export default function AdaptiveLearningPage() {
  const [tab, setTab] = useState<Tab>('student');
  const [language, setLanguage] = useState<Language>('EN');
  const [studentAnswer, setStudentAnswer] = useState<string>('A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callApi = async (mode: string, payload: Record<string, unknown>) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/adaptive-learning/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, language, payload }),
      });
      const data: ApiResult = await res.json();
      if (data.success && data.result) {
        setResult(data.result);
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const runStudentExplanation = () => {
    callApi('STUDENT_EXPLANATION', {
      question: DEMO_QUESTION,
      student_answer: {
        chosen: studentAnswer,
        is_correct: studentAnswer === DEMO_QUESTION.answer,
      },
      student_state: {
        objective_code: 'MATH.S1.FRACTION.ADD',
        mastery_level: 1,
        interest_level: 3.0,
      },
    });
  };

  const runSessionSummary = () => {
    callApi('STUDENT_SESSION_SUMMARY', DEMO_SESSION);
  };

  const runClassSummary = () => {
    callApi('TEACHER_CLASS_SUMMARY', DEMO_CLASS);
  };

  const runQuestionAuthoring = () => {
    callApi('QUESTION_AUTHORING', DEMO_RAW_QUESTION);
  };

  const runGamification = () => {
    callApi('GAMIFICATION_MESSAGE', DEMO_GAMIFICATION);
  };

  const tabs = [
    { id: 'student' as Tab, label: 'Student Panel', icon: GraduationCap },
    { id: 'teacher' as Tab, label: 'Teacher Panel', icon: Users },
    { id: 'authoring' as Tab, label: 'Question Authoring', icon: PenLine },
    { id: 'gamification' as Tab, label: 'Gamification', icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Adaptive Learning for Schools</h1>
              <p className="text-sm text-slate-400">S1–S2 Adaptive Mathematics Platform — Hong Kong EDB Curriculum</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex gap-1.5 bg-slate-800/60 rounded-lg p-1 text-sm">
              {(['EN', 'ZH'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => { setLanguage(l); setResult(null); setError(null); }}
                  className={`px-3 py-1 rounded-md transition-colors ${language === l ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {l === 'EN' ? 'English' : '中文'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">Claude Haiku · HK EDB S1-S2 Curriculum</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Architecture overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: BookOpen, label: '20 Learning Objectives', sub: 'S1-S2 HK Curriculum' },
            { icon: Brain, label: '6 Agent Modes', sub: 'Student · Teacher · Admin' },
            { icon: Star, label: 'Bilingual', sub: 'English & 繁體中文' },
            { icon: Users, label: '3 User Panels', sub: 'Student · Teacher · Admin' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
              <Icon className="w-5 h-5 text-indigo-400 mb-2" />
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 mb-6 flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setResult(null); setError(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                tab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT: Input panel */}
          <div className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-6 space-y-5">

            {/* ─── STUDENT PANEL ───────────────────────────────── */}
            {tab === 'student' && (
              <>
                <div>
                  <h2 className="text-base font-semibold text-white mb-1">Student Explanation Demo</h2>
                  <p className="text-sm text-slate-400">
                    Student answers a fractions question. The agent explains why their answer is correct or incorrect,
                    relates it to the learning objective, and gives a next tip.
                  </p>
                </div>

                {/* Question preview */}
                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Question</p>
                  <p className="text-sm text-white font-medium">{DEMO_QUESTION.stem_en}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(DEMO_QUESTION.options_en).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setStudentAnswer(key)}
                        className={`text-sm px-3 py-2 rounded-lg border transition-colors text-left ${
                          studentAnswer === key
                            ? key === DEMO_QUESTION.answer
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                              : 'border-red-500/50 bg-red-500/10 text-red-300'
                            : 'border-slate-700/50 text-slate-300 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="font-medium mr-2">{key}.</span>{val}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Linked objective:</span>
                    <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {DEMO_QUESTION.learning_objectives[0].code}
                    </span>
                  </div>
                </div>

                {/* Session summary preview */}
                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Session Summary (20 min)</p>
                  <div className="space-y-2">
                    {DEMO_SESSION.mastery_deltas.map(d => (
                      <div key={d.objective_code} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{d.objective_code}</span>
                        <div className="flex items-center gap-2">
                          <MasteryBadge level={d.before} />
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <MasteryBadge level={d.after} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={runStudentExplanation}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    Explain Question
                  </button>
                  <button
                    onClick={runSessionSummary}
                    disabled={loading}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                    Session Summary
                  </button>
                </div>
              </>
            )}

            {/* ─── TEACHER PANEL ───────────────────────────────── */}
            {tab === 'teacher' && (
              <>
                <div>
                  <h2 className="text-base font-semibold text-white mb-1">Teacher Class Summary</h2>
                  <p className="text-sm text-slate-400">
                    Class 1A with 28 students. The agent analyses mastery/interest per objective and produces
                    priority re-teaching recommendations.
                  </p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Class 1A — Mastery Heatmap</p>
                  <div className="space-y-2">
                    {DEMO_CLASS.objective_stats.map(obj => {
                      const pct = (obj.avg_mastery / 4) * 100;
                      return (
                        <div key={obj.objective_code}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 truncate max-w-[200px]">{obj.name_en}</span>
                            <span className="text-xs text-slate-500">{obj.avg_mastery.toFixed(1)}/4</span>
                          </div>
                          <div className="h-1.5 bg-slate-700/60 rounded-full">
                            <div
                              className={`h-full rounded-full ${pct < 40 ? 'bg-red-500' : pct < 65 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Common Errors Observed</p>
                  <ul className="space-y-1">
                    {DEMO_CLASS.examples_of_common_errors.map((e, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">•</span>{e}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={runClassSummary}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Generate Class Summary & Recommendations
                </button>
              </>
            )}

            {/* ─── QUESTION AUTHORING ──────────────────────────── */}
            {tab === 'authoring' && (
              <>
                <div>
                  <h2 className="text-base font-semibold text-white mb-1">Question Authoring Assistant</h2>
                  <p className="text-sm text-slate-400">
                    Teacher uploads a question (from OCR or manual entry). The agent cleans the stem,
                    tags learning objectives, estimates difficulty, and writes bilingual explanations.
                  </p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Raw Question (EN)</p>
                  <p className="text-sm text-slate-200 italic">&quot;{DEMO_RAW_QUESTION.raw_text_en}&quot;</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Raw Question (ZH)</p>
                  <p className="text-sm text-slate-200 italic">&quot;{DEMO_RAW_QUESTION.raw_text_zh}&quot;</p>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Candidate Objectives</p>
                    <div className="flex flex-wrap gap-2">
                      {DEMO_RAW_QUESTION.candidate_objectives.map(obj => (
                        <span key={obj.code} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          {obj.code}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span className="bg-slate-700/60 px-2 py-0.5 rounded">{DEMO_RAW_QUESTION.grade_band}</span>
                    <span className="bg-slate-700/60 px-2 py-0.5 rounded">{DEMO_RAW_QUESTION.subtopic}</span>
                  </div>
                </div>

                <button
                  onClick={runQuestionAuthoring}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                  Author & Tag Question
                </button>
              </>
            )}

            {/* ─── GAMIFICATION ────────────────────────────────── */}
            {tab === 'gamification' && (
              <>
                <div>
                  <h2 className="text-base font-semibold text-white mb-1">Gamification Messages</h2>
                  <p className="text-sm text-slate-400">
                    Based on the student&apos;s recent progress, the agent writes an encouraging message
                    and proposes exploration-focused missions — rewarding curiosity, not grinding.
                  </p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Recent Mastery Progress</p>
                  {DEMO_GAMIFICATION.recent_mastery_changes.map(c => (
                    <div key={c.objective_code} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{c.objective_code}</span>
                      <div className="flex items-center gap-2">
                        <MasteryBadge level={c.old_level} />
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <MasteryBadge level={c.new_level} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Current Badges</p>
                  <div className="flex gap-2 flex-wrap">
                    {DEMO_GAMIFICATION.current_badges.map(b => (
                      <span key={b} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {b.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Sessions</p>
                  {DEMO_GAMIFICATION.recent_sessions.map(s => (
                    <div key={s.date} className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>{s.date}</span>
                      <span className="text-emerald-400">{(s.correct_rate * 100).toFixed(0)}% correct</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={runGamification}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gamepad2 className="w-4 h-4" />}
                  Generate Mission & Message
                </button>
              </>
            )}
          </div>

          {/* RIGHT: Result panel */}
          <div className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Agent Output</h3>
            {!loading && !result && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-3">
                <Brain className="w-10 h-10 opacity-40" />
                <p className="text-sm">Run an agent action to see the output</p>
              </div>
            )}
            <ResultPanel result={result} loading={loading} error={error} />
          </div>
        </div>

        {/* Mode reference */}
        <div className="mt-8 dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Agent Modes — Full API Reference</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { mode: 'STUDENT_EXPLANATION', desc: 'Explains why answer is correct/wrong; gives next tip', endpoint: 'POST /api/adaptive-learning/explain' },
              { mode: 'STUDENT_SESSION_SUMMARY', desc: 'Summarises a completed 20-min session with strengths and next steps', endpoint: 'POST /api/adaptive-learning/session-summary' },
              { mode: 'TEACHER_CLASS_SUMMARY', desc: 'Class heatmap → priority re-teach concepts + teaching recommendations', endpoint: 'POST /api/adaptive-learning/class-summary' },
              { mode: 'QUESTION_AUTHORING', desc: 'Cleans OCR/raw text, tags objectives, estimates difficulty, writes explanations', endpoint: 'POST /api/adaptive-learning/author-question' },
              { mode: 'GAMIFICATION_MESSAGE', desc: 'Encouraging badge message + exploration-focused missions', endpoint: 'POST /api/adaptive-learning/gamification' },
              { mode: 'ADMIN_SUMMARY', desc: 'Platform-level health flags and operational recommendations', endpoint: 'POST /api/adaptive-learning/demo (mode: ADMIN_SUMMARY)' },
            ].map(({ mode, desc, endpoint }) => (
              <div key={mode} className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-indigo-300 font-mono mb-1">{mode}</p>
                <p className="text-xs text-slate-400 mb-2">{desc}</p>
                <p className="text-xs text-slate-600 font-mono">{endpoint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
