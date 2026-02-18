'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft, Target, Search, Calendar, Pencil, Sparkles,
  DollarSign, Users, BarChart3, ChevronDown, Building2, FolderKanban, Loader2,
  TrendingUp, Activity,
} from 'lucide-react';
import { useState } from 'react';
import { BrandProvider, useBrandProject } from '@/lib/brand-context';
import AiChatAssistant, { type AiChatConfig } from '@/components/AiChatAssistant';

const NAV_SECTIONS = [
  {
    label: 'Planning & Analysis',
    items: [
      { label: 'Overview', href: '/use-cases/social-content-ops', icon: Target },
      { label: 'Social Strategy', href: '/use-cases/social-content-ops/strategy', icon: Target },
      { label: 'Brand & Competitive Research', href: '/use-cases/social-content-ops/research', icon: Search },
    ],
  },
  {
    label: 'Content Development',
    items: [
      { label: 'Content Calendar', href: '/use-cases/social-content-ops/calendar', icon: Calendar },
      { label: 'Content Development', href: '/use-cases/social-content-ops/content-dev', icon: Pencil },
      { label: 'Interactive Content', href: '/use-cases/social-content-ops/interactive', icon: Sparkles },
      { label: 'Media Buy', href: '/use-cases/social-content-ops/media-buy', icon: DollarSign },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Trend Research', href: '/use-cases/social-content-ops/trend-research', icon: TrendingUp },
      { label: 'Social Monitoring', href: '/use-cases/social-content-ops/monitoring', icon: Activity },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Community Management', href: '/use-cases/social-content-ops/community', icon: Users },
      { label: 'Ad Performance', href: '/use-cases/social-content-ops/ad-performance', icon: BarChart3 },
    ],
  },
];

// Module name derived from pathname for chatbot context
const MODULE_MAP: Record<string, string> = {
  '/use-cases/social-content-ops': 'Overview',
  '/use-cases/social-content-ops/strategy': 'Social Strategy',
  '/use-cases/social-content-ops/research': 'Brand & Competitive Research',
  '/use-cases/social-content-ops/calendar': 'Content Calendar',
  '/use-cases/social-content-ops/content-dev': 'Content Development',
  '/use-cases/social-content-ops/interactive': 'Interactive Content',
  '/use-cases/social-content-ops/media-buy': 'Media Buy',
  '/use-cases/social-content-ops/trend-research': 'Trend Research',
  '/use-cases/social-content-ops/monitoring': 'Social Monitoring',
  '/use-cases/social-content-ops/community': 'Community Management',
  '/use-cases/social-content-ops/ad-performance': 'Ad Performance',
};

const chatConfig: AiChatConfig = {
  endpoint: '/api/social/chat',
  useCaseId: 'social-content-ops',
  chatType: 'social',
  title: 'Sarah — Social Director',
  accent: 'purple',
  criticMode: true,
};

function BrandSelector() {
  const { brands, selectedBrand, selectBrand, projects, selectedProject, selectProject, loading } = useBrandProject();
  const [brandOpen, setBrandOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);

  if (loading) {
    return (
      <div className="px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading brands...
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-2">
      {/* Brand selector */}
      <div className="relative">
        <button
          onClick={() => { setBrandOpen(!brandOpen); setProjOpen(false); }}
          className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs text-left hover:border-purple-500/30 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span className="flex-1 truncate text-white">
            {selectedBrand ? selectedBrand.name : 'Select brand...'}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${brandOpen ? 'rotate-180' : ''}`} />
        </button>
        {brandOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
            {brands.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500">No brands found</div>
            ) : brands.map(b => (
              <button
                key={b.id}
                onClick={() => { selectBrand(b); setBrandOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors ${
                  selectedBrand?.id === b.id ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project selector (only when brand selected) */}
      {selectedBrand && (
        <div className="relative">
          <button
            onClick={() => { setProjOpen(!projOpen); setBrandOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs text-left hover:border-purple-500/30 transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="flex-1 truncate text-white">
              {selectedProject?.name || 'Select project...'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${projOpen ? 'rotate-180' : ''}`} />
          </button>
          {projOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500">No projects for this brand</div>
              ) : projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { selectProject(p); setProjOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors ${
                    selectedProject?.id === p.id ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'
                  }`}
                >
                  {p.name}
                  <span className="text-slate-500 ml-1 capitalize">({p.type.replace('_', ' ')})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SocialContentOpsInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { selectedBrand, selectedProject } = useBrandProject();

  function isActive(href: string) {
    if (href === '/use-cases/social-content-ops') return pathname === href;
    return pathname.startsWith(href);
  }

  // Inject brand/project + page context into chatbot
  const currentModule = MODULE_MAP[pathname] || 'Social Content Ops';
  const enrichedConfig: AiChatConfig = {
    ...chatConfig,
    extraContext: {
      brand_id: selectedBrand?.id,
      brand_name: selectedBrand?.name,
      project_id: selectedProject?.id,
      project_name: selectedProject?.name,
      current_page: pathname,
      current_module: currentModule,
    },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-[250px] flex-shrink-0 bg-slate-900 border-r border-slate-700/50 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-700/50">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Platform
          </Link>
          <h2 className="text-lg font-bold text-white tracking-tight">Social Content Ops</h2>
          <p className="text-xs text-slate-500 mt-0.5">Social Studio</p>
        </div>

        {/* Brand / Project Selector */}
        <div className="border-b border-slate-700/50">
          <BrandSelector />
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-purple-600/20 text-purple-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-purple-400' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-500">Social Content Ops Platform</p>
        </div>
      </aside>

      {/* Main + AI Chat */}
      <div className="flex-1 min-w-0 flex">
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
        <AiChatAssistant config={enrichedConfig} />
      </div>
    </div>
  );
}

export default function SocialContentOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandProvider>
      <SocialContentOpsInner>{children}</SocialContentOpsInner>
    </BrandProvider>
  );
}
