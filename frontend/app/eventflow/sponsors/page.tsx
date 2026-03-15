'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface SeekingEvent {
  id: number; title: string; start_at: string; location: string;
  organizer_name: string; brief: string | null;
  package_types: string[] | null; budget_range: string | null;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail & E-commerce',
  'Food & Beverage', 'Real Estate', 'Media & Entertainment', 'Professional Services', 'Other',
];
const EVENT_TYPES = [
  'Tech Conference', 'Business Summit', 'Startup Demo Day', 'Awards Ceremony',
  'Networking Event', 'Trade Show', 'Sports & Recreation', 'Cultural & Arts', 'Charity / NGO',
];
const BUDGET_RANGES = [
  'Under HK$50,000', 'HK$50,000 – 150,000', 'HK$150,000 – 500,000', 'Over HK$500,000',
];

interface SponsorForm {
  company: string; contact_name: string; contact_email: string; contact_phone: string;
  industries: string[]; event_types: string[]; budget_range: string;
  description: string; website: string;
}

export default function SponsorsPage() {
  const [events, setEvents]       = useState<SeekingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<SponsorForm>({
    company: '', contact_name: '', contact_email: '', contact_phone: '',
    industries: [], event_types: [], budget_range: '', description: '', website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    fetch(`${API}/api/eventflow/sponsors/seeking`)
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoadingEvents(false); })
      .catch(() => setLoadingEvents(false));
  }, []);

  function toggleArr(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const r = await fetch(`${API}/api/eventflow/sponsors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/eventflow" className="font-black text-slate-900 text-lg">🎟 EventFlow</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/eventflow/services" className="text-slate-600 hover:text-slate-900 transition-colors">Services</Link>
            <Link href="/eventflow/kol" className="text-slate-600 hover:text-slate-900 transition-colors">KOL</Link>
            <button onClick={() => { setShowForm(true); setSubmitted(false); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
              Become a Sponsor
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-4">
              🤝 Sponsor Partnership
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4">
              Put your brand in front of<br />
              <span className="text-blue-600">the right audience</span>
            </h1>
            <p className="text-slate-500 text-lg mb-8">
              Sponsor professional events across Hong Kong. Reach decision-makers, innovators, and industry leaders through carefully curated event partnerships.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(true); setSubmitted(false); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                Register as Sponsor →
              </button>
              <Link href="#seeking"
                className="border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                View Events
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🎯', label: 'Targeted Reach', sub: 'Industry-specific audiences' },
              { icon: '📣', label: 'Brand Visibility', sub: 'On-site + digital presence' },
              { icon: '🤝', label: 'B2B Connections', sub: 'Direct networking access' },
              { icon: '📊', label: 'Measurable ROI', sub: 'Post-event analytics' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-bold text-slate-900 text-sm">{label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events seeking sponsors */}
      <section id="seeking" className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Events Seeking Sponsors</h2>
          <p className="text-slate-500 mb-8">These upcoming events are actively looking for sponsor partners.</p>

          {loadingEvents ? (
            <div className="text-slate-400 text-sm">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-500">No events currently seeking sponsors. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map(ev => (
                <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-900">{ev.title}</h3>
                    <span className="flex-shrink-0 ml-3 text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">Open</span>
                  </div>
                  <div className="text-sm text-slate-500 space-y-1 mb-3">
                    <div>📅 {new Date(ev.start_at).toLocaleDateString('en-HK', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    {ev.location && <div>📍 {ev.location}</div>}
                    <div>🏢 {ev.organizer_name}</div>
                  </div>
                  {ev.brief && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{ev.brief}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {ev.package_types?.map(pkg => (
                      <span key={pkg} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pkg}</span>
                    ))}
                    {ev.budget_range && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Budget: {ev.budget_range}</span>
                    )}
                  </div>
                  <button onClick={() => { setShowForm(true); setSubmitted(false); }}
                    className="mt-4 w-full text-sm font-bold text-blue-600 border border-blue-200 rounded-xl py-2 hover:bg-blue-50 transition-colors">
                    Express Interest →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Registration Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">Sponsor Registration</h2>
                <p className="text-sm text-slate-500 mt-0.5">Our team will reach out within 2 business days</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
            </div>

            {submitted ? (
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Registration Received!</h3>
                <p className="text-slate-500 text-sm">Our partnership team will contact you within 2 business days.</p>
                <button onClick={() => setShowForm(false)}
                  className="mt-6 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Company Name *</label>
                    <input required value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Website</label>
                    <input value={form.website}
                      onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://acme.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Name</label>
                    <input value={form.contact_name}
                      onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                    <input required type="email" value={form.contact_email}
                      onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                      placeholder="jane@acme.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Industries *</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(ind => (
                      <button key={ind} type="button"
                        onClick={() => setForm(f => ({ ...f, industries: toggleArr(f.industries, ind) }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          form.industries.includes(ind)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}>{ind}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Event Types Interested In</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map(et => (
                      <button key={et} type="button"
                        onClick={() => setForm(f => ({ ...f, event_types: toggleArr(f.event_types, et) }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          form.event_types.includes(et)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}>{et}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Typical Sponsorship Budget</label>
                  <select value={form.budget_range}
                    onChange={e => setForm(f => ({ ...f, budget_range: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">Select range…</option>
                    {BUDGET_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">About your company / sponsorship goals</label>
                  <textarea value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Tell us about your brand and what you hope to achieve through event sponsorships…"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400" />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
                  {submitting ? 'Registering…' : 'Submit Registration →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
