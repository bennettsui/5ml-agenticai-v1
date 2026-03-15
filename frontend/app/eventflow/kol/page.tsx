'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface KolProfile {
  id: number; name: string; handle: string | null;
  platforms: string[] | null; follower_counts: Record<string, number> | null;
  categories: string[] | null; bio: string | null; rate_range: string | null;
}

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'Twitter/X', 'Xiaohongshu'];
const CATEGORIES = ['Technology', 'Business', 'Lifestyle', 'Food & Beverage', 'Fashion', 'Travel', 'Finance', 'Health & Wellness', 'Entertainment', 'Education'];
const RATE_RANGES = [
  'HK$3,000 – 10,000 per post',
  'HK$10,000 – 30,000 per post',
  'HK$30,000 – 100,000 per campaign',
  'HK$100,000+ per campaign',
  'Open to discuss',
];

interface KolForm {
  name: string; handle: string; platforms: string[];
  follower_counts: Record<string, string>;
  categories: string[]; bio: string; contact_email: string;
  contact_phone: string; rate_range: string;
}

export default function KolPage() {
  const [profiles, setProfiles]     = useState<KolProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState<KolForm>({
    name: '', handle: '', platforms: [],
    follower_counts: {}, categories: [],
    bio: '', contact_email: '', contact_phone: '', rate_range: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    fetch(`${API}/api/eventflow/kol/profiles`)
      .then(r => r.json())
      .then(d => { setProfiles(d.profiles || []); setLoadingProfiles(false); })
      .catch(() => setLoadingProfiles(false));
  }, []);

  function toggleArr(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  function togglePlatform(platform: string) {
    const newPlatforms = toggleArr(form.platforms, platform);
    const newCounts = { ...form.follower_counts };
    if (!newPlatforms.includes(platform)) delete newCounts[platform];
    setForm(f => ({ ...f, platforms: newPlatforms, follower_counts: newCounts }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const counts: Record<string, number> = {};
      for (const [k, v] of Object.entries(form.follower_counts)) {
        if (v) counts[k] = parseInt(v);
      }
      const r = await fetch(`${API}/api/eventflow/kol/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, follower_counts: counts }),
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

  function totalFollowers(kol: KolProfile): string {
    if (!kol.follower_counts) return '—';
    const total = Object.values(kol.follower_counts).reduce((a, b) => a + b, 0);
    if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M`;
    if (total >= 1000) return `${(total / 1000).toFixed(0)}K`;
    return total.toString();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/eventflow" className="font-black text-slate-900 text-lg">🎟 EventFlow</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/eventflow/services" className="text-slate-600 hover:text-slate-900 transition-colors">Services</Link>
            <Link href="/eventflow/sponsors" className="text-slate-600 hover:text-slate-900 transition-colors">Sponsors</Link>
            <button onClick={() => { setShowForm(true); setSubmitted(false); }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
              Join as KOL
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 rounded-full px-3 py-1 mb-4">
              🌟 KOL / KOC Program
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4">
              Amplify events.<br />
              <span className="text-purple-600">Grow your brand.</span>
            </h1>
            <p className="text-slate-500 text-lg mb-8">
              Join our curated network of Key Opinion Leaders. Partner with premium events, create authentic content, and earn competitive rates.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(true); setSubmitted(false); }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                Apply as KOL →
              </button>
              <Link href="#profiles"
                className="border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                Browse KOLs
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '💰', label: 'Competitive Rates', sub: 'Fair pay for every campaign' },
              { icon: '🎯', label: 'Brand Fit', sub: 'Events that match your niche' },
              { icon: '📊', label: 'Analytics Reports', sub: 'Post-campaign performance data' },
              { icon: '🚀', label: 'Career Growth', sub: 'Exclusive opportunities first' },
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

      {/* Active KOLs */}
      <section id="profiles" className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Our KOL Network</h2>
          <p className="text-slate-500 mb-8">Verified creators and influencers across Hong Kong.</p>

          {loadingProfiles ? (
            <div className="text-slate-400 text-sm">Loading…</div>
          ) : profiles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">🌟</div>
              <p className="text-slate-500 mb-4">Be among the first to join our KOL network!</p>
              <button onClick={() => { setShowForm(true); setSubmitted(false); }}
                className="bg-purple-600 text-white font-bold px-6 py-3 rounded-xl">Apply Now →</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(kol => (
                <div key={kol.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{kol.name}</h3>
                      {kol.handle && <p className="text-xs text-purple-600 mt-0.5">@{kol.handle}</p>}
                    </div>
                    <div className="text-right">
                      <div className="font-black text-purple-600 text-lg">{totalFollowers(kol)}</div>
                      <div className="text-xs text-slate-400">followers</div>
                    </div>
                  </div>
                  {kol.bio && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{kol.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {kol.platforms?.map(p => (
                      <span key={p} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {kol.categories?.slice(0, 3).map(c => (
                      <span key={c} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                  {kol.rate_range && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">💰 {kol.rate_range}</div>
                  )}
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
                <h2 className="font-black text-slate-900">KOL Application</h2>
                <p className="text-sm text-slate-500 mt-0.5">We review applications within 3 business days</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
            </div>

            {submitted ? (
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-4">🌟</div>
                <h3 className="font-black text-slate-900 text-xl mb-2">Application Submitted!</h3>
                <p className="text-slate-500 text-sm">Our team will review your profile and contact you within 3 business days.</p>
                <button onClick={() => setShowForm(false)}
                  className="mt-6 bg-purple-600 text-white font-bold px-6 py-3 rounded-xl">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Your Name *</label>
                    <input required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Handle / Username</label>
                    <input value={form.handle}
                      onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
                      placeholder="@yourhandle"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                    <input required type="email" value={form.contact_email}
                      onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                      placeholder="jane@example.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                    <input value={form.contact_phone}
                      onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                      placeholder="+852 9000 0000"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Your Platforms *</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PLATFORMS.map(p => (
                      <button key={p} type="button"
                        onClick={() => togglePlatform(p)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          form.platforms.includes(p)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                        }`}>{p}</button>
                    ))}
                  </div>
                  {/* Follower counts per platform */}
                  {form.platforms.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500">Follower counts</div>
                      <div className="grid grid-cols-2 gap-2">
                        {form.platforms.map(p => (
                          <div key={p} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-24 flex-shrink-0">{p}</span>
                            <input
                              type="number" min="0"
                              value={form.follower_counts[p] || ''}
                              onChange={e => setForm(f => ({ ...f, follower_counts: { ...f.follower_counts, [p]: e.target.value } }))}
                              placeholder="0"
                              className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Content Categories *</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button"
                        onClick={() => setForm(f => ({ ...f, categories: toggleArr(f.categories, cat) }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          form.categories.includes(cat)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Rate Range</label>
                  <select value={form.rate_range}
                    onChange={e => setForm(f => ({ ...f, rate_range: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400">
                    <option value="">Select…</option>
                    {RATE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Bio / About You</label>
                  <textarea value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell us about your content style, audience, and why you'd be a great event partner…"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-purple-400" />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
                  {submitting ? 'Submitting…' : 'Submit Application →'}
                </button>
                <p className="text-xs text-slate-400 text-center">Reviewed within 3 business days</p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
