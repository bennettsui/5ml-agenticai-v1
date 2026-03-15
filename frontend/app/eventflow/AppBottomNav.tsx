'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/eventflow', label: 'Discover', icon: '🔍', match: (p: string) => p === '/eventflow' },
  { href: '/eventflow/organizer', label: 'Organize', icon: '🎤', match: (p: string) => p.startsWith('/eventflow/organizer') },
  { href: '/eventflow/reception', label: 'Staff', icon: '✅', match: (p: string) => p.startsWith('/eventflow/reception') },
];

export default function AppBottomNav() {
  const path = usePathname();

  // Hide on organizer dashboard/settings sub-pages (show only on marketing page)
  // and hide on reception (full-screen operational tool)
  const isOrganizerSubPage = path.startsWith('/eventflow/organizer/');
  const isReception = path.startsWith('/eventflow/reception');
  if (isOrganizerSubPage || isReception) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-gray-200 safe-bottom">
      <div className="flex">
        {TABS.map(({ href, label, icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                active ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-orange-500 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
