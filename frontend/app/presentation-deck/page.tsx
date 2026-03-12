'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Play, ImageIcon, ChevronRight, Plus, Layers } from 'lucide-react';

interface DeckSummary {
  id: number;
  slug: string;
  title: string;
  title_cn: string | null;
  client: string | null;
  sections: string[];
  slide_count: number;
  asset_count: number;
  updated_at: string;
  created_at: string;
}

export default function PresentationDeckListPage() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/presentation-deck')
      .then(r => r.json())
      .then(data => {
        setDecks(Array.isArray(data) ? data : data.decks ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load decks');
        setLoading(false);
      });
  }, []);

  const totalSlides = decks.reduce((s, d) => s + (d.slide_count ?? 0), 0);
  const totalAssets = decks.reduce((s, d) => s + (d.asset_count ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">5 Miles Lab</div>
              <div className="text-sm font-semibold text-slate-100">Presentation Deck Builder</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/presentation-deck/library"
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Image Library
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Presentation Decks</h1>
          <p className="text-slate-400 mb-6">
            AI-generated tender and pitch decks for client proposals
          </p>
          {!loading && decks.length > 0 && (
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span><span className="text-slate-300 font-medium">{decks.length}</span> deck{decks.length !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span><span className="text-slate-300 font-medium">{totalSlides}</span> slides</span>
              <span>·</span>
              <span><span className="text-slate-300 font-medium">{totalAssets}</span> generated assets</span>
            </div>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-slate-500 text-sm">Loading decks…</div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm py-8">{error}</div>
        )}

        {!loading && !error && decks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="w-10 h-10 text-slate-700 mb-4" />
            <p className="text-slate-400 mb-2">No decks seeded yet</p>
            <p className="text-slate-600 text-sm">
              Visit a deck page and click &ldquo;Seed to DB&rdquo; to add it here.
            </p>
          </div>
        )}

        {!loading && decks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map(deck => (
              <div
                key={deck.slug}
                className="bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-slate-600 p-6 transition-all hover:bg-slate-800/80 flex flex-col"
              >
                {/* Client + slug */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    {deck.client ?? 'Unknown Client'}
                  </span>
                  <span className="text-xs text-slate-600 font-mono bg-slate-900/50 px-2 py-0.5 rounded">
                    {deck.slug}
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-semibold text-slate-100 text-base leading-snug mb-1">
                  {deck.title}
                </h2>
                {deck.title_cn && (
                  <p className="text-sm text-slate-500 mb-4">{deck.title_cn}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 mt-auto">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {deck.slide_count ?? 0} slides
                  </span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {deck.asset_count ?? 0} assets
                  </span>
                  {deck.sections?.length > 0 && (
                    <span>{deck.sections.length} sections</span>
                  )}
                </div>

                {/* Updated */}
                {deck.updated_at && (
                  <p className="text-xs text-slate-600 mb-4">
                    Updated {new Date(deck.updated_at).toLocaleDateString('en-HK', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-1">
                  <Link
                    href={`/presentation-deck/${deck.slug}`}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    Deck
                  </Link>
                  <Link
                    href={`/presentation-deck/${deck.slug}/slides`}
                    className="flex items-center gap-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Present
                  </Link>
                  <Link
                    href={`/presentation-deck/library?deck=${deck.slug}`}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors ml-auto"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Assets
                  </Link>
                </div>
              </div>
            ))}

            {/* "Add new" placeholder */}
            <div className="bg-white/[0.02] rounded-xl border border-dashed border-slate-700/50 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Plus className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm font-medium mb-1">New Deck</p>
              <p className="text-slate-600 text-xs">
                Seed a deck from its data file to appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
