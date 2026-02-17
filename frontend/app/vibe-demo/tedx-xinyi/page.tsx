'use client';

import Link from 'next/link';
import { SiteNav, SiteFooter, Section, FadeIn, globalStyles, TED_RED } from './components';

// ==================== DATA ====================

const SPEAKERS = [
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%BC%B5%E5%8D%89%E5%90%9B-e1625535281259-500x500.png' },
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%94%A1%E5%B9%B4%E7%8E%A8-500x500.jpg' },
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%8A%89%E6%AC%A3%E7%91%9C%E2%80%94%E7%94%9F%E6%B4%BB%E7%85%A7-e1625535100576-500x500.png' },
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%8C%83%E6%AC%BD%E6%85%A72-e1625812859822-500x500.jpg' },
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E6%AE%B5%E6%99%BA%E6%95%8F%EF%BC%92-500x500.jpg' },
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E6%9E%97%E7%9F%A5%E7%A7%A6-e1625816914518-500x500.jpg' },
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%91%A8%E4%B8%96%E9%9B%84-500x500.jpg' },
  { name: '講者姓名', role: '領域／專長', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%95%AD%E9%9D%92%E9%99%BD-scaled-e1625535578597-500x500.jpg' },
];

const BLOG_POSTS = [
  {
    title: '策展與科技整合的未來，還是人的感受與信任',
    date: '2025-09-25',
    excerpt: '當 AI 整合變成顯學，我們更在意的是：在演講現場、在觀眾眼裡，人與人之間的信任與感受，會不會被忽略。',
    image: 'https://tedxxinyi.com/wp-content/uploads/2025/09/ChatGPT-Image-2025%E5%B9%B49%E6%9C%8825%E6%97%A5-%E4%B8%8B%E5%8D%8804_22_26-150x150.png',
  },
  {
    title: '樂觀三部曲連載',
    date: '2021-08-24',
    excerpt: '從個人、城市到地球，我們試著拆解『樂觀』這個詞，\n不是假裝沒事，而是在最糟的時代練習看見可能。',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/08/%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7-2021-08-24-%E4%B8%8B%E5%8D%882.38.47.png',
  },
  {
    title: 'Zoom 如何置換個人背景',
    date: '2021-08-12',
    excerpt: '一個疫情下的小技術指南，\n也是我們思考『螢幕另一端』怎麼保持專業與真實感的小練習。',
    image: null,
  },
];

const PARTNER_LOGOS = [
  'https://tedxxinyi.com/wp-content/uploads/2021/07/1MORE-e1627275745256.png',
  'https://tedxxinyi.com/wp-content/uploads/2021/07/cofit-e1626948574733.png',
  'https://tedxxinyi.com/wp-content/uploads/2021/07/tissue-150x150.png',
  'https://tedxxinyi.com/wp-content/uploads/2021/07/%E7%BE%8E%E5%AD%B8-e1626949204652.png',
  'https://tedxxinyi.com/wp-content/uploads/2021/07/one-ten%E5%9C%93%E5%BD%A2logo-150x150.jpg',
  'https://tedxxinyi.com/wp-content/uploads/2021/07/%E9%AD%9A.png',
  'https://tedxxinyi.com/wp-content/uploads/2021/07/%E6%9D%B1%E5%90%B3.png',
];

// ==================== ENTRY CARDS DATA ====================

const ENTRY_CARDS = [
  {
    title: '關於 TEDxXinyi',
    description: '在台北信義，我們用 TEDx 的形式，建立一個讓城市暫時放慢、聽彼此說話的場域。',
    button: '走進故事',
    href: '/vibe-demo/tedx-xinyi/about',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/08/S__45482024.jpg',
  },
  {
    title: '年度大會舞台永續設計',
    description: '舞台不只是背景，而是一種對未來的態度。\n我們實驗再製、3D 列印與可回收材質，讓每一屆的舞台都能留下新的可能。',
    button: '看我們怎麼做',
    href: '/vibe-demo/tedx-xinyi/sustainability',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/08/%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7-2021-08-24-%E4%B8%8B%E5%8D%882.37.26.png',
  },
  {
    title: '社群與小型聚會',
    description: '除了年度大會，我們也透過 TED Circles、工作坊與城市散步，\n讓想法在一年中的不同時刻持續發生。',
    button: '加入社群',
    href: '/vibe-demo/tedx-xinyi/community',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/logo_white_%E5%B7%A5%E4%BD%9C%E5%8D%80%E5%9F%9F-1-e1625644086441.png',
  },
];

// ==================== PAGE COMPONENT ====================

export default function TEDxXinyiHome() {
  return (
    <div className="tedx-xinyi bg-neutral-950 text-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi" />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://tedxxinyi.com/wp-content/uploads/2022/06/web_1350x800.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.3) saturate(0.7)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/60" />
        </div>

        {/* Red accent line */}
        <div
          className="absolute top-1/2 left-0 right-0 h-[2px] opacity-30"
          style={{ backgroundColor: TED_RED }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-20">
          <FadeIn>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-8" lang="zh-TW">
              「主題暫位：在信義，練習一種樂觀」
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-white/70 text-base sm:text-lg md:text-xl leading-relaxed mb-4 max-w-2xl mx-auto" lang="zh-TW">
              TEDxXinyi 把世界的想法帶進台北信義，<br />
              也把信義日常的矛盾、壓力與想像搬上舞台。<br />
              我們用一次又一次的策展，練習一種面向未來的樂觀。
            </p>
          </FadeIn>

          <FadeIn delay={350}>
            <p className="text-white/40 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl mx-auto italic" lang="en">
              In Xinyi, we rehearse a more optimistic future — one talk, one stage, one community at a time.
            </p>
          </FadeIn>

          <FadeIn delay={500}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                className="px-8 py-3 text-white font-bold text-sm tracking-wide rounded-full transition-all hover:scale-105"
                style={{ backgroundColor: TED_RED }}
                lang="zh-TW"
              >
                關注本年度大會
              </button>
              <Link
                href="/vibe-demo/tedx-xinyi/about"
                className="px-8 py-3 text-white/70 hover:text-white font-medium text-sm tracking-wide rounded-full border border-white/20 hover:border-white/50 transition-all"
                lang="zh-TW"
              >
                認識 TEDxXinyi
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-8 bg-white/20" />
        </div>
      </section>

      {/* ==================== THREE ENTRY CARDS ==================== */}
      <Section dark={false}>
        <FadeIn>
          <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2" lang="en">EXPLORE</p>
          <p className="text-white/60 text-base mb-12" lang="zh-TW">
            從三個入口，走進 TEDxXinyi 的宇宙。
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ENTRY_CARDS.map((card, i) => (
            <FadeIn key={card.title} delay={i * 150}>
              <Link
                href={card.href}
                className="group block bg-neutral-800/50 rounded-2xl overflow-hidden border border-white/5 hover:border-white/15 transition-all hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={card.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={i === 2 ? { objectFit: 'contain', padding: '2rem', filter: 'invert(0)' } : undefined}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-3" lang="zh-TW">{card.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4 whitespace-pre-line" lang="zh-TW">
                    {card.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                    style={{ color: TED_RED }}
                    lang="zh-TW"
                  >
                    {card.button}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== SPEAKERS HIGHLIGHT ==================== */}
      <Section>
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-black mb-4" lang="zh-TW">講者陣容</h2>
          <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-12 max-w-2xl" lang="zh-TW">
            這些是曾經站上 TEDxXinyi 舞台的一小部分。<br />
            更多來自不同領域的講者，正在形塑我們對信義、對未來的想像。
          </p>
        </FadeIn>

        {/* Speaker grid — lineup style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {SPEAKERS.map((speaker, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="group relative">
                <div className="aspect-square overflow-hidden rounded-xl bg-neutral-800">
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                    style={{ filter: 'saturate(0.8)' }}
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl" />
                </div>
                {/* Name + role */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <p className="text-white font-bold text-sm sm:text-base" lang="zh-TW">{speaker.name}</p>
                  <p className="text-white/50 text-xs" lang="zh-TW">{speaker.role}</p>
                </div>
                {/* Red line on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
                  style={{ backgroundColor: TED_RED }}
                />
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="text-center">
            <Link
              href="/vibe-demo/tedx-xinyi/speakers"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-white/20 hover:border-white/50 rounded-full text-white/70 hover:text-white transition-all"
              lang="zh-TW"
            >
              看所有講者與 Talks
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== LATEST BLOG ==================== */}
      <Section dark={false}>
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-black mb-12" lang="zh-TW">最新文章</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {BLOG_POSTS.map((post, i) => (
            <FadeIn key={post.title} delay={i * 120}>
              <div className="group bg-neutral-800/30 rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all h-full flex flex-col">
                {post.image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-white/30 text-xs mb-2">{post.date}</p>
                  <h3 className="text-base font-bold mb-3 group-hover:text-white transition-colors" lang="zh-TW">
                    {post.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed flex-1 whitespace-pre-line" lang="zh-TW">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="text-center">
            <Link
              href="/vibe-demo/tedx-xinyi/blog"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-white/20 hover:border-white/50 rounded-full text-white/70 hover:text-white transition-all"
              lang="zh-TW"
            >
              閱讀所有文章
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== PARTNERS ==================== */}
      <Section>
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-black mb-3" lang="zh-TW">合作夥伴</h2>
          <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-12 max-w-xl" lang="zh-TW">
            這些品牌、組織與空間，和我們一起在信義嘗試新的可能。
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-6 items-center mb-12">
            {PARTNER_LOGOS.map((logo, i) => (
              <div
                key={i}
                className="flex items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors aspect-square"
              >
                <img
                  src={logo}
                  alt="Partner logo"
                  className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity"
                  style={{ filter: 'brightness(1.2)' }}
                />
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn>
          <div className="text-center">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-white/20 hover:border-white/50 rounded-full text-white/70 hover:text-white transition-all"
              lang="zh-TW"
            >
              看更多合作故事
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </FadeIn>
      </Section>

      <SiteFooter />
    </div>
  );
}
