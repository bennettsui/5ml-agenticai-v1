'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  MessageSquare,
  Plug,
  ArrowLeft,
  Brain,
} from 'lucide-react';
import { CrmAiProvider } from './context';
import { AiAssistant } from './components/AiAssistant';

const navItems = [
  { label: 'Dashboard', href: '/use-cases/crm', icon: LayoutDashboard },
  { label: 'Brands', href: '/use-cases/crm/brands', icon: Users },
  { label: 'Projects', href: '/use-cases/crm/projects', icon: FolderKanban },
  { label: 'Feedback', href: '/use-cases/crm/feedback', icon: MessageSquare },
  { label: 'Integrations', href: '/use-cases/crm/integrations', icon: Plug },
  { label: 'Agentic Dashboard', href: '/use-cases/crm/agentic-dashboard', icon: Brain },
];

export default function CrmKbLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/use-cases/crm') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <CrmAiProvider>
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
            <h2 className="text-lg font-bold text-white tracking-tight">
              CRM + KB
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
                  <Icon className={'w-4.5 h-4.5 ' + (active ? 'text-emerald-400' : 'text-slate-500')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-5 py-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">Brand CRM + Knowledge Base</p>
          </div>
        </aside>

        {/* Main content + AI Assistant split */}
        <div className="flex-1 min-w-0 flex">
          {/* Page content (left) */}
          <main className="flex-1 min-w-0 overflow-auto">
            <div className="p-8">
              {children}
            </div>
          </main>

          {/* AI Assistant panel (right) */}
          <AiAssistant />
        </div>
      </div>
    </CrmAiProvider>
  );
}
