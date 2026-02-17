'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  Zap,
  FileText,
  Mail,
  BookOpen,
  BarChart3,
  LayoutList,
  FlaskConical,
  ArrowLeft,
  BarChart2,
  Lightbulb,
} from 'lucide-react';
import { LeadGenStudioProvider } from './context';
import { ChatbotAssistant } from './components/ChatbotAssistant';

const navItems = [
  { label: 'Plan Builder', href: '/use-cases/lead-gen-studio', icon: Zap },
  { label: 'Asset Library', href: '/use-cases/lead-gen-studio/assets', icon: FileText },
  { label: 'CRM & EDM', href: '/use-cases/lead-gen-studio/crm', icon: Mail },
  { label: 'KB Browser', href: '/use-cases/lead-gen-studio/kb', icon: BookOpen },
  { label: 'ROAS Model', href: '/use-cases/lead-gen-studio/roas', icon: BarChart3 },
  { label: 'Performance', href: '/use-cases/lead-gen-studio/performance', icon: BarChart2 },
  { label: 'Recommendations', href: '/use-cases/lead-gen-studio/recommendations', icon: Lightbulb },
];

export default function LeadGenStudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/use-cases/lead-gen-studio') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <LeadGenStudioProvider>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        {/* Sidebar */}
        <aside className="w-[250px] flex-shrink-0 bg-slate-900 border-r border-slate-700/50 flex flex-col">
          {/* Sidebar header */}
          <div className="px-5 py-5 border-b border-slate-700/50">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Platform
            </Link>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Lead Gen Studio
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ' +
                    (active
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white')
                  }
                >
                  <Icon className={'w-4 h-4 ' + (active ? 'text-emerald-400' : 'text-slate-500')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-5 py-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">6-block growth system · AI-powered</p>
          </div>
        </aside>

        {/* Main content + Chatbot split */}
        <div className="flex-1 min-w-0 flex">
          {/* Page content (left) */}
          <main className="flex-1 min-w-0 overflow-auto">
            <div className="p-8">
              {children}
            </div>
          </main>

          {/* Chatbot Assistant (right) */}
          <ChatbotAssistant />
        </div>
      </div>
    </LeadGenStudioProvider>
  );
}
