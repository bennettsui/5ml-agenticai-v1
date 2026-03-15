'use client';

import Link from 'next/link';

const FEATURES = [
  { icon: '📋', title: 'Event Detail Page', desc: 'A branded public page showing event info, schedule, tiers, and an RSVP form — accessible via a shareable URL.' },
  { icon: '🎟', title: 'Ticket Tiers', desc: 'Multiple ticket categories (VIP, General, Staff) with individual pricing, capacity limits, and color coding.' },
  { icon: '📝', title: 'Custom Registration Form', desc: 'Collect custom attendee data beyond name and email — dietary needs, company, referral source, and more.' },
  { icon: '✅', title: 'QR Code Confirmation', desc: 'Every registrant receives a unique QR code for express check-in at the reception desk.' },
  { icon: '📱', title: 'Mobile-Optimised', desc: 'The attendee page is fully responsive — works on any phone, tablet, or desktop without an app download.' },
  { icon: '🔔', title: 'Notifications', desc: 'Attendees opt in to WhatsApp or LINE reminders — reducing no-shows before the event.' },
];

const STEPS = [
  { step: '1', label: 'Create Event', desc: 'Set title, date, location, and cover banner.' },
  { step: '2', label: 'Add Tiers', desc: 'Define ticket categories with pricing and capacity.' },
  { step: '3', label: 'Customise Form', desc: 'Add any extra fields you need from attendees.' },
  { step: '4', label: 'Publish & Share', desc: 'Go live — share the link on social media or email.' },
];

export default function AttendeePortalPage() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-xl">🎫</div>
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-0.5">Platform 1 of 5</div>
            <h1 className="text-2xl font-black">Attendee Portal</h1>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed max-w-2xl">
          The public-facing event page your attendees interact with — from discovering your event and registering,
          to receiving their QR ticket confirmation. No app download required.
        </p>
      </div>

      {/* Preview link callout */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-amber-300 mb-1">See it live</div>
          <div className="text-slate-400 text-sm">Open any of your published events to preview the attendee experience.</div>
        </div>
        <Link href="/eventflow/organizer/events"
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          My Events →
        </Link>
      </div>

      {/* How it works */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">How to set it up</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEPS.map(({ step, label, desc }) => (
            <div key={step} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-4">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-sm font-black flex items-center justify-center mb-3">{step}</div>
              <div className="font-semibold text-sm mb-1">{label}</div>
              <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">What attendees get</h2>
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

      {/* Sharing tips */}
      <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
        <h2 className="font-bold mb-4">Sharing tips</h2>
        <ul className="space-y-3 text-sm text-slate-400">
          {[
            'Copy the event URL from your Events list and paste it into WhatsApp, Instagram bio, or email campaigns.',
            'Use the QR code on printed collateral — attendees can scan to register on the spot.',
            'Enable WhatsApp reminders to reduce no-shows — attendees opt in during registration.',
            'Set ticket tier capacity limits to create urgency and drive early registration.',
          ].map((tip, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-amber-500 mt-0.5 shrink-0">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
