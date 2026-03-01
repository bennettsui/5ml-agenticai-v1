'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY } from '../components';

// CDN URL for ted-circles representative image — updated by sync-cdn
const TED_CIRCLES_CDN = '';

export default function CommunityPage() {
  const [circlePhotos, setCirclePhotos] = useState<{ key: string; src: string; alt: string }[]>([]);

  useEffect(() => {
    fetch('/api/tedx-xinyi/circles')
      .then(r => r.json())
      .then(d => setCirclePhotos(d.photos || []))
      .catch(() => {});
  }, []);

  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/community" heroMode />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden bg-neutral-900">
        <img
          src="/tedx-xinyi/hero-community.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.7'; }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/30 via-neutral-900/40 to-white" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 pt-32" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white">
              <span lang="en">Community </span>
              <span lang="zh-TW">社群</span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl mt-4" lang="zh-TW">
              TEDxXinyi 的力量，來自一群持續在信義聚集、對話、實驗的人。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== CURRENT SALON ==================== */}
      <Section bg="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <FadeIn>
              <SectionLabel>CURRENT SALON</SectionLabel>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6" lang="zh-TW">
                最新 Salon｜<span className="font-handwriting text-3xl sm:text-4xl md:text-5xl">We are Becoming</span> – AI時代趨勢沙龍
              </h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-8" lang="zh-TW">
                Community 對我們來說，不只是社群帳號或一年一次的活動，<br />
                而是每一場可以真實見面的沙龍。<br />
                2026Q1，我們邀請你來到北藝藍盒子，一起圍繞 AI 與人性展開一整天的實驗。
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <Link
                href="/vibe-demo/tedx-xinyi/salon"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: TED_RED }}
                lang="zh-TW"
              >
                看完整活動介紹
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </FadeIn>
          </div>
          <FadeIn delay={200}>
            <div className="aspect-video rounded-xl overflow-hidden bg-neutral-100">
              <img
                src="/tedx-xinyi/salon-teaser.webp"
                alt=""
                className="w-full h-full object-cover opacity-0 transition-opacity duration-700"
                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #1e3a5f 50%, #1a1a1a 100%)';
                    el.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><span style="color:rgba(255,255,255,0.15);font-size:4rem;font-weight:900">WaB</span></div>';
                  }
                }}
              />
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== TED CIRCLES ==================== */}
      <Section bg="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <FadeIn>
              <SectionLabel>CIRCLES</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-black mb-6" lang="en">TED Circles</h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9]" lang="zh-TW">
                TED Circles 是 TED 所發起的小型討論聚會。
                在 TEDxXinyi，我們會挑選一支 TED 或 TEDx Talk，
                和一小群人一起看、一起聊，
                試著把大命題拉回日常的選擇。
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={200}>
            <div className="aspect-video rounded-2xl overflow-hidden bg-neutral-950 relative flex items-center justify-center">
              {/* Dark fallback — bold red circle */}
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                <div className="w-32 h-32 rounded-full" style={{ backgroundColor: TED_RED, opacity: 0.85 }} />
              </div>
              <img
                src={TED_CIRCLES_CDN || '/tedx-xinyi/ted-circles.webp'}
                alt="TED Circles — iconic red circle carpet gathering"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </FadeIn>
        </div>

        {/* TED Circles Photo Gallery — masonry, natural proportions */}
        {circlePhotos.length > 0 && (
          <FadeIn delay={100}>
            <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
              {circlePhotos.map((photo, i) => (
                <div key={photo.key} className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-neutral-100 group">
                  <img
                    src={photo.src}
                    alt={photo.alt || `TED Circles moment ${i + 1}`}
                    loading="lazy"
                    className="w-full h-auto block opacity-0 transition-[opacity,filter] duration-300 group-hover:brightness-90"
                    onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                    onError={(e) => { (e.target as HTMLImageElement).closest('div')!.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </FadeIn>
        )}
      </Section>

      {/* ==================== VOLUNTEER CTA ==================== */}
      <section className="py-20 md:py-28 text-white" style={{ backgroundColor: TED_RED }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-black mb-6" lang="zh-TW">加入我們</h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/85 text-base sm:text-lg leading-[1.9] mb-8" lang="zh-TW">
              如果你喜歡策展、舞台、內容、企劃或單純喜歡把人聚在一起，
              歡迎加入 TEDxXinyi 的志工團隊。
              我們正在尋找願意一起發想、一起搬椅子、一起收場的夥伴。
            </p>
          </FadeIn>
          <FadeIn delay={250}>
            <a
              href="https://www.instagram.com/tedxxinyi/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-white font-black text-sm rounded-full transition-all hover:scale-105 hover:shadow-lg inline-block"
              style={{ color: TED_RED }}
              lang="zh-TW"
            >
              填寫志工表單
            </a>
          </FadeIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
