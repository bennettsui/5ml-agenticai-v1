'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

function token() { return typeof window !== 'undefined' ? localStorage.getItem('ef_token') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }; }

const EVENT_CATEGORIES = [
  'Conference', 'Workshop', 'Networking', 'Concert', 'Exhibition',
  'Seminar', 'Hackathon', 'Charity', 'Sports', 'Community', 'Other',
];

interface Event {
  id: number; slug: string; title: string; description: string; banner_url: string;
  location: string; address: string; start_at: string; end_at: string; timezone: string;
  status: string; checkin_pin: string; is_public: boolean; category: string | null;
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

interface FormField {
  id: number; field_key: string; field_type: string; label: string;
  placeholder: string | null; required: boolean; options: string[] | null; sort_order: number;
}

// Built-in core fields always present (organizer can toggle required)
const CORE_FIELDS = [
  { key: 'first_name', label: 'First Name',    type: 'text',  alwaysRequired: true  },
  { key: 'last_name',  label: 'Last Name',     type: 'text',  alwaysRequired: true  },
  { key: 'email',      label: 'Email Address', type: 'email', alwaysRequired: true  },
  { key: 'phone',      label: 'Phone Number',  type: 'phone', alwaysRequired: false },
  { key: 'organization', label: 'Organization / Company', type: 'text', alwaysRequired: false },
  { key: 'title',      label: 'Job Title',     type: 'text',  alwaysRequired: false },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown (Select)' },
  { value: 'checkbox', label: 'Checkboxes (Multi)' },
];

type Tab = 'overview' | 'attendees' | 'checkin' | 'notifications' | 'ai' | 'form' | 'settings';

type AITool = 'describe' | 'social' | 'agenda' | 'email' | 'banner';

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

  // AI Studio
  const [aiTool, setAiTool] = useState<AITool>('describe');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiBannerStyle, setAiBannerStyle] = useState('');
  const [aiDurationHours, setAiDurationHours] = useState('');

  // RSVP Form Builder
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({ label: '', field_key: '', field_type: 'text', placeholder: '', required: false, options: '' });
  const [fieldSaving, setFieldSaving] = useState(false);

  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (tab === 'attendees') loadAttendees();
    if (tab === 'notifications') loadNotifLog();
    if (tab === 'ai') setAiResult('');
    if (tab === 'form') loadFormFields();
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

  async function loadFormFields() {
    setFormLoading(true);
    const r = await fetch(`${API}/api/eventflow/events/${eventId}/form-fields`, { headers: authHeaders() });
    const data = await r.json();
    setFormFields(data.fields || []);
    setFormLoading(false);
  }

  async function addCustomField() {
    if (!newField.label.trim()) return;
    setFieldSaving(true);
    const key = newField.field_key.trim() || newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const options = ['select', 'checkbox'].includes(newField.field_type)
      ? newField.options.split('\n').map((s) => s.trim()).filter(Boolean)
      : null;
    const r = await fetch(`${API}/api/eventflow/events/${eventId}/form-fields`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...newField, field_key: key, options, sort_order: formFields.length }),
    });
    if (r.ok) {
      const data = await r.json();
      setFormFields((prev) => [...prev, data.field]);
      setNewField({ label: '', field_key: '', field_type: 'text', placeholder: '', required: false, options: '' });
      setShowAddField(false);
    }
    setFieldSaving(false);
  }

  async function deleteCustomField(id: number) {
    await fetch(`${API}/api/eventflow/events/${eventId}/form-fields/${id}`, { method: 'DELETE', headers: authHeaders() });
    setFormFields((prev) => prev.filter((f) => f.id !== id));
  }

  async function toggleFieldRequired(id: number, required: boolean) {
    const r = await fetch(`${API}/api/eventflow/events/${eventId}/form-fields/${id}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ required }),
    });
    if (r.ok) {
      const data = await r.json();
      setFormFields((prev) => prev.map((f) => f.id === id ? data.field : f));
    }
  }

  async function runAI() {
    if (!event) return;
    setAiLoading(true); setAiResult('');
    try {
      const base = { title: event.title, description: event.description, location: event.location, category: event.category, start_at: event.start_at };
      let endpoint = aiTool;
      let body: Record<string, unknown> = { ...base };
      if (aiTool === 'banner') { endpoint = 'banner-prompt'; body = { title: event.title, description: event.description, category: event.category, style: aiBannerStyle }; }
      if (aiTool === 'agenda') { body = { ...base, duration_hours: aiDurationHours ? parseInt(aiDurationHours) : undefined }; }

      const r = await fetch(`${API}/api/eventflow/ai/${endpoint}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      const data = await r.json();
      setAiResult(data.text || data.prompt || data.error || 'No result');
    } catch (err) {
      setAiResult('Request failed — check AI provider config');
    }
    setAiLoading(false);
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
    { key: 'overview',       label: 'Overview' },
    { key: 'attendees',      label: `Attendees (${stats.total})` },
    { key: 'checkin',        label: 'Check-in' },
    { key: 'notifications',  label: 'Notifications' },
    { key: 'ai',             label: '✨ AI Studio' },
    { key: 'form',           label: '📋 RSVP Form' },
    { key: 'settings',       label: 'Settings' },
  ];

  const AI_TOOLS: { key: AITool; label: string; desc: string }[] = [
    { key: 'describe', label: '📝 Description',    desc: 'Generate an engaging event description' },
    { key: 'social',   label: '📱 Social Copy',    desc: 'Instagram, LinkedIn & Twitter/X posts' },
    { key: 'email',    label: '📧 Email Blast',     desc: 'Promotional email with subject + body' },
    { key: 'agenda',   label: '📋 Agenda',          desc: 'Suggested time-slotted event schedule' },
    { key: 'banner',   label: '🎨 Banner Prompt',   desc: 'AI image prompt for Midjourney / DALL-E' },
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black">{event.title}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[event.status] || STATUS_STYLES.cancelled}`}>
                {event.status}
              </span>
              {!event.is_public && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700 text-slate-400">🔒 Private</span>
              )}
              {event.category && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300">{event.category}</span>
              )}
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
      <div className="flex gap-1 border-b border-white/[0.06] mb-6 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 whitespace-nowrap ${
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
              { label: 'Slug',      value: event.slug },
              { label: 'Category',  value: event.category || '—' },
              { label: 'Visibility', value: event.is_public ? '🌐 Public' : '🔒 Private (direct link only)' },
              { label: 'Location',  value: event.location || '—' },
              { label: 'Address',   value: event.address || '—' },
              { label: 'Timezone',  value: event.timezone },
              { label: 'End Date',  value: event.end_at ? new Date(event.end_at).toLocaleString('en-HK') : '—' },
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

      {/* AI Studio */}
      {tab === 'ai' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-violet-300 mb-1">✨ AI Studio</h3>
            <p className="text-xs text-slate-500">Generate content for your event using AI. All outputs are editable — copy and paste where needed.</p>
          </div>

          {/* Tool selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {AI_TOOLS.map(({ key, label, desc }) => (
              <button key={key} onClick={() => { setAiTool(key); setAiResult(''); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  aiTool === key
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-white/[0.08] bg-slate-800/60 text-slate-400 hover:border-violet-500/30 hover:text-violet-300'
                }`}>
                <div className="text-sm font-semibold mb-1">{label}</div>
                <div className="text-xs opacity-60 leading-snug">{desc}</div>
              </button>
            ))}
          </div>

          {/* Extra options per tool */}
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-sm">{AI_TOOLS.find((t) => t.key === aiTool)?.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">Based on: {event.title}{event.category ? ` · ${event.category}` : ''}</div>
              </div>
              <button onClick={runAI} disabled={aiLoading}
                className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                {aiLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
                ) : '✨ Generate'}
              </button>
            </div>

            {aiTool === 'banner' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Preferred Style (optional)</label>
                <input type="text" placeholder="e.g. Minimalist, Vibrant, Dark cinematic…" value={aiBannerStyle}
                  onChange={(e) => setAiBannerStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
            )}

            {aiTool === 'agenda' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Duration (hours)</label>
                <input type="number" min="1" max="24" placeholder="e.g. 3" value={aiDurationHours}
                  onChange={(e) => setAiDurationHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
            )}

            {/* Result */}
            {aiResult && (
              <div className="relative">
                <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{aiResult}</pre>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(aiResult); }}
                  className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-white/[0.08] transition-colors">
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RSVP Form Builder */}
      {tab === 'form' && (
        <div className="max-w-2xl space-y-6">
          {/* Core built-in fields */}
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="font-bold text-sm">Core Fields</h3>
              <p className="text-xs text-slate-500 mt-0.5">Always included in the registration form. First name, last name, and email are always required.</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {CORE_FIELDS.map((f) => (
                <div key={f.key} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">{f.type}</span>
                    <span className="text-sm font-medium text-slate-200">{f.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.alwaysRequired ? (
                      <span className="text-xs text-red-400 font-semibold">Required</span>
                    ) : (
                      <span className="text-xs text-slate-500">Optional</span>
                    )}
                    <div className={`w-7 h-4 rounded-full ${f.alwaysRequired ? 'bg-amber-500' : 'bg-slate-700'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full mt-0.5 shadow transition-transform ${f.alwaysRequired ? 'ml-3.5' : 'ml-0.5'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom fields */}
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Custom Fields</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add additional questions for your attendees.</p>
              </div>
              <button onClick={() => setShowAddField(!showAddField)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors">
                + Add Field
              </button>
            </div>

            {/* Add field form */}
            {showAddField && (
              <div className="px-6 py-5 border-b border-amber-500/20 bg-amber-500/[0.03] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Field Label *</label>
                    <input type="text" placeholder="e.g. Dietary Requirements" value={newField.label}
                      onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Field Type</label>
                    <select value={newField.field_type}
                      onChange={(e) => setNewField((f) => ({ ...f, field_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50">
                      {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Placeholder (optional)</label>
                  <input type="text" placeholder="Hint shown inside the field…" value={newField.placeholder}
                    onChange={(e) => setNewField((f) => ({ ...f, placeholder: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50" />
                </div>
                {['select', 'checkbox'].includes(newField.field_type) && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Options (one per line)</label>
                    <textarea rows={4} placeholder={"Option A\nOption B\nOption C"} value={newField.options}
                      onChange={(e) => setNewField((f) => ({ ...f, options: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900/60 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newField.required}
                      onChange={(e) => setNewField((f) => ({ ...f, required: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500/40" />
                    <span className="text-sm text-slate-300">Required field</span>
                  </label>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => setShowAddField(false)}
                      className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2 transition-colors">Cancel</button>
                    <button onClick={addCustomField} disabled={fieldSaving || !newField.label.trim()}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                      {fieldSaving ? 'Saving…' : 'Add Field'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing custom fields */}
            {formLoading ? (
              <div className="px-6 py-8 text-center text-slate-600 text-sm">Loading…</div>
            ) : formFields.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-600 text-sm">
                No custom fields yet — click <span className="text-amber-400">+ Add Field</span> to create one.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {formFields.map((f) => (
                  <div key={f.id} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-mono flex-shrink-0">{f.field_type}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{f.label}</div>
                        {f.placeholder && <div className="text-xs text-slate-600 truncate">{f.placeholder}</div>}
                        {f.options && <div className="text-xs text-slate-600 truncate">{f.options.join(' · ')}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={f.required}
                          onChange={(e) => toggleFieldRequired(f.id, e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-600" />
                        <span className="text-xs text-slate-500">Required</span>
                      </label>
                      <button onClick={() => deleteCustomField(f.id)}
                        className="text-slate-600 hover:text-red-400 text-xs transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview note */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300 space-y-1">
            <div className="font-semibold">📋 Form Preview</div>
            <p className="text-slate-400">Attendees will see the core fields above followed by your custom fields in the order listed. Changes apply immediately to new registrations.</p>
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

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
              <select value={settingsForm.category || ''}
                onChange={(e) => setSettingsForm((f) => ({ ...f, category: e.target.value || null }))}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors">
                <option value="">— No category —</option>
                {EVENT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Public / Private */}
            <div className="flex items-center justify-between bg-slate-900/40 border border-white/[0.06] rounded-xl p-4">
              <div>
                <div className="text-sm font-semibold">
                  {settingsForm.is_public ? '🌐 Public' : '🔒 Private'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {settingsForm.is_public
                    ? 'Visible in the public event listing'
                    : 'Hidden from listing — direct link only'}
                </div>
              </div>
              <button type="button"
                onClick={() => setSettingsForm((f) => ({ ...f, is_public: !f.is_public }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.is_public ? 'bg-amber-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settingsForm.is_public ? 'translate-x-5' : ''}`} />
              </button>
            </div>

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
