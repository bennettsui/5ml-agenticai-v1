import Link from 'next/link';
import {
  Brain, BookOpen, Users, PenLine, Gamepad2,
  MessageSquare, BookMarked, Layout, Network,
  GraduationCap, UserCircle, Star, GitBranch,
  ArrowRight, ChevronRight, Layers, BarChart3,
} from 'lucide-react';

const AGENTS = [
  { id: 'student',     label: 'StudentAgent',     color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',    icon: Brain,      description: 'Explains concepts and reflects on session performance with each student.', modes: ['EXPLAIN_ONE_QUESTION', 'SESSION_SUMMARY'] },
  { id: 'teacher',     label: 'TeacherAgent',     color: 'bg-purple-500/10 text-purple-300 border-purple-500/20', icon: Users,   description: 'Summarises class mastery data and generates individual student learning profiles.', modes: ['CLASS_SUMMARY', 'STUDENT_PROFILE'] },
  { id: 'question',    label: 'QuestionAgent',    color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',  icon: PenLine,   description: 'Cleans past-paper questions, estimates difficulty, and tags learning objectives.', modes: ['QUESTION_AUTHORING'] },
  { id: 'studentUx',   label: 'StudentUxAgent',   color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', icon: MessageSquare, description: 'Generates all in-app copy: welcome screens, session intros, question feedback, and gamification prompts.', modes: ['WELCOME', 'SESSION_INTRO', 'QUESTION_FEEDBACK', 'SESSION_SUMMARY_STUDENT', 'GAMIFICATION_EVENT'] },
  { id: 'teacherGuide',label: 'TeacherGuideAgent',color: 'bg-rose-500/10 text-rose-300 border-rose-500/20',    icon: BookMarked, description: 'Writes teacher onboarding guides, step-by-step feature walkthroughs, and FAQ answers.', modes: ['INTRO_PAGE', 'STEP_BY_STEP_FEATURE', 'FAQ'] },
  { id: 'techArch',    label: 'TechArchAgent',    color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',    icon: Network,   description: 'Produces Mermaid diagrams — high-level architecture, student session flows, teacher upload sequences.', modes: ['HIGH_LEVEL_ARCH', 'SEQUENCE_STUDENT_SESSION', 'SEQUENCE_TEACHER_UPLOAD', 'SEQUENCE_TEACHER_DASHBOARD'] },
  { id: 'gamification',label: 'GamificationAgent',color: 'bg-orange-500/10 text-orange-300 border-orange-500/20', icon: Gamepad2, description: 'Generates badge messages, mission suggestions, and progress nudges to sustain motivation.', modes: ['BADGE_MESSAGE', 'SUGGEST_MISSIONS', 'PROGRESS_NUDGE'] },
  { id: 'adminReport', label: 'AdminReportAgent', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30',  icon: BarChart3, description: 'Writes clear, non-technical term reports for principals, panel heads, and school boards.', modes: ['TERM_REPORT', 'GRADE_REPORT', 'CLASS_REPORT'] },
];

const FLOW_STEPS = [
  { step: '01', title: 'Student Practises', body: 'S1–S2 students complete adaptive 20-minute sessions. Questions are chosen to target mastery gaps. Every interaction — correctness, time, hints, self-ratings — is logged.', icon: GraduationCap, color: 'text-blue-400' },
  { step: '02', title: 'Agents Analyse & Generate', body: '8 specialist Claude agents process each event in real time: explaining questions, generating session summaries, updating gamification, and producing teacher insights.', icon: Brain, color: 'text-indigo-400' },
  { step: '03', title: 'Teachers & Leaders Act', body: 'Teachers see live class heatmaps and AI-written student profiles. Principals receive readable term reports — no data expertise needed.', icon: Users, color: 'text-purple-400' },
];

const STATS = [
  { label: 'Specialist Agents', value: '8' },
  { label: 'Agent Modes', value: '22' },
  { label: 'Grade Band', value: 'S1–S2' },
  { label: 'Curriculum', value: 'HK EDB' },
  { label: 'Languages', value: 'EN · 繁中' },
  { label: 'Model', value: 'Claude Haiku' },
];

export default function AdaptiveLearningPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-300">Adaptive Learning for Schools</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/adaptive-learning/pitch"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <BookMarked className="w-3.5 h-3.5" />
              Pitch Deck
            </Link>
            <Link
              href="/adaptive-learning/agents"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Agent Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">

        {/* Hero */}
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/15 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Adaptive Learning for Schools
              </h1>
              <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
                An 8-agent Claude system that personalises S1–S2 mathematics practice for Hong Kong schools —
                guiding students through sessions, helping teachers understand their class, and giving principals
                readable term reports.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {STATS.map(s => (
              <div key={s.label} className="dark:bg-white/[0.03] border border-slate-800/60 rounded-xl p-2.5 sm:p-3 text-center">
                <div className="text-base sm:text-lg font-bold text-white">{s.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform flow */}
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-300 mb-4 sm:mb-5">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="dark:bg-white/[0.03] border border-slate-800/60 rounded-xl p-4 sm:p-5 relative">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-slate-600 font-semibold">{step.step}</span>
                    <Icon className={`w-4 h-4 ${step.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.body}</p>
                  {i < FLOW_STEPS.length - 1 && (
                    <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 8 Agent cards */}
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-300 mb-4 sm:mb-5">8 Specialist Agents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {AGENTS.map(agent => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} className="dark:bg-white/[0.03] border border-slate-800/60 rounded-xl p-4 sm:p-5 flex flex-col gap-3 hover:dark:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${agent.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${agent.color}`}>
                      {agent.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">{agent.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.modes.map(mode => (
                      <span key={mode} className="text-[10px] font-mono text-slate-600 bg-slate-800/60 rounded px-1.5 py-0.5">
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture note */}
        <div className="dark:bg-white/[0.03] border border-slate-800/60 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Layers className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Architecture</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                A single <span className="text-slate-300 font-mono">AdaptiveAgent</span> orchestrator
                lazily instantiates each specialist, routes by mode, and resolves legacy aliases.
                All agents share a <span className="text-slate-300">claude-haiku-4-5-20251001</span> model layer
                and return strict JSON schemas. Postgres with pgvector stores mastery state, session history, and question embeddings.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-slate-500">
                <span>Express API Gateway</span><span>·</span>
                <span>Next.js 15 Frontend</span><span>·</span>
                <span>Postgres + pgvector</span><span>·</span>
                <span>Object Storage (PDFs)</span><span>·</span>
                <span>OCR Pipeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live portals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/adaptive-learning/learn"
            className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-600/15 to-purple-600/10 border border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Student Portal</p>
              <p className="text-indigo-300/70 text-xs mt-0.5">Adaptive sessions · Progress · Badges</p>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/adaptive-learning/teach"
            className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-600/15 to-indigo-600/10 border border-purple-500/30 hover:border-purple-500/50 rounded-2xl transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Teacher Portal</p>
              <p className="text-purple-300/70 text-xs mt-0.5">Class heatmap · Upload papers · Reports</p>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* CTA strip */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/adaptive-learning/agents"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex-1 sm:flex-none"
          >
            <Network className="w-4 h-4" />
            Try Agent Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/adaptive-learning/pitch"
            className="flex items-center justify-center gap-2 px-5 py-3 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors flex-1 sm:flex-none"
          >
            <BookMarked className="w-4 h-4" />
            View Pitch Deck
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 border border-slate-800/60 hover:border-slate-700 text-slate-500 hover:text-slate-300 rounded-xl text-sm transition-colors flex-1 sm:flex-none"
          >
            ← All Use Cases
          </Link>
        </div>

      </div>
    </div>
  );
}
