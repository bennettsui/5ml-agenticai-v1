'use client';

import Link from 'next/link';

const CAPABILITIES = [
  { icon: '📈', title: 'Platform-wide Stats', desc: 'Total organizers, events, attendees, and check-ins across the entire EventFlow platform.' },
  { icon: '🎛', title: 'Event Oversight', desc: 'View all events across all organizers — status, registration counts, and organizer details.' },
  { icon: '👥', title: 'Organizer Management', desc: 'Review all registered organizers, their event counts, and plan levels.' },
  { icon: '🗳', title: 'Wishlist Moderation', desc: 'Review and update the status of community feature requests — approve, plan, or decline.' },
  { icon: '🔔', title: 'Notification Logs', desc: 'Monitor WhatsApp and LINE notification delivery across all events — spot failures fast.' },
  { icon: '🔍', title: 'Event Search', desc: 'Search and filter events by title, status, organizer, or date from a single view.' },
];

const WHO = [
  { role: 'Platform Admins', desc: 'Full access to all capabilities — granted by the 5ML platform team.' },
  { role: 'Organizers', desc: 'Manage their own events, contacts, and attendees only. No cross-organizer visibility.' },
  { role: 'Reception Staff', desc: 'Check-in access via PIN for a specific event only. No dashboard access.' },
];

export default function AdminGuidePage() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-xl">🛡</div>
          <div>
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-0.5">Platform 3 of 5</div>
            <h1 className="text-2xl font-black">Admin Platform</h1>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed max-w-2xl">
          The super-admin layer that gives the 5ML platform team full visibility across all events, organizers,
          and attendees. Organizers have a scoped view — you only see your own events and contacts.
        </p>
      </div>

      {/* Access notice */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-purple-400 text-lg mt-0.5">ℹ</span>
          <div>
            <div className="font-semibold text-purple-300 mb-1">Admin access is restricted</div>
            <div className="text-slate-400 text-sm leading-relaxed">
              The admin dashboard is accessible only to 5ML platform operators. As an organizer, your
              management scope is limited to your own events, contacts, and check-in data. Contact the
              5ML team if you need platform-level support.
            </div>
          </div>
        </div>
      </div>

      {/* Role tiers */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">Access roles</h2>
        <div className="space-y-3">
          {WHO.map(({ role, desc }) => (
            <div key={role} className="bg-slate-800/60 border border-white/[0.08] rounded-xl p-4 flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0" />
              <div>
                <div className="font-semibold text-sm mb-0.5">{role}</div>
                <div className="text-slate-500 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What admin can do */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">Admin capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CAPABILITIES.map(({ icon, title, desc }) => (
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

      {/* Organizer scope */}
      <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
        <h2 className="font-bold mb-4">What you can manage as an organizer</h2>
        <ul className="space-y-3 text-sm text-slate-400">
          {[
            'Create, edit, publish, and end your own events.',
            'Manage ticket tiers, pricing, and capacity for your events.',
            'View and export the contact list of your registered attendees.',
            'Monitor check-in stats and live attendance on event day.',
            'Submit feature requests and vote on wishlist items.',
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-purple-400 mt-0.5 shrink-0">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-5 border-t border-white/[0.06]">
          <Link href="/eventflow/organizer/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            Go to My Events →
          </Link>
        </div>
      </div>
    </div>
  );
}
