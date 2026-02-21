'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Download, FileText, Settings, X, AlertCircle, Loader2 } from 'lucide-react';

interface PdfFile {
  file: File;
  status: 'idle' | 'processing' | 'done' | 'error';
  originalSize: number;
  compressedSize?: number;
  downloadUrl?: string;
  error?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';

export default function PdfCompressorPage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [quality, setQuality] = useState<'screen' | 'ebook' | 'printer' | 'prepress'>('ebook');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const QUALITY_LABELS: Record<string, { label: string; desc: string; saving: string }> = {
    screen:   { label: 'Screen',   desc: 'Lowest size, 72 dpi',    saving: '~70%' },
    ebook:    { label: 'eBook',    desc: 'Balanced, 150 dpi',      saving: '~50%' },
    printer:  { label: 'Print',    desc: 'High quality, 300 dpi',  saving: '~30%' },
    prepress: { label: 'Prepress', desc: 'Max quality, 300+ dpi',  saving: '~10%' },
  };

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setFiles(prev => [
      ...pdfs.map(f => ({ file: f, status: 'idle' as const, originalSize: f.size })),
      ...prev,
    ]);
  }, []);

  const compress = async (idx: number) => {
    const item = files[idx];
    if (!item || item.status === 'processing') return;

    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'processing', error: undefined } : f));

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('quality', quality);

      const res = await fetch(`${API_BASE}/api/pdf/compress`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setFiles(prev => prev.map((f, i) => i === idx
        ? { ...f, status: 'done', compressedSize: blob.size, downloadUrl: url }
        : f
      ));
    } catch (err) {
      setFiles(prev => prev.map((f, i) => i === idx
        ? { ...f, status: 'error', error: (err as Error).message }
        : f
      ));
    }
  };

  const compressAll = () => files.forEach((_, i) => compress(i));

  const download = (item: PdfFile) => {
    if (!item.downloadUrl) return;
    const a = document.createElement('a');
    a.href = item.downloadUrl;
    a.download = item.file.name.replace('.pdf', `_compressed_${quality}.pdf`);
    a.click();
  };

  const remove = (idx: number) => {
    const item = files[idx];
    if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const anyIdle = files.some(f => f.status === 'idle');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PDF Compressor</h1>
              <p className="text-slate-400 text-sm">Reduce PDF file size without losing readability</p>
            </div>
          </div>
        </div>

        {/* Quality selector */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Compression Level</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(QUALITY_LABELS) as Array<keyof typeof QUALITY_LABELS>).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q as typeof quality)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  quality === q
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                }`}
              >
                <div className={`text-sm font-semibold ${quality === q ? 'text-red-400' : 'text-slate-300'}`}>
                  {QUALITY_LABELS[q].label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{QUALITY_LABELS[q].desc}</div>
                <div className="text-xs text-emerald-400 font-medium mt-1">{QUALITY_LABELS[q].saving} smaller</div>
              </button>
            ))}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{files.length} file{files.length > 1 ? 's' : ''}</span>
              {anyIdle && (
                <button
                  onClick={compressAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Compress All
                </button>
              )}
            </div>

            {files.map((item, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.file.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{formatBytes(item.originalSize)}</span>
                    {item.status === 'done' && item.compressedSize && (
                      <>
                        <span className="text-slate-600">→</span>
                        <span className="text-xs text-emerald-400 font-medium">{formatBytes(item.compressedSize)}</span>
                        <span className="text-xs text-emerald-400">
                          ({Math.round((1 - item.compressedSize / item.originalSize) * 100)}% saved)
                        </span>
                      </>
                    )}
                    {item.status === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3" /> {item.error}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'idle' && (
                    <button
                      onClick={() => compress(i)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Compress
                    </button>
                  )}
                  {item.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                  )}
                  {item.status === 'done' && (
                    <button
                      onClick={() => download(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  )}
                  {item.status === 'error' && (
                    <button
                      onClick={() => compress(i)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  )}
                  <button onClick={() => remove(i)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
