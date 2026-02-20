'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';
import { useLanguage } from '../../hooks/useLanguage';
import { useParallax } from '../../hooks/useParallax';

const en = {
  breadcrumb: ['Home', 'Services', 'Public Relations'],
  label: 'Public Relations',
  h1: 'Earn Credibility That Converts',
  intro: 'Positive, credible media exposure fortifies brand reputation and fuels commercial results. As Hong Kong\'s integrated PR agency, Radiance PR engineers strategic communication ecosystems—precision news angles, nurtured media ties, narrative mastery—that position your stories for peak impact in top outlets. We view PR as an ongoing trust accelerator, not just press releases.',

  earnedH2: 'Why Earned Media Matter',
  earnedStat: '92% of global consumers trust earned media—like recommendations and vetted coverage—above all advertising',
  earnedSource: 'Nielsen Global Trust in Advertising Report, 2012',

  roiH2: 'Why Strategic PR Delivers ROI',
  roiIntro: 'Earned media outshines paid channels with third-party credibility—when journalists vet and amplify your brand, audiences trust it 3× more. Our integrated PR approach creates a flywheel: coverage fuels events, social proof, and sales conversations.',
  roiBullets: [
    'Reaches new audiences via journalists\' networks, introducing your brand with instant legitimacy.',
    'Compounds through trusted relationships—media who know your story cover you repeatedly.',
    'Shapes perception at critical moments (launches, crises, leadership shifts) via precise framing.',
    'Amplifies every channel: Press clips boost event RSVPs, social shares, and KOL partnerships.',
  ],

  servicesH2: 'Our Integrated PR Services',
  services: [
    {
      title: 'Communication Strategy',
      desc: 'Deep-dive brand positioning → audience mapping → PR objectives → killer news angles → targeted media network → real-time optimisation.',
    },
    {
      title: 'Media Relations',
      desc: 'Proactive engagement: Understand journalist needs, deliver exclusive value, secure sustained positive coverage.',
    },
    {
      title: 'Press Releases',
      desc: 'News-worthy, concise copy tailored to media demands. Precision timing + multi-channel distribution for peak pickup.',
    },
    {
      title: 'Media Interviews',
      desc: 'Curated invites with exclusive angles—build rapport, lock in favourable features.',
    },
    {
      title: 'Media Pitching & Publicity',
      desc: 'Impactful placements elevating trust, affinity, and sales velocity.',
    },
    {
      title: 'Executive Thought Leadership',
      desc: 'Position C-suite as industry voices via key outlet interviews—boost awareness, favourability, and market leadership.',
    },
  ],

  eventsH2: 'High-Impact PR Events',
  events: [
    {
      title: 'Press Conferences',
      desc: 'Orchestrate announcements that command attention from media and stakeholders.',
    },
    {
      title: 'Product Launches',
      desc: 'Memorable unveilings that generate buzz, coverage, and immediate market traction.',
    },
    {
      title: 'Media Luncheons',
      desc: 'Intimate briefings fostering relationships, exclusive access, and ongoing advocacy.',
    },
    {
      title: 'Media Preview Tours',
      desc: 'Immersive experiences—facilities, products—yielding deeper, more favourable stories.',
    },
  ],

  ctaH2: '92% trust edge awaits.',
  ctaSub: 'Partner with us.',
  ctaBtn1: 'Book a Free Consultation',
  ctaBtn2: 'See Our Work',
};

const zh = {
  breadcrumb: ['首頁', '服務', '公共關係'],
  label: '公共關係',
  h1: '建立帶動業績的公信力',
  intro: '正面、具公信力的媒體曝光能鞏固品牌聲譽，並推動商業成果。作為香港整合公關機構，Radiance PR 打造策略性傳播生態系統——精準新聞角度、深耕媒體關係、敘事掌控力——讓您的故事在頂尖媒體取得最大影響力。我們視公關為持續的信任加速器，而非單純的新聞稿。',

  earnedH2: '為何自然媒體報道至關重要',
  earnedStat: '92% 的全球消費者對自然媒體的信任度——如口碑推薦及媒體報道——高於一切廣告形式',
  earnedSource: '尼爾森全球廣告信任度報告，2012年',

  roiH2: '為何策略性公關能帶來投資回報',
  roiIntro: '自然媒體憑藉第三方公信力，遠勝付費渠道——當記者審核並放大您的品牌時，受眾信任度提升 3 倍。我們的整合公關方法創造飛輪效應：媒體報道帶動活動、社交口碑及銷售對話。',
  roiBullets: [
    '透過記者網絡觸達新受眾，以即時公信力引介您的品牌。',
    '透過信任關係複利增長——熟悉您故事的媒體會持續報道。',
    '在關鍵時刻（發布、危機、領導層更替）以精準框架塑造形象。',
    '放大各渠道效能：媒體報道提升活動回應率、社交分享及 KOL 合作效益。',
  ],

  servicesH2: '我們的整合公關服務',
  services: [
    {
      title: '傳播策略',
      desc: '深入品牌定位 → 受眾分析 → 公關目標 → 強力新聞角度 → 精準媒體網絡 → 實時優化。',
    },
    {
      title: '媒體關係',
      desc: '主動出擊：了解記者需求，提供獨家價值，贏取持續正面報道。',
    },
    {
      title: '新聞稿',
      desc: '具新聞價值、簡潔有力的文案，貼合媒體需求。精準時機配合多渠道發布，最大化採用率。',
    },
    {
      title: '媒體訪問',
      desc: '精心策劃獨家採訪邀約——建立信任，確保有利報道。',
    },
    {
      title: '媒體推廣及宣傳',
      desc: '高影響力的媒體佈局，提升公信力、品牌好感度及銷售速度。',
    },
    {
      title: '高管思想領導力',
      desc: '透過重點媒體訪問，將管理層定位為業界意見領袖——提升知名度、美譽度及市場地位。',
    },
  ],

  eventsH2: '高影響力公關活動',
  events: [
    {
      title: '新聞發布會',
      desc: '策劃能吸引媒體及持份者高度關注的重磅發布。',
    },
    {
      title: '產品發布活動',
      desc: '令人難忘的亮相，製造熱話、媒體報道及即時市場動力。',
    },
    {
      title: '媒體午宴',
      desc: '小型深度簡報會，培養關係、提供獨家資訊，建立持續倡議。',
    },
    {
      title: '媒體預覽參觀',
      desc: '沉浸式體驗——設施、產品——帶來更深入、更有利的報道。',
    },
  ],

  ctaH2: '92% 的信任優勢等待您把握。',
  ctaSub: '與我們攜手合作。',
  ctaBtn1: '預約免費諮詢',
  ctaBtn2: '瀏覽我們的作品',
};

export default function PublicRelationsServicePage() {
  const { lang } = useLanguage();
  const t = lang === 'zh' ? zh : en;
  const parallaxRef = useParallax(0.25);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">

        {/* Breadcrumb */}
        <section className="py-6 px-6">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: t.breadcrumb[0], href: '/vibe-demo/radiance' },
              { label: t.breadcrumb[1], href: '/vibe-demo/radiance/services' },
              { label: t.breadcrumb[2] },
            ]} />
          </div>
        </section>

        {/* Hero */}
        <section className="relative py-28 px-6 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div
              ref={parallaxRef}
              className="absolute inset-0 w-full h-[130%] -top-[15%] bg-cover bg-center will-change-transform"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1920&q=80)' }}
            />
            <div className="absolute inset-0 bg-slate-950/75" />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
              {t.label}
            </h1>
            <p className="text-xl md:text-2xl text-purple-300 font-medium mb-8">
              {t.h1}
            </p>
            <p className="text-lg text-white/80 leading-relaxed max-w-3xl font-light">
              {t.intro}
            </p>
          </div>
        </section>

        {/* Nielsen Trust Stat */}
        <section className="py-12 px-6 bg-purple-600">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <span className="text-6xl md:text-7xl font-black text-white flex-shrink-0">92%</span>
            <div>
              <p className="text-white text-xl md:text-2xl font-medium leading-snug mb-2">
                {t.earnedStat}
              </p>
              <p className="text-purple-200 text-sm">{t.earnedSource}</p>
            </div>
          </div>
        </section>

        {/* Why Earned Media */}
        <section className="py-20 px-6 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{t.earnedH2}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-3xl font-light">
              {t.roiIntro}
            </p>
            <ul className="space-y-5 max-w-3xl">
              {t.roiBullets.map((bullet, i) => (
                <li key={i} className="flex gap-4">
                  <span className="w-px bg-purple-400 dark:bg-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Our Services */}
        <section className="py-20 px-6 bg-slate-50 dark:bg-white/[0.03] border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">{t.servicesH2}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.services.map((service, i) => (
                <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 p-6 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PR Events */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">{t.eventsH2}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {t.events.map((event, i) => (
                <div key={i} className="flex gap-6 p-6 border border-slate-200 dark:border-slate-700/50 rounded-lg bg-white dark:bg-slate-800/60 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{event.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-slate-900 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                {t.ctaH2}
              </h2>
              <p className="text-2xl text-purple-400 font-light">{t.ctaSub}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <Link
                href="/vibe-demo/radiance/consultation"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-center whitespace-nowrap"
              >
                {t.ctaBtn1}
              </Link>
              <Link
                href="/vibe-demo/radiance/case-studies"
                className="px-6 py-3 border border-slate-600 hover:border-white text-slate-300 hover:text-white font-medium rounded-lg transition-colors text-center whitespace-nowrap"
              >
                {t.ctaBtn2}
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
