'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, FileText, Settings, X, AlertCircle, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface LogEntry { time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }

interface PdfFile {
  file: File;
  status: 'idle' | 'processing' | 'done' | 'error';
  originalSize: number;
  compressedSize?: number;
  downloadUrl?: string;
  error?: string;
  progress: number;         // 0–100
  logs: LogEntry[];
  showLogs: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function savings(original: number, compressed: number) {
  return Math.round((1 - compressed / original) * 100);
}

// Use relative URL so it works on any host (Fly.dev, localhost, etc.)
const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : '';

const PROFILES: Record<string, { label: string; desc: string; saving: string; backendProfile: string }> = {
  small:    { label: 'Screen',   desc: 'Aggressive, 96 dpi',    saving: '~70%', backendProfile: 'small' },
  web:      { label: 'eBook',    desc: 'Balanced, 120 dpi',     saving: '~50%', backendProfile: 'web' },
  balanced: { label: 'Print',    desc: 'High quality, 300 dpi', saving: '~30%', backendProfile: 'balanced' },
  lossless: { label: 'Prepress', desc: 'Max quality, lossless', saving: '~10%', backendProfile: 'lossless' },
};

const PROFILE_KEYS = ['small', 'web', 'balanced', 'lossless'] as const;

function log(entry: Omit<LogEntry, 'time'>): LogEntry {
  return { ...entry, time: new Date().toLocaleTimeString('en-HK', { hour12: false }) };
}

export default function PdfCompressorPage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [profile, setProfile] = useState<string>('web');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setFiles(prev => [
      ...pdfs.map(f => ({ file: f, status: 'idle' as const, originalSize: f.size, progress: 0, logs: [], showLogs: false })),
      ...prev,
    ]);
  }, []);

  const updateFile = (idx: number, patch: Partial<PdfFile>) =>
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

  const appendLog = (idx: number, entry: Omit<LogEntry, 'time'>) =>
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, logs: [...f.logs, log(entry)] } : f));

  // Simulated progress ticker while processing
  const progressTimerRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const startProgressTick = (idx: number) => {
    progressTimerRef.current[idx] = setInterval(() => {
      setFiles(prev => prev.map((f, i) => {
        if (i !== idx || f.status !== 'processing') return f;
        // Creep toward 90%, slowing as it approaches
        const next = f.progress + (90 - f.progress) * 0.06;
        return { ...f, progress: Math.min(next, 89) };
      }));
    }, 400);
  };

  const stopProgressTick = (idx: number) => {
    clearInterval(progressTimerRef.current[idx]);
    delete progressTimerRef.current[idx];
  };

  // Cleanup on unmount
  useEffect(() => () => {
    Object.values(progressTimerRef.current).forEach(clearInterval);
  }, []);

  const compress = async (idx: number) => {
    const item = files[idx];
    if (!item || item.status === 'processing') return;

    const selectedProfile = PROFILES[profile];
    updateFile(idx, { status: 'processing', error: undefined, progress: 0, logs: [] });

    appendLog(idx, { msg: `Starting compression — profile: ${selectedProfile.label} (${selectedProfile.backendProfile})`, type: 'info' });
    appendLog(idx, { msg: `Input: ${item.file.name} (${formatBytes(item.originalSize)})`, type: 'info' });

    startProgressTick(idx);

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('profile', selectedProfile.backendProfile);

      appendLog(idx, { msg: 'Uploading to compression service…', type: 'info' });

      const res = await fetch(`${API_BASE}/api/pdf-compress/upload`, { method: 'POST', body: formData });
      const data = await res.json();

      stopProgressTick(idx);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (!data.output_url) throw new Error('No output URL returned from server');

      appendLog(idx, { msg: 'Downloading compressed file…', type: 'info' });

      const blobRes = await fetch(`${API_BASE}${data.output_url}`);
      if (!blobRes.ok) throw new Error('Failed to download compressed file');
      const blob = await blobRes.blob();
      const url = URL.createObjectURL(blob);

      const saved = savings(item.originalSize, blob.size);
      appendLog(idx, { msg: `Done! ${formatBytes(item.originalSize)} → ${formatBytes(blob.size)} (${saved}% saved)`, type: 'success' });
      if (data.tool) appendLog(idx, { msg: `Tool used: ${data.tool}`, type: 'info' });
      if (data.strategy) appendLog(idx, { msg: `Strategy: ${data.strategy}`, type: 'info' });

      updateFile(idx, { status: 'done', compressedSize: blob.size, downloadUrl: url, progress: 100 });
    } catch (err) {
      stopProgressTick(idx);
      const msg = (err as Error).message;
      appendLog(idx, { msg: `Error: ${msg}`, type: 'error' });
      updateFile(idx, { status: 'error', error: msg, progress: 0 });
    }
  };

  const compressAll = () => files.forEach((_, i) => compress(i));

  const download = (item: PdfFile) => {
    if (!item.downloadUrl) return;
    const a = document.createElement('a');
    a.href = item.downloadUrl;
    a.download = item.file.name.replace(/\.pdf$/i, `_compressed_${profile}.pdf`);
    a.click();
  };

  const remove = (idx: number) => {
    stopProgressTick(idx);
    const item = files[idx];
    if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const anyIdle = files.some(f => f.status === 'idle');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">PDF Compressor</h1>
            <p className="text-slate-400 text-sm">Reduce PDF file size without losing readability</p>
          </div>
        </div>

        {/* Profile selector */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Compression Level</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROFILE_KEYS.map(key => {
              const p = PROFILES[key];
              return (
                <button
                  key={key}
                  onClick={() => setProfile(key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    profile === key
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <div className={`text-sm font-semibold ${profile === key ? 'text-red-400' : 'text-slate-300'}`}>{p.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                  <div className="text-xs text-emerald-400 font-medium mt-1">{p.saving} smaller</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors mb-6 ${
            dragging ? 'border-red-500 bg-red-500/5' : 'border-slate-700 hover:border-red-600/50 hover:bg-white/[0.02]'
          }`}
        >
          <input ref={fileInputRef} type="file" multiple accept=".pdf,application/pdf" className="hidden"
            onChange={e => addFiles(e.target.files)} />
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Upload className="w-10 h-10 opacity-50" />
            <div>
              <p className="text-white font-medium">Drop PDF files here or click to browse</p>
              <p className="text-sm mt-1">Multiple files supported</p>
            </div>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{files.length} file{files.length > 1 ? 's' : ''}</span>
              {anyIdle && (
                <button onClick={compressAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Compress All
                </button>
              )}
            </div>

            {files.map((item, i) => {
              const saved = item.compressedSize ? savings(item.originalSize, item.compressedSize) : 0;
              return (
                <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                  {/* Main row */}
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.file.name}</p>

                      {/* Size comparison */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400">{formatBytes(item.originalSize)}</span>
                        {item.status === 'done' && item.compressedSize && (
                          <>
                            <span className="text-slate-600 text-xs">→</span>
                            <span className="text-xs text-emerald-400 font-medium">{formatBytes(item.compressedSize)}</span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {saved}% saved
                            </span>
                          </>
                        )}
                        {item.status === 'error' && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertCircle className="w-3 h-3" /> {item.error}
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-xs text-slate-500 italic">Compressing…</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {(item.status === 'processing' || item.status === 'done') && (
                        <div className="mt-2 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.status === 'done' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === 'idle' && (
                        <button onClick={() => compress(i)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors">
                          Compress
                        </button>
                      )}
                      {item.status === 'processing' && (
                        <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                      )}
                      {item.status === 'done' && (
                        <button onClick={() => download(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      )}
                      {item.status === 'error' && (
                        <button onClick={() => compress(i)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors">
                          Retry
                        </button>
                      )}
                      {/* Log toggle */}
                      {item.logs.length > 0 && (
                        <button
                          onClick={() => updateFile(i, { showLogs: !item.showLogs })}
                          className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                          title="Toggle log"
                        >
                          {item.showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => remove(i)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Size visualization bar (done only) */}
                  {item.status === 'done' && item.compressedSize && (
                    <div className="px-4 pb-3">
                      <div className="flex gap-1 items-center mb-1">
                        <span className="text-[10px] text-slate-500 w-14 text-right">Original</span>
                        <div className="flex-1 h-4 rounded-md bg-white/[0.04] overflow-hidden relative">
                          <div className="absolute inset-y-0 left-0 bg-slate-600/60 rounded-md" style={{ width: '100%' }} />
                          <div
                            className="absolute inset-y-0 left-0 bg-emerald-500/70 rounded-md transition-all duration-700"
                            style={{ width: `${100 - saved}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium w-14">{formatBytes(item.compressedSize)}</span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="text-[10px] text-slate-500 w-14 text-right" />
                        <div className="flex-1 flex justify-between px-1">
                          <span className="text-[10px] text-slate-600">{formatBytes(item.originalSize)}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">{saved}% saved</span>
                        </div>
                        <span className="w-14" />
                      </div>
                    </div>
                  )}

                  {/* Log panel */}
                  {item.showLogs && item.logs.length > 0 && (
                    <div className="border-t border-slate-700/50 bg-white/[0.02] px-4 py-3 font-mono text-[11px] space-y-0.5 max-h-40 overflow-y-auto">
                      {item.logs.map((l, j) => (
                        <div key={j} className={`flex gap-2 ${
                          l.type === 'success' ? 'text-emerald-400' :
                          l.type === 'error'   ? 'text-red-400' :
                          l.type === 'warn'    ? 'text-yellow-400' :
                          'text-slate-400'
                        }`}>
                          <span className="text-slate-600 flex-shrink-0">{l.time}</span>
                          <span>{l.msg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
