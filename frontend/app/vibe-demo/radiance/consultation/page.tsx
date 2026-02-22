'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/* ── Custom dropdown ─────────────────────────────────────── */
function CustomSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full px-4 py-3 border text-left flex items-center justify-between transition-colors focus:outline-none ${
          open
            ? 'border-purple-600 ring-1 ring-purple-600'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg`}
      >
        <span className={selected ? '' : 'text-slate-400 dark:text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {options.map(opt => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => { onChange(name, opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === opt.value
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Hidden native input for form validation */}
      {required && (
        <input
          type="text"
          name={name}
          value={value}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function ConsultationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    serviceInterest: '',
    budget: '',
    timeline: '',
    message: '',
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
        const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action: 'consultation' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const recaptchaToken = await getRecaptchaToken();
      const response = await fetch('/api/radiance/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit form');

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', company: '', industry: '', serviceInterest: '', budget: '', timeline: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = [
    { label: 'Public Relations', value: 'Public Relations' },
    { label: 'Event Management', value: 'Events' },
    { label: 'Social Media Strategy', value: 'Social Media' },
    { label: 'KOL & Influencer Marketing', value: 'KOL Marketing' },
    { label: 'Creative & Content Production', value: 'Creative Production' },
    { label: 'Multiple Services', value: 'Multiple Services' },
    { label: 'Other', value: 'Other' },
  ];

  const budgetOptions = [
    { label: 'Under HKD 50k', value: 'Under HKD 50k' },
    { label: 'HKD 50k – 100k', value: 'HKD 50k - 100k' },
    { label: 'HKD 100k – 250k', value: 'HKD 100k - 250k' },
    { label: 'HKD 250k+', value: 'HKD 250k+' },
  ];

  const timelineOptions = [
    { label: 'Immediate (This month)', value: 'Immediate (This month)' },
    { label: 'Short-term (1–3 months)', value: 'Short-term (1-3 months)' },
    { label: 'Medium-term (3–6 months)', value: 'Medium-term (3-6 months)' },
    { label: 'Long-term (6+ months)', value: 'Long-term (6+ months)' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">

        {/* Breadcrumb */}
        <section className="py-3 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Free Consultation' }
            ]} />
          </div>
        </section>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=2070&q=80"
              alt="Strategy consultation session"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/72" />
          </div>

          {/* Content */}
          <div className="relative z-10 py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300 mb-4">
                Free Strategy Session
              </p>
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Let&apos;s talk about<br />your brand
              </h1>
              <p className="text-xl text-slate-200 leading-relaxed max-w-3xl font-light mb-8">
                A 30-minute call with our strategy team. No obligations—just honest ideas on how integrated PR and marketing can move your brand forward.
              </p>
              <div className="max-w-3xl mb-8">
                <p className="text-sm text-slate-300 mb-4">Common challenges we help with:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-200">
                  <li className="flex gap-3"><span className="text-purple-300 flex-shrink-0">→</span><span>Unclear brand positioning or messaging</span></li>
                  <li className="flex gap-3"><span className="text-purple-300 flex-shrink-0">→</span><span>Struggling to build media credibility</span></li>
                  <li className="flex gap-3"><span className="text-purple-300 flex-shrink-0">→</span><span>Disconnected PR, events, and digital efforts</span></li>
                  <li className="flex gap-3"><span className="text-purple-300 flex-shrink-0">→</span><span>Entering a competitive market</span></li>
                  <li className="flex gap-3"><span className="text-purple-300 flex-shrink-0">→</span><span>Limited budget, need strategy not just tactics</span></li>
                  <li className="flex gap-3"><span className="text-purple-300 flex-shrink-0">→</span><span>Scaling brand awareness or reputation</span></li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  30-minute session
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  Market audit included
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  No obligation
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-start">

            {/* Left: Why + Process */}
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
                  Why Radiance?
                </h2>
                <div className="space-y-8">
                  {[
                    { title: 'Integrated by design', desc: 'PR, events, and digital work as one strategy—not in silos.' },
                    { title: 'Deep local expertise', desc: 'Hong Kong media, audiences, and cultural dynamics inside-out.' },
                    { title: 'Real execution', desc: 'We handle media relations, event logistics, and content. We own outcomes.' },
                    { title: 'Diverse sector experience', desc: 'From tech to fashion to NGOs—best practices across industries.' },
                  ].map(item => (
                    <div key={item.title} className="flex gap-5">
                      <div className="w-px bg-purple-200 dark:bg-purple-800 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white mb-1">{item.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-medium text-slate-900 dark:text-white mb-5">What happens next</h3>
                <ol className="space-y-4">
                  {[
                    'We review your submission and confirm your meeting within 24 hours',
                    '30-minute video or phone call with our strategy team',
                    'We share actionable recommendations and explore fit',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right: Form */}
            <div>
              <div className="border border-slate-200 dark:border-slate-800 p-8">
                <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-7">
                  Book your consultation
                </h2>

                {submitted && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-5 mb-6">
                    <p className="font-medium text-green-900 dark:text-green-200 text-sm">✓ Request received</p>
                    <p className="text-green-800 dark:text-green-300 text-sm mt-1">We'll be in touch within 24 hours to confirm your consultation.</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-5 mb-6">
                    <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {!submitted && (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="consult-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Name *</label>
                        <input
                          id="consult-name"
                          type="text" name="name" value={formData.name} onChange={handleChange} required
                          placeholder="Your name"
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="consult-email" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email *</label>
                        <input
                          id="consult-email"
                          type="email" name="email" value={formData.email} onChange={handleChange} required
                          placeholder="you@company.com"
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="consult-phone" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Phone</label>
                        <input
                          id="consult-phone"
                          type="tel" name="phone" value={formData.phone} onChange={handleChange}
                          placeholder="+852 xxxx xxxx"
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="consult-company" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Company</label>
                        <input
                          id="consult-company"
                          type="text" name="company" value={formData.company} onChange={handleChange}
                          placeholder="Your company"
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="consult-industry" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Industry</label>
                        <input
                          id="consult-industry"
                          type="text" name="industry" value={formData.industry} onChange={handleChange}
                          placeholder="e.g. Fashion, F&B"
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="consult-service" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Service Interest *</label>
                        <CustomSelect
                          name="serviceInterest"
                          value={formData.serviceInterest}
                          onChange={handleSelectChange}
                          options={serviceOptions}
                          placeholder="Select a service"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="consult-budget" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Budget Range</label>
                        <CustomSelect
                          name="budget"
                          value={formData.budget}
                          onChange={handleSelectChange}
                          options={budgetOptions}
                          placeholder="Select a range"
                        />
                      </div>
                      <div>
                        <label htmlFor="consult-timeline" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Timeline</label>
                        <CustomSelect
                          name="timeline"
                          value={formData.timeline}
                          onChange={handleSelectChange}
                          options={timelineOptions}
                          placeholder="Select a timeline"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="consult-message" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Goals or challenge</label>
                      <textarea
                        id="consult-message"
                        name="message" value={formData.message} onChange={handleChange} rows={4}
                        placeholder="What are you looking to achieve? Any specific challenges we should know about?"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {loading ? 'Sending...' : 'Book Your Consultation'}
                    </button>

                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                      No spam. No obligations. Just a conversation.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-10">Frequently asked questions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { q: 'Is there a cost?', a: 'No—completely free. No obligation to work with us afterward.' },
                { q: 'How do I prepare?', a: 'Think about your biggest challenge or goal right now. That\'s all you need.' },
                { q: 'What if I\'m not sure what I need?', a: 'Perfect. We\'ll ask the right questions and help you figure out what fits.' },
                { q: 'Can we focus on one service?', a: 'Absolutely—PR, events, social, or any mix. We\'ll tailor the conversation.' },
              ].map(({ q, a }) => (
                <div key={q} className="border-t border-slate-200 dark:border-slate-800 pt-5">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2 text-sm">{q}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Back link */}
        <section className="py-10 px-6 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Prefer email? Reach us at{' '}
              <a href="mailto:mandy@radiancehk.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                mandy@radiancehk.com
              </a>
            </p>
            <Link href="/vibe-demo/radiance" className="text-sm text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              ← Back to Radiance
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
