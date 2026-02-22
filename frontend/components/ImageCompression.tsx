'use client';

import { useState, useRef, useCallback } from 'react';
import {
  FileImage, Upload, Zap, CheckCircle2, AlertCircle, Loader2,
  Download, X, RefreshCw, BarChart3, ArrowRight, Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Profile = 'auto' | 'web' | 'thumbnail' | 'lossless' | 'aggressive';
type SubTab  = 'compress' | 'architecture';

interface CompressionResult {
  ok: boolean;
  original_size_bytes: number;
  compressed_size_bytes: number;
  ratio: number;
  original_format: string;
  output_format: string;
  width: number;
  height: number;
  profile_used: string;
  quality_used?: number;
  iterations?: number;
  output_url?: string;
  duration_ms: number;
  logs: string[];
  error?: string;
}

interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'compressing' | 'done' | 'error';
  result?: CompressionResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile definitions
// ─────────────────────────────────────────────────────────────────────────────

const PROFILES: {
  value: Profile;
  label: string;
  description: string;
  detail: string;
  color: string;
  selectedRing: string;
}[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Heuristic — inspects file size, dimensions & tags to pick the best strategy automatically.',
    detail: 'WebP / JPEG · variable quality · no upscaling',
    color: 'text-blue-400',
    selectedRing: 'border-blue-500/40 bg-blue-500/[0.07] ring-1 ring-blue-500/30',
  },
  {
    value: 'web',
    label: 'Web',
    description: 'Optimised for web galleries and blogs. Great visual quality at a fraction of the original size.',
    detail: 'WebP · 80 % quality · max 1920 × 1080',
    color: 'text-teal-400',
    selectedRing: 'border-teal-500/40 bg-teal-500/[0.07] ring-1 ring-teal-500/30',
  },
  {
    value: 'thumbnail',
    label: 'Thumbnail',
    description: 'For card previews, avatars, and list images. Keeps files tiny while remaining crisp.',
    detail: 'WebP · 72 % quality · max 512 × 512',
    color: 'text-amber-400',
    selectedRing: 'border-amber-500/40 bg-amber-500/[0.07] ring-1 ring-amber-500/30',
  },
  {
    value: 'lossless',
    label: 'Lossless',
    description: 'Zero quality loss — only metadata is stripped. Use for archival masters and source assets.',
    detail: 'Original format · lossless · metadata stripped',
    color: 'text-emerald-400',
    selectedRing: 'border-emerald-500/40 bg-emerald-500/[0.07] ring-1 ring-emerald-500/30',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Smallest possible output. Visible artefacts are acceptable. Best when bandwidth is critical.',
    detail: 'AVIF · 55 % quality · max 1920 × 1080',
    color: 'text-rose-400',
    selectedRing: 'border-rose-500/40 bg-rose-500/[0.07] ring-1 ring-rose-500/30',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function reduction(original: number, compressed: number): string {
  if (!original) return '—';
  return `↓ ${(((original - compressed) / original) * 100).toFixed(1)} %`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ImageCompression() {
  const [subTab, setSubTab]   = useState<SubTab>('compress');
  const [files, setFiles]     = useState<FileItem[]>([]);
  const [profile, setProfile] = useState<Profile>('auto');
  const [running, setRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const items: FileItem[] = Array.from(list)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ id: `${Date.now()}-${Math.random()}`, file: f, status: 'pending' }));
    setFiles(prev => [...prev, ...items]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const compressAll = useCallback(async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length) return;
    setRunning(true);

    for (const item of pending) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'compressing' } : f));

      try {
        const fd = new FormData();
        fd.append('file', item.file);
        fd.append('profile', profile);

        const res  = await fetch('/api/compress', { method: 'POST', body: fd });
        const data = await res.json() as CompressionResult;

        setFiles(prev => prev.map(f =>
          f.id === item.id ? { ...f, status: data.ok ? 'done' : 'error', result: data } : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f =>
          f.id === item.id ? {
            ...f,
            status: 'error',
            result: {
              ok: false,
              error: err instanceof Error ? err.message : 'Network error',
              original_size_bytes: 0, compressed_size_bytes: 0, ratio: 0,
              original_format: '', output_format: '', width: 0, height: 0,
              profile_used: profile, duration_ms: 0, logs: [],
            },
          } : f
        ));
      }
    }

    setRunning(false);
  }, [files, profile]);

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount    = files.filter(f => f.status === 'done').length;
  const errorCount   = files.filter(f => f.status === 'error').length;

  const summaryOriginal    = files.filter(f => f.status === 'done').reduce((s, f) => s + (f.result?.original_size_bytes ?? 0), 0);
  const summaryCompressed  = files.filter(f => f.status === 'done').reduce((s, f) => s + (f.result?.compressed_size_bytes ?? 0), 0);
  const avgReduction = (() => {
    const done = files.filter(f => f.status === 'done' && f.result?.ok);
    if (!done.length) return null;
    const avg = done.reduce((s, f) => {
      const r = f.result!;
      return s + ((r.original_size_bytes - r.compressed_size_bytes) / r.original_size_bytes) * 100;
    }, 0) / done.length;
    return avg.toFixed(1);
  })();

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <FileImage className="w-5 h-5 text-rose-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Image Compression</h2>
          <p className="text-xs text-slate-400">Sharp-powered · WebP / AVIF / JPEG / PNG · saved to server</p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Live
        </span>
      </div>

      {/* ── Sub-tab nav ── */}
      <div className="flex gap-1 border-b border-slate-700/50 pb-0">
        {(['compress', 'architecture'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              subTab === t
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {t === 'compress' ? 'Compress' : 'Architecture & API'}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          COMPRESS TAB
      ═══════════════════════════════════════════════════ */}
      {subTab === 'compress' && (
        <div className="space-y-6">

          {/* Step 1 — Upload */}
          <section className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs flex items-center justify-center font-bold shrink-0">1</span>
              Upload Images
            </h3>

            {/* Drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600/60 rounded-xl p-8 text-center cursor-pointer hover:border-rose-500/40 hover:bg-white/[0.02] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <Upload className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Drop images here or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">JPEG · PNG · WebP · AVIF · GIF · multiple files · max 50 MB each</p>
            </div>

            {/* File queue */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      item.status === 'done'        ? 'border-green-500/20 bg-green-500/[0.04]'  :
                      item.status === 'error'       ? 'border-red-500/20 bg-red-500/[0.04]'      :
                      item.status === 'compressing' ? 'border-blue-500/20 bg-blue-500/[0.04]'    :
                      'border-slate-700/50 bg-white/[0.02]'
                    }`}
                  >
                    {/* Status icon */}
                    <div className="shrink-0">
                      {item.status === 'compressing' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                      {item.status === 'done'         && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {item.status === 'error'        && <AlertCircle  className="w-4 h-4 text-red-400" />}
                      {item.status === 'pending'      && <FileImage     className="w-4 h-4 text-slate-500" />}
                    </div>

                    {/* Name + size */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-500">{fmt(item.file.size)}</p>
                    </div>

                    {/* Done: stats + download */}
                    {item.status === 'done' && item.result?.ok && (
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {fmt(item.result.compressed_size_bytes)}
                        </span>
                        <span className="text-xs font-semibold text-green-400">
                          {reduction(item.result.original_size_bytes, item.result.compressed_size_bytes)}
                        </span>
                        {item.result.output_url && (
                          <a
                            href={item.result.output_url}
                            download
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        )}
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === 'error' && (
                      <span className="text-xs text-red-400 shrink-0 max-w-[180px] truncate">
                        {item.result?.error ?? 'Failed'}
                      </span>
                    )}

                    {/* Remove pending */}
                    {item.status === 'pending' && (
                      <button
                        onClick={e => { e.stopPropagation(); removeFile(item.id); }}
                        className="shrink-0 p-1 rounded hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Step 2 — Profile */}
          <section className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs flex items-center justify-center font-bold shrink-0">2</span>
              Choose Compression Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PROFILES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setProfile(p.value)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    profile === p.value
                      ? p.selectedRing
                      : 'border-slate-700/50 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${p.color}`}>{p.label}</span>
                    {profile === p.value && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${p.color}`} />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2 leading-snug">{p.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{p.detail}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 — Action */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={compressAll}
              disabled={running || pendingCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {running
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Compressing…</>
                : <><Zap className="w-4 h-4" /> Compress {pendingCount > 0 ? pendingCount : ''} Image{pendingCount !== 1 ? 's' : ''}</>
              }
            </button>

            {files.length > 0 && !running && (
              <button
                onClick={() => setFiles([])}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-slate-300 hover:bg-white/[0.02] text-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear all
              </button>
            )}

            {(doneCount > 0 || errorCount > 0) && (
              <div className="ml-auto flex items-center gap-3 text-xs">
                {doneCount  > 0 && <span className="text-green-400">{doneCount} compressed</span>}
                {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
              </div>
            )}
          </div>

          {/* Summary banner */}
          {doneCount > 0 && !running && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-300">
                  {doneCount} image{doneCount !== 1 ? 's' : ''} compressed · saved to server
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total original',    value: fmt(summaryOriginal) },
                  { label: 'Total compressed',  value: fmt(summaryCompressed) },
                  { label: 'Avg reduction',     value: avgReduction ? `↓ ${avgReduction} %` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-white/[0.03] border border-slate-700/50 px-3 py-2">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          ARCHITECTURE & API TAB
      ═══════════════════════════════════════════════════ */}
      {subTab === 'architecture' && (
        <div className="space-y-5">

          {/* Profile reference */}
          <div className="rounded-xl border border-slate-700/50 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-300">Profile Reference</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">Profile</th>
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">Use case</th>
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">Format · quality</th>
                    <th className="text-left py-2 text-slate-500 font-medium">Max dims</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {[
                    { p: 'auto',       useCase: 'General / Tender embedding',    fmt: 'JPEG 75%',       dims: '1600 × 900'  },
                    { p: 'web',        useCase: 'Web gallery / blog',            fmt: 'WebP 80%',       dims: '1920 × 1080' },
                    { p: 'web',        useCase: 'Social (tag: social)',          fmt: 'WebP',           dims: '1200 × 1200' },
                    { p: 'thumbnail',  useCase: 'Card preview / avatar',        fmt: 'WebP 72%',       dims: '512 × 512'   },
                    { p: 'lossless',   useCase: 'Archival / source assets',     fmt: 'Original lossless', dims: 'Unlimited' },
                    { p: 'aggressive', useCase: 'Social media / bandwidth-cap', fmt: 'AVIF 55%',       dims: '1920 × 1080' },
                  ].map((row, i) => {
                    const pd = PROFILES.find(x => x.value === row.p);
                    return (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className={`py-2 pr-4 font-semibold ${pd?.color}`}>{row.p}</td>
                        <td className="py-2 pr-4 text-slate-300">{row.useCase}</td>
                        <td className="py-2 pr-4 text-slate-400 font-mono">{row.fmt}</td>
                        <td className="py-2 text-slate-500 font-mono">{row.dims}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* API endpoints */}
          <div className="rounded-xl border border-slate-700/50 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-slate-400" /> API Endpoints
            </h3>
            <div className="space-y-1.5 font-mono text-xs">
              {[
                ['POST', '/api/compress',          'Compress — multipart file upload or JSON { source, profile, … }'],
                ['GET',  '/api/compress/health',   'Sharp service health check'],
                ['GET',  '/api/compress/profiles', 'List available compression profiles'],
              ].map(([method, endpoint, desc]) => (
                <div key={endpoint} className="flex items-start gap-3 py-1">
                  <span className={`shrink-0 w-10 text-center rounded px-1 py-0.5 text-[10px] font-bold ${
                    method === 'POST' ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'
                  }`}>{method}</span>
                  <span className="text-slate-300 shrink-0">{endpoint}</span>
                  <span className="text-slate-500 hidden md:inline">— {desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-slate-700/50 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" /> How It Works
            </h3>
            <ol className="space-y-2 text-xs text-slate-400 list-decimal list-inside">
              <li>File upload or URL is resolved to a Buffer via <code className="bg-white/[0.04] px-1 rounded">imageSource.js</code></li>
              <li>Profile + tags → concrete sharp parameters via <code className="bg-white/[0.04] px-1 rounded">CompressionStrategy.js</code></li>
              <li>Sharp compresses the image; if a <code className="bg-white/[0.04] px-1 rounded">max_size_kb</code> budget is set, <code className="bg-white/[0.04] px-1 rounded">SizeEnforcer.js</code> iteratively reduces quality (up to 8 passes, min quality 20)</li>
              <li>Result saved to <code className="bg-white/[0.04] px-1 rounded">uploads/compressed/</code>, served at <code className="bg-white/[0.04] px-1 rounded">/uploads/compressed/[file]</code></li>
              <li>Skips compression if image &lt; 5 KB or reduction &lt; 5 % (returns original — idempotent)</li>
            </ol>
          </div>

        </div>
      )}
    </div>
  );
}
