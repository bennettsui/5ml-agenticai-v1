'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle, ChevronDown, ChevronUp,
  Zap, BarChart3, MessageSquare, FileText, TrendingUp,
  Clock, Users, Star, ArrowLeft, Send, Phone, Mail, Building2,
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CaseStudy {
  level: 1 | 2 | 3 | 4 | 5;
  levelLabel: string; // e.g. "初階：起步自動化"
  company: string;    // e.g. "本地服裝店 · 6 人"
  challenge: string;
  agents: string[];   // agents used
  workflow: { icon: string; title: string; detail: string }[];
  results: { metric: string; label: string }[];
  insight: string;    // "takeaway" quote or insight
}

export interface IndustryConfig {
  industry: string;          // e.g. "零售"
  industryEn: string;        // e.g. "Retail"
  slug: string;              // e.g. "retail"
  headline: string;
  subheadline: string;
  urgency: string;           // urgency line below hero
  heroGrad: string;          // Tailwind gradient, e.g. "from-pink-600 to-rose-700"
  heroAccent: string;        // accent colour for badges, e.g. "pink"
  painPoints: { icon: string; title: string; desc: string }[];
  caseStudies: CaseStudy[];
  stats: { value: string; label: string }[];
  seoTitle: string;
  seoDesc: string;
}

// ─── Lead Form ───────────────────────────────────────────────────────────────

function LeadForm({ industry, slug }: { industry: string; slug: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', headcount: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/api/recruitai/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          industry,
          sourcePage: `/vibe-demo/recruitai/industries/${slug}`,
          utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
        }),
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">收到您的查詢！</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          我們會在 1 個工作天內與您聯絡，安排免費 30 分鐘 AI 評估。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">您的姓名 *</label>
          <input
            required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="陳先生 / 陳女士"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">電郵地址 *</label>
          <input
            required type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="your@company.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / 電話</label>
          <input
            value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+852 XXXX XXXX"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">公司名稱</label>
          <input
            value={form.company} onChange={e => set('company', e.target.value)}
            placeholder="您的公司名稱"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">團隊人數</label>
        <select
          value={form.headcount} onChange={e => set('headcount', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
        >
          <option value="">請選擇</option>
          {['1–5 人', '6–10 人', '11–20 人', '21–50 人', '50 人以上'].map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">您最大的業務挑戰是什麼？</label>
        <textarea
          rows={3} value={form.message} onChange={e => set('message', e.target.value)}
          placeholder="例如：每月處理大量發票好費時、WhatsApp 查詢無人回覆..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white resize-none"
        />
      </div>
      {status === 'error' && (
        <p className="text-red-600 text-sm">提交時出現問題，請重試或直接 WhatsApp 聯絡我們。</p>
      )}
      <button
        type="submit" disabled={status === 'loading'}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {status === 'loading' ? '提交中...' : (
          <>立即預約免費 AI 評估 <ArrowRight className="w-5 h-5" /></>
        )}
      </button>
      <p className="text-center text-xs text-slate-500">
        免費諮詢，無任何義務。資料絕對保密，不作其他用途。
      </p>
    </form>
  );
}

// ─── Workflow Step ────────────────────────────────────────────────────────────

function WorkflowStep({ icon, title, detail, index }: { icon: string; title: string; detail: string; index: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex-none flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700 flex-none">
          {index + 1}
        </div>
        <div className="w-0.5 flex-1 bg-blue-100 mt-2" />
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{icon}</span>
          <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

// ─── Case Study Card ──────────────────────────────────────────────────────────

function CaseStudyCard({ cs, isOpen, onToggle }: { cs: CaseStudy; isOpen: boolean; onToggle: () => void }) {
  const levelColors: Record<number, string> = {
    1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    2: 'bg-blue-100 text-blue-700 border-blue-200',
    3: 'bg-violet-100 text-violet-700 border-violet-200',
    4: 'bg-amber-100 text-amber-700 border-amber-200',
    5: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const agentIcons: Record<string, string> = {
    '客戶服務代理': '💬',
    '發票處理代理': '📄',
    '商業智能代理': '📊',
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        className="w-full text-left p-6 flex items-start justify-between gap-4"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${levelColors[cs.level]}`}>
              {cs.levelLabel}
            </span>
            {cs.agents.map(a => (
              <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {agentIcons[a] || '🤖'} {a}
              </span>
            ))}
          </div>
          <p className="font-semibold text-slate-900">{cs.company}</p>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{cs.challenge}</p>
        </div>
        <div className="flex-none mt-1">
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-6 pb-6">
          {/* Challenge */}
          <div className="mt-5 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">業務挑戰</h4>
            <p className="text-slate-700 leading-relaxed">{cs.challenge}</p>
          </div>

          {/* Agentic Workflow */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">AI 代理工作流程</h4>
            <div>
              {cs.workflow.map((step, i) => (
                <WorkflowStep key={i} icon={step.icon} title={step.title} detail={step.detail} index={i} />
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-50 rounded-xl p-5 mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">實際成效</h4>
            <div className="grid grid-cols-3 gap-4">
              {cs.results.map((r, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-extrabold text-slate-900">{r.metric}</div>
                  <div className="text-xs text-slate-500 mt-1">{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Insight */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed italic">
              💡 {cs.insight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

export default function IndustryLandingPage({ config }: { config: IndustryConfig }) {
  const [openCase, setOpenCase] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/vibe-demo/recruitai" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            RecruitAIStudio
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">
              {config.industry} 行業方案
            </span>
            <a
              href="#lead-form"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              免費諮詢
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={`pt-16 bg-gradient-to-br ${config.heroGrad} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            專為香港 {config.industry} 行業設計的 AI 方案
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            {config.headline}
          </h1>
          <p className="text-xl text-white/85 max-w-2xl mb-4 leading-relaxed">
            {config.subheadline}
          </p>
          <p className="text-sm text-white/70 mb-10 font-medium">{config.urgency}</p>

          <div className="flex flex-wrap gap-4">
            <a
              href="#lead-form"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              免費 AI 評估 <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#cases"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-lg border border-white/30 transition-all"
            >
              查看真實案例
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {config.stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black mb-1">{s.value}</div>
                <div className="text-sm text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">您是否面對這些問題？</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {config.industry} 行業常見痛點
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.painPoints.map(p => (
              <div key={p.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-slate-500 mb-4">以上每個痛點，AI 代理都能解決。</p>
            <a href="#cases" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
              看看同行如何用 AI 解決 <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Case Studies ── */}
      <section id="cases" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">真實案例</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              從初步嘗試到全面自動化
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              以下 5 個案例按複雜度由淺入深排列，幫助您了解 AI 代理如何一步步融入您的業務。
            </p>
          </div>

          <div className="space-y-4">
            {config.caseStudies.map((cs, idx) => (
              <CaseStudyCard
                key={idx}
                cs={cs}
                isOpen={openCase === idx}
                onToggle={() => setOpenCase(openCase === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">上線只需 3 個步驟</h2>
            <p className="text-white/80 text-lg">無需技術團隊，最快 3 天內啟動</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🔍', title: '免費 AI 評估', desc: '30 分鐘深入了解您的業務流程，找出最高效益的自動化切入點' },
              { step: '02', icon: '⚙️', title: '定制配置', desc: '我們為您設定 AI 代理，整合現有系統（Xero / WhatsApp / CRM 等）' },
              { step: '03', icon: '🚀', title: '上線使用', desc: '員工培訓，監察首月成效，確保 AI 代理符合您的業務需求' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-sm font-bold text-white/50 mb-2">STEP {s.step}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-white/75 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead Form ── */}
      <section id="lead-form" className="py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">立即開始</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              預約免費 30 分鐘 AI 評估
            </h2>
            <p className="text-slate-600">
              我們的 AI 顧問會深入了解您的 {config.industry} 業務，提供度身訂造的自動化方案，
              完全免費，無任何義務。
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              {[
                { icon: Clock, text: '30 分鐘免費' },
                { icon: CheckCircle, text: '無任何義務' },
                { icon: Users, text: '1 個工作天內回覆' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon className="w-4 h-4 text-blue-500" />
                  {text}
                </div>
              ))}
            </div>
            <LeadForm industry={config.industry} slug={config.slug} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 bg-slate-900 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-400 text-sm mb-2">
            © 2024 RecruitAIStudio by 5 Miles Lab · 專注香港中小企業 AI 自動化
          </p>
          <Link href="/vibe-demo/recruitai" className="text-blue-400 hover:text-blue-300 text-sm">
            返回主頁 →
          </Link>
        </div>
      </footer>
    </div>
  );
}
