'use client';

import Link from 'next/link';
import { Newspaper, Sparkles, Smartphone, Star, Palette, Target } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RadianceLogo } from './components/RadianceLogo';
import { ServicesShowcase } from './components/ServicesShowcase';
import { useLanguage } from './hooks/useLanguage';

export default function RadiancePage() {
  const { lang } = useLanguage();

  return (
    <main id="main-content" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 bg-white dark:bg-slate-950 relative overflow-hidden">
        {/* Subtle background gradients */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-300 dark:bg-purple-900/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 -left-48 w-80 h-80 bg-slate-300 dark:bg-slate-800/30 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-12 inline-block">
            <RadianceLogo variant="text" size="md" />
          </div>
          <h1 className="text-7xl md:text-8xl font-bold mb-8 leading-tight text-slate-900 dark:text-white">
            {lang === 'zh' ? (
              <>讓您的品牌<br className="hidden md:block" />成為市場焦點</>
            ) : (
              <>Make Your Brand<br className="hidden md:block" />Impossible to Ignore</>
            )}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-16 leading-relaxed max-w-2xl mx-auto font-light">
            {lang === 'zh'
              ? '策略與執行並重。我們整合公關、活動及數碼渠道，為您的品牌在香港建立真正的市場動力。'
              : 'Strategy meets execution. We orchestrate PR, events, and digital to build real momentum for your brand in Hong Kong.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/vibe-demo/radiance/consultation"
              className="px-8 py-3 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-medium rounded-none hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300 text-lg"
            >
              {lang === 'zh' ? '免費諮詢' : 'Free Consultation'}
            </Link>
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="px-8 py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-none hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white transition-all duration-300 text-lg"
            >
              {lang === 'zh' ? '瀏覽我們的作品' : 'See Our Work'}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust/Credibility Strip */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-500 dark:text-slate-500 mb-12 text-sm uppercase tracking-wide font-medium">
            {lang === 'zh' ? '深受各行業領先品牌信賴' : 'Trusted by leading brands across sectors'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center text-xs font-medium text-slate-700 dark:text-slate-300 tracking-wide">
            {(lang === 'zh'
              ? [
                  '消費品及生活品味',
                  '科技',
                  '非牟利及社會影響',
                  '文化藝術機構',
                  '金融服務',
                  '教育'
                ]
              : [
                  'Consumer & Lifestyle',
                  'Technology',
                  'NGOs & Social Impact',
                  'Cultural Institutions',
                  'Financial Services',
                  'Education'
                ]
            ).map((item) => (
              <div key={item}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <ServicesShowcase />

      {/* Services Overview */}
      <section id="services" className="py-32 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
              {lang === 'zh' ? '我們的服務' : 'Our Services'}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {lang === 'zh'
                ? '橫跨公關、活動、數碼及創意的整合解決方案'
                : 'Integrated solutions across PR, events, digital, and creative'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(lang === 'zh'
              ? [
                  {
                    title: '公關服務',
                    desc: '透過策略性傳播及深厚的媒體關係，為品牌贏得具公信力的媒體報道。',
                    icon: Newspaper,
                    href: '/vibe-demo/radiance/services/public-relations'
                  },
                  {
                    title: '活動及體驗',
                    desc: '創造令人難忘的品牌時刻，與受眾建立真實連結，並激發社交媒體的自然傳播。',
                    icon: Sparkles,
                    href: '/vibe-demo/radiance/services/events'
                  },
                  {
                    title: '社交媒體及內容',
                    desc: '透過策略性內容創作及持續的社交媒體運營，建立具黏性的品牌社群。',
                    icon: Smartphone,
                    href: '/vibe-demo/radiance/services/social-media'
                  },
                  {
                    title: 'KOL 及意見領袖行銷',
                    desc: '與受眾信任的內容創作者建立真誠的合作關係，有效擴大品牌觸及。',
                    icon: Star,
                    href: '/vibe-demo/radiance/services/kol-marketing'
                  },
                  {
                    title: '創意及製作',
                    desc: '專業的設計、影片及內容製作，將品牌創意概念化為精彩作品。',
                    icon: Palette,
                    href: '/vibe-demo/radiance/services/creative-production'
                  },
                  {
                    title: '整合推廣活動',
                    desc: '各渠道協同運作，讓每一個接觸點相互強化，發揮最大合力效應。',
                    icon: Target,
                    href: '/vibe-demo/radiance/lead-gen'
                  }
                ]
              : [
                  {
                    title: 'Public Relations',
                    desc: 'Earn credible media coverage through strategic communications and strong media relationships.',
                    icon: Newspaper,
                    href: '/vibe-demo/radiance/services/public-relations'
                  },
                  {
                    title: 'Events & Experiences',
                    desc: 'Create memorable brand moments that connect with audiences and generate social momentum.',
                    icon: Sparkles,
                    href: '/vibe-demo/radiance/services/events'
                  },
                  {
                    title: 'Social Media & Content',
                    desc: 'Build engaged communities through strategic content and consistent social presence.',
                    icon: Smartphone,
                    href: '/vibe-demo/radiance/services/social-media'
                  },
                  {
                    title: 'KOL & Influencer Marketing',
                    desc: 'Amplify reach through authentic partnerships with creators your audience trusts.',
                    icon: Star,
                    href: '/vibe-demo/radiance/services/kol-marketing'
                  },
                  {
                    title: 'Creative & Production',
                    desc: 'Professional design, video, and content production that brings ideas to life.',
                    icon: Palette,
                    href: '/vibe-demo/radiance/services/creative-production'
                  },
                  {
                    title: 'Integrated Campaigns',
                    desc: 'All channels working together so each touchpoint reinforces the others.',
                    icon: Target,
                    href: '/vibe-demo/radiance/lead-gen'
                  }
                ]
            ).map((service, idx) => (
              <Link
                key={idx}
                href={service.href}
                className="group p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xl dark:hover:shadow-purple-900/20 transition-all"
              >
                <service.icon className="w-12 h-12 mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Radiance */}
      <section className="py-24 px-6 bg-gradient-to-br from-purple-950 to-purple-900 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold mb-16 text-center">
            {lang === 'zh' ? '為何選擇 Radiance' : 'Why Work with Radiance'}
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {(lang === 'zh'
              ? [
                  {
                    title: '整合設計理念',
                    desc: '我們將公關、活動與數碼渠道整合為一套統一策略，讓各渠道相互賦能，而非各自為政。'
                  },
                  {
                    title: '親力親為的執行',
                    desc: '我們不只提供策略建議便消失。我們的團隊親自處理媒體關係、統籌活動、製作內容——我們對成果負責到底。'
                  },
                  {
                    title: '多元跨界經驗',
                    desc: '我們曾服務商業品牌、非牟利機構、文化藝術團體及社會企業，這份廣度令每個項目都受益良多。'
                  },
                  {
                    title: '內部創意團隊',
                    desc: '影片製作、設計及內容管理均由內部團隊負責，確保速度、一致性與創意主導權均掌握在您手中。'
                  }
                ]
              : [
                  {
                    title: 'Integrated by Design',
                    desc: 'We orchestrate PR, events, and digital as one strategy. Each channel amplifies the others instead of working in isolation.'
                  },
                  {
                    title: 'Hands-On Execution',
                    desc: "We're not strategists who disappear. Our team manages media relations, produces events, creates content—we own the outcomes."
                  },
                  {
                    title: 'Hybrid Experience',
                    desc: "We've worked with commercial brands, NGOs, cultural institutions, and social enterprises. That breadth informs every project."
                  },
                  {
                    title: 'In-House Creative',
                    desc: 'We produce video, design assets, and manage content internally. You get speed, consistency, and creative control.'
                  }
                ]
            ).map((item, idx) => (
              <div key={idx} className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-purple-100 leading-relaxed text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Highlight */}
      <section id="cases" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {lang === 'zh' ? '成果自會說話' : 'Results That Speak'}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {lang === 'zh'
                ? '推動真實業務成效的整合推廣活動'
                : 'Integrated campaigns that drive real business outcomes'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {(lang === 'zh'
              ? [
                  {
                    title: '龍虎山生態保育',
                    challenge: '為環境教育項目建立社會認知',
                    result: '逾 80 篇自然媒體報道，獲主流媒體重點刊登',
                    href: '/vibe-demo/radiance/case-studies/lung-fu-shan'
                  },
                  {
                    title: '2025 年威尼斯建築雙年展',
                    challenge: '為香港建築展覽進行國際公關推廣',
                    result: '香港館獲全球媒體廣泛報道',
                    href: '/vibe-demo/radiance/case-studies/venice-biennale-hk'
                  },
                  {
                    title: 'Her Own Words Sport',
                    challenge: '為香港首個提供 17 款亞洲尺碼的運動服品牌進行品牌發布',
                    result: '逾 40 篇媒體報道，刊登於 Marie Claire、Elle、Cosmopolitan',
                    href: '/vibe-demo/radiance/case-studies/her-own-words-sport'
                  }
                ]
              : [
                  {
                    title: 'Lung Fu Shan Conservation',
                    challenge: 'Build awareness for environmental education initiative',
                    result: '80+ earned media placements, featured in top-tier outlets',
                    href: '/vibe-demo/radiance/case-studies/lung-fu-shan'
                  },
                  {
                    title: 'Venice Biennale 2025',
                    challenge: 'International PR for Hong Kong Architecture Exhibition',
                    result: 'Global media coverage for prestigious architecture biennial',
                    href: '/vibe-demo/radiance/case-studies/venice-biennale-hk'
                  },
                  {
                    title: 'Her Own Words Sport',
                    challenge: "Launch Hong Kong's first sportswear brand with 17 Asian sizing options",
                    result: '40+ media placements in Marie Claire, Elle, Cosmopolitan',
                    href: '/vibe-demo/radiance/case-studies/her-own-words-sport'
                  }
                ]
            ).map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="group p-8 bg-gradient-to-br from-purple-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-500 transition-all block"
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  <span className="font-semibold">{lang === 'zh' ? '挑戰：' : 'Challenge:'}</span> {item.challenge}
                </p>
                <p className="text-purple-600 dark:text-purple-400 font-semibold">
                  ✓ {item.result}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              {lang === 'zh' ? '查看所有成功案例 →' : 'View All Case Studies →'}
            </Link>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-16 text-center">
            {lang === 'zh' ? '我們的工作流程' : 'Our Process'}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {(lang === 'zh'
              ? [
                  {
                    step: '01',
                    title: '探索',
                    desc: '我們從您的挑戰與目標出發，透過工作坊及深入研究，梳理敘事機遇，並確定最能推動成效的渠道組合。'
                  },
                  {
                    step: '02',
                    title: '規劃',
                    desc: '我們制定整合策略，將公關、活動、內容及合作夥伴關係編織成一套連貫的品牌敘事。執行前，您將看到完整的推進路線圖。'
                  },
                  {
                    step: '03',
                    title: '執行',
                    desc: '我們的團隊跨渠道全面執行——媒體推廣、活動製作、內容創作、夥伴合作。我們實時追蹤成效，並靈活因應調整策略。'
                  }
                ]
              : [
                  {
                    step: '01',
                    title: 'Discover',
                    desc: 'We start with your challenge and goals. Through workshops and research, we map narrative opportunities and identify which channels will move the needle.'
                  },
                  {
                    step: '02',
                    title: 'Design',
                    desc: 'We develop an integrated strategy weaving together PR, events, content, and partnerships into a coherent narrative. You see the full roadmap before execution begins.'
                  },
                  {
                    step: '03',
                    title: 'Deliver',
                    desc: 'Our team executes across all channels—media outreach, event production, content creation, partnerships. We track results and adapt in real time.'
                  }
                ]
            ).map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -top-8 left-0 w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                  {item.step}
                </div>
                <div className="pt-12 p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-16 text-center">
            {lang === 'zh' ? '客戶如何評價我們' : 'What Our Clients Say'}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {(lang === 'zh'
              ? [
                  {
                    quote: 'Radiance 徹底改變了我們對整合行銷的思維方式。公關工作切實帶動了活動出席率，內容創作亦獲媒體主動採用。整個體系環環相扣，成效顯著。',
                    author: '市場推廣總監',
                    company: '科技初創企業'
                  },
                  {
                    quote: '短短六個月，我們從一個名不見經傳的品牌，蛻變為業界公認的思想領袖。團隊專業、反應迅速，切實兌現每一個承諾。',
                    author: '創辦人',
                    company: 'SaaS 企業'
                  }
                ]
              : [
                  {
                    quote: 'Radiance transformed how we think about integrated marketing. The PR actually drives event attendance, the content gets picked up by media. It works.',
                    author: 'Marketing Director',
                    company: 'Tech Startup'
                  },
                  {
                    quote: 'We went from completely unknown to being recognized as an industry thought leader in 6 months. The team is professional, responsive, and actually delivers.',
                    author: 'Founder',
                    company: 'SaaS Company'
                  }
                ]
            ).map((testimonial, idx) => (
              <div key={idx} className="p-8 bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-lg italic mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            {lang === 'zh' ? '準備好推動品牌向前邁進？' : 'Ready to Move Your Brand Forward?'}
          </h2>
          <p className="text-2xl text-purple-100 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '讓我們一同探討您的下一個挑戰。無論是整合推廣活動、品牌形象提升，還是市場拓展，我們隨時候命。'
              : "Let's discuss your next challenge. Whether it's a campaign, reputation shift, or market entry—we're here to help."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vibe-demo/radiance/lead-gen"
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors text-lg"
            >
              {lang === 'zh' ? '預約免費諮詢 →' : 'Schedule Your Free Session →'}
            </Link>
            <Link
              href="/vibe-demo/radiance/contact"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-lg"
            >
              {lang === 'zh' ? '聯絡我們' : 'Get in Touch'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
