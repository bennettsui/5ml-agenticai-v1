'use client';

import Link from 'next/link';
import { SiteNav, SiteFooter, Section, FadeIn, globalStyles, TED_RED } from '../components';

const TIMELINE = [
  {
    year: '2020',
    title: '「續美學」活動',
    link: 'https://tedxxinyi.com/2020%e7%ba%8c%e7%be%8e%e5%ad%b8%e6%b4%bb%e5%8b%95/',
    text: '從『續』開始想像美學：美不只是結果，而是與生活長期相處的方式。',
  },
  {
    year: '2021',
    title: '「樂觀」與永續舞台實驗',
    link: 'https://tedxxinyi.com/%e5%b9%b4%e5%ba%a6%e5%a4%a7%e6%9c%83%e8%88%9e%e5%8f%b0%e6%b0%b8%e7%ba%8c%e8%a8%ad%e8%a8%88/',
    text: '我們從『使用完就丟』的習慣出發，重新想像舞台可以被再利用多少次。',
  },
  {
    year: '2022',
    title: '城市與日常的延伸實驗',
    link: null,
    text: null,
  },
];

const APPROACH_BULLETS = [
  '從城市出發：每一屆主題，都先問一個跟信義有關的問題。',
  '跨領域共創：邀請來自設計、科技、飲食、教育、藝術的講者與夥伴。',
  '永續思維：舞台、物料與合作模式，都盡量延長使用壽命。',
  '社群優先：不只是一天的大會，而是一群人之間持續的對話。',
];

const TEAM_ROLES = [
  '策展', '視覺設計', '空間設計', '內容編輯', '營運', '策展',
];

export default function AboutPage() {
  return (
    <div className="tedx-xinyi bg-neutral-950 text-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/about" />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://tedxxinyi.com/wp-content/uploads/2021/07/%E7%AD%96%E5%B1%95%E7%89%B9%E9%82%801-e1627375985885.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.3) saturate(0.6)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 pt-32">
          <FadeIn>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6" lang="zh-TW">
              關於 TEDxXinyi
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-4 max-w-2xl" lang="zh-TW">
              一個在台北信義發生的 TEDx 活動，<br />
              也是一群人在城市裡練習樂觀、討論未來的長期計畫。
            </p>
          </FadeIn>
          <FadeIn delay={350}>
            <p className="text-white/40 text-sm italic" lang="en">
              TEDxXinyi is an independently organized TEDx event in Taipei&apos;s Xinyi District, created by a team of optimists, curators and city-lovers.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== WHAT IS TEDx ==================== */}
      <Section dark={false}>
        <div className="max-w-3xl">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-black mb-6" lang="zh-TW">什麼是 TEDx？</h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed" lang="zh-TW">
              TEDx 是由在地社群自發策劃的 TED 形式活動，<br />
              在 TED 授權下，由志工團隊自主策展、邀請講者，<br />
              把值得分享的想法帶進一座城市。
            </p>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== WHY XINYI ==================== */}
      <Section>
        <div className="max-w-3xl">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-black mb-6" lang="zh-TW">為什麼在信義？</h2>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed" lang="zh-TW">
              信義是一個速度很快、資訊很密集的地方。<br />
              在這裡，購物中心、金融機構、夜生活和通勤日常重疊在一起。<br />
              我們相信，這也是最適合暫停一下、好好說話與聆聽的地方。<br />
              TEDxXinyi 想在這個象徵資本與慣性的區域，練習一種不那麼犬儒的樂觀。
            </p>
          </FadeIn>
        </div>
      </Section>

      {/* ==================== OUR APPROACH ==================== */}
      <Section dark={false}>
        <div className="max-w-3xl">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-black mb-8" lang="zh-TW">我們怎麼策展？</h2>
          </FadeIn>
          <ul className="space-y-5">
            {APPROACH_BULLETS.map((bullet, i) => (
              <FadeIn key={i} delay={i * 100}>
                <li className="flex gap-4 items-start">
                  <span
                    className="mt-2 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TED_RED }}
                  />
                  <p className="text-white/60 text-base leading-relaxed" lang="zh-TW">{bullet}</p>
                </li>
              </FadeIn>
            ))}
          </ul>
        </div>
      </Section>

      {/* ==================== TIMELINE ==================== */}
      <Section>
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-black mb-12" lang="zh-TW">歷屆主題與活動</h2>
        </FadeIn>

        <div className="space-y-0">
          {TIMELINE.map((item, i) => (
            <FadeIn key={item.year} delay={i * 120}>
              <div className="flex gap-6 md:gap-10 pb-10 relative">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: TED_RED }}
                  />
                  {i < TIMELINE.length - 1 && (
                    <div className="w-[1px] flex-1 bg-white/10 mt-2" />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <p className="text-white/30 text-sm font-mono mb-1">{item.year}</p>
                  <h3 className="text-lg font-bold mb-2" lang="zh-TW">
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: TED_RED }}
                      >
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  {item.text && (
                    <p className="text-white/50 text-sm leading-relaxed" lang="zh-TW">{item.text}</p>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ==================== TEAM ==================== */}
      <Section dark={false}>
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-black mb-4" lang="zh-TW">策展與設計團隊</h2>
          <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-10" lang="zh-TW">
            一群來自不同領域的人，在信義共同策畫這場長期的實驗。
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {TEAM_ROLES.map((role, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-neutral-800/40 rounded-xl p-5 text-center border border-white/5 hover:border-white/15 transition-colors">
                <div className="w-14 h-14 rounded-full bg-neutral-700/50 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white/30 text-xs">Photo</span>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1" lang="zh-TW">姓名</p>
                <p className="text-white/40 text-xs" lang="zh-TW">{role}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
