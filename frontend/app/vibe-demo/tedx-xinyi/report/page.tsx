'use client';

import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY, WARM_AMBER } from '../components';

/* ── SVG icon helpers ── */
const IconBook = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" /><path d="M8 11h4" />
  </svg>
);

const IconLightbulb = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" /><path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);

const IconGrid = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconLayers = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 2 10 6.5v7L12 22 2 15.5v-7L12 2z" />
    <path d="M12 22v-7" /><path d="m22 8.5-10 7-10-7" />
    <path d="m2 15.5 10-7 10 7" />
  </svg>
);

const IconHandshake = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3L14 8l-4-2-3 3 2 4z" />
    <path d="m2 12 6-6 2 1" /><path d="m22 12-6-6-2 1" />
  </svg>
);

const IconBrain = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 1 5 5c0 .8-.2 1.5-.5 2.2A5 5 0 0 1 19 14a5 5 0 0 1-3.5 4.8L12 22l-3.5-3.2A5 5 0 0 1 5 14a5 5 0 0 1 2.5-4.3C7.2 9 7 8.3 7 7.5A5 5 0 0 1 12 2z" />
    <path d="M12 2v20" />
  </svg>
);

const IconPen = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const IconCpu = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
    <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
    <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
  </svg>
);

const IconUsers = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconDownload = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconTicket = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
  </svg>
);

const CHAPTER_ICONS = [IconLightbulb, IconGrid, IconLayers, IconHandshake];

const CATEGORIES = [
  {
    title: '當 AI 學會說故事',
    label: 'ORIGIN',
    description:
      '從「教機器看」到「讓機器想」，AI 不再只是百科全書，而是會預測人類敘事的觀察者。\n當演算法開始理解情節、角色與懸念，真正的問題不是機器能不能說故事，而是——我們還記得自己的故事嗎？\n故事的靈魂不在於生成，而在於「為什麼要說」。這一章，從敘事的起源出發，找回故事背後的人性與意義。',
    accent: WARM_AMBER,
  },
  {
    title: '五個正在重寫的場景',
    label: 'SCENES',
    description:
      '世界不是即將改變，而是已經不同。\n你的職涯路徑、孩子的學習方式、我們對「真」與「假」的判斷、跨國社群的連結方式、甚至你腳下這座城市與自然的關係——都在被重寫。\n這五個場景不是預測，而是邀請：把自己的生活套進去，你會發現，改變早已在發生。',
    accent: TED_RED,
  },
  {
    title: '三個隱形的力量',
    label: 'FORCES',
    description:
      '真正重塑世界的，往往不是最新的模型或晶片，而是三股安靜但深遠的力量：\n社區，作為新型教育系統——不是 networking，而是 intelligence system，一座現代雅典學堂。\n敘事，作為新的價值生成系統——敘事經濟不只是行銷，而是我們如何理解世界、創造意義。\nAI 素養，作為新的公民能力——不是學寫程式，而是學會判斷、學會提問、學會在資訊洪流中保有自己。',
    accent: '#6366F1',
  },
  {
    title: '從一本報告，到一起成為',
    label: 'PRACTICE',
    description:
      '這本報告不是看完就放著的趨勢書，而是一份實作手冊。\n它的下一步，是沙龍、是課程、是社群共學場域——在 TEDxXinyi 2026《We, Becoming》AI 沙龍與更多行動中，實際落地。\n把報告帶回你的團隊、教室、社群，當作跨域對話的起點。你不需要是專家，只需要願意一起成為。',
    accent: '#10B981',
  },
];

const SALON_ACTIONS = [
  '深潛四大類別，連結到自己的職涯、家庭、社群與城市',
  '練習在 deepfake、演算法與多重敘事中，重建自己的判斷與信任感',
  '體驗關係型社區學習：從獨自焦慮，轉為在社群中共思共感',
  '用 Meta Learning 的角度設計「下一步」：我可以怎麼學、怎麼行動',
  '將 AI 視為磨刀石，而不是主角——我們要練的，是人的感受力與策展力',
];

export default function ReportPage() {
  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/report" heroMode />

      <main id="main-content" role="main">

        {/* ==================== 1) HERO — styled as report cover ==================== */}
        <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-neutral-950">
          {/* Background image — dimmer than salon to feel "printed" */}
          <img
            src="/tedx-xinyi/salon-hero.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.25'; }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Warm-tinted gradient overlay (amber tint distinguishes from salon's neutral) */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,10,5,0.7) 0%, rgba(30,20,10,0.4) 40%, rgba(15,10,5,0.85) 100%)' }} />

          {/* Decorative book-cover frame — inset border */}
          <div className="absolute inset-6 sm:inset-10 md:inset-14 pointer-events-none" style={{ border: `1px solid rgba(245,158,11,0.15)`, borderRadius: '2px' }} />

          {/* Spine accent — left amber stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2" style={{ backgroundColor: WARM_AMBER }} />

          <div className="relative z-10 max-w-5xl mx-auto px-8 sm:px-12 md:px-16 py-36" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
            <FadeIn>
              {/* Publication badge — distinguishes from salon "SALON" label */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <IconBook size={16} color={WARM_AMBER} />
                  <span className="text-[11px] font-black tracking-[0.2em] uppercase" style={{ color: WARM_AMBER }}>
                    趨勢報告
                  </span>
                </div>
                <span className="text-white/30 text-xs tracking-[0.15em]">2026 EDITION</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight" lang="zh-TW">
                <span className="font-handwriting text-4xl sm:text-5xl md:text-6xl">We are Becoming</span>
                <br />
                <span className="text-2xl sm:text-3xl md:text-4xl text-white/90">——在 AI 時代，重新學會成為人</span>
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-white/85 text-lg sm:text-xl leading-relaxed max-w-2xl mb-4" lang="zh-TW">
                這不是一份技術白皮書，而是一封邀請。<br />
                邀請你重新思考：在 AI 學會說我們的故事之後，我們要成為誰。
              </p>
            </FadeIn>
            <FadeIn delay={350}>
              <p className="text-white/55 text-base leading-[1.9] max-w-2xl mb-5" lang="zh-TW">
                這本報告誕生自 TEDxXinyi 的社群實驗與跨域智能的交會。它的焦點始終是人——學習如何學習、如何在巨變中保有人性、判斷力與同理心。
                未來不是將要發生，而是我們正在成為。<span className="font-handwriting text-lg text-white/70"> We are becoming.</span>
              </p>
            </FadeIn>

            {/* Chapter chips — show report structure at a glance */}
            <FadeIn delay={400}>
              <div className="flex flex-wrap gap-2 mb-8">
                {['Origin', 'Scenes', 'Forces', 'Practice'].map((ch) => (
                  <span key={ch} className="px-3 py-1 text-[10px] font-bold tracking-wider rounded-full text-white/50 border border-white/10 bg-white/[0.04]">
                    {ch}
                  </span>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={500}>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://sunrisehorizon.com.tw/ai-reports"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3 text-sm font-black rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: WARM_AMBER }}
                  lang="zh-TW"
                >
                  <IconDownload size={15} color="white" />
                  帶走這本未來使用守則
                </a>
                <a
                  href="https://www.accupass.com/event/2602250742267540353300"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3 text-sm font-black rounded-full border-2 border-white/30 text-white/90 transition-all hover:border-white/60 hover:scale-105"
                  lang="zh-TW"
                >
                  <IconTicket size={15} color="currentColor" />
                  加入沙龍，一起練習
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ==================== INTRO — Bottom Reset ==================== */}
        <Section bg="white">
          <FadeIn>
            <SectionLabel>BOTTOM RESET</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 leading-tight" lang="zh-TW">
              一次底層設定的重啟
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="max-w-3xl">
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-6" lang="zh-TW">
                當 AI 開始學人類說故事、學習我們的價值與選擇，我們需要的不是追趕技術，而是一次 Bottom Reset——重新校準自己的底層設定。
              </p>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-6" lang="zh-TW">
                這份報告出自 TEDxXinyi 社群與多位趨勢觀察者、創作者與實踐者的合作。它聚焦四件事：
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              {([
                { title: '學習如何學習', desc: 'Meta Learning——不是學更多，而是學會怎麼學', Icon: IconBrain },
                { title: 'AI 敘事與敘事經濟', desc: '當故事成為新的價值生成系統', Icon: IconPen },
                { title: 'AI 應用能力', desc: '重點不在工具，而在人性與判斷力', Icon: IconCpu },
                { title: '社區即學堂', desc: '社群不是 networking，而是 intelligence system', Icon: IconUsers },
              ] as const).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-all" style={{ backgroundColor: WARM_GRAY }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${TED_RED}10` }}>
                    <item.Icon size={16} color={TED_RED} />
                  </div>
                  <div>
                    <p className="font-black text-sm mb-0.5" lang="zh-TW">{item.title}</p>
                    <p className="text-neutral-500 text-xs leading-relaxed" lang="zh-TW">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </Section>

        {/* ==================== 2) FOUR CATEGORIES ==================== */}
        <Section bg="warm">
          <FadeIn>
            <SectionLabel>FOUR CHAPTERS</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4" lang="zh-TW">
              四個維度，重新看見世界
            </h2>
            <p className="text-neutral-500 text-base mb-12 max-w-2xl" lang="zh-TW">
              從 AI 敘事的起源，到正在重寫的場景，到隱形的力量，到實際行動——一層一層走進去。
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map((cat, i) => {
              const ChapterIcon = CHAPTER_ICONS[i];
              return (
                <FadeIn key={i} delay={i * 100}>
                  <div className="bg-white rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: cat.accent }} />
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.accent}12` }}>
                          <ChapterIcon size={18} color={cat.accent} />
                        </div>
                        <span
                          className="text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider"
                          style={{ backgroundColor: `${cat.accent}15`, color: cat.accent }}
                        >
                          {cat.label}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black mb-3" lang="zh-TW">{cat.title}</h3>
                      <p className="text-neutral-500 text-sm leading-[1.9] whitespace-pre-line flex-1" lang="zh-TW">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </Section>

        {/* ==================== 3) SALON — What We'll Do Together ==================== */}
        <Section bg="white">
          <FadeIn>
            <SectionLabel>MODERN ATHENIAN SCHOOL</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4" lang="zh-TW">
              我們會在沙龍裡一起做什麼？
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="max-w-3xl mb-10">
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9]" lang="zh-TW">
                這不只是聽演講。這是一場現代雅典學堂式的共學實驗——以 You / Me / World 三個維度，帶大家進行一次 Bottom Reset。在這裡，你不需要是專家，只需要帶著你的問題來。
              </p>
            </div>
          </FadeIn>

          <div className="max-w-3xl space-y-0">
            {SALON_ACTIONS.map((action, i) => (
              <FadeIn key={i} delay={150 + i * 60}>
                <div className="flex gap-5 md:gap-8 pb-6 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ backgroundColor: TED_RED }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    {i < SALON_ACTIONS.length - 1 && (
                      <div className="w-[2px] flex-1 mt-1" style={{ backgroundColor: `${TED_RED}20` }} />
                    )}
                  </div>
                  <p className="text-neutral-700 text-sm sm:text-base leading-relaxed font-medium pt-1" lang="zh-TW">
                    {action}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={500}>
            <div className="mt-8 max-w-3xl">
              <div className="border-l-4 pl-6" style={{ borderColor: WARM_AMBER }}>
                <p className="text-neutral-500 text-sm leading-[1.9] italic" lang="zh-TW">
                  智能星系（The Quest Community Galaxy）不是一張組織圖，而是一個活的學習系統——每一位參與者都是一顆星，跨域智能的共振，就在人與人的對話中發生。
                </p>
              </div>
            </div>
          </FadeIn>
        </Section>

        {/* ==================== 4) CTA — Two Actions ==================== */}

        {/* CTA 1: Join the Salon */}
        <section className="py-20 md:py-28 text-white" style={{ backgroundColor: TED_RED }}>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <FadeIn>
              <SectionLabel dark>JOIN US</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight" lang="zh-TW">
                不是來聽答案，<br />而是一起練習成為
              </h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-white/85 text-base sm:text-lg leading-[1.9] mb-4" lang="zh-TW">
                2026 年 3 月 31 日，台北表演藝術中心．藍盒子。<br />
                一場關於「在 AI 時代活得更有覺察與連結」的共學沙龍。
              </p>
              <p className="text-white/55 text-sm mb-8" lang="zh-TW">
                我們準備了 Talks、工作坊、趨勢市集與 networking，<br />
                但最重要的，是你帶來的問題和你願意成為的那個人。
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://www.accupass.com/event/2602250742267540353300"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white font-black text-sm rounded-full transition-all hover:scale-105 hover:shadow-lg"
                  style={{ color: TED_RED }}
                  lang="zh-TW"
                >
                  <IconTicket size={15} color={TED_RED} />
                  預約我的席次
                </a>
                <Link
                  href="/vibe-demo/tedx-xinyi/salon"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/40 text-white font-black text-sm rounded-full transition-all hover:border-white/70 hover:scale-105"
                  lang="zh-TW"
                >
                  了解沙龍詳情
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* CTA 2: Get the Report */}
        <Section bg="warm">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <SectionLabel>THE REPORT</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight" lang="zh-TW">
                你手上這本，<br />是現代雅典學堂的課本
              </h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-4" lang="zh-TW">
                《We are Becoming》不只是一本趨勢報告，更是一份可以帶回團隊、教室、社群的共學藍圖——支援關係型社區學習與跨域對話。
              </p>
              <p className="text-neutral-400 text-sm mb-8" lang="zh-TW">
                每一章都可以變成一場讀書會、一堂工作坊、一次團隊對話的起點。
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://sunrisehorizon.com.tw/ai-reports"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 font-black text-sm rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: WARM_AMBER }}
                  lang="zh-TW"
                >
                  <IconDownload size={15} color="white" />
                  帶走未來使用守則
                </a>
                <a
                  href="https://sunrisehorizon.com.tw/ai-reports"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-neutral-300 text-neutral-600 font-black text-sm rounded-full transition-all hover:border-neutral-500 hover:scale-105"
                  lang="zh-TW"
                >
                  <IconBook size={15} color="currentColor" />
                  購買《We are Becoming》
                </a>
              </div>
            </FadeIn>
          </div>
        </Section>

      </main>

      <SiteFooter />
    </div>
  );
}
