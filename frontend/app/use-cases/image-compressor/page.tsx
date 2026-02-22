'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Sliders, X, CheckCircle } from 'lucide-react';

interface CompressedResult {
  originalName: string;
  originalSize: number;
  compressedSize: number;
  compressedUrl: string;
  width: number;
  height: number;
  quality: number;
  format: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function savings(original: number, compressed: number) {
  return Math.round((1 - compressed / original) * 100);
}

export default function ImageCompressorPage() {
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState<'jpeg' | 'webp' | 'png'>('jpeg');
  const [results, setResults] = useState<CompressedResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback((file: File): Promise<CompressedResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          if (format !== 'png') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          const mimeType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';
          const q = format === 'png' ? undefined : quality / 100;
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Compression failed')); return; }
            resolve({
              originalName: file.name,
              originalSize: file.size,
              compressedSize: blob.size,
              compressedUrl: URL.createObjectURL(blob),
              width: w,
              height: h,
              quality,
              format,
            });
          }, mimeType, q);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, [quality, maxWidth, format]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setProcessing(true);
    try {
      const compressed = await Promise.all(imageFiles.map(compressImage));
      setResults(prev => [...compressed, ...prev]);
    } finally {
      setProcessing(false);
    }
  }, [compressImage]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const download = (result: CompressedResult) => {
    const a = document.createElement('a');
    a.href = result.compressedUrl;
    const ext = result.format === 'jpeg' ? 'jpg' : result.format;
    a.download = result.originalName.replace(/\.[^.]+$/, '') + `_compressed.${ext}`;
    a.click();
  };

  const remove = (idx: number) => {
    setResults(prev => { URL.revokeObjectURL(prev[idx].compressedUrl); return prev.filter((_, i) => i !== idx); });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/20 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Image Compressor</h1>
              <p className="text-slate-400 text-sm">Client-side compression — files never leave your browser</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Compression Settings</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Quality: <span className="text-teal-400 font-semibold">{quality}%</span>
              </label>
              <input
                type="range" min={10} max={100} value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full accent-teal-500"
                disabled={format === 'png'}
              />
              {format === 'png' && <p className="text-xs text-slate-500 mt-1">PNG is lossless</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Max Width (px)</label>
              <select
                value={maxWidth}
                onChange={e => setMaxWidth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {[800, 1280, 1920, 2560, 9999].map(v => (
                  <option key={v} value={v}>{v === 9999 ? 'Original' : `${v}px`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Output Format</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-600/50">
                {(['jpeg', 'webp', 'png'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors uppercase ${format === f ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-300'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors mb-6 ${
            dragging ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 hover:border-teal-600/50 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          {processing ? (
            <div className="flex flex-col items-center gap-3 text-teal-400">
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Compressing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Upload className="w-10 h-10 opacity-50" />
              <div>
                <p className="text-white font-medium">Drop images here or click to browse</p>
                <p className="text-sm mt-1">JPG, PNG, GIF, WebP — batch supported</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-300">{results.length} image{results.length > 1 ? 's' : ''} compressed</h2>
              <button
                onClick={() => { results.forEach(r => URL.revokeObjectURL(r.compressedUrl)); setResults([]); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear all
              </button>
            </div>
            {results.map((r, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                {/* Preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.compressedUrl} alt={r.originalName} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.originalName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.width} × {r.height}px • {r.format.toUpperCase()}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-500 line-through">{formatBytes(r.originalSize)}</span>
                    <span className="text-xs text-teal-400 font-medium">{formatBytes(r.compressedSize)}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      {savings(r.originalSize, r.compressedSize)}% smaller
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => download(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
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
