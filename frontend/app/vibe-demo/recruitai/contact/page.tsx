'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle, Mail, Phone, MessageCircle, MapPin, Clock } from 'lucide-react';
import RecruitNav from '../components/RecruitNav';

const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_API_URL || '');
})();

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    headcount: '',
    industry: '',
    interest: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');

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
          sourcePage: '/contact',
          utmSource: params.get('utm_source') || undefined,
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <RecruitNav />

      <div className="pt-16">
        {/* Hero */}
        <section className="py-16 px-4 bg-gradient-to-br from-blue-700 to-blue-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-4">Contact Us</p>
            <h1 className="text-3xl sm:text-5xl font-black mb-5 leading-tight">
              聯絡 RecruitAI Studio
            </h1>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">
              有任何問題或想了解如何為您的業務部署 AI？我們在 1 個工作天內回覆。
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-12">

              {/* Left: Contact Info */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">聯絡方式</h2>
                  <div className="space-y-5">
                    {[
                      {
                        icon: Mail,
                        label: '電郵',
                        value: 'hello@recruitaistudio.hk',
                        href: 'mailto:hello@recruitaistudio.hk',
                      },
                      {
                        icon: MessageCircle,
                        label: 'WhatsApp',
                        value: '+852 3700 0000',
                        href: 'https://wa.me/85237000000',
                      },
                      {
                        icon: Phone,
                        label: '電話',
                        value: '+852 3700 0000',
                        href: 'tel:+85237000000',
                      },
                      {
                        icon: MapPin,
                        label: '地址',
                        value: '香港九龍灣宏照道38號企業廣場一期',
                        href: undefined,
                      },
                    ].map(({ icon: Icon, label, value, href }) => (
                      <div key={label} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-none">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
                          {href ? (
                            <a href={href} className="text-slate-700 hover:text-blue-600 transition-colors font-medium">{value}</a>
                          ) : (
                            <p className="text-slate-700 font-medium">{value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Office Hours */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">辦公時間</h3>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>週一至週五</span>
                      <span className="font-medium">9:00 – 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>週六</span>
                      <span className="font-medium">10:00 – 14:00</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>週日及公眾假期</span>
                      <span>休息</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      ✅ Nora AI 顧問 24/7 隨時回覆基本查詢
                    </p>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4">快速連結</h3>
                  <div className="space-y-2">
                    {[
                      { label: '預約免費 30 分鐘諮詢', href: '/vibe-demo/recruitai/consultation' },
                      { label: '了解 5 大功能模組', href: '/vibe-demo/recruitai#modules' },
                      { label: '查看方案價格', href: '/vibe-demo/recruitai#pricing' },
                    ].map(l => (
                      <Link key={l.label} href={l.href}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium">
                        → {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Enquiry Form */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
                  {status === 'success' ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">收到您的查詢！</h3>
                      <p className="text-slate-500 mb-6">我們會在 1 個工作天內與您聯絡，或您可以隨時 WhatsApp 我們。</p>
                      <Link href="/vibe-demo/recruitai"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
                        返回主頁
                      </Link>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-slate-900 mb-2">發送查詢</h2>
                      <p className="text-slate-500 text-sm mb-6">填寫以下表格，我們盡快與您聯絡。</p>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name + Email */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">姓名 *</label>
                            <input
                              required
                              value={form.name}
                              onChange={e => set('name', e.target.value)}
                              placeholder="陳先生 / 陳女士"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">電郵 *</label>
                            <input
                              required
                              type="email"
                              value={form.email}
                              onChange={e => set('email', e.target.value)}
                              placeholder="your@company.com"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm"
                            />
                          </div>
                        </div>

                        {/* Phone + Company */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp / 電話</label>
                            <input
                              value={form.phone}
                              onChange={e => set('phone', e.target.value)}
                              placeholder="+852 XXXX XXXX"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">公司名稱</label>
                            <input
                              value={form.company}
                              onChange={e => set('company', e.target.value)}
                              placeholder="ABC 有限公司"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm"
                            />
                          </div>
                        </div>

                        {/* Industry + Headcount */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">業務類型</label>
                            <select
                              value={form.industry}
                              onChange={e => set('industry', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm"
                            >
                              <option value="">請選擇</option>
                              {['零售 / 電商', '餐飲 / 食品', '金融 / 保險', '物流 / 貿易', '專業服務', '醫療 / 健康', '教育', '其他'].map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">員工人數</label>
                            <select
                              value={form.headcount}
                              onChange={e => set('headcount', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm"
                            >
                              <option value="">請選擇</option>
                              {['1–5 人', '6–15 人', '16–30 人', '31–50 人', '50 人以上'].map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Interest */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">感興趣的功能模組</label>
                          <select
                            value={form.interest}
                            onChange={e => set('interest', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm"
                          >
                            <option value="">請選擇</option>
                            {[
                              '增長模組（廣告/SEO/潛客）',
                              '市場推廣（社交內容/EDM）',
                              '客戶服務（WhatsApp AI）',
                              '業務運營（發票/表單/報告）',
                              '業務分析（BI 儀表板）',
                              '全套方案',
                              '未決定，想先了解',
                            ].map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">查詢內容 / 目前最大痛點</label>
                          <textarea
                            rows={4}
                            value={form.message}
                            onChange={e => set('message', e.target.value)}
                            placeholder="例如：我們每月要人手整理大量報告，想了解 AI 如何自動化這個流程..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white text-sm resize-none"
                          />
                        </div>

                        {status === 'error' && (
                          <p className="text-red-600 text-sm">提交出現問題，請稍後重試或直接 WhatsApp 我們。</p>
                        )}

                        <button
                          type="submit"
                          disabled={status === 'loading'}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          {status === 'loading' ? '提交中...' : (
                            <><Send className="w-5 h-5" /><span>發送查詢</span></>
                          )}
                        </button>

                        <p className="text-center text-xs text-slate-400">
                          提交即代表您同意我們聯絡您以了解業務需求 · 不會用於任何推廣用途
                        </p>
                      </form>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-slate-900 text-center">
          <p className="text-slate-500 text-sm mb-2">© 2026 RecruitAI Studio by 5 Miles Lab</p>
          <Link href="/vibe-demo/recruitai" className="text-blue-400 hover:text-blue-300 text-sm">返回主頁 →</Link>
        </footer>
      </div>
    </div>
  );
}
