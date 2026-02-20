'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Lock, RefreshCw, ChevronDown, ChevronUp,
  Users, MessageSquare, Mail, Phone, Building2, Clock,
  CheckCircle, Search,
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';
const ADMIN_PASSWORD = '5milesLab01@';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lead {
  id: number;
  lead_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  industry: string | null;
  headcount: string | null;
  message: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

interface Session {
  id: number;
  session_id: string;
  visitor_id: string | null;
  industry: string | null;
  source_page: string | null;
  turn_count: number;
  contact_captured: boolean;
  captured_name: string | null;
  captured_email: string | null;
  captured_phone: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  message_count: string;
}

interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  turn_number: number;
  created_at: string;
}

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem('recruitai_admin_auth', '1');
      onAuth();
    } else {
      setError('密碼錯誤，請重試');
      setPw('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 mb-6 mx-auto">
          <Lock className="w-7 h-7 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">RecruitAI 管理後台</h1>
        <p className="text-slate-400 text-sm text-center mb-6">請輸入管理密碼</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="輸入密碼..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            進入
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/vibe-demo/recruitai" className="text-slate-500 hover:text-slate-400 text-xs">
            ← 返回主頁
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────

function LeadRow({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="border-b border-slate-700/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-slate-300 text-sm">{lead.name}</td>
        <td className="px-4 py-3 text-slate-300 text-sm">
          <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300" onClick={e => e.stopPropagation()}>
            {lead.email}
          </a>
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">{lead.phone || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{lead.industry || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{lead.company || '—'}</td>
        <td className="px-4 py-3 text-slate-500 text-xs">
          {new Date(lead.created_at).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-4 py-3 text-slate-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-800/60">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">訊息</p>
                <p className="text-slate-300 leading-relaxed">{lead.message || '(空)'}</p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-slate-500 text-xs">人數：{lead.headcount || '—'}</p>
                  <p className="text-slate-500 text-xs">來源頁面：{lead.source_page || '—'}</p>
                  {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                    <p className="text-slate-500 text-xs">
                      UTM: {[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session, password }: { session: Session; password: string }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  async function loadMessages() {
    if (messages.length > 0) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruitai/admin/sessions/${session.session_id}/messages?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch { /* ignore */ }
    finally { setLoadingMessages(false); }
  }

  function handleToggle() {
    setExpanded(!expanded);
    if (!expanded) loadMessages();
  }

  return (
    <>
      <tr
        className="border-b border-slate-700/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={handleToggle}
      >
        <td className="px-4 py-3">
          {session.contact_captured ? (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded-full border border-emerald-800/50">
              <CheckCircle className="w-3 h-3" /> 已捕獲
            </span>
          ) : (
            <span className="text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-700/40 border border-slate-600/40">
              進行中
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-slate-300 text-sm">{session.captured_name || session.visitor_id?.slice(0, 8) || '匿名'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">
          {session.captured_email ? (
            <a href={`mailto:${session.captured_email}`} className="text-blue-400 hover:text-blue-300" onClick={e => e.stopPropagation()}>
              {session.captured_email}
            </a>
          ) : '—'}
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">{session.industry || '—'}</td>
        <td className="px-4 py-3 text-center">
          <span className="text-slate-300 text-sm font-medium">{session.turn_count}</span>
          <span className="text-slate-500 text-xs"> 輪</span>
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs">
          {new Date(session.created_at).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-4 py-3 text-slate-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-800/60">
          <td colSpan={7} className="px-4 py-4">
            {loadingMessages ? (
              <p className="text-slate-400 text-sm text-center py-4">載入中...</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">沒有訊息記錄</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && (
                        <span className="text-xs text-blue-400 flex-none mt-1 font-semibold">AI</span>
                      )}
                      <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                        m.role === 'user'
                          ? 'bg-blue-900/40 text-blue-100 border border-blue-800/40'
                          : 'bg-slate-700/60 text-slate-300 border border-slate-600/40'
                      }`}>
                        {m.content}
                      </div>
                      {m.role === 'user' && (
                        <span className="text-xs text-slate-500 flex-none mt-1 font-semibold">用戶</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password] = useState(ADMIN_PASSWORD);
  const [activeTab, setActiveTab] = useState<'leads' | 'sessions'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (localStorage.getItem('recruitai_admin_auth') === '1') {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      loadLeads();
      loadSessions();
    }
  }, [authed]); // eslint-disable-line

  async function loadLeads() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruitai/admin/leads?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data.success) setLeads(data.leads);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function loadSessions() {
    try {
      const res = await fetch(`${API_BASE}/api/recruitai/admin/sessions?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
    } catch { /* ignore */ }
  }

  function handleRefresh() {
    loadLeads();
    loadSessions();
  }

  if (!authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />;
  }

  const filteredLeads = leads.filter(l =>
    !search || [l.name, l.email, l.phone, l.company, l.industry].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSessions = sessions.filter(s =>
    !search || [s.captured_name, s.captured_email, s.industry, s.captured_phone].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/vibe-demo/recruitai" className="text-slate-400 hover:text-slate-300 flex items-center gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-bold text-white">RecruitAI 管理後台</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索..."
                className="pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { localStorage.removeItem('recruitai_admin_auth'); setAuthed(false); }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users, label: '總詢問數', value: leads.length, color: 'text-blue-400' },
            { icon: MessageSquare, label: '對話次數', value: sessions.length, color: 'text-violet-400' },
            { icon: CheckCircle, label: '捕獲聯絡', value: sessions.filter(s => s.contact_captured).length, color: 'text-emerald-400' },
            { icon: Clock, label: '本週詢問', value: leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 7 * 86400000)).length, color: 'text-amber-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-800/40 p-1 rounded-xl w-fit border border-slate-700/50">
          {(['leads', 'sessions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'leads' ? `詢問列表 (${leads.length})` : `對話記錄 (${sessions.length})`}
            </button>
          ))}
        </div>

        {/* Leads Table */}
        {activeTab === 'leads' && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                {leads.length === 0 ? '暫無詢問記錄' : '沒有符合搜索條件的結果'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/80">
                      {['姓名', '電郵', '電話', '行業', '公司', '提交時間', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sessions Table */}
        {activeTab === 'sessions' && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                {sessions.length === 0 ? '暫無對話記錄' : '沒有符合搜索條件的結果'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/80">
                      {['狀態', '訪客', '電郵', '行業', '輪數', '開始時間', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map(session => (
                      <SessionRow key={session.id} session={session} password={password} />
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
