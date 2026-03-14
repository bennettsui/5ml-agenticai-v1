'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, BarChart3, BookOpen, Award, History, LogOut, Library } from 'lucide-react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';

const NAV = [
  { href: '/adaptive-learning/learn',          label: 'Home',     icon: Brain },
  { href: '/adaptive-learning/learn/session',  label: 'Practice', icon: BookOpen },
  { href: '/adaptive-learning/learn/progress', label: 'Progress', icon: BarChart3 },
  { href: '/adaptive-learning/learn/concepts', label: 'Concepts', icon: Library },
  { href: '/adaptive-learning/learn/history',  label: 'History',  icon: History },
  { href: '/adaptive-learning/learn/badges',   label: 'Badges',   icon: Award },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { student, logout } = useStudentAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/adaptive-learning/learn" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">MathAI</span>
          </Link>
          {student && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-none">
                {student.name} · {student.class_name}
              </span>
              <button onClick={logout} className="text-slate-500 hover:text-slate-300 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Page content — pb-20 leaves space for bottom nav */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="border-t border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky bottom-0 z-40">
        <div className="max-w-2xl mx-auto px-2 h-16 flex items-center justify-around">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/adaptive-learning/learn' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors ${
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
