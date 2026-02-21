'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { useLanguage } from '../hooks/useLanguage';
import { useParallax } from '../hooks/useParallax';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function CustomSelect({ name, value, onChange, options, placeholder, required }: {
  name: string; value: string;
  onChange: (name: string, value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string; required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className={`w-full px-4 py-3 border text-left flex items-center justify-between transition-colors focus:outline-none rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${open ? 'border-purple-600 ring-1 ring-purple-600' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}>
        <span className={selected ? '' : 'text-slate-400 dark:text-slate-500'}>{selected ? selected.label : placeholder}</span>
        <svg className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {options.map(opt => (
            <li key={opt.value}>
              <button type="button" onClick={() => { onChange(name, opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {required && <input type="text" name={name} value={value} onChange={() => {}} required className="sr-only" tabIndex={-1} aria-hidden="true" />}
    </div>
  );
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function ContactPage() {
  const { lang } = useLanguage();
  const parallaxRef = useParallax(0.25);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    serviceInterest: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load reCAPTCHA v3 script once
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || document.getElementById('recaptcha-v3-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-v3-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const getRecaptchaToken = useCallback(async (): Promise<string> => {
    if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) return '';
    return new Promise<string>(resolve => {
      window.grecaptcha!.ready(async () => {
        const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action: 'contact' });
        resolve(token);
      });
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const serviceOptions = lang === 'zh'
    ? [
        { label: '公關服務', value: 'Public Relations' },
        { label: '活動管理', value: 'Events' },
        { label: '社交媒體策略', value: 'Social Media' },
        { label: 'KOL與網紅行銷', value: 'KOL Marketing' },
        { label: '創意與內容製作', value: 'Creative Production' },
        { label: '多項服務', value: 'Multiple Services' },
        { label: '其他', value: 'Other' },
      ]
    : [
        { label: 'Public Relations', value: 'Public Relations' },
        { label: 'Event Management', value: 'Events' },
        { label: 'Social Media Strategy', value: 'Social Media' },
        { label: 'KOL & Influencer Marketing', value: 'KOL Marketing' },
        { label: 'Creative & Content Production', value: 'Creative Production' },
        { label: 'Multiple Services', value: 'Multiple Services' },
        { label: 'Other', value: 'Other' },
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const recaptchaToken = await getRecaptchaToken();
      const response = await fetch('/api/radiance/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        industry: '',
        serviceInterest: '',
        message: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-3 px-6">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: lang === 'zh' ? '首頁' : 'Home', href: '/vibe-demo/radiance' },
              { label: lang === 'zh' ? '立即聯絡' : 'Get in Touch' }
            ]} />
          </div>
        </section>

        <section className="relative py-24 px-6 overflow-hidden">
          {/* Hero background */}
          <div className="absolute inset-0 z-0">
            <div
              ref={parallaxRef}
              className="absolute inset-0 w-full h-[130%] -top-[15%] bg-cover bg-center will-change-transform"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80)' }}
            />
            <div className="absolute inset-0 bg-slate-950/75" />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white leading-tight">
                {lang === 'zh' ? '聯絡我們' : 'Get in Touch'}
              </h1>
              <p className="text-lg text-white leading-relaxed">
                {lang === 'zh'
                  ? '無論您正在探索新的宣傳活動、希望討論公關策略，還是對我們的服務有任何疑問——我們誠摯期待您的來訊。請填寫以下表格或直接聯絡我們，我們將於24小時內回覆。'
                  : 'Whether you\'re exploring a new campaign, want to discuss your PR strategy, or have a question about our services—we\'d love to hear from you. Fill out the form below or reach out directly, and we\'ll get back to you within 24 hours.'}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16 px-6 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                {lang === 'zh' ? '發送訊息' : 'Send us a message'}
              </h2>

              {submitted ? (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    {lang === 'zh' ? '✓ 感謝您的來訊！' : '✓ Thank you!'}
                  </h3>
                  <p className="text-green-800 dark:text-green-300">
                    {lang === 'zh'
                      ? '我們已收到您的訊息，將於兩個工作天內回覆您。'
                      : 'We\'ve received your message and will get back to you within 2 business days.'}
                  </p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                    {lang === 'zh' ? '錯誤' : 'Error'}
                  </h3>
                  <p className="text-red-800 dark:text-red-300">{error}</p>
                </div>
              ) : null}

              {!submitted && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {lang === 'zh' ? '姓名 *' : 'Name *'}
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder={lang === 'zh' ? '您的姓名' : 'Your name'}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {lang === 'zh' ? '電郵 *' : 'Email *'}
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder="your.email@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {lang === 'zh' ? '電話' : 'Phone'}
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder="+852 xxxx xxxx"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {lang === 'zh' ? '公司名稱' : 'Company'}
                      </label>
                      <input
                        id="contact-company"
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder={lang === 'zh' ? '您的公司名稱' : 'Your company'}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contact-industry" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {lang === 'zh' ? '行業' : 'Industry'}
                      </label>
                      <input
                        id="contact-industry"
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder={lang === 'zh' ? '例如：科技、時尚、餐飲' : 'e.g., Tech, Fashion, F&B'}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-service" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {lang === 'zh' ? '您感興趣的服務 *' : 'What service interests you? *'}
                      </label>
                      <CustomSelect
                        name="serviceInterest"
                        value={formData.serviceInterest}
                        onChange={handleSelectChange}
                        options={serviceOptions}
                        placeholder={lang === 'zh' ? '選擇服務' : 'Select a service'}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {lang === 'zh' ? '訊息 *' : 'Message *'}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      placeholder={lang === 'zh' ? '請告訴我們您的項目、挑戰或問題……' : 'Tell us about your project, challenge, or question...'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {loading
                      ? (lang === 'zh' ? '發送中……' : 'Sending...')
                      : (lang === 'zh' ? '發送訊息' : 'Send Message')}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {lang === 'zh' ? '聯絡資訊' : 'Contact Information'}
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
                    {lang === 'zh' ? '電郵' : 'Email'}
                  </p>
                  <a href="mailto:mandy@radiancehk.com" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                    mandy@radiancehk.com
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
                    {lang === 'zh' ? '地點' : 'Location'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {lang === 'zh' ? '香港' : 'Hong Kong'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
                    {lang === 'zh' ? '回覆時間' : 'Response Time'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {lang === 'zh' ? '我們致力於24小時內回覆' : 'We aim to respond within 24 hours'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                {lang === 'zh' ? '快速聯絡' : 'Quick Contact'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '如有緊急事宜或希望快速溝通，歡迎直接聯絡我們，與您討論項目詳情。'
                  : 'For urgent matters or a quick conversation, you can also reach out directly to discuss your project.'}
              </p>
              <Link href="/vibe-demo/radiance/consultation" className="block w-full text-center px-4 py-2 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors text-sm">
                {lang === 'zh' ? '預約通話' : 'Schedule a Call'}
              </Link>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                {lang === 'zh' ? '建議分享的資訊' : 'What to Share'}
              </h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>{lang === 'zh' ? '您的業務或項目概況' : 'Your business or project overview'}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>{lang === 'zh' ? '主要目標或挑戰' : 'Key objectives or challenges'}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>{lang === 'zh' ? '目標受眾或市場' : 'Target audience or market'}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>{lang === 'zh' ? '時間表及預算範圍（如適用）' : 'Timeline and budget range (if relevant)'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-6 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          {lang === 'zh' ? '常見問題' : 'Frequently asked questions'}
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '你們多快會回覆？' : 'How quickly will you respond?'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們致力於在工作天內24小時回覆所有查詢。如有緊急事宜，歡迎直接聯絡我們或預約通話。'
                : 'We aim to respond to all inquiries within 24 hours during business days. For urgent matters, feel free to reach out directly or schedule a call.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '初步諮詢需要收費嗎？' : 'Is there a cost for an initial consultation?'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '不需要。我們提供免費的30分鐘諮詢，讓您與我們討論目標並探討合作可能。諮詢無任何義務，我們亦樂意提供初步意見。'
                : 'No, we offer a complimentary 30-minute consultation to discuss your objectives and explore how we might help. There\'s no obligation, and we\'re happy to provide initial insights.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '你們有為香港以外的企業服務嗎？' : 'Do you work with businesses outside Hong Kong?'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '有。我們的專長在香港，但亦可為以香港受眾為目標、或正擴展至亞太區的海外企業提供服務。歡迎與我們討論您的具體情況。'
                : 'Yes, we specialise in Hong Kong but can work with companies based elsewhere if they\'re targeting Hong Kong audiences or expanding into the Asia-Pacific region. Let\'s discuss your specific situation.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '你們的一般項目預算範圍是多少？' : 'What\'s your typical project budget range?'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '項目預算因範疇及複雜程度而異。我們服務初創企業、中小型機構，以及大型企業。歡迎與我們進行一次對話，了解您的目標，我們再共同探討合適的預算方案。'
                : 'Projects vary widely depending on scope and complexity. We work with startups and smaller organisations, as well as larger corporations. Let\'s have a conversation about your objectives and we can discuss what makes sense for your budget.'}
            </p>
          </div>
          </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {lang === 'zh'
                ? '更傾向於先來一次對話？我們樂意聆聽您的挑戰、分享想法並探索可能性——沒有推銷，只有務實的交流。'
                : 'Prefer to start with a conversation? We\'re happy to discuss your challenge, share ideas and explore what\'s possible—no sales pitch, just practical thinking.'}
            </p>
            <Link href="/vibe-demo/radiance/consultation" className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              {lang === 'zh' ? '預約30分鐘通話' : 'Schedule a 30-Minute Call'}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
