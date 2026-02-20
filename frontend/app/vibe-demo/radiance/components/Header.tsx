'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Newspaper, Sparkles, Smartphone, Star, Palette } from 'lucide-react';
import { RadianceLogo } from './RadianceLogo';
import { useLanguage } from '../hooks/useLanguage';

const serviceLinks = [
  {
    href: '/vibe-demo/radiance/services/public-relations',
    icon: Newspaper,
    enTitle: 'Public Relations',
    zhTitle: '公關服務',
    enDesc: 'Earn credible media coverage and build brand reputation',
    zhDesc: '贏得媒體報道，建立品牌公信力',
  },
  {
    href: '/vibe-demo/radiance/services/events',
    icon: Sparkles,
    enTitle: 'Events & Experiences',
    zhTitle: '活動及體驗',
    enDesc: 'Create memorable brand moments that generate momentum',
    zhDesc: '創造令人難忘的品牌時刻',
  },
  {
    href: '/vibe-demo/radiance/services/social-media',
    icon: Smartphone,
    enTitle: 'Social Media & Content',
    zhTitle: '社交媒體及內容',
    enDesc: 'Build engaged communities through strategic content',
    zhDesc: '透過策略性內容建立品牌社群',
  },
  {
    href: '/vibe-demo/radiance/services/kol-marketing',
    icon: Star,
    enTitle: 'KOL & Influencer',
    zhTitle: 'KOL 及意見領袖行銷',
    enDesc: 'Amplify reach through authentic creator partnerships',
    zhDesc: '透過真誠合作擴大品牌觸及',
  },
  {
    href: '/vibe-demo/radiance/services/creative-production',
    icon: Palette,
    enTitle: 'Creative & Production',
    zhTitle: '創意及製作',
    enDesc: 'Professional design, video, and content production',
    zhDesc: '專業設計、影片及內容製作',
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { lang, toggle } = useLanguage();

  const navItems = [
    { label: lang === 'zh' ? '服務' : 'Services', href: '/vibe-demo/radiance/services', hasDropdown: true },
    { label: lang === 'zh' ? '案例' : 'Case Studies', href: '/vibe-demo/radiance/case-studies' },
    { label: lang === 'zh' ? '關於我們' : 'About', href: '/vibe-demo/radiance/about' },
    { label: lang === 'zh' ? '諮詢' : 'Consultation', href: '/vibe-demo/radiance/consultation' },
    { label: lang === 'zh' ? '聯絡' : 'Contact', href: '/vibe-demo/radiance/contact' },
  ];

  const handleServicesEnter = () => {
    if (servicesTimeout.current) clearTimeout(servicesTimeout.current);
    setServicesOpen(true);
  };

  const handleServicesLeave = () => {
    servicesTimeout.current = setTimeout(() => setServicesOpen(false), 150);
  };

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
            {navItems.map((item) =>
              item.hasDropdown ? (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={handleServicesEnter}
                  onMouseLeave={handleServicesLeave}
                >
                  <a
                    href={item.href}
                    className={`text-sm font-medium transition flex items-center gap-1 ${
                      servicesOpen
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </a>
                </div>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  {item.label}
                </a>
              )
            )}
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

        {/* Services Mega Menu */}
        {servicesOpen && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xl z-40"
            onMouseEnter={handleServicesEnter}
            onMouseLeave={handleServicesLeave}
          >
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-5 gap-4">
                {serviceLinks.map((service) => (
                  <Link
                    key={service.href}
                    href={service.href}
                    onClick={() => setServicesOpen(false)}
                    className="group flex flex-col gap-3 p-4 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                  >
                    <service.icon className="w-6 h-6 text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors mb-1">
                        {lang === 'zh' ? service.zhTitle : service.enTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {lang === 'zh' ? service.zhDesc : service.enDesc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {lang === 'zh' ? '不確定哪個服務適合您？' : 'Not sure which service fits?'}
                </p>
                <Link
                  href="/vibe-demo/radiance/consultation"
                  onClick={() => setServicesOpen(false)}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition"
                >
                  {lang === 'zh' ? '預約免費諮詢 →' : 'Book a free consultation →'}
                </Link>
              </div>
            </div>
          </div>
        )}

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
              {/* Mobile service sub-links */}
              <div className="pl-4 space-y-2 border-l border-slate-200 dark:border-slate-700">
                {serviceLinks.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    className="block text-xs text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {lang === 'zh' ? s.zhTitle : s.enTitle}
                  </a>
                ))}
              </div>
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
