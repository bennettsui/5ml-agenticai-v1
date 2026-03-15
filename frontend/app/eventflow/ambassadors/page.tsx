'use client';

import { useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'Twitter/X', 'Xiaohongshu', 'Other'];
const CATEGORIES = ['Technology', 'Business', 'Lifestyle', 'Food & Beverage', 'Fashion', 'Travel', 'Finance', 'Health & Wellness', 'Education', 'Entertainment'];

interface AmbassadorForm {
  name: string; email: string; social_handle: string;
  platform: string; follower_count: string;
  bio: string; categories: string[];
}

export default function AmbassadorsPage() {
  const [form, setForm]           = useState<AmbassadorForm>({
    name: '', email: '', social_handle: '', platform: '',
    follower_count: '', bio: '', categories: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  function toggleCat(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const r = await fetch(`${API}/api/eventflow/referral/ambassador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          follower_count: form.follower_count ? parseInt(form.follower_count) : undefined,
        }),
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
            <Link href="/eventflow/kol" className="text-slate-600 hover:text-slate-900 transition-colors">KOL</Link>
            <Link href="/eventflow/sponsors" className="text-slate-600 hover:text-slate-900 transition-colors">Sponsors</Link>
            <Link href="/eventflow" className="text-slate-600 hover:text-slate-900 transition-colors">Events</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — Info */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 rounded-full px-3 py-1 mb-5">
              🎯 Ambassador Program
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4">
              Refer. Earn.<br />
              <span className="text-green-600">Repeat.</span>
            </h1>
            <p className="text-slate-500 text-lg mb-8">
              Join EventFlow&apos;s Ambassador Program. Share events with your community, earn commissions for every successful referral, and get exclusive early access to premium events.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  step: '1', icon: '📝', label: 'Apply',
                  desc: 'Fill in your profile. We review within 48 hours.',
                },
                {
                  step: '2', icon: '🔗', label: 'Get your link',
                  desc: "You'll receive a unique referral code to share.",
                },
                {
                  step: '3', icon: '📢', label: 'Promote',
                  desc: 'Share events with your audience across social media.',
                },
                {
                  step: '4', icon: '💰', label: 'Earn',
                  desc: 'Earn commission for every registration via your code.',
                },
              ].map(({ step, icon, label, desc }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white font-black text-sm flex items-center justify-center">
                    {step}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{icon}</span> {label}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Commission', value: 'Up to 15%', sub: 'per referral' },
                { label: 'Payout', value: '30 days', sub: 'after event' },
                { label: 'Min payout', value: 'HK$500', sub: 'threshold' },
                { label: 'Cookie', value: '30 days', sub: 'tracking window' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className="font-black text-green-600 text-lg">{value}</div>
                  <div className="text-xs text-slate-400">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-green-50">
              <h2 className="font-black text-slate-900">Ambassador Application</h2>
              <p className="text-sm text-slate-500 mt-0.5">Takes less than 2 minutes</p>
            </div>

            {submitted ? (
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Application Received!</h3>
                <p className="text-slate-500 text-sm mb-6">
                  We&apos;ll review your application and send your referral code within 48 hours.
                </p>
                <Link href="/eventflow"
                  className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                  Browse Events →
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Your Name *</label>
                    <input required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                    <input required type="email" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jane@example.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Main Platform *</label>
                    <select required value={form.platform}
                      onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400">
                      <option value="">Select…</option>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Social Handle</label>
                    <input value={form.social_handle}
                      onChange={e => setForm(f => ({ ...f, social_handle: e.target.value }))}
                      placeholder="@yourhandle"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Follower Count (approx.)</label>
                  <input type="number" min="0" value={form.follower_count}
                    onChange={e => setForm(f => ({ ...f, follower_count: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Your Niches</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button"
                        onClick={() => toggleCat(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          form.categories.includes(cat)
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Why do you want to be an ambassador?</label>
                  <textarea value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell us about your audience and how you promote events…"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-green-400" />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={submitting}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
                  {submitting ? 'Submitting…' : 'Apply as Ambassador →'}
                </button>
                <p className="text-xs text-slate-400 text-center">
                  By applying you agree to our ambassador terms. Commission rates vary by event.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
