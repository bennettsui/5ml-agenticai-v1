'use client';

import { useState } from 'react';
import {
  BookOpen, Users, PenLine, Gamepad2, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, GraduationCap, Brain, Star, UserCircle
} from 'lucide-react';

type Tab = 'student-explain' | 'student-session' | 'teacher-class' | 'teacher-student' | 'authoring' | 'gamification';
type Language = 'EN' | 'ZH';

interface ApiResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_QUESTION = {
  stem_en: 'Evaluate: 3/4 + 5/6',
  stem_zh: '計算：3/4 + 5/6',
  type: 'MCQ',
  options_en: ['8/10', '8/12', '1 and 7/12', '19/24'],
  options_zh: ['8/10', '8/12', '1又7/12', '19/24'],
  answer: { option: 'C', value: '1 and 7/12' },
  learning_objectives: [
    {
      code: 'MATH.S1.FRACTION.ADD',
      topic: 'Number & Algebra',
      subtopic: 'Fractions',
      name_en: 'Addition and Subtraction of Fractions',
      name_zh: '分數的加法與減法',
      description_en: 'Add and subtract fractions with unlike denominators using LCM.',
      description_zh: '能利用最小公倍數對不同分母的分數進行加減運算。',
    },
  ],
};

const DEMO_SESSION = {
  session_info: { session_id: 'sess-001', mode: 'PRACTICE', started_at: '2026-03-05T09:00:00Z', ended_at: '2026-03-05T09:20:00Z' },
  interactions: [
    { question_id: 'q1', learning_objectives: [{ code: 'MATH.S1.FRACTION.ADD', name_en: 'Add Fractions', name_zh: '分數加法' }], correctness: 'CORRECT', time_taken_seconds: 45, self_rating_understanding: 4, self_rating_interest: 3 },
    { question_id: 'q2', learning_objectives: [{ code: 'MATH.S1.FRACTION.ADD', name_en: 'Add Fractions', name_zh: '分數加法' }], correctness: 'INCORRECT', time_taken_seconds: 90, self_rating_understanding: 2, self_rating_interest: 3 },
    { question_id: 'q3', learning_objectives: [{ code: 'MATH.S1.ALGEBRA.EQUATION1', name_en: 'Linear Equations', name_zh: '一元一次方程' }], correctness: 'CORRECT', time_taken_seconds: 60, self_rating_understanding: 4, self_rating_interest: 4 },
    { question_id: 'q4', learning_objectives: [{ code: 'MATH.S1.MEASURE.CIRCLE', name_en: 'Circle Area', name_zh: '圓的面積' }], correctness: 'CORRECT', time_taken_seconds: 50, self_rating_understanding: 3, self_rating_interest: 5 },
  ],
  mastery_deltas: [
    { objective_code: 'MATH.S1.FRACTION.ADD', old_mastery_level: 1, new_mastery_level: 2, old_interest_level: 3.0, new_interest_level: 3.2 },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', old_mastery_level: 2, new_mastery_level: 3, old_interest_level: 3.5, new_interest_level: 3.8 },
    { objective_code: 'MATH.S1.MEASURE.CIRCLE', old_mastery_level: 3, new_mastery_level: 3, old_interest_level: 4.5, new_interest_level: 4.8 },
  ],
};

const DEMO_CLASS = {
  class_info: { class_id: 'S1A', grade: 'S1' },
  objective_stats: [
    { objective_code: 'MATH.S1.FRACTION.ADD', topic: 'Number & Algebra', subtopic: 'Fractions', name_en: 'Add Fractions', name_zh: '分數加法', avg_mastery_level: 1.8, avg_interest_level: 2.9, student_counts_by_level: { '0': 2, '1': 10, '2': 12, '3': 3, '4': 1 } },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', topic: 'Number & Algebra', subtopic: 'Linear Equations', name_en: 'Linear Equations', name_zh: '一元一次方程', avg_mastery_level: 2.5, avg_interest_level: 3.2, student_counts_by_level: { '0': 0, '1': 5, '2': 14, '3': 7, '4': 2 } },
    { objective_code: 'MATH.S1.MEASURE.CIRCLE', topic: 'Measures', subtopic: 'Circles', name_en: 'Circle Area', name_zh: '圓的面積', avg_mastery_level: 3.1, avg_interest_level: 4.0, student_counts_by_level: { '0': 0, '1': 2, '2': 8, '3': 10, '4': 8 } },
    { objective_code: 'MATH.S1.PERCENT.BASIC', topic: 'Number & Algebra', subtopic: 'Percentages', name_en: 'Percentages', name_zh: '百分數', avg_mastery_level: 1.2, avg_interest_level: 2.5, student_counts_by_level: { '0': 8, '1': 14, '2': 5, '3': 1, '4': 0 } },
  ],
  example_items: [
    { objective_code: 'MATH.S1.FRACTION.ADD', common_error_description: 'Students add numerators and denominators separately (e.g. 3/4 + 5/6 = 8/10)', question_stem_en: '3/4 + 5/6 = ?', question_stem_zh: '3/4 + 5/6 = ?' },
  ],
};

const DEMO_STUDENT_PROFILE = {
  student_info: { student_id: 'stu-042', name: 'Chan Siu Ming', grade: 'S1', class_name: 'S1A' },
  objective_states: [
    { objective_code: 'MATH.S1.FRACTION.ADD', topic: 'Number & Algebra', subtopic: 'Fractions', name_en: 'Add Fractions', name_zh: '分數加法', mastery_level: 1, interest_level: 2.5, last_practiced_at: '2026-03-04T10:00:00Z' },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', topic: 'Number & Algebra', subtopic: 'Linear Equations', name_en: 'Linear Equations', name_zh: '一元一次方程', mastery_level: 3, interest_level: 4.2, last_practiced_at: '2026-03-05T09:00:00Z' },
    { objective_code: 'MATH.S1.MEASURE.CIRCLE', topic: 'Measures', subtopic: 'Circles', name_en: 'Circle Area', name_zh: '圓的面積', mastery_level: 4, interest_level: 4.8, last_practiced_at: '2026-03-05T09:20:00Z' },
    { objective_code: 'MATH.S1.PERCENT.BASIC', topic: 'Number & Algebra', subtopic: 'Percentages', name_en: 'Percentages', name_zh: '百分數', mastery_level: 0, interest_level: 2.0, last_practiced_at: null },
  ],
  recent_sessions: [
    { session_id: 'sess-001', mode: 'PRACTICE', started_at: '2026-03-05T09:00:00Z', ended_at: '2026-03-05T09:20:00Z', key_objectives: ['MATH.S1.FRACTION.ADD', 'MATH.S1.ALGEBRA.EQUATION1'] },
    { session_id: 'sess-002', mode: 'EXPLORATION', started_at: '2026-03-04T10:00:00Z', ended_at: '2026-03-04T10:20:00Z', key_objectives: ['MATH.S1.MEASURE.CIRCLE'] },
  ],
};

const DEMO_RAW_QUESTION = {
  raw_text_en: 'If a shopkeeper buys an item for $80 and sells it for $100, what is the percentage profit?',
  raw_text_zh: '如果一個商販以80元購買一件物品，並以100元出售，利潤百分比是多少？',
  grade_band: 'S1',
  topic: 'Number and Algebra',
  subtopic: 'Percentages',
  candidate_objectives: [
    { code: 'MATH.S1.PERCENT.BASIC', name_en: 'Percentages — Concepts and Applications', name_zh: '百分數概念與應用', description_en: 'Solve problems involving percentage change, profit, loss and discount.', description_zh: '解決涉及百分比變化、利潤、虧損及折扣的問題。' },
    { code: 'MATH.S1.RATIO.BASIC', name_en: 'Ratio and Rate', name_zh: '比率與速率', description_en: 'Understand ratio and rate.', description_zh: '理解比率與速率的概念。' },
  ],
};

const DEMO_GAMIFICATION = {
  recent_mastery_changes: [
    { objective_code: 'MATH.S1.FRACTION.ADD', old_mastery_level: 1, new_mastery_level: 2 },
    { objective_code: 'MATH.S1.ALGEBRA.EQUATION1', old_mastery_level: 2, new_mastery_level: 3 },
  ],
  recent_sessions: [
    { date: '2026-03-04', duration_mins: 20, correct_rate: 0.75 },
    { date: '2026-03-05', duration_mins: 20, correct_rate: 0.80 },
  ],
  current_badges: ['FIRST_SESSION', 'STREAK_3'],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MasteryBar({ level, total = 4 }: { level: number; total?: number }) {
  const pct = (level / total) * 100;
  const color = pct < 40 ? 'bg-red-500' : pct < 65 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="h-1.5 bg-slate-700/60 rounded-full">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
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
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[level] ?? colors[0]}`}>
      {labels[level] ?? 'Unknown'}
    </span>
  );
}

function ResultPanel({ result, loading, error }: { result: Record<string, unknown> | null; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
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
      <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 max-h-[500px] overflow-y-auto space-y-4">
        {Object.entries(result).map(([key, value]) => (
          <div key={key}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">{key.replace(/_/g, ' ')}</p>
            {Array.isArray(value) ? (
              <ul className="space-y-1.5">
                {(value as unknown[]).map((item, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-slate-500 shrink-0 mt-0.5 tabular-nums">{i + 1}.</span>
                    <span>{typeof item === 'object' && item !== null ? JSON.stringify(item, null, 0).replace(/[{}"]/g, '').trim() : String(item)}</span>
                  </li>
                ))}
              </ul>
            ) : typeof value === 'object' && value !== null ? (
              <pre className="text-xs text-slate-300 bg-white/[0.02] rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-slate-200 leading-relaxed">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdaptiveLearningPage() {
  const [tab, setTab] = useState<Tab>('student-explain');
  const [language, setLanguage] = useState<Language>('EN');
  const [studentAnswer, setStudentAnswer] = useState<string>('A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callDemo = async (mode: string, payload: Record<string, unknown>) => {
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

  const resetOutput = () => { setResult(null); setError(null); };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; agent: string }[] = [
    { id: 'student-explain', label: 'Explain Question', icon: Brain, agent: 'StudentAgent' },
    { id: 'student-session', label: 'Session Summary', icon: BookOpen, agent: 'StudentAgent' },
    { id: 'teacher-class', label: 'Class Summary', icon: Users, agent: 'TeacherAgent' },
    { id: 'teacher-student', label: 'Student Profile', icon: UserCircle, agent: 'TeacherAgent' },
    { id: 'authoring', label: 'Question Authoring', icon: PenLine, agent: 'QuestionAgent' },
    { id: 'gamification', label: 'Gamification', icon: Gamepad2, agent: 'Inline' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Adaptive Learning for Schools</h1>
              <p className="text-sm text-slate-400 mt-0.5">S1–S2 Adaptive Mathematics — HK EDB Curriculum · 3 Specialist Claude Agents</p>
            </div>
          </div>

          {/* Agent architecture chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: 'StudentAgent', modes: 'EXPLAIN_ONE_QUESTION · SESSION_SUMMARY', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
              { label: 'TeacherAgent', modes: 'CLASS_SUMMARY · STUDENT_PROFILE', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
              { label: 'QuestionAgent', modes: 'QUESTION_AUTHORING', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
            ].map(({ label, modes, color }) => (
              <div key={label} className={`flex items-center gap-2 text-xs border rounded-lg px-3 py-1.5 ${color}`}>
                <span className="font-semibold">{label}</span>
                <span className="opacity-60">·</span>
                <span className="opacity-80">{modes}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 text-sm">
              {(['EN', 'ZH'] as Language[]).map(l => (
                <button key={l} onClick={() => { setLanguage(l); resetOutput(); }}
                  className={`px-3 py-1 rounded-md transition-colors ${language === l ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {l === 'EN' ? 'English' : '中文（繁）'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">Model: claude-haiku-4-5-20251001</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: BookOpen, label: '20 Learning Objectives', sub: 'HK EDB S1-S2' },
            { icon: Brain, label: '3 Specialist Agents', sub: 'Student · Teacher · Question' },
            { icon: Star, label: 'Bilingual Output', sub: 'EN & 繁體中文' },
            { icon: Users, label: '7 Agent Modes', sub: 'Explain · Summary · Profile · Author · Gamify' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
              <Icon className="w-5 h-5 text-indigo-400 mb-2" />
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {tabs.map(({ id, label, icon: Icon, agent }) => (
            <button key={id} onClick={() => { setTab(id); resetOutput(); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {tab !== id && (
                <span className="text-xs opacity-50 font-normal">{agent}</span>
              )}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT: Input */}
          <div className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-6 space-y-5">

            {/* ─── EXPLAIN_ONE_QUESTION ─── */}
            {tab === 'student-explain' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">StudentAgent</span>
                    <span className="text-xs text-slate-500">EXPLAIN_ONE_QUESTION</span>
                  </div>
                  <h2 className="text-base font-semibold text-white">Explain a Question</h2>
                  <p className="text-sm text-slate-400 mt-1">Student answers a fractions question. The agent explains the concept, why their answer is right/wrong, and gives a next tip.</p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Question (S1 · Fractions)</p>
                  <p className="text-sm text-white font-medium">{DEMO_QUESTION.stem_en}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((key, i) => (
                      <button key={key} onClick={() => setStudentAnswer(key)}
                        className={`text-sm px-3 py-2 rounded-lg border transition-colors text-left ${
                          studentAnswer === key
                            ? key === 'C' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                              : 'border-red-500/50 bg-red-500/10 text-red-300'
                            : 'border-slate-700/50 text-slate-300 hover:bg-white/[0.02]'
                        }`}>
                        <span className="font-medium mr-2">{key}.</span>{DEMO_QUESTION.options_en[i]}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">Linked objective:</span>
                    <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono">MATH.S1.FRACTION.ADD</span>
                  </div>
                </div>

                <button onClick={() => callDemo('EXPLAIN_ONE_QUESTION', {
                  question: DEMO_QUESTION,
                  student_answer: { raw: { option: studentAnswer }, correctness: studentAnswer === 'C' ? 'CORRECT' : 'INCORRECT' },
                  student_state_for_objectives: [{ objective_code: 'MATH.S1.FRACTION.ADD', mastery_level: 1, interest_level: 3.0 }],
                })} disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  Run StudentAgent → Explain Question
                </button>
              </>
            )}

            {/* ─── SESSION_SUMMARY ─── */}
            {tab === 'student-session' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">StudentAgent</span>
                    <span className="text-xs text-slate-500">SESSION_SUMMARY</span>
                  </div>
                  <h2 className="text-base font-semibold text-white">Session Summary</h2>
                  <p className="text-sm text-slate-400 mt-1">After a 20-minute practice session. The agent summarises concepts covered, mastery gains, interest signals, and next steps.</p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">4 Interactions · 20 min · PRACTICE mode</p>
                  {DEMO_SESSION.mastery_deltas.map(d => (
                    <div key={d.objective_code} className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 font-mono">{d.objective_code}</span>
                      <div className="flex items-center gap-2">
                        <MasteryBadge level={d.old_mastery_level} />
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <MasteryBadge level={d.new_mastery_level} />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 mt-3">Self-ratings: understanding avg 3.3/5 · interest avg 3.8/5</p>
                </div>

                <button onClick={() => callDemo('SESSION_SUMMARY', DEMO_SESSION)} disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  Run StudentAgent → Session Summary
                </button>
              </>
            )}

            {/* ─── CLASS_SUMMARY ─── */}
            {tab === 'teacher-class' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">TeacherAgent</span>
                    <span className="text-xs text-slate-500">CLASS_SUMMARY</span>
                  </div>
                  <h2 className="text-base font-semibold text-white">Class Summary & Recommendations</h2>
                  <p className="text-sm text-slate-400 mt-1">Class 1A mastery heatmap with common errors. The agent identifies priority concepts and suggests teaching actions.</p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Class 1A · S1 · Mastery per Objective</p>
                  {DEMO_CLASS.objective_stats.map(obj => (
                    <div key={obj.objective_code} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400 truncate max-w-[200px]">{obj.name_en}</span>
                        <span className="text-xs text-slate-500 shrink-0 ml-2">{obj.avg_mastery_level.toFixed(1)}/4 · ♥ {obj.avg_interest_level.toFixed(1)}</span>
                      </div>
                      <MasteryBar level={obj.avg_mastery_level} />
                    </div>
                  ))}
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Common Error Observed</p>
                  <p className="text-xs text-slate-400">{DEMO_CLASS.example_items[0].common_error_description}</p>
                </div>

                <button onClick={() => callDemo('CLASS_SUMMARY', DEMO_CLASS)} disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Run TeacherAgent → Class Summary
                </button>
              </>
            )}

            {/* ─── STUDENT_PROFILE ─── */}
            {tab === 'teacher-student' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">TeacherAgent</span>
                    <span className="text-xs text-slate-500">STUDENT_PROFILE</span>
                  </div>
                  <h2 className="text-base font-semibold text-white">Individual Student Profile</h2>
                  <p className="text-sm text-slate-400 mt-1">Teacher view of one student: mastery per objective, interest signals, and targeted recommendations.</p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Chan Siu Ming · S1A</p>
                  {DEMO_STUDENT_PROFILE.objective_states.map(obj => (
                    <div key={obj.objective_code} className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs text-slate-400">{obj.name_en}</p>
                        <p className="text-xs text-slate-600 font-mono">{obj.objective_code}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <MasteryBadge level={obj.mastery_level} />
                        <span className="text-xs text-slate-500">♥{obj.interest_level}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => callDemo('STUDENT_PROFILE', DEMO_STUDENT_PROFILE)} disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCircle className="w-4 h-4" />}
                  Run TeacherAgent → Student Profile
                </button>
              </>
            )}

            {/* ─── QUESTION_AUTHORING ─── */}
            {tab === 'authoring' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">QuestionAgent</span>
                    <span className="text-xs text-slate-500">QUESTION_AUTHORING</span>
                  </div>
                  <h2 className="text-base font-semibold text-white">Question Authoring & Tagging</h2>
                  <p className="text-sm text-slate-400 mt-1">Teacher uploads a raw/OCR question. The agent cleans the stem, selects objectives, estimates difficulty, and writes bilingual explanations.</p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Raw Text (EN)</p>
                    <p className="text-sm text-slate-200 italic">&quot;{DEMO_RAW_QUESTION.raw_text_en}&quot;</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Raw Text (ZH)</p>
                    <p className="text-sm text-slate-200 italic">&quot;{DEMO_RAW_QUESTION.raw_text_zh}&quot;</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Candidate Objectives</p>
                    <div className="flex flex-wrap gap-2">
                      {DEMO_RAW_QUESTION.candidate_objectives.map(obj => (
                        <span key={obj.code} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                          {obj.code}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-400">
                    <span className="bg-slate-700/60 px-2 py-0.5 rounded">{DEMO_RAW_QUESTION.grade_band}</span>
                    <span className="bg-slate-700/60 px-2 py-0.5 rounded">{DEMO_RAW_QUESTION.subtopic}</span>
                  </div>
                </div>

                <button onClick={() => callDemo('QUESTION_AUTHORING', DEMO_RAW_QUESTION)} disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                  Run QuestionAgent → Author & Tag
                </button>
              </>
            )}

            {/* ─── GAMIFICATION ─── */}
            {tab === 'gamification' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40 px-2 py-0.5 rounded-full">Inline Agent</span>
                    <span className="text-xs text-slate-500">GAMIFICATION_MESSAGE</span>
                  </div>
                  <h2 className="text-base font-semibold text-white">Gamification Messages</h2>
                  <p className="text-sm text-slate-400 mt-1">Based on recent mastery progress, the agent writes an encouraging message and proposes exploration-focused missions — rewarding curiosity, not grinding.</p>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Recent Mastery Changes</p>
                  {DEMO_GAMIFICATION.recent_mastery_changes.map(c => (
                    <div key={c.objective_code} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">{c.objective_code}</span>
                      <div className="flex items-center gap-2">
                        <MasteryBadge level={c.old_mastery_level} />
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <MasteryBadge level={c.new_mastery_level} />
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

                <button onClick={() => callDemo('GAMIFICATION_MESSAGE', DEMO_GAMIFICATION)} disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gamepad2 className="w-4 h-4" />}
                  Run Inline Agent → Gamification
                </button>
              </>
            )}
          </div>

          {/* RIGHT: Output */}
          <div className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Agent Output</h3>
            {!loading && !result && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-3">
                <Brain className="w-10 h-10 opacity-30" />
                <p className="text-sm">Run an agent to see the output</p>
              </div>
            )}
            <ResultPanel result={result} loading={loading} error={error} />
          </div>
        </div>

        {/* Mode / agent reference table */}
        <div className="mt-8 dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Specialist Agent Architecture</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                agent: 'StudentAgent',
                color: 'border-blue-500/30 bg-blue-500/5',
                badge: 'bg-blue-500/10 text-blue-300',
                modes: [
                  { mode: 'EXPLAIN_ONE_QUESTION', desc: 'Concept explanation + why right/wrong + next tip', endpoint: '/explain' },
                  { mode: 'SESSION_SUMMARY', desc: 'Session recap with strengths, gaps, and next steps', endpoint: '/session-summary' },
                ],
              },
              {
                agent: 'TeacherAgent',
                color: 'border-purple-500/30 bg-purple-500/5',
                badge: 'bg-purple-500/10 text-purple-300',
                modes: [
                  { mode: 'CLASS_SUMMARY', desc: 'Class mastery overview + priority re-teach concepts + teaching actions', endpoint: '/class-summary' },
                  { mode: 'STUDENT_PROFILE', desc: 'Individual student strengths, areas to watch, and targeted recommendations', endpoint: '/student-profile' },
                ],
              },
              {
                agent: 'QuestionAgent',
                color: 'border-amber-500/30 bg-amber-500/5',
                badge: 'bg-amber-500/10 text-amber-300',
                modes: [
                  { mode: 'QUESTION_AUTHORING', desc: 'Clean OCR/draft text, tag objectives, estimate difficulty, write bilingual explanations', endpoint: '/author-question' },
                ],
              },
            ].map(({ agent, color, badge, modes }) => (
              <div key={agent} className={`rounded-xl border p-4 ${color}`}>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge} mb-3 inline-block`}>{agent}</span>
                <div className="space-y-3">
                  {modes.map(({ mode, desc, endpoint }) => (
                    <div key={mode}>
                      <p className="text-xs text-slate-300 font-mono mb-0.5">{mode}</p>
                      <p className="text-xs text-slate-400 mb-0.5">{desc}</p>
                      <p className="text-xs text-slate-600 font-mono">POST /api/adaptive-learning{endpoint}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
