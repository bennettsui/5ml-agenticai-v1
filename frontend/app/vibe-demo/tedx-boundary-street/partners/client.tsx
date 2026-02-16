'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ==================== CONSTANTS ====================

const TED_RED = '#E62B1E';

const NAV_ITEMS = [
  { id: 'support', label: 'Support' },
  { id: 'who', label: 'Who' },
  { id: 'ways', label: 'Ways' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'contact', label: 'Contact' },
];

const PARTNERSHIP_TYPES = [
  { key: 'city', labelEn: 'City Partner', labelZh: '城市夥伴' },
  { key: 'experience', labelEn: 'Experience Partner', labelZh: '體驗夥伴' },
  { key: 'content', labelEn: 'Content & Workshop Partner', labelZh: '知識與工作坊夥伴' },
  { key: 'community', labelEn: 'Community & Access Partner', labelZh: '社群與可及性夥伴' },
];

// ==================== HOOKS ====================

function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

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

// ==================== COMPONENTS ====================

function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`fade-section ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : 'translateY(1.5rem)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ==================== GLOBAL STYLES ====================

const globalStyles = `
  @media (prefers-reduced-motion: reduce) {
    .fade-section {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  }

  .skip-link {
    position: absolute;
    top: -100%;
    left: 16px;
    z-index: 100;
    padding: 8px 16px;
    background: ${TED_RED};
    color: white;
    font-weight: 600;
    font-size: 14px;
    border-radius: 0 0 4px 4px;
    text-decoration: none;
  }
  .skip-link:focus {
    top: 0;
  }

  a:focus-visible,
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid ${TED_RED};
    outline-offset: 2px;
  }

  html {
    scroll-behavior: smooth;
  }
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
`;

// ==================== MAIN COMPONENT ====================

export default function TEDxPartnersClient() {
  const [headerSolid, setHeaderSolid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'submitted'>('idle');

  // Form fields
  const [orgName, setOrgName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [idea, setIdea] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleScroll = () => {
      setHeaderSolid(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!orgName.trim()) {
      newErrors.orgName = '請輸入組織名稱 / Please enter organisation name';
    }
    if (!contactPerson.trim()) {
      newErrors.contactPerson = '請輸入聯絡人姓名 / Please enter contact person';
    }
    if (!email.trim()) {
      newErrors.email = '請輸入電郵 / Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '請輸入有效電郵 / Please enter a valid email address';
    }
    if (selectedTypes.length === 0) {
      newErrors.partnerType = '請選擇至少一種合作類型 / Please select at least one partnership type';
    }
    if (!idea.trim()) {
      newErrors.idea = '請簡單分享你的想法 / Please share your idea';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setFormState('submitted');
    setOrgName('');
    setContactPerson('');
    setEmail('');
    setSelectedTypes([]);
    setIdea('');
    setErrors({});
  };

  const showSolidHeader = headerSolid || mobileMenuOpen;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {/* Skip to main content */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* ==================== HEADER / NAVIGATION ==================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          showSolidHeader ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
      >
        <nav
          aria-label="Primary navigation"
          className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between"
        >
          <Link
            href="/vibe-demo/tedx-boundary-street"
            className={`font-bold text-lg tracking-tight transition-colors min-h-[44px] flex items-center ${
              showSolidHeader ? 'text-neutral-900' : 'text-white'
            }`}
          >
            TEDx<span className="font-light">BoundaryStreet</span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className={`text-sm font-medium transition-colors hover:underline underline-offset-4 min-h-[44px] flex items-center ${
                    showSolidHeader
                      ? 'text-neutral-600 hover:text-neutral-900'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
              showSolidHeader ? 'text-neutral-900' : 'text-white'
            }`}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden bg-white border-t border-neutral-100">
            <ul className="px-5 py-2 list-none m-0">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="w-full text-left text-neutral-700 hover:text-neutral-900 text-base py-3 min-h-[44px] transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Back to Demo Hub */}
      <div className="fixed top-4 right-4 z-[60]">
        <Link
          href="/vibe-demo"
          className="text-xs text-white/50 hover:text-white/80 transition-colors bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 min-h-[44px] flex items-center"
        >
          Demo Hub
        </Link>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <main id="main">

        {/* ===== SECTION 1: HERO ===== */}
        <section
          aria-label="Hero"
          className="relative min-h-[70vh] flex items-center justify-center bg-neutral-900 overflow-hidden"
        >
          <div
            className="absolute top-1/2 left-0 right-0 h-[2px] opacity-20"
            style={{ backgroundColor: TED_RED }}
            aria-hidden="true"
          />

          <div className="relative text-center px-5 max-w-3xl mx-auto py-24">
            <FadeIn>
              <h1 className="mb-8">
                <span className="block text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight" lang="zh-HK">
                  成為 TEDxBoundaryStreet 的合作夥伴
                </span>
                <span className="block text-white/70 text-xl sm:text-2xl md:text-3xl font-light mt-3" lang="en">
                  Partner with TEDxBoundaryStreet
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-3 max-w-xl mx-auto" lang="zh-HK">
                TEDxBoundaryStreet 是一個非牟利的 TEDx 活動，專注於在 AI 時代，討論香港在「留下」與「改變」之間如何作出選擇。我們正在尋找不只是贊助我們，而是願意和我們一起思考與實驗的合作夥伴。
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <p className="text-white/45 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto" lang="en">
                TEDxBoundaryStreet is a non-profit TEDx event focusing on how Hong Kong chooses what to keep and what to change in an age of AI and rapid transformation. We are not just looking for sponsors, but partners who want to think and experiment with us.
              </p>
            </FadeIn>

            <FadeIn delay={500}>
              <p className="text-sm font-medium mb-10">
                <span className="text-white/50" lang="zh-HK">我們不賣廣告。我們一起搭建舞台。</span>
                <span className="text-white/35 mx-2">|</span>
                <span className="text-white/35" lang="en">We are not selling ads. We are building a stage.</span>
              </p>
            </FadeIn>

            <FadeIn delay={700}>
              <button
                onClick={() => scrollTo('contact')}
                className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 text-white text-sm font-semibold tracking-wide rounded transition-all duration-200 hover:brightness-110 hover:scale-[1.03]"
                style={{ backgroundColor: TED_RED }}
              >
                <span lang="zh-HK">分享你的合作想法</span>
                <span className="mx-2 opacity-60">|</span>
                <span lang="en">Share your partnership idea</span>
              </button>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 2: WHERE SUPPORT GOES ===== */}
        <section id="support" aria-labelledby="support-heading" className="py-20 md:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="support-heading" className="mb-4">
                <span className="block text-2xl md:text-3xl font-semibold text-neutral-900" lang="zh-HK">
                  你的支持會變成什麼？
                </span>
                <span className="block text-lg md:text-xl font-medium text-neutral-500 mt-2" lang="en">
                  What your support makes possible
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-neutral-800 text-base leading-relaxed mb-3" lang="zh-HK">
                作為一個由志工籌辦的非牟利活動，我們把每一分支持，優先用在讓「ideas worth spreading」可以好好發生的地方——不是裝飾，而是舞台本身。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-neutral-600 text-base leading-relaxed mb-12" lang="en">
                As a volunteer-run, non-profit event, we direct every contribution towards the things that make &ldquo;ideas worth spreading&rdquo; actually possible — not decoration, but the stage itself.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Venue & Accessibility */}
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TED_RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mb-4">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                  </svg>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">場地與可及性</span>
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3" lang="en">Venue &amp; accessibility</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    租用合適的場地、提供無障礙設施，讓更多不同背景的人可以走進來。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    Renting an appropriate venue and providing accessibility so people from different backgrounds can be in the room.
                  </p>
                </div>

                {/* Video & Sound */}
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TED_RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mb-4">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10,8 16,12 10,16" fill={TED_RED} stroke="none" />
                  </svg>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">影像與聲音</span>
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3" lang="en">Video &amp; sound</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    專業錄影、攝影與後期，讓這些在香港誕生的想法可以被記錄、被重播。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    Professional filming, photography and post-production so ideas born in Hong Kong can be recorded and shared.
                  </p>
                </div>

                {/* Experience Design */}
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TED_RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mb-4">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">體驗設計</span>
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3" lang="en">Experience design</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    由現場設計、指示系統到小型互動裝置，讓觀眾不只聽，還能思考與連結。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    From on-site design and wayfinding to small interactive touchpoints, making sure people don&apos;t just listen, but think and connect.
                  </p>
                </div>

                {/* Community & Access */}
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TED_RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mb-4">
                    <circle cx="9" cy="7" r="3" />
                    <circle cx="17" cy="7" r="3" />
                    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M17 11a4 4 0 014 4v2" />
                  </svg>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">社群與公平參與</span>
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3" lang="en">Community &amp; access</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    預留名額給學生、社區工作者與行動不便人士，令房間更有代表性。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    Reserving places for students, community workers and people with accessibility needs so the room better reflects our city.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 3: WHO SHOULD PARTNER ===== */}
        <section id="who" aria-labelledby="who-heading" className="py-20 md:py-28 bg-neutral-50">
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="who-heading" className="mb-4">
                <span className="block text-2xl md:text-3xl font-semibold text-neutral-900" lang="zh-HK">
                  適合成為夥伴的是誰？
                </span>
                <span className="block text-lg md:text-xl font-medium text-neutral-500 mt-2" lang="en">
                  Who we are looking to partner with
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-neutral-800 text-base leading-relaxed mb-3" lang="zh-HK">
                你不一定要是最大型的品牌，但大概會符合以下其中幾項：
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-neutral-600 text-base leading-relaxed mb-10" lang="en">
                You don&apos;t have to be the biggest brand in town, but you probably resonate with at least some of these:
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <ul className="space-y-6" role="list">
                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    你關心科技與 AI 如何影響工作、城市和下一代，而不只是把它當作一個流行語。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    You care about how technology and AI are changing work, cities and the next generation — beyond buzzwords.
                  </p>
                </li>

                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    你相信企業可以在不賣廣告的情況下，為公共對話提供資源和空間。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    You believe organisations can support public conversations without turning them into advertising.
                  </p>
                </li>

                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    你願意支持文化、教育與社群參與，並把這視為長期投資，而不是一次性的曝光。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    You see culture, education and community participation as a long-term investment, not a one-off campaign.
                  </p>
                </li>

                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    你樂於和我們一起設計小型體驗、共創內容，而不是只希望把 logo 放得更大。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    You are open to co-designing experiences and content with us, instead of just making your logo bigger.
                  </p>
                </li>
              </ul>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 4: WAYS TO WORK TOGETHER ===== */}
        <section id="ways" aria-labelledby="ways-heading" className="py-20 md:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="ways-heading" className="mb-10">
                <span className="block text-2xl md:text-3xl font-semibold text-neutral-900" lang="zh-HK">
                  合作可以有幾種方式
                </span>
                <span className="block text-lg md:text-xl font-medium text-neutral-500 mt-2" lang="en">
                  Ways we can work together
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                {/* City Partner */}
                <div className="rounded-lg p-6 bg-neutral-50 border-l-4" style={{ borderLeftColor: TED_RED }}>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">城市夥伴</span>
                  </h3>
                  <p className="text-sm font-medium mb-3" style={{ color: TED_RED }} lang="en">City Partner</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    以較高額度的資金或綜合支持，幫我們確保場地、製作和核心體驗可以達到應有的水準。我們會在網站、現場物料與主持感謝中，以合規方式致謝你的支持。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    Provides significant financial or combined support to help secure the venue, production and core experience. We will acknowledge your support across our website, on-site materials and from the stage in a TEDx-compliant way.
                  </p>
                </div>

                {/* Experience Partner */}
                <div className="rounded-lg p-6 bg-neutral-50 border-l-4" style={{ borderLeftColor: TED_RED }}>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">體驗夥伴</span>
                  </h3>
                  <p className="text-sm font-medium mb-3" style={{ color: TED_RED }} lang="en">Experience Partner</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    為現場帶來空間、設計或互動體驗——例如場地佈置、裝置、體驗站或數據可視化等。我們會與你共同策劃，確保重點在「想法與對話」，而不是產品展示。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    Brings space, design or interactive experiences into the room — for example staging, installations, experience booths or data visualisations. We co-design these with you so the focus stays on ideas and conversations, not product demos.
                  </p>
                </div>

                {/* Content & Workshop Partner */}
                <div className="rounded-lg p-6 bg-neutral-50 border-l-4" style={{ borderLeftColor: TED_RED }}>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">知識與工作坊夥伴</span>
                  </h3>
                  <p className="text-sm font-medium mb-3" style={{ color: TED_RED }} lang="en">Content &amp; Workshop Partner</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    在 TEDx 主活動前後或平行時段，提供與主題呼應的小型工作坊、對談或實作 session，幫助觀眾把舞台上的想法延伸到實際行動。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    Offers workshops, small-group sessions or conversations before/after the main event that extend the theme into practice, helping participants turn on-stage ideas into real experiments.
                  </p>
                </div>

                {/* Community & Access Partner */}
                <div className="rounded-lg p-6 bg-neutral-50 border-l-4" style={{ borderLeftColor: TED_RED }}>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    <span lang="zh-HK">社群與可及性夥伴</span>
                  </h3>
                  <p className="text-sm font-medium mb-3" style={{ color: TED_RED }} lang="en">Community &amp; Access Partner</p>
                  <p className="text-sm text-neutral-700 leading-relaxed mb-2" lang="zh-HK">
                    支持學生、社區工作者、非牟利組織或行動不便人士參與活動——無論是資助門票、安排接駁，或共同策劃社群 outreach。
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed" lang="en">
                    Supports participation from students, community workers, non-profits or people with accessibility needs — whether through ticket support, transport, or co-designing community outreach.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-neutral-700 text-sm leading-relaxed" lang="zh-HK">
                以上只是起點。我們更樂於聽你的想法，一起定義一個最適合你角色的合作方式。
              </p>
              <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                These are starting points, not limits. We are happy to shape a partnership that fits who you are and the role you want to play.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 5: HOW WE RECOGNISE PARTNERS ===== */}
        <section id="recognition" aria-labelledby="recognition-heading" className="py-20 md:py-28 bg-neutral-50">
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="recognition-heading" className="mb-4">
                <span className="block text-2xl md:text-3xl font-semibold text-neutral-900" lang="zh-HK">
                  我們會如何致謝你
                </span>
                <span className="block text-lg md:text-xl font-medium text-neutral-500 mt-2" lang="en">
                  How we recognise our partners
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-neutral-800 text-base leading-relaxed mb-3" lang="zh-HK">
                在 TEDx 的框架下，我們不會提供傳統廣告位，但會認真、清晰地致謝每一位合作夥伴。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-neutral-600 text-base leading-relaxed mb-10" lang="en">
                Within the TEDx framework, we do not offer traditional advertising, but we do take every partnership seriously and acknowledge it clearly.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <ul className="space-y-6" role="list">
                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    在官方網站與節目物料上，以清晰而不突兀的方式列出你的名稱與標誌。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    Listing your name and logo in a clear but unobtrusive way on our official website and event materials.
                  </p>
                </li>

                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    在活動當日的主持感謝詞及幕前幕後簡報中，向觀眾致謝。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    Thanking you from the stage and in on-screen slides during the event.
                  </p>
                </li>

                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    在合適情況下，於社交媒體上分享合作故事，著重共同關心的議題，而不是硬銷。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    Sharing partnership stories on social media where appropriate, focusing on shared causes rather than promotion.
                  </p>
                </li>

                <li className="relative pl-6">
                  <span className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: TED_RED }} aria-hidden="true" />
                  <p className="text-neutral-800 text-base leading-relaxed" lang="zh-HK">
                    優先與你討論如何在未來數屆 TEDxBoundaryStreet 中，建立長期合作關係。
                  </p>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1" lang="en">
                    Exploring longer-term collaboration across future editions of TEDxBoundaryStreet.
                  </p>
                </li>
              </ul>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 6: PARTNERSHIP ENQUIRY FORM ===== */}
        <section id="contact" aria-labelledby="contact-heading" className="py-20 md:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="contact-heading" className="mb-4">
                <span className="block text-2xl md:text-3xl font-semibold text-neutral-900" lang="zh-HK">
                  有合作想法？和我們聊聊。
                </span>
                <span className="block text-lg md:text-xl font-medium text-neutral-500 mt-2" lang="en">
                  Have an idea? Let&apos;s talk.
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-neutral-800 text-base leading-relaxed mb-3" lang="zh-HK">
                如果你讀到這裡，腦裡已經浮現了一兩個畫面——場內的一個角落、一種體驗、一個你想支持的人群——不如先寫信來。我們會在籌備階段內，透過電郵或短線上會議，與你一起把想法具體化。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-neutral-600 text-base leading-relaxed mb-12" lang="en">
                If reading this has already sparked one or two images — a corner of the room, an experience, a community you want to support — start by writing to us. During our preparation phase, we&apos;ll follow up by email or a short call to shape the idea together.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="bg-neutral-50 rounded-lg p-6 md:p-8">
                {formState === 'submitted' ? (
                  <div className="text-center py-6" role="status">
                    <p className="text-neutral-800 font-medium mb-2" lang="zh-HK">
                      多謝！我們已收到你的查詢，會盡快回覆。
                    </p>
                    <p className="text-neutral-500 text-sm" lang="en">
                      Thank you! We have received your enquiry and will be in touch soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Organisation */}
                    <div className="mb-5">
                      <label htmlFor="org-name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        <span lang="zh-HK">組織名稱</span> / <span lang="en">Organisation</span>{' '}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="org-name"
                        type="text"
                        required
                        aria-required="true"
                        aria-invalid={errors.orgName ? 'true' : undefined}
                        aria-describedby={errors.orgName ? 'org-name-error' : undefined}
                        value={orgName}
                        onChange={(e) => { setOrgName(e.target.value); setErrors((prev) => ({ ...prev, orgName: '' })); }}
                        className="w-full px-4 py-3 border border-neutral-300 rounded text-base text-neutral-900 bg-white transition-shadow min-h-[44px]"
                      />
                      {errors.orgName && (
                        <p id="org-name-error" role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                          {errors.orgName}
                        </p>
                      )}
                    </div>

                    {/* Contact Person */}
                    <div className="mb-5">
                      <label htmlFor="contact-person" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        <span lang="zh-HK">聯絡人姓名</span> / <span lang="en">Contact person</span>{' '}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="contact-person"
                        type="text"
                        required
                        aria-required="true"
                        aria-invalid={errors.contactPerson ? 'true' : undefined}
                        aria-describedby={errors.contactPerson ? 'contact-person-error' : undefined}
                        value={contactPerson}
                        onChange={(e) => { setContactPerson(e.target.value); setErrors((prev) => ({ ...prev, contactPerson: '' })); }}
                        className="w-full px-4 py-3 border border-neutral-300 rounded text-base text-neutral-900 bg-white transition-shadow min-h-[44px]"
                      />
                      {errors.contactPerson && (
                        <p id="contact-person-error" role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                          {errors.contactPerson}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="mb-5">
                      <label htmlFor="partner-email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        <span lang="zh-HK">電郵</span> / <span lang="en">Email</span>{' '}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="partner-email"
                        type="email"
                        required
                        aria-required="true"
                        aria-invalid={errors.email ? 'true' : undefined}
                        aria-describedby={errors.email ? 'partner-email-error' : undefined}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                        className="w-full px-4 py-3 border border-neutral-300 rounded text-base text-neutral-900 bg-white transition-shadow min-h-[44px]"
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <p id="partner-email-error" role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Partnership Type (multi-select checkboxes) */}
                    <fieldset className="mb-5">
                      <legend className="block text-sm font-medium text-neutral-700 mb-2">
                        <span lang="zh-HK">合作類型</span> / <span lang="en">Partnership type</span>{' '}
                        <span className="text-red-600">*</span>
                      </legend>
                      <div className="space-y-2">
                        {PARTNERSHIP_TYPES.map((type) => (
                          <label key={type.key} className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                            <input
                              type="checkbox"
                              value={type.key}
                              checked={selectedTypes.includes(type.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTypes((prev) => [...prev, type.key]);
                                } else {
                                  setSelectedTypes((prev) => prev.filter((t) => t !== type.key));
                                }
                                setErrors((prev) => ({ ...prev, partnerType: '' }));
                              }}
                              className="w-5 h-5 rounded border-neutral-300"
                              style={{ accentColor: TED_RED }}
                            />
                            <span className="text-base text-neutral-700">
                              <span lang="zh-HK">{type.labelZh}</span>
                              <span className="text-neutral-400 mx-1">/</span>
                              <span lang="en">{type.labelEn}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.partnerType && (
                        <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                          {errors.partnerType}
                        </p>
                      )}
                    </fieldset>

                    {/* Idea */}
                    <div className="mb-6">
                      <label htmlFor="partner-idea" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        <span lang="zh-HK">請簡單分享你的想法</span> / <span lang="en">Tell us what you have in mind</span>{' '}
                        <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        id="partner-idea"
                        required
                        aria-required="true"
                        aria-invalid={errors.idea ? 'true' : undefined}
                        aria-describedby={errors.idea ? 'partner-idea-error' : undefined}
                        value={idea}
                        onChange={(e) => { setIdea(e.target.value); setErrors((prev) => ({ ...prev, idea: '' })); }}
                        rows={4}
                        className="w-full px-4 py-3 border border-neutral-300 rounded text-base text-neutral-900 bg-white transition-shadow min-h-[88px] resize-y"
                      />
                      {errors.idea && (
                        <p id="partner-idea-error" role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                          {errors.idea}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] px-8 py-3 text-white text-sm font-semibold tracking-wide rounded transition-all duration-200 hover:brightness-110 hover:shadow-md"
                      style={{ backgroundColor: TED_RED }}
                    >
                      <span lang="zh-HK">提交</span>
                      <span className="mx-2 opacity-60">|</span>
                      <span lang="en">Submit</span>
                    </button>
                  </form>
                )}
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-3xl mx-auto px-5">
          <div className="mb-6">
            <Link
              href="/vibe-demo/tedx-boundary-street"
              className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              TEDx<span className="font-light">BoundaryStreet</span>
            </Link>
            <p className="text-white/40 text-sm mt-1">Ideas of Crossing — Partners</p>
          </div>

          <nav aria-label="Social media" className="flex gap-6 mb-8 text-sm">
            <a href="#" className="text-white/50 hover:text-white transition-colors min-h-[44px] flex items-center">
              Instagram
            </a>
            <a href="#" className="text-white/50 hover:text-white transition-colors min-h-[44px] flex items-center">
              Facebook
            </a>
          </nav>

          <div className="w-12 h-[2px] mb-6" style={{ backgroundColor: `${TED_RED}60` }} aria-hidden="true" />

          <div className="text-xs text-white/30 leading-relaxed space-y-1">
            <p lang="en">This independent TEDx event is operated under license from TED.</p>
            <p lang="zh-HK">本 TEDx 活動為獨立籌辦，並在 TED 授權下運作。</p>
          </div>

          <nav aria-label="Footer navigation" className="mt-6 flex gap-4 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors min-h-[44px] flex items-center">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors min-h-[44px] flex items-center">Terms</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
