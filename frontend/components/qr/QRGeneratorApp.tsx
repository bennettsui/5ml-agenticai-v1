'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  QrCode, BarChart2, Package, LogOut, Zap, History, ChevronRight,
  User, Coins, RefreshCw, ExternalLink, Cpu, Layers, Sparkles,
  ImageIcon, Maximize2, Download, ArrowDown, Shield, Clock,
} from 'lucide-react';
import AuthModal, { type QRUser } from './AuthModal';
import QRPanel from './QRPanel';
import BarcodePanel from './BarcodePanel';
import BatchPanel from './BatchPanel';
import CreditTopupModal from './CreditTopupModal';
import NFC3DOrderModal from './NFC3DOrderModal';

type Tab = 'qr' | 'barcode' | 'batch';

const TABS: { id: Tab; label: string; icon: typeof QrCode; badge?: string }[] = [
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'barcode', label: 'Barcode', icon: BarChart2 },
  { id: 'batch', label: 'Batch Export', icon: Package, badge: 'Pro' },
];

const FREE_LIMIT = 10;

interface HistoryItem {
  id: string;
  type: string;
  content: string;
  credits_used: number;
  created_at: string;
}

const FEATURES = [
  {
    icon: Maximize2,
    title: 'Up to 2000 × 2000 px',
    desc: 'Print-ready at 300 dpi for A4 posters, signage, and 3D objects.',
    color: 'indigo',
  },
  {
    icon: ImageIcon,
    title: 'Logo overlay',
    desc: 'Drag-and-drop your logo. Error correction auto-switches to H for reliable scanning.',
    color: 'purple',
  },
  {
    icon: BarChart2,
    title: 'All barcode formats',
    desc: 'EAN-13, EAN-8, UPC-A, Code128, Code39, ITF, PDF417, and more.',
    color: 'sky',
  },
  {
    icon: Package,
    title: 'Batch export',
    desc: 'Upload a CSV, generate hundreds of unique codes, and download a ZIP.',
    color: 'emerald',
  },
  {
    icon: Download,
    title: 'PNG + SVG',
    desc: 'Raster for screens, infinitely scalable vector for professional print.',
    color: 'amber',
  },
  {
    icon: Cpu,
    title: '3D Print + NFC chip',
    desc: 'Turn your QR into a physical object — scan it or tap it with any smartphone.',
    color: 'violet',
    nfc: true,
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter your content', desc: 'URL, email, phone, WiFi credentials, vCard, or any plain text.' },
  { step: '02', title: 'Customise', desc: 'Pick resolution, colours, logo, and error-correction level.' },
  { step: '03', title: 'Generate & download', desc: 'Instantly preview, then download PNG or SVG — free, no account needed for basics.' },
  { step: '04', title: 'Order in 3D (optional)', desc: 'Want it physical? Request a 3D-printed + NFC chip version and we\'ll send a quote.' },
];

export default function QRGeneratorApp() {
  const [tab, setTab] = useState<Tab>('qr');
  const [user, setUser] = useState<QRUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showTopup, setShowTopup] = useState(false);
  const [showNFC, setShowNFC] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState<{ data: string; mimeType: string; ext: string } | null>(null);
  const [qrContent, setQrContent] = useState('');
  const toolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('qr_token');
    const savedUser = localStorage.getItem('qr_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        fetch('/api/qr/auth/me', { headers: { Authorization: `Bearer ${savedToken}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) { setUser(data); localStorage.setItem('qr_user', JSON.stringify(data)); } })
          .catch(() => {});
      } catch {}
    }
  }, []);

  function handleAuthSuccess(t: string, u: QRUser) {
    setToken(t); setUser(u);
    localStorage.setItem('qr_token', t);
    localStorage.setItem('qr_user', JSON.stringify(u));
    setShowAuth(false);
  }

  function handleLogout() {
    setToken(null); setUser(null);
    localStorage.removeItem('qr_token');
    localStorage.removeItem('qr_user');
    setShowHistory(false); setHistory([]);
  }

  function handleCreditsChange(credits: number, freeGensToday: number) {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, credits, freeGensToday };
      localStorage.setItem('qr_user', JSON.stringify(updated));
      return updated;
    });
  }

  function handleTopupSuccess(newCredits: number) {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, credits: newCredits };
      localStorage.setItem('qr_user', JSON.stringify(updated));
      return updated;
    });
    setShowTopup(false);
  }

  function openAuth(mode: 'login' | 'register' = 'login') {
    setAuthMode(mode); setShowAuth(true);
  }

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/qr/history', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setHistory(d.history); }
    } finally { setHistoryLoading(false); }
  }, [token]);

  function toggleHistory() {
    if (!showHistory && history.length === 0) loadHistory();
    setShowHistory(v => !v);
  }

  function scrollToTool() {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const freeLeft = user ? Math.max(0, FREE_LIMIT - (user.freeGensToday ?? 0)) : null;

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300',
    purple: 'bg-purple-600/15 border-purple-500/30 text-purple-300',
    sky: 'bg-sky-600/15 border-sky-500/30 text-sky-300',
    emerald: 'bg-emerald-600/15 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-600/15 border-amber-500/30 text-amber-300',
    violet: 'bg-violet-600/15 border-violet-500/30 text-violet-300',
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <QrCode size={20} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">QR & Barcode Generator</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Hi-res · Logo · 3D + NFC</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNFC(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 rounded-xl text-xs font-medium text-violet-300 transition-colors"
            >
              <Cpu size={13} /> 3D + NFC
            </button>

            {user ? (
              <>
                <button onClick={() => setShowTopup(true)} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 rounded-xl text-sm transition-colors group">
                  <Coins size={14} className="text-amber-400" />
                  <span className="font-semibold text-amber-300">{user.credits}</span>
                  <span className="text-amber-500 text-xs hidden sm:inline">credits</span>
                  <Zap size={12} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                {freeLeft !== null && (
                  <div className={`px-3 py-1.5 rounded-xl text-xs border ${freeLeft > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 border-slate-700/50 text-slate-500'}`}>
                    {freeLeft > 0 ? `${freeLeft}/${FREE_LIMIT} free` : 'Free used'}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button onClick={toggleHistory} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors" title="History">
                    <History size={16} />
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-slate-700/50 rounded-xl">
                    <User size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-300 hidden sm:inline max-w-28 truncate">{user.name || user.email}</span>
                    <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors ml-1" title="Log out"><LogOut size={13} /></button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => openAuth('login')} className="px-4 py-1.5 text-sm text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-500 rounded-xl transition-colors">Log In</button>
                <button onClick={() => openAuth('register')} className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors">Sign Up Free</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-slate-800/60">
          {/* Background radial */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute top-10 right-10 w-64 h-64 bg-violet-600/8 rounded-full blur-2xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.04] border border-slate-700/50 rounded-full text-xs text-slate-400 mb-6">
              <Sparkles size={12} className="text-violet-400" />
              Now with 3D Print + NFC chip ordering
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
              Professional QR &amp; Barcode
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Generator
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Generate print-ready codes up to{' '}
              <span className="text-white font-semibold">2000 × 2000 px</span> with logo overlay, custom colours, and SVG export.
              Or go physical — order a{' '}
              <span className="text-violet-300 font-semibold">3D-printed QR with an embedded NFC chip</span> that works with any smartphone.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              <button
                onClick={scrollToTool}
                className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-sm transition-colors shadow-lg shadow-indigo-500/25"
              >
                <Zap size={16} /> Generate for Free
              </button>
              <button
                onClick={() => setShowNFC(true)}
                className="flex items-center gap-2 px-7 py-3 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 font-semibold rounded-2xl text-sm transition-colors"
              >
                <Cpu size={16} /> Order 3D + NFC
              </button>
              {!user && (
                <button
                  onClick={() => openAuth('register')}
                  className="flex items-center gap-2 px-7 py-3 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-2xl text-sm transition-colors"
                >
                  Sign Up Free — 10/day
                </button>
              )}
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              {[
                { icon: Shield, text: 'No data stored' },
                { icon: Clock, text: 'Instant generation' },
                { icon: Download, text: 'PNG & SVG download' },
                { icon: QrCode, text: 'QR + 10 barcode types' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 bg-white/[0.03] border border-slate-800 px-3 py-1.5 rounded-full">
                  <Icon size={11} className="text-slate-600" /> {text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────────────────── */}
        <section className="border-b border-slate-800/60 bg-slate-950/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-center text-xs font-semibold tracking-widest text-slate-500 uppercase mb-8">Everything you need</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(f => (
                <div
                  key={f.title}
                  onClick={f.nfc ? () => setShowNFC(true) : undefined}
                  className={`relative flex gap-4 p-5 rounded-2xl border bg-white/[0.02] border-slate-800/60 hover:border-slate-700/80 transition-colors ${f.nfc ? 'cursor-pointer hover:border-violet-500/40 hover:bg-violet-900/10' : ''}`}
                >
                  {f.nfc && (
                    <span className="absolute top-3 right-3 text-xs bg-violet-600/30 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={9} /> New
                    </span>
                  )}
                  <div className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${colorMap[f.color]}`}>
                    <f.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="border-b border-slate-800/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-center text-xs font-semibold tracking-widest text-slate-500 uppercase mb-8">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((h, i) => (
                <div key={h.step} className="relative text-center">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-5 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-slate-700 to-transparent" />
                  )}
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">{h.step}</div>
                  <p className="text-sm font-semibold text-white mb-1">{h.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3D + NFC upsell banner ───────────────────────────────────────── */}
        <section className="border-b border-slate-800/60 bg-gradient-to-r from-violet-950/40 via-slate-950 to-indigo-950/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div
              onClick={() => setShowNFC(true)}
              className="cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <div className="flex -space-x-2 shrink-0">
                <div className="w-14 h-14 bg-violet-600/30 border border-violet-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/10">
                  <Layers size={24} className="text-violet-300" />
                </div>
                <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <Cpu size={24} className="text-indigo-300" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">Take your QR code into the physical world</h3>
                  <span className="text-xs bg-violet-600/30 text-violet-200 border border-violet-500/30 px-2 py-0.5 rounded-full font-medium">New</span>
                </div>
                <p className="text-sm text-slate-400 max-w-2xl mb-3">
                  We 3D-print your QR code into a weatherproof stand, plaque, keychain, or business card — with an <strong className="text-violet-300">NFC chip embedded inside</strong>. Customers can scan the QR <em>or</em> tap the object with any NFC-capable smartphone. Custom colours (ABS, resin, metal-filled), bulk pricing available.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Smart business cards', 'Restaurant menus', 'Retail POS displays', 'Event check-in badges', 'Hotel room keys', 'Loyalty cards'].map(t => (
                    <span key={t} className="text-xs bg-white/[0.04] border border-slate-700/50 text-slate-500 px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <button className="shrink-0 flex items-center gap-2 px-6 py-3 bg-violet-600 group-hover:bg-violet-500 text-white font-semibold text-sm rounded-2xl transition-colors shadow-lg shadow-violet-500/20">
                Request a Quote <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Generator tool ───────────────────────────────────────────────── */}
        <section ref={toolRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Scroll anchor label */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-800/60" />
            <div className="flex items-center gap-2 text-xs text-slate-500 px-3">
              <ArrowDown size={12} className="text-indigo-400" />
              <span>Generator</span>
            </div>
            <div className="flex-1 h-px bg-slate-800/60" />
          </div>

          {/* Freemium notice (guests only) */}
          {!user && (
            <div className="mb-6 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white mb-1">Free to use — no account needed</h2>
                <p className="text-xs text-slate-400">
                  Basic PNG up to 300px right now. Create a free account for{' '}
                  <strong className="text-slate-200">10 free generations/day</strong>, logo embedding, hi-res up to 2000px, SVG, and batch export.
                </p>
              </div>
              <button onClick={() => openAuth('register')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shrink-0">
                Get Started Free
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-1.5 mb-6">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { if (t.id === 'batch' && !user) { openAuth('register'); return; } setTab(t.id); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <t.icon size={15} />
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${tab === t.id ? 'bg-white/20 text-white' : 'bg-indigo-600/20 text-indigo-400'}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
            {tab === 'qr' && (
              <QRPanel
                user={user} token={token}
                onCreditsChange={handleCreditsChange}
                onAuthRequired={openAuth}
                onTopupRequired={() => setShowTopup(true)}
                onPreviewChange={(p, c) => { setQrPreview(p); setQrContent(c); }}
              />
            )}
            {tab === 'barcode' && (
              <BarcodePanel user={user} token={token} onCreditsChange={handleCreditsChange} onAuthRequired={openAuth} onTopupRequired={() => setShowTopup(true)} />
            )}
            {tab === 'batch' && (
              <BatchPanel user={user} token={token} onCreditsChange={handleCreditsChange} onAuthRequired={openAuth} onTopupRequired={() => setShowTopup(true)} />
            )}
          </div>

          {/* Generation history */}
          {showHistory && user && (
            <div className="mt-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <History size={15} className="text-indigo-400" /> Recent Generations
                </h3>
                <button onClick={loadHistory} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
              {historyLoading ? (
                <div className="text-center py-6 text-slate-500 text-sm">Loading…</div>
              ) : history.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-sm">No generations yet</div>
              ) : (
                <div className="space-y-2">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-slate-700/30 rounded-xl hover:border-slate-600/40 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${h.type === 'qr' ? 'bg-indigo-600/20' : 'bg-purple-600/20'}`}>
                        {h.type === 'qr' ? <QrCode size={14} className="text-indigo-400" /> : <BarChart2 size={14} className="text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-slate-300 truncate">{h.content}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {h.type.toUpperCase()} · {new Date(h.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-md ${h.credits_used === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {h.credits_used === 0 ? 'Free' : `${h.credits_used}cr`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="mt-12">
            <h2 className="text-center text-xs font-semibold tracking-widest text-slate-500 uppercase mb-6">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  title: 'Free',
                  price: '$0',
                  period: 'forever',
                  features: ['Standard QR & barcode', 'PNG · 300 × 300 px', 'Basic colours', 'No account needed'],
                  cta: null,
                  highlight: false,
                },
                {
                  title: 'Credits',
                  price: 'From $5',
                  period: '50 credits',
                  features: ['10 free gens/day', 'Logo embedding', 'Hi-res up to 2000 px', 'SVG vector export', 'Batch export', 'Generation history'],
                  cta: user ? 'Buy Credits' : 'Sign Up & Buy',
                  highlight: true,
                },
                {
                  title: '3D + NFC',
                  price: 'Quote',
                  period: 'per order',
                  features: ['Physical 3D-printed QR', 'Embedded NFC chip', 'Custom colours & material', 'Scan + tap dual-mode', 'Bulk pricing available'],
                  cta: 'Request Quote',
                  highlight: false,
                  nfc: true,
                },
              ].map(plan => (
                <div key={plan.title} className={`rounded-2xl border p-5 ${plan.highlight ? 'bg-indigo-600/10 border-indigo-500/40' : 'nfc' in plan && plan.nfc ? 'bg-violet-900/10 border-violet-500/30' : 'bg-slate-900/40 border-slate-800/60'}`}>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                    <span className="text-xs text-slate-500">/{plan.period}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-3">{plan.title}</h3>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                        <ChevronRight size={11} className={`shrink-0 ${'nfc' in plan && plan.nfc ? 'text-violet-400' : 'text-indigo-400'}`} /> {f}
                      </li>
                    ))}
                  </ul>
                  {plan.cta && (
                    <button
                      onClick={() => 'nfc' in plan && plan.nfc ? setShowNFC(true) : user ? setShowTopup(true) : openAuth('register')}
                      className={`w-full py-2 text-sm font-medium rounded-xl transition-colors ${
                        plan.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'nfc' in plan && plan.nfc ? 'bg-violet-600 hover:bg-violet-500 text-white'
                        : 'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><QrCode size={13} className="text-slate-700" /> QR & Barcode Generator</span>
            <span>·</span>
            <span>Built on 5ML Agentic AI Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowNFC(true)} className="hover:text-slate-400 transition-colors flex items-center gap-1"><Cpu size={11} /> 3D + NFC orders</button>
            <a href="/" className="flex items-center gap-1 hover:text-slate-400 transition-colors">5ML Platform <ExternalLink size={11} /></a>
          </div>
        </div>
      </footer>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showAuth && <AuthModal initialMode={authMode} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}
      {showTopup && token && user && (
        <CreditTopupModal token={token} currentCredits={user.credits} onClose={() => setShowTopup(false)} onSuccess={handleTopupSuccess} />
      )}
      {showNFC && (
        <NFC3DOrderModal previewData={qrPreview} qrContent={qrContent} onClose={() => setShowNFC(false)} />
      )}
    </div>
  );
}
