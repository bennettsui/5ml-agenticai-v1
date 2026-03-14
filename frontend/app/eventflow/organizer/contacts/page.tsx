'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

function token() { return typeof window !== 'undefined' ? localStorage.getItem('ef_token') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }; }

interface Contact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  organization: string;
  phone: string;
  title: string;
  event_count: number;
  last_seen: string;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/api/eventflow/organizer/contacts`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(({ contacts }) => { setContacts(contacts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.organization?.toLowerCase().includes(q)
    );
  });

  function exportCSV() {
    const headers = ['First Name', 'Last Name', 'Email', 'Organization', 'Title', 'Phone', 'Events', 'Created'];
    const rows = filtered.map((c) => [
      c.first_name, c.last_name, c.email, c.organization || '', c.title || '', c.phone || '',
      c.event_count, new Date(c.created_at).toLocaleDateString('en-HK'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contacts.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Contacts</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? '…' : `${contacts.length} unique contact${contacts.length !== 1 ? 's' : ''} across all events`}
          </p>
        </div>
        <button onClick={exportCSV} disabled={filtered.length === 0}
          className="border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white disabled:opacity-40 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
          ↓ Export CSV
        </button>
      </div>

      {/* About */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
        <span className="text-amber-400 flex-shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-amber-200/70">
          Every RSVP across all your events is deduplicated here by email address. This is your master contact database — the core asset of your events platform.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by name, email, org…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
        </div>
        {search && <span className="text-slate-500 text-sm">{filtered.length} results</span>}
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading contacts…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-400 font-medium mb-1">{search ? 'No contacts match your search' : 'No contacts yet'}</p>
            {!search && <p className="text-slate-600 text-sm">Contacts are created automatically when attendees RSVP to your events.</p>}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Organization</th>
                <th className="text-left px-6 py-3">Title</th>
                <th className="text-center px-6 py-3">Events</th>
                <th className="text-left px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-amber-400">
                          {c.first_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="font-semibold text-sm">{c.first_name} {c.last_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{c.email}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{c.organization || <span className="text-slate-700">—</span>}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{c.title || <span className="text-slate-700">—</span>}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      (c.event_count || 1) > 1 ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500'
                    }`}>{c.event_count || 1}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
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
