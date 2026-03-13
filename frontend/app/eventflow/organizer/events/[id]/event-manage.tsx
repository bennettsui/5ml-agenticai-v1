'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

function token() { return typeof window !== 'undefined' ? localStorage.getItem('ef_token') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }; }

interface Event {
  id: number; slug: string; title: string; description: string; banner_url: string;
  location: string; address: string; start_at: string; end_at: string; timezone: string;
  status: string; checkin_pin: string;
}
interface Tier { id: number; name: string; description: string; capacity: number | null; sold: number; price: number; is_active: boolean; }
interface Stats { total: number; checked_in: number; }
interface Attendee {
  id: number; first_name: string; last_name: string; email: string; organization: string;
  phone: string; tier_name: string; checked_in: boolean; checked_in_at: string | null;
  registration_code: string; created_at: string;
}
interface NotifLog {
  id: number; type: string; channel: string; status: string; sent_at: string | null; created_at: string;
  first_name: string; last_name: string; email: string;
}

type Tab = 'overview' | 'attendees' | 'checkin' | 'notifications' | 'settings';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-500/15 text-green-400',
  draft:     'bg-slate-700 text-slate-400',
  ended:     'bg-slate-800 text-slate-600',
  cancelled: 'bg-red-500/15 text-red-400',
};

export default function EventManagePage({ id }: { id: string }) {
  const router = useRouter();
  const eventId = id;

  const [tab, setTab] = useState<Tab>('overview');
  const [event, setEvent] = useState<Event | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, checked_in: 0 });
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [notifLog, setNotifLog] = useState<NotifLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [blastSubject, setBlastSubject] = useState('');
  const [blastBody, setBlastBody] = useState('');
  const [blastSending, setBlastSending] = useState(false);
  const [blastMsg, setBlastMsg] = useState('');
  const [settingsForm, setSettingsForm] = useState<Partial<Event>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (tab === 'attendees') loadAttendees();
    if (tab === 'notifications') loadNotifLog();
  }, [tab]);

  // SSE for live stats
  useEffect(() => {
    if (!event) return;
    const es = new EventSource(`${API}/api/eventflow/events/${eventId}/stream?token=${token()}`);
    sseRef.current = es;
    es.addEventListener('stats_update', (e) => {
      try { const d = JSON.parse((e as MessageEvent).data); setStats(d); } catch {}
    });
    es.addEventListener('attendee_registered', () => {
      setStats((s) => ({ ...s, total: s.total + 1 }));
    });
    es.addEventListener('attendee_checkedin', () => {
      setStats((s) => ({ ...s, checked_in: s.checked_in + 1 }));
    });
    return () => { es.close(); };
  }, [event?.id]);

  async function loadEvent() {
    try {
      const r = await fetch(`${API}/api/eventflow/events/${eventId}`, { headers: authHeaders() });
      const data = await r.json();
      setEvent(data.event);
      setTiers(data.tiers || []);
      setStats(data.stats || { total: 0, checked_in: 0 });
      setSettingsForm(data.event);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendees() {
    const r = await fetch(`${API}/api/eventflow/events/${eventId}/attendees`, { headers: authHeaders() });
    const data = await r.json();
    setAttendees(data.attendees || []);
  }

  async function loadNotifLog() {
    const r = await fetch(`${API}/api/eventflow/notifications/log/${eventId}`, { headers: authHeaders() });
    const data = await r.json();
    setNotifLog(data.log || []);
  }

  async function publish() {
    setPublishing(true);
    const r = await fetch(`${API}/api/eventflow/events/${eventId}/publish`, { method: 'POST', headers: authHeaders() });
    if (r.ok) { await loadEvent(); }
    setPublishing(false);
  }

  async function manualCheckin(attendeeId: number) {
    const r = await fetch(`${API}/api/eventflow/events/${eventId}/attendees/${attendeeId}/checkin`, {
      method: 'POST', headers: authHeaders(),
    });
    if (r.ok) { loadAttendees(); }
  }

  async function sendBlast() {
    if (!blastSubject || !blastBody) return;
    setBlastSending(true); setBlastMsg('');
    const r = await fetch(`${API}/api/eventflow/notifications/blast/${eventId}`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ subject: blastSubject, html: blastBody }),
    });
    const data = await r.json();
    setBlastMsg(r.ok ? `Sent to ${data.sent} attendees` : data.error || 'Failed');
    setBlastSending(false);
  }

  async function saveSettings() {
    setSettingsSaving(true); setSettingsMsg('');
    const r = await fetch(`${API}/api/eventflow/events/${eventId}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify(settingsForm),
    });
    const data = await r.json();
    if (r.ok) { setEvent(data.event); setSettingsMsg('Saved'); }
    else { setSettingsMsg(data.error || 'Failed to save'); }
    setSettingsSaving(false);
  }

  const filteredAttendees = attendees.filter((a) =>
    !attendeeSearch || `${a.first_name} ${a.last_name} ${a.email} ${a.organization}`.toLowerCase().includes(attendeeSearch.toLowerCase())
  );

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="p-8 text-center text-slate-500">Event not found</div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'attendees', label: `Attendees (${stats.total})` },
    { key: 'checkin', label: 'Check-in' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/eventflow/organizer/events" className="hover:text-slate-300 transition-colors">Events</Link>
          <span>/</span>
          <span className="text-slate-300">{event.title}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black">{event.title}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[event.status] || STATUS_STYLES.cancelled}`}>
                {event.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {new Date(event.start_at).toLocaleDateString('en-HK', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/eventflow/${event.slug}`} target="_blank"
              className="text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              View Page ↗
            </Link>
            {event.status === 'draft' && (
              <button onClick={publish} disabled={publishing}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition-colors">
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] mb-6">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${
              tab === key
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Live stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Registered', value: stats.total, color: 'text-blue-400' },
              { label: 'Checked In', value: stats.checked_in, color: 'text-green-400' },
              { label: 'Attendance Rate', value: stats.total ? `${Math.round(stats.checked_in / stats.total * 100)}%` : '—', color: 'text-amber-400' },
              { label: 'Remaining', value: stats.total - stats.checked_in, color: 'text-slate-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5">
                <div className={`text-3xl font-black ${color}`}>{value}</div>
                <div className="text-slate-500 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Tiers */}
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="font-bold text-sm">Ticket Tiers</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left px-6 py-3">Tier</th>
                  <th className="text-left px-6 py-3">Price</th>
                  <th className="text-center px-6 py-3">Sold</th>
                  <th className="text-center px-6 py-3">Capacity</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => {
                  const pct = tier.capacity ? Math.min(100, Math.round(tier.sold / tier.capacity * 100)) : null;
                  return (
                    <tr key={tier.id} className="border-b border-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{tier.name}</div>
                        {tier.description && <div className="text-xs text-slate-500 mt-0.5">{tier.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {tier.price === 0 ? <span className="text-green-400 font-semibold">Free</span> : `HKD ${tier.price}`}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-400">{tier.sold}</td>
                      <td className="px-6 py-4 text-center">
                        {tier.capacity ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{tier.capacity}</span>
                          </div>
                        ) : <span className="text-slate-600 text-sm">∞</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tier.is_active ? 'text-green-400' : 'text-slate-600'}`}>
                          {tier.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Event detail */}
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm mb-4">Event Details</h3>
            {[
              { label: 'Slug', value: event.slug },
              { label: 'Location', value: event.location || '—' },
              { label: 'Address', value: event.address || '—' },
              { label: 'Timezone', value: event.timezone },
              { label: 'End Date', value: event.end_at ? new Date(event.end_at).toLocaleString('en-HK') : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="text-slate-500 w-24 flex-shrink-0">{label}</span>
                <span className="text-slate-300">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendees */}
      {tab === 'attendees' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search attendees…" value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <span className="text-slate-500 text-sm">{filteredAttendees.length} attendees</span>
          </div>

          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            {attendees.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No attendees yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Name</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Org</th>
                    <th className="text-left px-6 py-3">Tier</th>
                    <th className="text-center px-6 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map((a) => (
                    <tr key={a.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{a.first_name} {a.last_name}</div>
                        <div className="text-xs text-slate-600 font-mono">{a.registration_code}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{a.email}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{a.organization || '—'}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{a.tier_name}</td>
                      <td className="px-6 py-4 text-center">
                        {a.checked_in ? (
                          <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">✓ In</span>
                        ) : (
                          <span className="text-xs text-slate-600">Registered</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!a.checked_in && (
                          <button onClick={() => manualCheckin(a.id)}
                            className="text-amber-400 hover:underline text-xs">Check in</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Check-in */}
      {tab === 'checkin' && (
        <div className="space-y-6 max-w-lg">
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-sm">Kiosk Access</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Check-in PIN</label>
              <div className="flex items-center gap-3">
                <div className="bg-slate-900/60 border border-white/[0.08] rounded-xl px-5 py-3 font-mono text-2xl font-black tracking-[0.3em] text-amber-400">
                  {event.checkin_pin || '—'}
                </div>
                <p className="text-xs text-slate-500">Share with check-in staff only</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Kiosk URL</label>
              <div className="bg-slate-900/60 border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-sm text-slate-300 break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/eventflow/checkin?event=${eventId}` : ''}
              </div>
            </div>
            <a href={`/eventflow/checkin?event=${eventId}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Open Kiosk ↗
            </a>
          </div>

          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-4">Live Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-blue-400">{stats.total}</div>
                <div className="text-xs text-slate-500 mt-1">Registered</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-green-400">{stats.checked_in}</div>
                <div className="text-xs text-slate-500 mt-1">Checked In</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3 text-center">Updates in real-time via SSE</p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div className="space-y-6">
          {/* Blast email */}
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm">Send Email Blast</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Subject</label>
              <input type="text" placeholder="Your event update…" value={blastSubject}
                onChange={(e) => setBlastSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">HTML Body</label>
              <textarea rows={6} placeholder="<p>Hello…</p>" value={blastBody}
                onChange={(e) => setBlastBody(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-colors resize-none" />
            </div>
            {blastMsg && <p className={`text-sm ${blastMsg.startsWith('Sent') ? 'text-green-400' : 'text-red-400'}`}>{blastMsg}</p>}
            <button onClick={sendBlast} disabled={blastSending || !blastSubject || !blastBody}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              {blastSending ? 'Sending…' : `Send to All Registered (${stats.total})`}
            </button>
          </div>

          {/* Notification log */}
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="font-bold text-sm">Notification Log</h3>
              <button onClick={loadNotifLog} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Refresh</button>
            </div>
            {notifLog.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No notifications sent yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Attendee</th>
                    <th className="text-left px-6 py-3">Type</th>
                    <th className="text-left px-6 py-3">Channel</th>
                    <th className="text-center px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {notifLog.map((n) => (
                    <tr key={n.id} className="border-b border-slate-700/50">
                      <td className="px-6 py-3 text-sm">{n.first_name} {n.last_name}</td>
                      <td className="px-6 py-3 text-xs text-slate-400 font-mono">{n.type}</td>
                      <td className="px-6 py-3 text-xs text-slate-400">{n.channel}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          n.status === 'sent' ? 'bg-green-500/15 text-green-400' :
                          n.status === 'failed' ? 'bg-red-500/15 text-red-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>{n.status}</span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {n.sent_at ? new Date(n.sent_at).toLocaleString('en-HK') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="max-w-xl space-y-6">
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-sm">Edit Event</h3>
            {[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'location', label: 'Venue', type: 'text' },
              { key: 'address', label: 'Address', type: 'text' },
              { key: 'banner_url', label: 'Banner URL', type: 'url' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                <input type={type} value={(settingsForm as any)[key] || ''}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
              <textarea rows={4} value={settingsForm.description || ''}
                onChange={(e) => setSettingsForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Check-in PIN</label>
              <input type="text" value={settingsForm.checkin_pin || ''}
                pattern="[0-9]{4,8}" maxLength={8}
                onChange={(e) => setSettingsForm((f) => ({ ...f, checkin_pin: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            {settingsMsg && <p className={`text-sm ${settingsMsg === 'Saved' ? 'text-green-400' : 'text-red-400'}`}>{settingsMsg}</p>}
            <button onClick={saveSettings} disabled={settingsSaving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              {settingsSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <h3 className="font-bold text-sm text-red-400 mb-3">Danger Zone</h3>
            <p className="text-xs text-slate-500 mb-3">Once cancelled, this cannot be undone. All attendees will be notified.</p>
            <button disabled className="text-xs text-red-500/50 border border-red-500/20 px-4 py-2 rounded-lg cursor-not-allowed">
              Cancel Event (coming soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
