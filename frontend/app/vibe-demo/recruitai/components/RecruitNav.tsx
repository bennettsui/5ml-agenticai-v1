'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { MODULES_NAV } from '../data/site-data';

export default function RecruitNav() {
  const pathname = usePathname();
  const isHome = pathname === '/vibe-demo/recruitai' || pathname === '/vibe-demo/recruitai/';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMods, setMobileMods] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function handleAnchor(id: string) {
    setMobileOpen(false);
    if (!isHome) {
      window.location.href = `/vibe-demo/recruitai#${id}`;
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'bg-slate-900 shadow-md border-b border-slate-700/50'
          : 'bg-slate-900/95 backdrop-blur border-b border-slate-700/30'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/vibe-demo/recruitai" className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
            RecruitAI
          </span>
          <span className="hidden sm:block text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">
            Studio
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">

          {/* Modules mega-dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors">
              功能模組
              <ChevronDown className="w-3.5 h-3.5 mt-px transition-transform duration-200 group-hover:rotate-180" />
            </button>

            {/* Dropdown panel */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-80 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 ease-out">
              <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 p-2">
                {MODULES_NAV.map((mod) => (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors group/row"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.grad} flex items-center justify-center text-sm flex-none shadow-sm`}
                    >
                      {mod.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 group-hover/row:text-blue-400 transition-colors leading-none mb-0.5">
                        {mod.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{mod.desc}</p>
                    </div>
                  </Link>
                ))}
                <div className="mt-1 pt-1 border-t border-slate-700/50 px-3 pb-1">
                  <button
                    onClick={() => handleAnchor('modules')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    查看全部模組 →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleAnchor('pricing')}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            定價
          </button>

          <button
            onClick={() => handleAnchor('case-studies')}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            客戶案例
          </button>

          <Link
            href="/vibe-demo/recruitai/carnival"
            className="px-3 py-2 rounded-lg text-sm font-medium text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/[0.1] transition-colors"
          >
            🎪 嘉年華
          </Link>

          <Link
            href="/vibe-demo/recruitai/contact"
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            聯絡我們
          </Link>

          <Link
            href="/vibe-demo/recruitai/consultation"
            className="ml-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            免費諮詢 →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-slate-700/50 bg-slate-900 px-4 py-3 space-y-1">
          {/* Modules accordion */}
          <button
            onClick={() => setMobileMods(!mobileMods)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            功能模組
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${mobileMods ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-250 ${
              mobileMods ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pl-2 pb-1 space-y-0.5">
              {MODULES_NAV.map((mod) => (
                <Link
                  key={mod.href}
                  href={mod.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${mod.grad} flex items-center justify-center text-sm flex-none shadow-sm`}
                  >
                    {mod.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{mod.name}</p>
                    <p className="text-xs text-slate-400">{mod.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleAnchor('pricing')}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            定價
          </button>
          <button
            onClick={() => handleAnchor('case-studies')}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            客戶案例
          </button>
          <Link
            href="/vibe-demo/recruitai/carnival"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-3 rounded-xl text-sm font-medium text-yellow-400 hover:bg-yellow-400/[0.08] transition-colors"
          >
            🎪 嘉年華 3D 互動體驗
          </Link>
          <Link
            href="/vibe-demo/recruitai/contact"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            聯絡我們
          </Link>

          <div className="pt-2 pb-2">
            <Link
              href="/vibe-demo/recruitai/consultation"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              免費諮詢 →
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
