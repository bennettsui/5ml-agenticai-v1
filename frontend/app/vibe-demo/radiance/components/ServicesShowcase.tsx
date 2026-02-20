'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const services = [
  {
    id: 'pr',
    name: 'Public Relations',
    tagline: 'Earn Credibility at Scale',
    description: 'Strategic media communications placing your brand in top-tier Hong Kong publications, broadcasters, and digital outlets.',
    stat: '80+', statLabel: 'media placements',
    color: 'from-violet-600/20 to-violet-900/5',
    glow: 'rgba(139,92,246,0.35)',
    border: 'rgba(139,92,246,0.4)',
    tag: '#8B5CF6',
    href: '/vibe-demo/radiance/services/public-relations',
  },
  {
    id: 'events',
    name: 'Events & Experiences',
    tagline: 'Create Unforgettable Moments',
    description: 'From intimate media briefings to large-scale launches—brand events that generate buzz, coverage, and lasting impressions.',
    stat: '50+', statLabel: 'events produced',
    color: 'from-fuchsia-600/20 to-fuchsia-900/5',
    glow: 'rgba(217,70,239,0.35)',
    border: 'rgba(217,70,239,0.4)',
    tag: '#D946EF',
    href: '/vibe-demo/radiance/services/events',
  },
  {
    id: 'social',
    name: 'Social Media & Content',
    tagline: 'Build Community, Drive Conversation',
    description: 'Always-on social strategy, community management, and content production that keeps your brand growing across platforms.',
    stat: '10×', statLabel: 'engagement growth',
    color: 'from-pink-600/20 to-pink-900/5',
    glow: 'rgba(236,72,153,0.35)',
    border: 'rgba(236,72,153,0.4)',
    tag: '#EC4899',
    href: '/vibe-demo/radiance/services/social-media',
  },
  {
    id: 'kol',
    name: 'KOL & Influencer Marketing',
    tagline: 'Authentic Voices, Real Impact',
    description: 'We identify and activate the right creators—nano-influencers to celebrities—for campaigns that feel genuine and convert.',
    stat: '200+', statLabel: 'KOL network',
    color: 'from-rose-600/20 to-rose-900/5',
    glow: 'rgba(244,63,94,0.35)',
    border: 'rgba(244,63,94,0.4)',
    tag: '#F43F5E',
    href: '/vibe-demo/radiance/services/kol-marketing',
  },
  {
    id: 'creative',
    name: 'Creative & Production',
    tagline: 'Ideas Brought to Life',
    description: 'In-house design, video, and copywriting. Polished campaigns without agency markup or external delays.',
    stat: '100%', statLabel: 'in-house',
    color: 'from-orange-600/20 to-orange-900/5',
    glow: 'rgba(249,115,22,0.35)',
    border: 'rgba(249,115,22,0.4)',
    tag: '#F97316',
    href: '/vibe-demo/radiance/services/creative-production',
  },
  {
    id: 'integrated',
    name: 'Integrated Campaigns',
    tagline: 'Every Channel, One Strategy',
    description: 'PR amplifies events. Events drive social. Social extends media reach. Every touchpoint reinforces the others.',
    stat: '3×', statLabel: 'ROI vs siloed',
    color: 'from-amber-600/20 to-amber-900/5',
    glow: 'rgba(245,158,11,0.35)',
    border: 'rgba(245,158,11,0.4)',
    tag: '#F59E0B',
    href: '/vibe-demo/radiance/consultation',
  },
];

/* ── Individual tilt card ─────────────────────────────────── */
function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      setTilt({ x: -dy * 12, y: dx * 12 });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '900px' }}
      className="cursor-pointer"
    >
      <Link
        href={service.href}
        onMouseDown={e => e.stopPropagation()}
        className="block h-full"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? 'translateZ(6px)' : 'translateZ(0)'}`,
          transition: hovered ? 'transform 0.08s linear' : 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <div
          className={`relative h-full p-7 rounded-2xl bg-gradient-to-br ${service.color} flex flex-col gap-5 overflow-hidden`}
          style={{
            border: `1px solid ${hovered ? service.border : 'rgba(255,255,255,0.06)'}`,
            boxShadow: hovered
              ? `0 0 0 1px ${service.border}, 0 20px 60px -10px ${service.glow}`
              : '0 1px 3px rgba(0,0,0,0.4)',
            transition: 'border 0.3s, box-shadow 0.3s',
            background: hovered
              ? `radial-gradient(ellipse at ${50 + tilt.y * 2}% ${50 - tilt.x * 2}%, ${service.glow.replace('0.35', '0.08')} 0%, transparent 70%), linear-gradient(135deg, rgba(255,255,255,0.04), rgba(0,0,0,0.1))`
              : undefined,
          }}
        >
          {/* Shine overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: hovered
                ? `radial-gradient(ellipse at ${55 + tilt.y * 3}% ${40 - tilt.x * 3}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
                : 'none',
              transition: 'background 0.15s',
            }}
          />

          {/* Top */}
          <div className="flex items-start justify-between">
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ color: service.tag, background: `${service.tag}18` }}
            >
              0{index + 1}
            </span>
            <div className="text-right">
              <div className="text-2xl font-bold text-white leading-none" style={{ color: service.tag }}>
                {service.stat}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{service.statLabel}</div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-white leading-snug">{service.name}</h3>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: service.tag }}>
              {service.tagline}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{service.description}</p>
          </div>

          {/* Arrow */}
          <div
            className="flex items-center gap-1.5 text-xs font-medium transition-all duration-300"
            style={{ color: hovered ? service.tag : 'rgba(148,163,184,0.6)' }}
          >
            <span>Explore service</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${hovered ? 'translate-x-1' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────── */
export function ServicesShowcase() {
  return (
    <section className="w-full bg-slate-950 py-32 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4">What We Do</p>
            <h2 className="text-5xl md:text-6xl font-light text-white leading-tight tracking-tight">
              Services built<br />to work together
            </h2>
          </div>
          <Link
            href="/vibe-demo/radiance/consultation"
            className="self-start md:self-auto text-sm font-medium text-white border border-white/20 px-6 py-3 hover:bg-white hover:text-slate-900 transition-all duration-300 whitespace-nowrap"
          >
            Free Consultation →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
