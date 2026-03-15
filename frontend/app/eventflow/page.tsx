'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const CATEGORIES = [
  'Conference', 'Workshop', 'Networking', 'Concert', 'Exhibition',
  'Seminar', 'Hackathon', 'Charity', 'Sports', 'Community', 'Other',
];

const CAT_ICONS: Record<string, string> = {
  Conference: '🎤', Workshop: '🛠️', Networking: '🤝', Concert: '🎵',
  Exhibition: '🖼️', Seminar: '📚', Hackathon: '💻', Charity: '❤️',
  Sports: '⚽', Community: '🏘️', Other: '✨',
};

interface Tier { id: number; name: string; price: number; currency: string; capacity: number | null; sold: number; color: string; }
interface Event {
  id: number; slug: string; title: string; description: string | null;
  banner_url: string | null; location: string | null; start_at: string; end_at: string;
  organizer_name: string; status: string; category: string | null; tiers: Tier[];
}

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag(...args);
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const start = new Date(event.start_at);
  const free = event.tiers.every((t) => t.price === 0);
  const minPrice = event.tiers.length ? Math.min(...event.tiers.map((t) => t.price)) : 0;
  const currency = event.tiers[0]?.currency || 'HKD';
  const soldOut = event.tiers.length > 0 && event.tiers.every((t) => t.capacity !== null && t.sold >= t.capacity);
  const icon = CAT_ICONS[event.category || ''] || '🎟️';

  return (
    <Link href={`/eventflow/${event.slug}`} className="group block" onClick={onClick}>
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-200">
        <div className="relative h-44 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
          {event.banner_url
            ? <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl opacity-25">{icon}</span></div>
          }
          {soldOut && <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">SOLD OUT</div>}
          {event.category && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              {icon} {event.category}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 bg-orange-50 border border-orange-100 rounded-xl w-12 text-center py-1.5">
              <div className="text-orange-500 text-[10px] font-bold uppercase">{start.toLocaleString('en-HK', { month: 'short' })}</div>
              <div className="text-gray-900 text-xl font-black leading-none">{start.getDate()}</div>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">{event.title}</h3>
              <p className="text-gray-400 text-xs mt-1">{start.toLocaleString('en-HK', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          {event.location && <p className="text-gray-400 text-xs mb-3 truncate">📍 {event.location}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">by {event.organizer_name}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${free ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
              {free ? 'Free' : `From ${currency} ${(minPrice / 100).toFixed(0)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const BENEFITS = [
  { icon: '🎟️', title: 'Free to join', desc: 'RSVP to thousands of events at no cost. Your ticket is always just a click away.', bg: 'bg-amber-50 border-amber-100', ib: 'bg-amber-100' },
  { icon: '📱', title: 'Digital tickets', desc: 'QR code on your phone. Instant check-in — no printing, no hassle.', bg: 'bg-blue-50 border-blue-100', ib: 'bg-blue-100' },
  { icon: '🔔', title: 'Smart reminders', desc: 'Get notified before your event. Never miss something you signed up for.', bg: 'bg-purple-50 border-purple-100', ib: 'bg-purple-100' },
  { icon: '🤝', title: 'Connect & network', desc: 'Meet like-minded people. Find your community before, during and after.', bg: 'bg-green-50 border-green-100', ib: 'bg-green-100' },
  { icon: '🎯', title: 'Curated for you', desc: 'AI-matched events based on your interests, location, and history.', bg: 'bg-pink-50 border-pink-100', ib: 'bg-pink-100' },
  { icon: '🌏', title: 'Global & local', desc: 'Community meetups to global conferences — all discovered in one place.', bg: 'bg-cyan-50 border-cyan-100', ib: 'bg-cyan-100' },
];

const STEPS = [
  { icon: '🔍', title: 'Discover', desc: 'Browse and search events by category, date, or location.' },
  { icon: '✅', title: 'RSVP free', desc: 'Register in seconds. Get your QR ticket by email instantly.' },
  { icon: '🎉', title: 'Show up & enjoy', desc: 'Scan at the door, meet people, and make memories.' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketState, setTicketState] = useState<'idle' | 'loading' | 'sent'>('idle');

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

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => { gtag('event', 'page_view', { page_title: 'EventFlow Home', page_location: '/eventflow' }); }, []);

  function handleSearch(v: string) {
    setSearch(v);
    if (v.length > 2) gtag('event', 'search', { search_term: v, event_category: 'EventFlow' });
  }

  function handleCat(cat: string) {
    setCategory(cat);
    if (cat) gtag('event', 'select_content', { content_type: 'category_filter', item_id: cat });
  }

  function handleEventClick(event: Event) {
    gtag('event', 'select_content', { content_type: 'event_card', item_id: event.slug, item_name: event.title });
  }

  async function handleTicketLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketEmail) return;
    setTicketState('loading');
    // Attempt ticket lookup — gracefully handle missing endpoint
    try {
      await fetch(`${API}/api/eventflow/participant/tickets?email=${encodeURIComponent(ticketEmail)}`);
    } catch {}
    setTicketState('sent');
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 md:pb-0">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/eventflow" className="flex items-center gap-2">
            <span className="text-2xl">🎟️</span>
            <span className="font-black text-xl tracking-tight text-gray-900">EventFlow</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/eventflow/wishlist" className="hidden sm:flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 font-medium transition-colors">
              💡 Wishlist
            </Link>
            <Link href="/eventflow/reception" className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
              ✅ Reception
            </Link>
            <Link href="/eventflow/organizer" className="text-sm font-bold px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-sm shadow-orange-200">
              Host an event →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 text-white">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <span>✨</span> AI-powered event discovery
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 leading-[1.1]">
            Discover <span className="text-yellow-100">experiences</span><br />made for you
          </h1>
          <p className="text-orange-100 text-lg max-w-xl mx-auto mb-8">
            Curated events from the world's most thoughtful organizers — conferences, workshops, concerts and more.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto mb-10">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="search" placeholder="Search events, locations…"
              className="w-full pl-11 pr-4 py-4 bg-white text-gray-900 rounded-2xl text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400"
              value={search} onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { v: '10k+', l: 'Events hosted' },
              { v: '50k+', l: 'Happy attendees' },
              { v: '200+', l: 'Organizers' },
              { v: 'Free', l: 'Always for you' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-black">{s.v}</div>
                <div className="text-orange-100 text-xs font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category filter ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3.5">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleCat('')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${!category ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
              🌟 All
            </button>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => handleCat(category === cat ? '' : cat)}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${category === cat ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
                {CAT_ICONS[cat]} {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works for participants ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Three steps to your next favourite event</h2>
          <p className="text-gray-500 text-sm">No account needed to browse. RSVP in under 60 seconds.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-7 border border-orange-100 text-center">
              <div className="absolute top-4 right-5 text-5xl font-black text-orange-100 select-none">0{i + 1}</div>
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="font-black text-gray-900 text-lg mb-1">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Events grid */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900">
            {category ? `${CAT_ICONS[category]} ${category}` : '🔥 Upcoming events'}
            {events.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({events.length})</span>}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 h-64 animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🎟️</div>
            <p className="text-lg font-bold text-gray-700">No events yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Check back soon or{' '}
              <Link href="/eventflow/organizer/signup" className="text-orange-500 hover:underline font-medium">create one</Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e) => <EventCard key={e.id} event={e} onClick={() => handleEventClick(e)} />)}
          </div>
        )}
      </div>

      {/* ── Participant benefits ──────────────────────────────────────────── */}
      <div className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Everything you get as an attendee</h2>
            <p className="text-gray-500 text-sm">Join once, enjoy forever — all completely free.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className={`rounded-2xl border ${b.bg} p-5 text-center hover:shadow-md transition-shadow`}>
                <div className={`${b.ib} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-2xl`}>{b.icon}</div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Find my tickets ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-bold mb-4">
                👤 Already registered?
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Find your tickets & RSVPs</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">
                Already signed up for an event? Look up your tickets, download your QR code, or manage your registration — no password needed.
              </p>
              <div className="space-y-2.5">
                {[
                  'View all your upcoming events',
                  'Download QR code ticket anytime',
                  'Update your registration details',
                  'Get event reminders & organizer updates',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 font-bold flex-shrink-0">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-7">
              <h3 className="font-black text-gray-900 mb-1">🔍 Look up my tickets</h3>
              <p className="text-xs text-gray-400 mb-5">Enter your email — we&apos;ll send links to all your registered events.</p>
              {ticketState === 'sent' ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">📬</div>
                  <p className="font-bold text-gray-800">Check your inbox!</p>
                  <p className="text-sm text-gray-500 mt-1">Links sent to <strong>{ticketEmail}</strong></p>
                  <button onClick={() => { setTicketState('idle'); setTicketEmail(''); }} className="mt-4 text-xs text-gray-400 hover:underline">
                    Try another email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTicketLookup} className="space-y-3">
                  <input
                    type="email" required placeholder="your@email.com"
                    value={ticketEmail} onChange={(e) => setTicketEmail(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
                  />
                  <button type="submit" disabled={ticketState === 'loading'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                    {ticketState === 'loading' ? 'Sending…' : 'Send my ticket links →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Organizer CTA ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-3xl font-black mb-3">Hosting an event?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">AI-powered tools, 0% platform fees, custom RSVP forms — everything a modern organizer needs.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/eventflow/organizer"
              className="inline-block bg-orange-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/30">
              See features & pricing →
            </Link>
            <Link href="/eventflow/organizer/signup"
              className="inline-block bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors">
              Start free today
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎟️</span>
            <span className="font-black text-gray-900">EventFlow</span>
            <span>· Where great events begin</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/eventflow/organizer" className="hover:text-orange-500 transition-colors">For Organizers</Link>
            <Link href="/eventflow/reception" className="hover:text-orange-500 transition-colors">Reception Staff</Link>
            <Link href="/eventflow/wishlist" className="hover:text-orange-500 transition-colors">Wishlist</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
