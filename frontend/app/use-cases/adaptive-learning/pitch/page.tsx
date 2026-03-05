'use client';

import Link from 'next/link';
import {
  Brain, ArrowLeft, AlertCircle, Lightbulb, Users, GraduationCap,
  BarChart2, Building2, FlaskConical, Calendar, Target, ChevronRight,
  BookOpen, Star, Network, Layers, CheckCircle2
} from 'lucide-react';

// ─── Slide types ──────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  num: number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  accent: string; // tailwind gradient classes
}

// ─── Shared components ────────────────────────────────────────────────────────

function SlideTag({ children, color }: { children: string; color: string }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>{children}</span>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-white/[0.06] border border-white/10 text-slate-300 px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

function BulletList({ items, icon: Icon = ChevronRight, color = 'text-indigo-400' }: {
  items: string[];
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 h-full">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SlideCard({ slide }: { slide: Slide }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-sm">
      {/* Accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${slide.accent}`} />

      <div className="p-8">
        {/* Slide number */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs text-slate-600 font-mono tabular-nums">
            {String(slide.num).padStart(2, '0')} / 10
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-1">{slide.title}</h2>
        {slide.subtitle && <p className="text-sm text-slate-400 mb-6">{slide.subtitle}</p>}

        {/* Content */}
        <div className="mt-4">
          {slide.content}
        </div>
      </div>
    </div>
  );
}

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  // 1 ─ Title
  {
    id: 'title', num: 1,
    title: 'S1–S2 自適應數學學習平台',
    subtitle: '從操卷走向「概念 + 興趣」的主動學習',
    accent: 'from-indigo-500 to-violet-500',
    content: (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Pill><Brain className="w-3 h-3" />8 Specialist AI Agents</Pill>
          <Pill><BookOpen className="w-3 h-3" />HK EDB S1–S2 Curriculum</Pill>
          <Pill><GraduationCap className="w-3 h-3" />Bilingual EN / 繁中</Pill>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard value="8" label="Specialist Agents" sub="Claude Haiku" />
          <StatCard value="20+" label="Curriculum Concepts" sub="HK EDB aligned" />
          <StatCard value="3" label="User Roles" sub="Student · Teacher · Principal" />
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            一個追蹤學生<span className="text-indigo-300 font-medium">概念掌握度</span>與<span className="text-indigo-300 font-medium">學習興趣</span>的自適應數學平台，
            為香港 S1–S2 設計，幫助老師做出更好的教學決定。
          </p>
        </div>
      </div>
    ),
  },

  // 2 ─ Problem
  {
    id: 'problem', num: 2,
    title: '問題 / Pain Point',
    subtitle: '香港初中數學教學的常見困境',
    accent: 'from-red-500 to-orange-500',
    content: (
      <TwoCol
        left={
          <div className="space-y-4">
            <SlideTag color="bg-red-500/10 text-red-300 border-red-500/20">學生面</SlideTag>
            <BulletList
              icon={AlertCircle}
              color="text-red-400"
              items={[
                '大量操卷，「識做題」但未必「明概念」',
                '考試前臨急溫習，缺乏持續練習習慣',
                '難以知道自己真正弱在哪個概念',
                '學習興趣未被主動追蹤或重視',
              ]}
            />
          </div>
        }
        right={
          <div className="space-y-4">
            <SlideTag color="bg-orange-500/10 text-orange-300 border-orange-500/20">老師面</SlideTag>
            <BulletList
              icon={AlertCircle}
              color="text-orange-400"
              items={[
                '靠感覺判斷全班或個別學生的弱點',
                '缺乏工具追蹤每個概念的掌握趨勢',
                '批改完試卷後，難以系統化跟進補底',
                '試卷和教材分散，難以形成知識資產',
              ]}
            />
          </div>
        }
      />
    ),
  },

  // 3 ─ Solution (High-level)
  {
    id: 'solution', num: 3,
    title: '解決方案（High-level）',
    subtitle: '一句話：以「概念掌握 + 學習興趣」為核心的自適應練習平台',
    accent: 'from-indigo-500 to-blue-500',
    content: (
      <div className="space-y-5">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            「一個對齊 EDB 課綱的自適應平台，自動分析學生對每個概念的理解與興趣，
            並給老師清晰而可行的班級與個人 insight。」
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: BookOpen, title: '對齊 EDB 課綱', desc: '每條題目對應 S1–S2 learning objectives，確保練習有意義' },
            { icon: Brain, title: '自動分析掌握 + 興趣', desc: '8 個 AI agent 處理解說、摘要、報告、文案，全面追蹤' },
            { icon: BarChart2, title: '給老師可行的 insight', desc: '班級 heatmap、個人 profile、AI 建議，一目了然' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
              <Icon className="w-5 h-5 text-indigo-400 mb-2" />
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 4 ─ Student experience
  {
    id: 'student', num: 4,
    title: '對學生：學習體驗',
    subtitle: '短時間、聚焦、有即時反饋的 20 分鐘 session',
    accent: 'from-blue-500 to-cyan-500',
    content: (
      <TwoCol
        left={
          <div className="space-y-4">
            <BulletList
              icon={CheckCircle2}
              color="text-blue-400"
              items={[
                '20 分鐘 session，聚焦 1–3 個概念，不拖長',
                '每題即時解說：解釋概念、為何對錯、下一步',
                '自評理解度和興趣（1–5），系統跟住調整難度',
                '概念旅程圖取代考試分數，看自己的成長',
                '輕量遊戲化：badges、小任務，獎勵探索和進步',
              ]}
            />
          </div>
        }
        right={
          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Session Flow</p>
            {[
              { step: '1', label: '揀概念', desc: '從建議或自選 1–3 個概念' },
              { step: '2', label: '練習題', desc: '自適應出題，配合掌握度' },
              { step: '3', label: '即時解說', desc: 'AI 解釋概念和原因' },
              { step: '4', label: '自評', desc: '理解 + 興趣各打 1–5 分' },
              { step: '5', label: 'Session 摘要', desc: '今天學了什麼、強弱、下一步' },
            ].map(({ step, label, desc }) => (
              <div key={step} className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{step}</span>
                <div>
                  <p className="text-xs font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />
    ),
  },

  // 5 ─ Teacher experience
  {
    id: 'teacher', num: 5,
    title: '對老師：數據 + 教學決策',
    subtitle: '清晰 dashboard，減少猜測，增加行動',
    accent: 'from-purple-500 to-pink-500',
    content: (
      <TwoCol
        left={
          <div className="space-y-4">
            <SlideTag color="bg-purple-500/10 text-purple-300 border-purple-500/20">班級視角</SlideTag>
            <BulletList
              icon={CheckCircle2}
              color="text-purple-400"
              items={[
                '概念 heatmap：一眼看出全班在哪些概念較強／較弱',
                '常見錯誤 panel：系統自動歸納出最多人犯的錯',
                'AI 班級摘要：優先補底概念 + 3–6 個具體教學建議',
                '上載校本試卷 → 自動分題、標籤概念，建立題庫',
              ]}
            />
          </div>
        }
        right={
          <div className="space-y-4">
            <SlideTag color="bg-rose-500/10 text-rose-300 border-rose-500/20">個人視角</SlideTag>
            <BulletList
              icon={CheckCircle2}
              color="text-rose-400"
              items={[
                '個別學生 profile：每個概念的掌握度 + 興趣趨勢',
                '近期 session 紀錄：看到學習軌跡變化',
                'AI 個人摘要：強項、需關注概念、具體教師行動建議',
                '老師可標記需要特別跟進的學生',
              ]}
            />
          </div>
        }
      />
    ),
  },

  // 6 ─ School level
  {
    id: 'school', num: 6,
    title: '對學校：成效與知識資產',
    subtitle: '數據支撐三年計劃，校本題庫成為可持續資產',
    accent: 'from-emerald-500 to-teal-500',
    content: (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SlideTag color="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">成效證據</SlideTag>
          <BulletList
            icon={CheckCircle2}
            color="text-emerald-400"
            items={[
              '用概念掌握度和使用數據支撐學校三年計劃匯報',
              '更早發現在多個概念上持續落後的高風險學生',
              '校長 / 數學科主任可查閱年級和全校摘要報告',
              '學生興趣趨勢可作為課程設計的參考依據',
            ]}
          />
        </div>
        <div className="space-y-4">
          <SlideTag color="bg-teal-500/10 text-teal-300 border-teal-500/20">知識資產化</SlideTag>
          <BulletList
            icon={CheckCircle2}
            color="text-teal-400"
            items={[
              '歷年試卷 → 結構化題庫（概念標籤 + 解說 + 難度）',
              '課綱概念地圖與學生真實掌握數據對應',
              '題庫和數據屬於學校，不依賴特定老師',
              '可隨時匯出報告，作家長溝通和問責材料',
            ]}
          />
        </div>
      </div>
    ),
  },

  // 7 ─ Architecture (non-technical)
  {
    id: 'arch', num: 7,
    title: '系統架構 Overview（非技術版）',
    subtitle: '所有分析都基於學校自己的題庫和課綱',
    accent: 'from-cyan-500 to-blue-500',
    content: (
      <div className="space-y-4">
        {[
          {
            layer: '學生 / 老師 / 校長介面',
            desc: '三個角色各有專屬介面：20 分鐘練習 · 班級 dashboard · 成效報告',
            icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            layer: 'AI 智能層（8 個專職 Agent）',
            desc: '自適應出題 · 概念解說 · 班級摘要 · 題目標籤 · UX 文案 · 徽章任務 · 老師指南 · 成效報告',
            icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20',
          },
          {
            layer: '課綱概念 + 題庫 + 學習數據',
            desc: 'HK EDB S1–S2 學習目標 · 校本題庫 · 每位學生的掌握度和興趣歷史',
            icon: Layers, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20',
          },
        ].map(({ layer, desc, icon: Icon, color, bg }) => (
          <div key={layer} className={`flex items-start gap-3 border rounded-xl p-4 ${bg}`}>
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} />
            <div>
              <p className="text-sm font-semibold text-white">{layer}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
        <div className="text-center pt-2">
          <Link
            href="/use-cases/adaptive-learning/agents"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            Live agent demo → /use-cases/adaptive-learning/agents
          </Link>
        </div>
      </div>
    ),
  },

  // 8 ─ Pilot design
  {
    id: 'pilot', num: 8,
    title: 'Pilot 設計（S1–S2）',
    subtitle: '小範圍、快速驗證、可持續擴展',
    accent: 'from-amber-500 to-orange-500',
    content: (
      <TwoCol
        left={
          <div className="space-y-4">
            <SlideTag color="bg-amber-500/10 text-amber-300 border-amber-500/20">Pilot 範圍</SlideTag>
            <BulletList
              icon={Target}
              color="text-amber-400"
              items={[
                'S1–S2 數學，先由 1–2 個 topic 開始（分數、方程）',
                '2–3 個班，1 個學期（約 14–15 週）',
                '每週 1–2 次 20 分鐘 session（課堂或課後均可）',
                '學期末出具成效報告供校方評估',
              ]}
            />
          </div>
        }
        right={
          <div className="space-y-4">
            <SlideTag color="bg-orange-500/10 text-orange-300 border-orange-500/20">校方需要做的</SlideTag>
            <BulletList
              icon={CheckCircle2}
              color="text-orange-400"
              items={[
                '提供過往 2–3 份試卷（PDF）和課程手冊',
                '指定 1–2 位數學老師作 pilot champion',
                '安排學生登入方式（學校 Google 帳戶或統一 ID）',
                '學期末填寫老師問卷，分享使用反饋',
              ]}
            />
          </div>
        }
      />
    ),
  },

  // 9 ─ Expected outcomes & evaluation
  {
    id: 'outcomes', num: 9,
    title: '預期成果 & 評估',
    subtitle: '量化指標 + 質化反饋，有據可查',
    accent: 'from-rose-500 to-pink-500',
    content: (
      <TwoCol
        left={
          <div className="space-y-4">
            <SlideTag color="bg-rose-500/10 text-rose-300 border-rose-500/20">量化指標</SlideTag>
            <BulletList
              icon={BarChart2}
              color="text-rose-400"
              items={[
                '概念掌握度變化（學期前 vs 學期末，0–4 級）',
                '達到目標掌握水平的學生比例（per concept）',
                '學生自評學習興趣的平均變化',
                '每週平均 session 數及完成率',
              ]}
            />
          </div>
        }
        right={
          <div className="space-y-4">
            <SlideTag color="bg-pink-500/10 text-pink-300 border-pink-500/20">成功樣子</SlideTag>
            <BulletList
              icon={Star}
              color="text-pink-400"
              items={[
                '重點概念（如分數加法）fail rate 明顯下降',
                '老師能清楚說出班上在哪個概念最需要補底',
                '學生願意在課後自主做 session（engagement 持續）',
                '老師認為 dashboard 節省了分析時間並有助備課',
              ]}
            />
          </div>
        }
      />
    ),
  },

  // 10 ─ Timeline
  {
    id: 'timeline', num: 10,
    title: '時間表',
    subtitle: '6 週 Demo → 1 學期 Pilot',
    accent: 'from-violet-500 to-indigo-500',
    content: (
      <div className="space-y-3">
        {[
          { phase: 'Week 1–2', label: '準備期', items: ['課綱 mapping 確認', '收集試卷 + 課程手冊', '初步題庫建立（AI 輔助）'], color: 'bg-violet-500/10 border-violet-500/20 text-violet-300' },
          { phase: 'Week 3–4', label: 'MVP 開發', items: ['學生 20-min session UI', 'Teacher dashboard（heatmap + profile）', '核心 AI agent 串連測試'], color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
          { phase: 'Week 5–6', label: 'Demo 測試', items: ['小班 internal 測試（5–10 位學生）', '老師 walkthrough + feedback', 'Demo 給學校負責人'], color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
          { phase: 'Term 1', label: '正式 Pilot', items: ['2–3 班正式使用', '持續收數據 + 每月小結', '學期末成效報告 + 決定是否擴展'], color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
        ].map(({ phase, label, items, color }) => (
          <div key={phase} className={`flex gap-4 border rounded-xl p-3 ${color.split(' ').slice(0, 2).join(' ')}`}>
            <div className="shrink-0 w-20 text-center">
              <p className={`text-xs font-bold ${color.split(' ')[2]}`}>{phase}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {items.map(item => (
                <span key={item} className="text-xs text-slate-300 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-slate-600" />{item}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400">完成 Pilot 後決策點：</p>
          <p className="text-sm text-slate-200 font-medium mt-1">擴展到更多班級 / 年級 → 正式訂閱 → 校本知識資產長期積累</p>
        </div>
      </div>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/use-cases/adaptive-learning"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Overview
            </Link>
            <span className="text-slate-700">·</span>
            <span className="text-sm text-white font-medium">Pitch Deck</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {[
              { color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20', label: 'S1–S2 數學' },
              { color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', label: 'HK EDB 課綱' },
              { color: 'bg-amber-500/10 text-amber-300 border-amber-500/20', label: '8 AI Agents' },
            ].map(({ color, label }) => (
              <span key={label} className={`text-xs font-medium border px-2 py-0.5 rounded-full ${color}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-400 mb-4">
            <Lightbulb className="w-3 h-3" /> School / Pilot Pitch Deck — 10 Slides
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            S1–S2 自適應數學學習平台
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            從操卷走向「概念 + 興趣」的主動學習。
            本頁是 10 張 slide 架構，供學校 / 基金 / 內部 pitch 使用。
          </p>
        </div>

        {/* Slides */}
        <div className="space-y-8">
          {SLIDES.map((slide) => (
            <SlideCard key={slide.id} slide={slide} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center space-y-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
            <Brain className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">準備好看 Live Demo？</p>
            <p className="text-sm text-slate-400 mb-4">
              所有 8 個 AI Agent 都可以在 demo 頁面即時試用，包括概念解說、班級摘要、成效報告。
            </p>
            <Link
              href="/use-cases/adaptive-learning/agents"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <Brain className="w-4 h-4" />
              試用 8 個 Agent Demo
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
