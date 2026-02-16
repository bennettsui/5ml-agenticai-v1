'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ==================== CONSTANTS ====================

const TED_RED = '#E62B1E';

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'attend', label: 'Attend' },
  { id: 'team', label: 'Team' },
  { id: 'partners', label: 'Partners' },
];

// ==================== HOOKS ====================

function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference
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

export default function TEDxMarketingClient() {
  const [headerSolid, setHeaderSolid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'submitted'>('idle');
  const [emailValue, setEmailValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [emailError, setEmailError] = useState('');

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
    setEmailError('');

    if (!emailValue.trim()) {
      setEmailError('請輸入電郵 / Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailError('請輸入有效電郵 / Please enter a valid email address');
      return;
    }

    setFormState('submitted');
    setEmailValue('');
    setNameValue('');
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
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`font-bold text-lg tracking-tight transition-colors min-h-[44px] flex items-center ${
              showSolidHeader ? 'text-neutral-900' : 'text-white'
            }`}
          >
            TEDx<span className="font-light">BoundaryStreet</span>
          </button>

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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden bg-white border-t border-neutral-100"
          >
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
          className="relative min-h-screen flex items-center justify-center bg-neutral-900 overflow-hidden"
        >
          {/* Subtle accent line echoing Boundary Street */}
          <div
            className="absolute top-1/2 left-0 right-0 h-[2px] opacity-20"
            style={{ backgroundColor: TED_RED }}
            aria-hidden="true"
          />

          <div className="relative text-center px-5 max-w-3xl mx-auto py-24">
            <FadeIn>
              <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
                TEDx<span className="font-light">BoundaryStreet</span>
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p
                className="text-white/90 text-xl sm:text-2xl md:text-3xl font-light tracking-wide mb-3"
                lang="en"
              >
                Ideas of Crossing
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              <p
                className="text-white/70 text-base sm:text-lg font-light mb-1"
                lang="en"
              >
                What stays. What shifts. What matters.
              </p>
            </FadeIn>

            <FadeIn delay={500}>
              <p
                className="text-white/60 text-base sm:text-lg font-light mb-10"
                lang="zh-HK"
              >
                留住的。改變的。重要的。
              </p>
            </FadeIn>

            <FadeIn delay={700}>
              <p
                className="text-white/50 text-sm sm:text-base leading-relaxed mb-3 max-w-xl mx-auto"
                lang="zh-HK"
              >
                在一切都加速改變的時代，我們站在界線曾經劃下的地方，問三個問題：什麼該保留？什麼該改變？我們又用什麼作為決定的根據？
              </p>
            </FadeIn>

            <FadeIn delay={800}>
              <p
                className="text-white/40 text-sm sm:text-base leading-relaxed mb-12 max-w-xl mx-auto"
                lang="en"
              >
                In a time when everything is speeding up, we stand where a line
                was once drawn and ask: What should stay? What should change? And
                what do we use to decide?
              </p>
            </FadeIn>

            <FadeIn delay={1000}>
              <button
                onClick={() => scrollTo('attend')}
                className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 text-white text-sm font-semibold tracking-wide rounded transition-all duration-200 hover:brightness-110 hover:scale-[1.03]"
                style={{ backgroundColor: TED_RED }}
              >
                <span lang="zh-HK">取得最新消息</span>
                <span className="mx-2 opacity-60">|</span>
                <span lang="en">Get updates</span>
              </button>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 2: THEME & BOUNDARY STREET STORY ===== */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="py-20 md:py-28 bg-white"
        >
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="about-heading" className="mb-10">
                <span
                  className="block text-2xl md:text-3xl font-semibold text-neutral-900"
                  lang="zh-HK"
                >
                  主題：Ideas of Crossing
                </span>
                <span
                  className="block text-lg md:text-xl font-medium text-neutral-500 mt-2"
                  lang="en"
                >
                  Theme: Ideas of Crossing
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p
                className="text-neutral-800 text-base md:text-lg leading-relaxed mb-4"
                lang="zh-HK"
              >
                「跨越」不只是由這一邊走到那一邊，而是在每一個轉折位上，決定要帶走什麼、放下什麼，為了誰。AI、城市更新、身份變化，都迫使我們不斷作這些選擇。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p
                className="text-neutral-600 text-base leading-relaxed mb-12"
                lang="en"
              >
                &ldquo;Crossing&rdquo; is not just moving from one side to
                another. It is choosing what to carry forward, what to leave
                behind, and who we are doing it for. AI, urban renewal and
                shifting identities all force these decisions.
              </p>
            </FadeIn>

            {/* Divider */}
            <FadeIn delay={250}>
              <div
                className="w-16 h-[2px] mx-auto my-12"
                style={{ backgroundColor: TED_RED }}
                aria-hidden="true"
              />
            </FadeIn>

            {/* Boundary Street story */}
            <FadeIn delay={300}>
              <p
                className="text-neutral-800 text-base md:text-lg leading-relaxed mb-4"
                lang="zh-HK"
              >
                Boundary Street
                曾經是香港歷史上的一道界線，分開兩個制度與兩種想像。今天，它變成一條很多人每天走過、甚至不會留意名字的街。我們以這條街為起點，談的不只是地理邊界，而是制度、文化、語言、世代之間的界線——以及我們如何穿越它們。
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              <p
                className="text-neutral-600 text-base leading-relaxed"
                lang="en"
              >
                Boundary Street was once a line on the map that separated two
                systems and two imaginations of the city. Today, it is a street
                many people cross without noticing its name. We start from this
                street to talk not only about geography, but about the
                boundaries between systems, cultures, languages and generations
                — and how we move through them.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 3: WHAT WE EXPLORE / EXPERIENCE ===== */}
        <section
          id="experience"
          aria-labelledby="experience-heading"
          className="py-20 md:py-28 bg-neutral-50"
        >
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="experience-heading" className="mb-10">
                <span
                  className="block text-2xl md:text-3xl font-semibold text-neutral-900"
                  lang="zh-HK"
                >
                  我們會一起探索什麼？
                </span>
                <span
                  className="block text-lg md:text-xl font-medium text-neutral-500 mt-2"
                  lang="en"
                >
                  What will we explore?
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <ul className="space-y-8 mb-14" role="list">
                <li className="relative pl-6">
                  <span
                    className="absolute left-0 top-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: TED_RED }}
                    aria-hidden="true"
                  />
                  <p
                    className="text-neutral-800 text-base md:text-lg leading-relaxed"
                    lang="zh-HK"
                  >
                    AI
                    如何改變我們看世界、做決定和彼此相處的方式。
                  </p>
                  <p
                    className="text-neutral-500 text-base leading-relaxed mt-1"
                    lang="en"
                  >
                    How AI is changing the way we see the world, make decisions
                    and relate to each other.
                  </p>
                </li>

                <li className="relative pl-6">
                  <span
                    className="absolute left-0 top-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: TED_RED }}
                    aria-hidden="true"
                  />
                  <p
                    className="text-neutral-800 text-base md:text-lg leading-relaxed"
                    lang="zh-HK"
                  >
                    城市在更新的同時，哪些記憶和空間值得被保留下來？
                  </p>
                  <p
                    className="text-neutral-500 text-base leading-relaxed mt-1"
                    lang="en"
                  >
                    As the city keeps being rebuilt, which memories and spaces
                    are worth keeping?
                  </p>
                </li>

                <li className="relative pl-6">
                  <span
                    className="absolute left-0 top-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: TED_RED }}
                    aria-hidden="true"
                  />
                  <p
                    className="text-neutral-800 text-base md:text-lg leading-relaxed"
                    lang="zh-HK"
                  >
                    在快與慢、本地與全球之間，我們可以用什麼節奏生活？
                  </p>
                  <p
                    className="text-neutral-500 text-base leading-relaxed mt-1"
                    lang="en"
                  >
                    Between fast and slow, local and global, what pace of life
                    can we choose?
                  </p>
                </li>
              </ul>
            </FadeIn>

            {/* Divider */}
            <FadeIn delay={200}>
              <div
                className="w-16 h-[2px] my-12"
                style={{ backgroundColor: TED_RED }}
                aria-hidden="true"
              />
            </FadeIn>

            {/* Beyond talks */}
            <FadeIn delay={300}>
              <p
                className="text-neutral-800 text-base md:text-lg leading-relaxed mb-4"
                lang="zh-HK"
              >
                這不會只是一整天坐著聽 talk
                的活動。我們正在設計一些小小的現場體驗，讓你要想一想自己會怎樣選，與旁邊的人聊一聊你們看見的未來。
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              <p
                className="text-neutral-600 text-base leading-relaxed"
                lang="en"
              >
                This will not be a day of just sitting and listening. We are
                designing small on-site experiences that invite you to think
                through your own choices and talk to the people next to you
                about the future you each see.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 4: ATTEND / GET UPDATES ===== */}
        <section
          id="attend"
          aria-labelledby="attend-heading"
          className="py-20 md:py-28 bg-white"
        >
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="attend-heading" className="mb-10">
                <span
                  className="block text-2xl md:text-3xl font-semibold text-neutral-900"
                  lang="zh-HK"
                >
                  如何參與
                </span>
                <span
                  className="block text-lg md:text-xl font-medium text-neutral-500 mt-2"
                  lang="en"
                >
                  How to attend
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p
                className="text-neutral-800 text-base md:text-lg leading-relaxed mb-4"
                lang="zh-HK"
              >
                TEDxBoundaryStreet
                將會是一場收費活動，目前仍在籌備階段。我們會先透過電郵分享最新進度、開票時間，以及更多關於主題與體驗設計的細節。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p
                className="text-neutral-600 text-base leading-relaxed mb-12"
                lang="en"
              >
                TEDxBoundaryStreet will be a paid event and is currently in
                preparation. We will first share updates by email — including
                ticket release dates and more details about the theme and the
                experience.
              </p>
            </FadeIn>

            {/* Subscription form */}
            <FadeIn delay={300}>
              <div className="bg-neutral-50 rounded-lg p-6 md:p-8">
                <h3 className="text-lg md:text-xl font-semibold text-neutral-900 mb-6">
                  <span lang="zh-HK">訂閱最新消息</span>
                  <span className="text-neutral-400 mx-2">/</span>
                  <span lang="en">Get updates</span>
                </h3>

                {formState === 'submitted' ? (
                  <div className="text-center py-6" role="status">
                    <p
                      className="text-neutral-800 font-medium mb-2"
                      lang="zh-HK"
                    >
                      多謝！我們會在有更新時通知你。
                    </p>
                    <p className="text-neutral-500 text-sm" lang="en">
                      Thank you! We&apos;ll be in touch when there is an update.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-5">
                      <label
                        htmlFor="subscribe-email"
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                      >
                        <span lang="zh-HK">電郵</span> /{' '}
                        <span lang="en">Email</span>{' '}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="subscribe-email"
                        type="email"
                        required
                        aria-required="true"
                        aria-invalid={emailError ? 'true' : undefined}
                        aria-describedby={
                          emailError ? 'email-error' : undefined
                        }
                        value={emailValue}
                        onChange={(e) => {
                          setEmailValue(e.target.value);
                          setEmailError('');
                        }}
                        className="w-full px-4 py-3 border border-neutral-300 rounded text-base text-neutral-900 bg-white transition-shadow min-h-[44px]"
                        placeholder="you@example.com"
                      />
                      {emailError && (
                        <p
                          id="email-error"
                          role="alert"
                          className="mt-1.5 text-sm font-medium text-red-700"
                        >
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label
                        htmlFor="subscribe-name"
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                      >
                        Name / <span lang="zh-HK">名稱</span>{' '}
                        <span className="text-neutral-400">
                          (optional / 選填)
                        </span>
                      </label>
                      <input
                        id="subscribe-name"
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-300 rounded text-base text-neutral-900 bg-white transition-shadow min-h-[44px]"
                      />
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

                <p className="mt-6 text-xs text-neutral-400 leading-relaxed">
                  <span lang="zh-HK">
                    我們只會在有實質更新時才寄出電郵，不會向你推銷產品或服務。
                  </span>
                  <br />
                  <span lang="en">
                    We will only email you when there is a real update. No
                    product or service spam.
                  </span>
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 5: ORGANIZERS & TEAM ===== */}
        <section
          id="team"
          aria-labelledby="team-heading"
          className="py-20 md:py-28 bg-neutral-50"
        >
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="team-heading" className="mb-10">
                <span
                  className="block text-2xl md:text-3xl font-semibold text-neutral-900"
                  lang="zh-HK"
                >
                  策展人與團隊
                </span>
                <span
                  className="block text-lg md:text-xl font-medium text-neutral-500 mt-2"
                  lang="en"
                >
                  Organizer &amp; team
                </span>
              </h2>
            </FadeIn>

            {/* Organizer intro */}
            <FadeIn delay={100}>
              <p
                className="text-neutral-800 text-base md:text-lg leading-relaxed mb-4"
                lang="zh-HK"
              >
                Bennet
                Tsui，廣告人與科技創業者，長期在九龍與港島之間與創意人、工程師和社區團隊合作。他曾參與
                TEDxKowloon 團隊，十年後決定以 Boundary Street
                為起點，再次把人與想法聚在同一房間。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p
                className="text-neutral-600 text-base leading-relaxed mb-12"
                lang="en"
              >
                Bennet Tsui is an advertising creative and tech entrepreneur who
                has spent years working between Kowloon and Hong Kong Island
                with creatives, engineers and community teams. After volunteering
                with TEDxKowloon a decade ago, he is now starting
                TEDxBoundaryStreet to once again gather people and ideas in the
                same room.
              </p>
            </FadeIn>

            {/* Team cards */}
            <FadeIn delay={300}>
              <div className="grid sm:grid-cols-3 gap-4 mb-12">
                <div className="bg-white rounded-lg p-5 border border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">
                    Bennet Tsui
                  </h3>
                  <p className="text-sm mt-1" style={{ color: TED_RED }}>
                    Curator / Organizer
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 border border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">
                    Steven Tsoi
                  </h3>
                  <p className="text-sm mt-1" style={{ color: TED_RED }}>
                    Experience Design &amp; Production
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 border border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">Stephen Ng</h3>
                  <p className="text-sm mt-1" style={{ color: TED_RED }}>
                    Partnerships &amp; Community
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Team positioning */}
            <FadeIn delay={400}>
              <p
                className="text-neutral-700 text-base leading-relaxed mb-4"
                lang="zh-HK"
              >
                我們的團隊不是從學院或機構出發，而是從實驗、創業與現場體驗開始。TEDxBoundaryStreet
                會保留 TED 舞台的
                rigor，同時帶入一點街頭與現場的氣味。
              </p>
            </FadeIn>

            <FadeIn delay={500}>
              <p
                className="text-neutral-500 text-base leading-relaxed"
                lang="en"
              >
                Our team does not come from academia or big institutions first,
                but from experiments, entrepreneurship and live experiences.
                TEDxBoundaryStreet aims to keep the rigor of a TED stage while
                bringing in the texture of the street and the room.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 6: PARTNERS ===== */}
        <section
          id="partners"
          aria-labelledby="partners-heading"
          className="py-20 md:py-28 bg-white"
        >
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2 id="partners-heading" className="mb-10">
                <span
                  className="block text-2xl md:text-3xl font-semibold text-neutral-900"
                  lang="zh-HK"
                >
                  合作夥伴
                </span>
                <span
                  className="block text-lg md:text-xl font-medium text-neutral-500 mt-2"
                  lang="en"
                >
                  Partners
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <p
                className="text-neutral-800 text-base md:text-lg leading-relaxed mb-4"
                lang="zh-HK"
              >
                我們正在尋找願意一起思考「科技 ×
                人性 ×
                城市邊界」的合作夥伴，從場地與製作，到社群與可及性支持。如果你想像得到一種更有意思的合作方式，歡迎跟我們聊聊。
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <p
                className="text-neutral-600 text-base leading-relaxed mb-10"
                lang="en"
              >
                We are looking for partners who want to think with us about
                technology, humanity and the boundaries of the city — from venue
                and production to community and accessibility support. If you
                can imagine a more meaningful way to collaborate, we&apos;d love
                to talk.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:hello@tedxboundarystreet.com"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 text-white text-sm font-semibold rounded transition-all duration-200 hover:brightness-110 hover:shadow-md"
                  style={{ backgroundColor: TED_RED }}
                >
                  <span lang="en">Partner with TEDxBoundaryStreet</span>
                </a>
                <a
                  href="mailto:hello@tedxboundarystreet.com"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 text-sm font-semibold rounded border-2 transition-all duration-200 hover:bg-neutral-50"
                  style={{ borderColor: TED_RED, color: TED_RED }}
                >
                  <span lang="zh-HK">
                    成為 TEDxBoundaryStreet 合作夥伴
                  </span>
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ===== SECTION 7: WHAT IS TEDx ===== */}
        <section
          aria-labelledby="tedx-heading"
          className="py-16 md:py-20 bg-neutral-50 border-t border-neutral-200"
        >
          <div className="max-w-3xl mx-auto px-5">
            <FadeIn>
              <h2
                id="tedx-heading"
                className="text-lg md:text-xl font-semibold text-neutral-700 mb-6"
              >
                <span lang="zh-HK">什麼是 TEDx？</span>
                <span className="text-neutral-400 mx-2">&middot;</span>
                <span lang="en">What is TEDx?</span>
              </h2>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="space-y-6 text-sm leading-relaxed">
                <p className="text-neutral-600" lang="zh-HK">
                  為了將「ideas worth spreading」帶到世界各地，TED 推出了
                  TEDx
                  計劃，讓本地團隊可以在自己的城市策劃獨立活動，分享 TED
                  式的體驗。TEDxBoundaryStreet 是其中一個在香港舉辦的
                  TEDx 活動。
                </p>
                <p className="text-neutral-500" lang="en">
                  In the spirit of ideas worth spreading, TED has created a
                  program called TEDx — a series of local, self-organized events
                  that bring people together to share a TED-like experience.
                  TEDxBoundaryStreet is one such independently organized TEDx
                  event in Hong Kong.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-3xl mx-auto px-5">
          {/* Brand */}
          <div className="mb-6">
            <p className="text-lg font-bold tracking-tight">
              TEDx<span className="font-light">BoundaryStreet</span>
            </p>
            <p className="text-white/40 text-sm mt-1">Ideas of Crossing</p>
          </div>

          {/* Social links */}
          <nav aria-label="Social media" className="flex gap-6 mb-8 text-sm">
            <a
              href="#"
              className="text-white/50 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              Instagram
            </a>
            <a
              href="#"
              className="text-white/50 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              Facebook
            </a>
          </nav>

          {/* Divider */}
          <div
            className="w-12 h-[2px] mb-6"
            style={{ backgroundColor: `${TED_RED}60` }}
            aria-hidden="true"
          />

          {/* Disclaimer */}
          <div className="text-xs text-white/30 leading-relaxed space-y-1">
            <p lang="en">
              This independent TEDx event is operated under license from TED.
            </p>
            <p lang="zh-HK">
              本 TEDx 活動為獨立籌辦，並在 TED 授權下運作。
            </p>
          </div>

          {/* Footer nav */}
          <nav
            aria-label="Footer navigation"
            className="mt-6 flex gap-4 text-xs text-white/30"
          >
            <a
              href="#"
              className="hover:text-white/60 transition-colors min-h-[44px] flex items-center"
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-white/60 transition-colors min-h-[44px] flex items-center"
            >
              Terms
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
