'use client';

import { SiteNav, SiteFooter, Section, FadeIn, globalStyles, TED_RED } from '../components';

const MERCH_ITEMS = [
  {
    name: '品牌／產品名稱',
    description: '與 TEDxXinyi 合作內容一句話',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/1MORE-e1627275745256.png',
  },
  {
    name: '品牌／產品名稱',
    description: '與 TEDxXinyi 合作內容一句話',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/cofit-e1626948574733.png',
  },
  {
    name: '品牌／產品名稱',
    description: '與 TEDxXinyi 合作內容一句話',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/tissue-150x150.png',
  },
  {
    name: '品牌／產品名稱',
    description: '與 TEDxXinyi 合作內容一句話',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/logo_210719_0003-150x150.jpg',
  },
  {
    name: '品牌／產品名稱',
    description: '與 TEDxXinyi 合作內容一句話',
    image: 'https://tedxxinyi.com/wp-content/uploads/2021/07/logo_210719_0004-e1626948663927.jpg',
  },
];

export default function CommunityPage() {
  return (
    <div className="tedx-xinyi bg-neutral-950 text-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/community" />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://tedxxinyi.com/wp-content/uploads/2021/07/S__45727765.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.25) saturate(0.5)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 pt-32">
          <FadeIn>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6">
              <span lang="en">Community </span>
              <span lang="zh-TW">社群</span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl" lang="zh-TW">
              TEDxXinyi 的力量，來自一群持續在信義聚集、對話、實驗的人。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== TED CIRCLES ==================== */}
      <Section dark={false}>
        <div className="max-w-3xl">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-black mb-6" lang="en">TED Circles</h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8" lang="zh-TW">
              TED Circles 是 TED 所發起的小型討論聚會。<br />
              在 TEDxXinyi，我們會挑選一支 TED 或 TEDx Talk，<br />
              和一小群人一起看、一起聊，<br />
              試著把大命題拉回日常的選擇。
            </p>
          </FadeIn>
          <FadeIn delay={250}>
            <a
              href="https://tedxxinyi.com/ted-circles/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: TED_RED, color: 'white' }}
              lang="zh-TW"
            >
              了解 TED Circles
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== MERCH ==================== */}
      <Section>
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-black mb-4" lang="zh-TW">樂觀趨勢家周邊商品</h2>
          <p className="text-white/50 text-base leading-relaxed mb-10 max-w-2xl" lang="zh-TW">
            有時候，一個實體的物件，<br />
            可以提醒我們：其實還有另一種生活方式可以選擇。<br />
            這些周邊是我們對「樂觀」的一種具象化。
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {MERCH_ITEMS.map((item, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-neutral-800/40 rounded-xl p-5 border border-white/5 hover:border-white/15 transition-colors text-center h-full flex flex-col items-center">
                <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center mb-4 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-w-[56px] max-h-[56px] object-contain"
                  />
                </div>
                <p className="text-white/80 font-medium text-sm mb-1" lang="zh-TW">{item.name}</p>
                <p className="text-white/40 text-xs" lang="zh-TW">{item.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== VOLUNTEER & JOIN ==================== */}
      <Section dark={false}>
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-black mb-6" lang="zh-TW">加入我們</h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8" lang="zh-TW">
              如果你喜歡策展、舞台、內容、企劃或單純喜歡把人聚在一起，<br />
              歡迎加入 TEDxXinyi 的志工團隊。<br />
              我們正在尋找願意一起發想、一起搬椅子、一起收場的夥伴。
            </p>
          </FadeIn>
          <FadeIn delay={250}>
            <button
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: TED_RED, color: 'white' }}
              lang="zh-TW"
            >
              填寫志工表單
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </FadeIn>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
