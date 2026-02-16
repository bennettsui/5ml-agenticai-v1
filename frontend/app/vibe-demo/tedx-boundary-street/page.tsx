'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Menu, X, Instagram, Linkedin, Facebook, ChevronDown, Building2, Clapperboard, Users, Megaphone } from 'lucide-react';

// ==================== DESIGN SYSTEM ====================
const TED_RED = '#E62B1E';
const WARM_GRAY = '#999999';

const NAV_ITEMS = [
  { id: 'idea', label: 'The Idea' },
  { id: 'explore', label: 'Explore' },
  { id: 'team', label: 'Team' },
  { id: 'partners', label: 'Partners' },
  { id: 'updates', label: 'Get Updates' },
];

// ==================== TEAM DATA ====================
const teamMembers = [
  {
    nameEn: 'Bennet Tsui',
    roleEn: 'Curator',
    roleZh: '策展人',
    bioZh: '廣告人、創業者、社區設計實踐者，成長於界限街一帶。多年來在九龍與港島之間工作，連結創作人、技術人和公共機構，專注於把抽象概念變成具體體驗——由品牌、活動到 AI 系統。他希望 TEDxBoundaryStreet 成為一個，讓「站在界線上思考的人」可以相遇的年度節點。',
    bioEn: 'An ad guy, entrepreneur, and community design practitioner who grew up around Boundary Street. He has spent years working between Kowloon and Hong Kong Island, connecting creatives, technologists, and public institutions, turning abstract ideas into concrete experiences — from brands and events to AI systems. He hopes TEDxBoundaryStreet becomes an annual waypoint for people who think while standing on the line.',
    initials: 'BT',
  },
  {
    nameEn: 'Steven Tsoi',
    roleEn: 'Producer',
    roleZh: '監製',
    bioZh: '資深活動製作人，曾擔任 TEDxKowloon 監製，負責從舞台設計、流程編排到後台運作的整體協調。他擅長在限制之內打造高質感體驗，確保每個細節——從燈光、聲音到觀眾動線——都支援講者和觀眾之間真正的連結。',
    bioEn: 'A seasoned event producer and former producer of TEDxKowloon, responsible for everything from stage design and run-of-show to backstage operations. He specialises in creating high-quality experiences within constraints, making sure details — lights, sound, audience flow — all support genuine connection between speakers and the audience.',
    initials: 'ST',
  },
  {
    nameEn: 'Stephen Ng',
    roleEn: 'Co-organizer',
    roleZh: '聯合策劃人',
    bioZh: '多年參與 TEDxKowloon 團隊，歷任聯合策劃與社群統籌。對 TEDx 規則、內容審查和社群經營有豐富經驗，熟悉如何在創意與合規之間取得平衡。他專注於建立志工與合作夥伴網絡，讓一場活動之後，連結仍然可以延續。',
    bioEn: 'A long-time member of the TEDxKowloon team, serving as co-organizer and community lead. He brings deep experience in TEDx rules, content review, and community-building, and knows how to balance creativity with compliance. He focuses on building volunteer and partner networks so that connections continue long after the event ends.',
    initials: 'SN',
  },
];

// ==================== EXPLORE TOPICS ====================
const exploreTopics = [
  {
    titleZh: '城市與空間',
    titleEn: 'City & Space',
    bodyZh: '當舊區面對重建，當密集的城市需要呼吸，怎樣的設計才能回應氣候、人口、與社區的真實需要？',
    bodyEn: 'When old neighbourhoods face redevelopment and dense cities need room to breathe — what kind of design truly responds to climate, demographics, and community?',
    visualHint: 'Old tong lau → glass towers',
    imagePath: '/tedx/theme-city-space.png',
  },
  {
    titleZh: '語言與身份',
    titleEn: 'Language & Identity',
    bodyZh: '在粵語、普通話、英語之間長大的一代人，如何把身份的張力，變成力量而不是焦慮？',
    bodyEn: 'A generation raised between Cantonese, Mandarin, and English. How do you turn the tension of identity into strength, not anxiety?',
    visualHint: '中 · EN · 粵',
    imagePath: '/tedx/theme-language-identity.png',
  },
  {
    titleZh: '科技與人性',
    titleEn: 'Technology & Humanity',
    bodyZh: 'AI 正在學會說更多語言、理解更多文化。但它會不會把差異壓平成數據？香港獨特的多語多文化現實，能否幫助我們建造更有人味的科技？',
    bodyEn: 'AI is learning more languages, understanding more cultures. But will it flatten difference into data? Can Hong Kong\'s multilingual, multicultural reality help us build technology that truly listens?',
    visualHint: 'Circuit → Organic',
    imagePath: '/tedx/theme-tech-humanity.png',
  },
];

// ==================== TIMELINE DATA ====================
const timeline = [
  { year: '1898', label: '界限街成為邊界', labelEn: 'Boundary drawn' },
  { year: '1950s', label: '社區開始形成', labelEn: 'Community forms' },
  { year: '1970s', label: '啟德機場年代', labelEn: 'Kai Tak era' },
  { year: '1998', label: '啟德關閉', labelEn: 'Kai Tak closes' },
  { year: '2026', label: 'TEDxBoundaryStreet', labelEn: 'Ideas of Crossing' },
];

// ==================== PARTNER TYPES ====================
const partnerTypes = [
  { zh: '場地夥伴', en: 'Venue Partner', icon: Building2 },
  { zh: '製作夥伴', en: 'Production Partner', icon: Clapperboard },
  { zh: '社區夥伴', en: 'Community Partner', icon: Users },
  { zh: '媒體夥伴', en: 'Media Partner', icon: Megaphone },
];

// ==================== CSS KEYFRAMES (injected via style tag) ====================
const customStyles = `
  @keyframes line-draw {
    from { width: 0; }
    to { width: 100%; }
  }
  @keyframes line-draw-hero {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes dot-pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
  @keyframes skyline-drift {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-8px); }
  }
  @keyframes plane-fly {
    0% { transform: translateX(-100%) translateY(20px) rotate(-5deg); opacity: 0; }
    20% { opacity: 0.6; }
    100% { transform: translateX(200%) translateY(-40px) rotate(-5deg); opacity: 0; }
  }
  .animate-line-draw {
    animation: line-draw 1.2s ease-out forwards;
  }
  .animate-line-draw-hero {
    animation: line-draw-hero 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.8s forwards;
    transform: scaleX(0);
    transform-origin: left center;
  }
  .animate-fade-up {
    animation: fade-up 0.8s ease-out forwards;
  }
  .section-divider-solid {
    height: 2px;
    background: linear-gradient(90deg, transparent, ${TED_RED}, transparent);
  }
  .section-divider-dashed {
    height: 0;
    border-top: 2px dashed ${TED_RED}40;
  }
  .section-divider-thick {
    height: 8px;
    background: ${TED_RED};
  }
  .dot-pattern {
    background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .dot-pattern-light {
    background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .gradient-line-hover {
    position: relative;
  }
  .gradient-line-hover::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, ${TED_RED}, transparent);
    transition: width 0.4s ease;
  }
  .gradient-line-hover:hover::after {
    width: 100%;
  }
`;

// ==================== FADE-IN HOOK ====================
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// ==================== FADE-IN WRAPPER ====================
function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ==================== LINE DRAW ON SCROLL ====================
function LineOnScroll({ className = '', color = TED_RED, height = 2, dashed = false }: { className?: string; color?: string; height?: number; dashed?: boolean }) {
  const { ref, isVisible } = useFadeIn(0.3);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <div
        className={`transition-all duration-1000 ease-out ${isVisible ? 'w-full' : 'w-0'}`}
        style={{
          height: dashed ? 0 : height,
          backgroundColor: dashed ? undefined : color,
          borderTop: dashed ? `${height}px dashed ${color}` : undefined,
        }}
      />
    </div>
  );
}

// ==================== LINE-BY-LINE FADE ====================
function FadeInLines({ lines, className = '' }: { lines: string[]; className?: string }) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <FadeIn key={i} delay={i * 120}>
          <p className="mb-2">{line}</p>
        </FadeIn>
      ))}
    </div>
  );
}

// ==================== DUALITY CARD (Split Layout) ====================
function DualityCard({ topic, index }: { topic: typeof exploreTopics[0]; index: number }) {
  const { ref, isVisible } = useFadeIn(0.2);
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 150}ms` }}>
      <div className={`flex flex-col md:flex-row ${isEven ? '' : 'md:flex-row-reverse'} gap-0 bg-white overflow-hidden`}>
        {/* Visual Half — nanobanana placeholder */}
        <div className="relative md:w-2/5 min-h-[200px] md:min-h-[280px] bg-neutral-100 overflow-hidden group">
          {/* CSS abstract visual placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-light tracking-widest" style={{ color: `${TED_RED}20` }}>
                {topic.visualHint}
              </p>
            </div>
          </div>
          {/* Duality split line */}
          <div
            className="absolute top-0 bottom-0 left-1/2 w-[2px]"
            style={{ backgroundColor: `${TED_RED}30` }}
          />
          {/* Nanobanana image (shows when generated) */}
          <img
            src={topic.imagePath}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500"
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Red gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Text Half */}
        <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
          {/* Red accent line top */}
          <div className="w-10 h-[2px] mb-4" style={{ backgroundColor: TED_RED }} />
          <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-1">
            {topic.titleZh}
          </h3>
          <p className="text-sm font-medium mb-4" style={{ color: WARM_GRAY }}>
            {topic.titleEn}
          </p>
          <p className="text-neutral-700 leading-relaxed mb-3 text-base">
            {topic.bodyZh}
          </p>
          <p className="text-neutral-500 leading-relaxed text-sm">
            {topic.bodyEn}
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== HERO SKYLINE (CSS art) ====================
function HeroSkyline() {
  // Abstract building silhouettes representing Boundary Street
  const buildings = [
    { h: 45, w: 18, x: 2 },
    { h: 62, w: 14, x: 8 },
    { h: 38, w: 20, x: 14 },
    { h: 72, w: 12, x: 20 },
    { h: 55, w: 16, x: 26 },
    { h: 48, w: 22, x: 32 },
    { h: 80, w: 10, x: 38 },
    { h: 42, w: 18, x: 43 },
    { h: 65, w: 14, x: 50 },
    { h: 35, w: 20, x: 55 },
    { h: 58, w: 16, x: 61 },
    { h: 70, w: 12, x: 67 },
    { h: 44, w: 18, x: 73 },
    { h: 52, w: 14, x: 80 },
    { h: 68, w: 16, x: 86 },
    { h: 40, w: 12, x: 92 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Skyline buildings */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] opacity-[0.06]" style={{ animation: 'skyline-drift 20s ease-in-out infinite' }}>
        {buildings.map((b, i) => (
          <div
            key={i}
            className="absolute bottom-0 bg-white"
            style={{
              height: `${b.h}%`,
              width: `${b.w}px`,
              left: `${b.x}%`,
            }}
          />
        ))}
      </div>

      {/* Kai Tak flight path — diagonal dashed line */}
      <div className="absolute top-[20%] left-0 right-0 h-[1px] opacity-[0.08] rotate-[-3deg]" style={{ borderTop: '1px dashed white' }} />

      {/* Subtle plane silhouette */}
      <div className="absolute top-[18%] opacity-[0.04]" style={{ animation: 'plane-fly 25s linear infinite' }}>
        <svg width="60" height="20" viewBox="0 0 60 20" fill="white">
          <path d="M0 10 L20 8 L35 0 L38 7 L58 6 L60 10 L58 14 L38 13 L35 20 L20 12 Z" />
        </svg>
      </div>

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern-light opacity-30" />
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function TEDxBoundaryStreetPage() {
  const [scrollY, setScrollY] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setHeaderSolid(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <>
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* SEO Head */}
      <head>
        <title>TEDxBoundaryStreet — Ideas of Crossing | 界限街 TEDx</title>
        <meta name="description" content="TEDxBoundaryStreet: Ideas of Crossing. 在 AI 與急速變動的時代，什麼該留住，什麼該改變，什麼才真正重要。Hong Kong 2026. What stays. What shifts. What matters." />
        <meta property="og:title" content="TEDxBoundaryStreet — Ideas of Crossing" />
        <meta property="og:description" content="What stays. What shifts. What matters. A TEDx event in Hong Kong exploring the boundaries between history and progress, technology and humanity." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tedxboundarystreet.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: 'TEDxBoundaryStreet',
              description: 'Ideas of Crossing — What stays. What shifts. What matters.',
              url: 'https://tedxboundarystreet.com',
              organizer: {
                '@type': 'Organization',
                name: 'TEDxBoundaryStreet',
                url: 'https://tedxboundarystreet.com',
              },
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              inLanguage: ['zh-HK', 'en'],
            }),
          }}
        />
      </head>

      <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* ==================== NAVIGATION ==================== */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            headerSolid
              ? 'bg-black/95 backdrop-blur-md shadow-lg'
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-white font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
            >
              TEDx<span className="font-light">BoundaryStreet</span>
            </button>

            <div className="hidden md:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="gradient-line-hover text-white/80 hover:text-white text-sm font-medium transition-colors pb-1"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10">
              <div className="px-6 py-4 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="text-white/80 hover:text-white text-left text-base py-2 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Back to demos link + cross-link */}
        <div className="fixed top-4 right-4 z-[60] flex items-center gap-2">
          <Link
            href="/vibe-demo/tedx-boundary-street/v2"
            className="text-xs text-white/50 hover:text-white/80 transition-colors bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5"
          >
            Marketing Site
          </Link>
          <Link
            href="/vibe-demo"
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5"
          >
            <ArrowLeft className="w-3 h-3" />
            Demo Hub
          </Link>
        </div>

        {/* ==================== SECTION 1: HERO ==================== */}
        <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
          {/* Nanobanana hero image (shows when generated) */}
          <img
            src="/tedx/hero-boundary-street.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000"
            style={{ filter: 'brightness(0.3) saturate(0.2)' }}
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* CSS Skyline fallback */}
          <HeroSkyline />

          {/* THE RED LINE — crossing the entire hero */}
          <div className="absolute top-1/2 left-0 right-0 z-[5] h-[16px] pointer-events-none">
            <div
              className="h-full animate-line-draw-hero"
              style={{ backgroundColor: TED_RED, opacity: 0.85 }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <FadeIn delay={200}>
              <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4">
                TEDx<span className="font-light">BoundaryStreet</span>
              </h1>
            </FadeIn>

            <FadeIn delay={500}>
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-light tracking-wide mb-3">
                Ideas of Crossing
              </p>
            </FadeIn>

            <FadeIn delay={800}>
              <p className="text-white/70 text-base sm:text-lg md:text-xl font-light mb-1">
                留住的。改變的。重要的。
              </p>
            </FadeIn>

            <FadeIn delay={1000}>
              <p className="text-white/60 text-sm sm:text-base md:text-lg font-light mb-8">
                What stays. What shifts. What matters.
              </p>
            </FadeIn>

            <FadeIn delay={1200}>
              <p className="text-white/40 text-sm tracking-widest uppercase mb-10">
                香港 &middot; 2026 &nbsp;&nbsp;|&nbsp;&nbsp; Hong Kong &middot; 2026
              </p>
            </FadeIn>

            <FadeIn delay={1400}>
              <button
                onClick={() => scrollTo('updates')}
                className="inline-block px-8 py-3.5 text-white text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:brightness-110 hover:scale-105 border-2 border-transparent hover:border-white/30"
                style={{ backgroundColor: TED_RED }}
              >
                獲取最新消息 Get Updates
              </button>
            </FadeIn>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </section>

        {/* ═══ Section Divider: Thick Red ═══ */}
        <div className="section-divider-thick" />

        {/* ==================== SECTION 2: THE IDEA / VISION ==================== */}
        <section id="idea" className="relative bg-white py-24 md:py-32 overflow-hidden">
          {/* Faded map background (nanobanana placeholder) */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-1000">
            <img
              src="/tedx/map-1898-overlay.png"
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.1) opacity(0.08)' }}
              onLoad={(e) => { (e.target as HTMLImageElement).parentElement!.style.opacity = '1'; }}
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
          </div>

          <div className="relative max-w-3xl mx-auto px-6">
            <FadeIn>
              <div className="mb-16 text-neutral-800 leading-relaxed md:leading-loose text-base md:text-lg">
                <p className="text-2xl md:text-3xl font-semibold mb-8 text-neutral-900">
                  一條街。一道界線。一個起點。
                </p>
                <p className="mb-6">
                  界限街不只是一條街名。它曾經是香港的邊界——劃開九龍與新界，劃開已知與未知，劃開過去與將來。
                </p>
                <p className="mb-6">
                  今天，界線早已被城市吞沒。但它留下了一個問題：當一切都在加速改變，我們憑什麼決定——什麼該留住，什麼該放手？
                </p>
                <p>
                  TEDxBoundaryStreet 站在這條線上，邀請你一起問這個問題。
                </p>
              </div>
            </FadeIn>

            {/* Red line divider (echoing Boundary Street) */}
            <LineOnScroll className="my-12 md:my-16 max-w-[120px] mx-auto" height={2} />

            <FadeIn>
              <div className="text-neutral-600 leading-relaxed md:leading-loose text-base md:text-lg">
                <p className="text-2xl md:text-3xl font-semibold mb-8 text-neutral-800">
                  One street. One line. One beginning.
                </p>
                <p className="mb-6">
                  Boundary Street is not just a street name. It was once Hong Kong&apos;s border — dividing Kowloon from the New Territories, the known from the unknown, the past from what comes next.
                </p>
                <p className="mb-6">
                  Today, the line has long been swallowed by the city. But it left behind a question: When everything is changing faster than we can keep up, what do we use to decide — what stays, and what goes?
                </p>
                <p>
                  TEDxBoundaryStreet stands on that line, and invites you to ask that question with us.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══ Section Divider: Gradient line ═══ */}
        <div className="section-divider-solid" />

        {/* ==================== SECTION 3: WHAT WE EXPLORE ==================== */}
        <section id="explore" className="relative py-24 md:py-32" style={{ backgroundColor: '#F5F5F5' }}>
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-3">
                我們探索的方向
              </h2>
              <p className="text-neutral-600 text-base md:text-lg mb-4 leading-relaxed max-w-3xl">
                我們不預設答案。我們邀請不同背景的人，帶著真實的經歷和洞見，在這裡分享他們如何面對「留下」與「改變」的抉擇。
              </p>
            </FadeIn>

            <LineOnScroll className="my-8 max-w-[60px]" height={2} />

            <FadeIn delay={200}>
              <h2 className="text-xl md:text-2xl font-semibold text-neutral-700 mb-3">
                What We Explore
              </h2>
              <p className="text-neutral-500 text-base md:text-lg mb-12 leading-relaxed max-w-3xl">
                We don&apos;t start with answers. We invite people from different walks of life to share how they navigate the tension between keeping and changing — with real stories and hard-won insights.
              </p>
            </FadeIn>

            {/* Duality Split Cards */}
            <div className="space-y-6">
              {exploreTopics.map((topic, i) => (
                <DualityCard key={topic.titleEn} topic={topic} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Section Divider: Dashed ═══ */}
        <LineOnScroll className="mx-auto max-w-4xl" height={2} dashed color={`${TED_RED}40`} />

        {/* ==================== SECTION 3.5: BEYOND THE 18 MINUTES ==================== */}
        <section className="relative bg-white py-20 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-6">
                超越台上的 18 分鐘
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-neutral-700 text-base md:text-lg leading-relaxed mb-4">
                我們正在設計一些小小的現場體驗，讓你不只「坐著聽」，而是想一想你自己會怎樣選、與旁邊的人聊一聊你們看見的未來。
              </p>
            </FadeIn>

            <LineOnScroll className="my-8 max-w-[60px]" height={2} />

            <FadeIn delay={300}>
              <h2 className="text-xl md:text-2xl font-semibold text-neutral-700 mb-6">
                Beyond the 18 minutes on stage
              </h2>
            </FadeIn>

            <FadeIn delay={400}>
              <p className="text-neutral-500 text-base md:text-lg leading-relaxed">
                We are designing small on-site experiences so you are not just &ldquo;sitting and listening&rdquo; — but thinking through your own choices, and talking to the people next to you about the future you each see.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ==================== SECTION 4: WHY BOUNDARY STREET ==================== */}
        <section className="relative bg-neutral-900 text-white py-24 md:py-32 overflow-hidden">
          {/* Kai Tak memory background (nanobanana placeholder) */}
          <img
            src="/tedx/kai-tak-memory.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000"
            style={{ filter: 'brightness(0.15) saturate(0.3)' }}
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* CSS fallback: dot pattern + flight path */}
          <div className="absolute inset-0 dot-pattern-light opacity-20 pointer-events-none" />
          <div className="absolute top-[15%] left-0 right-0 h-[1px] opacity-10 rotate-[-2deg]" style={{ borderTop: `1px dashed ${TED_RED}` }} />

          <div className="relative max-w-4xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold mb-10">
                為什麼是界限街
              </h2>
            </FadeIn>

            {/* ─── Timeline: 1898 → 2026 ─── */}
            <FadeIn delay={50}>
              <div className="relative mb-16 py-6 overflow-hidden">
                {/* Timeline line */}
                <LineOnScroll className="absolute top-1/2 left-0 right-0 -translate-y-1/2" height={2} color={`${TED_RED}60`} />

                <div className="relative flex justify-between items-center">
                  {timeline.map((item, i) => (
                    <FadeIn key={item.year} delay={200 + i * 200}>
                      <div className="flex flex-col items-center text-center">
                        {/* Dot */}
                        <div
                          className="w-3 h-3 rounded-full mb-2 border-2"
                          style={{
                            borderColor: TED_RED,
                            backgroundColor: i === timeline.length - 1 ? TED_RED : 'transparent',
                          }}
                        />
                        <span className="text-white font-bold text-xs sm:text-sm">{item.year}</span>
                        <span className="text-white/40 text-[10px] sm:text-xs mt-0.5 hidden sm:block">{item.label}</span>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Chinese */}
            <FadeIn delay={100}>
              <div className="text-white/80 leading-relaxed md:leading-loose text-base md:text-lg mb-12 max-w-3xl">
                <p className="mb-6">
                  對好多人來說，界限街是一條很日常的街：放學等巴士的車站、排隊買魚蛋的小攤、抬頭見到啟德機場起飛的航班，樓宇高度差不多、行人路永遠有腳步聲。遠望是格仔山，近處是公屋、球場和補習社，一切都好像「理所當然」，又好像隨時會變。
                </p>
                <p className="mb-6">
                  這條街曾經劃開九龍與新界，劃開兩個系統、兩種想像。今天，界線淡了，但問題依然存在：在歷史與發展之間，在 AI 革命與人性底線之間，我們究竟憑什麼去決定——什麼值得守住，什麼需要讓路，什麼才是真正重要？
                </p>
                <p>
                  TEDxBoundaryStreet 想做的，是把這一代香港人的「界線記憶」拉上舞台：那種一邊抬頭望住飛機、一邊向前走的心情，那種在同一條街度長大，但選擇了完全不同路的勇氣。這是一個屬於整個社區——而不只是機構或品牌——的地方，讓每個曾經站在界線前的人，一起問：下一步，怎樣跨過去？
                </p>
              </div>
            </FadeIn>

            <LineOnScroll className="my-12 md:my-16 max-w-[80px]" height={2} color="rgba(255,255,255,0.2)" />

            <FadeIn delay={300}>
              <h2 className="text-xl md:text-2xl font-semibold text-white/90 mb-8">
                Why Boundary Street
              </h2>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="text-white/60 leading-relaxed md:leading-loose text-base md:text-lg max-w-3xl">
                <p className="mb-6">
                  For many of us, Boundary Street is an ordinary street. The bus stop after school, the fishball stall with a familiar queue, planes from Kai Tak once roaring overhead, buildings standing shoulder to shoulder, footsteps echoing along the same narrow pavements. In the distance, the checkered hill; up close, estates, courts, cram schools — everything feels &ldquo;normal&rdquo;, and yet always on the verge of change.
                </p>
                <p className="mb-6">
                  This street once marked the edge between Kowloon and the New Territories, between two systems, two imaginations. Today, the line has faded, but the question remains: Between history and development, between an AI revolution and the baseline of our humanity, what do we use to decide — what is worth keeping, what must give way, and what truly matters?
                </p>
                <p>
                  TEDxBoundaryStreet wants to bring this generation&apos;s &ldquo;boundary memories&rdquo; onto the stage: the feeling of looking up at planes while still walking forward, the courage of growing up on the same street but choosing completely different paths. It is a place for the whole community — not just institutions or brands — for everyone who has ever stood at a boundary and asked: what does it mean to cross, now?
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ==================== SECTION 5: WHO IT'S FOR ==================== */}
        <section className="relative bg-white py-24 md:py-32">
          <div className="max-w-3xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-10">
                這是給誰的
              </h2>
            </FadeIn>

            <div className="mb-12 text-neutral-800 text-base md:text-lg leading-loose">
              <FadeInLines
                lines={[
                  '給在東與西之間游走的創業者。',
                  '給正在養育雙語孩子的父母。',
                  '給把廣東流行曲和程式碼融合在一起的藝術家。',
                  '給想像一座密集城市如何仍然能呼吸的城市主義者。',
                ]}
              />
              <FadeIn delay={600}>
                <p className="mt-6">
                  給所有曾經卡在一條邊界前——語言的、文化的、世代的、專業的——然後決定跨過去的人。
                </p>
              </FadeIn>
            </div>

            <LineOnScroll className="my-12 md:my-16 max-w-[80px]" height={2} />

            <FadeIn>
              <h2 className="text-xl md:text-2xl font-semibold text-neutral-700 mb-10">
                Who This Is For
              </h2>
            </FadeIn>

            <div className="text-neutral-600 text-base md:text-lg leading-loose">
              <FadeInLines
                lines={[
                  'For the entrepreneur navigating between East and West.',
                  'For the parent raising bilingual children.',
                  'For the artist fusing Cantopop with code.',
                  'For the urbanist reimagining how a dense city can still breathe.',
                ]}
              />
              <FadeIn delay={600}>
                <p className="mt-6">
                  For anyone who has ever been stuck at a boundary — linguistic, cultural, generational, or professional — and decided to cross it anyway.
                </p>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ═══ Section Divider ═══ */}
        <div className="section-divider-solid" />

        {/* ==================== SECTION 6: THE TEAM ==================== */}
        <section id="team" className="relative bg-white py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-4">
                策劃團隊
              </h2>
              <p className="text-neutral-500 text-sm mb-12">Curator Team</p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, i) => (
                <FadeIn key={member.nameEn} delay={i * 150}>
                  <div className="relative">
                    {/* Portrait placeholder with red accent frame */}
                    <div className="relative w-full aspect-[3/4] mb-5 bg-neutral-100 overflow-hidden group">
                      {/* Initials placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-light" style={{ color: `${TED_RED}15` }}>
                          {member.initials}
                        </span>
                      </div>
                      {/* Red accent line at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: TED_RED }} />
                      {/* Red corner accent */}
                      <div className="absolute top-0 left-0 w-6 h-[2px]" style={{ backgroundColor: TED_RED }} />
                      <div className="absolute top-0 left-0 w-[2px] h-6" style={{ backgroundColor: TED_RED }} />
                    </div>

                    <h3 className="text-lg font-bold text-neutral-900 mb-1">
                      {member.nameEn}
                    </h3>
                    <p className="text-sm font-medium mb-3" style={{ color: TED_RED }}>
                      {member.roleZh} {member.roleEn}
                    </p>

                    <p className="text-sm text-neutral-700 leading-relaxed mb-3">
                      {member.bioZh}
                    </p>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      {member.bioEn}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 7: PARTNERS ==================== */}
        <section id="partners" className="relative py-24 md:py-32" style={{ backgroundColor: '#FAFAFA' }}>
          <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-4">
                成為夥伴
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-neutral-700 text-base md:text-lg leading-relaxed mb-4">
                TEDxBoundaryStreet 正在尋找相信跨越邊界價值的合作夥伴。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-neutral-600 text-base leading-relaxed mb-6">
                我們不是在找贊助商。我們在找同路人——願意一起探索「什麼該留住、什麼該改變」的機構、品牌和個人。
              </p>
            </FadeIn>

            <LineOnScroll className="my-8 max-w-[60px] mx-auto" height={2} />

            <FadeIn delay={400}>
              <h2 className="text-xl md:text-2xl font-semibold text-neutral-700 mb-4">
                Become a Partner
              </h2>
              <p className="text-neutral-500 text-base leading-relaxed mb-8">
                TEDxBoundaryStreet is looking for partners who believe in the value of crossing boundaries. We are not looking for sponsors. We are looking for fellow travellers — organisations, brands, and individuals willing to explore what to keep, what to change, and what truly matters.
              </p>
            </FadeIn>

            {/* Partner category icons — line art style */}
            <FadeIn delay={500}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-10">
                {partnerTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div key={type.en} className="flex flex-col items-center gap-3 p-4 group">
                      <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:border-[color:var(--red)] group-hover:bg-[color:var(--red)]/5" style={{ borderColor: WARM_GRAY, '--red': TED_RED } as React.CSSProperties}>
                        <Icon className="w-6 h-6 transition-colors duration-300" style={{ color: WARM_GRAY }} strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-700">{type.zh}</p>
                        <p className="text-xs text-neutral-400">{type.en}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </FadeIn>

            <FadeIn delay={600}>
              <p className="text-neutral-500 text-base mb-6">
                如果你有興趣，和我們聊聊。If that sounds like you, let&apos;s talk.
              </p>
              <a
                href="mailto:hello@tedxboundarystreet.com"
                className="inline-block px-8 py-3.5 text-white text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:brightness-110 hover:scale-105"
                style={{ backgroundColor: TED_RED }}
              >
                聯絡我們 Get in Touch
              </a>
            </FadeIn>
          </div>
        </section>

        {/* ==================== SECTION 8: GET UPDATES (CTA) ==================== */}
        <section id="updates" className="relative py-24 md:py-32 overflow-hidden" style={{ backgroundColor: TED_RED }}>
          {/* Dot pattern texture (community gathering) */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          <div className="relative max-w-2xl mx-auto px-6 text-center">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                想知道最新消息？
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-white/80 text-base md:text-lg leading-relaxed mb-3">
                留下你的電郵，我們會在有新進展時通知你——講者、日期、場地、門票。不會太多。只有重要的。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="w-8 h-px bg-white/30 mx-auto my-6" />
            </FadeIn>

            <FadeIn delay={300}>
              <h3 className="text-xl md:text-2xl font-semibold text-white/90 mb-3">
                Stay in the Loop
              </h3>
              <p className="text-white/70 text-base leading-relaxed mb-8">
                Leave your email and we&apos;ll let you know when things move — speakers, dates, venue, tickets. Not too often. Only when it matters.
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              {subscribed ? (
                <div className="bg-white/20 backdrop-blur-sm rounded-sm px-6 py-4 inline-block">
                  <p className="text-white font-medium">
                    多謝！我們會在有消息時聯絡你。
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    Thank you! We&apos;ll be in touch when it matters.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="你的電郵 Your Email"
                    required
                    className="w-full sm:flex-1 px-5 py-3.5 rounded-sm bg-white/20 border border-white/30 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/60 transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:bg-transparent hover:text-white hover:border-white border-2 border-white"
                    style={{ color: TED_RED }}
                  >
                    訂閱 Subscribe
                  </button>
                </form>
              )}
            </FadeIn>
          </div>
        </section>

        {/* ==================== SECTION 9: WHAT IS TEDx (MANDATORY) ==================== */}
        <section className="relative bg-white py-16 md:py-20 border-t border-neutral-100">
          <div className="max-w-3xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-lg md:text-xl font-semibold text-neutral-700 mb-6">
                什麼是 TEDx？
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="text-sm text-neutral-500 leading-relaxed mb-8">
                <p className="mb-4">
                  秉持「Ideas Worth Spreading（好主意值得被傳播）」的精神，TED 創建了 TEDx 計劃。TEDx 是由各地自主籌辦的活動，讓社區聚在一起，分享類似 TED 的體驗。
                </p>
                <p className="mb-4">
                  我們的活動叫做 TEDxBoundaryStreet，其中 x = 獨立籌辦的 TED 活動。
                </p>
                <p>
                  在 TEDxBoundaryStreet，TED Talks 影片和現場講者將結合在一起，在小型聚會中激發深度討論和連結。TED 大會為 TEDx 計劃提供整體指導，但每個 TEDx 活動（包括我們的）都是自主籌辦的。
                </p>
              </div>
            </FadeIn>

            <div className="w-8 h-px bg-neutral-200 my-6" />

            <FadeIn delay={300}>
              <h2 className="text-lg md:text-xl font-semibold text-neutral-600 mb-6">
                What is TEDx?
              </h2>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="text-sm text-neutral-400 leading-relaxed">
                <p className="mb-4">
                  In the spirit of ideas worth spreading, <a href="https://www.ted.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600 transition-colors">TED</a> has created a program called <a href="https://www.ted.com/about/programs-initiatives/tedx-program" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600 transition-colors">TEDx</a>. TEDx is a program of local, self-organized events that bring people together to share a TED-like experience.
                </p>
                <p className="mb-4">
                  Our event is called TEDxBoundaryStreet, where x = independently organized TED event.
                </p>
                <p>
                  At our TEDxBoundaryStreet event, TED Talks video and live speakers will combine to spark deep discussion and connection in a small group. The TED Conference provides general guidance for the TEDx program, but individual TEDx events, including ours, are self-organized.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ==================== SECTION 10: FOOTER ==================== */}
        <footer className="relative bg-black text-white py-16 overflow-hidden">
          {/* Dot pattern texture */}
          <div className="absolute inset-0 dot-pattern-light opacity-20 pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <div className="mb-6">
              <a
                href="https://www.ted.com/about/programs-initiatives/tedx-program"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
              >
                TEDx<span className="font-light">BoundaryStreet</span>
              </a>
              <p className="text-white/40 text-sm mt-2 tracking-wide">
                Ideas of Crossing
              </p>
            </div>

            <div className="mb-8">
              <a
                href="mailto:hello@tedxboundarystreet.com"
                className="text-white/60 text-sm hover:text-white transition-colors"
              >
                hello@tedxboundarystreet.com
              </a>
            </div>

            <div className="flex items-center justify-center gap-6 mb-10">
              <a href="#" className="text-white/40 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>

            {/* Red line before disclaimer */}
            <div className="w-16 h-[2px] mx-auto mb-6" style={{ backgroundColor: `${TED_RED}60` }} />

            <div>
              <p className="text-white/30 text-xs leading-relaxed">
                This independent TEDx event is operated under license from TED.
              </p>
              <p className="text-white/30 text-xs leading-relaxed mt-1">
                本 TEDx 活動由獨立團隊在 TED 授權下自主籌辦。
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
