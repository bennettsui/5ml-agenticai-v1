'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ImageIcon, ChevronLeft, Search, RefreshCw,
  Copy, CheckCircle2, Trash2, ExternalLink, Filter,
  Loader2, BookOpen,
} from 'lucide-react';

interface Asset {
  id: number;
  deck_slug: string | null;
  deck_title: string | null;
  deck_client: string | null;
  slide_id: number | null;
  slide_number: number | null;
  section: string | null;
  slide_title: string | null;
  prompt_index: number | null;
  prompt_used: string | null;
  mime_type: string | null;
  public_url: string | null;
  image_url: string;
  generated_at: string;
}

interface LibraryResponse {
  total: number;
  limit: number;
  offset: number;
  assets: Asset[];
}

const SECTION_COLORS: Record<string, string> = {
  opening: 'text-red-400',
  understanding: 'text-blue-400',
  approach: 'text-amber-400',
  logistics: 'text-emerald-400',
  lettershop: 'text-purple-400',
  hsse: 'text-orange-400',
  team: 'text-teal-400',
  closing: 'text-rose-400',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="p-1 rounded hover:bg-white/[0.06] transition-colors"
      title="Copy URL"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
      )}
    </button>
  );
}

export default function PresentationLibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deckFilter, setDeckFilter] = useState('');
  const [decks, setDecks] = useState<{ slug: string; title: string }[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (deckFilter) params.set('deck_slug', deckFilter);
      const res = await fetch(`/api/presentation-deck/assets?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LibraryResponse = await res.json();
      setAssets(data.assets);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [deckFilter]);

  useEffect(() => {
    fetch('/api/presentation-deck')
      .then(r => r.json())
      .then(d => setDecks(d.decks || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this asset? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/presentation-deck/assets/${id}`, { method: 'DELETE' });
      setAssets(prev => prev.filter(a => a.id !== id));
      setTotal(prev => prev - 1);
      if (selectedAsset?.id === id) setSelectedAsset(null);
    } catch (e) {
      alert('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = search.trim()
    ? assets.filter(a =>
        a.prompt_used?.toLowerCase().includes(search.toLowerCase()) ||
        a.slide_title?.toLowerCase().includes(search.toLowerCase()) ||
        a.deck_title?.toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  const absoluteUrl = (imageUrl: string) => {
    if (typeof window === 'undefined') return imageUrl;
    return `${window.location.origin}${imageUrl}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/presentation-deck/2603CLPtender" className="text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">Presentation Deck</div>
              <div className="text-sm font-semibold text-slate-100">Image Library</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
              {total} image{total !== 1 ? 's' : ''}
            </span>
            <button
              onClick={fetchAssets}
              disabled={loading}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-slate-800/60 bg-slate-900/30 flex-shrink-0 overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Search</div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Prompt or title…"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {/* Deck filter */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Filter className="w-3 h-3" />
              Deck
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setDeckFilter('')}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${
                  deckFilter === ''
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-400 hover:bg-white/[0.03]'
                }`}
              >
                All decks
              </button>
              {decks.map(d => (
                <button
                  key={d.slug}
                  onClick={() => setDeckFilter(d.slug)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${
                    deckFilter === d.slug
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="font-mono text-slate-600 text-[10px]">{d.slug}</div>
                  <div className="truncate">{d.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Stats</div>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Showing</span>
                <span className="text-slate-400">{filtered.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total in DB</span>
                <span className="text-slate-400">{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid + detail panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Image grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                {error}
              </div>
            )}

            {loading && assets.length === 0 && (
              <div className="flex items-center justify-center h-64 text-slate-600 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading assets…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ImageIcon className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">No images yet.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Go to a deck, seed it, then click "Generate All Assets".
                </p>
                <Link
                  href="/presentation-deck/2603CLPtender"
                  className="mt-4 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Open CLP deck
                </Link>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset.id === selectedAsset?.id ? null : asset)}
                    className={`group relative rounded-xl overflow-hidden border transition-all text-left ${
                      selectedAsset?.id === asset.id
                        ? 'border-blue-500/60 ring-1 ring-blue-500/30'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-video bg-slate-800 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.image_url}
                        alt={asset.prompt_used || 'Generated image'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="p-2 bg-slate-900/60">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-mono text-slate-600">
                          #{asset.id}
                        </span>
                        {asset.section && (
                          <span className={`text-[10px] ${SECTION_COLORS[asset.section] || 'text-slate-500'}`}>
                            {asset.section}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
                        {asset.slide_title || asset.deck_slug}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedAsset && (
            <div className="w-80 border-l border-slate-800/60 bg-slate-900/30 overflow-y-auto flex-shrink-0">
              <div className="p-5">
                {/* Image preview */}
                <div className="rounded-xl overflow-hidden border border-slate-700/50 mb-4 aspect-video bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAsset.image_url}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-5">
                  <a
                    href={selectedAsset.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 text-slate-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                  <button
                    onClick={() => handleDelete(selectedAsset.id)}
                    disabled={deletingId === selectedAsset.id}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === selectedAsset.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* URL fields */}
                <div className="space-y-3 mb-5">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Relative URL</div>
                    <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                      <code className="text-xs text-slate-300 flex-1 truncate font-mono">
                        {selectedAsset.image_url}
                      </code>
                      <CopyButton text={selectedAsset.image_url} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Absolute URL</div>
                    <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                      <code className="text-xs text-slate-300 flex-1 truncate font-mono">
                        {absoluteUrl(selectedAsset.image_url)}
                      </code>
                      <CopyButton text={absoluteUrl(selectedAsset.image_url)} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Markdown embed</div>
                    <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                      <code className="text-xs text-slate-300 flex-1 truncate font-mono">
                        {`![Slide ${selectedAsset.slide_number}](${absoluteUrl(selectedAsset.image_url)})`}
                      </code>
                      <CopyButton text={`![Slide ${selectedAsset.slide_number}](${absoluteUrl(selectedAsset.image_url)})`} />
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-xs">
                  <div className="text-slate-500 font-medium uppercase tracking-wide">Metadata</div>
                  {[
                    ['Asset ID', `#${selectedAsset.id}`],
                    ['Deck', selectedAsset.deck_slug || '—'],
                    ['Slide', selectedAsset.slide_number != null ? `#${selectedAsset.slide_number}` : '—'],
                    ['Section', selectedAsset.section || '—'],
                    ['Prompt index', selectedAsset.prompt_index != null ? `[${selectedAsset.prompt_index}]` : '—'],
                    ['MIME type', selectedAsset.mime_type || '—'],
                    ['Generated', selectedAsset.generated_at ? new Date(selectedAsset.generated_at).toLocaleString() : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-400 text-right font-mono truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Prompt */}
                {selectedAsset.prompt_used && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Prompt</div>
                      <CopyButton text={selectedAsset.prompt_used} />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                      {selectedAsset.prompt_used}
                    </p>
                  </div>
                )}

                {/* Slide link */}
                {selectedAsset.deck_slug && selectedAsset.slide_number != null && (
                  <div className="mt-4">
                    <Link
                      href={`/presentation-deck/${selectedAsset.deck_slug}/slides?slide=${selectedAsset.slide_number}`}
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      View slide {selectedAsset.slide_number}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
