'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ServicesShowcase } from './components/ServicesShowcase';
import { useLanguage } from './hooks/useLanguage';

/* ─── Typewriter hook ────────────────────────────────────── */
function useTypewriter(text: string, speed = 22, startDelay = 300) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

/* ─── Testimonial typewriter card ───────────────────────── */
function TestimonialCard({
  quote,
  author,
  company,
  delay = 0,
}: {
  quote: string;
  author: string;
  company: string;
  delay?: number;
}) {
  const { displayed, done } = useTypewriter(quote, 16, delay);

  return (
    <div className="flex flex-col p-8 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg">
      <div className="flex gap-0.5 mb-5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-base">★</span>
        ))}
      </div>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 flex-1 min-h-[96px]">
        &ldquo;{displayed}<span className={`inline-block w-0.5 h-4 bg-purple-500 ml-0.5 ${done ? 'opacity-0' : 'animate-pulse'}`} />&rdquo;
      </p>
      <div className="transition-opacity duration-500" style={{ opacity: done ? 1 : 0 }}>
        <p className="font-semibold text-slate-900 dark:text-white text-sm">{author}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{company}</p>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function RadiancePage() {
  const { lang } = useLanguage();

  // Testimonials — 3 entries
  const testimonials = lang === 'zh'
    ? [
        {
          quote: 'Radiance 徹底改變了我們對整合行銷的思維方式。公關工作切實帶動了活動出席率，內容創作亦獲媒體主動採用。整個體系環環相扣，成效顯著。',
          author: '市場推廣總監',
          company: '科技初創企業'
        },
        {
          quote: '短短六個月，我們從一個名不見經傳的品牌，蛻變為業界公認的思想領袖。團隊專業、反應迅速，切實兌現每一個承諾。',
          author: '創辦人',
          company: 'SaaS 企業'
        },
        {
          quote: '他們策劃的每一個活動都有清晰意圖——從邀請到最後的媒體剪片，環環緊扣。他們的思維方式是市場人，而非單純的活動籌辦者。',
          author: '品牌經理',
          company: '美容生活品牌'
        },
      ]
    : [
        {
          quote: 'Radiance transformed how we think about integrated marketing. The PR actually drives event attendance, the content gets picked up by media. It works.',
          author: 'Marketing Director',
          company: 'Tech Startup'
        },
        {
          quote: 'We went from completely unknown to being recognized as an industry thought leader in 6 months. The team is professional, responsive, and actually delivers.',
          author: 'Founder',
          company: 'SaaS Company'
        },
        {
          quote: 'Every event they produce feels intentional — from the invite to the final media clip. They think like marketers, not just event planners.',
          author: 'Brand Manager',
          company: 'Beauty & Lifestyle Brand'
        },
      ];

  // Hero slides — rotating images + messages
  const heroSlides = lang === 'zh'
    ? [
        { image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1920&q=80', tagline: '讓您的品牌成為市場焦點', sub: '策略與執行並重。我們整合公關、活動及數碼渠道，為您的品牌在香港建立真正的市場動力。' },
        { image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=80', tagline: '您的故事，登上每一個頭條', sub: '我們精準構建媒體報道，將您的品牌定位為業界不可忽視的聲音。' },
        { image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1920&q=80', tagline: '建立口碑，推動商業成果', sub: '公關、活動、社交媒體——整合協作，每個渠道都為下一個賦能。' },
      ]
    : [
        { image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1920&q=80', tagline: 'Make Your Brand Impossible to Ignore', sub: 'Strategy meets execution. We orchestrate PR, events, and digital to build real momentum for your brand in Hong Kong.' },
        { image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=80', tagline: 'Your Story. In Every Headline.', sub: 'We engineer precise media coverage that positions your brand as the voice every journalist wants to feature.' },
        { image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1920&q=80', tagline: 'Reputation Built. Results Delivered.', sub: 'PR, events, social media—working together so every channel amplifies the next.' },
      ];

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveSlide(s => (s + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  // Parallax
  const heroParallaxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (heroParallaxRef.current) {
          heroParallaxRef.current.style.transform = `translateY(${window.scrollY * 0.28}px)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const processSteps = lang === 'zh'
    ? [
        { step: '01', title: '探索', desc: '我們從您的挑戰與目標出發，透過工作坊及深入研究，梳理敘事機遇，並確定最能推動成效的渠道組合。' },
        { step: '02', title: '規劃', desc: '我們制定整合策略，將公關、活動、內容及合作夥伴關係編織成一套連貫的品牌敘事。執行前，您將看到完整的推進路線圖。' },
        { step: '03', title: '執行', desc: '我們的團隊跨渠道全面執行——媒體推廣、活動製作、內容創作、夥伴合作。我們實時追蹤成效，並靈活因應調整策略。' },
      ]
    : [
        { step: '01', title: 'Discover', desc: 'We start with your challenge and goals. Through workshops and research, we map narrative opportunities and identify which channels will move the needle.' },
        { step: '02', title: 'Design', desc: 'We develop an integrated strategy weaving together PR, events, content, and partnerships into a coherent narrative. You see the full roadmap before execution begins.' },
        { step: '03', title: 'Deliver', desc: 'Our team executes across all channels—media outreach, event production, content creation, partnerships. We track results and adapt in real time.' },
      ];

  const whyItems = lang === 'zh'
    ? [
        { stat: '10+', label: '服務年資', desc: '深耕香港媒體生態與文化脈絡。' },
        { stat: '80+', label: '媒體報道', desc: '每個推廣活動的平均媒體曝光量。' },
        { stat: '50+', label: '品牌活動', desc: '跨行業精心策劃並執行。' },
        { stat: '3×', label: '整合回報', desc: '整合推廣活動對比各渠道獨立運作的投資回報差距。' },
      ]
    : [
        { stat: '10+', label: 'Years in HK', desc: 'Deep expertise in Hong Kong media and cultural dynamics.' },
        { stat: '80+', label: 'Media Placements', desc: 'Average earned coverage per campaign across top outlets.' },
        { stat: '50+', label: 'Brand Events', desc: 'Produced across industries, always on time and on brief.' },
        { stat: '3×', label: 'Integrated ROI', desc: 'Return uplift when channels work together vs. in silos.' },
      ];

  return (
    <main id="main-content" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      {/* ── Hero: rotating full-bleed photos ── */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] flex items-center justify-center overflow-hidden">
        {/* Parallax background container */}
        <div ref={heroParallaxRef} className="absolute inset-0 w-full h-[120%] -top-[10%] will-change-transform">
          {heroSlides.map((slide, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${slide.image})`,
                opacity: i === activeSlide ? 1 : 0,
              }}
            />
          ))}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/60 to-slate-950/80" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Rotating tagline */}
          <div className="relative h-[1.2em] md:h-[1.15em] overflow-hidden mb-8">
            {heroSlides.map((slide, i) => (
              <h1
                key={i}
                className="absolute inset-x-0 text-5xl md:text-7xl font-bold leading-tight text-white transition-all duration-700"
                style={{
                  opacity: i === activeSlide ? 1 : 0,
                  transform: i === activeSlide ? 'translateY(0)' : 'translateY(24px)',
                }}
              >
                {slide.tagline}
              </h1>
            ))}
          </div>

          {/* Rotating subtitle */}
          <div className="relative overflow-hidden mb-10 min-h-[60px]">
            {heroSlides.map((slide, i) => (
              <p
                key={i}
                className="absolute inset-x-0 text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto font-light transition-all duration-700"
                style={{
                  opacity: i === activeSlide ? 1 : 0,
                  transform: i === activeSlide ? 'translateY(0)' : 'translateY(16px)',
                }}
              >
                {slide.sub}
              </p>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/vibe-demo/radiance/consultation"
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-300 text-lg"
            >
              {lang === 'zh' ? '免費諮詢' : 'Free Consultation'}
            </Link>
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="px-8 py-3.5 border border-white/40 text-white font-medium rounded-lg hover:border-white hover:bg-white/10 transition-all duration-300 text-lg"
            >
              {lang === 'zh' ? '瀏覽我們的作品' : 'See Our Work'}
            </Link>
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-500 ${i === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-16 px-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-400 dark:text-slate-500 mb-10 text-xs uppercase tracking-widest font-medium">
            {lang === 'zh' ? '深受各行業領先品牌信賴' : 'Trusted by leading brands across sectors'}
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {(lang === 'zh'
              ? ['消費品', '科技', '非牟利', '文化藝術', '金融', '教育']
              : ['Consumer', 'Technology', 'NGOs', 'Culture & Arts', 'Finance', 'Education']
            ).map((item) => (
              <div key={item} className="py-2 border border-slate-100 dark:border-slate-800 rounded">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Showcase ── */}
      <ServicesShowcase />

      {/* ── Why Radiance — stat grid ── */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">
                {lang === 'zh' ? '為何選擇 Radiance' : 'Why Work with Radiance'}
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                {lang === 'zh'
                  ? '整合設計\n成效卓著'
                  : 'Integrated by design.\nProven by results.'}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-light">
                {lang === 'zh'
                  ? '我們不分開管理公關、活動和社交媒體——我們以一套統一策略協調它們，讓各渠道互相放大、形成合力。'
                  : "We don't manage PR, events, and social separately—we orchestrate them as one strategy so each channel amplifies the others."}
              </p>
              <div className="flex flex-col gap-5">
                {(lang === 'zh'
                  ? [
                      { title: '親力親為的執行', desc: '我們不只遞交策略文件便消失。我們親自負責媒體關係、活動統籌及內容製作。' },
                      { title: '深耕本地', desc: '香港媒體生態、文化動態與受眾習慣，我們瞭如指掌。' },
                      { title: '跨界廣度', desc: '從科技初創到非牟利機構、文化藝術團體，豐富的跨行業經驗滋養每一個項目。' },
                    ]
                  : [
                      { title: 'Hands-On Execution', desc: "We're not strategists who disappear. Our team manages media relations, produces events, creates content." },
                      { title: 'Deep Local Expertise', desc: 'Hong Kong media relationships, cultural nuance, and audience dynamics built over years of real work.' },
                      { title: 'Hybrid Experience', desc: "Commercial brands, NGOs, cultural institutions—that breadth makes every campaign smarter." },
                    ]
                ).map((item, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="w-px bg-purple-300 dark:bg-purple-700 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {whyItems.map((item, i) => (
                <div
                  key={i}
                  className="p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <div className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-2">{item.stat}</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{item.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Case Studies ── */}
      <section id="cases" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">
              {lang === 'zh' ? '成功案例' : 'Case Studies'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {lang === 'zh' ? '成果自會說話' : 'Results That Speak'}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              {lang === 'zh' ? '推動真實業務成效的整合推廣活動' : 'Integrated campaigns that drive real business outcomes'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {(lang === 'zh'
              ? [
                  { title: '龍虎山生態保育', challenge: '為環境教育項目建立社會認知', result: '逾 80 篇自然媒體報道，獲主流媒體重點刊登', href: '/vibe-demo/radiance/case-studies/lung-fu-shan' },
                  { title: '2025 年威尼斯建築雙年展', challenge: '為香港建築展覽進行國際公關推廣', result: '香港館獲全球媒體廣泛報道', href: '/vibe-demo/radiance/case-studies/venice-biennale-hk' },
                  { title: 'Her Own Words Sport', challenge: '為香港首個提供 17 款亞洲尺碼的運動服品牌進行品牌發布', result: '逾 40 篇媒體報道，刊登於 Marie Claire、Elle、Cosmopolitan', href: '/vibe-demo/radiance/case-studies/her-own-words-sport' },
                ]
              : [
                  { title: 'Lung Fu Shan Conservation', challenge: 'Build awareness for environmental education initiative', result: '80+ earned media placements, featured in top-tier outlets', href: '/vibe-demo/radiance/case-studies/lung-fu-shan' },
                  { title: 'Venice Biennale 2025', challenge: 'International PR for Hong Kong Architecture Exhibition', result: 'Global media coverage for prestigious architecture biennial', href: '/vibe-demo/radiance/case-studies/venice-biennale-hk' },
                  { title: 'Her Own Words Sport', challenge: "Launch Hong Kong's first sportswear brand with 17 Asian sizing options", result: '40+ media placements in Marie Claire, Elle, Cosmopolitan', href: '/vibe-demo/radiance/case-studies/her-own-words-sport' },
                ]
            ).map((item, idx) => (
              <Link key={idx} href={item.href} className="group block">
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg p-8 h-full hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed">{item.challenge}</p>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold text-sm">✓ {item.result}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/vibe-demo/radiance/case-studies" className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              {lang === 'zh' ? '查看所有成功案例 →' : 'View All Case Studies →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Our Process ── */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">
              {lang === 'zh' ? '工作方式' : 'How We Work'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              {lang === 'zh' ? '我們的工作流程' : 'Our Process'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0 relative">
            {/* Connecting line behind cards */}
            <div className="hidden md:block absolute top-12 left-[calc(33.333%-16px)] right-[calc(33.333%-16px)] h-px bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 dark:from-purple-800 dark:via-purple-600 dark:to-purple-800 z-0" />

            {processSteps.map((item, idx) => (
              <div key={`${lang}-${idx}`} className="relative z-10 px-4 first:pl-0 last:pr-0">
                <div className="bg-white dark:bg-slate-950 pt-2 pb-8">
                  {/* Step badge */}
                  <div className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-lg mb-8 ring-4 ring-white dark:ring-slate-950">
                    {item.step}
                  </div>
                  {/* Large decorative number */}
                  <div className="absolute top-2 left-8 text-[120px] font-black text-slate-50 dark:text-white/[0.03] leading-none select-none pointer-events-none -z-10">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Typewriter Testimonials — 3 in a row ── */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">
              {lang === 'zh' ? '客戶評價' : 'Client Testimonials'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              {lang === 'zh' ? '客戶如何評價我們' : 'What Our Clients Say'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard
                key={`${lang}-${i}`}
                quote={t.quote}
                author={t.author}
                company={t.company}
                delay={i * 700}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-r from-purple-700 to-purple-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {lang === 'zh' ? '準備好推動品牌向前邁進？' : 'Ready to Move Your Brand Forward?'}
          </h2>
          <p className="text-xl text-purple-100 mb-10 leading-relaxed font-light">
            {lang === 'zh'
              ? '讓我們一同探討您的下一個挑戰。無論是整合推廣活動、品牌形象提升，還是市場拓展，我們隨時候命。'
              : "Let's discuss your next challenge. Whether it's a campaign, reputation shift, or market entry—we're here to help."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vibe-demo/radiance/consultation" className="px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-purple-50 transition-colors text-lg">
              {lang === 'zh' ? '預約免費諮詢 →' : 'Schedule Your Free Session →'}
            </Link>
            <Link href="/vibe-demo/radiance/contact" className="px-8 py-4 border-2 border-white/60 text-white font-bold rounded-lg hover:border-white hover:bg-white/10 transition-colors text-lg">
              {lang === 'zh' ? '聯絡我們' : 'Get in Touch'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
