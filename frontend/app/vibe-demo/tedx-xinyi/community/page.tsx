'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY } from '../components';

// CDN URL for ted-circles representative image — updated by sync-cdn
const TED_CIRCLES_CDN = '';

// ── Orbital wheel constants ─────────────────────────────────────────────────
const WHEEL_SLOTS = 7;   // visible nodes on drum (must be odd — centre = active)
const WHEEL_D     = 68;  // circle node diameter px
const WHEEL_STEP  = 82;  // vertical pitch between slot centres px
const WHEEL_ROT   = 13;  // rotateX degrees per step (drum curvature)
const WHEEL_W     = 140; // total wheel column width px
// Vanishing point offset: 2× column width puts VP into the gallery area
// so the drum "opens" toward the right panel
const WHEEL_VP_X  = WHEEL_W * 2;
// Container height covers all visible slots + room for arrows
const WHEEL_H     = (WHEEL_SLOTS - 1) * WHEEL_STEP + WHEEL_D + 80;

export default function CommunityPage() {
  const [circlePhotos, setCirclePhotos] = useState<{ key: string; src: string; alt: string }[]>([]);
  const [activeIdx, setActiveIdx]       = useState(0);

  const prev = useCallback(() => setActiveIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setActiveIdx(i => Math.min(circlePhotos.length - 1, i + 1)),
    [circlePhotos.length],
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  useEffect(() => {
    fetch('/api/tedx-xinyi/circles')
      .then(r => r.json())
      .then(d => setCirclePhotos(d.photos || []))
      .catch(() => {});
  }, []);

  const halfSlots = Math.floor(WHEEL_SLOTS / 2);

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

        {/* ══════════════════════════════════════════════════════════════════
            ORBITAL WHEEL GALLERY
            Desktop: [wheel drum left] | [main photo + thumb strip right]
            Mobile:  [main photo] + [circular dock below]
        ══════════════════════════════════════════════════════════════════ */}
        {circlePhotos.length > 0 && (
          <FadeIn delay={100}>
            <div
              className="select-none rounded-2xl overflow-hidden"
              aria-label="TED Circles photo gallery"
              style={{ background: '#0c0c0c' }}
            >

              {/* ── DESKTOP ───────────────────────────────────────────────── */}
              <div className="hidden lg:flex" style={{ minHeight: WHEEL_H }}>

                {/* ┌──────────────────────────────────────┐
                    │  WHEEL DRUM (left column)            │
                    └──────────────────────────────────────┘ */}
                <div
                  className="flex-shrink-0 relative"
                  style={{
                    width: WHEEL_W,
                    perspective: '900px',
                    perspectiveOrigin: `${WHEEL_VP_X}px 50%`,
                    minHeight: WHEEL_H,
                  }}
                >
                  {/* Spine — vertical gradient line through all nodes */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 1,
                      top: 40,
                      bottom: 40,
                      background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent)',
                    }}
                  />

                  {/* Spine node dots — appear at each drum slot position */}
                  {Array.from({ length: WHEEL_SLOTS }, (_, slot) => {
                    const offset = slot - halfSlots;
                    const idx    = activeIdx + offset;
                    if (idx < 0 || idx >= circlePhotos.length) return null;
                    const isActive = offset === 0;
                    return (
                      <div
                        key={`spine-${slot}`}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: isActive ? 4 : 2,
                          height: isActive ? 4 : 2,
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, calc(-50% + ${offset * WHEEL_STEP}px))`,
                          backgroundColor: isActive ? TED_RED : 'rgba(255,255,255,0.18)',
                          transition: 'background-color 300ms ease, width 300ms ease, height 300ms ease',
                          zIndex: 0,
                        }}
                      />
                    );
                  })}

                  {/* Wheel items — circular thumbnails on the drum */}
                  {Array.from({ length: WHEEL_SLOTS }, (_, slot) => {
                    const offset   = slot - halfSlots;  // –3 … +3
                    const idx      = activeIdx + offset;
                    if (idx < 0 || idx >= circlePhotos.length) return null;

                    const photo    = circlePhotos[idx];
                    const absOff   = Math.abs(offset);
                    const isActive = offset === 0;

                    // Depth curve: centre=1.0, ±1=0.83, ±2=0.70, ±3=0.56
                    const scale    = Math.max(0.50, 1 - absOff * 0.163);
                    // rotateX tilts nodes into the drum
                    const rotX     = offset * -WHEEL_ROT;
                    // Opacity fade toward edges
                    const opac     = Math.max(0.16, 1 - absOff * 0.24);
                    // Brightness + desaturation for non-active
                    const bright   = isActive ? 1 : Math.max(0.28, 0.85 - absOff * 0.18);

                    return (
                      <button
                        key={photo.key}
                        onClick={() => setActiveIdx(idx)}
                        aria-label={`View photo ${idx + 1}`}
                        className="absolute left-1/2 top-1/2 rounded-full overflow-hidden"
                        style={{
                          width:  WHEEL_D,
                          height: WHEEL_D,
                          transform: `translate(-50%, calc(-50% + ${offset * WHEEL_STEP}px)) rotateX(${rotX}deg) scale(${scale})`,
                          opacity: opac,
                          zIndex:  WHEEL_SLOTS - absOff + 1,
                          // Active: TED_RED double ring; inactive: subtle shadow
                          boxShadow: isActive
                            ? `0 0 0 2px #0c0c0c, 0 0 0 4px ${TED_RED}, 0 8px 32px rgba(0,0,0,0.7)`
                            : '0 2px 10px rgba(0,0,0,0.5)',
                          transition: [
                            'transform 430ms cubic-bezier(0.34, 1.08, 0.64, 1)',
                            'opacity 390ms ease',
                            'box-shadow 280ms ease',
                          ].join(', '),
                          cursor: isActive ? 'default' : 'pointer',
                        }}
                      >
                        <img
                          src={photo.src}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                          style={{
                            filter: isActive
                              ? 'none'
                              : `brightness(${bright}) saturate(0.70)`,
                            transition: 'filter 430ms ease',
                          }}
                        />
                      </button>
                    );
                  })}

                  {/* Fade masks — top and bottom hide the drum edge */}
                  <div
                    className="absolute inset-x-0 top-0 pointer-events-none"
                    style={{ height: 56, background: 'linear-gradient(to bottom, #0c0c0c 40%, transparent)', zIndex: WHEEL_SLOTS + 2 }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none"
                    style={{ height: 56, background: 'linear-gradient(to top, #0c0c0c 40%, transparent)', zIndex: WHEEL_SLOTS + 2 }}
                  />

                  {/* Up arrow */}
                  <button
                    onClick={prev}
                    disabled={activeIdx === 0}
                    className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-0"
                    style={{ color: 'rgba(255,255,255,0.38)', zIndex: WHEEL_SLOTS + 3 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
                    aria-label="Previous photo"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>

                  {/* Down arrow */}
                  <button
                    onClick={next}
                    disabled={activeIdx === circlePhotos.length - 1}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-0"
                    style={{ color: 'rgba(255,255,255,0.38)', zIndex: WHEEL_SLOTS + 3 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
                    aria-label="Next photo"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>

                {/* Divider line between wheel and gallery */}
                <div
                  className="flex-shrink-0 self-stretch"
                  style={{
                    width: 1,
                    margin: '32px 0',
                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent)',
                  }}
                />

                {/* ┌──────────────────────────────────────┐
                    │  GALLERY STAGE (right panel)          │
                    └──────────────────────────────────────┘ */}
                <div className="flex-1 flex flex-col gap-3 p-5 min-w-0 justify-center">

                  {/* Main photo — cinematic 16:10 */}
                  <div
                    className="relative rounded-xl overflow-hidden bg-neutral-900 w-full"
                    style={{ aspectRatio: '16 / 10' }}
                  >
                    {/* Crossfade stack */}
                    {circlePhotos.map((photo, i) => (
                      <img
                        key={photo.key}
                        src={photo.src}
                        alt={photo.alt || `TED Circles moment ${i + 1}`}
                        loading={Math.abs(i - activeIdx) <= 2 ? 'eager' : 'lazy'}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          opacity: i === activeIdx ? 1 : 0,
                          transition: 'opacity 500ms ease',
                          pointerEvents: 'none',
                        }}
                      />
                    ))}

                    {/* Bottom gradient */}
                    <div
                      className="absolute inset-x-0 bottom-0 pointer-events-none"
                      style={{ height: '38%', background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 100%)' }}
                    />

                    {/* Photo counter badge */}
                    <div className="absolute bottom-3.5 right-4 pointer-events-none">
                      <span className="text-white/40 text-[11px] font-mono tabular-nums tracking-widest">
                        {String(activeIdx + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(circlePhotos.length).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail strip — all photos, active highlighted */}
                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    {circlePhotos.map((photo, i) => {
                      const isA  = i === activeIdx;
                      const dist = Math.abs(i - activeIdx);
                      return (
                        <button
                          key={photo.key}
                          onClick={() => setActiveIdx(i)}
                          aria-label={`Go to photo ${i + 1}`}
                          className="flex-shrink-0 rounded-lg overflow-hidden"
                          style={{
                            width: 52,
                            height: 38,
                            opacity: isA ? 1 : Math.max(0.28, 1 - dist * 0.11),
                            transform: `scale(${isA ? 1.07 : 1})`,
                            boxShadow: isA
                              ? `0 0 0 2px ${TED_RED}`
                              : '0 0 0 1px rgba(255,255,255,0.06)',
                            transition: 'opacity 300ms ease, transform 300ms ease, box-shadow 300ms ease',
                          }}
                        >
                          <img
                            src={photo.src}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                            style={{
                              filter: isA ? 'none' : 'brightness(0.52) saturate(0.62)',
                              transition: 'filter 300ms ease',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>

                </div>
              </div>
              {/* end DESKTOP */}

              {/* ── MOBILE ────────────────────────────────────────────────── */}
              <div className="lg:hidden flex flex-col gap-3 p-4">

                {/* Main photo with swipe arrows */}
                <div
                  className="relative rounded-xl overflow-hidden bg-neutral-900"
                  style={{ aspectRatio: '4/3' }}
                >
                  {circlePhotos.map((photo, i) => (
                    <img
                      key={photo.key}
                      src={photo.src}
                      alt={photo.alt || `TED Circles moment ${i + 1}`}
                      loading={Math.abs(i - activeIdx) <= 1 ? 'eager' : 'lazy'}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: i === activeIdx ? 1 : 0, transition: 'opacity 500ms ease', pointerEvents: 'none' }}
                    />
                  ))}
                  <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none"
                    style={{ height: '35%', background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
                  />
                  <div className="absolute bottom-3 right-3.5 pointer-events-none">
                    <span className="text-white/40 text-[11px] font-mono tabular-nums">
                      {activeIdx + 1}&thinsp;/&thinsp;{circlePhotos.length}
                    </span>
                  </div>
                  <button
                    onClick={prev}
                    disabled={activeIdx === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-20"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    aria-label="Previous photo"
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <button
                    onClick={next}
                    disabled={activeIdx === circlePhotos.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-20"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    aria-label="Next photo"
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>

                {/* Circular dock — horizontal wrap of circle thumbnails */}
                <div className="flex gap-2.5 justify-center flex-wrap py-1">
                  {circlePhotos.map((photo, i) => {
                    const isA  = i === activeIdx;
                    const dist = Math.abs(i - activeIdx);
                    return (
                      <button
                        key={photo.key}
                        onClick={() => setActiveIdx(i)}
                        aria-label={`Go to photo ${i + 1}`}
                        className="rounded-full overflow-hidden flex-shrink-0"
                        style={{
                          width: 42,
                          height: 42,
                          opacity: isA ? 1 : Math.max(0.32, 1 - dist * 0.12),
                          transform: `scale(${isA ? 1.15 : 1})`,
                          boxShadow: isA
                            ? `0 0 0 1.5px #0c0c0c, 0 0 0 3.5px ${TED_RED}`
                            : '0 0 0 1px rgba(255,255,255,0.09)',
                          transition: 'all 300ms cubic-bezier(0.34, 1.1, 0.64, 1)',
                        }}
                      >
                        <img
                          src={photo.src}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                          style={{
                            filter: isA ? 'none' : 'brightness(0.48) saturate(0.58)',
                            transition: 'filter 300ms ease',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

              </div>
              {/* end MOBILE */}

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
