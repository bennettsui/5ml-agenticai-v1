'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const CATEGORIES = ['feature', 'ux', 'integration', 'ai', 'general'] as const;
const STATUSES   = ['open', 'planned', 'done', 'declined'] as const;

type Category = typeof CATEGORIES[number];
type Status   = typeof STATUSES[number];

interface WishlistItem {
  id: number;
  title: string;
  description: string | null;
  category: Category;
  status: Status;
  votes: number;
  author_name: string | null;
  author_type: 'organizer' | 'participant';
  created_at: string;
}

const STATUS_STYLES: Record<Status, string> = {
  open:     'bg-blue-500/15 text-blue-400',
  planned:  'bg-amber-500/15 text-amber-400',
  done:     'bg-green-500/15 text-green-400',
  declined: 'bg-slate-700 text-slate-500',
};

const CATEGORY_ICONS: Record<Category, string> = {
  feature: '🚀', ux: '🎨', integration: '🔗', ai: '✨', general: '💬',
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [voting, setVoting] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    author_name: '',
    author_email: '',
    author_type: 'participant',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  function load() {
    const params = new URLSearchParams();
    if (filterStatus)   params.set('status', filterStatus);
    if (filterCategory) params.set('category', filterCategory);
    const q = params.toString() ? `?${params}` : '';
    fetch(`${API}/api/eventflow/wishlist${q}`)
      .then((r) => r.json())
      .then(({ items }) => { setItems(items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { setLoading(true); load(); }, [filterStatus, filterCategory]);

  async function vote(id: number) {
    setVoting(id);
    const r = await fetch(`${API}/api/eventflow/wishlist/${id}/vote`, { method: 'POST' });
    if (r.ok) {
      const data = await r.json();
      setItems((prev) => prev.map((item) => item.id === id ? data.item : item));
    }
    setVoting(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true); setSubmitMsg('');
    const r = await fetch(`${API}/api/eventflow/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    if (r.ok) {
      setSubmitMsg('✓ Thank you! Your idea has been submitted.');
      setForm({ title: '', description: '', category: 'general', author_name: '', author_email: '', author_type: 'participant' });
      setShowForm(false);
      load();
    } else {
      setSubmitMsg(data.error || 'Failed to submit');
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/eventflow" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">🎟 EventFlow</Link>
            <span className="text-slate-700">/</span>
            <span className="font-bold text-sm">💡 Wishlist</span>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors">
            + Submit Idea
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-3">Feature Wishlist</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Tell us what you need. Vote for ideas you love. We build what matters most to you.
          </p>
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="bg-slate-800/60 border border-amber-500/20 rounded-2xl p-6 mb-8 space-y-4">
            <h2 className="font-bold text-sm text-amber-400 uppercase tracking-wider">Submit Your Idea</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Idea Title *</label>
                <input type="text" required maxLength={200} placeholder="e.g. Export attendees to CSV"
                  value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Details (optional)</label>
                <textarea rows={3} maxLength={1000} placeholder="Describe the feature in more detail…"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">You are a…</label>
                  <select value={form.author_type} onChange={(e) => setForm((f) => ({ ...f, author_type: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors">
                    <option value="participant">Event Participant</option>
                    <option value="organizer">Event Organizer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Your Name (optional)</label>
                  <input type="text" maxLength={100} placeholder="Anonymous" value={form.author_name}
                    onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email (optional)</label>
                  <input type="email" maxLength={254} placeholder="For follow-up" value={form.author_email}
                    onChange={(e) => setForm((f) => ({ ...f, author_email: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
              </div>
              {submitMsg && <p className={`text-sm ${submitMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{submitMsg}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={submitting || !form.title.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                  {submitting ? 'Submitting…' : 'Submit Idea'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors px-4">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {submitMsg && !showForm && submitMsg.startsWith('✓') && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-sm text-center">{submitMsg}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1">
            <button onClick={() => setFilterStatus('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!filterStatus ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/60 text-slate-400 border border-white/[0.08] hover:text-slate-200'}`}>
              All Status
            </button>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/60 text-slate-400 border border-white/[0.08] hover:text-slate-200'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setFilterCategory(filterCategory === c ? '' : c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterCategory === c ? 'bg-violet-500 text-white' : 'bg-slate-800/60 text-slate-400 border border-white/[0.08] hover:text-slate-200'}`}>
                {CATEGORY_ICONS[c]} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-800/40 animate-pulse border border-white/[0.04]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-4">💡</div>
            <p className="font-medium">No ideas yet — be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5 flex items-start gap-4 hover:border-white/[0.12] transition-colors">
                {/* Vote */}
                <button
                  onClick={() => vote(item.id)}
                  disabled={voting === item.id}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all disabled:opacity-50">
                  <span className="text-amber-400 text-lg leading-none">▲</span>
                  <span className="text-white font-black text-lg leading-none">{item.votes}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base font-bold">{item.title}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-600 bg-slate-900/60 px-2 py-0.5 rounded-full">
                      {CATEGORY_ICONS[item.category]} {item.category}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-slate-400 text-sm mb-2 leading-relaxed">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    {item.author_name && <span>by {item.author_name}</span>}
                    <span className="capitalize">{item.author_type}</span>
                    <span>{new Date(item.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
