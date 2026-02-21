'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Lock, RefreshCw, ChevronDown, ChevronUp,
  Users, MessageSquare, Clock,
  CheckCircle, Search, Pencil, Trash2, X, Save,
  Sparkles, Star, Tag, FileText, TrendingUp,
} from 'lucide-react';

const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_API_URL || '');
})();
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
  ip_address: string | null;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SourceBadge({ page }: { page: string | null }) {
  if (!page) return <span className="text-slate-600 text-xs">—</span>;
  if (page.startsWith('chatbot:'))
    return <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-900/40 text-emerald-300 border-emerald-800/50">AI 聊天</span>;
  const map: Record<string, { label: string; cls: string }> = {
    '/contact':      { label: '聯絡表格', cls: 'bg-blue-900/40 text-blue-300 border-blue-800/50' },
    '/consultation': { label: '諮詢預約', cls: 'bg-violet-900/40 text-violet-300 border-violet-800/50' },
  };
  const m = Object.entries(map).find(([k]) => page.includes(k));
  if (m) return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${m[1].cls}`}>{m[1].label}</span>
  );
  return <span className="text-slate-500 text-xs">{page}</span>;
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
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            進入
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/vibe-demo/recruitai" className="text-slate-500 hover:text-slate-400 text-xs">← 返回主頁</Link>
        </div>
      </div>
    </div>
  );
}

// ─── AI Analysis types ────────────────────────────────────────────────────────

interface AiAnalysis {
  category: string;
  summary: string;
  evaluation: string;
  stars: number;
  star_reason: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  '招聘自動化':  'bg-blue-900/50 text-blue-300 border-blue-700/50',
  '客服AI':      'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  '行銷自動化':  'bg-violet-900/50 text-violet-300 border-violet-700/50',
  '後台流程':    'bg-amber-900/50 text-amber-300 border-amber-700/50',
  '資料分析':    'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
  '人力資源':    'bg-pink-900/50 text-pink-300 border-pink-700/50',
  '一般查詢':    'bg-slate-700/50 text-slate-300 border-slate-600/50',
};

const STAR_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-lime-400', 'text-emerald-400'];
const STAR_LABELS = ['', '冷門', '待觀察', '有興趣', '積極', '高潛力'];

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-4 h-4 ${i <= stars ? `fill-current ${STAR_COLORS[stars]}` : 'text-slate-600'}`} />
        ))}
      </div>
      <span className={`text-xs font-semibold ${STAR_COLORS[stars]}`}>{STAR_LABELS[stars]}</span>
    </div>
  );
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  onUpdate,
  onDelete,
}: {
  lead: Lead;
  onUpdate: (id: number, fields: Partial<Lead>) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [draft, setDraft] = useState({
    name: lead.name ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    company: lead.company ?? '',
    industry: lead.industry ?? '',
    headcount: lead.headcount ?? '',
    message: lead.message ?? '',
  });

  const upd = (k: keyof typeof draft, v: string) => setDraft(p => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruitai/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, ...draft }),
      });
      if (res.ok) { onUpdate(lead.id, draft); setEditing(false); }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm(`確認刪除 ${lead.name || lead.email} 的詢問記錄？此操作無法撤銷。`)) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/recruitai/admin/leads/${lead.id}?password=${encodeURIComponent(ADMIN_PASSWORD)}`,
        { method: 'DELETE' }
      );
      if (res.ok) onDelete(lead.id);
    } finally { setDeleting(false); }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const res = await fetch(`${API_BASE}/api/recruitai/admin/leads/${lead.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });
      const data = await res.json();
      if (data.success) setAnalysis(data.analysis);
      else setAnalyzeError(data.error || '分析失敗');
    } catch {
      setAnalyzeError('請求失敗，請重試');
    } finally { setAnalyzing(false); }
  }

  const fieldCls = 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelCls = 'block text-xs text-slate-500 uppercase tracking-wider mb-1';

  return (
    <>
      <tr
        className="border-b border-slate-700/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => { if (!editing) setExpanded(!expanded); }}
      >
        <td className="px-4 py-3 text-slate-300 text-sm font-medium">{lead.name || '—'}</td>
        <td className="px-4 py-3 text-sm">
          <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300" onClick={e => e.stopPropagation()}>
            {lead.email}
          </a>
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">{lead.phone || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{lead.company || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{lead.industry || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{lead.headcount || '—'}</td>
        <td className="px-4 py-3"><SourceBadge page={lead.source_page} /></td>
        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
          {new Date(lead.created_at).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button onClick={() => { setExpanded(true); setEditing(true); }}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors" title="編輯">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors" title="刪除">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { if (!editing) setExpanded(!expanded); }} className="p-1.5 text-slate-500">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-800/60 border-b border-slate-700/50">
          <td colSpan={9} className="px-5 py-5">
            {editing ? (
              /* ── Edit mode ── */
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([
                    ['name', '姓名', 'text'],
                    ['email', '電郵', 'email'],
                    ['phone', '電話', 'text'],
                    ['company', '公司', 'text'],
                    ['industry', '行業', 'text'],
                    ['headcount', '員工人數', 'text'],
                  ] as [keyof typeof draft, string, string][]).map(([k, label, type]) => (
                    <div key={k}>
                      <label className={labelCls}>{label}</label>
                      <input type={type} value={draft[k]} onChange={e => upd(k, e.target.value)} className={fieldCls} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className={labelCls}>訊息 / 痛點</label>
                  <textarea rows={3} value={draft.message} onChange={e => upd('message', e.target.value)} className={`${fieldCls} resize-none`} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                    <Save className="w-3.5 h-3.5" />{saving ? '儲存中...' : '儲存'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setDraft({ name: lead.name ?? '', email: lead.email ?? '', phone: lead.phone ?? '', company: lead.company ?? '', industry: lead.industry ?? '', headcount: lead.headcount ?? '', message: lead.message ?? '' }); }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-600 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
                    <X className="w-3.5 h-3.5" />取消
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="space-y-5">

                {/* Submitted info grid */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> 提交資料
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                    <div><p className={labelCls}>姓名</p><p className="text-slate-200 font-medium">{lead.name || '—'}</p></div>
                    <div><p className={labelCls}>電郵</p>
                      <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300 text-sm">{lead.email || '—'}</a>
                    </div>
                    <div><p className={labelCls}>電話</p><p className="text-slate-300">{lead.phone || '—'}</p></div>
                    <div><p className={labelCls}>公司</p><p className="text-slate-300">{lead.company || '—'}</p></div>
                    <div><p className={labelCls}>行業</p><p className="text-slate-300">{lead.industry || '—'}</p></div>
                    <div><p className={labelCls}>員工人數</p><p className="text-slate-300">{lead.headcount || '—'}</p></div>
                    <div><p className={labelCls}>表單來源</p><SourceBadge page={lead.source_page} /></div>
                    <div><p className={labelCls}>提交時間</p>
                      <p className="text-slate-300">{new Date(lead.created_at).toLocaleString('zh-HK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                      <div><p className={labelCls}>UTM</p>
                        <p className="text-slate-500 text-xs">{[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ')}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <p className={labelCls}>訊息 / 痛點</p>
                      <p className="text-slate-200 whitespace-pre-line leading-relaxed bg-white/[0.03] rounded-lg px-3 py-2 border border-slate-700/50">{lead.message || '(未填寫)'}</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-700/50" />

                {/* AI Analysis */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI 分析
                    </p>
                    {!analysis && (
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        {analyzing ? '分析中...' : '分析此詢問'}
                      </button>
                    )}
                    {analysis && (
                      <button
                        onClick={() => { setAnalysis(null); }}
                        className="text-slate-500 hover:text-slate-400 text-xs"
                      >重新分析</button>
                    )}
                  </div>

                  {analyzing && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-3">
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      正在分析，請稍候...
                    </div>
                  )}

                  {analyzeError && (
                    <p className="text-red-400 text-sm">{analyzeError}</p>
                  )}

                  {analysis && (
                    <div className="space-y-4">
                      {/* Category + Stars row */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${CATEGORY_COLORS[analysis.category] ?? CATEGORY_COLORS['一般查詢']}`}>
                          <Tag className="w-3 h-3" />{analysis.category}
                        </span>
                        <StarRating stars={Math.min(5, Math.max(1, analysis.stars))} />
                      </div>
                      <p className="text-slate-400 text-xs italic">{analysis.star_reason}</p>

                      {/* Summary */}
                      <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl px-4 py-3 space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> AI 摘要
                          </p>
                          <p className="text-slate-200 text-sm leading-relaxed">{analysis.summary}</p>
                        </div>
                        <div className="border-t border-slate-700/40 pt-3">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> 潛力評估
                          </p>
                          <p className="text-slate-200 text-sm leading-relaxed">{analysis.evaluation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!analysis && !analyzing && !analyzeError && (
                    <p className="text-slate-600 text-xs">點擊「分析此詢問」以獲得 AI 分類、摘要及潛力評估。</p>
                  )}
                </div>

              </div>
            )}
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
            <span className="text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-700/40 border border-slate-600/40">進行中</span>
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
        <td className="px-4 py-3 text-slate-400 text-sm">{session.captured_phone || '—'}</td>
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
        <tr className="bg-slate-800/60 border-b border-slate-700/50">
          <td colSpan={8} className="px-4 py-4">
            {loadingMessages ? (
              <p className="text-slate-400 text-sm text-center py-4">載入中...</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">沒有訊息記錄</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && <span className="text-xs text-blue-400 flex-none mt-1 font-semibold">AI</span>}
                      <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                        m.role === 'user'
                          ? 'bg-blue-900/40 text-blue-100 border border-blue-800/40'
                          : 'bg-slate-700/60 text-slate-300 border border-slate-600/40'
                      }`}>
                        {m.content}
                      </div>
                      {m.role === 'user' && <span className="text-xs text-slate-500 flex-none mt-1 font-semibold">用戶</span>}
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
    if (localStorage.getItem('recruitai_admin_auth') === '1') setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) { loadLeads(); loadSessions(); }
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

  function handleUpdate(id: number, fields: Partial<Lead>) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...fields } : l));
  }

  function handleDelete(id: number) {
    setLeads(prev => prev.filter(l => l.id !== id));
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

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
              onClick={() => { loadLeads(); loadSessions(); }}
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
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users,        label: '總詢問數',  value: leads.length,                                                              color: 'text-blue-400' },
            { icon: MessageSquare,label: '對話次數',  value: sessions.length,                                                           color: 'text-violet-400' },
            { icon: CheckCircle,  label: '捕獲聯絡',  value: sessions.filter(s => s.contact_captured).length,                          color: 'text-emerald-400' },
            { icon: Clock,        label: '本週詢問',  value: leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 7 * 86400000)).length, color: 'text-amber-400' },
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
                activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
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
                      {['姓名', '電郵', '電話', '公司', '行業', '人數', '來源', '提交時間', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <LeadRow key={lead.id} lead={lead} onUpdate={handleUpdate} onDelete={handleDelete} />
                    ))}
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
                      {['狀態', '訪客', '電郵', '電話', '行業', '輪數', '開始時間', ''].map(h => (
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
