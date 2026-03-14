'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

function token() { return typeof window !== 'undefined' ? localStorage.getItem('ef_token') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }; }

const EVENT_CATEGORIES = [
  'Conference', 'Workshop', 'Networking', 'Concert', 'Exhibition',
  'Seminar', 'Hackathon', 'Charity', 'Sports', 'Community', 'Other',
];

interface Tier {
  name: string;
  description: string;
  capacity: string;
  price: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    banner_url: '',
    location: '',
    address: '',
    start_at: '',
    end_at: '',
    timezone: 'Asia/Hong_Kong',
    checkin_pin: '',
    is_public: true,
    category: '',
  });

  const [tiers, setTiers] = useState<Tier[]>([
    { name: 'General Admission', description: '', capacity: '', price: '0' },
  ]);

  function setField(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setTierField(i: number, key: keyof Tier, value: string) {
    setTiers((t) => t.map((tier, idx) => idx === i ? { ...tier, [key]: value } : tier));
  }

  function addTier() {
    setTiers((t) => [...t, { name: '', description: '', capacity: '', price: '0' }]);
  }

  function removeTier(i: number) {
    if (tiers.length === 1) return;
    setTiers((t) => t.filter((_, idx) => idx !== i));
  }

  async function generateDescription() {
    if (!form.title) return;
    setAiLoading(true);
    try {
      const r = await fetch(`${API}/api/eventflow/ai/describe`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title,
          location: form.location,
          category: form.category,
          start_at: form.start_at,
        }),
      });
      const data = await r.json();
      if (data.text) setField('description', data.text);
    } catch {}
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);

    try {
      const payload = {
        ...form,
        category: form.category || null,
        tiers: tiers.map((t) => ({
          name: t.name,
          description: t.description || null,
          capacity: t.capacity ? parseInt(t.capacity) : null,
          price: parseFloat(t.price) || 0,
        })),
      };

      const res = await fetch(`${API}/api/eventflow/events`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create event'); setSaving(false); return; }

      router.push(`/eventflow/organizer/events/${data.event.id}`);
    } catch {
      setError('Connection error');
      setSaving(false);
    }
  }

  const TIMEZONES = [
    'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Singapore', 'Asia/Bangkok',
    'Asia/Kuala_Lumpur', 'Asia/Jakarta', 'Asia/Tokyo', 'UTC',
  ];

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/eventflow/organizer/events" className="text-slate-500 hover:text-slate-300 transition-colors">
          ← Events
        </Link>
        <span className="text-slate-700">/</span>
        <h1 className="text-2xl font-black">New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Basic Info</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Event Title *</label>
            <input type="text" required placeholder="e.g. TEDxXinyi 2025" value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setField('category', e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors">
              <option value="">— No category —</option>
              {EVENT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Public / Private toggle */}
          <div className="flex items-center justify-between bg-slate-900/40 border border-white/[0.06] rounded-xl p-4">
            <div>
              <div className="text-sm font-semibold text-white">
                {form.is_public ? '🌐 Public Event' : '🔒 Private Event'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {form.is_public
                  ? 'Visible in the public event listing'
                  : 'Hidden from listing — only accessible via direct link'}
              </div>
            </div>
            <button type="button"
              onClick={() => setField('is_public', !form.is_public)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_public ? 'bg-amber-500' : 'bg-slate-700'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_public ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Description with AI assist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
              <button type="button"
                onClick={generateDescription}
                disabled={aiLoading || !form.title}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 disabled:opacity-40 transition-colors">
                {aiLoading ? (
                  <><span className="w-3 h-3 border border-violet-300/50 border-t-violet-300 rounded-full animate-spin" />Generating…</>
                ) : (
                  <>✨ AI Generate</>
                )}
              </button>
            </div>
            <textarea rows={5} placeholder="Tell attendees about your event… or use AI to generate one above." value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Banner Image URL</label>
            <input type="url" placeholder="https://…" value={form.banner_url}
              onChange={(e) => setField('banner_url', e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
          </div>
        </section>

        {/* Date & Location */}
        <section className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Date & Location</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Start *</label>
              <input type="datetime-local" required value={form.start_at}
                onChange={(e) => setField('start_at', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">End</label>
              <input type="datetime-local" value={form.end_at}
                onChange={(e) => setField('end_at', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Timezone</label>
            <select value={form.timezone} onChange={(e) => setField('timezone', e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Venue Name</label>
            <input type="text" placeholder="e.g. Xinyi Hall" value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Address</label>
            <input type="text" placeholder="e.g. No. 1, Xinyi Road, Taipei 110" value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
          </div>
        </section>

        {/* Ticket Tiers */}
        <section className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Ticket Tiers</h2>
            <button type="button" onClick={addTier}
              className="text-amber-400 hover:text-amber-300 text-xs font-semibold transition-colors">
              + Add Tier
            </button>
          </div>

          {tiers.map((tier, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tier {i + 1}</span>
                {tiers.length > 1 && (
                  <button type="button" onClick={() => removeTier(i)}
                    className="text-slate-600 hover:text-red-400 text-xs transition-colors">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Name *</label>
                  <input type="text" required placeholder="General Admission" value={tier.name}
                    onChange={(e) => setTierField(i, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Price (HKD / 0 = free)</label>
                  <input type="number" min="0" step="0.01" placeholder="0" value={tier.price}
                    onChange={(e) => setTierField(i, 'price', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Capacity (blank = unlimited)</label>
                  <input type="number" min="1" placeholder="∞" value={tier.capacity}
                    onChange={(e) => setTierField(i, 'capacity', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Description</label>
                  <input type="text" placeholder="Optional" value={tier.description}
                    onChange={(e) => setTierField(i, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Check-in PIN */}
        <section className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Check-in Settings</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Check-in PIN (4–8 digits)
            </label>
            <input type="text" placeholder="e.g. 2025" value={form.checkin_pin}
              pattern="[0-9]{4,8}" maxLength={8}
              onChange={(e) => setField('checkin_pin', e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500/50 transition-colors" />
            <p className="text-xs text-slate-600 mt-1.5">Staff use this PIN to access the check-in kiosk.</p>
          </div>
        </section>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-8 py-3 rounded-xl transition-colors">
            {saving ? 'Creating…' : 'Create Event'}
          </button>
          <Link href="/eventflow/organizer/events"
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
