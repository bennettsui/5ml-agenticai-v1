'use client';

import { useState } from 'react';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY } from '../components';

const SPEAKERS = [
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%BC%B5%E5%8D%89%E5%90%9B-e1625535281259-500x500.png' },
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%94%A1%E5%B9%B4%E7%8E%A8-500x500.jpg' },
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%8A%89%E6%AC%A3%E7%91%9C%E2%80%94%E7%94%9F%E6%B4%BB%E7%85%A7-e1625535100576-500x500.png' },
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%8C%83%E6%AC%BD%E6%85%A72-e1625812859822-500x500.jpg' },
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E6%AE%B5%E6%99%BA%E6%95%8F%EF%BC%92-500x500.jpg' },
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E6%9E%97%E7%9F%A5%E7%A7%A6-e1625816914518-500x500.jpg' },
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E5%91%A8%E4%B8%96%E9%9B%84-500x500.jpg' },
  { name: '講者姓名', role: '領域／Talk 主題關鍵字', image: 'https://tedxxinyi.com/wp-content/uploads/2017/02/%E8%95%AD%E9%9D%92%E9%99%BD-scaled-e1625535578597-500x500.jpg' },
];

export default function SpeakersPage() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/speakers" heroMode />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://tedxxinyi.com/wp-content/uploads/2021/07/%E6%98%A5%E6%97%A5-e1627632894454.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.3) contrast(1.1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 pt-32">
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
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Red bar on hover */}
                <div
                  className="h-1 rounded-b-xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -mt-1 relative z-10"
                  style={{ backgroundColor: TED_RED }}
                />
                <div className="mt-3">
                  <p className="font-black text-sm mb-0.5" lang="zh-TW">{speaker.name}</p>
                  <p className="text-neutral-400 text-xs" lang="zh-TW">{speaker.role}</p>
                  <span
                    className="text-xs font-bold mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: TED_RED }}
                    lang="zh-TW"
                  >
                    觀看 Talk
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
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
