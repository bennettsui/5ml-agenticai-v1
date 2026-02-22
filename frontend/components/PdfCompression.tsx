'use client';

import { useState, useRef, useCallback } from 'react';
import {
  FileText, Upload, Zap, CheckCircle2, AlertCircle, Loader2,
  Download, X, RefreshCw, Shield, Globe, Minimize2, Layers,
  ChevronDown, ChevronUp, Package, Server, ArrowRight, Clock,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Profile = 'auto' | 'lossless' | 'balanced' | 'web' | 'small';
type SubTab  = 'compress' | 'architecture';

interface CompressResult {
  ok: boolean;
  request_id?: string;
  original_size_bytes?: number;
  compressed_size_bytes?: number;
  ratio?: number;
  reduction_pct?: number;
  page_count?: number;
  tool_chain?: string[];
  output_path?: string;
  output_url?: string;
  warnings?: string[];
  logs?: string[];
  elapsed_seconds?: number;
  error?: string;
}

interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'compressing' | 'done' | 'error';
  result?: CompressResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile definitions
// ─────────────────────────────────────────────────────────────────────────────

const PROFILES: {
  id: Profile;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  badge: string;
  selectedRing: string;
  tool: string;
  dpi: string;
  description: string;
  useCase: string;
  estimatedReduction: string;
}[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    icon: Layers,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-300',
    selectedRing: 'ring-1 ring-blue-500/40',
    tool: 'Ghostscript default',
    dpi: '150 DPI',
    description: 'Good quality-to-size ratio. Best all-around choice for most documents.',
    useCase: 'Tender submissions, internal reports, client drafts',
    estimatedReduction: '40–60 %',
  },
  {
    id: 'lossless',
    name: 'Lossless',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300',
    selectedRing: 'ring-1 ring-emerald-500/40',
    tool: 'pdfsizeopt + JBIG2',
    dpi: '300 DPI',
    description: 'Maximum quality preservation. No visual degradation. Recompresses losslessly.',
    useCase: 'Legal docs, certificates, signed contracts, official submissions',
    estimatedReduction: '10–30 %',
  },
  {
    id: 'web',
    name: 'Web / Email',
    icon: Globe,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-300',
    selectedRing: 'ring-1 ring-purple-500/40',
    tool: 'Ghostscript ebook',
    dpi: '120 DPI',
    description: 'Screen-optimised. Fast to send, opens quickly on mobile. Slight visual reduction.',
    useCase: 'Email attachments, WhatsApp / LINE sharing, website downloads',
    estimatedReduction: '60–80 %',
  },
  {
    id: 'small',
    name: 'Small (Aggressive)',
    icon: Minimize2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
    selectedRing: 'ring-1 ring-amber-500/40',
    tool: 'Ghostscript screen',
    dpi: '96 DPI',
    description: 'Maximum size reduction. Visible quality loss acceptable. For upload portals.',
    useCase: 'Portal uploads with strict size limits (< 5 MB), archiving large scan batches',
    estimatedReduction: '70–90 %',
  },
  {
    id: 'auto',
    name: 'Auto',
    icon: Zap,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    badge: 'bg-cyan-500/20 text-cyan-300',
    selectedRing: 'ring-1 ring-cyan-500/40',
    tool: 'Strategy-selected',
    dpi: 'Variable',
    description: 'Service inspects file size and selects the best tool automatically.',
    useCase: 'General purpose — good default when unsure which profile to use',
    estimatedReduction: '30–70 %',
  },
];

const AGENTS = [
  {
    id: 'ingestion',
    name: 'PDF Ingestion Agent',
    icon: RefreshCw,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    profile: 'balanced',
    priority: 'quality',
    description: 'Normalises PDFs before OCR / RAG ingestion. 150 DPI — sufficient for text extraction.',
    downstream: ['RAG embedding pipeline', 'OCR text extraction'],
    trigger: 'POST /api/pdf-compress/upload',
  },
  {
    id: 'tender',
    name: 'Tender / Proposal Agent',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    profile: 'lossless',
    priority: 'quality',
    description: 'Shrinks tender PDFs to meet upload limits (10–20 MB) without visual degradation.',
    downstream: ['HK+SG Tender Intelligence', 'Client CRM'],
    trigger: 'POST /api/pdf-compress/upload',
  },
  {
    id: 'sharing',
    name: 'Sharing / Distribution Agent',
    icon: Download,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    profile: 'web',
    priority: 'size',
    description: 'Generates compact PDFs for email / WhatsApp / client review. Targets < 5 MB.',
    downstream: ['Email sender', 'WhatsApp / LINE API'],
    trigger: 'POST /api/pdf-compress/upload',
  },
];

const TOOLS = [
  {
    name: 'pdfsizeopt',
    repo: 'pts/pdfsizeopt',
    description: 'Advanced lossless PDF optimiser. Uses JBIG2 for mono images and PNGOUT for colour. Best compression without quality loss.',
    profiles: ['lossless'],
    install: 'Binary download (see Dockerfile)',
  },
  {
    name: 'pdfc / Ghostscript',
    repo: 'theeko74/pdfc',
    description: 'Python wrapper around Ghostscript. Uses PDFSETTINGS presets (screen, ebook, default, prepress). Reliable and fast.',
    profiles: ['balanced', 'small', 'web'],
    install: 'apt install ghostscript && pip install pdfc',
  },
  {
    name: 'pdfEasyCompress',
    repo: 'davidAlgis/pdfEasyCompress',
    description: 'Image-focused compression using Pillow + pikepdf. Downsamples embedded images. Ideal for brochures and scanned docs.',
    profiles: ['web', 'small (secondary pass)'],
    install: 'pip install pdf-easy-compress pikepdf Pillow',
  },
  {
    name: 'Paperweight',
    repo: 'chekuhakim/paperweight',
    description: 'Self-hosted web app using Ghostscript. Called via HTTP API. Useful when Ghostscript is isolated in its own container.',
    profiles: ['balanced (HTTP fallback)'],
    install: 'docker run chekuhakim/paperweight',
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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PdfCompression() {
  const [subTab, setSubTab]   = useState<SubTab>('compress');
  const [files, setFiles]     = useState<FileItem[]>([]);
  const [profile, setProfile] = useState<Profile>('balanced');
  const [priority, setPriority] = useState<'quality' | 'size'>('quality');
  const [running, setRunning] = useState(false);

  // Architecture tab state
  const [health, setHealth]             = useState<{ status: string; tools: Record<string, boolean> } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedTool, setExpandedTool]   = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const items: FileItem[] = Array.from(list)
      .filter(f => f.type === 'application/pdf')
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
        fd.append('priority', priority);

        const res  = await fetch('/api/pdf-compress/upload', { method: 'POST', body: fd });
        const data = await res.json() as CompressResult;

        setFiles(prev => prev.map(f =>
          f.id === item.id ? { ...f, status: data.ok ? 'done' : 'error', result: data } : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f =>
          f.id === item.id ? {
            ...f,
            status: 'error',
            result: { ok: false, error: err instanceof Error ? err.message : 'Network error' },
          } : f
        ));
      }
    }

    setRunning(false);
  }, [files, profile, priority]);

  async function checkHealth() {
    setHealthLoading(true);
    try {
      const res  = await fetch('/api/pdf-compress/health');
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: 'unavailable', tools: {} });
    } finally {
      setHealthLoading(false);
    }
  }

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount    = files.filter(f => f.status === 'done').length;
  const errorCount   = files.filter(f => f.status === 'error').length;

  const summaryOriginal   = files.filter(f => f.status === 'done').reduce((s, f) => s + (f.result?.original_size_bytes ?? 0), 0);
  const summaryCompressed = files.filter(f => f.status === 'done').reduce((s, f) => s + (f.result?.compressed_size_bytes ?? 0), 0);
  const avgReduction = (() => {
    const done = files.filter(f => f.status === 'done' && f.result?.reduction_pct !== undefined);
    if (!done.length) return null;
    const avg = done.reduce((s, f) => s + (f.result!.reduction_pct ?? 0), 0) / done.length;
    return avg.toFixed(1);
  })();

  const selectedProfileDef = PROFILES.find(p => p.id === profile)!;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <FileText className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">PDF Compression Service</h2>
          <p className="text-xs text-slate-400">Self-hosted · Ghostscript · pdfsizeopt · 5 profiles · saved to server</p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> In Progress
        </span>
      </div>

      {/* ── Sub-tab nav ── */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {(['compress', 'architecture'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              subTab === t
                ? 'border-blue-500 text-blue-400'
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
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold shrink-0">1</span>
              Upload PDFs
            </h3>

            {/* Drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600/60 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.02] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <Upload className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Drop PDF files here or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">PDF only · multiple files · max 100 MB each</p>
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
                    <div className="shrink-0">
                      {item.status === 'compressing' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                      {item.status === 'done'         && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {item.status === 'error'        && <AlertCircle  className="w-4 h-4 text-red-400" />}
                      {item.status === 'pending'      && <FileText     className="w-4 h-4 text-slate-500" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {fmt(item.file.size)}
                        {item.result?.page_count ? ` · ${item.result.page_count} pages` : ''}
                      </p>
                    </div>

                    {/* Done: stats + download */}
                    {item.status === 'done' && item.result?.ok && (
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {fmt(item.result.compressed_size_bytes ?? 0)}
                        </span>
                        <span className="text-xs font-semibold text-green-400">
                          ↓ {item.result.reduction_pct?.toFixed(1)} %
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
                        {!item.result.output_url && item.result.output_path && (
                          <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={item.result.output_path}>
                            Saved on server
                          </span>
                        )}
                      </div>
                    )}

                    {item.status === 'error' && (
                      <span className="text-xs text-red-400 shrink-0 max-w-[180px] truncate">
                        {item.result?.error ?? 'Failed'}
                      </span>
                    )}

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
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold shrink-0">2</span>
              Choose Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PROFILES.map(p => {
                const Icon = p.icon;
                const isSelected = profile === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProfile(p.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? `${p.bg} ${p.selectedRing}`
                        : 'bg-white/[0.02] border-slate-700/50 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${p.color}`} />
                        <span className="text-sm font-medium text-white">{p.name}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.badge}`}>{p.estimatedReduction}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1.5 leading-snug">{p.description}</p>
                    <p className="text-[11px] text-slate-500">{p.tool} · {p.dpi}</p>
                  </button>
                );
              })}
            </div>

            {/* Profile use-case hint */}
            <div className={`text-xs px-3 py-2 rounded-lg border ${selectedProfileDef.bg}`}>
              <span className={`font-medium ${selectedProfileDef.color}`}>{selectedProfileDef.name}:</span>{' '}
              <span className="text-slate-300">{selectedProfileDef.useCase}</span>
            </div>

            {/* Priority toggle */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-xs text-slate-400">Priority:</span>
              {(['quality', 'size'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    priority === p
                      ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                      : 'bg-white/[0.03] border border-slate-700/50 text-slate-400 hover:bg-white/[0.06]'
                  }`}
                >
                  {p === 'quality' ? 'Prioritise Quality' : 'Prioritise Size'}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 — Action */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={compressAll}
              disabled={running || pendingCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {running
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Compressing…</>
                : <><Zap className="w-4 h-4" /> Compress {pendingCount > 0 ? pendingCount : ''} PDF{pendingCount !== 1 ? 's' : ''}</>
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
                  {doneCount} PDF{doneCount !== 1 ? 's' : ''} compressed · saved to server
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total original',   value: fmt(summaryOriginal) },
                  { label: 'Total compressed', value: fmt(summaryCompressed) },
                  { label: 'Avg reduction',    value: avgReduction ? `↓ ${avgReduction} %` : '—' },
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

          {/* Architecture diagram */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" /> Architecture
            </h3>
            <pre className="text-xs text-slate-400 font-mono leading-relaxed overflow-x-auto bg-white/[0.02] rounded-lg p-4">{`Browser (File Upload)
        │
        │  POST /api/pdf-compress/upload  { file, profile, priority }
        ▼
┌──────────────────────────────────────────┐
│        Express (index.js)                │
│  multer → save to uploads/pdfs/input/    │
│  → forward path to Python service        │
└──────────────┬───────────────────────────┘
               │  POST /compress  { source: "/path/…", profile, … }
               ▼
┌──────────────────────────────────────────┐
│          FastAPI Service (Python)         │
│                                          │
│  Fetcher → Strategy → Tool Adapters      │
│                                          │
│  lossless → pdfsizeopt                   │
│  balanced → Ghostscript default          │
│  web      → Ghostscript ebook            │
│  small    → Ghostscript screen           │
│  auto     → size-based selection         │
│                                          │
│  Validator → check integrity, ratio      │
└──────────────────────────────────────────┘
        │
        │  { ok, ratio, tool_chain, output_path, logs }
        ▼
Express copies output → uploads/pdfs/output/
Returns output_url = /uploads/pdfs/output/[file]`}</pre>
          </div>

          {/* Service health */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" /> Service Health
              </h3>
              <button
                onClick={checkHealth}
                disabled={healthLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {healthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Check Health
              </button>
            </div>
            {health ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {health.status === 'ok'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <AlertCircle  className="w-4 h-4 text-red-400" />}
                  <span className={`text-sm font-medium ${health.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {health.status === 'ok' ? 'Service Online' : 'Service Unavailable'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(health.tools || {}).map(([tool, available]) => (
                    <div key={tool} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${
                      available ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-slate-700/40 border border-slate-600/30 text-slate-500'
                    }`}>
                      {available ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Click &quot;Check Health&quot; to verify tool availability.</p>
            )}
          </div>

          {/* Agentic workflows */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" /> Agentic Workflows
            </h3>
            <div className="space-y-3">
              {AGENTS.map(agent => {
                const Icon = agent.icon;
                const isOpen = expandedAgent === agent.id;
                const profileDef = PROFILES.find(p => p.id === agent.profile);
                return (
                  <div key={agent.id} className={`border rounded-xl overflow-hidden ${agent.bg}`}>
                    <button
                      className="w-full flex items-center justify-between p-4 text-left"
                      onClick={() => setExpandedAgent(isOpen ? null : agent.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${agent.color}`} />
                        <div>
                          <div className="text-sm font-semibold text-white">{agent.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{agent.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {profileDef && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${profileDef.badge}`}>{profileDef.name}</span>
                        )}
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-2 border-t border-white/[0.05] pt-3">
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-500">Trigger:</span>{' '}
                          <code className="bg-white/[0.04] px-1.5 py-0.5 rounded">{agent.trigger}</code>
                        </div>
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-500">Priority:</span> {agent.priority}
                        </div>
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-500">Downstream:</span> {agent.downstream.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Open-source tools */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" /> Open-Source Tools
            </h3>
            <div className="space-y-2">
              {TOOLS.map(tool => {
                const isOpen = expandedTool === tool.name;
                return (
                  <div key={tool.name} className="border border-slate-700/50 rounded-xl overflow-hidden bg-white/[0.02]">
                    <button
                      className="w-full flex items-center justify-between p-3.5 text-left"
                      onClick={() => setExpandedTool(isOpen ? null : tool.name)}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{tool.name}</div>
                        <div className="text-xs text-slate-500">{tool.repo}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {tool.profiles.map(p => (
                          <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 hidden sm:block">{p}</span>
                        ))}
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3">
                        <p className="text-xs text-slate-400">{tool.description}</p>
                        <div className="text-xs text-slate-500">
                          <span className="text-slate-400">Install:</span>{' '}
                          <code className="bg-white/[0.04] px-1.5 py-0.5 rounded">{tool.install}</code>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* API reference */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-slate-400" /> API Reference
            </h3>
            <div className="space-y-3">
              {[
                {
                  method: 'POST',
                  path: '/api/pdf-compress/upload',
                  desc: 'Upload + compress PDF (multipart file). Returns output_url for direct download.',
                  body: 'file: PDF\nprofile: balanced | lossless | web | small | auto\npriority: quality | size',
                },
                {
                  method: 'POST',
                  path: '/api/pdf-compress',
                  desc: 'Compress by server path or URL (JSON). Proxied to Python microservice.',
                  body: '{ "source": "/abs/path.pdf", "profile": "balanced", "priority": "quality" }',
                },
                {
                  method: 'GET',
                  path: '/api/pdf-compress/health',
                  desc: 'Check Python service health and tool availability.',
                  body: null,
                },
              ].map(ep => (
                <div key={ep.path} className="bg-white/[0.02] rounded-lg p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'POST' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>{ep.method}</span>
                    <code className="text-sm text-slate-200 font-mono">{ep.path}</code>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{ep.desc}</p>
                  {ep.body && (
                    <pre className="text-xs text-slate-500 font-mono bg-black/20 rounded p-2 overflow-x-auto">
                      {ep.body}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {/* Deploy note */}
            <div className="mt-4 p-3.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-amber-300 mb-1">Start the Python microservice</div>
                  <code className="text-xs text-slate-400 font-mono">
                    cd use-cases/pdf-compression &amp;&amp; docker-compose up --build
                  </code>
                  <div className="text-xs text-slate-500 mt-1">
                    Service runs on port 8082. Set <code className="bg-white/[0.03] px-1 rounded">PDF_COMPRESSION_SERVICE_URL</code> to point elsewhere.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
