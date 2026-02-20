'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
  active,
}: {
  quote: string;
  author: string;
  company: string;
  active: boolean;
}) {
  const { displayed, done } = useTypewriter(active ? quote : '', 18, 200);

  if (!active) return null;

  return (
    <div className="p-8 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg">
      <div className="flex gap-0.5 mb-5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-base">★</span>
        ))}
      </div>
      <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed mb-6 min-h-[80px]">
        &ldquo;{displayed}<span className={`inline-block w-0.5 h-5 bg-purple-500 ml-0.5 ${done ? 'opacity-0' : 'animate-pulse'}`} />&rdquo;
      </p>
      <div
        className="transition-opacity duration-500"
        style={{ opacity: done ? 1 : 0 }}
      >
        <p className="font-semibold text-slate-900 dark:text-white">{author}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{company}</p>
      </div>
    </div>
  );
}

/* ─── Interactive Process step ──────────────────────────── */
function ProcessStep({
  step,
  title,
  desc,
  revealed,
  isLast,
  onReveal,
}: {
  step: string;
  title: string;
  desc: string;
  revealed: boolean;
  isLast: boolean;
  onReveal?: () => void;
}) {
  return (
    <div
      className={`relative transition-all duration-500 ${revealed ? 'opacity-100' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      {/* Connector line */}
      {!isLast && (
        <div className="hidden md:block absolute top-8 left-[calc(100%+0px)] w-8 h-px bg-purple-300 dark:bg-purple-800 z-10" />
      )}
      <div className="p-8 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg h-full">
        <div className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">
          {step}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
      {!isLast && onReveal && (
        <button
          onClick={onReveal}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
        >
          Next step <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function RadiancePage() {
  const { lang } = useLanguage();

  // Interactive process state
  const [stepsRevealed, setStepsRevealed] = useState(1);

  // Testimonial carousel
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
      ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [testimonialKey, setTestimonialKey] = useState(0);

  // Auto-advance testimonials
  useEffect(() => {
    const t = setTimeout(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
      setTestimonialKey(k => k + 1);
    }, 8000);
    return () => clearTimeout(t);
  }, [activeTestimonial, testimonials.length]);

  // Reset process when lang changes
  useEffect(() => {
    setStepsRevealed(1);
  }, [lang]);

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

      {/* ── Hero: full-bleed photo ── */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] flex items-center justify-center overflow-hidden">
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1920&q=80"
          alt="Hong Kong cityscape"
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/60 to-slate-950/80" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight text-white">
            {lang === 'zh' ? (
              <>讓您的品牌<br className="hidden md:block" />成為市場焦點</>
            ) : (
              <>Make Your Brand<br className="hidden md:block" />Impossible to Ignore</>
            )}
          </h1>
          <p className="text-xl text-white/80 mb-10 leading-relaxed max-w-2xl mx-auto font-light">
            {lang === 'zh'
              ? '策略與執行並重。我們整合公關、活動及數碼渠道，為您的品牌在香港建立真正的市場動力。'
              : 'Strategy meets execution. We orchestrate PR, events, and digital to build real momentum for your brand in Hong Kong.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

      {/* ── Interactive Process ── */}
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

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-start">
            {processSteps.map((item, idx) => (
              <ProcessStep
                key={`${lang}-${idx}`}
                step={item.step}
                title={item.title}
                desc={item.desc}
                revealed={idx < stepsRevealed}
                isLast={idx === processSteps.length - 1}
                onReveal={idx === stepsRevealed - 1 && idx < processSteps.length - 1
                  ? () => setStepsRevealed(s => s + 1)
                  : undefined
                }
              />
            ))}
          </div>

          {stepsRevealed < processSteps.length && (
            <p className="mt-8 text-sm text-slate-400 dark:text-slate-500 text-center">
              {lang === 'zh' ? '點擊「下一步」繼續了解我們的流程' : 'Click "Next step" to continue exploring our process'}
            </p>
          )}
        </div>
      </section>

      {/* ── Typewriter Testimonials ── */}
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

          <div className="max-w-3xl mx-auto">
            <TestimonialCard
              key={`${lang}-${testimonialKey}`}
              quote={testimonials[activeTestimonial].quote}
              author={testimonials[activeTestimonial].author}
              company={testimonials[activeTestimonial].company}
              active={true}
            />

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveTestimonial(i); setTestimonialKey(k => k + 1); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? 'bg-purple-600 w-6' : 'bg-slate-300 dark:bg-slate-600 hover:bg-purple-400'}`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
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
