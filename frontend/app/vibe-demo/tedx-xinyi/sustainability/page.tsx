'use client';

import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_AMBER } from '../components';

const APPROACH_BLOCKS = [
  {
    title: '再製與再利用',
    text: '第一步，是承認「舞台可以被重複使用」這件事。\n我們開始設計可以拆解、重組的結構，\n讓上一屆留下來的物料，不是變成垃圾，而是下一個故事的起點。',
  },
  {
    title: '3D 列印燈具（與 Signify 合作）',
    text: '第二步，是和 Signify 合作，以 3D 列印技術製作燈具。\n這些燈不是大量生產的制式產品，而是專為 TEDxXinyi 舞台設計。\n3D 列印讓我們可以在減少浪費的前提下，\n做出既獨特、又能被反覆使用與維修的舞台光線。',
  },
  {
    title: '可回收與可持續材質',
    text: '第三步，是選擇可以被回收、再製或回到生活現場的材質。\n我們希望舞台結束之後，物料可以變成家具、展示架、或其他活動的一部分。\n舞台不只是被使用一次的「效果」，\n而是延伸進日常的長期存在。',
  },
];

export default function SustainabilityPage() {
  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/sustainability" heroMode />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden bg-neutral-900">
        <img
          src="/tedx-xinyi/hero-sustainability.webp"
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
            <SectionLabel dark>SUSTAINABILITY</SectionLabel>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 text-white" lang="zh-TW">
              年度大會舞台永續設計
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl" lang="zh-TW">
              我們想像一個舞台，不只是被搭起、拆掉，然後消失。<br />
              而是每一年都能被重新使用、改造，帶著前一屆的故事繼續長出新的樣子。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== PROBLEM STATEMENT ==================== */}
      <Section bg="white">
        <div className="max-w-3xl">
          <FadeIn>
            <SectionLabel>THE PROBLEM</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black mb-6" lang="zh-TW">
              為什麼要重新思考「用完就丟」？
            </h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-neutral-600 text-base sm:text-lg leading-[1.9]" lang="zh-TW">
              我們曾經習慣：一個活動結束，舞台就被拆掉，材料被丟棄。
              那是一種很方便、很理所當然的做法，
              也是對地球最昂貴的一種懶惰。
              如果我們真的在乎永續，就必須從最顯眼、也最容易被忽略的舞台開始。
            </p>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== IDEAS DEVELOPMENT ==================== */}
      <Section bg="warm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <FadeIn>
              <SectionLabel>IDEAS IN ACTION</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-black mb-6" lang="zh-TW">
                永續理念的發展
              </h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="text-neutral-600 text-base sm:text-lg leading-[1.9]" lang="zh-TW">
                每一屆 TEDxXinyi 年度大會，我們都在問：
                永續可以不只是口號嗎？
                從舞台設計到材料選擇，從合作夥伴到觀眾體驗，
                我們試著把永續變成一種看得見、摸得到的實踐。
                這支影片記錄了我們一路走來的思考與嘗試。
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={200}>
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-neutral-900 relative">
              <iframe
                src="https://www.youtube-nocookie.com/embed/-i9MntW94Bs?rel=0&modestbranding=1"
                title="TEDxXinyi — Sustainability Ideas Development"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
              <noscript>
                <a href="https://www.youtube.com/watch?v=-i9MntW94Bs" className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                  Watch on YouTube →
                </a>
              </noscript>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== THREE APPROACHES ==================== */}
      <Section bg="white">
        <FadeIn>
          <SectionLabel>OUR APPROACH</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black mb-14" lang="zh-TW">我們怎麼做？</h2>
        </FadeIn>

        <div className="space-y-6">
          {APPROACH_BLOCKS.map((block, i) => (
            <FadeIn key={block.title} delay={i * 80}>
              <div className="flex gap-8 md:gap-12 p-8 md:p-10 rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                {/* Step number */}
                <div className="flex-shrink-0 w-16 md:w-20">
                  <span
                    className="text-5xl md:text-6xl font-black leading-none select-none"
                    style={{ color: `${WARM_AMBER}40` }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-block text-xs font-black px-3 py-1 rounded-full mb-3"
                    style={{ backgroundColor: `${TED_RED}10`, color: TED_RED }}
                  >
                    STEP {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl md:text-2xl font-black mb-3" lang="zh-TW">{block.title}</h3>
                  <p className="text-neutral-500 text-sm sm:text-base leading-relaxed whitespace-pre-line" lang="zh-TW">
                    {block.text}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== WHY IT MATTERS — RED BAND ==================== */}
      <section className="py-20 md:py-28 text-white" style={{ backgroundColor: TED_RED }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-black mb-6" lang="zh-TW">這不只是舞台設計</h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/85 text-base sm:text-lg leading-[1.9]" lang="zh-TW">
              對我們來說，永續不是在 Keynote 上多放幾個綠色圖示，
              而是從最耗材、最顯眼、也最容易被忽略的地方開始改變。
              每一屆 TEDxXinyi 的舞台，都是一個對未來的提案。
              歡迎你走進來，一起成為這個提案的一部分。
            </p>
          </FadeIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
