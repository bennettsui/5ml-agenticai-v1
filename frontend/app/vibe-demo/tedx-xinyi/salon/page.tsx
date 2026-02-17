'use client';

import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY } from '../components';

const SPEAKERS_LIST = [
  { name: '程世嘉', line: 'AI 趨勢引言人：我們跟 AI 的距離' },
  { name: '蔡康永', line: '情商專家：我們與人性的距離' },
  { name: 'Tim Wu', line: '哥倫比亞法學院教授：AI 時代的社會專注力' },
  { name: '洪蘭', line: '大腦科學家：ChatGPT 之後，人類大腦怎麼思考' },
  { name: '林東良', line: '黑潮海洋文教基金會執行長：從海洋看碳排與未來世代' },
  { name: '楊士毅', line: '快樂幸福藝術家：有趣的說故事力量，如何陪我們往前走' },
  { name: 'Angus Winchester', line: '飲酒文化與社會成本：在 AI 時代，如何讓一杯酒變得更有意識？' },
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
          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-transparent to-white" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 pt-32">
          <FadeIn>
            <SectionLabel dark>SALON</SectionLabel>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4" lang="zh-TW">
              We are Becoming – AI趨勢沙龍
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl" lang="zh-TW">
              探究我們跟 AI 的距離，我們跟自己的距離。
            </p>
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
              <p className="font-black text-sm" lang="zh-TW">2026/3/31（Tue）</p>
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
            主舞台講者（部分名單）
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {SPEAKERS_LIST.map((speaker, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="rounded-xl p-5 border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all h-full" style={{ backgroundColor: WARM_GRAY }}>
                <p className="font-black text-base mb-1" lang="zh-TW">{speaker.name}</p>
                <p className="text-neutral-500 text-xs leading-relaxed" lang="zh-TW">{speaker.line}</p>
              </div>
            </FadeIn>
          ))}
        </div>

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
              想和我們一起『becoming』？
            </h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/85 text-base sm:text-lg leading-[1.9] mb-8" lang="zh-TW">
              如果你對 AI、不確定的未來、以及人與人之間的連結有很多問號，<br />
              這場沙龍就是為你準備的。
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
