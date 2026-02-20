'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RadianceLogo } from './RadianceLogo';
import { useLanguage } from '../hooks/useLanguage';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, toggle } = useLanguage();

  const navItems = [
    { label: lang === 'zh' ? '服務' : 'Services', href: '/vibe-demo/radiance/services' },
    { label: lang === 'zh' ? '案例' : 'Case Studies', href: '/vibe-demo/radiance/case-studies' },
    { label: lang === 'zh' ? '關於我們' : 'About', href: '/vibe-demo/radiance/about' },
    { label: lang === 'zh' ? '諮詢' : 'Consultation', href: '/vibe-demo/radiance/consultation' },
    { label: lang === 'zh' ? '聯絡' : 'Contact', href: '/vibe-demo/radiance/contact' },
  ];

  return (
    <>
      {/* Skip navigation link for keyboard users (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>

      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/vibe-demo/radiance" className="flex-shrink-0 hover:opacity-80 transition" aria-label="Radiance PR & Marketing — Home">
            <RadianceLogo variant="text" size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex gap-8 items-center">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Button + Language Toggle + Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggle}
              aria-label={lang === 'zh' ? 'Switch to English' : '切換至中文'}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              <span className="text-base leading-none">{lang === 'zh' ? '🇬🇧' : '🇭🇰'}</span>
              <span>{lang === 'zh' ? 'EN' : '中'}</span>
            </button>

            <Link
              href="/vibe-demo/radiance/lead-gen"
              className="hidden sm:inline-flex px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
            >
              {lang === 'zh' ? '立即開始' : 'Get Started'}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <svg
                className="w-6 h-6 text-slate-900 dark:text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav id="mobile-menu" aria-label="Mobile navigation" className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="px-6 py-4 space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button
                  onClick={() => { toggle(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 transition"
                >
                  <span>{lang === 'zh' ? '🇬🇧' : '🇭🇰'}</span>
                  <span>{lang === 'zh' ? 'Switch to English' : '切換至繁體中文'}</span>
                </button>
                <Link
                  href="/vibe-demo/radiance/lead-gen"
                  className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {lang === 'zh' ? '立即開始' : 'Get Started'}
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
