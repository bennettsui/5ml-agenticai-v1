'use client';

/**
 * EventFlow — Reception Staff Page
 * Mobile-optimized check-in interface for front-desk / RD reception staff.
 * Auth: same PIN-based kiosk auth as checkin.html (POST /api/eventflow/checkin/auth).
 * Features: name search, QR scan (camera), one-tap check-in, live stats.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventInfo {
  id: number;
  title: string;
  location: string | null;
  start_at: string;
  timezone: string;
  stats: { total: number; checked_in: number };
}

interface Attendee {
  id: number;
  first_name: string;
  last_name: string;
  organization: string | null;
  tier_name: string | null;
  tier_color: string | null;
  status: string;
  registration_code: string;
  event_id: number;
}

type Mode = 'login' | 'home' | 'search' | 'qr' | 'confirm';

const TIER_COLORS: Record<string, string> = {
  Blue: '#3b82f6', Red: '#ef4444', Green: '#22c55e', Purple: '#a855f7', default: '#f59e0b',
};

function statusBadge(status: string) {
  if (status === 'checked_in') return 'bg-green-500/20 text-green-400 border border-green-500/30';
  if (status === 'cancelled') return 'bg-red-500/20 text-red-400 border border-red-500/30';
  return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
}

function statusLabel(status: string) {
  if (status === 'checked_in') return 'Checked In';
  if (status === 'cancelled') return 'Cancelled';
  return 'Registered';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReceptionPage() {
  // Auth state
  const [mode, setMode] = useState<Mode>('login');
  const [eventId, setEventId] = useState('');
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authing, setAuthing] = useState(false);
  const [event, setEvent] = useState<EventInfo | null>(null);

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Attendee[]>([]);
  const [searching, setSearching] = useState(false);

  // QR / confirm state
  const [scanned, setScanned] = useState<Attendee | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<{ success: boolean; msg: string } | null>(null);
  const [checking, setChecking] = useState(false);

  // Live stats
  const [stats, setStats] = useState<{ total: number; checked_in: number } | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // ─── Auth ────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthing(true);
    setAuthError('');
    try {
      const res = await fetch(`${API}/api/eventflow/checkin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: parseInt(eventId), pin }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || 'Invalid credentials'); setAuthing(false); return; }
      setEvent(data.event);
      setStats(data.event.stats);
      setMode('home');
      startSSE(data.event.id);
    } catch {
      setAuthError('Connection error');
    }
    setAuthing(false);
  }

  function handleLogout() {
    sseRef.current?.close();
    sseRef.current = null;
    setEvent(null); setStats(null); setQuery(''); setResults([]);
    setScanned(null); setConfirmMsg(null);
    setEventId(''); setPin('');
    setMode('login');
  }

  // ─── SSE for live stats ──────────────────────────────────────────────────

  function startSSE(id: number) {
    sseRef.current?.close();
    const es = new EventSource(`${API}/api/eventflow/checkin/events/${id}/stream`);
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (d.type === 'attendee_checkedin') {
          setStats((prev) => prev ? { ...prev, checked_in: prev.checked_in + 1 } : prev);
        }
      } catch {}
    };
    sseRef.current = es;
  }

  useEffect(() => () => { sseRef.current?.close(); }, []);

  // ─── Name search ─────────────────────────────────────────────────────────

  const doSearch = useCallback(async (q: string) => {
    if (!event || q.trim().length < 1) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API}/api/eventflow/checkin/events/${event.id}/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.attendees || []);
    } catch { setResults([]); }
    setSearching(false);
  }, [event]);

  function handleQueryChange(q: string) {
    setQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(q), 300);
  }

  // ─── QR scan (HTML5 camera) ───────────────────────────────────────────────

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrScanInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraError, setCameraError] = useState('');

  async function startCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Poll canvas for QR — use BarcodeDetector if available
      qrScanInterval.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const v = videoRef.current;
        if (v.readyState < 2) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        canvasRef.current.width = v.videoWidth;
        canvasRef.current.height = v.videoHeight;
        ctx.drawImage(v, 0, 0);
        try {
          const bd = (window as any).BarcodeDetector;
          if (bd) {
            const detector = new bd({ formats: ['qr_code'] });
            const codes = await detector.detect(canvasRef.current);
            if (codes.length > 0) {
              const raw = codes[0].rawValue as string;
              const code = raw.split('/').pop() || raw;
              if (code) handleQRCode(code);
            }
          }
        } catch {}
      }, 500);
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable. Use name search instead.');
    }
  }

  function stopCamera() {
    if (qrScanInterval.current) { clearInterval(qrScanInterval.current); qrScanInterval.current = null; }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }

  useEffect(() => {
    if (mode === 'qr') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [mode]);

  async function handleQRCode(code: string) {
    stopCamera();
    try {
      const res = await fetch(`${API}/api/eventflow/checkin/scan/${code}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setConfirmMsg({ success: false, msg: data.error || 'QR not found' }); setMode('confirm'); return; }
      setScanned(data.attendee);
      setMode('confirm');
    } catch {
      setConfirmMsg({ success: false, msg: 'Scan failed' });
      setMode('confirm');
    }
  }

  // ─── Check-in action ─────────────────────────────────────────────────────

  async function handleCheckIn(attendee: Attendee) {
    setScanned(attendee);
    setChecking(true);
    setConfirmMsg(null);
    try {
      const res = await fetch(`${API}/api/eventflow/checkin/checkin/${attendee.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setConfirmMsg({ success: false, msg: data.error || 'Check-in failed' }); setMode('confirm'); setChecking(false); return; }
      if (data.already) {
        setConfirmMsg({ success: false, msg: 'Already checked in earlier' });
      } else {
        setConfirmMsg({ success: true, msg: 'Check-in successful!' });
        setStats((prev) => prev ? { ...prev, checked_in: prev.checked_in + 1 } : prev);
      }
      setMode('confirm');
    } catch {
      setConfirmMsg({ success: false, msg: 'Network error' });
      setMode('confirm');
    }
    setChecking(false);
  }

  function resetToHome() {
    setScanned(null); setConfirmMsg(null); setQuery(''); setResults([]);
    setMode('home');
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const checkinRate = stats && stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0;

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  if (mode === 'login') return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎫</div>
          <h1 className="text-2xl font-black text-white">Reception</h1>
          <p className="text-slate-500 text-sm mt-1">EventFlow Check-in Staff</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Event ID</label>
            <input
              type="number" required value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="e.g. 12"
              className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] rounded-xl text-white text-base focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Check-in PIN</label>
            <input
              type="password" required value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-3 bg-slate-900 border border-white/[0.08] rounded-xl text-white text-base focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button type="submit" disabled={authing}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-colors text-base">
            {authing ? 'Connecting…' : 'Enter →'}
          </button>
        </form>
      </div>
    </div>
  );

  // ─── HOME ─────────────────────────────────────────────────────────────────

  if (mode === 'home') return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Reception</p>
          <h1 className="font-bold text-base truncate max-w-[200px]">{event?.title}</h1>
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]">
          Lock
        </button>
      </div>

      {/* Stats bar */}
      <div className="px-5 py-4 bg-slate-900/40 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Check-in progress</span>
          <span className="text-xs font-bold text-amber-400">{stats?.checked_in ?? 0} / {stats?.total ?? 0}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${checkinRate}%` }} />
        </div>
        <p className="text-xs text-slate-600 mt-1.5 text-right">{checkinRate}% arrived</p>
      </div>

      {/* Actions */}
      <div className="flex-1 px-5 py-6 space-y-4">
        <button onClick={() => setMode('search')}
          className="w-full flex items-center gap-4 p-5 bg-slate-800/60 border border-white/[0.08] rounded-2xl hover:border-amber-500/40 hover:bg-amber-500/[0.04] transition-all text-left">
          <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🔍</div>
          <div>
            <div className="font-bold text-base">Name Search</div>
            <div className="text-slate-500 text-sm mt-0.5">Find attendee by name or email</div>
          </div>
          <span className="ml-auto text-slate-600 text-lg">›</span>
        </button>

        <button onClick={() => setMode('qr')}
          className="w-full flex items-center gap-4 p-5 bg-slate-800/60 border border-white/[0.08] rounded-2xl hover:border-amber-500/40 hover:bg-amber-500/[0.04] transition-all text-left">
          <div className="w-12 h-12 bg-purple-500/15 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📷</div>
          <div>
            <div className="font-bold text-base">Scan QR Code</div>
            <div className="text-slate-500 text-sm mt-0.5">Camera scan from email or phone</div>
          </div>
          <span className="ml-auto text-slate-600 text-lg">›</span>
        </button>
      </div>

      {/* Event info footer */}
      {event?.location && (
        <div className="px-5 pb-8 text-center">
          <p className="text-xs text-slate-600">📍 {event.location}</p>
        </div>
      )}
    </div>
  );

  // ─── SEARCH ───────────────────────────────────────────────────────────────

  if (mode === 'search') return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="bg-slate-900/80 border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={resetToHome} className="text-slate-400 hover:text-white transition-colors text-xl px-1">‹</button>
        <input
          autoFocus type="text" value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Name or email…"
          className="flex-1 bg-transparent text-white text-base placeholder:text-slate-600 focus:outline-none"
        />
        {searching && <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin flex-shrink-0" />}
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && query.trim().length > 0 && !searching && (
          <div className="text-center py-12 text-slate-500 text-sm">No attendees found</div>
        )}
        {results.length === 0 && query.trim().length === 0 && (
          <div className="text-center py-12 text-slate-600 text-sm">Start typing to search</div>
        )}
        {results.map((a) => {
          const color = TIER_COLORS[a.tier_color || ''] || TIER_COLORS.default;
          const alreadyIn = a.status === 'checked_in';
          return (
            <div key={a.id} className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: color + '33', border: `1px solid ${color}44` }}>
                {a.first_name[0]}{a.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{a.first_name} {a.last_name}</div>
                <div className="text-slate-500 text-xs truncate">{a.organization || a.registration_code}</div>
                {a.tier_name && <div className="text-xs mt-0.5" style={{ color }}>{a.tier_name}</div>}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(a.status)}`}>
                  {statusLabel(a.status)}
                </span>
                {!alreadyIn && a.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCheckIn(a)}
                    disabled={checking}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                    Check In
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── QR SCAN ─────────────────────────────────────────────────────────────

  if (mode === 'qr') return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80">
        <button onClick={resetToHome} className="text-slate-400 hover:text-white transition-colors text-xl px-1">‹</button>
        <span className="font-bold">Scan QR Code</span>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center">
        <video ref={videoRef} className="w-full max-w-lg aspect-square object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />
          </div>
        </div>

        {cameraError && (
          <div className="absolute inset-x-4 bottom-24 bg-red-900/80 text-red-200 text-sm text-center px-4 py-3 rounded-xl">
            {cameraError}
          </div>
        )}
      </div>

      <div className="bg-black/80 px-6 py-4 text-center">
        <p className="text-slate-400 text-sm">Point camera at the QR code on their email or phone</p>
        <button onClick={() => setMode('search')} className="mt-3 text-amber-400 text-sm underline">
          Switch to name search instead
        </button>
      </div>
    </div>
  );

  // ─── CONFIRM (after scan or direct check-in) ──────────────────────────────

  if (mode === 'confirm') {
    const a = scanned;
    const success = confirmMsg?.success;
    const color = a ? (TIER_COLORS[a.tier_color || ''] || TIER_COLORS.default) : '#f59e0b';

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        {/* Result icon */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 ${
          success ? 'bg-green-500/15' : confirmMsg ? 'bg-red-500/15' : 'bg-slate-800'
        }`}>
          {success ? '✅' : confirmMsg ? '⚠️' : '🎫'}
        </div>

        {/* Message */}
        {confirmMsg && (
          <p className={`text-xl font-bold mb-2 ${success ? 'text-green-400' : 'text-amber-400'}`}>
            {confirmMsg.msg}
          </p>
        )}

        {/* Attendee card */}
        {a && (
          <div className="w-full max-w-sm bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
                style={{ background: color + '33', border: `1px solid ${color}44` }}>
                {a.first_name[0]}{a.last_name[0]}
              </div>
              <div>
                <div className="font-black text-lg">{a.first_name} {a.last_name}</div>
                {a.organization && <div className="text-slate-400 text-sm">{a.organization}</div>}
              </div>
            </div>
            {a.tier_name && (
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span style={{ color }}>{a.tier_name}</span>
              </div>
            )}
            <div className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(success ? 'checked_in' : a.status)}`}>
              {success ? 'Checked In ✓' : statusLabel(a.status)}
            </div>
          </div>
        )}

        {/* If not yet checked in (QR scan result before confirming) */}
        {a && !confirmMsg && a.status !== 'checked_in' && a.status !== 'cancelled' && (
          <button onClick={() => handleCheckIn(a)} disabled={checking}
            className="w-full max-w-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl transition-colors text-lg mb-4">
            {checking ? 'Checking in…' : 'Confirm Check-in →'}
          </button>
        )}

        <button onClick={resetToHome}
          className="w-full max-w-sm bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-2xl transition-colors">
          ← Back to Home
        </button>
      </div>
    );
  }

  return null;
}
