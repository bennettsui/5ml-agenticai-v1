'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';
const ADMIN_PASSWORD = '5milesLab01@';

type Tab = 'publish' | 'media';

interface MediaImage {
  key: string;
  filename: string;
  folder: string;
  localExists: boolean;
  publicUrl?: string;
  alt?: string;
  source?: string;
  description?: string;
  missing?: boolean;
}

export default function TEDxXinyiAdmin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<Tab>('publish');

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');

  // Media state
  const [media, setMedia] = useState<MediaImage[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const downloadRef = useRef<HTMLAnchorElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishMsg('Building & packaging… this may take up to 60 seconds.');
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/publish-html-pack`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = downloadRef.current;
      if (a) {
        a.href = url;
        a.download = `tedx-xinyi-${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
      }
      setPublishMsg(`Pack downloaded (${(blob.size / 1024).toFixed(0)} KB)`);
    } catch (err: unknown) {
      setPublishMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPublishing(false);
    }
  }

  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media`);
      const data = await res.json();
      setMedia(data.images || []);
      setMediaLoaded(true);
    } catch {
      setMedia([]);
    } finally {
      setMediaLoading(false);
    }
  }, []);

  // ─── Upload (replace) handler ─────────────────────────────
  function triggerUpload(key: string) {
    replaceTargetRef.current = key;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const key = replaceTargetRef.current;
    if (!file || !key) return;

    setActionLoading(key);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast(`Replaced ${key}. Old version archived as ${data.archiveKey}`);
      await loadMedia();
    } catch (err) {
      showToast(`Upload failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setActionLoading(null);
      replaceTargetRef.current = null;
    }
  }

  // ─── Remove (deactivate, keep as archive) ─────────────────
  async function handleRemove(key: string) {
    setActionLoading(key);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast(`Removed ${key}. Archived as ${data.archiveKey}`);
      await loadMedia();
    } catch (err) {
      showToast(`Remove failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Delete (permanent) ───────────────────────────────────
  async function handleDelete(key: string) {
    setActionLoading(key);
    setConfirmDelete(null);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast(`Permanently deleted: ${key}`);
      await loadMedia();
    } catch (err) {
      showToast(`Delete failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Password Gate ──────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-white text-xl font-black mb-1">TEDxXinyi Admin</h1>
          <p className="text-neutral-500 text-sm mb-6">Enter password to continue</p>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 mb-3"
          />
          {pwError && <p className="text-red-400 text-xs mb-3">Incorrect password</p>}
          <button
            onClick={handleLogin}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // ─── Is image an archived copy? ───────────────────────────
  const isArchived = (key: string) => key.includes('--archived-') || key.includes('--removed-');

  // ─── Main Admin ─────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: 'publish', label: 'Publish HTML Pack' },
    { id: 'media', label: 'Media Library' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hidden elements */}
      <a ref={downloadRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
          toast.type === 'ok' ? 'bg-green-900/90 text-green-200 border border-green-700/50' : 'bg-red-900/90 text-red-200 border border-red-700/50'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold mb-2">Permanently delete?</h3>
            <p className="text-neutral-400 text-sm mb-1">This will remove the file and all metadata.</p>
            <p className="text-red-400 text-xs font-mono mb-4 break-all">{confirmDelete}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vibe-demo/tedx-xinyi" className="text-neutral-500 hover:text-white text-sm transition-colors">
            &larr; Back to site
          </Link>
          <h1 className="text-lg font-black">TEDxXinyi Admin</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-red-400 border-red-500'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ─── PUBLISH TAB ─── */}
        {tab === 'publish' && (
          <div>
            <h2 className="text-2xl font-black mb-2">Publish HTML Pack</h2>
            <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
              Generate a complete static HTML package of the TEDxXinyi website for deployment.<br />
              Includes all pages, JS/CSS assets, and generated images. No Python required.
            </p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-bold text-neutral-300 mb-4">Package Contents</h3>
              <ul className="text-sm text-neutral-400 space-y-1.5 mb-6">
                <li>• Homepage + 6 sub-pages (about, blog, community, salon, speakers, sustainability)</li>
                <li>• Next.js static assets (_next/ JS &amp; CSS chunks)</li>
                <li>• Generated images (tedx-xinyi/ folder)</li>
                <li>• manifest.json with build timestamp</li>
              </ul>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-bold rounded-lg transition-colors"
              >
                {publishing ? 'Building & Packaging…' : 'Build & Download Pack'}
              </button>

              {publishMsg && (
                <p className={`mt-4 text-sm ${publishMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {publishMsg}
                </p>
              )}
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-6">
              <h3 className="text-sm font-bold text-neutral-400 mb-2">Deployment Notes</h3>
              <ul className="text-xs text-neutral-500 space-y-1">
                <li>• Unzip the pack and serve from any static host (Netlify, Vercel, S3, etc.)</li>
                <li>• Images with CDN URLs will load from mmdbfiles CDN even if local files are missing</li>
                <li>• The _next/ folder must be at the same root level as the HTML files</li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── MEDIA TAB ─── */}
        {tab === 'media' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Media Library</h2>
              <button
                onClick={loadMedia}
                disabled={mediaLoading}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-bold rounded-lg transition-colors"
              >
                {mediaLoading ? 'Loading…' : mediaLoaded ? 'Refresh' : 'Load Media'}
              </button>
            </div>

            {!mediaLoaded && !mediaLoading && (
              <p className="text-neutral-500 text-sm">Click &quot;Load Media&quot; to view images.</p>
            )}

            {mediaLoaded && media.length === 0 && (
              <p className="text-neutral-500 text-sm">No media found.</p>
            )}

            {media.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {media.map(img => {
                  const archived = isArchived(img.key);
                  const loading = actionLoading === img.key;
                  return (
                    <div
                      key={img.key}
                      className={`bg-neutral-900 border rounded-lg overflow-hidden ${
                        archived ? 'border-neutral-800/50 opacity-60' : 'border-neutral-800'
                      }`}
                    >
                      {/* Image preview */}
                      <div className="aspect-video bg-neutral-800 flex items-center justify-center relative">
                        {(img.publicUrl || img.localExists) ? (
                          <img
                            src={img.publicUrl || `${API_BASE}/tedx-xinyi/${img.key}`}
                            alt={img.alt || img.key}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-neutral-600 text-xs">Missing</span>
                        )}
                        {loading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                        {archived && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/60 text-amber-300 rounded font-bold">ARCHIVED</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-xs text-neutral-400 truncate font-mono" title={img.key}>{img.key}</p>
                        {img.description && (
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">{img.description}</p>
                        )}

                        {/* Status tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {img.source && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">{img.source}</span>
                          )}
                          {img.localExists && <span className="text-[10px] px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded">local</span>}
                          {img.publicUrl && <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded">CDN</span>}
                          {img.missing && <span className="text-[10px] px-1.5 py-0.5 bg-red-900/40 text-red-400 rounded">missing</span>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1.5 mt-3 pt-3 border-t border-neutral-800/50">
                          {/* Upload / Replace */}
                          {!archived && (
                            <button
                              onClick={() => triggerUpload(img.key)}
                              disabled={loading}
                              className="flex-1 px-2 py-1.5 text-[11px] font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors disabled:opacity-40"
                              title="Upload new version (old version is kept as archive)"
                            >
                              Upload New
                            </button>
                          )}
                          {/* Remove (deactivate) */}
                          {!archived && (img.localExists || img.publicUrl) && (
                            <button
                              onClick={() => handleRemove(img.key)}
                              disabled={loading}
                              className="flex-1 px-2 py-1.5 text-[11px] font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded transition-colors disabled:opacity-40"
                              title="Remove from active slot (kept as archived asset)"
                            >
                              Remove
                            </button>
                          )}
                          {/* Delete (permanent) */}
                          <button
                            onClick={() => setConfirmDelete(img.key)}
                            disabled={loading}
                            className="px-2 py-1.5 text-[11px] font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded transition-colors disabled:opacity-40"
                            title="Permanently delete image and metadata"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
