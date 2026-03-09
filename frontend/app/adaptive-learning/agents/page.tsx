'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Brain, BookOpen, Users, PenLine, Gamepad2, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, UserCircle, MessageSquare,
  BookMarked, Layout, Network, GitBranch, Star, GraduationCap
} from 'lucide-react';

type Language = 'EN' | 'ZH';

interface AgentGroup {
  id: string;
  label: string;
  agent: string;
  color: string;
  tabs: TabDef[];
}

interface TabDef {
  id: string;
  label: string;
  mode: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ApiResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

const AGENT_GROUPS: AgentGroup[] = [
  { id: 'student', label: 'StudentAgent', agent: 'StudentAgent', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    tabs: [
      { id: 'explain', label: 'Explain Question', mode: 'EXPLAIN_ONE_QUESTION', icon: Brain },
      { id: 'session', label: 'Session Summary', mode: 'SESSION_SUMMARY', icon: BookOpen },
    ] },
  { id: 'teacher', label: 'TeacherAgent', agent: 'TeacherAgent', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    tabs: [
      { id: 'class', label: 'Class Summary', mode: 'CLASS_SUMMARY', icon: Users },
      { id: 'student-prof', label: 'Student Profile', mode: 'STUDENT_PROFILE', icon: UserCircle },
    ] },
  { id: 'question', label: 'QuestionAgent', agent: 'QuestionAgent', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    tabs: [{ id: 'authoring', label: 'Author Question', mode: 'QUESTION_AUTHORING', icon: PenLine }] },
  { id: 'studentUx', label: 'StudentUxAgent', agent: 'StudentUxAgent', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    tabs: [
      { id: 'welcome', label: 'Welcome', mode: 'WELCOME', icon: Star },
      { id: 'session-intro', label: 'Session Intro', mode: 'SESSION_INTRO', icon: GraduationCap },
      { id: 'q-feedback', label: 'Question Feedback', mode: 'QUESTION_FEEDBACK', icon: MessageSquare },
      { id: 'gamif', label: 'Gamification', mode: 'GAMIFICATION_EVENT', icon: Gamepad2 },
    ] },
  { id: 'teacherGuide', label: 'TeacherGuideAgent', agent: 'TeacherGuideAgent', color: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    tabs: [
      { id: 'intro-page', label: 'Intro Page', mode: 'INTRO_PAGE', icon: Layout },
      { id: 'step-by-step', label: 'Step-by-Step Guide', mode: 'STEP_BY_STEP_FEATURE', icon: BookMarked },
      { id: 'faq', label: 'FAQ', mode: 'FAQ', icon: MessageSquare },
    ] },
  { id: 'techArch', label: 'TechArchAgent', agent: 'TechArchAgent', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    tabs: [
      { id: 'arch', label: 'Architecture', mode: 'HIGH_LEVEL_ARCH', icon: Network },
      { id: 'seq-session', label: 'Student Session Seq', mode: 'SEQUENCE_STUDENT_SESSION', icon: GitBranch },
      { id: 'seq-upload', label: 'Teacher Upload Seq', mode: 'SEQUENCE_TEACHER_UPLOAD', icon: GitBranch },
      { id: 'seq-dash', label: 'Dashboard Seq', mode: 'SEQUENCE_TEACHER_DASHBOARD', icon: GitBranch },
    ] },
  { id: 'gamification', label: 'GamificationAgent', agent: 'GamificationAgent', color: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    tabs: [
      { id: 'badge', label: 'Badge Message', mode: 'BADGE_MESSAGE', icon: Star },
      { id: 'missions', label: 'Suggest Missions', mode: 'SUGGEST_MISSIONS', icon: Gamepad2 },
      { id: 'nudge', label: 'Progress Nudge', mode: 'PROGRESS_NUDGE', icon: ChevronRight },
    ] },
  { id: 'adminReport', label: 'AdminReportAgent', agent: 'AdminReportAgent', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    tabs: [
      { id: 'term-report', label: 'Term Report', mode: 'TERM_REPORT', icon: BookOpen },
      { id: 'grade-report', label: 'Grade Report', mode: 'GRADE_REPORT', icon: GraduationCap },
      { id: 'class-report', label: 'Class Report', mode: 'CLASS_REPORT', icon: Users },
    ] },
];

const ALL_TABS = AGENT_GROUPS.flatMap(g => g.tabs.map(t => ({ ...t, groupId: g.id, groupLabel: g.label, groupColor: g.color })));

const DEMO_PAYLOADS: Record<string, Record<string, unknown>> = {
  EXPLAIN_ONE_QUESTION: { question: { stem_en: 'Evaluate: 3/4 + 5/6', stem_zh: '計算：3/4 + 5/6', type: 'MCQ', options_en: ['8/10', '8/12', '1 and 7/12', '19/24'], answer: { option: 'A', value: '8/10' }, learning_objectives: [{ code: 'MATH.S1.FRACTION.ADD', topic: 'Number & Algebra', subtopic: 'Fractions', name_en: 'Add Fractions (unlike denominators)', name_zh: '不同分母分數加法', description_en: 'Add fractions with unlike denominators using LCM.', description_zh: '利用最小公倍數加減不同分母分數。' }] }, student_answer: { raw: { option: 'A' }, correctness: 'INCORRECT' }, student_state_for_objectives: [{ objective_code: 'MATH.S1.FRACTION.ADD', mastery_level: 1, interest_level: 3.0 }] },
  SESSION_SUMMARY: { session_info: { session_id: 'sess-001', mode: 'PRACTICE', started_at: '2026-03-05T09:00:00Z', ended_at: '2026-03-05T09:20:00Z' }, interactions: [{ question_id: 'q1', learning_objectives: [{ code: 'MATH.S1.FRACTION.ADD', name_en: 'Add Fractions', name_zh: '分數加法' }], correctness: 'CORRECT', time_taken_seconds: 45, self_rating_understanding: 4, self_rating_interest: 3 }, { question_id: 'q2', learning_objectives: [{ code: 'MATH.S1.FRACTION.ADD', name_en: 'Add Fractions', name_zh: '分數加法' }], correctness: 'INCORRECT', time_taken_seconds: 90, self_rating_understanding: 2, self_rating_interest: 3 }], mastery_deltas: [{ objective_code: 'MATH.S1.FRACTION.ADD', old_mastery_level: 1, new_mastery_level: 2, old_interest_level: 3.0, new_interest_level: 3.2 }] },
  CLASS_SUMMARY: { class_info: { class_id: 'S1A', grade: 'S1' }, objective_stats: [{ objective_code: 'MATH.S1.FRACTION.ADD', topic: 'Number & Algebra', subtopic: 'Fractions', name_en: 'Add Fractions', name_zh: '分數加法', avg_mastery_level: 1.8, avg_interest_level: 2.9, student_counts_by_level: { '0': 2, '1': 10, '2': 12, '3': 3, '4': 1 } }] },
  STUDENT_PROFILE: { student_info: { student_id: 'stu-042', name: 'Chan Siu Ming', grade: 'S1', class_name: 'S1A' }, objective_states: [{ objective_code: 'MATH.S1.FRACTION.ADD', topic: 'Number & Algebra', subtopic: 'Fractions', name_en: 'Add Fractions', name_zh: '分數加法', mastery_level: 1, interest_level: 2.5, last_practiced_at: '2026-03-04T10:00:00Z' }] },
  QUESTION_AUTHORING: { raw_text_en: 'If a shopkeeper buys an item for $80 and sells it for $100, what is the percentage profit?', raw_text_zh: '商販以80元購入一件貨品，以100元售出，利潤百分比是多少？', grade_band: 'S1', topic: 'Number and Algebra', subtopic: 'Percentages', candidate_objectives: [{ code: 'MATH.S1.PERCENT.BASIC', name_en: 'Percentages — Concepts and Applications', name_zh: '百分數概念與應用', description_en: 'Solve problems involving percentage change, profit, loss and discount.', description_zh: '解決涉及百分比變化、利潤、虧損及折扣的問題。' }] },
  WELCOME: { student_name: 'Siu Ming', returning: false },
  SESSION_INTRO: { grade: 'S1', selected_topics: ['Fractions', 'Equations'] },
  QUESTION_FEEDBACK: { correctness: 'INCORRECT', concept_name_en: 'Adding fractions with unlike denominators', concept_name_zh: '不同分母分數加法' },
  SESSION_SUMMARY_STUDENT: { key_concepts: ['MATH.S1.FRACTION.ADD', 'MATH.S1.ALGEBRA.EQUATION1'], concept_names_en: ['Add Fractions', 'Linear Equations'], concept_names_zh: ['分數加法', '一元一次方程'], improved_concepts: ['MATH.S1.ALGEBRA.EQUATION1'], struggle_concepts: ['MATH.S1.FRACTION.ADD'] },
  GAMIFICATION_EVENT: { event_type: 'BADGE_UNLOCKED', badge_name_en: 'Concept Explorer', badge_name_zh: '概念探險家', mission_description_en: null, mission_description_zh: null },
  INTRO_PAGE: { grade_range: 'S1–S2', subject: 'Mathematics' },
  STEP_BY_STEP_FEATURE: { feature: 'UPLOAD_PAST_PAPER' },
  FAQ: { questions: ['How does the system decide which questions to give students?', 'Will this platform replace my role as a teacher?', 'How is this different from past-paper drilling websites?'] },
  HIGH_LEVEL_ARCH: { include_mermaid: false },
  SEQUENCE_STUDENT_SESSION: { format: 'MERMAID' },
  SEQUENCE_TEACHER_UPLOAD: { format: 'MERMAID' },
  SEQUENCE_TEACHER_DASHBOARD: { format: 'MERMAID' },
  BADGE_MESSAGE: { badge_code: 'CONCEPT_EXPLORER', badge_name_en: 'Concept Explorer', badge_name_zh: '概念探險家', context: { recent_concepts: ['MATH.S1.FRACTION.ADD', 'MATH.S1.ALGEBRA.EQUATION1'], recent_concept_names_en: ['Adding fractions', 'Solving linear equations'], recent_concept_names_zh: ['分數加法', '一元一次方程'] } },
  SUGGEST_MISSIONS: { recent_mastery_changes: [{ objective_code: 'MATH.S1.FRACTION.ADD', objective_name_en: 'Adding fractions', objective_name_zh: '分數加法', delta_mastery: 1, delta_interest: 0.5 }], recent_sessions_count: 3, days_since_last_session: 2 },
  PROGRESS_NUDGE: { days_since_last_session: 7, last_focus_concepts_en: ['Adding fractions', 'Linear equations'], last_focus_concepts_zh: ['分數加法', '一元一次方程'] },
  TERM_REPORT: { school_name: 'XXX 中學', term_label: '2026-27 上學期', usage_stats: { active_students: 120, total_sessions: 860 }, learning_stats: { concept_groups: [{ group_name_zh: '分數與百分比', group_name_en: 'Fractions & Percentages', avg_mastery_change: 0.8, students_reaching_target_pct: 0.72 }] } },
  GRADE_REPORT: { grade_name: 'S1', term_label: '2026-27 上學期', usage_stats: { active_students: 60, total_sessions: 430 } },
  CLASS_REPORT: { class_name: 'S1A', grade_name: 'S1', term_label: '2026-27 上學期', usage_stats: { active_students: 30, total_sessions: 185 } },
};

function AgentBadge({ color, label }: { color: string; label: string }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>{label}</span>;
}

function ResultPanel({ result, loading, error }: { result: Record<string, unknown> | null; loading: boolean; error: string | null }) {
  if (loading) return (
    <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
      <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Agent thinking…</span>
    </div>
  );
  if (error) return (
    <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p className="text-sm">{error}</p>
    </div>
  );
  if (!result) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-3">
      <Brain className="w-10 h-10 opacity-20" />
      <p className="text-sm">Run an agent to see output here</p>
    </div>
  );

  const renderValue = (value: unknown): React.ReactNode => {
    if (typeof value === 'string') {
      if (value.includes('\n') || value.startsWith('sequenceDiagram') || value.startsWith('graph ') || value.startsWith('flowchart')) {
        return <pre className="text-xs text-emerald-300 bg-slate-900/60 rounded p-3 overflow-x-auto whitespace-pre font-mono leading-relaxed">{value}</pre>;
      }
      return <p className="text-sm text-slate-200 leading-relaxed">{value}</p>;
    }
    if (Array.isArray(value)) return (
      <ul className="space-y-1.5">
        {(value as unknown[]).map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-slate-600 shrink-0 mt-0.5 tabular-nums">{i + 1}.</span>
            <span className="leading-relaxed">{typeof item === 'object' && item !== null ? renderValue(item) : String(item)}</span>
          </li>
        ))}
      </ul>
    );
    if (typeof value === 'object' && value !== null) return (
      <div className="space-y-3 pl-3 border-l border-slate-700/50">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{k.replace(/_/g, ' ')}</p>
            {renderValue(v)}
          </div>
        ))}
      </div>
    );
    return <span className="text-sm text-slate-300">{String(value)}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />Agent response
      </div>
      <div className="bg-white/[0.03] border border-slate-700/50 rounded-lg p-4 max-h-[560px] overflow-y-auto space-y-5">
        {Object.entries(result).map(([key, value]) => (
          <div key={key}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">{key.replace(/_/g, ' ')}</p>
            {renderValue(value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PayloadPreview({ mode, language }: { mode: string; language: Language }) {
  const payload = DEMO_PAYLOADS[mode];
  if (!payload) return null;
  return (
    <div className="bg-white/[0.02] border border-slate-700/50 rounded-lg p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Demo payload · language={language}</p>
      <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed font-mono">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

const STEP_FEATURES = [
  { value: 'UPLOAD_PAST_PAPER', label: 'Upload Past Paper' },
  { value: 'CHECK_CLASS_DASHBOARD', label: 'Check Class Dashboard' },
  { value: 'CHECK_STUDENT_PROFILE', label: 'Check Student Profile' },
  { value: 'PLAN_LESSON_USING_DASHBOARD', label: 'Plan Lesson with Dashboard' },
];

export default function AgentsDemoPage() {
  const [activeTab, setActiveTab] = useState('explain');
  const [language, setLanguage] = useState<Language>('EN');
  const [stepFeature, setStepFeature] = useState<string>('UPLOAD_PAST_PAPER');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTab = ALL_TABS.find(t => t.id === activeTab)!;
  const currentGroup = AGENT_GROUPS.find(g => g.id === currentTab?.groupId)!;
  const resetOutput = () => { setResult(null); setError(null); };

  const runAgent = async () => {
    if (!currentTab) return;
    setLoading(true); setResult(null); setError(null);
    let mode = currentTab.mode;
    let payload: Record<string, unknown> = { ...(DEMO_PAYLOADS[mode] || {}) };
    if (mode === 'STEP_BY_STEP_FEATURE') payload = { feature: stepFeature };
    try {
      const res = await fetch('/api/adaptive-learning/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, language, payload }),
      });
      const data: ApiResult = await res.json();
      if (data.success && data.result) setResult(data.result);
      else setError(data.error || 'Request failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-start gap-3 mb-4 sm:mb-5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-semibold text-white">Adaptive Learning for Schools</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">S1–S2 Adaptive Mathematics · HK EDB Curriculum · 8 Specialist Claude Agents</p>
            </div>
          </div>

          {/* Agent chips — wrap on mobile */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            {AGENT_GROUPS.map(g => (
              <div key={g.id} className={`flex items-center gap-1 sm:gap-1.5 text-xs border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 ${g.color}`}>
                <span className="font-semibold">{g.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 text-sm">
              {(['EN', 'ZH'] as Language[]).map(l => (
                <button key={l} onClick={() => { setLanguage(l); resetOutput(); }}
                  className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors text-xs sm:text-sm ${language === l ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {l === 'EN' ? 'English' : '中文（繁）'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">claude-haiku-4-5-20251001</span>
            <Link href="/adaptive-learning" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
              ← Overview
            </Link>
            <Link href="/adaptive-learning/pitch" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              <BookMarked className="w-3.5 h-3.5" />Pitch Deck
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Group tabs */}
        <div className="space-y-2 mb-5 sm:mb-6 overflow-x-auto">
          {AGENT_GROUPS.map(group => (
            <div key={group.id} className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 shrink-0 w-32 sm:w-36 text-center ${group.color}`}>
                {group.label}
              </span>
              {group.tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); resetOutput(); }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}>
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.mode.split('_')[0]}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left: Input */}
          <div className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AgentBadge color={currentGroup?.color || ''} label={currentGroup?.label || ''} />
                <span className="text-xs text-slate-500 font-mono">{currentTab?.mode}</span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-white">{currentTab?.label}</h2>
            </div>

            {currentTab?.mode === 'STEP_BY_STEP_FEATURE' && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Select feature</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STEP_FEATURES.map(f => (
                    <button key={f.value} onClick={() => setStepFeature(f.value)}
                      className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                        stepFeature === f.value ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-slate-700/50 text-slate-400 hover:bg-white/[0.02]'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <PayloadPreview
              mode={currentTab?.mode === 'STEP_BY_STEP_FEATURE' ? 'STEP_BY_STEP_FEATURE' : (currentTab?.mode || '')}
              language={language}
            />

            <button onClick={runAgent} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Running…</>
                : <>{currentTab && <currentTab.icon className="w-4 h-4" />}Run {currentGroup?.label} → {currentTab?.mode}</>}
            </button>
          </div>

          {/* Right: Output */}
          <div className="dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Agent Output</h3>
            <ResultPanel result={result} loading={loading} error={error} />
          </div>
        </div>

        {/* Architecture reference table */}
        <div className="mt-6 sm:mt-8 dark:bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-white mb-4 sm:mb-5">8-Agent Architecture Reference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {AGENT_GROUPS.map(group => (
              <div key={group.id} className="rounded-xl border p-3 sm:p-4" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.025)' }}>
                <AgentBadge color={group.color} label={group.label} />
                <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                  {group.tabs.map(tab => (
                    <div key={tab.id}>
                      <p className="text-xs text-slate-300 font-mono">{tab.mode}</p>
                      <p className="text-xs text-slate-500">→ /api/adaptive-learning/demo</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-slate-400 border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 pr-4 text-slate-500 font-medium">Endpoint</th>
                  <th className="text-left py-2 pr-4 text-slate-500 font-medium">Agent</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Modes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { endpoint: '/explain', agent: 'StudentAgent', modes: 'EXPLAIN_ONE_QUESTION' },
                  { endpoint: '/session-summary', agent: 'StudentAgent', modes: 'SESSION_SUMMARY' },
                  { endpoint: '/class-summary', agent: 'TeacherAgent', modes: 'CLASS_SUMMARY' },
                  { endpoint: '/student-profile', agent: 'TeacherAgent', modes: 'STUDENT_PROFILE' },
                  { endpoint: '/author-question', agent: 'QuestionAgent', modes: 'QUESTION_AUTHORING' },
                  { endpoint: '/student-ux', agent: 'StudentUxAgent', modes: 'WELCOME · SESSION_INTRO · QUESTION_FEEDBACK · SESSION_SUMMARY_STUDENT · GAMIFICATION_EVENT' },
                  { endpoint: '/teacher-guide', agent: 'TeacherGuideAgent', modes: 'INTRO_PAGE · STEP_BY_STEP_FEATURE · FAQ' },
                  { endpoint: '/tech-arch', agent: 'TechArchAgent', modes: 'HIGH_LEVEL_ARCH · SEQUENCE_*' },
                  { endpoint: '/gamification', agent: 'GamificationAgent', modes: 'BADGE_MESSAGE · SUGGEST_MISSIONS · PROGRESS_NUDGE' },
                  { endpoint: '/admin-report', agent: 'AdminReportAgent', modes: 'TERM_REPORT · GRADE_REPORT · CLASS_REPORT' },
                  { endpoint: '/demo', agent: 'Orchestrator', modes: 'all modes + legacy aliases' },
                ].map(row => (
                  <tr key={row.endpoint} className="border-b border-slate-700/30">
                    <td className="py-2 pr-4 font-mono text-slate-300 whitespace-nowrap">POST /api/adaptive-learning{row.endpoint}</td>
                    <td className="py-2 pr-4 text-slate-400 whitespace-nowrap">{row.agent}</td>
                    <td className="py-2 text-slate-500">{row.modes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
