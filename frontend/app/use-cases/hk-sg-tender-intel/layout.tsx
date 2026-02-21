'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft, Rss, Database, Settings, Newspaper, Activity,
} from 'lucide-react';
import { useState } from 'react';
import AiChatAssistant, { type AiChatConfig } from '@/components/AiChatAssistant';

const NAV_SECTIONS = [
  {
    label: 'Intelligence',
    items: [
      { label: 'Daily Digest', href: '/use-cases/hk-sg-tender-intel', icon: Newspaper },
      { label: 'All Tenders', href: '/use-cases/hk-sg-tender-intel/tenders', icon: Database },
    ],
  },
  {
    label: 'Sources',
    items: [
      { label: 'Source Registry', href: '/use-cases/hk-sg-tender-intel/sources', icon: Rss },
      { label: 'Ingestion Log', href: '/use-cases/hk-sg-tender-intel/logs', icon: Activity },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Eval Settings', href: '/use-cases/hk-sg-tender-intel/settings', icon: Settings },
    ],
  },
];

const chatConfig: AiChatConfig = {
  endpoint: '/api/tender-intel/chat',
  useCaseId: 'hk-sg-tender-intelligence',
  chatType: 'tender_intel',
  title: 'Tender Intel Assistant',
  accent: 'teal',
  criticMode: false,
};

const MODULE_QUESTIONS: Record<string, string[]> = {
  'Daily Digest': [
    "What's today's top Priority tender?",
    'Any tenders closing within 7 days?',
    'Which SG tenders should I look at?',
  ],
  'All Tenders': [
    'Show me all IT_digital tenders above HK$500k',
    'Filter to Consider and above, closing this month',
    'Which agencies have the most open tenders?',
  ],
  'Source Registry': [
    'Are all P1 sources healthy?',
    'Which sources had errors today?',
    'Add a new RSS feed to the registry',
  ],
  'Ingestion Log': [
    'Did the GLD ETB XML pull succeed today?',
    'How many new tenders were found in the last 24h?',
    'Show me any parse errors from yesterday',
  ],
  'Eval Settings': [
    'Adjust my capability fit weights',
    'Update the agency familiarity list',
    'Explain why a tender was scored Ignore',
  ],
};

function TenderIntelInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/use-cases/hk-sg-tender-intel') return pathname === href;
    return pathname.startsWith(href);
  }

  const currentModule = NAV_SECTIONS.flatMap(s => s.items)
    .find(item => isActive(item.href))?.label || 'Daily Digest';

  const enrichedConfig: AiChatConfig = {
    ...chatConfig,
    suggestedQuestions: MODULE_QUESTIONS[currentModule] || MODULE_QUESTIONS['Daily Digest'],
    extraContext: { current_page: pathname, current_module: currentModule },
    onOpenChange: setChatOpen,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 bg-slate-900 border-r border-slate-700/50 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-700/50">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Platform
          </Link>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-5 h-5 rounded bg-teal-500/20 flex items-center justify-center">
              <Rss className="w-3 h-3 text-teal-400" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">Tender Intelligence</h2>
          </div>
          <p className="text-[10px] text-slate-500 pl-7">HK + SG · Daily</p>
        </div>

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
                          ? 'bg-teal-600/20 text-teal-400'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status footer */}
        <div className="px-5 py-3 border-t border-slate-700/50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Last ingestion</span>
            <span className="text-[10px] text-teal-400">03:12 HKT</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Sources active</span>
            <span className="text-[10px] text-slate-300">6 / 7</span>
          </div>
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

export default function TenderIntelLayout({ children }: { children: React.ReactNode }) {
  return <TenderIntelInner>{children}</TenderIntelInner>;
}
