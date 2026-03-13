'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Download, RefreshCw, Upload, X, Loader2, Lock, Zap, ImageIcon, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { QRUser } from './AuthModal';

interface QRPanelProps {
  user: QRUser | null;
  token: string | null;
  onCreditsChange: (credits: number, freeGensToday: number) => void;
  onAuthRequired: (mode?: 'login' | 'register') => void;
  onTopupRequired: () => void;
  onPreviewChange?: (preview: { data: string; mimeType: string; ext: string } | null, content: string) => void;
}

const ERROR_LEVELS = [
  { value: 'L', label: 'L — 7%', desc: 'Low — smallest file' },
  { value: 'M', label: 'M — 15%', desc: 'Medium — default' },
  { value: 'Q', label: 'Q — 25%', desc: 'Quartile — robust' },
  { value: 'H', label: 'H — 30%', desc: 'High — required for logo' },
];

const RESOLUTION_PRESETS = [
  { label: 'Standard', px: 300, tag: 'Web / mobile', free: true, dpi: '72 dpi @ 4"' },
  { label: 'HD', px: 600, tag: 'Presentations', free: false, dpi: '150 dpi @ 4"' },
  { label: 'Print', px: 1200, tag: 'Flyers / posters', free: false, dpi: '300 dpi @ 4"' },
  { label: 'Ultra', px: 2000, tag: '3D print / signage', free: false, dpi: '300 dpi @ 6.7"', highlight: true },
];

export default function QRPanel({ user, token, onCreditsChange, onAuthRequired, onTopupRequired, onPreviewChange }: QRPanelProps) {
  const [content, setContent] = useState('https://example.com');
  const [resolutionIdx, setResolutionIdx] = useState(0);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState('M');
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');
  const [logoDragOver, setLogoDragOver] = useState(false);
  const [preview, setPreview] = useState<{ data: string; mimeType: string; ext: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCost, setLastCost] = useState<{ creditsUsed: number; freeGen: boolean } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRes = RESOLUTION_PRESETS[resolutionIdx];
  const size = selectedRes.px;

  // Auto-set H error correction when logo is loaded (recommended for logos)
  useEffect(() => {
    if (logoData && errorLevel !== 'H') setErrorLevel('H');
  }, [logoData]); // eslint-disable-line react-hooks/exhaustive-deps

  const calcEstimatedCost = useCallback(() => {
    if (!user) return null;
    let cost = 0;
    if (logoData) cost += 2;
    if (format === 'svg') cost += 1;
    if (size > 500) cost += 1;
    const freeLeft = Math.max(0, (user.freeLimit ?? 10) - user.freeGensToday);
    if (cost === 0 && freeLeft > 0) return { cost: 0, label: 'Free', freeLeft };
    if (cost === 0) cost = 1;
    return { cost, label: `${cost} credit${cost > 1 ? 's' : ''}`, freeLeft };
  }, [user, logoData, format, size]);

  async function generate() {
    if (!content.trim()) { setError('Content is required'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type: 'qr', content, size, fgColor, bgColor, errorLevel, format, logoData }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'LOGIN_REQUIRED') { onAuthRequired('register'); return; }
        if (data.code === 'INSUFFICIENT_CREDITS') { onTopupRequired(); return; }
        throw new Error(data.error || 'Generation failed');
      }
      const p = { data: data.data, mimeType: data.mimeType, ext: data.ext };
      setPreview(p);
      setLastCost({ creditsUsed: data.creditsUsed, freeGen: data.freeGen });
      if (data.credits !== undefined) onCreditsChange(data.credits, data.freeGensToday);
      onPreviewChange?.(p, content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function processLogoFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (PNG, JPG, SVG…)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setLogoData(ev.target?.result as string);
      setLogoName(file.name);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  function handleLogoInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  }

  function handleLogoDrop(e: React.DragEvent) {
    e.preventDefault();
    setLogoDragOver(false);
    if (!user) { onAuthRequired('register'); return; }
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  }

  function download() {
    if (!preview) return;
    const link = document.createElement('a');
    link.href = `data:${preview.mimeType};base64,${preview.data}`;
    link.download = `qrcode-${size}px-${Date.now()}.${preview.ext}`;
    link.click();
  }

  const estCost = calcEstimatedCost();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Config ─────────────────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Content / URL</label>
          <textarea
            value={content} onChange={e => setContent(e.target.value)} rows={3}
            placeholder="https://example.com  or  plain text  or  vCard…"
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-colors"
          />
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { label: 'URL', value: 'https://example.com' },
              { label: 'Email', value: 'mailto:hello@example.com' },
              { label: 'Phone', value: 'tel:+85291234567' },
              { label: 'WiFi', value: 'WIFI:T:WPA;S:MyNetwork;P:password;;' },
              { label: 'vCard', value: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+85291234567\nEND:VCARD' },
            ].map(p => (
              <button key={p.label} onClick={() => setContent(p.value)} className="text-xs px-2.5 py-1 bg-slate-700/50 hover:bg-slate-600/60 text-slate-400 hover:text-slate-200 rounded-md transition-colors">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution presets */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Resolution</label>
          <div className="grid grid-cols-2 gap-2">
            {RESOLUTION_PRESETS.map((r, i) => {
              const locked = !r.free && !user;
              const active = resolutionIdx === i;
              return (
                <button
                  key={r.label}
                  onClick={() => {
                    if (locked) { onAuthRequired('register'); return; }
                    if (!r.free && !user) return;
                    setResolutionIdx(i);
                  }}
                  className={`relative text-left px-4 py-3 rounded-xl border transition-all ${
                    active
                      ? r.highlight
                        ? 'bg-violet-600/20 border-violet-500/70 shadow-lg shadow-violet-500/10'
                        : 'bg-indigo-600/15 border-indigo-500/60'
                      : locked
                        ? 'bg-slate-800/30 border-slate-800/60 opacity-60 cursor-pointer'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {r.highlight && (
                    <span className="absolute -top-2 right-2 text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full font-medium">Best for 3D</span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${active ? (r.highlight ? 'text-violet-200' : 'text-indigo-200') : 'text-slate-200'}`}>{r.label}</span>
                    {locked && <Lock size={11} className="text-amber-400" />}
                  </div>
                  <p className={`text-xs mt-0.5 font-mono ${active ? 'text-indigo-300' : 'text-slate-500'}`}>{r.px} × {r.px}px</p>
                  <p className="text-xs text-slate-600 mt-0.5">{r.tag}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
            <Info size={11} /> {selectedRes.dpi} · PNG max; Ultra unlocks at {RESOLUTION_PRESETS[1].px}px+ with account
          </p>
        </div>

        {/* Logo Upload — drag-and-drop zone */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-400">
              Logo Overlay
              {user
                ? <span className="ml-1.5 text-slate-500">(2 credits · H error correction auto-enabled)</span>
                : <span className="ml-1.5 text-amber-400">(account required · 2 credits)</span>
              }
            </label>
          </div>

          {logoData ? (
            // Thumbnail preview
            <div className="flex items-center gap-3 p-3 bg-slate-800/60 border border-indigo-500/30 rounded-xl">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                <img src={logoData} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{logoName}</p>
                <p className="text-xs text-slate-500 mt-0.5">Centred on QR · H error correction enabled</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
                >
                  Change logo
                </button>
              </div>
              <button onClick={() => { setLogoData(null); setLogoName(''); }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <X size={15} />
              </button>
            </div>
          ) : (
            // Drag-and-drop zone
            <div
              onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
              onDragLeave={() => setLogoDragOver(false)}
              onDrop={handleLogoDrop}
              onClick={() => { if (!user) { onAuthRequired('register'); return; } fileInputRef.current?.click(); }}
              className={`relative flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                logoDragOver
                  ? 'border-indigo-400 bg-indigo-600/10'
                  : 'border-slate-700/60 hover:border-slate-500 hover:bg-white/[0.02]'
              } ${!user ? 'opacity-70' : ''}`}
            >
              <div className={`p-2.5 rounded-xl ${logoDragOver ? 'bg-indigo-600/20' : 'bg-slate-700/50'}`}>
                <ImageIcon size={20} className={logoDragOver ? 'text-indigo-300' : 'text-slate-400'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">
                  {!user ? 'Sign up to add a logo' : 'Drop your logo here'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">PNG · JPG · SVG · up to 5 MB</p>
              </div>
              {!user && (
                <span className="absolute top-2 right-2">
                  <Lock size={13} className="text-amber-400" />
                </span>
              )}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoInputChange} className="hidden" />
        </div>

        {/* Colours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Foreground</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
              <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Background</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Error correction */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Error Correction
                {logoData && <span className="ml-1 text-emerald-400">auto: H</span>}
              </label>
              <div className="space-y-1.5">
                {ERROR_LEVELS.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setErrorLevel(l.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                      errorLevel === l.value ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200' : 'border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-medium">{l.label}</span>
                    <span className="text-slate-600 ml-2">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Export format */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Export Format</label>
              <div className="space-y-1.5">
                {(['png', 'svg'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => { if (f === 'svg' && !user) { onAuthRequired('register'); return; } setFormat(f); }}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                      format === f ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200' : 'border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-medium">{f.toUpperCase()}</span>
                    <span className="text-slate-600">
                      {f === 'png' ? 'Raster · all sizes' : 'Vector · scalable'}
                      {f === 'svg' && !user && <Lock size={10} className="inline ml-1 text-amber-400" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>}

        {/* Cost estimate + Generate */}
        <div className="flex items-center gap-3 pt-1">
          {estCost && (
            <div className={`text-xs px-3 py-1.5 rounded-lg border ${estCost.cost === 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              {estCost.cost === 0 ? `Free (${estCost.freeLeft} left today)` : estCost.label}
            </div>
          )}
          {!user && (
            <div className="text-xs text-slate-500 bg-white/[0.03] border border-slate-700/50 px-3 py-1.5 rounded-lg">
              Guest: standard PNG only
            </div>
          )}
          <button
            onClick={generate} disabled={loading || !content.trim()}
            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-center min-h-72 relative overflow-hidden">
          {preview ? (
            <div className="flex flex-col items-center gap-4 p-6 w-full">
              <img
                src={`data:${preview.mimeType};base64,${preview.data}`}
                alt="Generated QR code"
                className="max-w-full max-h-80 rounded-xl shadow-2xl shadow-black/40"
              />
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {lastCost && (
                  <div className={`text-xs px-3 py-1 rounded-full ${lastCost.freeGen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {lastCost.freeGen ? 'Free generation' : `${lastCost.creditsUsed} credit${lastCost.creditsUsed > 1 ? 's' : ''} used`}
                  </div>
                )}
                <div className="text-xs px-3 py-1 rounded-full bg-slate-700/60 text-slate-400">
                  {size} × {size}px · {format.toUpperCase()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-600 p-8">
              <div className="w-28 h-28 mx-auto mb-4 border-2 border-dashed border-slate-700/70 rounded-2xl flex items-center justify-center">
                <RefreshCw size={30} className="text-slate-700" />
              </div>
              <p className="text-sm">Your QR code will appear here</p>
              <p className="text-xs text-slate-700 mt-1">Choose resolution, add logo, hit Generate</p>
            </div>
          )}
        </div>

        {preview && (
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-medium text-sm rounded-xl transition-colors"
          >
            <Download size={15} /> Download {size}px {preview.ext.toUpperCase()}
          </button>
        )}

        {/* Resolution info card */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-slate-400">Resolution guide</p>
          <div className="space-y-1.5">
            {RESOLUTION_PRESETS.map((r, i) => (
              <div key={r.label} className={`flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5 ${i === resolutionIdx ? 'bg-indigo-600/10 text-indigo-300' : 'text-slate-500'}`}>
                <span className="font-medium w-16">{r.label}</span>
                <span className="font-mono">{r.px}px</span>
                <span className="text-slate-600">{r.dpi}</span>
                <span className={r.free ? 'text-emerald-500' : 'text-amber-500'}>{r.free ? 'Free' : '1cr'}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 pt-1">Ultra (2000px) is ideal for 3D printing — use Error H with logo.</p>
        </div>
      </div>
    </div>
  );
}
