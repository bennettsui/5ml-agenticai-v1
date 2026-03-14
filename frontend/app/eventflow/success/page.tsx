'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface Attendee {
  id: number; first_name: string; last_name: string; email: string;
  registration_code: string; tier_name: string | null; tier_color: string | null;
  status: string; event_title: string; start_at: string; end_at: string;
  location: string | null; slug: string;
}

function SuccessContent() {
  const sp = useSearchParams();
  const code = sp.get('code');
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    // Fetch attendee via scan endpoint
    fetch(`${API}/api/eventflow/checkin/scan/${code}`, { method: 'POST' })
      .then((r) => r.json())
      .then(({ attendee }) => { setAttendee(attendee); setLoading(false); })
      .catch(() => setLoading(false));
    // Fetch QR SVG
    fetch(`${API}/api/eventflow/public/qr/${code}`)
      .then((r) => r.text())
      .then(setQrSvg)
      .catch(() => {});
  }, [code]);

  function copyCode() {
    navigator.clipboard?.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 py-16">
      {/* Confetti-like */}
      <div className="text-6xl mb-6 animate-bounce">🎉</div>

      <h1 className="text-4xl font-black text-center mb-2">
        You&apos;re in{attendee ? `, ${attendee.first_name}` : ''}!
      </h1>
      <p className="text-slate-400 text-center mb-10 max-w-md">
        Your registration is confirmed. A confirmation email with your QR code has been sent.
      </p>

      <div className="w-full max-w-sm">
        {/* QR Card */}
        <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-8 text-center">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Your Ticket</div>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-4 mx-auto w-48 h-48 flex items-center justify-center mb-4">
            {qrSvg
              ? <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-full h-full" />
              : <div className="text-slate-900 text-4xl">📱</div>
            }
          </div>

          {attendee && (
            <>
              <div className="font-black text-xl mb-1">{attendee.first_name} {attendee.last_name}</div>
              {attendee.tier_name && (
                <div className="text-xs font-semibold bg-amber-500/15 text-amber-400 inline-block px-3 py-1 rounded-full mb-4">{attendee.tier_name}</div>
              )}
              {attendee.event_title && (
                <div className="border-t border-white/[0.06] pt-4 space-y-2 text-sm text-left">
                  <div className="flex gap-2"><span>🎟</span><span className="font-semibold">{attendee.event_title}</span></div>
                  {attendee.start_at && <div className="flex gap-2"><span>📅</span><span className="text-slate-400">{new Date(attendee.start_at).toLocaleString('en-HK', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
                  {attendee.location && <div className="flex gap-2"><span>📍</span><span className="text-slate-400">{attendee.location}</span></div>}
                </div>
              )}
            </>
          )}

          {/* Code */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <button onClick={copyCode} className="text-xs text-slate-600 hover:text-slate-400 transition-colors font-mono">
              {copied ? '✓ Copied!' : `${code?.substring(0, 8)}…`}
            </button>
          </div>
        </div>

        {/* Share */}
        <div className="mt-6">
          <p className="text-center text-sm text-slate-500 mb-3">Share with your network</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {attendee?.slug && [
              { label: 'LINE', bg: 'bg-green-600', href: `https://line.me/R/msg/text/?${encodeURIComponent('I\'m attending ' + attendee.event_title)}` },
              { label: 'WhatsApp', bg: 'bg-[#25D366]', href: `https://wa.me/?text=${encodeURIComponent('I\'m attending ' + attendee.event_title + ' – join me!')}` },
              { label: 'Facebook', bg: 'bg-blue-600', href: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/eventflow/' + attendee.slug : '')}` },
            ].map(({ label, bg, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener"
                className={`${bg} text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/eventflow" className="text-slate-500 hover:text-white text-sm transition-colors">
            ← Browse more events
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
