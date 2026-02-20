'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle, ChevronDown, ChevronUp,
  Send, Clock, Users,
} from 'lucide-react';
import RecruitNav from './RecruitNav';

const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_API_URL || '');
})();

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorkflowStep {
  icon: string;
  title: string;
  detail: string;
}

export interface UseCase {
  title: string;
  desc: string;
  workflow: WorkflowStep[];
  kpis: { value: string; label: string }[];
}

export interface ModuleConfig {
  slug: string;
  moduleEmoji: string;
  moduleName: string;
  moduleNameEn: string;
  tagline: string;
  subtagline: string;
  heroGrad: string;
  kpis: { value: string; label: string }[];
  features: { icon: string; title: string; desc: string }[];
  useCases: UseCase[];
  integrations: string[];
  priceHint: string; // e.g. "入門方案 HK$8,000/月起"
}

// ─── Lead Form ───────────────────────────────────────────────────────────────

function LeadForm({ module }: { module: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', headcount: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch(`${API_BASE}/api/recruitai/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          industry: module,
          sourcePage: window.location.pathname,
          utmSource: params.get('utm_source') || undefined,
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch { setStatus('error'); }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-14">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">收到！</h3>
        <p className="text-slate-600">我們會在 1 個工作天內聯絡您，安排免費 AI 評估。</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">姓名 *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="陳先生 / 陳女士"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">電郵 *</label>
          <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="your@company.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+852 XXXX XXXX"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">公司</label>
          <input value={form.company} onChange={e => set('company', e.target.value)}
            placeholder="公司名稱"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">團隊人數</label>
        <select value={form.headcount} onChange={e => set('headcount', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm">
          <option value="">請選擇</option>
          {['1–5 人', '6–15 人', '16–30 人', '30 人以上'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">目前最大挑戰</label>
        <textarea rows={3} value={form.message} onChange={e => set('message', e.target.value)}
          placeholder="例如：每月要人手產生大量報告、廣告 ROAS 難以追蹤..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm resize-none" />
      </div>
      {status === 'error' && <p className="text-red-600 text-sm">提交出現問題，請重試。</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-colors">
        {status === 'loading' ? '提交中...' : <><span>立即預約免費 AI 評估</span><ArrowRight className="w-5 h-5" /></>}
      </button>
      <p className="text-center text-xs text-slate-400">免費 30 分鐘諮詢 · 無任何義務</p>
    </form>
  );
}

// ─── Use Case Card ────────────────────────────────────────────────────────────

function UseCaseCard({ uc, index }: { uc: UseCase; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      <button className="w-full text-left px-6 py-5 flex items-center justify-between gap-4" onClick={() => setOpen(!open)}>
        <div>
          <h3 className="font-bold text-slate-900 text-base">{uc.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{uc.desc}</p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400 flex-none" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-none" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-6 pb-6">
          {/* Workflow — horizontal flowchart (desktop), vertical list (mobile) */}
          <div className="mt-5 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">AI 工作流程</p>

            {/* Mobile: vertical steps */}
            <div className="flex flex-col gap-0 sm:hidden">
              {uc.workflow.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center flex-none">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-base shadow-sm">
                      {step.icon}
                    </div>
                    {i < uc.workflow.length - 1 && (
                      <div className="w-0.5 h-6 bg-blue-100 my-1" />
                    )}
                  </div>
                  <div className={`pb-5 pt-1.5 ${i < uc.workflow.length - 1 ? '' : ''}`}>
                    <p className="text-sm font-semibold text-slate-800 leading-none mb-1">{step.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: horizontal flowchart */}
            <div className="hidden sm:flex items-start gap-0 overflow-x-auto pb-2">
              {uc.workflow.map((step, i) => (
                <div key={i} className="flex items-start flex-none">
                  {/* Step card */}
                  <div className="flex flex-col items-center w-36 lg:w-40">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl shadow-md mb-3">
                      {step.icon}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold mb-2">
                      {i + 1}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 text-center leading-snug mb-1">{step.title}</p>
                    <p className="text-[11px] text-slate-500 text-center leading-relaxed">{step.detail}</p>
                  </div>
                  {/* Arrow connector */}
                  {i < uc.workflow.length - 1 && (
                    <div className="flex items-center mt-5 mx-1 flex-none">
                      <div className="w-6 h-0.5 bg-blue-200" />
                      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-blue-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
            {uc.kpis.map((kpi, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-extrabold text-blue-700">{kpi.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Module Page ─────────────────────────────────────────────────────────

export default function ModulePage({ config }: { config: ModuleConfig }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <RecruitNav />

      {/* Hero */}
      <section className={`pt-16 bg-gradient-to-br ${config.heroGrad} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-6">
            <span>{config.moduleEmoji}</span>
            RecruitAI Studio · {config.moduleName}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5 max-w-3xl">
            {config.tagline}
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mb-3 leading-relaxed">{config.subtagline}</p>
          <p className="text-sm text-white/65 mb-10">✅ 一週內完成部署 &nbsp;·&nbsp; ✅ 一個月內見成效 &nbsp;·&nbsp; ✅ 30–50% 人力節省承諾</p>
          <div className="flex flex-wrap gap-4">
            <a href="#lead-form" className="px-7 py-4 bg-white text-blue-700 font-bold rounded-2xl text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
              免費 AI 評估 <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#use-cases" className="px-7 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-base border border-white/30 transition-all">
              查看使用案例
            </a>
          </div>
          {/* KPI bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-5">
            {config.kpis.map(k => (
              <div key={k.label} className="text-center">
                <div className="text-3xl font-black mb-1">{k.value}</div>
                <div className="text-sm text-white/70">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">核心功能</p>
            <h2 className="text-3xl font-bold text-slate-900">{config.moduleName}模組能做什麼？</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {config.features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all group">
                <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-110 inline-block">{f.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">使用案例</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">實際應用場景</h2>
            <p className="text-slate-500">點擊每個場景，查看 AI 代理的完整工作流程</p>
          </div>
          <div className="space-y-3">
            {config.useCases.map((uc, i) => <UseCaseCard key={i} uc={uc} index={i} />)}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-4">無縫整合</p>
          <h2 className="text-2xl font-bold mb-8">與您現有工具直接對接</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {config.integrations.map(tool => (
              <span key={tool} className="px-4 py-2 bg-white/15 border border-white/25 rounded-full text-sm font-medium">
                {tool}
              </span>
            ))}
          </div>
          <p className="text-white/70 text-sm">不需要換掉現有系統 · AI 代理直接對接</p>
        </div>
      </section>

      {/* Pricing hint */}
      <section className="py-14 px-4 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">方案價格</p>
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-8 py-6 text-center">
              <p className="text-3xl font-black text-slate-900">HK$8,000<span className="text-base font-normal text-slate-500">/月</span></p>
              <p className="text-sm text-slate-600 mt-1">入門方案 · 約 3 個 AI 代理</p>
            </div>
            <div className="text-slate-400 font-medium">或</div>
            <div className="bg-blue-600 rounded-2xl px-8 py-6 text-center text-white shadow-lg">
              <p className="text-3xl font-black">HK$18,000<span className="text-base font-normal text-blue-200">/月</span></p>
              <p className="text-sm text-blue-200 mt-1">全面方案 · 約 10 個 AI 代理</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-6">{config.priceHint}</p>
          <a href="#lead-form" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            查詢定制方案 <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Lead Form */}
      <section id="lead-form" className="py-20 px-4 bg-slate-50">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">立即開始</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">預約免費 AI 評估</h2>
            <p className="text-slate-600">30 分鐘，了解 {config.moduleName}模組如何為您的業務帶來改變</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
              {[{ icon: Clock, text: '30 分鐘免費' }, { icon: CheckCircle, text: '無任何義務' }, { icon: Users, text: '1 工作天回覆' }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon className="w-4 h-4 text-blue-500" />{text}
                </div>
              ))}
            </div>
            <LeadForm module={config.moduleName} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-center">
        <p className="text-slate-500 text-sm mb-2">© 2026 RecruitAI Studio by 5 Miles Lab</p>
        <Link href="/vibe-demo/recruitai" className="text-blue-400 hover:text-blue-300 text-sm">返回主頁 →</Link>
      </footer>
    </div>
  );
}
