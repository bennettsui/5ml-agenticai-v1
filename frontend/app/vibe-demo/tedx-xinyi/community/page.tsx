'use client';

import Link from 'next/link';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY } from '../components';

const MERCH_ITEMS = [
  { name: '1MORE 萬魔耳機', description: '國際設計獎得主，可維修聆聽體驗', image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/1MORE-e1627275745256.png' },
  { name: 'Cofit', description: '以行為科學為基礎的數位健康品牌', image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/cofit-e1626948574733.png' },
  { name: 'tissue', description: '重新思考紙張的第二生命', image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/tissue-150x150.png' },
  { name: 'PLAYPLUS', description: '網站製作夥伴，數位體驗設計', image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/logo_210719_0003-150x150.jpg' },
  { name: '格蘭山麥', description: '未來永續生活合作夥伴', image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/logo_210719_0004-e1626948663927.jpg' },
];

export default function CommunityPage() {
  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/community" heroMode />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden bg-neutral-900">
        <img
          src="/tedx-xinyi/hero-community.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
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
                最新 Salon｜We are Becoming – AI趨勢沙龍
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
                src="/tedx-xinyi/salon-teaser.png"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <FadeIn>
              <SectionLabel>CIRCLES</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-black mb-6" lang="en">TED Circles</h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9] mb-8" lang="zh-TW">
                TED Circles 是 TED 所發起的小型討論聚會。
                在 TEDxXinyi，我們會挑選一支 TED 或 TEDx Talk，
                和一小群人一起看、一起聊，
                試著把大命題拉回日常的選擇。
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <a
                href="https://tedxxinyi.com/ted-circles/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black rounded-full text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: TED_RED }}
                lang="zh-TW"
              >
                了解 TED Circles
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </FadeIn>
          </div>
          <FadeIn delay={200}>
            <div className="flex items-center justify-center gap-4 p-8">
              <div className="w-20 h-20 rounded-full border-4 -mr-3" style={{ borderColor: TED_RED }} />
              <div className="w-16 h-16 rounded-full border-4 -mr-3" style={{ borderColor: `${TED_RED}60` }} />
              <div className="w-12 h-12 rounded-full border-4" style={{ borderColor: `${TED_RED}30` }} />
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== MERCH ==================== */}
      <Section bg="warm">
        <FadeIn>
          <SectionLabel>MERCH</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black mb-4" lang="zh-TW">樂觀趨勢家周邊商品</h2>
          <p className="text-neutral-500 text-base leading-relaxed mb-10 max-w-2xl" lang="zh-TW">
            有時候，一個實體的物件，<br />
            可以提醒我們：其實還有另一種生活方式可以選擇。<br />
            這些周邊是我們對「樂觀」的一種具象化。
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {MERCH_ITEMS.map((item, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="bg-white rounded-xl p-5 border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all text-center h-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-lg bg-neutral-50 flex items-center justify-center mb-3 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-w-[48px] max-h-[48px] object-contain"
                  />
                </div>
                <p className="font-bold text-sm mb-1" lang="zh-TW">{item.name}</p>
                <p className="text-neutral-400 text-xs" lang="zh-TW">{item.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
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
            <button
              className="px-8 py-3.5 bg-white font-black text-sm rounded-full transition-all hover:scale-105 hover:shadow-lg"
              style={{ color: TED_RED }}
              lang="zh-TW"
            >
              填寫志工表單
            </button>
          </FadeIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
