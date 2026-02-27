'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';
const ADMIN_PASSWORD = '5milesLab01@';

type Tab = 'publish' | 'media';

interface MediaImage {
  key: string;
  localExists: boolean;
  publicUrl?: string;
  alt?: string;
  source?: string;
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

  const downloadRef = useRef<HTMLAnchorElement>(null);

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

  async function loadMedia() {
    setMediaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/images`);
      const data = await res.json();
      setMedia(data.images || []);
      setMediaLoaded(true);
    } catch {
      setMedia([]);
    } finally {
      setMediaLoading(false);
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

  // ─── Main Admin ─────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: 'publish', label: 'Publish HTML Pack' },
    { id: 'media', label: 'Media Library' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hidden download anchor */}
      <a ref={downloadRef} className="hidden" />

      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vibe-demo/tedx-xinyi" className="text-neutral-500 hover:text-white text-sm transition-colors">
            ← Back to site
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
      <div className="max-w-4xl mx-auto px-6 py-8">

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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {media.map(img => (
                  <div key={img.key} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                    <div className="aspect-square bg-neutral-800 flex items-center justify-center">
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
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-neutral-400 truncate" title={img.key}>{img.key}</p>
                      <div className="flex gap-1 mt-1">
                        {img.localExists && <span className="text-[10px] px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded">local</span>}
                        {img.publicUrl && <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded">CDN</span>}
                        {!img.localExists && !img.publicUrl && <span className="text-[10px] px-1.5 py-0.5 bg-red-900/40 text-red-400 rounded">missing</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
