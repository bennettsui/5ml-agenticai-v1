'use client';

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 truncate">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 min-w-0">
          {idx > 0 && <span className="text-slate-400 dark:text-slate-600 flex-shrink-0">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-slate-900 dark:hover:text-white transition-colors truncate"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-white truncate">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
