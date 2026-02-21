'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';

// ==================== CONSTANTS ====================
export const TED_RED = '#E62B1E';
export const WARM_AMBER = '#F59E0B';
export const CORAL = '#F97066';
export const OFF_WHITE = '#FAF9F6';
export const WARM_GRAY = '#F3F1EC';

export const NAV_ITEMS = [
  { label: '首頁', href: '/vibe-demo/tedx-xinyi' },
  { label: '關於我們', href: '/vibe-demo/tedx-xinyi/about' },
  { label: '沙龍活動', href: '/vibe-demo/tedx-xinyi/salon' },
  { label: '講者與演講', href: '/vibe-demo/tedx-xinyi/speakers' },
  { label: '永續設計', href: '/vibe-demo/tedx-xinyi/sustainability' },
  { label: '社群', href: '/vibe-demo/tedx-xinyi/community' },
  { label: '文章', href: '/vibe-demo/tedx-xinyi/blog' },
];

export const FOOTER_LINKS = [
  { label: 'TEDx Program', href: 'https://www.ted.com/about/programs-initiatives/tedx-program' },
  { label: 'TED Countdown', href: 'https://countdown.ted.com/get-informed' },
  { label: 'TEDMonterey', href: 'https://tedmonterey2021.ted.com/' },
  { label: 'TEDxXinyi Event', href: 'https://www.ted.com/tedx/events/41172' },
];

export const SOCIAL_LINKS = [
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCCa-iL8BoZvPOXazJyUqF7A' },
  { label: 'Facebook', href: 'https://www.facebook.com/TEDxXinyi-107091491148122' },
  { label: 'Instagram', href: 'https://www.instagram.com/tedxxinyi/' },
];

// ==================== GLOBAL STYLES ====================
export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .tedx-xinyi * {
    font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .tedx-xinyi a:focus-visible,
  .tedx-xinyi button:focus-visible {
    outline: 2px solid ${TED_RED};
    outline-offset: 2px;
  }

  .tedx-xinyi ::selection {
    background: ${TED_RED};
    color: white;
  }

  @media (prefers-reduced-motion: reduce) {
    .tedx-xinyi * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

// ==================== HOOKS ====================
export function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

export function useScrollHeader() {
  const [headerSolid, setHeaderSolid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { headerSolid, mobileMenuOpen, setMobileMenuOpen };
}

// ==================== COMPONENTS ====================

export function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ==================== NAVIGATION ====================
// Light-first nav that goes dark only on hero pages (via heroMode prop)
export function SiteNav({ currentPath, heroMode = false }: { currentPath: string; heroMode?: boolean }) {
  const { headerSolid, mobileMenuOpen, setMobileMenuOpen } = useScrollHeader();

  // In hero mode: transparent on top → white on scroll
  // In normal mode: always white
  const showDark = heroMode && !headerSolid && !mobileMenuOpen;

  return (
    <>
      {/* Skip nav: inline style keeps it off-screen before CSS loads */}
      <a
        href="#main-content"
        style={{ position: 'fixed', top: '-100px', left: '8px', zIndex: 100 }}
        className="focus:top-2 transition-[top] duration-200 px-4 py-2 bg-white text-neutral-900 rounded-md shadow-lg text-sm font-bold"
      >
        Skip to main content
      </a>
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerSolid || mobileMenuOpen || !heroMode
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
      aria-label="Primary navigation"
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/vibe-demo/tedx-xinyi"
          className="flex items-center gap-0.5 min-h-[44px]"
        >
          <span className={`font-light text-lg tracking-tight transition-colors ${showDark ? 'text-white' : 'text-neutral-900'}`}>
            TEDx
          </span>
          <span className="font-black text-lg tracking-tight" style={{ color: TED_RED }}>
            Xinyi
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-3 py-2 text-sm transition-colors min-h-[44px] flex items-center ${
                currentPath === item.href
                  ? showDark ? 'text-white font-bold' : 'text-neutral-900 font-bold'
                  : showDark ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.label}
              {currentPath === item.href && (
                <span
                  className="absolute bottom-1 left-3 right-3 h-[3px] rounded-full"
                  style={{ backgroundColor: TED_RED }}
                />
              )}
            </Link>
          ))}
          <Link
            href="/vibe-demo"
            className={`ml-3 px-3 py-1.5 text-xs rounded-full border transition-colors ${
              showDark
                ? 'text-white/60 border-white/20 hover:text-white hover:border-white/50'
                : 'text-neutral-400 border-neutral-200 hover:text-neutral-700 hover:border-neutral-400'
            }`}
          >
            Demo Hub
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
            showDark ? 'text-white' : 'text-neutral-900'
          }`}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {mobileMenuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white border-t border-neutral-100 pb-6"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-6 py-3 text-sm transition-colors ${
                currentPath === item.href
                  ? 'text-neutral-900 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="px-6 pt-3 border-t border-neutral-100 mt-2">
            <Link href="/vibe-demo" className="text-xs text-neutral-400 hover:text-neutral-600">
              ← Demo Hub
            </Link>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}

// ==================== FOOTER ====================
export function SiteFooter() {
  return (
    <footer className="bg-neutral-900 text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top red divider */}
        <div className="h-1 w-16 rounded-full mb-12" style={{ backgroundColor: TED_RED }} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-0.5 mb-4">
              <span className="text-white font-light text-xl tracking-tight">TEDx</span>
              <span className="font-black text-xl tracking-tight" style={{ color: TED_RED }}>Xinyi</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              An independently organized TEDx event<br />
              in Taipei&apos;s Xinyi District.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Links</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Follow</h3>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6">
          <p className="text-white/25 text-xs text-center">
            © TEDxXinyi 2026 – a TEDx event operated under license from TED.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ==================== SECTION WRAPPER ====================
export function Section({
  children,
  className = '',
  id,
  bg = 'white',
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  bg?: 'white' | 'warm' | 'red' | 'dark';
}) {
  const bgClass = {
    white: 'bg-white text-neutral-900',
    warm: `text-neutral-900`,
    red: 'text-white',
    dark: 'bg-neutral-900 text-white',
  }[bg];

  return (
    <section
      id={id}
      className={`py-20 md:py-28 ${bgClass} ${className}`}
      style={
        bg === 'warm' ? { backgroundColor: WARM_GRAY }
        : bg === 'red' ? { backgroundColor: TED_RED }
        : undefined
      }
    >
      <div className="max-w-6xl mx-auto px-6">
        {children}
      </div>
    </section>
  );
}

// ==================== SECTION LABEL ====================
export function SectionLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`text-xs font-bold tracking-[0.25em] uppercase mb-4 ${dark ? 'text-white/50' : 'text-neutral-400'}`}>
      {children}
    </p>
  );
}
