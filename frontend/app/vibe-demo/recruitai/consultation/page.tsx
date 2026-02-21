'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle, Calendar, Clock, Zap,
  Phone, Mail, Building2, Users, ChevronRight,
  Star, Shield, MessageSquare,
} from 'lucide-react';
import RecruitNav from '../components/RecruitNav';

const INDUSTRY_OPTIONS = [
  '零售 Retail', '餐飲 F&B', '金融服務 Financial Services',
  '物流 Logistics', '貿易 Trading', 'IT 服務 IT Services',
  '製造業 Manufacturing', '教育 Education', '其他 Other',
];

const TEAM_SIZE_OPTIONS = [
  '1–5 人', '6–10 人', '11–20 人', '21–50 人', '50 人以上',
];

const PAIN_POINTS = [
  { id: 'invoice', label: '📄 發票 / 收據處理太費時' },
  { id: 'customer', label: '💬 客戶服務回覆不及時' },
  { id: 'bi', label: '📊 缺乏業務數據分析洞察' },
  { id: 'workflow', label: '🔄 重複性工作佔用太多人手' },
  { id: 'scale', label: '🚀 業務增長難以規模化' },
  { id: 'cost', label: '💰 人力成本持續上升' },
];

type Step = 1 | 2 | 3;

export default function ConsultationPage() {
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    industry: '',
    teamSize: '',
    painPoints: [] as string[],
    message: '',
    preferredTime: '',
  });

  const update = (k: keyof typeof form, v: string | string[]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const togglePainPoint = (id: string) => {
    setForm(prev => ({
      ...prev,
      painPoints: prev.painPoints.includes(id)
        ? prev.painPoints.filter(p => p !== id)
        : [...prev.painPoints, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/recruitai/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${res.status}`);
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed1 = form.name && form.company && form.email;
  const canProceed2 = form.industry && form.teamSize && form.painPoints.length > 0;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-400 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">
            預約成功！🎉
          </h1>
          <p className="text-blue-100 mb-2">您好，{form.name}！</p>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            我們的 AI 顧問將在 1 個工作天內以{' '}
            <strong className="text-white">{form.email}</strong>{' '}
            或{' '}
            <strong className="text-white">{form.phone}</strong>{' '}
            聯絡您，安排免費 30 分鐘諮詢。
          </p>
          <div className="bg-white/10 rounded-2xl p-5 mb-6 text-left space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Your Info Summary
            </h3>
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <Building2 className="w-4 h-4" />
              <span>{form.company} · {form.industry}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <Users className="w-4 h-4" />
              <span>團隊規模：{form.teamSize}</span>
            </div>
            <div className="flex items-start gap-2 text-blue-100 text-sm">
              <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                主要痛點：
                {form.painPoints.map(id =>
                  PAIN_POINTS.find(p => p.id === id)?.label
                ).join('、')}
              </span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href="/vibe-demo/recruitai"
              className="px-6 py-3 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              ← 回到主頁
            </Link>
            <Link
              href="/vibe-demo/recruitai#agents"
              className="px-6 py-3 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              探索 AI 代理 →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <RecruitNav />

      <div className="max-w-4xl mx-auto px-4 py-12 pt-28">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ── Left Sidebar ── */}
          <div className="lg:col-span-2">
            {/* Heading */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                <Calendar className="w-3.5 h-3.5" />
                免費諮詢
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                預約您的免費<br />30 分鐘 AI 諮詢
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                與我們的 AI 專家深入了解您的業務需求，量身定制最適合您的自動化方案。
              </p>
            </div>

            {/* What to expect */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5 mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                諮詢內容包括：
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: MessageSquare, text: '了解您業務的具體痛點和需求' },
                  { icon: Zap, text: '推薦最適合的 AI 代理組合' },
                  { icon: Calendar, text: '制訂 3 天快速部署計劃' },
                  { icon: CheckCircle, text: '提供詳細 ROI 預測報告' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Icon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Time badge */}
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 mb-6">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-blue-800 dark:text-blue-200">30 分鐘 · 完全免費</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">無需信用卡 · 無義務承諾</div>
              </div>
            </div>

            {/* Testimonial mini */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed mb-3">
                "諮詢非常有效率，30 分鐘內就清楚了解我們需要哪些 AI 代理，沒有任何廢話。"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">陳</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">陳婉玲 · Belle Boutique 創辦人</div>
              </div>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="lg:col-span-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-6">
              {([1, 2, 3] as Step[]).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step >= s
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {s === 1 ? '基本資料' : s === 2 ? '業務情況' : '確認預約'}
                  </span>
                  {s < 3 && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm">

                {/* ── Step 1 ── */}
                {step === 1 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">您的聯絡資料</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">我們需要以下資料來確認您的預約</p>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            您的姓名 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={e => update('name', e.target.value)}
                            placeholder="張先生 / Ms. Chan"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            公司名稱 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.company}
                            onChange={e => update('company', e.target.value)}
                            placeholder="您的公司名稱"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          電郵地址 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            value={form.email}
                            onChange={e => update('email', e.target.value)}
                            placeholder="you@company.com"
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          電話號碼
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={e => update('phone', e.target.value)}
                            placeholder="+852 XXXX XXXX"
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canProceed1}
                      onClick={() => setStep(2)}
                      className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      繼續 →
                    </button>
                  </div>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">您的業務情況</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">幫助我們為您推薦最合適的 AI 方案</p>
                    <div className="space-y-5">
                      {/* Industry */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          所屬行業 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {INDUSTRY_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => update('industry', opt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                form.industry === opt
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Team size */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          團隊規模 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {TEAM_SIZE_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => update('teamSize', opt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                form.teamSize === opt
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pain points */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          主要業務痛點 <span className="text-red-500">*</span>
                          <span className="text-slate-400 font-normal ml-1">（可多選）</span>
                        </label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {PAIN_POINTS.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePainPoint(p.id)}
                              className={`text-left px-3 py-2.5 rounded-lg text-xs border transition-all ${
                                form.painPoints.includes(p.id)
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        ← 上一步
                      </button>
                      <button
                        type="button"
                        disabled={!canProceed2}
                        onClick={() => setStep(3)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-colors"
                      >
                        繼續 →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 3 ── */}
                {step === 3 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">確認預約</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">最後一步！請確認您的諮詢詳情</p>

                    {/* Summary */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 mb-5 space-y-2.5">
                      <div className="flex gap-2 text-sm">
                        <span className="text-slate-500 w-20 flex-shrink-0">姓名：</span>
                        <span className="text-slate-900 dark:text-white font-medium">{form.name}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-slate-500 w-20 flex-shrink-0">公司：</span>
                        <span className="text-slate-900 dark:text-white font-medium">{form.company}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-slate-500 w-20 flex-shrink-0">電郵：</span>
                        <span className="text-slate-900 dark:text-white font-medium">{form.email}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-slate-500 w-20 flex-shrink-0">行業：</span>
                        <span className="text-slate-900 dark:text-white font-medium">{form.industry}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-slate-500 w-20 flex-shrink-0">團隊：</span>
                        <span className="text-slate-900 dark:text-white font-medium">{form.teamSize}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-slate-500 w-20 flex-shrink-0">痛點：</span>
                        <div className="flex flex-wrap gap-1">
                          {form.painPoints.map(id => (
                            <span key={id} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {PAIN_POINTS.find(p => p.id === id)?.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preferred time */}
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        偏好諮詢時間（可選）
                      </label>
                      <input
                        type="text"
                        value={form.preferredTime}
                        onChange={e => update('preferredTime', e.target.value)}
                        placeholder="例：工作日下午 2–5pm"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Message */}
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        額外備注（可選）
                      </label>
                      <textarea
                        value={form.message}
                        onChange={e => update('message', e.target.value)}
                        rows={3}
                        placeholder="您希望我們提前了解的任何資訊..."
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Trust */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5">
                      <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      您的資料受香港《個人資料（私隱）條例》保護，不會用於任何商業推廣。
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        ← 上一步
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        {submitting ? '提交中…' : '確認預約免費諮詢'}
                      </button>
                    </div>
                    {submitError && (
                      <p className="text-red-400 text-xs text-center mt-2">{submitError}</p>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Bottom trust strip */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />無需信用卡
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />無義務承諾
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />資料保密
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />30 分鐘完成
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
