'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, BarChart3, BookOpen, Award, History, LogOut } from 'lucide-react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';

const NAV = [
  { href: '/learn',          label: 'Home',     icon: Brain },
  { href: '/learn/session',  label: 'Practice', icon: BookOpen },
  { href: '/learn/progress', label: 'Progress', icon: BarChart3 },
  { href: '/learn/history',  label: 'History',  icon: History },
  { href: '/learn/badges',   label: 'Badges',   icon: Award },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { student, logout } = useStudentAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/learn" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">MathAI</span>
          </Link>
          {student && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{student.name} · {student.class_name}</span>
              <button onClick={logout} className="text-slate-500 hover:text-slate-300 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="border-t border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/learn' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${
                  active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
