'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  QrCode, BarChart2, Package, LogOut, Zap, History, ChevronRight,
  User, Coins, RefreshCw, ExternalLink,
} from 'lucide-react';
import AuthModal, { type QRUser } from './AuthModal';
import QRPanel from './QRPanel';
import BarcodePanel from './BarcodePanel';
import BatchPanel from './BatchPanel';
import CreditTopupModal from './CreditTopupModal';

type Tab = 'qr' | 'barcode' | 'batch';

const TABS: { id: Tab; label: string; icon: typeof QrCode; badge?: string }[] = [
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'barcode', label: 'Barcode', icon: BarChart2 },
  { id: 'batch', label: 'Batch Export', icon: Package, badge: 'Pro' },
];

const FREE_LIMIT = 10;

export default function QRGeneratorApp() {
  const [tab, setTab] = useState<Tab>('qr');
  const [user, setUser] = useState<QRUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showTopup, setShowTopup] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  interface HistoryItem {
    id: string;
    type: string;
    content: string;
    credits_used: number;
    created_at: string;
  }

  // Load auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('qr_token');
    const savedUser = localStorage.getItem('qr_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Refresh user data
        fetch('/api/qr/auth/me', { headers: { Authorization: `Bearer ${savedToken}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) { setUser(data); localStorage.setItem('qr_user', JSON.stringify(data)); } })
          .catch(() => {});
      } catch {}
    }
  }, []);

  function handleAuthSuccess(t: string, u: QRUser) {
    setToken(t);
    setUser(u);
    localStorage.setItem('qr_token', t);
    localStorage.setItem('qr_user', JSON.stringify(u));
    setShowAuth(false);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('qr_token');
    localStorage.removeItem('qr_user');
    setShowHistory(false);
    setHistory([]);
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
    setAuthMode(mode);
    setShowAuth(true);
  }

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/qr/history', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setHistory(d.history); }
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  function toggleHistory() {
    if (!showHistory && history.length === 0) loadHistory();
    setShowHistory(v => !v);
  }

  const freeLeft = user ? Math.max(0, FREE_LIMIT - (user.freeGensToday ?? 0)) : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <QrCode size={20} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">QR & Barcode Generator</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Professional codes, instantly</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Credit display */}
                <button
                  onClick={() => setShowTopup(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 rounded-xl text-sm transition-colors group"
                >
                  <Coins size={14} className="text-amber-400" />
                  <span className="font-semibold text-amber-300">{user.credits}</span>
                  <span className="text-amber-500 text-xs hidden sm:inline">credits</span>
                  <Zap size={12} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Free gens indicator */}
                {freeLeft !== null && (
                  <div className={`px-3 py-1.5 rounded-xl text-xs border ${freeLeft > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 border-slate-700/50 text-slate-500'}`}>
                    {freeLeft > 0 ? `${freeLeft}/${FREE_LIMIT} free` : 'Free used'}
                  </div>
                )}

                {/* User menu */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleHistory}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
                    title="Generation history"
                  >
                    <History size={16} />
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-slate-700/50 rounded-xl">
                    <User size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-300 hidden sm:inline max-w-28 truncate">{user.name || user.email}</span>
                    <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors ml-1" title="Log out">
                      <LogOut size={13} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuth('login')}
                  className="px-4 py-1.5 text-sm text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-500 rounded-xl transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Freemium banner (unauthenticated) */}
        {!user && (
          <div className="mb-6 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white mb-1">Free to use — no account needed</h2>
              <p className="text-xs text-slate-400">
                Generate QR codes and barcodes instantly. Create a free account for <strong className="text-slate-200">10 free generations/day</strong>, logo embedding, SVG export, batch processing, and your history.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openAuth('register')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
                Get Started Free
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-1.5 mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'batch' && !user) { openAuth('register'); return; }
                setTab(t.id);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
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
            />
          )}
          {tab === 'barcode' && (
            <BarcodePanel
              user={user} token={token}
              onCreditsChange={handleCreditsChange}
              onAuthRequired={openAuth}
              onTopupRequired={() => setShowTopup(true)}
            />
          )}
          {tab === 'batch' && (
            <BatchPanel
              user={user} token={token}
              onCreditsChange={handleCreditsChange}
              onAuthRequired={openAuth}
              onTopupRequired={() => setShowTopup(true)}
            />
          )}
        </div>

        {/* History panel (slide-in) */}
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

        {/* Pricing summary */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Free',
              price: '$0',
              period: 'forever',
              features: ['10 QR / barcode per day', 'PNG export', 'Up to 300×300px', 'Basic colours', 'No account needed'],
              cta: null,
              highlight: false,
            },
            {
              title: 'Credits',
              price: 'From $5',
              period: '50 credits',
              features: ['Everything in Free', 'Logo embedding', 'SVG export', 'High resolution', 'Batch export', 'Generation history'],
              cta: user ? 'Buy Credits' : 'Sign Up & Buy',
              highlight: true,
            },
            {
              title: 'Business',
              price: '$30',
              period: '500 credits',
              features: ['All Credit features', '500 credits included', 'Team collaboration (soon)', 'API access (soon)', 'Priority support'],
              cta: user ? 'Buy Credits' : 'Sign Up',
              highlight: false,
            },
          ].map(plan => (
            <div key={plan.title} className={`rounded-2xl border p-5 ${plan.highlight ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-900/40 border-slate-800/60'}`}>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-white">{plan.price}</span>
                <span className="text-xs text-slate-500">/{plan.period}</span>
              </div>
              <h3 className="font-semibold text-white text-sm mb-3">{plan.title}</h3>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                    <ChevronRight size={11} className="text-indigo-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {plan.cta && (
                <button
                  onClick={() => user ? setShowTopup(true) : openAuth('register')}
                  className={`w-full py-2 text-sm font-medium rounded-xl transition-colors ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'}`}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>QR & Barcode Generator — Built on 5ML Agentic AI Platform</span>
          <a href="/" className="flex items-center gap-1 hover:text-slate-400 transition-colors">
            5ML Platform <ExternalLink size={11} />
          </a>
        </div>
      </footer>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showAuth && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
      {showTopup && token && user && (
        <CreditTopupModal
          token={token}
          currentCredits={user.credits}
          onClose={() => setShowTopup(false)}
          onSuccess={handleTopupSuccess}
        />
      )}
    </div>
  );
}
