'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Lock, RefreshCw, ChevronDown, ChevronUp,
  Users, MessageSquare, Clock,
  CheckCircle, Search, Pencil, Trash2, X, Save,
  Sparkles, Star, Tag, FileText, TrendingUp,
  ImageIcon, Zap, AlertCircle, FolderOpen,
  Mail, Upload, CloudUpload, Columns,
} from 'lucide-react';

const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_API_URL || '');
})();
const ADMIN_PASSWORD = '5mileslab';

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
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const [followupResult, setFollowupResult] = useState<string | null>(null);
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

  async function handleFollowup() {
    if (!confirm(`發送跟進郵件至 ${lead.email}？`)) return;
    setSendingFollowup(true);
    setFollowupResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/recruitai/admin/leads/${lead.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });
      const data = await res.json();
      if (data.success) setFollowupResult(`✅ 已發送至 ${data.sentTo}`);
      else setFollowupResult(`❌ ${data.error || '發送失敗'}`);
    } catch {
      setFollowupResult('❌ 請求失敗');
    } finally { setSendingFollowup(false); }
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

                {/* Divider */}
                <div className="border-t border-slate-700/50" />

                {/* Follow-up email */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400" /> 跟進郵件
                    </p>
                    {lead.email && (
                      <button
                        onClick={handleFollowup}
                        disabled={sendingFollowup}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Mail className="w-3 h-3" />
                        {sendingFollowup ? '發送中...' : '發送 AI 跟進郵件'}
                      </button>
                    )}
                  </div>
                  {followupResult && (
                    <p className={`text-sm ${followupResult.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {followupResult}
                    </p>
                  )}
                  {!lead.email && <p className="text-slate-600 text-xs">此詢問沒有電郵地址。</p>}
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

// ─── Media Library ────────────────────────────────────────────────────────────

interface MediaImage {
  id: string;
  filename: string;
  description: string;
  prompt?: string;
  url: string;
  exists: boolean;
  size: number | null;
  modified: string | null;
  canGenerate: boolean;
  site: string;
}
interface MediaGroup {
  id: string;
  label: string;
  images: MediaImage[];
}

function fmtBytes(b: number | null) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function MediaCard({
  image,
  onGenerate,
  generating,
}: {
  image: MediaImage;
  onGenerate: (site: string, id: string) => void;
  generating: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative bg-slate-800 aspect-video flex items-center justify-center">
        {image.exists && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.description}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-600">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">{image.exists ? '預覽不可用' : '未生成'}</span>
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          {image.exists ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 backdrop-blur-sm">
              ✓ 已生成
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-400 border border-slate-600/50 backdrop-blur-sm">
              ✗ 未生成
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="text-slate-200 text-xs font-medium leading-tight">{image.description}</p>
          <p className="text-slate-600 text-xs mt-0.5 font-mono">{image.filename}</p>
        </div>
        {image.size && (
          <p className="text-slate-600 text-xs">{fmtBytes(image.size)} · {image.modified ? new Date(image.modified).toLocaleDateString('zh-HK') : ''}</p>
        )}

        {/* Prompt preview */}
        {image.prompt && (
          <div>
            <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-slate-500 hover:text-slate-400 underline underline-offset-2">
              {showPrompt ? '收起 Prompt' : '查看 Prompt'}
            </button>
            {showPrompt && (
              <p className="mt-1 text-slate-500 text-xs leading-relaxed bg-white/[0.02] rounded-lg p-2 border border-slate-700/30 line-clamp-6">
                {image.prompt}
              </p>
            )}
          </div>
        )}

        {/* Generate button */}
        {image.canGenerate && (
          <button
            onClick={() => onGenerate(image.site, image.id)}
            disabled={generating}
            className={`mt-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              image.exists
                ? 'border border-slate-600 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                : 'bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-300'
            } disabled:opacity-40`}
          >
            {generating ? (
              <><div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" /> 生成中...</>
            ) : (
              <><Zap className="w-3 h-3" />{image.exists ? '重新生成' : '生成'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Dedicated RecruitAI Media Library ───────────────────────────────────────

interface RecruitMediaImage {
  key: string;
  filename: string;
  description: string;
  prompt?: string;
  path: string;
  source: string;
  publicUrl: string | null;
  localExists: boolean;
  alt: string;
  missing: boolean;
  canGenerate: boolean;
  visualId?: string;
  size: number | null;
  modified: string | null;
}

function fmtBytes2(b: number | null) {
  if (!b) return '';
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

function RecruitMediaCard({
  img,
  onGenerate,
  onPushCdn,
  generating,
  pushing,
}: {
  img: RecruitMediaImage;
  onGenerate: (id: string) => void;
  onPushCdn: (key: string) => void;
  generating: boolean;
  pushing: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const displayUrl = img.publicUrl || (img.localExists ? img.path : null);

  return (
    <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative bg-slate-800 aspect-video flex items-center justify-center">
        {displayUrl && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={img.alt} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-600">
            <ImageIcon className="w-7 h-7" />
            <span className="text-xs">{img.missing ? '未生成' : '預覽不可用'}</span>
          </div>
        )}
        {/* Status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {img.publicUrl ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 backdrop-blur-sm">CDN ✓</span>
          ) : img.localExists ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/80 text-amber-300 border border-amber-700/50 backdrop-blur-sm">本地</span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/80 text-slate-400 border border-slate-600/50 backdrop-blur-sm">未生成</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="text-slate-200 text-xs font-medium leading-tight">{img.description || img.filename}</p>
          <p className="text-slate-600 text-[10px] mt-0.5 font-mono">{img.filename}</p>
          {img.size && <p className="text-slate-600 text-[10px]">{fmtBytes2(img.size)}</p>}
        </div>

        {img.prompt && (
          <div>
            <button onClick={() => setShowPrompt(!showPrompt)} className="text-[10px] text-slate-500 hover:text-slate-400 underline underline-offset-2">
              {showPrompt ? '收起' : 'Prompt'}
            </button>
            {showPrompt && <p className="mt-1 text-slate-500 text-[10px] leading-relaxed bg-white/[0.02] rounded p-1.5 border border-slate-700/30 line-clamp-5">{img.prompt}</p>}
          </div>
        )}

        {img.publicUrl && (
          <p className="text-[10px] text-slate-600 truncate">
            <a href={img.publicUrl} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">{img.publicUrl.replace('http://5ml.mmdbfiles.com', 'mmdb:/')}</a>
          </p>
        )}

        <div className="mt-auto flex gap-1.5">
          {img.canGenerate && img.visualId && (
            <button
              onClick={() => onGenerate(img.visualId!)}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-300 disabled:opacity-40"
            >
              {generating ? <><div className="w-2.5 h-2.5 border border-violet-400 border-t-transparent rounded-full animate-spin" />生成中</> : <><Zap className="w-3 h-3" />{img.localExists ? '重新' : '生成'}</>}
            </button>
          )}
          {img.localExists && !img.publicUrl && (
            <button
              onClick={() => onPushCdn(img.key)}
              disabled={pushing}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-300 disabled:opacity-40"
            >
              {pushing ? <><div className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />上傳中</> : <><CloudUpload className="w-3 h-3" />推 CDN</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecruitMediaLibraryTab() {
  const [images, setImages] = useState<RecruitMediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ geminiAvailable: boolean; generated: number; total: number; hasCdn: number } | null>(null);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [pushing, setPushing] = useState<Record<string, boolean>>({});
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ progress: number; total: number } | null>(null);

  async function loadStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/recruitai-media/status`);
      const data = await res.json();
      if (data) setStatus({ geminiAvailable: data.geminiAvailable, generated: data.generated, total: data.total, hasCdn: data.hasCdn });
    } catch { /* ignore */ }
  }

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruitai-media/media`);
      const data = await res.json();
      if (data.success) setImages(data.images);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadStatus(); }, []);

  async function handleGenerate(visualId: string) {
    setGenerating(p => ({ ...p, [visualId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/recruitai-media/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: visualId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        alert(`生成失敗 (${res.status}): ${err.error || res.statusText}`);
      }
      await Promise.all([loadStatus(), loadMedia()]);
    } catch (e: unknown) {
      alert(`生成失敗: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setGenerating(p => ({ ...p, [visualId]: false })); }
  }

  async function handlePushCdn(key: string) {
    setPushing(p => ({ ...p, [key]: true }));
    try {
      await fetch(`${API_BASE}/api/recruitai-media/media/push-to-cdn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      await loadMedia();
    } catch { /* ignore */ }
    finally { setPushing(p => ({ ...p, [key]: false })); }
  }

  async function handleSyncAll() {
    if (!confirm('同步所有本地圖片至 CDN？這可能需要幾分鐘。')) return;
    try {
      await fetch(`${API_BASE}/api/recruitai-media/sync-cdn`, { method: 'POST' });
      await loadMedia();
    } catch { /* ignore */ }
  }

  async function handleGenerateAll() {
    if (!status?.geminiAvailable) return alert('GEMINI_API_KEY 未設置');
    setBatchRunning(true);
    setBatchProgress({ progress: 0, total: status.total });
    try {
      await fetch(`${API_BASE}/api/recruitai-media/generate-all`, { method: 'POST' });
      // Poll progress
      const poll = setInterval(async () => {
        const res = await fetch(`${API_BASE}/api/recruitai-media/generate-all/status`);
        const data = await res.json();
        setBatchProgress({ progress: data.state.progress, total: data.state.total });
        if (!data.state.running) {
          clearInterval(poll);
          setBatchRunning(false);
          await Promise.all([loadStatus(), loadMedia()]);
        }
      }, 3000);
    } catch { setBatchRunning(false); }
  }

  const hasMissing = images.filter(i => i.canGenerate && i.missing).length;
  const hasNoCdn   = images.filter(i => i.localExists && !i.publicUrl).length;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status?.geminiAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs text-slate-400">Gemini {status?.geminiAvailable ? '可用' : '未設置'}</span>
          </div>
          {status && (
            <>
              <span className="text-xs text-slate-500">{status.generated}/{status.total} 已生成</span>
              <span className="text-xs text-slate-500">{status.hasCdn}/{status.total} 已推 CDN</span>
            </>
          )}
          {hasMissing > 0 && <span className="text-xs text-amber-400">{hasMissing} 待生成</span>}
          {hasNoCdn > 0 && <span className="text-xs text-blue-400">{hasNoCdn} 待推 CDN</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasMissing > 0 && status?.geminiAvailable && (
            <button
              onClick={handleGenerateAll}
              disabled={batchRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Zap className="w-3 h-3" />
              {batchRunning
                ? `生成中 ${batchProgress?.progress ?? 0}/${batchProgress?.total ?? 0}...`
                : `批量生成 (${hasMissing})`
              }
            </button>
          )}
          {hasNoCdn > 0 && (
            <button
              onClick={handleSyncAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-300 text-xs font-medium rounded-lg transition-colors"
            >
              <CloudUpload className="w-3 h-3" /> 同步所有至 CDN
            </button>
          )}
          <button
            onClick={() => { loadStatus(); loadMedia(); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-slate-300 text-xs rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 載入媒體庫
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">載入中...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-slate-600 text-sm">點擊「載入媒體庫」查看所有圖片</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map(img => (
            <RecruitMediaCard
              key={img.key}
              img={img}
              onGenerate={handleGenerate}
              onPushCdn={handlePushCdn}
              generating={!!(img.visualId && generating[img.visualId])}
              pushing={!!pushing[img.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Legacy cross-site media tab (kept for other sites) ───────────────────────
function MediaLibraryTab({ password }: { password: string }) {
  const [groups, setGroups] = useState<MediaGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [genError, setGenError] = useState<Record<string, string>>({});

  async function loadLibrary() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/media-library?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data.success) { setGroups(data.groups); setGeminiAvailable(data.geminiAvailable); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleGenerate(site: string, id: string) {
    const key = `${site}:${id}`;
    setGenerating(p => ({ ...p, [key]: true }));
    setGenError(p => ({ ...p, [key]: '' }));
    try {
      const res = await fetch(`${API_BASE}/api/admin/media-library/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, site, id }),
      });
      const data = await res.json();
      if (!res.ok) setGenError(p => ({ ...p, [key]: data.error || '生成失敗' }));
      else await loadLibrary();
    } catch (e: unknown) {
      setGenError(p => ({ ...p, [key]: e instanceof Error ? e.message : '請求失敗' }));
    } finally {
      setGenerating(p => ({ ...p, [key]: false }));
    }
  }

  async function generateAllMissing() {
    for (const group of groups) {
      for (const img of group.images) {
        if (img.canGenerate && !img.exists) await handleGenerate(img.site, img.id);
      }
    }
  }

  const totalImages = groups.reduce((s, g) => s + g.images.length, 0);
  const generatedCount = groups.reduce((s, g) => s + g.images.filter(i => i.exists).length, 0);
  const missingGeneratable = groups.reduce((s, g) => s + g.images.filter(i => i.canGenerate && !i.exists).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${geminiAvailable ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-400">Gemini {geminiAvailable ? '可用' : '不可用'}</span>
          </div>
          <span className="text-xs text-slate-500">{generatedCount} / {totalImages} 已生成</span>
        </div>
        <div className="flex items-center gap-2">
          {missingGeneratable > 0 && geminiAvailable && (
            <button onClick={generateAllMissing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-300 text-xs font-medium rounded-lg transition-colors">
              <Zap className="w-3 h-3" /> 生成所有 ({missingGeneratable})
            </button>
          )}
          <button onClick={loadLibrary} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-slate-300 text-xs rounded-lg transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 載入
          </button>
        </div>
      </div>
      {loading && groups.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">載入中...</div>
      ) : (
        groups.map(group => (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-300 text-sm">{group.label}</h3>
              <span className="text-xs text-slate-500">{group.images.filter(i => i.exists).length}/{group.images.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {group.images.map(img => {
                const key = `${img.site}:${img.id}`;
                return (
                  <div key={img.id}>
                    <MediaCard image={img} onGenerate={handleGenerate} generating={!!generating[key]} />
                    {genError[key] && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{genError[key]}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password] = useState(ADMIN_PASSWORD);
  const [activeTab, setActiveTab] = useState<'leads' | 'sessions' | 'media' | 'pipeline'>('leads');
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
        <div className="flex gap-1 mb-4 bg-slate-800/40 p-1 rounded-xl w-fit border border-slate-700/50 flex-wrap">
          {([
            { id: 'leads',    label: `詢問列表 (${leads.length})` },
            { id: 'pipeline', label: '銷售漏斗' },
            { id: 'sessions', label: `對話記錄 (${sessions.length})` },
            { id: 'media',    label: 'AI 圖片庫' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
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

        {/* Pipeline (Kanban) */}
        {activeTab === 'pipeline' && (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { stage: '新詢問', color: 'border-blue-700/40 bg-blue-950/20',    badge: 'bg-blue-900/50 text-blue-300',   filter: (l: Lead) => !l.industry && !l.company },
                { stage: '已了解業務', color: 'border-violet-700/40 bg-violet-950/20', badge: 'bg-violet-900/50 text-violet-300', filter: (l: Lead) => !!(l.industry || l.company) && !l.phone },
                { stage: '已約諮詢', color: 'border-amber-700/40 bg-amber-950/20',  badge: 'bg-amber-900/50 text-amber-300',   filter: (l: Lead) => !!(l.phone) && !l.headcount },
                { stage: '高潛力', color: 'border-emerald-700/40 bg-emerald-950/20', badge: 'bg-emerald-900/50 text-emerald-300', filter: (l: Lead) => !!(l.headcount) },
              ].map(col => {
                const colLeads = leads.filter(col.filter);
                return (
                  <div key={col.stage} className={`rounded-2xl border p-4 ${col.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">{col.stage}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.badge}`}>{colLeads.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colLeads.length === 0 ? (
                        <p className="text-slate-600 text-xs text-center py-4">暫無</p>
                      ) : (
                        colLeads.slice(0, 8).map(l => (
                          <div key={l.id} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                            <p className="text-slate-200 text-sm font-medium">{l.name || l.email}</p>
                            {l.company && <p className="text-slate-500 text-xs">{l.company}</p>}
                            {l.industry && <p className="text-slate-500 text-xs">{l.industry}</p>}
                            <p className="text-slate-600 text-xs mt-1">{new Date(l.created_at).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RecruitAI Media Library */}
        {activeTab === 'media' && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <RecruitMediaLibraryTab />
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
