'use client';

/**
 * EventFlow — Platform Flows Infographic
 * Visual overview of all stakeholder journeys in the EventFlow system.
 */

import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowStep {
  icon: string;
  label: string;
  sub?: string;
  highlight?: boolean;
}

interface Flow {
  id: string;
  title: string;
  role: string;
  color: string;          // Tailwind color class prefix e.g. 'amber'
  accent: string;         // hex for inline styles
  icon: string;
  steps: FlowStep[];
  link?: { href: string; label: string };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FLOWS: Flow[] = [
  {
    id: 'organizer',
    title: 'Organizer Flow',
    role: 'Event Creator',
    color: 'amber',
    accent: '#f59e0b',
    icon: '🏢',
    link: { href: '/eventflow/organizer', label: 'Open Dashboard' },
    steps: [
      { icon: '✍️', label: 'Sign Up', sub: 'Create organizer account' },
      { icon: '📅', label: 'Create Event', sub: 'Title, date, location, banner', highlight: true },
      { icon: '🎟️', label: 'Set Tiers', sub: 'Pricing, capacity, colors' },
      { icon: '🔑', label: 'Set Check-in PIN', sub: 'For kiosk & reception staff' },
      { icon: '🚀', label: 'Publish', sub: 'Event goes live on /eventflow' },
      { icon: '📊', label: 'Monitor', sub: 'Real-time registrations & check-ins', highlight: true },
      { icon: '👥', label: 'CRM', sub: 'Contact list grows with each RSVP' },
      { icon: '📩', label: 'Notifications', sub: '7d, 1d reminders + thank you auto-sent' },
    ],
  },
  {
    id: 'participant',
    title: 'Participant Flow',
    role: 'Event Attendee',
    color: 'blue',
    accent: '#3b82f6',
    icon: '👤',
    steps: [
      { icon: '🌐', label: 'Browse Events', sub: 'Public listing at /eventflow' },
      { icon: '🎫', label: 'Select Event', sub: 'View details, tiers, date, location' },
      { icon: '📋', label: 'Register', sub: 'Name, email, organization (one form)', highlight: true },
      { icon: '✅', label: 'Confirmation', sub: 'QR code emailed + shown on screen' },
      { icon: '📧', label: '7-Day Reminder', sub: 'Email sent automatically' },
      { icon: '🔔', label: '1-Day Reminder', sub: 'Email + WhatsApp/LINE if opted in' },
      { icon: '🚪', label: 'Doors Open Alert', sub: 'Day-of notification' },
      { icon: '🙏', label: 'Post-Event Thanks', sub: 'Thank you email day after', highlight: true },
    ],
  },
  {
    id: 'checkin',
    title: 'Kiosk Check-in Flow',
    role: 'Self-service Kiosk',
    color: 'green',
    accent: '#22c55e',
    icon: '🖥️',
    link: { href: '/eventflow/checkin', label: 'Open Kiosk' },
    steps: [
      { icon: '🔐', label: 'Enter PIN', sub: 'Staff unlocks kiosk with event PIN' },
      { icon: '📷', label: 'QR Scan', sub: 'Attendee scans their QR code' },
      { icon: '👁️', label: 'Preview Card', sub: 'Name, tier, status shown' },
      { icon: '✅', label: 'Confirm Check-in', sub: 'One tap to mark arrived', highlight: true },
      { icon: '🎉', label: 'Success Screen', sub: 'Welcome message displayed' },
      { icon: '📊', label: 'Live Counter', sub: 'Real-time count updates', highlight: true },
    ],
  },
  {
    id: 'reception',
    title: 'Reception Staff Flow',
    role: 'RD / Front Desk',
    color: 'purple',
    accent: '#a855f7',
    icon: '🎫',
    link: { href: '/eventflow/reception', label: 'Open Reception' },
    steps: [
      { icon: '🔐', label: 'PIN Login', sub: 'Event ID + check-in PIN' },
      { icon: '📊', label: 'Live Dashboard', sub: 'Real-time check-in progress bar' },
      { icon: '🔍', label: 'Name Search', sub: 'Find attendee instantly', highlight: true },
      { icon: '📷', label: 'QR Scan', sub: 'Camera scan from phone/email' },
      { icon: '👁️', label: 'Confirm Card', sub: 'View attendee details + tier' },
      { icon: '✅', label: 'One-tap Check-in', sub: 'Mark arrived with single tap', highlight: true },
      { icon: '🔁', label: 'Next Attendee', sub: 'Instantly ready for next scan' },
    ],
  },
  {
    id: 'admin',
    title: 'Super Admin Flow',
    role: 'ExpLab Staff',
    color: 'amber',
    accent: '#f59e0b',
    icon: '⚡',
    link: { href: '/eventflow/admin', label: 'Open Admin Panel' },
    steps: [
      { icon: '🔑', label: 'Admin Secret', sub: 'x-admin-secret header auth' },
      { icon: '📈', label: 'Platform Stats', sub: 'All organizers, events, attendees' },
      { icon: '🏢', label: 'Manage Organizers', sub: 'Set plan: Free / Pro / ExpLab Staff', highlight: true },
      { icon: '📅', label: 'Manage Events', sub: 'Change status, delete events' },
      { icon: '📩', label: 'Notifications', sub: 'View notification pipeline status' },
    ],
  },
];

// ─── Notification timeline ────────────────────────────────────────────────────

const NOTIFICATIONS = [
  { icon: '✅', label: 'Confirmation',    time: 'Immediately after RSVP',   channel: 'Email', color: '#22c55e' },
  { icon: '📅', label: '7-Day Reminder',  time: '7 days before event',      channel: 'Email', color: '#3b82f6' },
  { icon: '🔔', label: '1-Day Reminder',  time: '1 day before event',       channel: 'Email + WhatsApp/LINE', color: '#a855f7' },
  { icon: '🚪', label: 'Doors Open',      time: 'Day of event',             channel: 'Email + WhatsApp/LINE', color: '#f59e0b' },
  { icon: '🙏', label: 'Post-event',      time: '1 day after event',        channel: 'Email', color: '#ec4899' },
];

// ─── Component ────────────────────────────────────────────────────────────────

function FlowCard({ flow }: { flow: Flow }) {
  return (
    <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between"
        style={{ background: flow.accent + '10' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{flow.icon}</span>
          <div>
            <h3 className="font-bold text-white text-base">{flow.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: flow.accent }}>{flow.role}</p>
          </div>
        </div>
        {flow.link && (
          <Link href={flow.link.href}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: flow.accent, background: flow.accent + '18', border: `1px solid ${flow.accent}30` }}>
            {flow.link.label} →
          </Link>
        )}
      </div>

      {/* Steps */}
      <div className="p-4">
        <div className="space-y-1">
          {flow.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Connector */}
              <div className="flex flex-col items-center flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: step.highlight ? flow.accent + '22' : 'rgba(255,255,255,0.04)', border: step.highlight ? `1px solid ${flow.accent}40` : '1px solid rgba(255,255,255,0.06)' }}>
                  {step.icon}
                </div>
                {i < flow.steps.length - 1 && (
                  <div className="w-px h-4 my-0.5" style={{ background: step.highlight ? flow.accent + '40' : 'rgba(255,255,255,0.06)' }} />
                )}
              </div>
              <div className="pb-1 pt-1">
                <div className={`text-sm font-semibold leading-tight ${step.highlight ? 'text-white' : 'text-slate-300'}`}>{step.label}</div>
                {step.sub && <div className="text-xs text-slate-500 mt-0.5">{step.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FlowsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/eventflow" className="text-slate-400 hover:text-white transition-colors text-sm">← EventFlow</Link>
          <span className="text-slate-700">/</span>
          <span className="text-sm font-semibold text-slate-300">Platform Flows</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full mb-4">
            ⚡ EventFlow Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Platform Flows</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            End-to-end journey maps for every stakeholder — from event creation to post-event follow-up.
          </p>
        </div>

        {/* Flow cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
          {FLOWS.map((flow) => (
            <FlowCard key={flow.id} flow={flow} />
          ))}
        </div>

        {/* Notification timeline */}
        <div className="mb-16">
          <h2 className="text-2xl font-black mb-2">Automated Notification Timeline</h2>
          <p className="text-slate-500 text-sm mb-8">Multi-channel notifications scheduled automatically for every registered attendee.</p>

          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-8 left-0 right-0 h-px bg-white/[0.06] hidden sm:block" />

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  {/* Node */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-3 relative z-10"
                    style={{ background: n.color + '18', border: `1px solid ${n.color}35` }}>
                    {n.icon}
                  </div>
                  <div className="font-bold text-sm text-white">{n.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{n.time}</div>
                  <div className="text-xs font-semibold mt-2 px-2 py-0.5 rounded-full"
                    style={{ color: n.color, background: n.color + '18' }}>
                    {n.channel}
                  </div>
                  {/* Arrow between steps (mobile) */}
                  {i < NOTIFICATIONS.length - 1 && (
                    <div className="sm:hidden text-slate-700 text-xl mt-3">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System architecture summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            { icon: '🗄️', title: 'Database', items: ['ef_organizers', 'ef_events', 'ef_ticket_tiers', 'ef_attendees', 'ef_contacts', 'ef_notification_schedule'] },
            { icon: '🔐', title: 'Auth Layers', items: ['JWT (organizers)', 'PIN (kiosk/reception)', 'x-admin-secret (super admin)', '30-day token expiry'] },
            { icon: '📡', title: 'Real-time', items: ['SSE event streams', 'Live check-in counter', 'Organizer dashboard sync', 'Kiosk auto-refresh'] },
            { icon: '📬', title: 'Notifications', items: ['Email (all)', 'WhatsApp (opt-in)', 'LINE (opt-in)', 'Scheduled engine (cron)'] },
          ].map((section) => (
            <div key={section.title} className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{section.icon}</span>
                <h3 className="font-bold text-sm">{section.title}</h3>
              </div>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item} className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick access links */}
        <div className="border-t border-white/[0.06] pt-10">
          <h2 className="text-lg font-bold mb-6 text-slate-300">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { href: '/eventflow', icon: '🌐', label: 'Public Events' },
              { href: '/eventflow/organizer', icon: '🏢', label: 'Organizer' },
              { href: '/eventflow/checkin', icon: '🖥️', label: 'Kiosk' },
              { href: '/eventflow/reception', icon: '🎫', label: 'Reception' },
              { href: '/eventflow/admin', icon: '⚡', label: 'Admin' },
            ].map(({ href, icon, label }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-2 p-4 bg-slate-900/40 border border-white/[0.06] rounded-xl hover:border-amber-500/30 hover:bg-amber-500/[0.04] transition-all">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold text-slate-400">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
