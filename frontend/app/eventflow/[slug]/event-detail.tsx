'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface Tier { id: number; name: string; description: string | null; price: number; currency: string; capacity: number | null; sold: number; color: string; is_active: boolean; }
interface Event {
  id: number; slug: string; title: string; description: string | null; banner_url: string | null;
  location: string | null; start_at: string; end_at: string; timezone: string;
  organizer_name: string; tiers: Tier[]; stats: { total: number; checked_in: number };
}

const TIER_COLORS: Record<string, string> = {
  Blue: '#3b82f6', Red: '#ef4444', Green: '#22c55e', Purple: '#a855f7', default: '#f59e0b',
};

function fmt(dt: string, tz: string) {
  return new Date(dt).toLocaleString('en-HK', {
    timeZone: tz, weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

type Step = 'detail' | 'register' | 'success';

interface RSVPResult {
  first_name: string; last_name: string; email: string; registration_code: string;
  tier: string; event_title: string; event_start: string; event_location: string | null; event_slug: string;
}

export default function EventDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('detail');
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rsvpResult, setRsvpResult] = useState<RSVPResult | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', organization: '', phone: '',
    notify_whatsapp: false, notify_line: false,
  });

  useEffect(() => {
    fetch(`${API}/api/eventflow/public/events/${slug}`)
      .then((r) => r.json())
      .then(({ event }) => { setEvent(event); if (event?.tiers?.[0]) setSelectedTier(event.tiers[0]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !selectedTier) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/eventflow/public/events/${slug}/rsvp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tier_id: selectedTier.id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Registration failed'); setSubmitting(false); return; }
      setRsvpResult(data.attendee);
      setStep('success');
      router.push(`/eventflow/success?code=${data.attendee.registration_code}`);
    } catch { alert('Registration failed'); setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
  if (!event) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
      <div className="text-5xl">😕</div>
      <p className="text-xl font-bold">Event not found</p>
      <Link href="/eventflow" className="text-amber-400 hover:underline text-sm">← Browse all events</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/eventflow" className="text-slate-400 hover:text-white transition-colors text-sm">← Events</Link>
          <span className="text-slate-700">/</span>
          <span className="text-sm font-semibold truncate text-slate-300">{event.title}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* Left */}
          <div>
            {/* Banner */}
            {event.banner_url && (
              <div className="rounded-2xl overflow-hidden mb-8 aspect-[16/7] bg-slate-900">
                <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            {/* Title */}
            <h1 className="text-4xl font-black tracking-tight mb-2">{event.title}</h1>
            <p className="text-slate-400 text-sm mb-8">by <span className="text-white font-semibold">{event.organizer_name}</span></p>

            {/* Meta */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📅</span>
                <div>
                  <div className="font-semibold">{fmt(event.start_at, event.timezone)}</div>
                  <div className="text-slate-500 text-sm">to {fmt(event.end_at, event.timezone)}</div>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📍</span>
                  <div className="font-semibold">{event.location}</div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">👥</span>
                <div className="font-semibold">{event.stats?.total ?? 0} registered</div>
              </div>
            </div>

            {event.description && (
              <div className="border-t border-white/[0.06] pt-8">
                <h2 className="font-bold text-lg mb-4">About this event</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Social share */}
            <div className="border-t border-white/[0.06] pt-8 mt-8">
              <p className="text-sm text-slate-500 mb-3">Share this event</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'LINE', href: `https://line.me/R/msg/text/?${encodeURIComponent(event.title + '\n' + window?.location?.href || '')}`, bg: 'bg-green-600' },
                  { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(event.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`, bg: 'bg-[#25D366]' },
                  { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`, bg: 'bg-blue-600' },
                ].map(({ label, href, bg }) => (
                  <a key={label} href={href} target="_blank" rel="noopener"
                    className={`${bg} text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}>
                    {label}
                  </a>
                ))}
                <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          {/* Right: Registration panel */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
              {step === 'detail' && (
                <>
                  <h2 className="font-bold text-lg mb-4">Register</h2>
                  {/* Tiers */}
                  <div className="space-y-2 mb-6">
                    {event.tiers.filter((t) => t.is_active).map((tier) => {
                      const color = TIER_COLORS[tier.color] || TIER_COLORS.default;
                      const soldOut = tier.capacity !== null && tier.sold >= tier.capacity;
                      const selected = selectedTier?.id === tier.id;
                      return (
                        <button key={tier.id} disabled={soldOut}
                          onClick={() => setSelectedTier(tier)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            selected ? 'border-amber-500 bg-amber-500/10' :
                            soldOut ? 'border-white/[0.05] opacity-40 cursor-not-allowed' :
                            'border-white/[0.08] hover:border-white/20'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                <span className="font-semibold text-sm">{tier.name}</span>
                              </div>
                              {tier.description && <p className="text-slate-500 text-xs mt-1">{tier.description}</p>}
                              {soldOut && <p className="text-red-400 text-xs mt-1">Sold out</p>}
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-sm ${tier.price === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                                {tier.price === 0 ? 'Free' : `${tier.currency} ${(tier.price / 100).toFixed(0)}`}
                              </div>
                              {tier.capacity && (
                                <div className="text-slate-600 text-xs">{tier.capacity - tier.sold} left</div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setStep('register')}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 rounded-xl transition-colors text-base">
                    {selectedTier?.price === 0 ? 'Register for free →' : `Get ticket →`}
                  </button>
                </>
              )}

              {step === 'register' && (
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 mb-5">
                    <button type="button" onClick={() => setStep('detail')} className="text-slate-400 hover:text-white">←</button>
                    <h2 className="font-bold text-lg">Your details</h2>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'first_name', label: 'First name', req: true, type: 'text' },
                      { key: 'last_name',  label: 'Last name',  req: true, type: 'text' },
                      { key: 'email',      label: 'Email',      req: true, type: 'email' },
                      { key: 'organization', label: 'Organization', req: false, type: 'text' },
                      { key: 'phone',      label: 'Phone (for WhatsApp notifications)', req: false, type: 'tel' },
                    ].map(({ key, label, req, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}{req && ' *'}</label>
                        <input type={type} required={req} value={(form as any)[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                      </div>
                    ))}
                    <div className="pt-1 space-y-2">
                      {[
                        { key: 'notify_whatsapp', label: '📱 Notify me via WhatsApp' },
                        { key: 'notify_line',     label: '💬 Notify me via LINE' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(form as any)[key]}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                            className="w-4 h-4 rounded accent-amber-500" />
                          <span className="text-slate-400 text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="mt-5 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-4 rounded-xl transition-colors text-base">
                    {submitting ? 'Registering…' : selectedTier?.price === 0 ? 'Confirm Registration →' : 'Proceed to Payment →'}
                  </button>
                  <p className="text-slate-600 text-xs text-center mt-3">A confirmation email with your QR code will be sent.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
