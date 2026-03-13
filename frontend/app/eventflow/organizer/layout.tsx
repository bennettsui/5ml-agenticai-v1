'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const PUBLIC_PATHS = ['/eventflow/organizer/login', '/eventflow/organizer/signup'];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [organizer, setOrganizer] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(path)) { setReady(true); return; }
    const token = localStorage.getItem('ef_token');
    if (!token) { router.replace('/eventflow/organizer/login'); return; }
    fetch(`${API}/api/eventflow/organizer/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ organizer }) => { setOrganizer(organizer); setReady(true); })
      .catch(() => { localStorage.removeItem('ef_token'); router.replace('/eventflow/organizer/login'); });
  }, [path]);

  function logout() {
    localStorage.removeItem('ef_token');
    router.push('/eventflow/organizer/login');
  }

  if (!ready) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (PUBLIC_PATHS.includes(path)) return <>{children}</>;

  const NAV = [
    { href: '/eventflow/organizer/dashboard', label: 'Dashboard', icon: '⬛' },
    { href: '/eventflow/organizer/events',    label: 'Events',    icon: '🎟' },
    { href: '/eventflow/organizer/contacts',  label: 'Contacts',  icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="p-5 border-b border-white/[0.06]">
          <Link href="/eventflow" className="flex items-center gap-2">
            <span className="text-lg">🎟</span>
            <span className="font-black text-base tracking-tight">EventFlow</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                path.startsWith(href)
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          {organizer && (
            <div className="text-xs text-slate-500 mb-2 truncate">{organizer.email}</div>
          )}
          <button onClick={logout} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Sign out →</button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
