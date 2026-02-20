'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

  const serviceOptions = [
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
        {/* Hero Section */}
        <section className="py-24 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto mb-8">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Get in Touch' }
            ]} />
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                Get in Touch
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Whether you're exploring a new campaign, want to discuss your PR strategy, or have a question about our services—we'd love to hear from you. Fill out the form below or reach out directly, and we'll get back to you within 24 hours.
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Send us a message</h2>

              {submitted ? (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">✓ Thank you!</h3>
                  <p className="text-green-800 dark:text-green-300">We've received your message and will get back to you within 2 business days.</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">Error</h3>
                  <p className="text-red-800 dark:text-red-300">{error}</p>
                </div>
              ) : null}

              {!submitted && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email *
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
                        Phone
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
                        Company
                      </label>
                      <input
                        id="contact-company"
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder="Your company"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contact-industry" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Industry
                      </label>
                      <input
                        id="contact-industry"
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder="e.g., Tech, Fashion, F&B"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-service" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        What service interests you? *
                      </label>
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

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      placeholder="Tell us about your project, challenge, or question..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Email</p>
                  <a href="mailto:hello@radiancehk.com" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                    hello@radiancehk.com
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Location</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Hong Kong
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Response Time</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    We aim to respond within 24 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Contact</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                For urgent matters or a quick conversation, you can also reach out directly to discuss your project.
              </p>
              <button className="w-full px-4 py-2 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors text-sm">
                Schedule a Call
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">What to Share</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>Your business or project overview</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>Key objectives or challenges</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>Target audience or market</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">•</span>
                  <span>Timeline and budget range (if relevant)</span>
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
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How quickly will you respond?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We aim to respond to all inquiries within 24 hours during business days. For urgent matters, feel free to reach out directly or schedule a call.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Is there a cost for an initial consultation?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              No, we offer a complimentary 30-minute consultation to discuss your objectives and explore how we might help. There's no obligation, and we're happy to provide initial insights.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Do you work with businesses outside Hong Kong?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes, we specialise in Hong Kong but can work with companies based elsewhere if they're targeting Hong Kong audiences or expanding into the Asia-Pacific region. Let's discuss your specific situation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What's your typical project budget range?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Projects vary widely depending on scope and complexity. We work with startups and smaller organisations, as well as larger corporations. Let's have a conversation about your objectives and we can discuss what makes sense for your budget.
            </p>
          </div>
          </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Prefer to start with a conversation? We're happy to discuss your challenge, share ideas and explore what's possible—no sales pitch, just practical thinking.
            </p>
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              Schedule a 30-Minute Call
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
