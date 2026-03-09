'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Upload, BookOpen, FileText, LogOut, GraduationCap, FolderOpen, ListChecks } from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

const NAV = [
  { href: '/adaptive-learning/teach',                   label: 'Dashboard', icon: Users },
  { href: '/adaptive-learning/teach/students',          label: 'Students',  icon: GraduationCap },
  { href: '/adaptive-learning/teach/papers',            label: 'Papers',    icon: FolderOpen },
  { href: '/adaptive-learning/teach/upload',            label: 'Upload',    icon: Upload },
  { href: '/adaptive-learning/teach/questions/pending', label: 'Review',    icon: BookOpen },
  { href: '/adaptive-learning/teach/syllabus',          label: 'Syllabus',  icon: ListChecks },
  { href: '/adaptive-learning/teach/reports',           label: 'Reports',   icon: FileText },
];

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { teacher, logout } = useTeacherAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <Link href="/adaptive-learning/teach" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm hidden xs:inline">MathAI Teacher</span>
          </Link>
          <div className="flex items-center gap-3">
            {teacher && <span className="text-xs text-slate-400 hidden sm:inline">{teacher.name}</span>}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/adaptive-learning/teach' && pathname.startsWith(href));
                return (
                  <Link
                    key={href} href={href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
            {teacher && (
              <button onClick={logout} className="text-slate-500 hover:text-slate-300 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-8 py-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden border-t border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky bottom-0 z-40">
        <div className="flex items-center justify-around h-14 px-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/adaptive-learning/teach' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-1.5 py-1 ${active ? 'text-purple-400' : 'text-slate-500'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
