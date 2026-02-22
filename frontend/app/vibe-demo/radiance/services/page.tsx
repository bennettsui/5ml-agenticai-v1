'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { useLanguage } from '../hooks/useLanguage';

export default function ServicesPage() {
  const { lang } = useLanguage();

  const services = [
    {
      title: lang === 'zh' ? '公關服務' : 'Public Relations',
      desc: lang === 'zh'
        ? '透過策略性傳播及紮實的媒體關係，贏得具公信力的媒體報導。'
        : 'Earn credible media coverage through strategic communications and strong media relationships.',
      longDesc: lang === 'zh'
        ? '我們建立真誠的媒體關係，並創作能引起共鳴的品牌敘事。無論是產品發佈、思想領袖定位，還是危機管理，我們都能帶來建立可信度的贏得媒體報導。'
        : 'We build authentic media relationships and craft narratives that resonate. Whether it\'s product launches, thought leadership, or crisis management, we deliver earned media that builds credibility.',
      icon: '📰',
      bgIcon: '✍️',
      href: '/vibe-demo/radiance/services/public-relations',
      benefits: lang === 'zh'
        ? ['媒體報導', '新聞稿', '媒體關係', '思想領袖定位']
        : ['Media coverage', 'Press releases', 'Media relations', 'Thought leadership']
    },
    {
      title: lang === 'zh' ? '活動策劃與體驗' : 'Events & Experiences',
      desc: lang === 'zh'
        ? '創造令人難忘的品牌時刻，與受眾深度連結，並激發社交媒體熱度。'
        : 'Create memorable brand moments that connect with audiences and generate social momentum.',
      longDesc: lang === 'zh'
        ? '從小型工作坊到大型論壇，我們設計並執行能真正帶動品牌氣勢的活動。每一個接觸點均經過精心編排，以放大您的品牌訊息。'
        : 'From intimate workshops to large-scale conferences, we design and execute events that create real momentum. Every touchpoint is orchestrated to amplify your brand message.',
      icon: '🎉',
      bgIcon: '🎪',
      href: '/vibe-demo/radiance/services/events',
      benefits: lang === 'zh'
        ? ['活動策略', '後勤管理', '現場製作', '活動後推廣']
        : ['Event strategy', 'Logistics management', 'Live production', 'Post-event amplification']
    },
    {
      title: lang === 'zh' ? '社交媒體及內容' : 'Social Media & Content',
      desc: lang === 'zh'
        ? '透過策略性內容及持續的社交媒體運營，建立活躍的品牌社群。'
        : 'Build engaged communities through strategic content and consistent social presence.',
      longDesc: lang === 'zh'
        ? '我們創作能引起共鳴並建立社群的內容。從每日貼文到深度長篇敘事，我們協助您保持與受眾的相關性與緊密聯繫。'
        : 'We create content that resonates and builds communities. From daily posts to long-form narratives, we help you stay relevant and connected with your audience.',
      icon: '📱',
      bgIcon: '💬',
      href: '/vibe-demo/radiance/services/social-media',
      benefits: lang === 'zh'
        ? ['內容日曆', '社群管理', '互動策略', '數據分析及報告']
        : ['Content calendars', 'Community management', 'Engagement strategy', 'Analytics & reporting']
    },
    {
      title: lang === 'zh' ? 'KOL與網紅行銷' : 'KOL & Influencer Marketing',
      desc: lang === 'zh'
        ? '透過受眾信賴的創作者，以真誠的品牌合作擴大影響力。'
        : 'Amplify reach through authentic partnerships with creators your audience trusts.',
      longDesc: lang === 'zh'
        ? '我們為您的品牌識別並合作最合適的聲音。不只是觸及率——而是真誠的契合，驅動真實的對話與轉化。'
        : 'We identify and partner with the right voices for your brand. Not just reach—authentic alignment that drives real conversations and conversions.',
      icon: '⭐',
      bgIcon: '👥',
      href: '/vibe-demo/radiance/services/kol-marketing',
      benefits: lang === 'zh'
        ? ['創作者識別', '洽談及合約', '活動管理', '成效追蹤']
        : ['Creator identification', 'Negotiation & contracts', 'Campaign management', 'Performance tracking']
    },
    {
      title: lang === 'zh' ? '創意製作' : 'Creative & Production',
      desc: lang === 'zh'
        ? '專業的設計、影片及內容製作，將創意構思化為現實。'
        : 'Professional design, video, and content production that brings ideas to life.',
      longDesc: lang === 'zh'
        ? '我們的內部創意團隊製作從精美視覺到引人入勝的影片內容。交付迅速、品質穩定、創意全程把控。'
        : 'Our in-house creative team produces everything from stunning visuals to compelling video content. Fast turnarounds, consistent quality, full creative control.',
      icon: '🎨',
      bgIcon: '🎬',
      href: '/vibe-demo/radiance/services/creative-production',
      benefits: lang === 'zh'
        ? ['平面設計', '影片製作', '攝影', '內容創作']
        : ['Graphic design', 'Video production', 'Photography', 'Content creation']
    },
    {
      title: lang === 'zh' ? '整合宣傳活動' : 'Integrated Campaigns',
      desc: lang === 'zh'
        ? '所有渠道協同運作，讓每個接觸點相互強化。'
        : 'All channels working together so each touchpoint reinforces the others.',
      longDesc: lang === 'zh'
        ? '這正是我們的優勢所在。我們將公關、活動、內容及創意製作融入凝聚的宣傳活動。每個渠道放大其他渠道的成效，創造出遠超各部分總和的整體動能。'
        : 'This is where our strength shines. We weave PR, events, content, and creative into cohesive campaigns. Each channel amplifies the others, creating momentum that\'s greater than the sum of its parts.',
      icon: '🎯',
      bgIcon: '🚀',
      href: '/vibe-demo/radiance/consultation',
      benefits: lang === 'zh'
        ? ['策略制定', '跨渠道執行', '投資回報優化', '成效指標']
        : ['Strategy development', 'Cross-channel execution', 'ROI optimization', 'Performance metrics']
    }
  ];

  return (
    <main className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      {/* Breadcrumb */}
      <section className="py-3 px-6 border-b border-slate-200 dark:border-slate-800 pt-24">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[
            { label: lang === 'zh' ? '首頁' : 'Home', href: '/vibe-demo/radiance' },
            { label: lang === 'zh' ? '服務' : 'Services' }
          ]} />
        </div>
      </section>

      {/* Hero */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
            {lang === 'zh' ? '我們的服務' : 'Our Services'}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            {lang === 'zh'
              ? '橫跨公關、活動、數碼及創意的整合方案。我們不只執行戰術——我們統籌策略，為您的品牌建立真正的發展動能。'
              : 'Integrated solutions across PR, events, digital, and creative. We don\'t just execute tactics—we orchestrate strategies that build real momentum for your brand.'}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <Link
                key={idx}
                href={service.href}
                className="group h-full"
              >
                <div className="h-full p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xl dark:hover:shadow-purple-900/20 transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl group-hover:scale-110 transition-transform">
                      {service.icon}
                    </div>
                    <div className="text-4xl opacity-40 group-hover:opacity-60 transition-opacity">
                      {service.bgIcon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-5 text-sm">
                    {service.longDesc}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {service.benefits.slice(0, 2).map((benefit, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                    {service.benefits.length > 2 && (
                      <span className="text-xs px-3 py-1 text-slate-500 dark:text-slate-400">
                        {lang === 'zh' ? `+${service.benefits.length - 2} 項更多` : `+${service.benefits.length - 2} more`}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Integrated Approach */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-12 text-center">
            {lang === 'zh' ? '為何整合方案更有效' : 'Why Integrated Matters'}
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: lang === 'zh' ? '每個渠道放大其他渠道的成效' : 'Each channel amplifies the others',
                desc: lang === 'zh'
                  ? '媒體報導帶動社交媒體討論。活動創造內容素材。內容成為贏得媒體的機會。這是倍增效應，而非單純疊加。'
                  : 'A press mention drives social conversation. An event creates content. Content becomes earned media. This is multiplication, not addition.',
                icon: '🔄'
              },
              {
                title: lang === 'zh' ? '在每個接觸點傳遞一致的品牌故事' : 'Consistent narrative across touchpoints',
                desc: lang === 'zh'
                  ? '您的受眾在每處都聽到同一個故事——公關、社交媒體、活動、電子報。這種重複建立品牌記憶與信任。'
                  : 'Your audience hears the same story everywhere—PR, social, events, email. This repetition builds recall and trust.',
                icon: '🎯'
              },
              {
                title: lang === 'zh' ? '高效善用資源' : 'Efficient resource use',
                desc: lang === 'zh'
                  ? '一個宣傳活動帶動多個渠道。我們以最少的浪費實現最大的影響。您的預算能發揮更大價值。'
                  : 'One campaign fuels multiple channels. We maximize impact while minimizing waste. Your budget goes further.',
                icon: '⚡'
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-6xl mb-4 opacity-80">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {lang === 'zh' ? '準備好討論您的挑戰了嗎？' : 'Ready to discuss your challenge?'}
          </h2>
          <p className="text-xl text-purple-100 mb-8 leading-relaxed">
            {lang === 'zh'
              ? '讓我們探討哪些服務最切合您的目標。無任何義務——只是一次關於可能性的對話。'
              : 'Let\'s explore which services fit your goals. No obligation—just a conversation about what\'s possible.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vibe-demo/radiance/consultation"
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
            >
              {lang === 'zh' ? '預約諮詢 →' : 'Schedule Consultation →'}
            </Link>
            <Link
              href="/vibe-demo/radiance/contact"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
            >
              {lang === 'zh' ? '立即聯絡' : 'Get in Touch'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
