'use client';

import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_AMBER, WARM_GRAY } from './components';

// ==================== DATA ====================

const SPEAKERS = [
  { name: '張卉君', role: '自然倡議者／黑潮海洋文教基金會', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%BC%B5%E5%8D%89%E5%90%9B-e1625535281259-500x500.png' },
  { name: '蔡年玨', role: '跨域創作者', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%94%A1%E5%B9%B4%E7%8E%A8-500x500.jpg' },
  { name: '劉欣瑜', role: '國際模特兒', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%8A%89%E6%AC%A3%E7%91%9C%E2%80%94%E7%94%9F%E6%B4%BB%E7%85%A7-e1625535100576-500x500.png' },
  { name: '范欽慧', role: '野地錄音師', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%8C%83%E6%AC%BD%E6%85%A72-e1625812859822-500x500.jpg' },
  { name: '段智敏', role: '國際溜溜球表演者／太陽馬戲團', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E6%AE%B5%E6%99%BA%E6%95%8F%EF%BC%92-500x500.jpg' },
  { name: '林知秦', role: '未來媽媽戲劇監製', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E6%9E%97%E7%9F%A5%E7%A7%A6-e1625816914518-500x500.jpg' },
  { name: '周世雄', role: '當代藝術家', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%91%A8%E4%B8%96%E9%9B%84-500x500.jpg' },
  { name: '蕭青陽', role: '唱片設計師／葛萊美獎入圍', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%95%AD%E9%9D%92%E9%99%BD-scaled-e1625535578597-500x500.jpg' },
];

const BLOG_POSTS = [
  {
    title: '策展筆記｜AI 模組化的未來，真正不能被複製的，是人的感知與信念',
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
    title: 'Zoom 如何置換個人虛擬背景',
    date: '2021-08-12',
    excerpt: '一個疫情下的小技術指南，\n也是我們思考『螢幕另一端』怎麼保持專業與真實感的小練習。',
    image: null,
  },
];

const PARTNER_LOGOS = [
  { src: 'https://tedxxinyi.com/wp-content/uploads/2021/07/1MORE-e1627275745256.png', name: '1MORE 萬魔耳機' },
  { src: 'https://tedxxinyi.com/wp-content/uploads/2021/07/cofit-e1626948574733.png', name: 'Cofit' },
  { src: 'https://tedxxinyi.com/wp-content/uploads/2021/07/tissue-150x150.png', name: 'tissue' },
  { src: 'https://tedxxinyi.com/wp-content/uploads/2021/07/%E7%BE%8E%E5%AD%B8-e1626949204652.png', name: '美學' },
  { src: 'https://tedxxinyi.com/wp-content/uploads/2021/07/one-ten%E5%9C%93%E5%BD%A2logo-150x150.jpg', name: 'One Ten 食分之一' },
  { src: 'https://tedxxinyi.com/wp-content/uploads/2021/07/%E9%AD%9A.png', name: '全興資源再生' },
  { src: 'https://tedxxinyi.com/wp-content/uploads/2021/07/%E6%9D%B1%E5%90%B3.png', name: '東吳大學' },
];

const ENTRY_CARDS = [
  {
    title: '關於 TEDxXinyi',
    description: '台北第一個以都會生活圈為核心的在地 TEDx 團隊。\n#Community #Relevancy #Evolution',
    button: '走進故事',
    href: '/vibe-demo/tedx-xinyi/about',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/08/S__45482024.jpg',
    accent: TED_RED,
  },
  {
    title: '年度大會舞台永續設計',
    description: '舞台不只是背景，而是一種對未來的態度。\n我們實驗再製、3D 列印與可回收材質，讓每一屆的舞台都能留下新的可能。',
    button: '看我們怎麼做',
    href: '/vibe-demo/tedx-xinyi/sustainability',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/08/%E8%9E%A2%E5%B9%95%E5%BF%AB%E7%85%A7-2021-08-24-%E4%B8%8B%E5%8D%882.37.26.png',
    accent: WARM_AMBER,
  },
  {
    title: '社群與小型聚會',
    description: '除了年度大會，我們也透過 TED Circles、工作坊與城市散步，\n讓想法在一年中的不同時刻持續發生。',
    button: '加入社群',
    href: '/vibe-demo/tedx-xinyi/community',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/logo_white_%E5%B7%A5%E4%BD%9C%E5%8D%80%E5%9F%9F-1-e1625644086441.png',
    accent: '#10B981',
  },
];

// ==================== PAGE COMPONENT ====================

export default function TEDxXinyiHome() {
  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi" heroMode />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-neutral-900">
        {/* nanobanana-generated background with CSS fallback */}
        <div className="absolute inset-0">
          <img
            src="/tedx-xinyi/hero-home.png"
            alt=""
            className="w-full h-full object-cover opacity-0 transition-opacity duration-700"
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.55'; }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Warm gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-neutral-900/40 to-neutral-900" />
        </div>

        {/* Fallback: warm amber glow when no image */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-amber-950/30" style={{ zIndex: 0 }} />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 pb-16">
          <FadeIn>
            <p className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-white/50 mb-6">
              TEDxXinyi 2026 · NEXT SALON
            </p>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-4 text-white" lang="zh-TW">
              We are Becoming
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-xl sm:text-2xl md:text-3xl font-black mb-6" style={{ color: WARM_AMBER }} lang="zh-TW">
              AI趨勢沙龍
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <p className="text-white/60 text-sm sm:text-base mb-2 font-medium" lang="zh-TW">
              2026 / 3 / 31　台北藝術表演中心 藍盒子
            </p>
          </FadeIn>

          <FadeIn delay={380}>
            <p className="text-white/45 text-sm sm:text-base leading-relaxed mb-12 max-w-2xl mx-auto" lang="zh-TW">
              探究我們跟 AI 的距離，我們跟自己的距離。
            </p>
          </FadeIn>

          <FadeIn delay={500}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/vibe-demo/tedx-xinyi/salon"
                className="px-8 py-3.5 text-white font-black text-sm tracking-wide rounded-full transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: TED_RED }}
                lang="zh-TW"
              >
                認識 We are Becoming salon
              </Link>
              <Link
                href="/vibe-demo/tedx-xinyi/about"
                className="px-8 py-3.5 text-white/80 hover:text-white font-bold text-sm tracking-wide rounded-full border-2 border-white/30 hover:border-white/70 transition-all"
                lang="zh-TW"
              >
                認識 TEDxXinyi
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ==================== NEXT EVENT STRIP ==================== */}
      <section className="relative bg-neutral-900 text-white py-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex-1">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/50 mb-1">NEXT EVENT</p>
            <h2 className="text-lg sm:text-xl font-black" lang="zh-TW">
              TEDxXinyi We are Becoming – AI趨勢沙龍
            </h2>
            <p className="text-white/60 text-sm mt-1" lang="zh-TW">
              2026/3/31｜台北藝術表演中心 藍盒子
            </p>
            <p className="text-white/40 text-xs mt-1" lang="zh-TW">
              探究我們跟 AI 的距離，我們跟自己的距離。
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/vibe-demo/tedx-xinyi/salon"
              className="px-5 py-2.5 text-sm font-black rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: TED_RED }}
              lang="zh-TW"
            >
              認識 We are Becoming salon
            </Link>
            <button
              className="px-5 py-2.5 text-sm font-bold rounded-full border border-white/30 text-white/70 hover:text-white hover:border-white/60 transition-all"
              lang="zh-TW"
            >
              取得最新消息
            </button>
          </div>
        </div>
      </section>

      {/* ==================== THREE ENTRY CARDS ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>EXPLORE</SectionLabel>
          <p className="text-neutral-600 text-base sm:text-lg mb-12" lang="zh-TW">
            從三個入口，走進 TEDxXinyi 的宇宙。
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ENTRY_CARDS.map((card, i) => (
            <FadeIn key={card.title} delay={i * 120}>
              <Link
                href={card.href}
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-neutral-100"
              >
                <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                  <img
                    src={card.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={i === 2 ? { objectFit: 'contain', padding: '1.5rem', background: '#1a1a1a' } : undefined}
                  />
                </div>
                <div className="h-1" style={{ backgroundColor: card.accent }} />
                <div className="p-6">
                  <h3 className="text-lg font-black mb-2" lang="zh-TW">{card.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mb-4 whitespace-pre-line" lang="zh-TW">
                    {card.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors"
                    style={{ color: card.accent }}
                    lang="zh-TW"
                  >
                    {card.button}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== WE ARE BECOMING TEASER ==================== */}
      <Section bg="white" id="we-are-becoming-teaser">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <FadeIn>
              <SectionLabel>UPCOMING SALON</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-black mb-6" lang="zh-TW">
                We are Becoming – AI趨勢沙龍
              </h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-6" lang="zh-TW">
                未來不是某一天突然到來，我們早已沈浸其中。<br />
                在 AI 世代，我們被迫，也被邀請，不斷更新自我。<br />
                這場沙龍，從溝通、記憶、學習、願景、想像力到行動力，<br />
                邀請你一起練習『We are Becoming』。
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-sm font-bold text-neutral-400 tracking-wide mb-8" lang="en">
                Communication．Memory．Learning．Vision．Imagination．Action
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <Link
                href="/vibe-demo/tedx-xinyi/salon"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: TED_RED }}
                lang="zh-TW"
              >
                查看活動詳情
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </FadeIn>
          </div>
          <FadeIn delay={200}>
            <div className="aspect-video rounded-xl overflow-hidden bg-neutral-100">
              <img
                src="/tedx-xinyi/salon-teaser.png"
                alt=""
                className="w-full h-full object-cover opacity-0 transition-opacity duration-700"
                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #1e3a5f 50%, #1a1a1a 100%)';
                    el.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><span style="color:rgba(255,255,255,0.15);font-size:6rem;font-weight:900">x</span></div>';
                  }
                }}
              />
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== SPEAKERS — LINEUP STYLE ==================== */}
      <Section bg="white">
        <FadeIn>
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <SectionLabel>LINEUP</SectionLabel>
              <h2 className="text-3xl md:text-5xl font-black" lang="zh-TW">講者陣容</h2>
            </div>
            <Link
              href="/vibe-demo/tedx-xinyi/speakers"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all hover:shadow-md"
              style={{ backgroundColor: TED_RED, color: 'white' }}
              lang="zh-TW"
            >
              看所有講者與 Talks
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl" lang="zh-TW">
            這些是曾經站上 TEDxXinyi 舞台的一小部分。<br />
            更多來自不同領域的講者，正在形塑我們對信義、對未來的想像。
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {SPEAKERS.map((speaker, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="group relative cursor-pointer">
                <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white font-black text-sm" lang="zh-TW">{speaker.name}</p>
                  <p className="text-white/60 text-xs" lang="zh-TW">{speaker.role}</p>
                </div>
                <div className="mt-2.5">
                  <p className="font-bold text-sm" lang="zh-TW">{speaker.name}</p>
                  <p className="text-neutral-400 text-xs" lang="zh-TW">{speaker.role}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== LATEST BLOG ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>BLOG</SectionLabel>
          <h2 className="text-3xl md:text-5xl font-black mb-12" lang="zh-TW">最新文章</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {BLOG_POSTS.map((post, i) => (
            <FadeIn key={post.title} delay={i * 100}>
              <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full flex flex-col border border-neutral-100">
                {post.image ? (
                  <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
                    <img
                      src={post.image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] flex items-center justify-center" style={{ backgroundColor: WARM_GRAY }}>
                    <span className="text-neutral-300 text-5xl font-black">T</span>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-neutral-400 text-xs mb-2 font-medium">{post.date}</p>
                  <h3 className="text-base font-black mb-2 group-hover:text-neutral-700 transition-colors" lang="zh-TW">
                    {post.title}
                  </h3>
                  <p className="text-neutral-500 text-sm leading-relaxed flex-1 whitespace-pre-line" lang="zh-TW">
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
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold border-2 border-neutral-300 hover:border-neutral-900 rounded-full text-neutral-600 hover:text-neutral-900 transition-all"
              lang="zh-TW"
            >
              閱讀所有文章
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== PARTNERS ==================== */}
      <Section bg="white">
        <FadeIn>
          <SectionLabel>PARTNERS</SectionLabel>
          <h2 className="text-3xl md:text-5xl font-black mb-3" lang="zh-TW">合作夥伴</h2>
          <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-12 max-w-xl" lang="zh-TW">
            這些品牌、組織與空間，和我們一起在信義嘗試新的可能。
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-12">
            {PARTNER_LOGOS.map((logo, i) => (
              <div
                key={i}
                className="w-20 h-20 flex items-center justify-center grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
                title={logo.name}
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn>
          <div className="text-center">
            <Link
              href="/vibe-demo/tedx-xinyi/sustainability"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold border-2 border-neutral-300 hover:border-neutral-900 rounded-full text-neutral-600 hover:text-neutral-900 transition-all"
              lang="zh-TW"
            >
              看更多合作故事
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== RED CTA BAND ==================== */}
      <section className="py-16 text-white text-center" style={{ backgroundColor: TED_RED }}>
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn>
            <p className="text-3xl md:text-4xl font-black mb-2" lang="zh-TW">
              樂觀不是名詞，而是動詞。
            </p>
            <p className="text-white/70 text-sm mb-8" lang="en">
              TEDxXinyi 2026
            </p>
            <button className="px-8 py-3.5 bg-white font-black text-sm rounded-full transition-all hover:scale-105 hover:shadow-lg" style={{ color: TED_RED }}>
              關注本年度大會
            </button>
          </FadeIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
