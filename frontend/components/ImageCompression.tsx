'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Image, Upload, Link2, Zap, CheckCircle2, AlertCircle,
  Loader2, BarChart3, FileImage, ArrowRight, RefreshCw,
  ChevronDown, Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Profile   = 'auto' | 'lossless' | 'web' | 'thumbnail' | 'aggressive';
type Format    = 'original' | 'jpeg' | 'webp' | 'avif' | 'png';
type Priority  = 'quality' | 'balanced' | 'size';
type SourceMode = 'upload' | 'url';

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
  output_path?: string;
  duration_ms: number;
  logs: string[];
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PROFILES: { value: Profile; label: string; description: string; color: string }[] = [
  { value: 'auto',       label: 'Auto',       description: 'Picks best strategy based on image size, dimensions, and tags',          color: 'text-blue-400'   },
  { value: 'web',        label: 'Web',         description: 'WebP @ 80% quality, max 1920×1080. Best for blogs and galleries',        color: 'text-teal-400'   },
  { value: 'thumbnail',  label: 'Thumbnail',   description: 'WebP @ 72%, max 512×512. For card previews and list thumbnails',         color: 'text-amber-400'  },
  { value: 'lossless',   label: 'Lossless',    description: 'No quality loss, only metadata stripped. For archival or source assets', color: 'text-green-400'  },
  { value: 'aggressive', label: 'Aggressive',  description: 'AVIF @ 55%. Smallest possible size, may have visible artefacts',         color: 'text-rose-400'   },
];

const FORMATS: { value: Format; label: string }[] = [
  { value: 'original', label: 'Keep Original' },
  { value: 'webp',     label: 'WebP' },
  { value: 'avif',     label: 'AVIF' },
  { value: 'jpeg',     label: 'JPEG' },
  { value: 'png',      label: 'PNG' },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'quality',  label: 'Prioritise Quality' },
  { value: 'size',     label: 'Prioritise Size' },
];

const TAG_OPTIONS = ['social', 'tender', 'client_review', 'thumbnail'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function reductionPct(original: number, compressed: number): string {
  if (!original) return '0%';
  const pct = ((original - compressed) / original) * 100;
  return `${pct >= 0 ? '↓' : '↑'} ${Math.abs(pct).toFixed(1)}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ImageCompression() {
  const [sourceMode, setSourceMode]   = useState<SourceMode>('upload');
  const [urlInput, setUrlInput]       = useState('');
  const [file, setFile]               = useState<File | null>(null);
  const [profile, setProfile]         = useState<Profile>('auto');
  const [format, setFormat]           = useState<Format>('original');
  const [priority, setPriority]       = useState<Priority>('balanced');
  const [maxWidth, setMaxWidth]       = useState('');
  const [maxHeight, setMaxHeight]     = useState('');
  const [maxSizeKb, setMaxSizeKb]     = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<CompressionResult | null>(null);
  const [showLogs, setShowLogs]       = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setSourceMode('upload');
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file && !urlInput.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      let response: Response;

      if (sourceMode === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('profile', profile);
        formData.append('target_format', format);
        formData.append('priority', priority);
        if (maxWidth)  formData.append('max_width', maxWidth);
        if (maxHeight) formData.append('max_height', maxHeight);
        if (maxSizeKb) formData.append('max_size_kb', maxSizeKb);
        if (selectedTags.length) formData.append('tags', selectedTags.join(','));

        response = await fetch('/api/compress', { method: 'POST', body: formData });
      } else {
        response = await fetch('/api/compress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: urlInput.trim(),
            profile,
            target_format: format,
            priority,
            max_width:   maxWidth  ? parseInt(maxWidth, 10)   : null,
            max_height:  maxHeight ? parseInt(maxHeight, 10)  : null,
            max_size_kb: maxSizeKb ? parseFloat(maxSizeKb)    : null,
            tags: selectedTags,
          }),
        });
      }

      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : 'Network error',
        original_size_bytes: 0, compressed_size_bytes: 0, ratio: 0,
        original_format: '', output_format: '', width: 0, height: 0,
        profile_used: profile, duration_ms: 0, logs: [],
      });
    } finally {
      setLoading(false);
    }
  }, [file, urlInput, sourceMode, profile, format, priority, maxWidth, maxHeight, maxSizeKb, selectedTags]);

  const profileInfo = PROFILES.find(p => p.value === profile)!;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <FileImage className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Image Compression</h2>
          <p className="text-sm text-slate-400">
            Sharp-powered compression for content, tender, and social agents
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Live
        </div>
      </div>

      {/* Source + Config grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Left: Image source */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Image Source</h3>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {(['upload', 'url'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSourceMode(mode)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sourceMode === mode
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    : 'bg-white/[0.03] border border-slate-700/50 text-slate-400 hover:bg-white/[0.06]'
                }`}
              >
                {mode === 'upload' ? <><Upload className="inline w-3.5 h-3.5 mr-1.5" />Upload</> : <><Link2 className="inline w-3.5 h-3.5 mr-1.5" />URL</>}
              </button>
            ))}
          </div>

          {sourceMode === 'upload' ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600/60 rounded-xl p-8 text-center cursor-pointer hover:border-rose-500/40 hover:bg-white/[0.02] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-400">Drop image here or click to browse</p>
                  <p className="text-xs text-slate-500">JPEG, PNG, WebP, AVIF, GIF, SVG · max 50 MB</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Image URL or local path</label>
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>
          )}
        </div>

        {/* Right: Profile + options */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Compression Settings</h3>

          {/* Profile selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Profile</label>
            <div className="grid grid-cols-1 gap-1.5">
              {PROFILES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setProfile(p.value)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    profile === p.value
                      ? 'bg-white/[0.08] border border-slate-600/60'
                      : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`text-xs font-semibold w-16 shrink-0 ${p.color}`}>{p.label}</span>
                  <span className="text-xs text-slate-400 leading-snug">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Output Format</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as Format)}
                className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50"
              >
                {FORMATS.map(f => (
                  <option key={f.value} value={f.value} className="bg-slate-800">{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value} className="bg-slate-800">{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Tags (optional overrides)</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      : 'bg-white/[0.03] border border-slate-700/50 text-slate-400 hover:bg-white/[0.06]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Advanced constraints
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Max Width (px)', value: maxWidth, setter: setMaxWidth, placeholder: 'e.g. 1920' },
                { label: 'Max Height (px)', value: maxHeight, setter: setMaxHeight, placeholder: 'e.g. 1080' },
                { label: 'Max Size (KB)', value: maxSizeKb, setter: setMaxSizeKb, placeholder: 'e.g. 300' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs text-slate-400 mb-1">{label}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-2 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCompress}
          disabled={loading || (!file && !urlInput.trim())}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Compressing…' : 'Compress Image'}
        </button>
        {result && (
          <button
            onClick={() => { setResult(null); setFile(null); setUrlInput(''); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-slate-300 hover:bg-white/[0.02] text-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5" />
          Profile: <span className={`font-medium ${profileInfo.color}`}>{profileInfo.label}</span>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-5 space-y-4 ${
          result.ok
            ? 'border-green-500/20 bg-green-500/[0.04]'
            : 'border-red-500/20 bg-red-500/[0.04]'
        }`}>
          {result.ok ? (
            <>
              {/* Success header */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-sm font-semibold text-white">Compression complete</span>
                <span className="ml-auto text-xs text-slate-400">{result.duration_ms}ms</span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Original',    value: formatBytes(result.original_size_bytes),   sub: result.original_format.toUpperCase() },
                  { label: 'Compressed',  value: formatBytes(result.compressed_size_bytes), sub: result.output_format.toUpperCase() },
                  { label: 'Reduction',   value: reductionPct(result.original_size_bytes, result.compressed_size_bytes), sub: `ratio: ${result.ratio.toFixed(3)}` },
                  { label: 'Dimensions',  value: `${result.width}×${result.height}`,        sub: `profile: ${result.profile_used}` },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-lg bg-white/[0.03] border border-slate-700/50 px-3 py-2.5">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Download link */}
              {result.output_url && (
                <a
                  href={result.output_url}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-slate-700/50 text-sm text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Download compressed image
                </a>
              )}

              {/* Iteration note */}
              {result.iterations && result.iterations > 1 && (
                <p className="text-xs text-amber-400">
                  Size budget enforced in {result.iterations} passes (quality={result.quality_used})
                </p>
              )}
            </>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Compression failed</p>
                <p className="text-sm text-red-300 mt-1">{result.error}</p>
              </div>
            </div>
          )}

          {/* Logs accordion */}
          {result.logs && result.logs.length > 0 && (
            <div>
              <button
                onClick={() => setShowLogs(v => !v)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
                {showLogs ? 'Hide' : 'Show'} compression log ({result.logs.length} entries)
              </button>
              {showLogs && (
                <div className="mt-2 rounded-lg bg-white/[0.02] border border-slate-700/50 p-3 space-y-1 max-h-48 overflow-y-auto">
                  {result.logs.map((log, i) => (
                    <p key={i} className="text-xs text-slate-400 font-mono leading-relaxed">
                      <span className="text-slate-600 select-none">{String(i + 1).padStart(2, '0')} </span>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reference card */}
      <div className="rounded-xl border border-slate-700/50 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-medium text-slate-300">Profile Reference</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { profile: 'web',        useCase: 'Web gallery / blog',          detail: 'WebP 80%, max 1920×1080' },
            { profile: 'thumbnail',  useCase: 'Card & preview images',        detail: 'WebP 72%, max 512×512'   },
            { profile: 'aggressive', useCase: 'Social media sharing',         detail: 'AVIF 55%, max 1920×1080' },
            { profile: 'web',        useCase: 'Social (with "social" tag)',    detail: 'WebP, max 1200×1200'     },
            { profile: 'lossless',   useCase: 'Source / archival assets',     detail: 'Original fmt, lossless'  },
            { profile: 'auto',       useCase: 'Tender / PDF embedding',       detail: 'JPEG 75%, max 1600×900'  },
          ].map((row, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
              <span className={`text-xs font-medium w-18 shrink-0 mt-0.5 ${PROFILES.find(p => p.value === row.profile)?.color}`}>
                {row.profile}
              </span>
              <div>
                <p className="text-xs text-slate-300">{row.useCase}</p>
                <p className="text-xs text-slate-500">{row.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API reference */}
      <div className="rounded-xl border border-slate-700/50 bg-white/[0.02] p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Image className="w-4 h-4 text-slate-400" /> API Endpoints
        </h3>
        <div className="space-y-1.5 font-mono text-xs">
          {[
            ['POST', '/api/compress',          'Compress (JSON body or multipart upload)'],
            ['GET',  '/api/compress/health',   'Sharp service health check'],
            ['GET',  '/api/compress/profiles', 'List compression profiles'],
          ].map(([method, path, desc]) => (
            <div key={path} className="flex items-center gap-3">
              <span className={`w-10 text-center rounded px-1 py-0.5 text-[10px] font-bold ${
                method === 'POST' ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'
              }`}>{method}</span>
              <span className="text-slate-300">{path}</span>
              <span className="text-slate-500 hidden md:inline">— {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
