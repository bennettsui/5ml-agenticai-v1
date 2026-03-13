'use client';

import { useState } from 'react';
import { Download, Loader2, Zap, Lock, CheckCircle2, XCircle, Package } from 'lucide-react';
import type { QRUser } from './AuthModal';

interface BatchPanelProps {
  user: QRUser | null;
  token: string | null;
  onCreditsChange: (credits: number, freeGensToday: number) => void;
  onAuthRequired: (mode?: 'login' | 'register') => void;
  onTopupRequired: () => void;
}

interface BatchResult {
  content: string;
  data?: string;
  mimeType?: string;
  ext?: string;
  error?: string;
}

const BATCH_TYPES = [
  { id: 'qr', label: 'QR Code' },
  { id: 'ean13', label: 'EAN-13' },
  { id: 'ean8', label: 'EAN-8' },
  { id: 'upca', label: 'UPC-A' },
  { id: 'code128', label: 'Code 128' },
];

export default function BatchPanel({ user, token, onCreditsChange, onAuthRequired, onTopupRequired }: BatchPanelProps) {
  const [rawInput, setRawInput] = useState('https://example.com/product/1\nhttps://example.com/product/2\nhttps://example.com/product/3');
  const [batchType, setBatchType] = useState('qr');
  const [size, setSize] = useState(300);
  const [height, setHeight] = useState(80);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  const items = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
  const itemCount = items.length;
  const creditsNeeded = itemCount;

  async function runBatch() {
    if (!user || !token) { onAuthRequired('register'); return; }
    if (itemCount === 0) { setError('Enter at least one item'); return; }
    if (itemCount > 100) { setError('Maximum 100 items per batch'); return; }
    if ((user.credits ?? 0) < creditsNeeded) { onTopupRequired(); return; }
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/qr/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items, type: batchType, size, height, fgColor, bgColor }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_CREDITS') { onTopupRequired(); return; }
        throw new Error(data.error || 'Batch failed');
      }
      setResults(data.results);
      setCreditsUsed(data.creditsUsed);
      setRemainingCredits(data.credits);
      onCreditsChange(data.credits, user.freeGensToday);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Batch generation failed');
    } finally {
      setLoading(false);
    }
  }

  function downloadAll() {
    const successful = results.filter(r => r.data && !r.error);
    if (successful.length === 0) return;
    // Download each as individual file (ZIP would need JSZip — use sequential download for now)
    successful.forEach((r, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `data:${r.mimeType};base64,${r.data}`;
        const label = r.content.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
        link.download = `${batchType}-${i + 1}-${label}.${r.ext}`;
        link.click();
      }, i * 150);
    });
  }

  function downloadSingle(r: BatchResult, i: number) {
    if (!r.data) return;
    const link = document.createElement('a');
    link.href = `data:${r.mimeType};base64,${r.data}`;
    const label = r.content.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    link.download = `${batchType}-${i + 1}-${label}.${r.ext}`;
    link.click();
  }

  const successCount = results.filter(r => !r.error).length;
  const failCount = results.filter(r => r.error).length;

  return (
    <div className="space-y-6">
      {!user && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <Lock size={16} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Account required for batch export</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Batch generation costs 1 credit per item.{' '}
              <button onClick={() => onAuthRequired('register')} className="underline hover:text-amber-300">Create a free account</button> to get started.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input + options */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Items to generate — one per line
              <span className="ml-2 text-slate-600">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
            </label>
            <textarea
              value={rawInput} onChange={e => setRawInput(e.target.value)} rows={8}
              placeholder="https://example.com/product/1&#10;https://example.com/product/2&#10;5901234123457&#10;..."
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Barcode / QR Type</label>
            <div className="flex flex-wrap gap-2">
              {BATCH_TYPES.map(t => (
                <button
                  key={t.id} onClick={() => setBatchType(t.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    batchType === t.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Size: <span className="text-indigo-400">{size}px</span></label>
              <input type="range" min={100} max={600} step={50} value={size} onChange={e => setSize(Number(e.target.value))} className="w-full accent-indigo-500" />
            </div>
            {batchType !== 'qr' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Height: <span className="text-indigo-400">{height}px</span></label>
                <input type="range" min={40} max={200} step={10} value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full accent-indigo-500" />
              </div>
            )}
          </div>

          {/* Colors */}
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

          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>}

          {/* Cost estimate + run */}
          <div className="flex items-center gap-3 pt-1">
            {user && itemCount > 0 && (
              <div className={`text-xs px-3 py-1.5 rounded-lg border ${(user.credits ?? 0) >= creditsNeeded ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {creditsNeeded} credit{creditsNeeded !== 1 ? 's' : ''} for {itemCount} item{itemCount !== 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={runBatch}
              disabled={loading || itemCount === 0 || itemCount > 100}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              {loading ? `Generating…` : `Generate All (${itemCount})`}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={13} /> {successCount} succeeded</span>
                  {failCount > 0 && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={13} /> {failCount} failed</span>}
                  {creditsUsed !== null && <span className="text-xs text-amber-400">{creditsUsed} credits used</span>}
                </div>
                {successCount > 0 && (
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Package size={13} /> Download All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${r.error ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/40 border-slate-700/50'}`}
                  >
                    {r.data ? (
                      <div className="bg-white p-1 rounded shrink-0">
                        <img src={`data:${r.mimeType};base64,${r.data}`} alt="" className="h-10 w-auto" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center shrink-0">
                        <XCircle size={20} className="text-red-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-slate-300 truncate">{r.content}</p>
                      {r.error && <p className="text-xs text-red-400 mt-0.5">{r.error}</p>}
                    </div>
                    {r.data && (
                      <button
                        onClick={() => downloadSingle(r, i)}
                        className="shrink-0 p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {results.length === 0 && !loading && (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-center min-h-64">
              <div className="text-center text-slate-600 p-8">
                <Package size={36} className="mx-auto mb-3 text-slate-700" />
                <p className="text-sm">Results will appear here</p>
                <p className="text-xs text-slate-700 mt-1">Up to 100 items per batch</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-center min-h-64">
              <div className="text-center p-8">
                <Loader2 size={32} className="mx-auto mb-3 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-400">Generating {itemCount} items…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
