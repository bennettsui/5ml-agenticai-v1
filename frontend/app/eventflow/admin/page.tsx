'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  organizers: number; events: number; attendees: number;
  checkins: number; contacts: number;
}
interface ByStatus { status: string; count: number; }
interface RecentEvent { title: string; start_at: string; status: string; organizer_name: string; registered: number; }
interface Organizer {
  id: number; name: string; email: string; plan: string;
  event_count: number; attendee_count: number; created_at: string;
}
interface Event {
  id: number; slug: string; title: string; status: string; is_public: boolean; category: string | null;
  start_at: string; organizer_name: string; organizer_email: string; registered: number; checked_in: number;
}
interface NotifSummary { type: string; channel: string; status: string; count: number; }
interface WishlistItem {
  id: number; title: string; description: string | null;
  category: string; status: string; votes: number;
  author_name: string | null; author_type: string; created_at: string;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:         { label: 'Free',          color: 'text-slate-400 bg-slate-700' },
  pro:          { label: 'Pro',           color: 'text-blue-400 bg-blue-500/15' },
  explab_staff: { label: 'ExpLab Staff',  color: 'text-amber-400 bg-amber-500/15' },
};

const STATUS_COLORS: Record<string, string> = {
  published: 'text-green-400 bg-green-500/15',
  draft:     'text-slate-400 bg-slate-700',
  ended:     'text-slate-500 bg-slate-800',
  cancelled: 'text-red-400 bg-red-500/15',
};

const WISHLIST_STATUS_COLORS: Record<string, string> = {
  open:     'text-blue-400 bg-blue-500/15',
  planned:  'text-amber-400 bg-amber-500/15',
  done:     'text-green-400 bg-green-500/15',
  declined: 'text-slate-500 bg-slate-700',
};

type Tab = 'overview' | 'organizers' | 'events' | 'notifications' | 'wishlist';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats]           = useState<Stats | null>(null);
  const [byStatus, setByStatus]     = useState<ByStatus[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents]         = useState<Event[]>([]);
  const [notifSummary, setNotifSummary] = useState<NotifSummary[]>([]);
  const [wishlist, setWishlist]     = useState<WishlistItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [planUpdating, setPlanUpdating]             = useState<number | null>(null);
  const [eventStatusUpdating, setEventStatusUpdating] = useState<number | null>(null);
  const [wishlistUpdating, setWishlistUpdating]     = useState<number | null>(null);

  function headers() { return { 'x-admin-secret': secret }; }

  async function login() {
    setAuthErr('');
    try {
      const r = await fetch(`${API}/api/eventflow/admin/stats`, { headers: headers() });
      if (!r.ok) { setAuthErr('Invalid secret'); return; }
      const data = await r.json();
      setStats(data.stats);
      setByStatus(data.byStatus || []);
      setRecentEvents(data.recentEvents || []);
      setAuthed(true);
    } catch { setAuthErr('Connection error'); }
  }

  async function loadOrganizers() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/organizers`, { headers: headers() });
    const data = await r.json();
    setOrganizers(data.organizers || []);
    setLoading(false);
  }

  async function loadEvents() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/events`, { headers: headers() });
    const data = await r.json();
    setEvents(data.events || []);
    setLoading(false);
  }

  async function loadNotifications() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/notifications`, { headers: headers() });
    const data = await r.json();
    setNotifSummary(data.summary || []);
    setLoading(false);
  }

  async function loadWishlist() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/wishlist?limit=100`, { headers: headers() });
    const data = await r.json();
    setWishlist(data.items || []);
    setLoading(false);
  }

  async function updatePlan(orgId: number, plan: string) {
    setPlanUpdating(orgId);
    await fetch(`${API}/api/eventflow/admin/organizers/${orgId}`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    await loadOrganizers();
    setPlanUpdating(null);
  }

  async function updateEventStatus(eventId: number, status: string) {
    setEventStatusUpdating(eventId);
    await fetch(`${API}/api/eventflow/admin/events/${eventId}/status`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadEvents();
    setEventStatusUpdating(null);
  }

  async function updateWishlistStatus(itemId: number, status: string) {
    setWishlistUpdating(itemId);
    await fetch(`${API}/api/eventflow/wishlist/${itemId}`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadWishlist();
    setWishlistUpdating(null);
  }

  useEffect(() => {
    if (!authed) return;
    if (tab === 'organizers') loadOrganizers();
    if (tab === 'events')     loadEvents();
    if (tab === 'notifications') loadNotifications();
    if (tab === 'wishlist')   loadWishlist();
  }, [tab, authed]);

  // ─── Login gate ─────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-black">EventFlow Admin</h1>
          <p className="text-slate-500 text-sm mt-1">ExpLab internal panel</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <input
            type="password" placeholder="Admin secret"
            value={secret} onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full px-4 py-3 bg-slate-800/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          {authErr && <p className="text-red-400 text-sm text-center">{authErr}</p>}
          <button onClick={login}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-colors">
            Enter →
          </button>
          <p className="text-center text-xs text-slate-600">
            <Link href="/eventflow" className="hover:text-slate-400 transition-colors">← Back to EventFlow</Link>
          </p>
        </div>
      </div>
    );
  }

  // ─── Admin Panel ─────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',      label: 'Overview' },
    { key: 'organizers',    label: `Organizers (${stats?.organizers ?? '…'})` },
    { key: 'events',        label: `Events (${stats?.events ?? '…'})` },
    { key: 'notifications', label: 'Notifications' },
    { key: 'wishlist',      label: '💡 Wishlist' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/eventflow" className="text-slate-500 hover:text-white transition-colors text-sm">🎟 EventFlow</Link>
            <span className="text-slate-700">/</span>
            <span className="font-bold text-sm">Admin</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">ExpLab Staff</span>
          </div>
          <button onClick={() => setAuthed(false)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Lock →
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.06] mb-8 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 whitespace-nowrap ${
                tab === key ? 'text-amber-400 border-amber-400' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Organizers', value: stats.organizers, color: 'text-blue-400', icon: '👤' },
                { label: 'Events',     value: stats.events,     color: 'text-amber-400', icon: '🎟' },
                { label: 'Registered', value: stats.attendees,  color: 'text-purple-400', icon: '📋' },
                { label: 'Checked In', value: stats.checkins,   color: 'text-green-400', icon: '✓' },
                { label: 'Contacts',   value: stats.contacts,   color: 'text-cyan-400', icon: '📇' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5">
                  <div className="text-xl mb-2">{icon}</div>
                  <div className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</div>
                  <div className="text-slate-500 text-sm mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* By Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-4 text-slate-400 uppercase tracking-wider">Events by Status</h3>
                <div className="space-y-3">
                  {byStatus.map(({ status, count }) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.cancelled}`}>{status}</span>
                      <span className="font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-4 text-slate-400 uppercase tracking-wider">Recent Events</h3>
                <div className="space-y-3">
                  {recentEvents.map((e, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{e.title}</div>
                        <div className="text-xs text-slate-500">{e.organizer_name}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold text-blue-400">{e.registered}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status] || STATUS_COLORS.cancelled}`}>{e.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Check-in rate */}
            {stats.attendees > 0 && (
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-3 text-slate-400 uppercase tracking-wider">Platform Check-in Rate</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-green-400 rounded-full transition-all"
                      style={{ width: `${Math.round(stats.checkins / stats.attendees * 100)}%` }} />
                  </div>
                  <span className="font-black text-green-400 text-lg">
                    {Math.round(stats.checkins / stats.attendees * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{stats.checkins} checked in out of {stats.attendees} registered</p>
              </div>
            )}
          </div>
        )}

        {/* Organizers */}
        {tab === 'organizers' && (
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Organizer</th>
                    <th className="text-left px-6 py-3">Plan</th>
                    <th className="text-center px-6 py-3">Events</th>
                    <th className="text-center px-6 py-3">Attendees</th>
                    <th className="text-left px-6 py-3">Joined</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((org) => {
                    const planInfo = PLAN_LABELS[org.plan] || PLAN_LABELS.free;
                    return (
                      <tr key={org.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm">{org.name}</div>
                          <div className="text-xs text-slate-500">{org.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planInfo.color}`}>{planInfo.label}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-amber-400">{org.event_count}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-400">{org.attendee_count}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(org.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={org.plan}
                            disabled={planUpdating === org.id}
                            onChange={(e) => updatePlan(org.id, e.target.value)}
                            className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="explab_staff">ExpLab Staff</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Events */}
        {tab === 'events' && (
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Event</th>
                    <th className="text-left px-6 py-3">Organizer</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-center px-6 py-3">Registered</th>
                    <th className="text-center px-6 py-3">Check-ins</th>
                    <th className="text-left px-6 py-3">Visibility</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{ev.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="text-xs text-slate-600 font-mono">{ev.slug}</div>
                          {ev.category && (
                            <span className="text-xs text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">{ev.category}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        <div>{ev.organizer_name}</div>
                        <div className="text-xs text-slate-600">{ev.organizer_email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(ev.start_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-400">{ev.registered}</td>
                      <td className="px-6 py-4 text-center font-bold text-green-400">{ev.checked_in}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ev.is_public ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {ev.is_public ? '🌐 Public' : '🔒 Private'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[ev.status] || STATUS_COLORS.cancelled}`}>{ev.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/eventflow/${ev.slug}`} target="_blank"
                            className="text-xs text-amber-400 hover:underline">View</Link>
                          <select
                            value={ev.status}
                            disabled={eventStatusUpdating === ev.id}
                            onChange={(e) => updateEventStatus(ev.id, e.target.value)}
                            className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                            <option value="ended">ended</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : (
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                  <h3 className="font-bold text-sm">Notification Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">All scheduled notifications across all events</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left px-6 py-3">Type</th>
                      <th className="text-left px-6 py-3">Channel</th>
                      <th className="text-left px-6 py-3">Status</th>
                      <th className="text-center px-6 py-3">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifSummary.map((n, i) => (
                      <tr key={i} className="border-b border-slate-700/50">
                        <td className="px-6 py-3 text-sm font-mono text-slate-300">{n.type}</td>
                        <td className="px-6 py-3 text-sm text-slate-400">{n.channel}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            n.status === 'sent'    ? 'bg-green-500/15 text-green-400' :
                            n.status === 'failed'  ? 'bg-red-500/15 text-red-400' :
                            n.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>{n.status}</span>
                        </td>
                        <td className="px-6 py-3 text-center font-bold text-white">{n.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Wishlist */}
        {tab === 'wishlist' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : wishlist.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="text-4xl mb-3">💡</div>
                <p>No wishlist items yet.</p>
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left px-6 py-3">Idea</th>
                      <th className="text-left px-6 py-3">Category</th>
                      <th className="text-center px-6 py-3">Votes</th>
                      <th className="text-left px-6 py-3">Author</th>
                      <th className="text-left px-6 py-3">Date</th>
                      <th className="text-left px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlist.map((item) => (
                      <tr key={item.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-semibold text-sm">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">{item.category}</td>
                        <td className="px-6 py-4 text-center font-bold text-amber-400">{item.votes}</td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          <div>{item.author_name || 'Anonymous'}</div>
                          <div className="text-slate-600">{item.author_type}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.status}
                            disabled={wishlistUpdating === item.id}
                            onChange={(e) => updateWishlistStatus(item.id, e.target.value)}
                            className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                            <option value="open">open</option>
                            <option value="planned">planned</option>
                            <option value="done">done</option>
                            <option value="declined">declined</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
