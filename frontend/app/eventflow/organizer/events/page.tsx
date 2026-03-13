'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface Event {
  id: number;
  slug: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string;
  status: string;
  tiers: { name: string; sold: number; capacity: number | null }[];
  stats: { total: number; checked_in: number };
}

function token() { return typeof window !== 'undefined' ? localStorage.getItem('ef_token') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }; }

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-500/15 text-green-400',
  draft:     'bg-slate-700 text-slate-400',
  ended:     'bg-slate-800 text-slate-600',
  cancelled: 'bg-red-500/15 text-red-400',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch(`${API}/api/eventflow/events`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(({ events }) => { setEvents(events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = events.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Events</h1>
          <p className="text-slate-500 text-sm mt-1">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/eventflow/organizer/events/new"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          + New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search events…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'published', 'draft', 'ended'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === s ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {s === 'all' ? `All (${events.length})` : `${s} (${counts[s] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5 animate-pulse">
              <div className="h-5 bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-700/50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-16 text-center">
          <div className="text-4xl mb-3">🎟</div>
          <p className="text-slate-400 font-medium mb-2">{search || statusFilter !== 'all' ? 'No events match your filters' : 'No events yet'}</p>
          {!search && statusFilter === 'all' && (
            <Link href="/eventflow/organizer/events/new" className="text-amber-400 text-sm hover:underline">Create your first event →</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => (
            <div key={ev.id} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-sm truncate">{ev.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[ev.status] || STATUS_STYLES.cancelled}`}>
                      {ev.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      {new Date(ev.start_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {ev.location && <span>📍 {ev.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-lg font-black text-blue-400">{ev.stats?.total || 0}</div>
                    <div className="text-xs text-slate-600">registered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-green-400">{ev.stats?.checked_in || 0}</div>
                    <div className="text-xs text-slate-600">checked in</div>
                  </div>
                  <Link href={`/eventflow/organizer/events/${ev.id}`}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                    Manage →
                  </Link>
                </div>
              </div>
              {ev.tiers && ev.tiers.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                  {ev.tiers.map((tier, i) => (
                    <span key={i} className="text-xs text-slate-500 bg-slate-700/50 px-2.5 py-1 rounded-full">
                      {tier.name}: {tier.sold}{tier.capacity ? `/${tier.capacity}` : ''} sold
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
