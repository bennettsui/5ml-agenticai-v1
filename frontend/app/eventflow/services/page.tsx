'use client';

import { useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const SERVICES = [
  {
    slug: 'event-management',
    name: 'Full-Service Event Management',
    category: 'management',
    tagline: 'End-to-end planning, coordination & execution',
    description: 'From concept to close, our team handles venue sourcing, vendor coordination, run-of-show, staffing, and post-event wrap-up. Ideal for conferences, product launches, and corporate galas.',
    base_price_hkd: 2000000,
    price_unit: 'event',
    icon: '🏢',
    accentColor: '#f59e0b',
    features: [
      'Venue scouting & negotiation',
      'Vendor & supplier management',
      'Run-of-show production',
      'On-site staffing & coordination',
      'Post-event analytics report',
    ],
  },
  {
    slug: 'event-production',
    name: 'Event Production',
    category: 'production',
    tagline: 'AV, staging, lighting & technical excellence',
    description: 'Professional audio-visual production with stage design, lighting rigs, PA systems, LED screens, and broadcast-ready setups for hybrid and in-person events.',
    base_price_hkd: 800000,
    price_unit: 'day',
    icon: '🎬',
    accentColor: '#3b82f6',
    features: [
      'Stage & set design',
      'PA & audio engineering',
      'Lighting design & rigging',
      'LED screen walls & displays',
      'Live streaming & recording',
    ],
  },
  {
    slug: 'pr-media',
    name: 'PR & Media Services',
    category: 'pr',
    tagline: 'Media coverage, press releases & influencer outreach',
    description: "We manage your event's media presence — from crafting press releases and pitching to journalists, to coordinating press days and post-event coverage.",
    base_price_hkd: 500000,
    price_unit: 'event',
    icon: '📢',
    accentColor: '#a855f7',
    features: [
      'Press release writing & distribution',
      'Media list management',
      'Press conference coordination',
      'Influencer/KOL outreach',
      'Post-event coverage report',
    ],
  },
  {
    slug: 'led-sphere',
    name: 'LED Sphere Rental',
    category: 'tech',
    tagline: '360° immersive LED dome for unforgettable experiences',
    description: 'Our 6m diameter 360° LED sphere creates a fully immersive visual experience. Perfect for product launches, brand activations, art installations, and VIP experiences.',
    base_price_hkd: 1500000,
    price_unit: 'day',
    icon: '🌐',
    accentColor: '#22c55e',
    features: [
      '6m diameter 360° LED sphere',
      'Resolution: 4K per panel',
      'Custom content loading',
      'On-site AV technician included',
      'Setup & teardown included',
      'Max 30 pax inside simultaneously',
    ],
  },
  {
    slug: 'ai-photo-booth',
    name: 'AI Photo Booth',
    category: 'tech',
    tagline: 'Instant AI-transformed portraits with brand overlays',
    description: 'Our AI photo booth uses real-time generative AI to transform guest portraits into stunning artistic styles — anime, oil painting, cyberpunk, and more. Instant print or digital share.',
    base_price_hkd: 300000,
    price_unit: 'day',
    icon: '📸',
    accentColor: '#f43f5e',
    features: [
      'Real-time AI portrait transformation',
      '10+ art styles (anime, oil, cyberpunk…)',
      'Custom brand frames & overlays',
      'Instant digital share via QR',
      'Optional thermal print station',
      'Unlimited sessions during event',
    ],
  },
];

const BUDGET_RANGES = [
  'Under HK$100,000',
  'HK$100,000 – 300,000',
  'HK$300,000 – 1,000,000',
  'HK$1,000,000 – 3,000,000',
  'Over HK$3,000,000',
];

interface InquiryForm {
  service_slug: string;
  contact_name: string;
  email: string;
  phone: string;
  company: string;
  event_date: string;
  budget_range: string;
  notes: string;
}

export default function ServicesPage() {
  const [modal, setModal] = useState<string | null>(null); // service slug
  const [form, setForm] = useState<InquiryForm>({
    service_slug: '', contact_name: '', email: '', phone: '',
    company: '', event_date: '', budget_range: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function openModal(slug: string) {
    setForm(f => ({ ...f, service_slug: slug }));
    setSubmitted(false);
    setError('');
    setModal(slug);
  }

  function closeModal() { setModal(null); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/eventflow/services/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to submit');
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const activeService = SERVICES.find(s => s.slug === modal);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/eventflow" className="flex items-center gap-2 font-black text-slate-900 text-lg">
            🎟 <span>EventFlow</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/eventflow" className="text-slate-600 hover:text-slate-900 transition-colors">Events</Link>
            <Link href="/eventflow/sponsors" className="text-slate-600 hover:text-slate-900 transition-colors">Sponsors</Link>
            <Link href="/eventflow/kol" className="text-slate-600 hover:text-slate-900 transition-colors">KOL</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mb-4">
          ⚡ Professional Event Agency
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4">
          Everything you need for<br />
          <span className="text-amber-500">an unforgettable event</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          From full event management to cutting-edge tech installations. ExpLab&apos;s agency team delivers world-class experiences.
        </p>
      </section>

      {/* Service cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(service => (
            <div key={service.slug}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              {/* Color bar */}
              <div className="h-1.5 w-full" style={{ background: service.accentColor }} />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-3xl mb-2">{service.icon}</div>
                    <h2 className="font-black text-slate-900 text-lg leading-snug">{service.name}</h2>
                    <p className="text-xs mt-1" style={{ color: service.accentColor }}>{service.tagline}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-black text-slate-900 text-lg">
                      HK${(service.base_price_hkd / 100).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">per {service.price_unit}</div>
                    <div className="text-xs text-slate-400">starting from</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 flex-1">{service.description}</p>
                <ul className="space-y-1.5 mb-6">
                  {service.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openModal(service.slug)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: service.accentColor }}>
                  Enquire Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-3">Not sure what you need?</h2>
          <p className="text-slate-400 mb-8">Talk to our team — we&apos;ll design a custom package for your event.</p>
          <button
            onClick={() => openModal('event-management')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-4 rounded-xl transition-colors">
            Get a Free Consultation
          </button>
        </div>
      </section>

      {/* Inquiry Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">Service Enquiry</h2>
                {activeService && (
                  <p className="text-sm text-amber-600 mt-0.5">{activeService.name}</p>
                )}
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 transition-colors text-xl">✕</button>
            </div>

            {submitted ? (
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Enquiry Received!</h3>
                <p className="text-slate-500 text-sm">Our team will contact you within 1 business day.</p>
                <button onClick={closeModal}
                  className="mt-6 bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 space-y-4">
                {/* Service select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Service</label>
                  <select
                    value={form.service_slug}
                    onChange={e => setForm(f => ({ ...f, service_slug: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-400">
                    {SERVICES.map(s => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Your Name *</label>
                    <input required value={form.contact_name}
                      onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Company</label>
                    <input value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                    <input required type="email" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jane@company.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                    <input value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+852 9000 0000"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Event Date</label>
                    <input type="date" value={form.event_date}
                      onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Budget Range</label>
                    <select value={form.budget_range}
                      onChange={e => setForm(f => ({ ...f, budget_range: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400">
                      <option value="">Select range…</option>
                      {BUDGET_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tell us about your event</label>
                  <textarea value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Event type, expected attendance, special requirements…"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-400" />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
                  {submitting ? 'Sending…' : 'Send Enquiry →'}
                </button>
                <p className="text-xs text-slate-400 text-center">We respond within 1 business day</p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
