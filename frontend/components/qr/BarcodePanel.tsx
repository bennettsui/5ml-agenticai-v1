'use client';

import { useState } from 'react';
import { Download, RefreshCw, Loader2, Zap, AlertCircle } from 'lucide-react';
import type { QRUser } from './AuthModal';

interface BarcodePanelProps {
  user: QRUser | null;
  token: string | null;
  onCreditsChange: (credits: number, freeGensToday: number) => void;
  onAuthRequired: (mode?: 'login' | 'register') => void;
  onTopupRequired: () => void;
}

const BARCODE_TYPES = [
  {
    id: 'ean13', label: 'EAN-13', digits: 13, placeholder: '5901234123457',
    desc: 'European Article Number — standard retail product barcode',
    example: '5901234123457',
  },
  {
    id: 'ean8', label: 'EAN-8', digits: 8, placeholder: '96385074',
    desc: 'Compact version for small packages',
    example: '96385074',
  },
  {
    id: 'upca', label: 'UPC-A', digits: 12, placeholder: '012345678905',
    desc: 'Universal Product Code — North American retail standard',
    example: '012345678905',
  },
  {
    id: 'code128', label: 'Code 128', digits: null, placeholder: 'HELLO-WORLD-123',
    desc: 'High-density alphanumeric barcode for logistics & shipping',
    example: 'HELLO-WORLD-123',
  },
  {
    id: 'code39', label: 'Code 39', digits: null, placeholder: 'CODE39',
    desc: 'Alphanumeric — widely used in automotive and defence',
    example: 'CODE39',
  },
];

function validateBarcode(type: string, value: string): string | null {
  if (!value.trim()) return 'Content is required';
  const t = BARCODE_TYPES.find(b => b.id === type);
  if (!t) return null;
  if (t.digits !== null) {
    if (!/^\d+$/.test(value)) return `${t.label} must contain only digits`;
    if (value.length !== t.digits) return `${t.label} requires exactly ${t.digits} digits (got ${value.length})`;
  }
  return null;
}

export default function BarcodePanel({ user, token, onCreditsChange, onAuthRequired, onTopupRequired }: BarcodePanelProps) {
  const [barcodeType, setBarcodeType] = useState('ean13');
  const [content, setContent] = useState('5901234123457');
  const [height, setHeight] = useState(80);
  const [size, setSize] = useState(300);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showText, setShowText] = useState(true);
  const [preview, setPreview] = useState<{ data: string; mimeType: string; ext: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCost, setLastCost] = useState<{ creditsUsed: number; freeGen: boolean } | null>(null);

  const selected = BARCODE_TYPES.find(b => b.id === barcodeType)!;
  const validationError = validateBarcode(barcodeType, content);

  function handleTypeChange(id: string) {
    const t = BARCODE_TYPES.find(b => b.id === id)!;
    setBarcodeType(id);
    setContent(t.example);
    setError('');
    setPreview(null);
  }

  async function generate() {
    const ve = validateBarcode(barcodeType, content);
    if (ve) { setError(ve); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type: barcodeType, content: content.trim(), size, height, fgColor, bgColor, showText }),
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

  function download() {
    if (!preview) return;
    const link = document.createElement('a');
    link.href = `data:${preview.mimeType};base64,${preview.data}`;
    link.download = `barcode-${barcodeType}-${Date.now()}.${preview.ext}`;
    link.click();
  }

  const freeGensLeft = user ? Math.max(0, (user.freeLimit ?? 10) - user.freeGensToday) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Config */}
      <div className="space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Barcode Type</label>
          <div className="grid grid-cols-1 gap-2">
            {BARCODE_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  barcodeType === t.id
                    ? 'bg-indigo-600/15 border-indigo-500/60 text-indigo-200'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.label}</span>
                  {t.digits && <span className="text-xs text-slate-500">{t.digits} digits</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {selected.label} Content
            {selected.digits && <span className="ml-1.5 text-slate-600">({selected.digits} digits)</span>}
          </label>
          <input
            type="text" value={content} onChange={e => { setContent(e.target.value); setError(''); }}
            placeholder={selected.placeholder}
            className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
              validationError && content ? 'border-red-500/60 focus:border-red-500' : 'border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40'
            }`}
          />
          {validationError && content && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
              <AlertCircle size={12} /> {validationError}
            </div>
          )}
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Width: <span className="text-indigo-400 font-semibold">{size}px</span>
            </label>
            <input type="range" min={100} max={800} step={50} value={size} onChange={e => setSize(Number(e.target.value))} className="w-full accent-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Height: <span className="text-indigo-400 font-semibold">{height}px</span>
            </label>
            <input type="range" min={40} max={200} step={10} value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full accent-indigo-500" />
          </div>
        </div>

        {/* Colors + show text */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Bar colour</label>
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

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setShowText(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${showText ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showText ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-300">Show text below barcode</span>
        </label>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>}

        <div className="flex items-center gap-3 pt-1">
          {freeGensLeft !== null && (
            <div className={`text-xs px-3 py-1.5 rounded-lg border ${freeGensLeft > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              {freeGensLeft > 0 ? `${freeGensLeft} free left today` : '1 credit'}
            </div>
          )}
          {!user && <div className="text-xs text-slate-500 bg-white/[0.03] border border-slate-700/50 px-3 py-1.5 rounded-lg">Guest: basic PNG</div>}
          <button
            onClick={generate} disabled={loading || !!validationError || !content.trim()}
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
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <img
                  src={`data:${preview.mimeType};base64,${preview.data}`}
                  alt={`${selected.label} barcode`}
                  className="max-w-full max-h-48"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              {lastCost && (
                <div className={`text-xs px-3 py-1 rounded-full ${lastCost.freeGen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {lastCost.freeGen ? 'Free generation used' : `${lastCost.creditsUsed} credit${lastCost.creditsUsed > 1 ? 's' : ''} used`}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-600 p-8">
              <div className="w-32 h-16 mx-auto mb-4 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center">
                <div className="flex gap-0.5 h-8 items-end">
                  {[4,7,3,8,5,6,9,4,7,3,6,5,8].map((h, i) => (
                    <div key={i} className="w-1 bg-slate-700 rounded-sm" style={{ height: `${h * 4}px` }} />
                  ))}
                </div>
              </div>
              <p className="text-sm">Your barcode will appear here</p>
              <p className="text-xs text-slate-700 mt-1">Shown on white background for readability</p>
            </div>
          )}
        </div>

        {preview && (
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-medium text-sm rounded-xl transition-colors"
          >
            <Download size={15} /> Download PNG
          </button>
        )}

        {/* Info box */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 mb-2">About {selected.label}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{selected.desc}</p>
          {selected.digits && (
            <div className="mt-2.5 p-2.5 bg-white/[0.03] rounded-lg">
              <p className="text-xs text-slate-500">Example: <span className="font-mono text-slate-300">{selected.example}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
