'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import Link from 'next/link';

// ==================== CONSTANTS ====================
export const TED_RED = '#E62B1E';

export const NAV_ITEMS = [
  { label: 'Home', href: '/vibe-demo/tedx-xinyi' },
  { label: 'About', href: '/vibe-demo/tedx-xinyi/about' },
  { label: 'Speakers & Talks', href: '/vibe-demo/tedx-xinyi/speakers' },
  { label: 'Sustainability', href: '/vibe-demo/tedx-xinyi/sustainability' },
  { label: 'Community', href: '/vibe-demo/tedx-xinyi/community' },
  { label: 'Blog', href: '/vibe-demo/tedx-xinyi/blog' },
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
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes lineGrow {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(230, 43, 30, 0.3); }
    50% { box-shadow: 0 0 20px 4px rgba(230, 43, 30, 0.15); }
  }

  .fade-up {
    animation: fadeUp 0.7s ease-out both;
  }

  .tedx-xinyi * {
    font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .tedx-xinyi a:focus-visible,
  .tedx-xinyi button:focus-visible {
    outline: 2px solid ${TED_RED};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .fade-up,
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
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function SiteNav({ currentPath }: { currentPath: string }) {
  const { headerSolid, mobileMenuOpen, setMobileMenuOpen } = useScrollHeader();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerSolid || mobileMenuOpen
          ? 'bg-neutral-950/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
      aria-label="Primary navigation"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/vibe-demo/tedx-xinyi"
          className="flex items-center gap-1 min-h-[44px]"
        >
          <span className="text-white font-light text-lg tracking-tight">TEDx</span>
          <span className="font-bold text-lg tracking-tight" style={{ color: TED_RED }}>Xinyi</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm transition-colors min-h-[44px] flex items-center ${
                currentPath === item.href
                  ? 'text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {item.label}
              {currentPath === item.href && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-4"
                  style={{ backgroundColor: TED_RED }}
                />
              )}
            </Link>
          ))}
          <Link
            href="/vibe-demo"
            className="ml-2 px-3 py-1.5 text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/30 rounded-full transition-colors"
          >
            Demo Hub
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          className="md:hidden bg-neutral-950/98 backdrop-blur-md border-t border-white/5 pb-6"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-6 py-3 text-sm transition-colors ${
                currentPath === item.href
                  ? 'text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="px-6 pt-3 border-t border-white/5 mt-2">
            <Link
              href="/vibe-demo"
              className="text-xs text-white/40 hover:text-white/70"
            >
              ← Demo Hub
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-neutral-950 border-t border-white/5 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-white font-light text-xl tracking-tight">TEDx</span>
              <span className="font-bold text-xl tracking-tight" style={{ color: TED_RED }}>Xinyi</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              An independently organized TEDx event<br />
              in Taipei&apos;s Xinyi District.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white/60 text-xs uppercase tracking-widest mb-4">Links</h4>
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
            <h4 className="text-white/60 text-xs uppercase tracking-widest mb-4">Follow</h4>
            <ul className="space-y-2">
              {SOCIAL_LINKS.map((link) => (
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
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5 pt-6">
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
  dark = true,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={`py-20 md:py-28 ${dark ? 'bg-neutral-950' : 'bg-neutral-900'} ${className}`}
    >
      <div className="max-w-6xl mx-auto px-6">
        {children}
      </div>
    </section>
  );
}
