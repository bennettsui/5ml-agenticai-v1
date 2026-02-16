'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { ArrowLeft, Menu, X, Instagram, Linkedin, Facebook, Mail, ChevronDown } from 'lucide-react';

// ==================== CONSTANTS ====================
const TED_RED = '#EB0028';
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
  },
  {
    nameEn: 'Steven Tsoi',
    roleEn: 'Producer',
    roleZh: '監製',
    bioZh: '資深活動製作人，曾擔任 TEDxKowloon 監製，負責從舞台設計、流程編排到後台運作的整體協調。他擅長在限制之內打造高質感體驗，確保每個細節——從燈光、聲音到觀眾動線——都支援講者和觀眾之間真正的連結。',
    bioEn: 'A seasoned event producer and former producer of TEDxKowloon, responsible for everything from stage design and run-of-show to backstage operations. He specialises in creating high-quality experiences within constraints, making sure details — lights, sound, audience flow — all support genuine connection between speakers and the audience.',
  },
  {
    nameEn: 'Stephen Ng',
    roleEn: 'Co-organizer',
    roleZh: '聯合策劃人',
    bioZh: '多年參與 TEDxKowloon 團隊，歷任聯合策劃與社群統籌。對 TEDx 規則、內容審查和社群經營有豐富經驗，熟悉如何在創意與合規之間取得平衡。他專注於建立志工與合作夥伴網絡，讓一場活動之後，連結仍然可以延續。',
    bioEn: 'A long-time member of the TEDxKowloon team, serving as co-organizer and community lead. He brings deep experience in TEDx rules, content review, and community-building, and knows how to balance creativity with compliance. He focuses on building volunteer and partner networks so that connections continue long after the event ends.',
  },
];

// ==================== EXPLORE TOPICS ====================
const exploreTopics = [
  {
    titleZh: '城市與空間',
    titleEn: 'City & Space',
    bodyZh: '當舊區面對重建，當密集的城市需要呼吸，怎樣的設計才能回應氣候、人口、與社區的真實需要？',
    bodyEn: 'When old neighbourhoods face redevelopment and dense cities need room to breathe — what kind of design truly responds to climate, demographics, and community?',
  },
  {
    titleZh: '語言與身份',
    titleEn: 'Language & Identity',
    bodyZh: '在粵語、普通話、英語之間長大的一代人，如何把身份的張力，變成力量而不是焦慮？',
    bodyEn: 'A generation raised between Cantonese, Mandarin, and English. How do you turn the tension of identity into strength, not anxiety?',
  },
  {
    titleZh: '科技與人性',
    titleEn: 'Technology & Humanity',
    bodyZh: 'AI 正在學會說更多語言、理解更多文化。但它會不會把差異壓平成數據？香港獨特的多語多文化現實，能否幫助我們建造更有人味的科技？',
    bodyEn: 'AI is learning more languages, understanding more cultures. But will it flatten difference into data? Can Hong Kong\'s multilingual, multicultural reality help us build technology that truly listens?',
  },
];

// ==================== PARTNER TYPES ====================
const partnerTypes = [
  { zh: '場地夥伴', en: 'Venue Partner' },
  { zh: '製作夥伴', en: 'Production Partner' },
  { zh: '社區夥伴', en: 'Community Partner' },
  { zh: '媒體夥伴', en: 'Media Partner' },
];

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
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-white font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
            >
              TEDx<span className="font-light">BoundaryStreet</span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
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

        {/* Back to demos link (for demo context) */}
        <div className="fixed top-4 right-4 z-[60]">
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
          {/* Subtle fade-in animation */}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            {/* Logo */}
            <FadeIn delay={200}>
              <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4">
                TEDx<span className="font-light">BoundaryStreet</span>
              </h1>
            </FadeIn>

            {/* Tagline */}
            <FadeIn delay={500}>
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-light tracking-wide mb-3">
                Ideas of Crossing
              </p>
            </FadeIn>

            {/* Sub-tagline Chinese */}
            <FadeIn delay={800}>
              <p className="text-white/70 text-base sm:text-lg md:text-xl font-light mb-1">
                留住的。改變的。重要的。
              </p>
            </FadeIn>

            {/* Sub-tagline English */}
            <FadeIn delay={1000}>
              <p className="text-white/60 text-sm sm:text-base md:text-lg font-light mb-8">
                What stays. What shifts. What matters.
              </p>
            </FadeIn>

            {/* Location */}
            <FadeIn delay={1200}>
              <p className="text-white/40 text-sm tracking-widest uppercase mb-10">
                香港 &middot; 2026 &nbsp;&nbsp;|&nbsp;&nbsp; Hong Kong &middot; 2026
              </p>
            </FadeIn>

            {/* CTA */}
            <FadeIn delay={1400}>
              <button
                onClick={() => scrollTo('updates')}
                className="inline-block px-8 py-3.5 text-white text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:brightness-110 hover:scale-105"
                style={{ backgroundColor: TED_RED }}
              >
                獲取最新消息 Get Updates
              </button>
            </FadeIn>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </section>

        {/* ==================== SECTION 2: THE IDEA / VISION ==================== */}
        <section id="idea" className="relative bg-white py-24 md:py-32">
          {/* Thin red line divider at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5" style={{ backgroundColor: TED_RED }} />

          <div className="max-w-3xl mx-auto px-6">
            {/* Chinese */}
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

            {/* Divider */}
            <FadeIn>
              <div className="w-8 h-px bg-neutral-300 mx-auto my-12 md:my-16" />
            </FadeIn>

            {/* English */}
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

        {/* ==================== SECTION 3: WHAT WE EXPLORE ==================== */}
        <section id="explore" className="relative py-24 md:py-32" style={{ backgroundColor: '#F5F5F5' }}>
          <div className="max-w-4xl mx-auto px-6">
            {/* Header */}
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-3">
                我們探索的方向
              </h2>
              <p className="text-neutral-600 text-base md:text-lg mb-4 leading-relaxed">
                我們不預設答案。我們邀請不同背景的人，帶著真實的經歷和洞見，在這裡分享他們如何面對「留下」與「改變」的抉擇。
              </p>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="w-8 h-px bg-neutral-300 my-8" />
            </FadeIn>

            <FadeIn delay={200}>
              <h2 className="text-xl md:text-2xl font-semibold text-neutral-700 mb-3">
                What We Explore
              </h2>
              <p className="text-neutral-500 text-base md:text-lg mb-12 leading-relaxed">
                We don&apos;t start with answers. We invite people from different walks of life to share how they navigate the tension between keeping and changing — with real stories and hard-won insights.
              </p>
            </FadeIn>

            {/* Topic Cards */}
            <div className="space-y-10">
              {exploreTopics.map((topic, i) => (
                <FadeIn key={topic.titleEn} delay={300 + i * 150}>
                  <div className="relative pl-5 border-l-2" style={{ borderColor: TED_RED }}>
                    <h3 className="text-lg md:text-xl font-bold text-neutral-900 mb-1">
                      {topic.titleZh}
                    </h3>
                    <p className="text-sm text-neutral-500 font-medium mb-3">
                      {topic.titleEn}
                    </p>
                    <p className="text-neutral-700 leading-relaxed mb-3 text-base">
                      {topic.bodyZh}
                    </p>
                    <p className="text-neutral-500 leading-relaxed text-base">
                      {topic.bodyEn}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

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

            <FadeIn delay={200}>
              <div className="w-8 h-px bg-neutral-300 my-8" />
            </FadeIn>

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
        <section className="relative bg-neutral-900 text-white py-24 md:py-32">
          {/* Subtle background texture - faded */}
          <div className="absolute inset-0 opacity-5 bg-gradient-to-b from-white/10 to-transparent" />

          <div className="relative max-w-3xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold mb-10">
                為什麼是界限街
              </h2>
            </FadeIn>

            {/* Chinese */}
            <FadeIn delay={100}>
              <div className="text-white/80 leading-relaxed md:leading-loose text-base md:text-lg mb-12">
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

            {/* Divider */}
            <FadeIn delay={200}>
              <div className="w-8 h-px bg-white/20 my-12 md:my-16" />
            </FadeIn>

            {/* English */}
            <FadeIn delay={300}>
              <h2 className="text-xl md:text-2xl font-semibold text-white/90 mb-8">
                Why Boundary Street
              </h2>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="text-white/60 leading-relaxed md:leading-loose text-base md:text-lg">
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

            {/* Chinese - poetic lines */}
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

            {/* Divider */}
            <FadeIn>
              <div className="w-8 h-px bg-neutral-300 my-12 md:my-16" />
            </FadeIn>

            {/* English */}
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

        {/* ==================== SECTION 6: THE TEAM ==================== */}
        <section id="team" className="relative bg-white py-24 md:py-32 border-t border-neutral-100">
          <div className="max-w-4xl mx-auto px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-12">
                策劃團隊
              </h2>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, i) => (
                <FadeIn key={member.nameEn} delay={i * 150}>
                  <div className="relative pt-4">
                    {/* Red top border */}
                    <div className="absolute top-0 left-0 w-12 h-0.5" style={{ backgroundColor: TED_RED }} />

                    <h3 className="text-lg font-bold text-neutral-900 mb-1">
                      {member.nameEn}
                    </h3>
                    <p className="text-sm font-medium mb-3" style={{ color: TED_RED }}>
                      {member.roleZh} {member.roleEn}
                    </p>

                    {/* Chinese bio */}
                    <p className="text-sm text-neutral-700 leading-relaxed mb-3">
                      {member.bioZh}
                    </p>

                    {/* English bio */}
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
          <div className="max-w-3xl mx-auto px-6 text-center">
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

            <FadeIn delay={300}>
              <div className="w-8 h-px bg-neutral-300 mx-auto my-8" />
            </FadeIn>

            <FadeIn delay={400}>
              <h2 className="text-xl md:text-2xl font-semibold text-neutral-700 mb-4">
                Become a Partner
              </h2>
              <p className="text-neutral-500 text-base leading-relaxed mb-6">
                TEDxBoundaryStreet is looking for partners who believe in the value of crossing boundaries. We are not looking for sponsors. We are looking for fellow travellers — organisations, brands, and individuals willing to explore what to keep, what to change, and what truly matters.
              </p>
            </FadeIn>

            {/* Partner types */}
            <FadeIn delay={500}>
              <div className="flex flex-wrap items-center justify-center gap-3 my-10">
                {partnerTypes.map((type, i) => (
                  <span
                    key={type.en}
                    className="px-4 py-2 text-sm text-neutral-600 bg-white rounded-full border border-neutral-200"
                  >
                    {type.zh} {type.en}
                  </span>
                ))}
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
        <section id="updates" className="relative py-24 md:py-32" style={{ backgroundColor: TED_RED }}>
          <div className="max-w-2xl mx-auto px-6 text-center">
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
                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:bg-white/90"
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

            <FadeIn delay={200}>
              <div className="w-8 h-px bg-neutral-200 my-6" />
            </FadeIn>

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
        <footer className="relative bg-black text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            {/* Logo */}
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

            {/* Contact */}
            <div className="mb-8">
              <a
                href="mailto:hello@tedxboundarystreet.com"
                className="text-white/60 text-sm hover:text-white transition-colors"
              >
                hello@tedxboundarystreet.com
              </a>
            </div>

            {/* Social Icons */}
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

            {/* Mandatory Disclaimer */}
            <div className="border-t border-white/10 pt-6">
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
