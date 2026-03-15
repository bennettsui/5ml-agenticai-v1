'use client';

import Link from 'next/link';

const JOURNEYS = [
  {
    role: 'Organizer',
    color: 'amber',
    icon: '🎯',
    steps: ['Sign up / Log in', 'Create event + tiers', 'Publish & share URL', 'Monitor registrations', 'Run reception on event day', 'Review post-event contacts'],
  },
  {
    role: 'Attendee',
    color: 'blue',
    icon: '👤',
    steps: ['Receives event link', 'Views event detail page', 'Selects ticket tier', 'Fills registration form', 'Gets QR confirmation', 'Shows QR at reception'],
  },
  {
    role: 'Reception Staff',
    color: 'green',
    icon: '🏢',
    steps: ['Opens /reception on tablet', 'Enters event PIN', 'Selects active event', 'Searches name or scans QR', 'Taps to check in', 'Monitors live stats'],
  },
  {
    role: 'Platform Admin',
    color: 'purple',
    icon: '🛡',
    steps: ['Views all events + organizers', 'Monitors notifications', 'Manages wishlist items', 'Reviews platform-wide stats', 'Supports organizers', 'Controls event visibility'],
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
  amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-400',  badge: 'border-amber-500/30' },
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400',   badge: 'border-blue-500/30' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  dot: 'bg-green-400',  badge: 'border-green-500/30' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400', badge: 'border-purple-500/30' },
};

export default function FlowsPage() {
  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl">🔄</div>
          <div>
            <div className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-0.5">Platform 4 of 5</div>
            <h1 className="text-2xl font-black">Platform Flows</h1>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed max-w-2xl">
          A visual map of how every stakeholder moves through the EventFlow system — from your first login
          to an attendee walking through the door. Understanding these flows helps you run smoother events.
        </p>
      </div>

      {/* Full infographic link */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-green-300 mb-1">View full platform infographic</div>
          <div className="text-slate-400 text-sm">See all stakeholder journeys side-by-side with the complete flow visualization.</div>
        </div>
        <Link href="/eventflow/flows"
          className="shrink-0 bg-green-500 hover:bg-green-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          Open Flows →
        </Link>
      </div>

      {/* Journey cards */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">Stakeholder journeys</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {JOURNEYS.map(({ role, color, icon, steps }) => {
            const c = COLOR_MAP[color];
            return (
              <div key={role} className={`bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center text-lg`}>{icon}</div>
                  <div className={`font-bold text-sm ${c.text}`}>{role}</div>
                </div>
                <ol className="space-y-2.5">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full ${c.bg} ${c.text} text-xs font-black flex items-center justify-center shrink-0`}>{i + 1}</div>
                      <span className={i === steps.length - 1 ? 'text-white font-medium' : 'text-slate-400'}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </div>

      {/* How the journeys connect */}
      <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
        <h2 className="font-bold mb-4">How the journeys connect</h2>
        <div className="space-y-3 text-sm text-slate-400">
          {[
            { from: 'Organizer publishes event', to: 'Attendee receives shareable URL', arrow: true },
            { from: 'Attendee completes registration', to: 'QR code generated and emailed', arrow: true },
            { from: 'Attendee arrives on event day', to: 'Reception staff scans QR → check-in confirmed', arrow: true },
            { from: 'Check-in data updates live', to: 'Organizer sees real-time stats in dashboard', arrow: true },
          ].map(({ from, to }, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className="bg-slate-700/60 rounded-lg px-3 py-1.5 text-white text-xs font-medium">{from}</span>
              <span className="text-green-400 text-xs">→</span>
              <span className="bg-slate-700/60 rounded-lg px-3 py-1.5 text-white text-xs font-medium">{to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
