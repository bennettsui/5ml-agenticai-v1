'use client';

import Link from 'next/link';

const CATEGORIES = [
  { key: 'feature',     label: 'Feature Request', icon: '✨', desc: 'New capabilities you\'d like to see added to EventFlow.' },
  { key: 'ux',          label: 'UX / Design',      icon: '🎨', desc: 'Improvements to how the platform looks or feels.' },
  { key: 'integration', label: 'Integration',       icon: '🔗', desc: 'Connections to external tools — CRM, payment, email, etc.' },
  { key: 'ai',          label: 'AI',                icon: '🤖', desc: 'AI-powered automation, personalization, or analytics.' },
  { key: 'general',     label: 'General',           icon: '💬', desc: 'Feedback, questions, or anything that doesn\'t fit above.' },
];

const HOW_IT_WORKS = [
  { step: '1', label: 'Submit a request', desc: 'Describe the feature or improvement you\'d like to see.' },
  { step: '2', label: 'Community votes', desc: 'Other organizers and attendees upvote requests they want too.' },
  { step: '3', label: 'Team reviews', desc: 'The 5ML team evaluates requests by votes and impact.' },
  { step: '4', label: 'Status update', desc: 'Approved items move to Planned → Done. Declined items are explained.' },
];

export default function WishlistPage() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center text-xl">💡</div>
          <div>
            <div className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-0.5">Platform 5 of 5</div>
            <h1 className="text-2xl font-black">Wishlist</h1>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed max-w-2xl">
          A community-driven feature request board where organizers and attendees can submit ideas, vote on
          improvements, and track what the 5ML team is working on next. Your feedback directly shapes EventFlow.
        </p>
      </div>

      {/* CTA */}
      <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-pink-300 mb-1">Submit a feature request</div>
          <div className="text-slate-400 text-sm">Have an idea? Tell the team — and vote on what others have already suggested.</div>
        </div>
        <Link href="/eventflow/wishlist"
          className="shrink-0 bg-pink-500 hover:bg-pink-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          Open Wishlist →
        </Link>
      </div>

      {/* How it works */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">How it works</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HOW_IT_WORKS.map(({ step, label, desc }) => (
            <div key={step} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-4">
              <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 text-sm font-black flex items-center justify-center mb-3">{step}</div>
              <div className="font-semibold text-sm mb-1">{label}</div>
              <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4">Request categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map(({ icon, label, desc }) => (
            <div key={label} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5 flex gap-4">
              <div className="text-2xl shrink-0">{icon}</div>
              <div>
                <div className="font-semibold text-sm mb-1">{label}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status guide */}
      <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
        <h2 className="font-bold mb-4">Request statuses</h2>
        <div className="space-y-3">
          {[
            { status: 'Open',     color: 'bg-blue-500/15 text-blue-400',    desc: 'Submitted and open for community votes.' },
            { status: 'Planned',  color: 'bg-amber-500/15 text-amber-400',  desc: 'Approved by the 5ML team — on the roadmap.' },
            { status: 'Done',     color: 'bg-green-500/15 text-green-400',  desc: 'Shipped — available in the platform.' },
            { status: 'Declined', color: 'bg-slate-700 text-slate-500',     desc: 'Not moving forward — reason provided by team.' },
          ].map(({ status, color, desc }) => (
            <div key={status} className="flex items-center gap-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${color}`}>{status}</span>
              <span className="text-slate-400 text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
