'use client';

import Link from 'next/link';
import { useState } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    cta: 'Get started free',
    ctaHref: '/eventflow/organizer/signup',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-700',
    border: 'border-gray-200',
    features: [
      '1 active event at a time',
      'Up to 50 RSVPs / month',
      'Basic RSVP form',
      'QR code check-in',
      'Email confirmations',
      'Basic event analytics',
    ],
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/ month',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Starter →',
    ctaHref: '/eventflow/organizer/signup',
    ctaStyle: 'bg-orange-500 text-white hover:bg-orange-600',
    border: 'border-orange-300',
    features: [
      '5 active events',
      'Up to 500 RSVPs / month',
      'Custom RSVP form fields',
      'QR check-in app',
      'AI Event Description',
      'AI Social Posts',
      'Automated email reminders',
      'Contact management CRM',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/ month',
    highlight: false,
    cta: 'Go Pro →',
    ctaHref: '/eventflow/organizer/signup',
    ctaStyle: 'bg-violet-600 text-white hover:bg-violet-700',
    border: 'border-violet-300',
    features: [
      'Unlimited events & RSVPs',
      '0% platform fee (first $10k/mo)',
      'All 5 AI Studio tools',
      'Paid ticketing (Stripe)',
      'Custom branding & domain',
      'Team access (3 seats)',
      'Priority support',
      'Advanced analytics & exports',
      'API access',
    ],
  },
];

const FEATURES = [
  { icon: '🤖', title: 'AI Event Studio', desc: 'Auto-generate event descriptions, social posts, email campaigns, agenda, and banner prompts in seconds. No copywriter needed.', badge: 'Unique ✦', bc: 'bg-amber-100 text-amber-700' },
  { icon: '📋', title: 'Custom RSVP Forms', desc: 'Ask exactly what you need. Add dropdowns, text fields, checkboxes — unlimited custom questions on all plans.', badge: '', bc: '' },
  { icon: '📲', title: 'QR Code Check-in', desc: 'Scan attendee QR codes at the door with any smartphone. No extra hardware, no separate app required.', badge: '', bc: '' },
  { icon: '📊', title: 'Live Analytics', desc: 'Track registrations, check-in rate, and traffic sources in real time. Know exactly how your event is growing.', badge: '', bc: '' },
  { icon: '👥', title: 'Contact CRM', desc: 'Every RSVP becomes a contact. Build segments, track history, and re-engage your audience for future events.', badge: '', bc: '' },
  { icon: '🌏', title: 'Asia-First Payments', desc: 'Native HKD, TWD, and SGD. Accept local payments without currency conversion or extra gateway fees.', badge: 'Asia ✦', bc: 'bg-red-100 text-red-700' },
  { icon: '🔔', title: 'Smart Reminders', desc: 'Automated email reminders reduce no-shows by up to 40%. Scheduled sequences, no manual work.', badge: '', bc: '' },
  { icon: '🎨', title: 'Custom Branding', desc: 'Your logo, your colors, your domain. Attendees see your brand everywhere — not ours.', badge: 'Pro', bc: 'bg-violet-100 text-violet-700' },
];

const COMPARISON = [
  { feature: 'Platform fee (paid tickets)', ef: '0% on Pro', eb: '3.7% + $1.79/ticket', ex: '~5% + fees', efWin: true },
  { feature: 'AI content generation', ef: '5 tools built-in', eb: '❌ None', ex: '❌ None', efWin: true },
  { feature: 'Free tier', ef: '50 RSVPs/mo', eb: '25 orders/event', ex: '❌ No free tier', efWin: true },
  { feature: 'Custom RSVP forms', ef: '✅ All plans', eb: '❌ Paid plans only', ex: '✅ Paid only', efWin: true },
  { feature: 'Asia payment support', ef: '✅ Native HKD/TWD', eb: '⚠️ Limited', ex: '✅ Native', efWin: false },
  { feature: 'Built-in check-in', ef: '✅ Included', eb: '✅ Separate app', ex: '✅ Included', efWin: false },
  { feature: 'Contact CRM', ef: '✅ Built-in', eb: '❌ 3rd-party only', ex: '⚠️ Basic', efWin: true },
  { feature: 'Setup time', ef: '< 3 minutes', eb: '~15 minutes', ex: '~30 minutes', efWin: true },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '🎨', title: 'Create your event', desc: 'Set up your event page in minutes. Add ticket tiers, custom RSVP fields — or let AI write your description and social posts for you.' },
  { step: '02', icon: '📣', title: 'Share & fill seats', desc: 'Share one link. Attendees register instantly and get a QR ticket by email. Automated reminders keep no-shows low.' },
  { step: '03', icon: '📊', title: 'Run & analyse', desc: 'Scan QR codes at the door in seconds. Watch real-time dashboards. Download contact lists for follow-up campaigns.' },
];

const AI_TOOLS = [
  { icon: '📝', title: 'Event Description', desc: 'SEO-optimized copy that ranks and converts' },
  { icon: '📱', title: 'Social Posts', desc: 'Instagram, LinkedIn, Twitter — platform-specific' },
  { icon: '📧', title: 'Email Campaign', desc: 'Invite, remind, and follow-up sequences' },
  { icon: '📅', title: 'Agenda Builder', desc: 'Structured schedule with sessions and speakers' },
  { icon: '🎨', title: 'Banner Prompt', desc: 'Midjourney / DALL-E prompts for visuals' },
];

const TEAM = [
  { name: 'Alex Chen', role: 'CEO & Co-founder', emoji: '👨‍💼', bio: 'Former Eventbrite product lead. Built specifically for the Asia event market.' },
  { name: 'Sarah Lam', role: 'CTO', emoji: '👩‍💻', bio: '10 years building scalable event infrastructure at Ticketmaster and StubHub.' },
  { name: 'Marcus Wong', role: 'Head of AI', emoji: '🤖', bio: 'PhD in NLP. Designed the AI Studio that helps organizers 10x their marketing reach.' },
  { name: 'Priya Nair', role: 'Head of Growth', emoji: '📈', bio: 'Grew EventX APAC from 0 to 50,000 users. Now building something better.' },
];

const BLOGS = [
  { title: '10 AI prompts that will transform your event marketing in 2025', tag: 'AI Tips', date: 'Mar 10', color: 'bg-amber-50 border-amber-100' },
  { title: 'Why we charge 0% platform fees — and how we still make money', tag: 'Product', date: 'Mar 5', color: 'bg-blue-50 border-blue-100' },
  { title: 'EventFlow vs Eventbrite: an honest feature-by-feature comparison', tag: 'Compare', date: 'Feb 28', color: 'bg-orange-50 border-orange-100' },
];

const FAQS = [
  { q: 'Is EventFlow really free?', a: 'Yes. The Free plan requires no credit card. You can host 1 active event and collect up to 50 RSVPs per month at absolutely no cost — forever.' },
  { q: 'How does the 0% platform fee work?', a: 'On the Pro plan, we charge 0% on your first $10,000 in monthly ticket revenue. After that, just 1.5%. Compare that to Eventbrite\'s 3.7% + $1.79 per ticket — savings add up fast.' },
  { q: 'What is AI Studio?', a: 'AI Studio is our built-in AI assistant. It auto-generates event descriptions (SEO-optimized), social media posts, email campaigns, event agendas, and banner image prompts — all in one click. No other platform has this.' },
  { q: 'Can I use my own branding?', a: 'On the Pro plan, you can add your logo, brand colors, and connect a custom domain. Attendees see your brand throughout — on the RSVP page, tickets, and emails.' },
  { q: 'How does QR check-in work?', a: 'Each registered attendee receives a unique QR code by email. On event day, your reception staff opens /eventflow/reception on any smartphone and scans codes — no extra hardware, no app download required.' },
  { q: 'Can I charge for tickets?', a: 'Yes. Paid ticketing with Stripe is available on the Pro plan. You can create multiple ticket tiers with different prices, capacities, and colors.' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrganizerMarketingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 md:pb-0">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/eventflow" className="flex items-center gap-2">
            <span className="text-2xl">🎟️</span>
            <span className="font-black text-xl tracking-tight text-gray-900">EventFlow</span>
            <span className="hidden sm:block text-xs font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full ml-1">For Organizers</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">Pricing</a>
            <a href="#features" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">Features</a>
            <Link href="/eventflow/organizer/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">Sign in</Link>
            <Link href="/eventflow/organizer/signup" className="text-sm font-bold px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-sm">
              Get started free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700/20 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            🚀 The AI-first event platform for Asia &amp; beyond
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Host events that<br /><span className="text-yellow-100">actually convert</span>
          </h1>
          <p className="text-orange-100 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Create, market, and manage your events with AI-powered tools — at 0% platform fee.
            Better than Eventbrite. More affordable than EventX.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link href="/eventflow/organizer/signup"
              className="inline-flex items-center justify-center bg-white text-orange-600 font-black px-8 py-4 rounded-2xl hover:bg-orange-50 transition-colors shadow-2xl text-lg">
              Start for free — no credit card →
            </Link>
            <a href="#features"
              className="inline-flex items-center justify-center bg-white/15 border border-white/30 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/25 transition-colors text-lg">
              See all features ↓
            </a>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { v: '0%', l: 'Platform fee (Pro)' },
              { v: '5', l: 'AI tools built-in' },
              { v: '3 min', l: 'Event setup time' },
              { v: '40%', l: 'Fewer no-shows' },
            ].map(s => (
              <div key={s.l} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-black">{s.v}</div>
                <div className="text-orange-100 text-xs mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── vs competitors strip ──────────────────────────────────────────── */}
      <div className="bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium">
          <span className="text-gray-500 text-xs uppercase tracking-wider">Better than:</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Eventbrite <span className="text-gray-500 font-normal">— no per-ticket fees</span></span>
          <span className="text-gray-700 hidden sm:block">·</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> EventX <span className="text-gray-500 font-normal">— AI tools + free tier</span></span>
          <span className="text-gray-700 hidden sm:block">·</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Meetup <span className="text-gray-500 font-normal">— professional-grade features</span></span>
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Up and running in minutes</h2>
          <p className="text-gray-500 max-w-lg mx-auto">No complex setup. No sales calls. No training needed.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
              <div className="text-7xl font-black text-orange-100 absolute top-4 right-5 select-none leading-none">{s.step}</div>
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <div id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Everything you need, nothing you don&apos;t</h2>
            <p className="text-gray-500 max-w-lg mx-auto">From event creation to post-event follow-up — all in one platform, no integrations required.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">{f.title}</h3>
                  {f.badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${f.bc}`}>{f.badge}</span>}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Studio spotlight ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-y border-orange-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-bold mb-5">
                🤖 AI Studio — Exclusive to EventFlow
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Your AI marketing team, built right in</h2>
              <p className="text-gray-600 mb-7 leading-relaxed">
                EventFlow's AI Studio gives you 5 powerful content tools that Eventbrite, EventX, and every other platform
                simply doesn&apos;t have. Stop spending hours writing — let AI generate it in seconds, then refine to your taste.
              </p>
              <div className="space-y-3">
                {AI_TOOLS.map(t => (
                  <div key={t.title} className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-orange-100 shadow-sm">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{t.title}</div>
                      <div className="text-xs text-gray-500">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock AI output */}
            <div className="bg-white rounded-2xl border border-orange-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">🤖 AI Studio</div>
                <span className="text-xs text-orange-100 bg-white/20 px-2 py-0.5 rounded-full">Generating…</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="text-xs text-amber-700 font-bold mb-2">📝 Event Description (SEO)</div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    &ldquo;Join 500+ professionals at <strong>HK Tech Summit 2025</strong> — the premier conference where Hong Kong&apos;s brightest innovators gather to shape the future of technology. Three days of keynotes, workshops, and unparalleled networking…&rdquo;
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <div className="text-xs text-blue-700 font-bold mb-1.5">📱 Instagram</div>
                    <p className="text-xs text-gray-600">🚀 HK Tech Summit is HERE! Early bird ends Friday. Tag someone who needs to be there 👇 #HKTech</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="text-xs text-green-700 font-bold mb-1.5">📧 Email Subject</div>
                    <p className="text-xs text-gray-600">&ldquo;[Last 50 seats] HK Tech Summit — secure yours before Friday&rdquo;</p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-400">Generated in 2.8s · Powered by DeepSeek AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <div id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-500">No hidden fees. No per-ticket charges on free events. No surprises.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl border-2 ${plan.border} bg-white p-8 shadow-sm ${plan.highlight ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-black px-5 py-1 rounded-full shadow-lg">
                  {(plan as any).badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-black text-xl text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref} className={`block text-center font-bold py-3.5 rounded-xl transition-colors text-sm ${plan.ctaStyle}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-6">
          All plans include SSL security, 99.9% uptime SLA, and free event pages. Upgrade or cancel anytime.
        </p>
      </div>

      {/* ── Comparison table ──────────────────────────────────────────────── */}
      <div className="bg-gray-50 border-y border-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">How we compare</h2>
            <p className="text-gray-500">We&apos;re not afraid to show the numbers. Here&apos;s an honest side-by-side.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-6 font-bold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">Feature</th>
                  <th className="py-4 px-4 text-center bg-orange-50">
                    <span className="font-black text-orange-600">🎟️ EventFlow</span>
                  </th>
                  <th className="py-4 px-4 text-center text-gray-500 font-semibold text-xs">Eventbrite</th>
                  <th className="py-4 px-4 text-center text-gray-500 font-semibold text-xs">EventX</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-3.5 px-6 text-gray-700 font-medium">{row.feature}</td>
                    <td className={`py-3.5 px-4 text-center font-semibold ${row.efWin ? 'text-orange-600' : 'text-gray-700'}`}>{row.ef}</td>
                    <td className="py-3.5 px-4 text-center text-gray-400">{row.eb}</td>
                    <td className="py-3.5 px-4 text-center text-gray-400">{row.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Public pricing as of March 2025. Fees may vary by region and plan.</p>
        </div>
      </div>

      {/* ── Blog ──────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">From our blog</h2>
            <p className="text-gray-500 text-sm mt-0.5">Tips, guides, and honest product stories</p>
          </div>
          <span className="text-sm text-gray-400">Coming soon →</span>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {BLOGS.map((b) => (
            <div key={b.title} className={`rounded-2xl border p-6 ${b.color} hover:shadow-md transition-all`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">{b.tag}</span>
                <span className="text-xs text-gray-400">{b.date}</span>
              </div>
              <h3 className="font-bold text-gray-900 leading-snug text-sm">{b.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-y border-violet-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Built by event industry veterans</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Our team has scaled event platforms in Asia, Europe, and North America. We know the pain points — and we built the fix.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-violet-100 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className="text-5xl mb-3">{t.emoji}</div>
                <h3 className="font-bold text-gray-900">{t.name}</h3>
                <p className="text-xs text-violet-600 font-semibold mb-2">{t.role}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ / Support ─────────────────────────────────────────────────── */}
      <div id="support" className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Frequently asked questions</h2>
          <p className="text-gray-500">
            Still unsure?{' '}
            <a href="mailto:hello@eventflow.com" className="text-orange-500 hover:underline">Chat with our team →</a>
          </p>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors">
                <span className="font-bold text-gray-900 text-sm">{faq.q}</span>
                <span className={`text-gray-400 text-lg transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 bg-orange-50 rounded-2xl border border-orange-100 p-6 text-center">
          <p className="text-sm text-gray-700 mb-4">Still have questions? We reply within 2 hours on business days.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:hello@eventflow.com" className="text-sm font-semibold text-orange-600 hover:underline">📧 hello@eventflow.com</a>
            <span className="text-gray-300 hidden sm:block">·</span>
            <Link href="/eventflow/wishlist" className="text-sm font-semibold text-orange-600 hover:underline">💡 Request a feature</Link>
          </div>
        </div>
      </div>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 text-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Your next event starts<br /><span className="text-orange-400">right here</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of organizers who chose EventFlow over Eventbrite — and never looked back.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/eventflow/organizer/signup"
              className="inline-flex items-center justify-center bg-orange-500 text-white font-black px-10 py-4 rounded-2xl hover:bg-orange-400 transition-colors shadow-2xl shadow-orange-500/30 text-lg">
              Create your first event free →
            </Link>
            <Link href="/eventflow/organizer/login"
              className="inline-flex items-center justify-center bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors text-lg">
              Sign in to your account
            </Link>
          </div>
          <p className="text-gray-600 text-sm">Free forever. No credit card required. Upgrade when you&apos;re ready.</p>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎟️</span>
                <span className="font-black text-white">EventFlow</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">Where great events begin — and relationships last.</p>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Product</h4>
              <div className="space-y-2 text-xs text-gray-500">
                <div><a href="#features" className="hover:text-white transition-colors">Features</a></div>
                <div><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></div>
                <div><Link href="/eventflow/flows" className="hover:text-white transition-colors">Flows</Link></div>
                <div><Link href="/eventflow/wishlist" className="hover:text-white transition-colors">Wishlist</Link></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Portals</h4>
              <div className="space-y-2 text-xs text-gray-500">
                <div><Link href="/eventflow" className="hover:text-white transition-colors">🎫 For Participants</Link></div>
                <div><Link href="/eventflow/organizer" className="hover:text-white transition-colors">🎤 For Organizers</Link></div>
                <div><Link href="/eventflow/reception" className="hover:text-white transition-colors">✅ Reception Staff</Link></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Support</h4>
              <div className="space-y-2 text-xs text-gray-500">
                <div><a href="mailto:hello@eventflow.com" className="hover:text-white transition-colors">hello@eventflow.com</a></div>
                <div><a href="#support" className="hover:text-white transition-colors">FAQ</a></div>
                <div><Link href="/eventflow/wishlist" className="hover:text-white transition-colors">Feature requests</Link></div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <span>© 2025 EventFlow. All rights reserved.</span>
            <span>Powered by 5ML Agentic AI Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
