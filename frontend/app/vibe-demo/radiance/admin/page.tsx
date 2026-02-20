'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Lock, RefreshCw, ChevronDown, ChevronUp,
  Users, Mail, Clock, Search, Star,
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';
const ADMIN_PASSWORD = 'radiance2026happyday!';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Submission {
  id: number;
  enquiry_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  industry: string | null;
  service_interest: string | null;
  message: string | null;
  source_lang: string | null;
  status: string | null;
  created_at: string;
}

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem('radiance_admin_auth', '1');
      onAuth();
    } else {
      setError('Incorrect password, please try again.');
      setPw('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600/20 mb-6 mx-auto">
          <Lock className="w-7 h-7 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Radiance Admin</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Enter admin password to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
          >
            Enter
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/vibe-demo/radiance" className="text-slate-500 hover:text-slate-400 text-xs">
            ← Back to Radiance
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Submission Row ───────────────────────────────────────────────────────────

function SubmissionRow({ sub }: { sub: Submission }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    sub.status === 'replied' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' :
    sub.status === 'in_progress' ? 'bg-amber-900/40 text-amber-400 border-amber-800/50' :
    'bg-slate-700/40 text-slate-400 border-slate-600/40';

  return (
    <>
      <tr
        className="border-b border-slate-700/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-slate-300 text-sm font-medium">{sub.name}</td>
        <td className="px-4 py-3 text-sm">
          <a
            href={`mailto:${sub.email}`}
            className="text-purple-400 hover:text-purple-300"
            onClick={e => e.stopPropagation()}
          >
            {sub.email}
          </a>
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">{sub.phone || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{sub.company || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{sub.service_interest || '—'}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${statusColor}`}>
            {sub.status || 'new'}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs">
          {new Date(sub.created_at).toLocaleDateString('en-HK', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </td>
        <td className="px-4 py-3 text-slate-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-800/60">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Message / Goals</p>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{sub.message || '(none)'}</p>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p>Industry: <span className="text-slate-400">{sub.industry || '—'}</span></p>
                <p>Language: <span className="text-slate-400">{sub.source_lang === 'zh' ? 'Chinese (繁中)' : 'English'}</span></p>
                <p>Enquiry ID: <span className="text-slate-400 font-mono">{sub.enquiry_id}</span></p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function RadianceAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (localStorage.getItem('radiance_admin_auth') === '1') {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) loadSubmissions();
  }, [authed]); // eslint-disable-line

  async function loadSubmissions() {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/radiance/contact/submissions?password=${encodeURIComponent(ADMIN_PASSWORD)}&limit=200`
      );
      const data = await res.json();
      if (data.success) setSubmissions(data.submissions);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  if (!authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />;
  }

  const filtered = submissions.filter(s =>
    !search || [s.name, s.email, s.phone, s.company, s.industry, s.service_interest].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const thisWeek = submissions.filter(
    s => new Date(s.created_at) > new Date(Date.now() - 7 * 86400000)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/vibe-demo/radiance" className="text-slate-400 hover:text-slate-300 flex items-center gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <h1 className="font-bold text-white">Radiance Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 w-48"
              />
            </div>
            <button
              onClick={loadSubmissions}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { localStorage.removeItem('radiance_admin_auth'); setAuthed(false); }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Users, label: 'Total Enquiries', value: submissions.length, color: 'text-purple-400' },
            { icon: Clock, label: 'This Week', value: thisWeek.length, color: 'text-amber-400' },
            { icon: Mail, label: 'New (unread)', value: submissions.filter(s => !s.status || s.status === 'new').length, color: 'text-blue-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              Consultation Enquiries
              {search && <span className="text-slate-500 ml-2">({filtered.length} results)</span>}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              {submissions.length === 0 ? 'No enquiries yet' : 'No results match your search'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Name', 'Email', 'Phone', 'Company', 'Service', 'Status', 'Submitted', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => <SubmissionRow key={sub.id} sub={sub} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
