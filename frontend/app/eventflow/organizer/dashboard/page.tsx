'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface Event { id: number; slug: string; title: string; start_at: string; status: string; tiers: { sold: number }[]; stats: { total: number; checked_in: number }; }

function token() { return typeof window !== 'undefined' ? localStorage.getItem('ef_token') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }; }

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState<{ name: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/eventflow/organizer/me`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/api/eventflow/events`, { headers: authHeaders() }).then((r) => r.json()),
    ]).then(([me, ev]) => {
      setOrganizer(me.organizer);
      setEvents(ev.events || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const upcoming = events.filter((e) => e.status === 'published' && new Date(e.start_at) > new Date());
  const totalContacts = events.reduce((s, e) => s + (e.stats?.total || 0), 0);
  const totalCheckins = events.reduce((s, e) => s + (e.stats?.checked_in || 0), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          {organizer && <p className="text-slate-500 text-sm mt-1">Welcome back, {organizer.name}</p>}
        </div>
        <Link href="/eventflow/organizer/events/new"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          + New Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Events', value: events.length, icon: '🎟', color: 'text-amber-400' },
          { label: 'Total Contacts', value: totalContacts, icon: '👥', color: 'text-blue-400' },
          { label: 'Total Check-ins', value: totalCheckins, icon: '✓', color: 'text-green-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5">
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`text-3xl font-black ${color}`}>{loading ? '—' : value}</div>
            <div className="text-slate-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Events table */}
      <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="font-bold">Your Events</h2>
          <Link href="/eventflow/organizer/events" className="text-amber-400 text-sm hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🎟</div>
            <p className="text-slate-400 font-medium mb-2">No events yet</p>
            <Link href="/eventflow/organizer/events/new" className="text-amber-400 text-sm hover:underline">Create your first event →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left px-6 py-3">Event</th>
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-center px-6 py-3">Registered</th>
                <th className="text-center px-6 py-3">Checked In</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm">{ev.title}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(ev.start_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-blue-400">{ev.stats?.total || 0}</td>
                  <td className="px-6 py-4 text-center font-bold text-green-400">{ev.stats?.checked_in || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      ev.status === 'published' ? 'bg-green-500/15 text-green-400' :
                      ev.status === 'draft'     ? 'bg-slate-700 text-slate-400' :
                      ev.status === 'ended'     ? 'bg-slate-800 text-slate-600' :
                      'bg-red-500/15 text-red-400'
                    }`}>{ev.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/eventflow/organizer/events/${ev.id}`}
                      className="text-amber-400 hover:underline text-sm">Manage →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
