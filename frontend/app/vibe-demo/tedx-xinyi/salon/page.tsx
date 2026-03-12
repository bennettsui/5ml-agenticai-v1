'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY, WARM_AMBER } from '../components';

// CDN URL map for speaker images — updated by POST /api/tedx-xinyi/sync-cdn
const SPEAKER_CDN_URLS: Record<string, string> = {};

const SPEAKERS = [
  {
    name: '程世嘉',
    org: 'iKala Interactive Media Inc.',
    role: 'iKala集團董事長，AI知識暢銷作家',
    tagline: 'AI 時代的人文思考者 × 賦能型創業家',
    imageId: 'cheng-shi-jia',
  },
  {
    name: '楊士毅',
    org: '楊士毅個人工作室',
    role: '剪紙藝術家 導演、攝影師',
    tagline: '剪紙藝術 × 國際成就',
    imageId: 'yang-shi-yi',
  },
  {
    name: '林東良',
    org: '黑潮海洋文化基金會',
    role: '執行長',
    tagline: '從解說員到執行長——海洋教育 × 環境行動',
    imageId: 'lin-dong-liang',
  },
  {
    name: '廖唯傑',
    org: '華夏集團玻璃',
    role: '企業經營者',
    tagline: '教育 × 科技的跨界實踐',
    imageId: 'liao-wei-jie',
  },
  {
    name: '廖冠傑',
    org: '玻璃兄弟主持人 哥哥',
    role: '企業經營者，知識型KOL',
    imageId: 'liao-guan-jie',
  },
];

const GUESTS = [
  {
    name: '曹榮軒博士',
    roleTag: '邀約策展主持人',
    org: '福爾摩沙氣候智慧服務有限公司執行長',
    role: '氣候科學家，永續專家',
    imageId: 'cao-rong-xuan',
  },
  {
    name: '張卉君',
    roleTag: '邀約策展主持人',
    role: '詩人，海洋環境倡議家，作家，陶藝家',
    imageId: 'zhang-hui-jun',
  },
  {
    name: '林靜宜',
    roleTag: '邀約趨勢引言',
    org: '自由工作者',
    role: '傳記作家，占星敘事趨勢家',
    imageId: 'lin-jing-yi',
  },
  {
    name: '郭安妮',
    roleTag: 'Wisdom 3.0 Moderator',
    org: '美商中經合集團',
    role: '總經理',
    imageId: 'guo-an-ni',
  },
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

const PROGRAM_BLOCKS = [
  {
    time: '09:30 – 10:30',
    label: '簽到與高空探索',
    theme: '現場提供互動式體驗專區',
    themeTag: null,
    items: [
      'Retreat Music 腦波淨化區（頌缽洗禮 正念行走）',
      'Legacy Journey 傳承之道區（定位練習，創造無限可能）',
      'I do I will Art Work 從我開始影響力學習專區（永續飲食）',
      'Art & Design Floral Talk 每天進步一點點咖啡廳（品牌合作專區）',
      'Meditation Hall 人類洞穴休憩處（好好喝水，好好呼吸）',
    ],
  },
  {
    time: '10:30 – 11:00',
    label: 'Prelude：探索力',
    theme: '歡迎來到藍盒子之屋，TEDxXinyi舞台',
    themeTag: '探索力',
    items: [
      'Opening Performance: 開場 當3D hologram 未來趨勢啟迪',
      'Prelude - The Sound of Universe 來自地心的聲音',
      'Ideas to Aesthetic Intelligence — 持牌策展人說故事的奧秘 都會續美學開場',
      'Ideas to Astrology Intelligence — 特約嘉賓 林靜宜占星敘事 自我覺察引導',
    ],
  },
  {
    time: '11:00 – 12:00',
    label: 'All Of Us：學習力',
    theme: '18 分鐘演講',
    themeTag: '學習力',
    items: [
      'Session 1：AI趨勢 — 當機器人學會說故事的一天（程世嘉先生）',
      'Session 2：AI環境 — 海洋算力？花紋海豚的超能力？（林東良先生）',
      'Session 3：AI×永續 — 如何建立一個企業持續百年？轉型逆襲的危機轉機？（廖唯傑先生）',
      'Session 4：幸福論 — 幸福沒有門檻（楊士毅先生）',
    ],
  },
  {
    time: '12:00 – 13:00',
    label: '午餐 & 認識新朋友',
    theme: null,
    themeTag: '鑑賞力',
    items: [],
  },
  {
    time: '13:00 – 14:30',
    label: 'Discovery Session：行動力',
    theme: null,
    themeTag: '行動力',
    items: [
      '場外 We Are Becoming Stage — 價值鏈換位思考議題探討：從2050年看2026年，你看見什麼？',
      '安心靜態展 — 講者品味剪紙藝術鑑賞區',
      '海洋動態展 — 講者海洋知識環境教育學習',
      '人類未來趨勢＿不插電俱樂部（現場燙金壓印服務，咖啡品味區）',
    ],
  },
  {
    time: '14:30 – 16:00',
    label: 'We Are Becoming 趨勢報告書對談',
    theme: null,
    themeTag: null,
    items: [],
  },
  {
    time: '16:10 – 17:00',
    label: '閉幕：Finale — Pass it On',
    theme: null,
    themeTag: null,
    items: [],
  },
];

const SALE_WINDOW = '2026.02.25（三）12:00 – 03.30（一）17:00';
const USE_DATE    = '2026.03.31（二）10:00 – 17:00';

const TICKET_TYPES = [
  {
    name: 'Observer｜線上觀察者',
    nameEn: 'Live Stream Pass',
    price: 'NT$1,200',
    priceNote: null,
    desc: '看見趨勢如何發生\n3/31 線上直播 × 趨勢策展內容精華',
    for: '想參與思考、但此刻身體不在現場的人',
    note: null,
    badge: '線上',
    badgeColor: '#0EA5E9',
    accent: '#0EA5E9',
    saleWindow: SALE_WINDOW,
    useDate: USE_DATE,
  },
  {
    name: 'Early Believer Pass｜早鳥品味相信者',
    nameEn: 'Early Bird Pass',
    price: 'NT$2,000',
    priceNote: null,
    desc: '在趨勢被命名之前就已到場\n3/31 實體活動 × 趨勢策展白皮書（電子版）',
    for: '總是比多數人早一步行動的人',
    note: '限量 50 名，即日起至 3/6 售票',
    badge: '限量 50',
    badgeColor: '#10B981',
    accent: '#10B981',
    saleWindow: '即日起至 2026.03.06',
    useDate: USE_DATE,
  },
  {
    name: 'Participant Standard Pass｜現場參與者',
    nameEn: 'Standard Pass',
    price: 'NT$2,640',
    priceNote: null,
    desc: '走進趨勢現場\n標準入場，完整體驗整日沙龍、Talks、工作坊與互動專區\n3/31 實體活動 × 趨勢策展白皮書（電子版本）',
    for: '願意花一個下午，與不同領域的人一起思考未來',
    note: null,
    badge: null,
    badgeColor: null,
    accent: TED_RED,
    saleWindow: SALE_WINDOW,
    useDate: USE_DATE,
  },
  {
    name: 'Contributor Pass｜深度共創者',
    nameEn: 'Contributor Pass',
    price: 'NT$3,360',
    priceNote: null,
    desc: '把趨勢帶回你的世界\n3/31 實體活動 × 趨勢策展白皮書（電子版本）× 趨勢筆記本（無酸紙 Moleskine 支持贊助）',
    for: '會延伸、會分享、會轉化的人',
    note: null,
    badge: null,
    badgeColor: null,
    accent: WARM_AMBER,
    saleWindow: SALE_WINDOW,
    useDate: USE_DATE,
  },
  {
    name: 'VIP 票種',
    nameEn: 'VIP Pass',
    price: 'NT$888',
    priceNote: null,
    desc: '3/31 活動 × 趨勢策展電子版本 × 趨勢筆記本 × 3/30 藍盒子舞台後場巡迴',
    for: null,
    note: null,
    badge: 'VIP',
    badgeColor: '#8B5CF6',
    accent: '#8B5CF6',
    saleWindow: SALE_WINDOW,
    useDate: USE_DATE,
  },
  {
    name: 'Student / Youth｜學生／青年票',
    nameEn: 'AI Literacy Pass',
    price: 'NT$1,400',
    priceNote: null,
    desc: '社區教育推廣票\n適用對象：在老師帶領下參與活動之高中生與大學生',
    for: null,
    note: '需出示有效學生證或青年身分相關證明文件；若無法出示，須於現場補足差額至一般票價。本票種為教育推廣用途，恕不適用於一般社會人士或企業團體。',
    badge: '學生',
    badgeColor: '#10B981',
    accent: '#10B981',
    saleWindow: SALE_WINDOW,
    useDate: USE_DATE,
  },
  {
    name: 'Group 4 人套票',
    nameEn: 'Group Pass',
    price: 'NT$8,000',
    priceNote: '平均 NT$2,000／人',
    desc: '和朋友、同事或家人一起來。四個人，四種觀點，一起 becoming。',
    for: null,
    note: '單一訂單一次購買 4 名入場資格，不可拆單部分退票或改票種；4 位可分開報到，座位以現場安排為準。',
    badge: '4人',
    badgeColor: '#6366F1',
    accent: '#6366F1',
    saleWindow: SALE_WINDOW,
    useDate: USE_DATE,
  },
];

interface CirclePhoto { key: string; src: string; alt: string; }
interface EventPhoto { key: string; src: string; alt: string; }

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

export default function SalonPage() {
  const [circlePhotos, setCirclePhotos] = useState<CirclePhoto[]>([]);
  const [eventPhotos, setEventPhotos] = useState<EventPhoto[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tedx-xinyi/circles')
      .then(r => r.json())
      .then(d => setCirclePhotos(d.photos || []))
      .catch(() => {});
    fetch(`${API_BASE}/api/tedx-xinyi/event-photos`)
      .then(r => r.json())
      .then(d => setEventPhotos(d.photos || []))
      .catch(() => {});
  }, []);

  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/salon" heroMode />

      {/* ==================== HERO ==================== */}
      <section id="salon-we-are-becoming-ai" className="relative min-h-[75vh] flex items-end overflow-hidden bg-neutral-900">
        <img
          src="/tedx-xinyi/salon-hero.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '0.7'; }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/40 via-transparent to-neutral-900/80" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 pt-36" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}>
          <FadeIn>
            <SectionLabel dark>SALON</SectionLabel>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4" lang="zh-TW">
              <span className="font-handwriting text-4xl sm:text-5xl md:text-6xl">We are Becoming</span> – AI時代趨勢沙龍
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/90 text-xl sm:text-2xl font-black leading-relaxed max-w-2xl" lang="zh-TW">
              AI 時代，每天學著重來，<br />日常活出新精彩。
            </p>
          </FadeIn>
          <FadeIn delay={350}>
            <p className="text-white/40 text-xs tracking-[0.2em] mt-6" lang="zh-TW">
              #2026首波沙龍論壇　#在AI時代學會看懂趨勢
            </p>
            <a
              href="https://www.accupass.com/event/2602250742267540353300"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 mt-4 text-sm font-black rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: TED_RED }}
              lang="zh-TW"
            >
              立即購票
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
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
                  {/* Gradient fallback (behind image) */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0b1628] via-[#0f1a3a] to-black" style={{ zIndex: 0 }} />
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(79,70,229,0.18) 0%, transparent 65%)', zIndex: 0 }} />

                  {/* nanobanana background (above gradient fallback) */}
                  <img
                    src="/tedx-xinyi/poster-dark.webp"
                    alt="We are Becoming — TEDxXinyi 2026 key visual poster"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500"
                    style={{ zIndex: 1 }}
                    onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />

                  {/* Bottom darken for text legibility */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" style={{ zIndex: 2 }} />

                  {/* Text overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5" style={{ zIndex: 10 }}>
                    {/* Top: logo */}
                    <div className="text-center">
                      <span className="font-black text-base tracking-tight" style={{ color: TED_RED }}>TEDx</span>
                      <span className="text-white/80 text-sm font-light tracking-tight ml-0.5">Xinyi</span>
                    </div>

                    {/* Middle: main title + subtitle */}
                    <div className="text-center" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
                      <p className="font-handwriting text-white font-bold text-[2rem] leading-tight tracking-tight mb-4">
                        WE ARE<br />BECOMING
                      </p>
                      <p className="text-white/95 font-black text-base leading-snug" lang="zh-TW">
                        AI 時代，每天學著重來
                      </p>
                      <p className="text-white/95 font-black text-base leading-snug mb-3" lang="zh-TW">
                        日常活出新精彩
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
                  每天學著重來，日常活出新精彩。<br />
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2" lang="zh-TW">
            <span className="font-handwriting text-3xl sm:text-4xl md:text-5xl">We are Becoming</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-neutral-600 mb-8" lang="zh-TW">
            AI時代趨勢沙龍
          </p>
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
              AI 時代，每天學著重來，<br />日常活出新精彩。
            </p>
            <p className="text-neutral-400 text-sm" lang="zh-TW">
              — TEDxXinyi <span className="font-handwriting text-base">We are Becoming</span> 2026 核心主題
            </p>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== BLOCK B — WHY / VALUE PROPOSITION ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>WHY</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-10" lang="zh-TW">
            為什麼是『<span className="font-handwriting text-3xl sm:text-4xl md:text-5xl">We are Becoming</span>』？
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
            我們邀請了來自 AI、藝術、商業與文化等不同領域的講者，<br />
            一起打開 AI 與人性、創造力、社會之間的各種縫隙。
          </p>
        </FadeIn>

        {/* ── 4 Main Speakers ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {SPEAKERS.map((speaker, i) => (
            <FadeIn key={i} delay={i * 70}>
              <div className="text-center">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto mb-3 overflow-hidden bg-neutral-100 border-2 border-neutral-100 relative">
                  <img
                    src={SPEAKER_CDN_URLS[speaker.imageId] || `/tedx-xinyi/speakers/${speaker.imageId}.jpg`}
                    alt={speaker.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (el.src.endsWith('.jpg')) { el.src = el.src.replace('.jpg', '.png'); }
                      else { el.style.display = 'none'; if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex'; }
                    }}
                  />
                  <div className="w-full h-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 absolute inset-0" style={{ display: 'none' }}>
                    <span className="text-2xl font-black text-neutral-400">{speaker.name[0]}</span>
                  </div>
                </div>
                <p className="font-black text-sm mb-0.5" lang="zh-TW">{speaker.name}</p>
                {speaker.org && (
                  <p className="text-neutral-400 text-[10px] leading-relaxed" lang="zh-TW">{speaker.org}</p>
                )}
                <p className="text-neutral-500 text-xs leading-relaxed mt-0.5" lang="zh-TW">{speaker.role}</p>
                {speaker.tagline && (
                  <p className="text-neutral-400 text-[10px] leading-relaxed mt-1.5 max-w-[160px] mx-auto italic" lang="zh-TW">{speaker.tagline}</p>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── 5 Guests / Hosts ── */}
        <FadeIn delay={100}>
          <div className="border-t border-neutral-100 pt-10 mb-10">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8" lang="zh-TW">TEDxXinyi 智庫</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {GUESTS.map((guest, i) => (
                <FadeIn key={i} delay={i * 60}>
                  <div className="text-center">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto mb-3 overflow-hidden bg-neutral-100 border-2 border-neutral-100 relative">
                      <img
                        src={SPEAKER_CDN_URLS[guest.imageId] || `/tedx-xinyi/speakers/${guest.imageId}.jpg`}
                        alt={guest.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          if (el.src.endsWith('.jpg')) { el.src = el.src.replace('.jpg', '.png'); }
                          else { el.style.display = 'none'; if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex'; }
                        }}
                      />
                      <div className="w-full h-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 absolute inset-0" style={{ display: 'none' }}>
                        <span className="text-2xl font-black text-neutral-400">{guest.name[0]}</span>
                      </div>
                    </div>
                    <span
                      className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1.5 tracking-wide"
                      style={{ backgroundColor: `${TED_RED}12`, color: TED_RED }}
                    >
                      {guest.roleTag}
                    </span>
                    <p className="font-black text-sm mb-0.5" lang="zh-TW">{guest.name}</p>
                    {guest.org && (
                      <p className="text-neutral-400 text-[10px] leading-relaxed" lang="zh-TW">{guest.org}</p>
                    )}
                    <p className="text-neutral-500 text-xs leading-relaxed mt-0.5" lang="zh-TW">{guest.role}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── Curator ── */}
        <FadeIn delay={200}>
          <div className="flex items-center gap-5 mb-10 p-5 rounded-xl border border-neutral-100" style={{ backgroundColor: '#fafaf9' }}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-neutral-100 border-2 border-neutral-100 flex-shrink-0 relative">
              <img
                src={SPEAKER_CDN_URLS['dawn-chang'] || '/tedx-xinyi/speakers/dawn-chang.jpg'}
                alt="Dawn Chang"
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  if (el.src.endsWith('.jpg')) { el.src = el.src.replace('.jpg', '.png'); }
                  else { el.style.display = 'none'; if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex'; }
                }}
              />
              <div className="w-full h-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 absolute inset-0" style={{ display: 'none' }}>
                <span className="text-xl font-black text-neutral-400">D</span>
              </div>
            </div>
            <div>
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 tracking-wide"
                style={{ backgroundColor: `${WARM_AMBER}20`, color: WARM_AMBER }}
              >
                CURATOR
              </span>
              <p className="font-black text-base" lang="zh-TW">Dawn Chang 張敏訓</p>
              <p className="text-neutral-400 text-xs leading-relaxed" lang="zh-TW">Sunrise On The Horizon House</p>
              <p className="text-neutral-500 text-xs leading-relaxed mt-0.5" lang="zh-TW">TEDxXinyi持牌策展人</p>
              <p className="text-neutral-400 text-xs leading-relaxed mt-1 italic" lang="en">TED Conference Community Ambassador</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={250}>
          <p className="text-xs text-neutral-400 mb-10" lang="zh-TW">
            更多講者與嘉賓陸續公布中。
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
                src="/tedx-xinyi/salon-galaxy.webp"
                alt=""
                className="w-full h-full object-cover opacity-0 transition-opacity duration-500"
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

      {/* ==================== BLOCK D — PROGRAM RUNDOWN ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>PROGRAM RUNDOWN</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4" lang="zh-TW">
            活動流程
          </h2>
          <p className="text-neutral-500 text-base mb-12" lang="zh-TW">
            一整天，從探索力、學習力、鑑賞力到行動力——每個時段都是一次 becoming。
          </p>
        </FadeIn>

        <div className="space-y-0">
          {PROGRAM_BLOCKS.map((block, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="flex gap-5 md:gap-8 pb-8 relative">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full mt-1.5 border-4 border-white"
                    style={{ backgroundColor: TED_RED }}
                  />
                  {i < PROGRAM_BLOCKS.length - 1 && (
                    <div className="w-[2px] flex-1 mt-1" style={{ backgroundColor: `${TED_RED}20` }} />
                  )}
                </div>

                <div className="flex-1 pb-2">
                  {/* Time + optional theme tag */}
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-sm font-black" style={{ color: TED_RED }}>{block.time}</span>
                    {block.themeTag && (
                      <span
                        className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${TED_RED}10`, color: TED_RED }}
                      >
                        {block.themeTag}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black mb-1" lang="zh-TW">{block.label}</h3>
                  {block.theme && (
                    <p className="text-neutral-500 text-sm mb-2" lang="zh-TW">{block.theme}</p>
                  )}

                  {block.items.length > 0 && (
                    <ul className="space-y-1.5 mt-2">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-neutral-300 mt-2 flex-shrink-0" />
                          <p className="text-neutral-600 text-sm leading-relaxed" lang="zh-TW">{item}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== BLOCK D2 — TICKETS & PRICING ==================== */}
      <Section bg="white">
        <FadeIn>
          <SectionLabel>TICKETS</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4" lang="zh-TW">
            票種與售價
          </h2>
          <p className="text-neutral-500 text-base mb-3" lang="zh-TW">
            每一張票，都是一張走進未來的入場券。選擇最適合你的方式加入。
          </p>
          <div className="flex flex-wrap gap-4 mb-10 text-xs text-neutral-400">
            <span lang="zh-TW">🗓 售票時間：2026.02.25（三）12:00 – 03.30（一）17:00</span>
            <span lang="zh-TW">⏰ 使用時間：2026.03.31（二）10:00 – 17:00</span>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
          {TICKET_TYPES.map((ticket, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="bg-white rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                {/* Accent bar */}
                <div className="h-1" style={{ backgroundColor: ticket.accent }} />
                <div className="p-5 flex-1 flex flex-col gap-3">
                  {/* Header row: badge + name */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-0.5">{ticket.nameEn}</p>
                      <h3 className="text-sm font-black leading-snug" lang="zh-TW">{ticket.name}</h3>
                    </div>
                    {ticket.badge && (
                      <span
                        className="flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${ticket.badgeColor}18`, color: ticket.badgeColor }}
                      >
                        {ticket.badge}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-xl font-black" style={{ color: ticket.accent }}>{ticket.price}</p>
                    {ticket.priceNote && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">{ticket.priceNote}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-neutral-500 text-xs leading-relaxed flex-1 whitespace-pre-line" lang="zh-TW">
                    {ticket.desc}
                  </p>

                  {/* Target audience */}
                  {ticket.for && (
                    <p className="text-[11px] text-neutral-400 leading-relaxed" lang="zh-TW">
                      📌 給：{ticket.for}
                    </p>
                  )}

                  {/* Sale window (only if different from default) */}
                  {ticket.saleWindow !== SALE_WINDOW && (
                    <p className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded px-2 py-1" lang="zh-TW">
                      🕐 售票：{ticket.saleWindow}
                    </p>
                  )}

                  {/* Note */}
                  {ticket.note && (
                    <p className="text-neutral-400 text-[10px] leading-relaxed border-t border-neutral-100 pt-2.5" lang="zh-TW">
                      {ticket.note}
                    </p>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={400}>
          <div className="text-center mb-8">
            <a
              href="https://www.accupass.com/event/2602250742267540353300"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-black rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: TED_RED }}
              lang="zh-TW"
            >
              立即購票
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={500}>
          <div className="rounded-xl p-6 border border-neutral-100" style={{ backgroundColor: WARM_GRAY }}>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">備註 · Notes</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-neutral-300 mt-2 flex-shrink-0" />
                <p className="text-neutral-500 text-xs leading-relaxed" lang="zh-TW">
                  所有票券僅限本活動當日單次入場使用，不得轉售牟利，主辦單位保留入場審核與座位安排之權利。
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-neutral-300 mt-2 flex-shrink-0" />
                <p className="text-neutral-500 text-xs leading-relaxed" lang="zh-TW">
                  退票與更名依主辦公告之規定與期限辦理，逾期恕不受理，可能酌收手續費。
                </p>
              </li>
            </ul>
          </div>
        </FadeIn>
      </Section>

      {/* ==================== BLOCK E — VENUE ==================== */}
      <Section bg="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <FadeIn>
              <SectionLabel>VENUE</SectionLabel>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6" lang="zh-TW">
                台北表演藝術中心<br />
                <span className="text-neutral-500">藍盒子 Blue Box</span>
              </h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-6" lang="zh-TW">
                我們刻意選擇了一個不像「會議」的場地。<br />
                台北表演藝術中心是亞洲最具實驗精神的劇場建築之一，<br />
                而藍盒子是其中最靈活、最親密的黑盒子劇場空間。
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-6" lang="zh-TW">
                當我們把 AI 的對話，從飯店會議室搬進劇場，<br />
                空間本身就是一種態度：<br />
                讓技術回到文化場域，讓趨勢對話發生在公共空間裡。
              </p>
            </FadeIn>
            <FadeIn delay={350}>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: TED_RED }} />
                  <p className="text-neutral-500 text-sm leading-relaxed" lang="zh-TW">
                    <span className="font-black text-neutral-700">靈活的劇場空間</span> — 可容納 Talks、工作坊、市集與 networking 同步進行，打破單一舞台的限制
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: TED_RED }} />
                  <p className="text-neutral-500 text-sm leading-relaxed" lang="zh-TW">
                    <span className="font-black text-neutral-700">公共文化場域</span> — 不是封閉的企業空間，而是屬於城市的劇場，讓每一位參與者都像走進一場演出
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: TED_RED }} />
                  <p className="text-neutral-500 text-sm leading-relaxed" lang="zh-TW">
                    <span className="font-black text-neutral-700">沉浸式體驗</span> — 藍盒子的燈光與聲學設計，讓每一段演講、每一場對話都更有臨場感
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={200}>
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                <img
                  src="https://5ml.mmdbfiles.com/assets/7bfb3356fd0a844260692058.jpg"
                  alt="台北表演藝術中心 藍盒子 Blue Box"
                  loading="lazy"
                  className="w-full h-full object-cover opacity-0 transition-opacity duration-500"
                  onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="rounded-xl p-5 border border-neutral-100" style={{ backgroundColor: WARM_GRAY }}>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2" lang="zh-TW">地點資訊</p>
                <p className="font-black text-sm mb-1" lang="zh-TW">台北表演藝術中心．藍盒子（Blue Box）</p>
                <p className="text-neutral-500 text-xs" lang="zh-TW">台北市士林區劍潭路 1 號</p>
                <p className="text-neutral-400 text-xs mt-1" lang="zh-TW">捷運劍潭站 1 號出口步行約 5 分鐘</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== BLOCK E2 — EVENT PHOTO GALLERY ==================== */}
      {eventPhotos.length > 0 && (
        <Section bg="warm">
          <FadeIn>
            <SectionLabel>GALLERY</SectionLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2" lang="zh-TW">活動花絮</h2>
            <p className="text-neutral-500 text-base mb-10" lang="zh-TW">現場精彩瞬間。</p>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {eventPhotos.map((photo, i) => (
              <FadeIn key={photo.key} delay={i * 50}>
                <button
                  className="group w-full rounded-xl overflow-hidden focus:outline-none"
                  onClick={() => setLightboxSrc(photo.src)}
                >
                  <div className="aspect-square bg-neutral-200 overflow-hidden">
                    <img
                      src={photo.src}
                      alt={photo.alt || ''}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </Section>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ==================== BLOCK F — CTA ==================== */}
      <section className="py-20 md:py-28 text-white" style={{ backgroundColor: TED_RED }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-black mb-6" lang="zh-TW">
              在 TEDx Xinyi，一起面對<br />我們與 AI 的未來。
            </h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/85 text-base sm:text-lg leading-[1.9] mb-8" lang="zh-TW">
              AI 時代，每天學著重來，日常活出新精彩。<br />
              留一天，好好想想我們要成為誰。
            </p>
          </FadeIn>
          <FadeIn delay={250}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://www.accupass.com/event/2602250742267540353300"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 bg-white font-black text-sm rounded-full transition-all hover:scale-105 hover:shadow-lg inline-block"
                style={{ color: TED_RED }}
                lang="zh-TW"
              >
                我有興趣加入這場沙龍
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
