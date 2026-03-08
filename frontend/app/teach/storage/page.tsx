'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  HardDrive, Cloud, CloudOff, RefreshCw, Copy, ExternalLink,
  Upload, CheckCircle, AlertCircle, Clock, Loader2,
} from 'lucide-react';

interface PaperStorage {
  id: string;
  exam_name: string;
  grade_band: string;
  year: number;
  status: string;
  file_url: string | null;
  cdn_url: string | null;
  file_size_bytes: number | null;
  file_exists_locally: boolean;
  serve_url: string | null;
  created_at: string;
}

function fmt(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function copyText(text: string, setCopied: (v: string) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(text);
    setTimeout(() => setCopied(''), 1800);
  });
}

const STATUS_COLOR: Record<string, string> = {
  UPLOADED:     'text-blue-400 bg-blue-500/10 border-blue-500/20',
  OCR_RUNNING:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  DRAFT_READY:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CONFIRMED:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  NEEDS_REVIEW: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function StoragePage() {
  const [papers, setPapers]       = useState<PaperStorage[]>([]);
  const [loading, setLoading]     = useState(false);
  const [pushing, setPushing]     = useState<Record<string, boolean>>({});
  const [copied, setCopied]       = useState('');
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/adaptive-learning/teachers/papers/storage');
      const data = await res.json();
      if (data.success) setPapers(data.papers);
      else setError(data.error || 'Failed to load');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pushToCdn = async (paper: PaperStorage) => {
    setPushing(p => ({ ...p, [paper.id]: true }));
    try {
      const res  = await fetch(`/api/adaptive-learning/teachers/papers/${paper.id}/push-cdn`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const data = await res.json();
      if (data.success) {
        setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, cdn_url: data.cdn_url } : p));
      } else {
        setError(data.error || 'CDN push failed');
      }
    } catch (e: any) { setError(e.message); }
    finally { setPushing(p => ({ ...p, [paper.id]: false })); }
  };

  const cdnCount   = papers.filter(p => p.cdn_url).length;
  const localCount = papers.filter(p => p.file_exists_locally).length;
  const totalSize  = papers.reduce((s, p) => s + (p.file_size_bytes || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">File Storage</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {papers.length} papers · {cdnCount} on CDN · {localCount} local · {fmt(totalSize)} total
          </p>
        </div>
        <button onClick={load} className={`text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: HardDrive, label: 'Local files', value: localCount, of: papers.length, color: 'text-blue-400' },
          { icon: Cloud,     label: 'CDN backed',  value: cdnCount,   of: papers.length, color: 'text-emerald-400' },
          { icon: CloudOff,  label: 'No CDN',      value: papers.length - cdnCount, of: papers.length, color: 'text-amber-400' },
        ].map(({ icon: Icon, label, value, of, color }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className={`text-lg font-bold ${color}`}>{value}<span className="text-slate-600 text-sm font-normal">/{of}</span></p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Paper', 'Size', 'Status', 'Local file', 'CDN URL', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && papers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-600 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && papers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-600 text-xs">No papers uploaded yet</td></tr>
              )}
              {papers.map((p, i) => {
                const statusColor = STATUS_COLOR[p.status] || STATUS_COLOR.UPLOADED;
                const isCdnPushing = pushing[p.id];
                return (
                  <tr key={p.id} className={`border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors ${i === papers.length - 1 ? 'border-b-0' : ''}`}>
                    {/* Paper name */}
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm leading-tight">{p.exam_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{p.grade_band} · {p.year}</p>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmt(p.file_size_bytes)}</td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${statusColor}`}>
                        {p.status}
                      </span>
                    </td>

                    {/* Local file */}
                    <td className="px-4 py-3">
                      {p.file_exists_locally ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <button
                            onClick={() => p.file_url && copyText(p.file_url, setCopied)}
                            title={p.file_url || ''}
                            className="text-xs text-slate-400 hover:text-white transition-colors font-mono truncate max-w-[120px]"
                          >
                            {copied === p.file_url ? '✓ copied' : (p.file_url?.replace('/uploads/', '') || '—')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Ephemeral — gone</span>
                        </div>
                      )}
                    </td>

                    {/* CDN URL */}
                    <td className="px-4 py-3">
                      {p.cdn_url ? (
                        <div className="flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <button
                            onClick={() => copyText(p.cdn_url!, setCopied)}
                            className="text-xs text-emerald-300 hover:text-white transition-colors font-mono truncate max-w-[140px]"
                            title={p.cdn_url}
                          >
                            {copied === p.cdn_url ? '✓ copied' : p.cdn_url.replace(/^https?:\/\/[^/]+\//, '…/')}
                          </button>
                          <a href={p.cdn_url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-300 shrink-0">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">— not uploaded</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Copy serve URL */}
                        {p.serve_url && (
                          <button
                            onClick={() => copyText(p.serve_url!, setCopied)}
                            title="Copy serve URL"
                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            {copied === p.serve_url ? 'Copied' : 'URL'}
                          </button>
                        )}

                        {/* Push to CDN */}
                        {!p.cdn_url && (
                          <button
                            onClick={() => pushToCdn(p)}
                            disabled={isCdnPushing || !p.file_exists_locally}
                            title={!p.file_exists_locally ? 'Local file gone — re-upload to push CDN' : 'Push to CDN'}
                            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {isCdnPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            {isCdnPushing ? 'Pushing…' : 'CDN'}
                          </button>
                        )}

                        {/* Open validate page */}
                        <Link
                          href={`/teach/validate?paper_id=${p.id}`}
                          className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          Validate
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Local files on Fly.dev are ephemeral and wiped on restart. CDN backup is permanent.
        Papers without a CDN URL should be re-uploaded or pushed manually while the local file still exists.
      </p>
    </div>
  );
}
