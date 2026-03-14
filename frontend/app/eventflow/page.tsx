'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

const CATEGORIES = [
  'Conference', 'Workshop', 'Networking', 'Concert', 'Exhibition',
  'Seminar', 'Hackathon', 'Charity', 'Sports', 'Community', 'Other',
];

interface Tier { id: number; name: string; price: number; currency: string; capacity: number | null; sold: number; color: string; }
interface Event {
  id: number; slug: string; title: string; description: string | null;
  banner_url: string | null; location: string | null; start_at: string; end_at: string;
  organizer_name: string; status: string; category: string | null; tiers: Tier[];
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const start = new Date(event.start_at);
  const free  = event.tiers.every((t) => t.price === 0);
  const minPrice = Math.min(...event.tiers.map((t) => t.price));
  const currency = event.tiers[0]?.currency || 'HKD';
  const soldOut = event.tiers.every((t) => t.capacity !== null && t.sold >= t.capacity);

  return (
    <Link href={`/eventflow/${event.slug}`} className="group block" onClick={onClick}>
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-slate-800/60 hover:border-amber-500/40 hover:bg-slate-800/80 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5">
        {/* Banner */}
        <div className="relative h-44 bg-slate-900 overflow-hidden">
          {event.banner_url
            ? <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl opacity-20">🎟</span>
              </div>
          }
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-900/80 to-transparent" />
          {soldOut && (
            <div className="absolute top-3 right-3 bg-red-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">SOLD OUT</div>
          )}
          {event.category && (
            <div className="absolute top-3 left-3 bg-slate-900/80 text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {event.category}
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            {/* Date block */}
            <div className="flex-shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-xl w-12 text-center py-1.5">
              <div className="text-amber-400 text-xs font-bold uppercase">{start.toLocaleString('en-HK', { month: 'short' })}</div>
              <div className="text-white text-xl font-black leading-none">{start.getDate()}</div>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">{event.title}</h3>
              <p className="text-slate-400 text-xs mt-1">{start.toLocaleString('en-HK', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          {event.location && (
            <p className="text-slate-500 text-xs mb-3 truncate">📍 {event.location}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">by {event.organizer_name}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${free ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
              {free ? 'Free' : `From ${currency} ${(minPrice / 100).toFixed(0)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search)   params.set('search', search);
    if (category) params.set('category', category);
    const q = params.toString() ? `?${params}` : '';
    fetch(`${API}/api/eventflow/public/events${q}`)
      .then((r) => r.json())
      .then(({ events }) => { setEvents(events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, category]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // GA: page view
  useEffect(() => {
    gtag('event', 'page_view', { page_title: 'EventFlow Home', page_location: '/eventflow' });
  }, []);

  function handleSearch(value: string) {
    setSearch(value);
    if (value.length > 2) {
      gtag('event', 'search', { search_term: value, event_category: 'EventFlow' });
    }
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    if (cat) {
      gtag('event', 'select_content', { content_type: 'category_filter', item_id: cat });
    }
  }

  function handleEventClick(event: Event) {
    gtag('event', 'select_content', {
      content_type: 'event_card',
      item_id: event.slug,
      item_name: event.title,
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/eventflow" className="flex items-center gap-2">
            <span className="text-xl">🎟</span>
            <span className="font-black text-xl tracking-tight">EventFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/eventflow/wishlist"
              className="text-sm text-slate-400 hover:text-amber-300 transition-colors">
              💡 Wishlist
            </Link>
            <Link href="/eventflow/organizer/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-white/10 hover:border-amber-500/40 hover:text-amber-300 transition-all">
              Organizer Login →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
          <span className="text-white">Discover </span>
          <span className="text-amber-400">events</span>
          <span className="text-white"> near you</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Curated experiences from the world's most thoughtful event organizers.
        </p>
        {/* Search */}
        <div className="relative mt-8 max-w-lg mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="search" placeholder="Search events, locations…"
            className="w-full pl-10 pr-4 py-3.5 bg-slate-800/60 border border-white/[0.08] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 transition-colors text-sm"
            value={search} onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !category ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/60 text-slate-400 border border-white/[0.08] hover:border-amber-500/30 hover:text-amber-300'
            }`}>
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat}
              onClick={() => handleCategoryChange(category === cat ? '' : cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category === cat ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/60 text-slate-400 border border-white/[0.08] hover:border-amber-500/30 hover:text-amber-300'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-slate-800/40 h-64 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <div className="text-5xl mb-4">🎟</div>
            <p className="text-lg font-medium">No events found</p>
            <p className="text-sm mt-1">Check back soon or{' '}
              <Link href="/eventflow/organizer/signup" className="text-amber-400 hover:underline">create one</Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e) => <EventCard key={e.id} event={e} onClick={() => handleEventClick(e)} />)}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-white/[0.06] bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-black mb-3">Hosting an event?</h2>
          <p className="text-slate-400 mb-8">Create your event in minutes. Free for attendees, always.</p>
          <Link href="/eventflow/organizer/signup"
            onClick={() => gtag('event', 'cta_click', { cta_text: 'Get started free', event_category: 'EventFlow' })}
            className="inline-block bg-amber-500 text-slate-950 font-bold px-8 py-4 rounded-xl hover:bg-amber-400 transition-colors">
            Get started free →
          </Link>
        </div>
      </div>
    </div>
  );
}
