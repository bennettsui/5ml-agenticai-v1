'use client';

import { useState } from 'react';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY } from '../components';

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

export default function SpeakersPage() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/speakers" heroMode />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden bg-neutral-900">
        <img
          src="/tedx-xinyi/hero-speakers.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.7'; }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/30 via-neutral-900/40 to-white" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 pt-32" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
          <FadeIn>
            <SectionLabel dark>SPEAKERS &amp; TALKS</SectionLabel>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white" lang="en">
              Speakers<br />& Talks
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-2xl mt-6" lang="zh-TW">
              從廚師到設計師，從教育工作者到創業者，<br />
              這些在台北信義分享想法的人，讓我們看見不同版本的未來。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== SPEAKER GRID — POSTER LINEUP ==================== */}
      <Section bg="white">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {SPEAKERS.map((speaker, i) => (
            <FadeIn key={i} delay={i * 50}>
              <div className="group relative">
                <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                </div>
                <div
                  className="h-1 rounded-b-xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -mt-1 relative z-10"
                  style={{ backgroundColor: TED_RED }}
                />
                <div className="mt-3">
                  <p className="font-black text-sm mb-0.5" lang="zh-TW">{speaker.name}</p>
                  <p className="text-neutral-400 text-xs" lang="zh-TW">{speaker.role}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== FEATURED TALK ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>FEATURED</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-black mb-4" lang="en">
            Sustainability Ideas development<br className="hidden sm:block" /> for TEDxXinyi annual event
          </h2>
          <p className="text-neutral-500 text-base leading-relaxed mb-8 max-w-2xl" lang="zh-TW">
            這支影片記錄了，TEDxXinyi 如何從一個問題出發，<br />
            一步步把『永續舞台』變成現實。
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="relative aspect-video max-w-4xl rounded-xl overflow-hidden bg-neutral-200 shadow-lg">
            {!videoLoaded && (
              <button
                onClick={() => setVideoLoaded(true)}
                className="absolute inset-0 flex items-center justify-center group z-10"
                aria-label="Play video"
              >
                <img
                  src="https://img.youtube.com/vi/wvv9lGRh6RI/maxresdefault.jpg"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'brightness(0.6)' }}
                />
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl"
                  style={{ backgroundColor: TED_RED }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
            {videoLoaded && (
              <iframe
                src="https://www.youtube.com/embed/wvv9lGRh6RI?autoplay=1"
                title="Sustainability Ideas development for TEDxXinyi annual event"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>
        </FadeIn>
      </Section>

      <SiteFooter />
    </div>
  );
}
