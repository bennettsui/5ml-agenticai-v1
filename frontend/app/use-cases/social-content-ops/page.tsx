'use client';

import Link from 'next/link';
import {
  Target, Search, Calendar, Pencil, Sparkles,
  DollarSign, Users, BarChart3, AlertCircle,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const MODULES = [
  {
    category: 'Planning & Analysis',
    items: [
      { name: 'Social Strategy', desc: 'Define social media strategy, goals, and KPIs', icon: Target, href: '/use-cases/social-content-ops/strategy', freq: 'Annually / One-off', color: 'purple' },
      { name: 'Brand & Competitive Research', desc: 'Monitor competitors, industry trends, and brand positioning', icon: Search, href: '/use-cases/social-content-ops/research', freq: 'Ongoing', color: 'blue' },
    ],
  },
  {
    category: 'Content Development',
    items: [
      { name: 'Content Calendar', desc: 'Plan, schedule, and manage content publishing across platforms', icon: Calendar, href: '/use-cases/social-content-ops/calendar', freq: 'Monthly', color: 'emerald' },
      { name: 'Content Development', desc: 'Create and produce social media content with AI assistance', icon: Pencil, href: '/use-cases/social-content-ops/content-dev', freq: 'Ongoing', color: 'amber' },
      { name: 'Interactive Content', desc: 'Plan interactive experiences: polls, quizzes, AR filters, stories', icon: Sparkles, href: '/use-cases/social-content-ops/interactive', freq: 'Campaign-based', color: 'pink' },
      { name: 'Media Buy', desc: 'Plan and optimize paid media placement across social platforms', icon: DollarSign, href: '/use-cases/social-content-ops/media-buy', freq: 'Campaign-based', color: 'cyan' },
    ],
  },
  {
    category: 'Management',
    items: [
      { name: 'Community Management', desc: 'Daily community engagement, response management, and sentiment tracking', icon: Users, href: '/use-cases/social-content-ops/community', freq: 'Daily', color: 'orange' },
      { name: 'Ad Performance', desc: 'Track and analyze social ad campaigns, ROAS, and optimization', icon: BarChart3, href: '/use-cases/social-content-ops/ad-performance', freq: 'Monthly', color: 'rose' },
    ],
  },
];

const colorMap: Record<string, string> = {
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-700/30 text-purple-400',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-700/30 text-blue-400',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-700/30 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-700/30 text-amber-400',
  pink: 'from-pink-500/20 to-pink-500/5 border-pink-700/30 text-pink-400',
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-700/30 text-cyan-400',
  orange: 'from-orange-500/20 to-orange-500/5 border-orange-700/30 text-orange-400',
  rose: 'from-rose-500/20 to-rose-500/5 border-rose-700/30 text-rose-400',
};

export default function SocialContentOpsPage() {
  const { selectedBrand, selectedProject } = useBrandProject();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Social Content Ops</h1>
        <p className="text-sm text-slate-400 mt-1">
          End-to-end social content operations: strategy, creation, publishing, and performance tracking
        </p>
      </div>

      {/* Brand/Project context bar */}
      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            Select a brand from the sidebar to connect all modules to a single brand profile.
          </p>
        </div>
      )}

      {selectedBrand && (
        <div className="flex items-center gap-4 px-4 py-3 bg-purple-900/15 border border-purple-700/20 rounded-xl">
          <div>
            <p className="text-xs text-slate-400">Active Brand</p>
            <p className="text-sm font-semibold text-white">{selectedBrand.name}</p>
          </div>
          {selectedProject && (
            <>
              <div className="w-px h-8 bg-slate-700/50" />
              <div>
                <p className="text-xs text-slate-400">Active Project</p>
                <p className="text-sm font-semibold text-white">{selectedProject.name}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modules grid by category */}
      {MODULES.map(section => (
        <div key={section.category}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            {section.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map(item => {
              const Icon = item.icon;
              const colors = colorMap[item.color] || colorMap.purple;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group bg-gradient-to-br ${colors} border rounded-xl p-5 hover:scale-[1.01] transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/[0.06] rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white group-hover:text-white/90">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-white/[0.06] rounded-full text-slate-400">
                        {item.freq}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
