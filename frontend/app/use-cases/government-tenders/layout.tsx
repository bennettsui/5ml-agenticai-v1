'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft, Search, FileText, Users, Target, TrendingUp, Clock,
  CheckCircle2, ChevronDown, Loader2, Activity, AlertCircle, Settings,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import AiChatAssistant, { type AiChatConfig } from '@/components/AiChatAssistant';

const NAV_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { label: 'Overview', href: '/use-cases/government-tenders', icon: Target },
      { label: 'Tender Monitoring', href: '/use-cases/government-tenders/monitoring', icon: Search },
      { label: 'Bid Management', href: '/use-cases/government-tenders/bid-management', icon: FileText },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Competitor Analysis', href: '/use-cases/government-tenders/competitor-analysis', icon: TrendingUp },
      { label: 'Deadline Alerts', href: '/use-cases/government-tenders/alerts', icon: Clock },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'Collaboration', href: '/use-cases/government-tenders/team-collaboration', icon: Users },
      { label: 'Resources', href: '/use-cases/government-tenders/resources', icon: Activity },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Configuration', href: '/use-cases/government-tenders/settings', icon: Settings },
    ],
  },
];

const chatConfig: AiChatConfig = {
  endpoint: '/api/government/tender-chat',
  useCaseId: 'government-tenders',
  chatType: 'gov_tenders',
  title: 'Tender Assistant',
  accent: 'indigo',
  criticMode: false,
};

const MODULE_QUESTIONS: Record<string, string[]> = {
  Overview: [
    'What tenders should I focus on this week?',
    'Show me the bid pipeline status',
    'Which tenders have deadlines coming up?',
  ],
  'Tender Monitoring': [
    'Find tenders in IT/Technology sector',
    'Show tenders over HKD 1 million',
    'List tenders closing within 30 days',
  ],
  'Bid Management': [
    'Generate a proposal template',
    'Check compliance requirements',
    'Draft a bid cover letter',
  ],
  'Competitor Analysis': [
    'Analyze competitor bid patterns',
    'What are our win rate trends?',
    'Compare our bids vs market average',
  ],
  'Deadline Alerts': [
    'Summarize upcoming deadlines',
    'Which bids need attention?',
    'Flag at-risk opportunities',
  ],
  'Collaboration': [
    'Assign this tender to the team',
    'Create a bid review checklist',
    'Send team notifications',
  ],
  'Resources': [
    'Show available bid templates',
    'List team members',
    'View compliance documents',
  ],
};

function GovernmentTendersInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/use-cases/government-tenders') return pathname === href;
    return pathname.startsWith(href);
  }

  const currentModule = NAV_SECTIONS.flatMap(s => s.items)
    .find(item => isActive(item.href))?.label || 'Overview';

  const enrichedConfig: AiChatConfig = {
    ...chatConfig,
    suggestedQuestions: MODULE_QUESTIONS[currentModule] || MODULE_QUESTIONS['Overview'],
    extraContext: {
      current_page: pathname,
      current_module: currentModule,
    },
    onOpenChange: setChatOpen,
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
          <h2 className="text-lg font-bold text-white tracking-tight">Government Tenders</h2>
          <p className="text-xs text-slate-500 mt-0.5">Procurement Studio</p>
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
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-500">Govt Procurement Platform</p>
        </div>
      </aside>

      {/* Main + AI Chat */}
      <div className="flex-1 min-w-0 flex">
        <main className={`${chatOpen ? 'flex-[0.65]' : 'flex-1'} min-w-0 overflow-auto transition-all`}>
          <div className="p-8">{children}</div>
        </main>
        <AiChatAssistant config={enrichedConfig} />
      </div>
    </div>
  );
}

export default function GovernmentTendersLayout({ children }: { children: React.ReactNode }) {
  return <GovernmentTendersInner>{children}</GovernmentTendersInner>;
}
