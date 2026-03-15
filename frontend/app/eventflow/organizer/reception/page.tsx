'use client';

import Link from 'next/link';

const FEATURES = [
  { icon: '🔍', title: 'Name Search', desc: 'Staff can type any attendee\'s name or email to instantly find and check them in.' },
  { icon: '📷', title: 'QR / Barcode Scan', desc: 'Use the device camera to scan an attendee\'s QR code for instant one-tap check-in.' },
  { icon: '📊', title: 'Live Stats Bar', desc: 'A real-time counter shows total registered vs. checked-in so you always know capacity at a glance.' },
  { icon: '🔒', title: 'PIN-Based Auth', desc: 'Reception staff log in with a shared event PIN — no personal accounts needed, safe to use on shared tablets.' },
  { icon: '📱', title: 'Kiosk Mode', desc: 'Designed for a tablet mounted at the entrance — large tap targets, high-contrast UI, works offline briefly.' },
  { icon: '⚡', title: 'Instant Feedback', desc: 'Green/red flash confirms check-in success or flags duplicates — keeps the queue moving fast.' },
];

const SETUP_STEPS = [
  { step: '1', label: 'Get Event PIN', desc: 'Find the PIN in your event\'s Manage page. Share it only with reception staff.' },
  { step: '2', label: 'Open Reception', desc: 'Go to /eventflow/reception on a tablet or laptop at the entrance.' },
  { step: '3', label: 'Select Event', desc: 'Staff enters the PIN and selects the active event to begin.' },
  { step: '4', label: 'Check In', desc: 'Search by name or scan QR — one tap to confirm check-in.' },
];

export default function ReceptionPage() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl">🏢</div>
          <div>
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-0.5">Platform 2 of 5</div>
            <h1 className="text-2xl font-black">Reception</h1>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed max-w-2xl">
          The front-desk check-in interface your reception staff use on event day. Optimised for tablets and phones —
          staff can search by name, scan QR codes, and see live attendance counts in real time.
        </p>
      </div>

      {/* Launch callout */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-blue-300 mb-1">Launch Reception Mode</div>
          <div className="text-slate-400 text-sm">Open this on a tablet or desktop at your event entrance. Staff log in with the event PIN.</div>
        </div>
        <Link href="/eventflow/reception"
          className="shrink-0 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          Open Reception →
        </Link>
      </div>

      {/* Setup steps */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">Day-of setup</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SETUP_STEPS.map(({ step, label, desc }) => (
            <div key={step} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-4">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-sm font-black flex items-center justify-center mb-3">{step}</div>
              <div className="font-semibold text-sm mb-1">{label}</div>
              <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">Reception features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5 flex gap-4">
              <div className="text-2xl shrink-0">{icon}</div>
              <div>
                <div className="font-semibold text-sm mb-1">{title}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best practices */}
      <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
        <h2 className="font-bold mb-4">Best practices</h2>
        <ul className="space-y-3 text-sm text-slate-400">
          {[
            'Brief reception staff on the PIN before the event — never display it publicly.',
            'Use a dedicated tablet mounted at the entrance for the smoothest experience.',
            'Have a second device ready as backup — the app runs in any browser.',
            'Check the live stats bar periodically to gauge how many are still to arrive.',
            'Use name search as the fallback if an attendee\'s QR code is unavailable.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-blue-400 mt-0.5 shrink-0">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
