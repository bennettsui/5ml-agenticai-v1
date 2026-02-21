'use client';

import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY, WARM_AMBER } from '../components';

const SPEAKER_DOMAINS = [
  { domain: 'AI 趨勢', sub: '科技與演算法的邊界' },
  { domain: '情商與人性', sub: '在機器時代，成為更好的人' },
  { domain: '法律與社會', sub: 'AI 時代的專注力與公共空間' },
  { domain: '大腦科學', sub: 'ChatGPT 之後，人類怎麼學習' },
  { domain: '海洋生態', sub: '碳排、環境與未來世代' },
  { domain: '說故事力量', sub: '創意與敘事如何陪我們往前走' },
  { domain: '飲食文化', sub: '在 AI 時代，讓一杯酒更有意識' },
];

const VALUE_BULLETS = [
  {
    heading: '把 AI 拉回人類感受與選擇',
    text: '從『我們跟 AI 的距離』談起，延伸到專注力、人性、社會與未來工作，\n問的是：在演算法時代，我們還能怎麼做決定？',
  },
  {
    heading: '學會在巨變中持續學習',
    text: '以大腦終生學習為靈感，從溝通、記憶到行動，\n把『趨勢』變成每天都能練習的小步驟。',
  },
  {
    heading: '在一個真實的城市舞台上對話',
    text: '我們選擇北藝藍盒子，而不是飯店會議室。\n讓 AI 的討論回到公共文化場域，放在城市與社會的脈動裡。',
  },
];

const FLOW_SEGMENTS = [
  {
    heading: '上午｜奇點世界 – TEDxXinyi Talks',
    text: '四位講者從 AI、專注力、情緒與人性出發，\n拉出 AI 時代的人文光譜，幫我們重新看見『人』的邊界。',
  },
  {
    heading: '中午到下午｜Immersive Learning & Galaxy Networking',
    text: 'AI 咖啡、趨勢工作坊、Open Mic、Book Club、未來市集與不同 Intelligence 區域，\n讓你用身體走路、用手寫字、用對話彼此碰撞新的問題。',
  },
  {
    heading: '下午｜TED Adventure AI 趨勢報告書座談',
    text: '一場把全球案例、在地實驗與產業對話放在同一張桌子的座談，\n從趨勢報告、學習、國際策展人案例、AI 敘事到台灣故事，\n幫助你把『看展／聽 talk』變成下一步可以採取的行動。',
  },
];

export default function SalonPage() {
  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/salon" heroMode />

      {/* ==================== HERO ==================== */}
      <section id="salon-we-are-becoming-ai" className="relative min-h-[60vh] flex items-end overflow-hidden bg-neutral-900">
        <img
          src="/tedx-xinyi/salon-hero.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.7'; }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/30 via-neutral-900/40 to-white" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 pt-32" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
          <FadeIn>
            <SectionLabel dark>SALON</SectionLabel>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4" lang="zh-TW">
              We are Becoming – AI趨勢沙龍
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/90 text-xl sm:text-2xl font-black leading-relaxed max-w-2xl" lang="zh-TW">
              你和 AI 的距離，<br />決定你和自己的樣子。
            </p>
          </FadeIn>
          <FadeIn delay={350}>
            <p className="text-white/50 text-xs tracking-[0.2em] mt-4" lang="zh-TW">
              #2026首波沙龍論壇　#在AI時代學會看懂趨勢
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== KEY VISUAL / POSTER ==================== */}
      <section className="bg-neutral-950 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">

              {/* Poster card */}
              <div className="w-full max-w-[300px] md:max-w-[340px] mx-auto flex-shrink-0">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '4/5' }}>
                  {/* nanobanana background */}
                  <img
                    src="/tedx-xinyi/poster-dark.png"
                    alt="We are Becoming — TEDxXinyi 2026 key visual poster"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
                    onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {/* Gradient fallback + always-on darken at bottom for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0b1628] via-[#0f1a3a] to-black" />
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(79,70,229,0.18) 0%, transparent 65%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Text overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5 z-10">
                    {/* Top: logo */}
                    <div className="text-center">
                      <span className="text-white/60 text-xs font-light tracking-[0.2em] uppercase">TEDx</span>
                      <span className="font-black text-base tracking-tight ml-0.5" style={{ color: TED_RED }}>Xinyi</span>
                    </div>

                    {/* Middle: main title + subtitle */}
                    <div className="text-center" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
                      <p className="text-white font-black text-[1.6rem] leading-tight tracking-tight mb-4">
                        WE ARE<br />BECOMING
                      </p>
                      <p className="text-white/95 font-black text-base leading-snug" lang="zh-TW">
                        你和 AI 的距離
                      </p>
                      <p className="text-white/95 font-black text-base leading-snug mb-3" lang="zh-TW">
                        決定你和自己的樣子
                      </p>
                      <p className="text-white/35 text-[10px] tracking-wider" lang="zh-TW">
                        #2026首波沙龍論壇　#在AI時代學會看懂趨勢
                      </p>
                    </div>

                    {/* Bottom: date + closing */}
                    <div className="text-center">
                      <p className="font-black text-sm mb-0.5" style={{ color: WARM_AMBER }} lang="zh-TW">
                        2026 / 3 / 31（二）
                      </p>
                      <p className="text-white/55 text-xs mb-3" lang="zh-TW">
                        台北藝術表演中心．藍盒子
                      </p>
                      <p className="text-white/30 text-[10px] leading-relaxed" lang="zh-TW">
                        在 TEDx Xinyi，一起面對我們與 AI 的未來。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-white text-center md:text-left">
                <SectionLabel dark>KEY VISUAL 2026</SectionLabel>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 text-white leading-tight" lang="zh-TW">
                  站在星系邊緣，<br />看見自己。
                </h2>
                <p className="text-white/55 text-base leading-[1.9] mb-6" lang="zh-TW">
                  這張主視覺試著呈現一個古老的感受：<br />
                  站在宇宙面前，人有多小，但也多完整。<br />
                  AI 就像那片星系——龐大、沉默、充滿資訊，<br />
                  而我們，就在邊緣，決定要走多近。
                </p>
                <p className="text-white/30 text-sm leading-relaxed" lang="zh-TW">
                  你和 AI 的距離，是技術問題，也是人的問題。<br />
                  TEDxXinyi 2026，從這裡出發。
                </p>
              </div>

            </div>
          </FadeIn>
        </div>
      </section>

      {/* ==================== BLOCK A — WHAT & WHEN ==================== */}
      <Section bg="white">
        <FadeIn>
          <SectionLabel>EVENT</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-8" lang="zh-TW">
            2026Q1 TEDxXinyi We are Becoming – AI趨勢沙龍
          </h2>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl p-5 border border-neutral-100" style={{ backgroundColor: WARM_GRAY }}>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1" lang="zh-TW">日期</p>
              <p className="font-black text-sm" lang="zh-TW">2026/3/31（二）</p>
            </div>
            <div className="rounded-xl p-5 border border-neutral-100" style={{ backgroundColor: WARM_GRAY }}>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1" lang="zh-TW">時間</p>
              <p className="font-black text-sm" lang="zh-TW">10:00–16:00（白天 Salon + 場外探索），晚間另有延伸聚會</p>
            </div>
            <div className="rounded-xl p-5 border border-neutral-100" style={{ backgroundColor: WARM_GRAY }}>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1" lang="zh-TW">地點</p>
              <p className="font-black text-sm" lang="zh-TW">台北藝術表演中心 藍盒子（Blue Box）</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] max-w-3xl" lang="zh-TW">
            這不是一整天都坐在椅子上的會議，<br />
            而是一個有 TEDx Talks、工作坊、趨勢市集和 networking 的 AI 趨勢實驗場。
          </p>
        </FadeIn>

        <FadeIn delay={300}>
          <div className="mt-10 border-l-4 pl-6" style={{ borderColor: TED_RED }}>
            <p className="text-neutral-900 text-xl sm:text-2xl font-black leading-snug mb-2" lang="zh-TW">
              你和 AI 的距離，<br />決定你和自己的樣子。
            </p>
            <p className="text-neutral-400 text-sm" lang="zh-TW">
              — TEDxXinyi We are Becoming 2026 核心主題
            </p>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== BLOCK B — WHY / VALUE PROPOSITION ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>WHY</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-10" lang="zh-TW">
            為什麼是『We are Becoming』？
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUE_BULLETS.map((bullet, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all h-full">
                <span
                  className="inline-block text-xs font-black px-3 py-1 rounded-full mb-4"
                  style={{ backgroundColor: `${TED_RED}10`, color: TED_RED }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-black mb-3" lang="zh-TW">{bullet.heading}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed whitespace-pre-line" lang="zh-TW">
                  {bullet.text}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== BLOCK C — WHO / SPEAKERS & GALAXY ==================== */}
      <Section bg="white">
        <FadeIn>
          <SectionLabel>WHO</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4" lang="zh-TW">
            誰會在現場？
          </h2>
        </FadeIn>
        <FadeIn delay={100}>
          <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-10 max-w-3xl" lang="zh-TW">
            我們邀請了來自 AI、法律、人文、海洋、故事創作、飲食等不同領域的講者，<br />
            一起打開 AI 與人性、社會、環境之間的各種縫隙。
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-6" lang="zh-TW">
            橫跨領域（講者名單陸續公布）
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {SPEAKER_DOMAINS.map((item, i) => (
            <FadeIn key={i} delay={i * 50}>
              <div className="rounded-xl p-4 border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all h-full" style={{ backgroundColor: WARM_GRAY }}>
                <p className="font-black text-sm mb-1" lang="zh-TW">{item.domain}</p>
                <p className="text-neutral-400 text-xs leading-relaxed" lang="zh-TW">{item.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={200}>
          <p className="text-xs text-neutral-400 mb-10" lang="zh-TW">
            完整講者陣容將於活動前透過電子報與社群陸續公布。
          </p>
        </FadeIn>

        {/* Galaxy section */}
        <FadeIn delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden border border-neutral-100 p-6 md:p-0">
            <div className="md:p-8">
              <p className="text-neutral-600 text-base leading-[1.9]" lang="zh-TW">
                現場還會有 The Quest community galaxy：<br />
                從 Design / Food / Ocean / Music Art Intelligence，到占星、女性媒體、傳統產業接班等，<br />
                讓你在不同的未來宇宙之間自由移動。
              </p>
            </div>
            <div className="aspect-square max-w-sm mx-auto w-full rounded-xl overflow-hidden bg-neutral-100">
              <img
                src="/tedx-xinyi/salon-galaxy.png"
                alt=""
                className="w-full h-full object-cover opacity-0 transition-opacity duration-700"
                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.style.background = 'radial-gradient(circle at center, #1e3a5f 0%, #0f172a 70%)';
                    el.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;flex-direction:column;gap:8px"><div style="width:60px;height:60px;border-radius:50%;border:2px solid rgba(230,43,30,0.4)"></div><div style="width:40px;height:40px;border-radius:50%;border:2px solid rgba(245,158,11,0.3);margin-top:-20px;margin-left:40px"></div><div style="width:30px;height:30px;border-radius:50%;border:2px solid rgba(16,185,129,0.3);margin-top:-10px;margin-left:-30px"></div></div>';
                  }
                }}
              />
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== BLOCK D — HOW / FLOW ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>HOW</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-10" lang="zh-TW">
            這一天，會發生什麼？
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {FLOW_SEGMENTS.map((seg, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all h-full flex flex-col">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-white font-black text-sm"
                  style={{ backgroundColor: TED_RED }}
                >
                  {i + 1}
                </div>
                <h3 className="text-base font-black mb-3" lang="zh-TW">{seg.heading}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed whitespace-pre-line flex-1" lang="zh-TW">
                  {seg.text}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={300}>
          <p className="text-neutral-400 text-xs text-center" lang="zh-TW">
            實際時間表與完整講者名單，將在活動前透過郵件與社群陸續公布。
          </p>
        </FadeIn>
      </Section>

      {/* ==================== BLOCK E — CTA ==================== */}
      <section className="py-20 md:py-28 text-white" style={{ backgroundColor: TED_RED }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-black mb-6" lang="zh-TW">
              在 TEDx Xinyi，一起面對<br />我們與 AI 的未來。
            </h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/85 text-base sm:text-lg leading-[1.9] mb-8" lang="zh-TW">
              你和 AI 的距離，正在決定你成為什麼樣的人。<br />
              留一天，好好想想我們要成為誰。
            </p>
          </FadeIn>
          <FadeIn delay={250}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                className="px-8 py-3.5 bg-white font-black text-sm rounded-full transition-all hover:scale-105 hover:shadow-lg"
                style={{ color: TED_RED }}
                lang="zh-TW"
              >
                我有興趣加入這場沙龍
              </button>
              <button
                className="px-8 py-3.5 font-bold text-sm rounded-full border-2 border-white/40 text-white/80 hover:text-white hover:border-white transition-all"
                lang="zh-TW"
              >
                收到最新講者與活動更新
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
