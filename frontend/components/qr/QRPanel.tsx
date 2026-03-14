'use client';

import { useState, useCallback, useRef } from 'react';
import { Download, RefreshCw, Upload, X, Loader2, Lock, Zap } from 'lucide-react';
import type { QRUser } from './AuthModal';

interface QRPanelProps {
  user: QRUser | null;
  token: string | null;
  onCreditsChange: (credits: number, freeGensToday: number) => void;
  onAuthRequired: (mode?: 'login' | 'register') => void;
  onTopupRequired: () => void;
}

const ERROR_LEVELS = [
  { value: 'L', label: 'L (7%)', desc: 'Low — smallest size' },
  { value: 'M', label: 'M (15%)', desc: 'Medium — default' },
  { value: 'Q', label: 'Q (25%)', desc: 'Quartile — more robust' },
  { value: 'H', label: 'H (30%)', desc: 'High — best for logos' },
];

export default function QRPanel({ user, token, onCreditsChange, onAuthRequired, onTopupRequired }: QRPanelProps) {
  const [content, setContent] = useState('https://example.com');
  const [size, setSize] = useState(400);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState('M');
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');
  const [preview, setPreview] = useState<{ data: string; mimeType: string; ext: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCost, setLastCost] = useState<{ creditsUsed: number; freeGen: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPreview({ data: data.data, mimeType: data.mimeType, ext: data.ext });
      setLastCost({ creditsUsed: data.creditsUsed, freeGen: data.freeGen });
      if (data.credits !== undefined) onCreditsChange(data.credits, data.freeGensToday);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => { setLogoData(ev.target?.result as string); setLogoName(file.name); };
    reader.readAsDataURL(file);
  }

  function download() {
    if (!preview) return;
    const link = document.createElement('a');
    link.href = `data:${preview.mimeType};base64,${preview.data}`;
    link.download = `qrcode-${Date.now()}.${preview.ext}`;
    link.click();
  }

  const estCost = calcEstimatedCost();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Config */}
      <div className="space-y-5">
        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Content / URL</label>
          <textarea
            value={content} onChange={e => setContent(e.target.value)} rows={3}
            placeholder="https://example.com  or  plain text  or  vCard…"
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-colors"
          />
        </div>

        {/* Size + Error level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Size: <span className="text-indigo-400 font-semibold">{size}px</span>
              {size > 500 && !user && <span className="ml-1 text-amber-400">(login required)</span>}
            </label>
            <input
              type="range" min={100} max={1000} step={50} value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5">
              <span>100</span><span>1000</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Error Correction</label>
            <select
              value={errorLevel} onChange={e => setErrorLevel(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {ERROR_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Foreground colour</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
              <input
                type="text" value={fgColor} onChange={e => setFgColor(e.target.value)}
                className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Background colour</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
              <input
                type="text" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Export Format</label>
          <div className="flex gap-2">
            {(['png', 'svg'] as const).map(f => (
              <button
                key={f} onClick={() => { if (f === 'svg' && !user) { onAuthRequired('register'); return; } setFormat(f); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                  format === f ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {f === 'svg' && !user && <Lock size={12} />}
                {f.toUpperCase()}
                {f === 'svg' && !user && <span className="text-xs text-amber-400">Pro</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Logo Overlay
            {!user && <span className="ml-1.5 text-amber-400 text-xs">(requires account — 2 credits)</span>}
            {user && <span className="ml-1.5 text-slate-500 text-xs">(2 credits)</span>}
          </label>
          <div className="flex gap-2 items-center">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button
              onClick={() => { if (!user) { onAuthRequired('register'); return; } fileInputRef.current?.click(); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              <Upload size={14} /> {logoData ? 'Change Logo' : 'Upload Logo'}
            </button>
            {logoData && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-slate-400 truncate">{logoName}</span>
                <button onClick={() => { setLogoData(null); setLogoName(''); }} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
              </div>
            )}
          </div>
        </div>

        {/* Cost estimate + Generate */}
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>}

        <div className="flex items-center gap-3 pt-1">
          {estCost && (
            <div className={`text-xs px-3 py-1.5 rounded-lg border ${estCost.cost === 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              {estCost.cost === 0 ? `Free (${estCost.freeLeft} left today)` : estCost.label}
            </div>
          )}
          {!user && (
            <div className="text-xs text-slate-500 bg-white/[0.03] border border-slate-700/50 px-3 py-1.5 rounded-lg">
              Guest: basic PNG, max 300px
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

      {/* Preview */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-center min-h-64 relative overflow-hidden">
          {preview ? (
            <div className="flex flex-col items-center gap-4 p-6">
              <img
                src={`data:${preview.mimeType};base64,${preview.data}`}
                alt="Generated QR code"
                className="max-w-full max-h-72 rounded-lg shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />
              {lastCost && (
                <div className={`text-xs px-3 py-1 rounded-full ${lastCost.freeGen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {lastCost.freeGen ? 'Free generation used' : `${lastCost.creditsUsed} credit${lastCost.creditsUsed > 1 ? 's' : ''} used`}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-600 p-8">
              <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center">
                <RefreshCw size={28} className="text-slate-700" />
              </div>
              <p className="text-sm">Your QR code will appear here</p>
            </div>
          )}
        </div>

        {preview && (
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-medium text-sm rounded-xl transition-colors"
          >
            <Download size={15} /> Download {preview.ext.toUpperCase()}
          </button>
        )}

        {/* Quick presets */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium mb-2.5">Quick content presets</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'URL', value: 'https://example.com' },
              { label: 'Email', value: 'mailto:hello@example.com' },
              { label: 'Phone', value: 'tel:+85291234567' },
              { label: 'WiFi', value: 'WIFI:T:WPA;S:MyNetwork;P:password;;' },
              { label: 'vCard', value: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+85291234567\nEND:VCARD' },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => setContent(p.value)}
                className="text-xs px-2.5 py-1 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 rounded-md transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
