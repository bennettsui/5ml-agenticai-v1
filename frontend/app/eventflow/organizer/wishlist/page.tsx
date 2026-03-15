'use client';

import { useEffect, useState } from 'react';

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
  open:     'bg-blue-100 text-blue-700',
  planned:  'bg-amber-100 text-amber-700',
  done:     'bg-green-100 text-green-700',
  declined: 'bg-gray-100 text-gray-500',
};

const CATEGORY_ICONS: Record<Category, string> = {
  feature: '🚀', ux: '🎨', integration: '🔗', ai: '✨', general: '💬',
};

export default function OrganizerWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [voting, setVoting] = useState<number | null>(null);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'feature',
    author_name: '',
    author_email: '',
    author_type: 'organizer',
  });

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
      setSubmitMsg('✓ Your idea has been submitted!');
      setForm({ title: '', description: '', category: 'feature', author_name: '', author_email: '', author_type: 'organizer' });
      setShowForm(false);
      load();
    } else {
      setSubmitMsg(data.error || 'Failed to submit');
    }
    setSubmitting(false);
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl">💡</div>
            <div>
              <div className="text-xs font-semibold text-pink-600 uppercase tracking-wider mb-0.5">Platform 5 of 5</div>
              <h1 className="text-2xl font-black text-gray-900">Feature Wishlist</h1>
            </div>
          </div>
          <p className="text-gray-500 text-sm max-w-xl">
            Submit ideas, vote on what matters most, and track the roadmap. Your feedback directly shapes EventFlow.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          + Submit Idea
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-bold text-orange-700 text-sm uppercase tracking-wider">New Idea</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Title *</label>
              <input type="text" required maxLength={200} placeholder="e.g. Export attendees to CSV"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Details (optional)</label>
              <textarea rows={3} maxLength={1000} placeholder="Describe the feature in more detail…"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Your Name (optional)</label>
                <input type="text" maxLength={100} placeholder="Anonymous" value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors" />
              </div>
            </div>
            {submitMsg && <p className={`text-sm ${submitMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{submitMsg}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting || !form.title.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                {submitting ? 'Submitting…' : 'Submit Idea'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-sm transition-colors px-4">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {submitMsg && !showForm && submitMsg.startsWith('✓') && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-green-700 text-sm text-center">{submitMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!filterStatus ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="text-gray-200">|</span>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCategory(filterCategory === c ? '' : c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterCategory === c ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
            {CATEGORY_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">💡</div>
          <p className="font-semibold text-gray-700">No ideas yet — be the first!</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-orange-600 hover:underline font-medium">
            Submit an idea →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 hover:border-orange-200 hover:shadow-sm transition-all">
              {/* Vote */}
              <button
                onClick={() => vote(item.id)}
                disabled={voting === item.id}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all disabled:opacity-50">
                <span className="text-orange-500 text-lg leading-none">▲</span>
                <span className="text-gray-900 font-black text-lg leading-none">{item.votes}</span>
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status]}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {CATEGORY_ICONS[item.category]} {item.category}
                  </span>
                </div>
                {item.description && (
                  <p className="text-gray-500 text-xs mb-2 leading-relaxed">{item.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {item.author_name && <span>by {item.author_name}</span>}
                  <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded-full">{item.author_type}</span>
                  <span>{new Date(item.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status legend */}
      <div className="mt-8 bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Status guide</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { status: 'Open',     color: 'bg-blue-100 text-blue-700',    desc: 'Open for votes' },
            { status: 'Planned',  color: 'bg-amber-100 text-amber-700',  desc: 'On the roadmap' },
            { status: 'Done',     color: 'bg-green-100 text-green-700',  desc: 'Shipped' },
            { status: 'Declined', color: 'bg-gray-100 text-gray-500',    desc: 'Not moving forward' },
          ].map(({ status, color, desc }) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{status}</span>
              <span className="text-gray-400 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
