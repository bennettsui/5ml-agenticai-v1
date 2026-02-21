'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { useLanguage } from '../hooks/useLanguage';
import { useParallax } from '../hooks/useParallax';

export default function RadianceAboutPage() {
  const { lang } = useLanguage();
  const parallaxRef = useParallax(0.25);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-3 px-6">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: lang === 'zh' ? '首頁' : 'Home', href: '/vibe-demo/radiance' },
              { label: lang === 'zh' ? '關於我們' : 'About' }
            ]} />
          </div>
        </section>

      {/* Hero Intro */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Hero background */}
        <div className="absolute inset-0 z-0">
          <div
            ref={parallaxRef}
            className="absolute inset-0 w-full h-[130%] -top-[15%] bg-cover bg-center will-change-transform"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=80)' }}
          />
          <div className="absolute inset-0 bg-slate-950/75" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight">
              {lang === 'zh' ? '關於Radiance' : 'About Radiance'}
            </h1>
            <p className="text-lg text-white leading-relaxed">
              {lang === 'zh'
                ? 'Radiance PR & Martech Limited 是一家立足香港的綜合市場傳播機構，將公共關係、活動策劃、社交媒體、KOL行銷及創意製作融為一體，為品牌、非政府組織、文化機構及社區項目提供度身訂造的傳播方案。我們相信策略必須有紮實執行為後盾，以贏得媒體報導為核心，並以真誠協作為基礎。每一個宣傳活動均以帶來可量化的成效、重塑品牌形象及鞏固聲譽為目標，切實回應數碼優先時代日趨複雜的傳播環境。'
                : 'Radiance PR & Martech Limited is a Hong Kong-based integrated marketing communications agency that combines public relations, events, social media, KOL marketing, and creative production into cohesive solutions for brands, NGOs, cultural institutions, and community initiatives. We believe in tailored strategies backed by hands-on execution, earned media expertise, and genuine collaboration. Every campaign is designed to deliver measurable value, reshape perceptions, and strengthen reputations in an increasingly complex digital-first landscape.'}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          {lang === 'zh' ? '我們的故事' : 'Our story'}
        </h2>
        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            {lang === 'zh'
              ? 'Radiance 以一站式綜合市場傳播機構的定位在香港成立，以公共關係、內容創作、數碼行銷及活動管理為業務根基。自成立之初，我們便清楚認識到，公關、活動與社交媒體各自為政的片段式傳播，往往難以為客戶帶來預期成效。我們決心改變這一局面，將所有專業範疇整合於同一屋簷下，以贏得媒體策略為主導，輔以紮實的執行能力。'
              : 'Radiance was created as a one-stop integrated marketing communications agency in Hong Kong, built on a strong foundation in public relations, content creation, digital marketing and event management. From the outset, we recognised that fragmented communications—where PR, events and social media operated in silos—rarely delivered the impact our clients needed. We set out to change that by bringing all these disciplines under one roof, led by earned media strategy and backed by real execution expertise.'}
          </p>
          <p>
            {lang === 'zh' ? (
              <>
                多年來，我們的團隊已超越傳統公關與活動的框架，發展成真正的混合型機構。時至今日，我們的業務涵蓋KOL行銷、創意設計及數碼製作，同時始終以贏得媒體報導作為工作核心。我們遵循{' '}
                <a href="https://www.hkprca.org.hk/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">香港公關顧問商會（HKPRCA）</a>
                {' '}訂立的專業標準，致力在業界推廣最佳傳播實踐。我們曾與藝術畫廊、文化機構、非政府組織、政府部門、教育機構、科技及時尚品牌、酒店集團、金融服務公司及消費生活品牌攜手合作。在每一個行業，我們均深刻體會到：最具感染力的宣傳活動，必須將策略思維與實踐知識融會貫通——不僅懂得說什麼，更懂得如何透過媒體關係、活動統籌、內容日曆及創意製作，將構思化為現實。
              </>
            ) : (
              <>
                Over the years, our team has evolved beyond traditional PR and events into a genuinely hybrid model. Today we cover KOL marketing, creative design and digital production, while keeping earned media at the heart of our work. We operate to the professional standards set by the{' '}
                <a href="https://www.hkprca.org.hk/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Hong Kong Public Relations Consultants Association (HKPRCA)</a>
                {', which promotes best practice in communications across the industry. We\'ve partnered'} with art galleries and cultural organisations, NGOs and government bodies, educational institutions, technology and fashion brands, hospitality groups, financial services firms, and consumer lifestyle brands. In every sector, we've learned that the most compelling campaigns blend strategic thinking with practical know-how—understanding not just what to say, but how to make it real through media relationships, event logistics, content calendars, and creative production.
              </>
            )}
          </p>
          <p>
            {lang === 'zh'
              ? '我們的使命清晰直接：透過創新的行銷及傳播策略，賦能品牌與機構建立有意義的聯繫，創造深遠的影響。我們致力提升客戶的線上及線下曝光度，協助他們建立信任、深化與持份者的關係，並有效地塑造目標市場的態度與行為。'
              : 'Our mission is straightforward: to empower brands and organisations through innovative marketing and communication strategies that foster meaningful connections and drive impactful results. We aim to increase both online and offline presence, helping our clients build trust, foster robust stakeholder relationships, and effectively shape attitudes and behaviours in their markets.'}
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          {lang === 'zh' ? '我們的服務' : 'What we do'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          {lang === 'zh' ? (
            <>
              Radiance 以一支整合團隊運作，而非各自獨立的部門組合。無論您需要新聞發佈會、社交媒體內容日曆、
              <Link href="/vibe-demo/radiance/services/kol-marketing" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">KOL種子策略</Link>
              {' '}還是完整品牌宣傳活動，我們都能將所有環節緊密連結，讓各項工作相互呼應、協同增效。以下是我們在各專業範疇的工作方式：
            </>
          ) : (
            <>
              Radiance operates as one integrated team, not a collection of separate functions. Whether you need a press conference, a social content calendar, a{' '}
              <Link href="/vibe-demo/radiance/services/kol-marketing" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">KOL seeding strategy</Link>
              {' or a full brand campaign, we connect all the pieces so activities reinforce each other. Here\'s how we work across each discipline:'}
            </>
          )}
        </p>
        <div className="space-y-8">
          {/* PR */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/public-relations" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {lang === 'zh' ? '公關服務 →' : 'Public Relations →'}
              </Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們制定策略性訊息，與記者、編輯及媒體建立深厚關係，爭取能夠重塑品牌形象、鞏固聲譽的贏得媒體報導。服務範疇包括新聞稿撰寫及本地化、媒體推廣、訪問協調及危機監測。對我們而言，公關不僅是爭取提及，更是運用媒體以受眾能產生共鳴的方式講述您的品牌故事。'
                : 'We develop strategic messaging and build relationships with journalists, editors and media outlets to secure earned coverage that reshapes perceptions and strengthens reputations. This includes press release drafting and localisation, media pitching, interview coordination and crisis monitoring. For us, PR isn\'t just about getting mentions—it\'s about using media to tell your story in a way that resonates with your target audience.'}
            </p>
          </div>

          {/* Events */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/events" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {lang === 'zh' ? '活動策劃與體驗 →' : 'Event & Experience →'}
              </Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們由構思到執行，全程策劃及統籌各類活動：產品發佈會、店舖開幕、商場推廣、慈善活動、巡迴展覽、舞台演出、嘉年華及娛樂體驗活動。我們處理一切事宜，從概念設計、後勤安排到現場管理及活動後匯報。活動往往是品牌訊息最具生命力的呈現——我們確保每一個細節，從流程安排到賓客體驗，均能切實呼應您的活動目標。'
                : 'We plan and execute events end-to-end: product launches, shop openings, shopping mall promotions, charity events, road shows, stage performances, carnivals and entertainment activations. We handle everything from concept and logistics to on-site management and post-event reporting. Events are often where your message comes alive—we make sure every detail, from the run-down to guest experience, reinforces your objectives.'}
            </p>
          </div>

          {/* Social & Content */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/social-media" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {lang === 'zh' ? '社交媒體及內容 →' : 'Social Media & Content →'}
              </Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們為網站、博客及社交平台創作引人入勝的內容，並輔以度身訂造的內容策略，根據數據表現及受眾洞察持續優化。無論您需要長期內容輸出、針對性宣傳推文，還是深度長篇文章，我們均確保您的品牌聲音保持一致，並帶動與受眾最相關的話題討論。'
                : 'We create engaging content for websites, blogs and social platforms, backed by tailored content strategies and ongoing optimisation based on performance data and audience insights. Whether you need always-on content, campaign-specific posts or long-form editorial, we ensure your voice stays consistent and your content drives the conversations that matter to your audience.'}
            </p>
          </div>

          {/* Creative & Production */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/creative-production" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {lang === 'zh' ? '創意製作 →' : 'Creative & Production →'}
              </Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們提供平面設計、攝影、影片製作及動態圖像等服務，建立強而有力的視覺形象，讓宣傳活動栩栩如生。每一件創意素材均以服務您的策略為依歸，無論是發佈影片、社交媒體內容、活動物料，還是鞏固品牌視覺呈現的品牌指引。'
                : 'We deliver graphic design, photography, video production and motion graphics that build strong visual identities and bring campaigns to life. Every creative asset is designed to serve your strategy, whether it\'s a launch film, social content, event collateral or brand guidelines that anchor your visual presence.'}
            </p>
          </div>

          {/* Martech & Digital */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              {lang === 'zh' ? '行銷科技及數碼策略' : 'Martech & Digital Strategy'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們提供以數據洞察為核心的整合數碼行銷方案，連結您的線上與線下品牌呈現。這意味著將社交媒體宣傳與活動統籌有機結合，把公關報導與內容日曆緊密掛鉤，並跨渠道追蹤成效，讓您清晰掌握哪些策略奏效、哪些環節有待改善。'
                : 'We bring integrated digital marketing solutions that connect your online and offline presence, powered by data-driven insights. This means aligning your social campaigns with your events, linking your PR coverage to your content calendar, and measuring impact across channels so you know what\'s working and what needs adjustment.'}
            </p>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          {lang === 'zh' ? '我們如何與您合作' : 'How we work with you'}
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '以洞察主導策略' : 'Insight-led strategy'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們由聆聽開始，深入了解您的品牌、受眾及業務目標。我們不套用固定模板，而是發掘真正能推動改變的關鍵所在——無論是思想領袖地位、品牌知名度、活動出席率、社群建立，還是聲譽修復。'
                : 'We start by listening carefully to your brand, your audience and your business goals. Rather than applying a template, we uncover what will actually move the needle for you—whether that\'s thought leadership, awareness, attendance, community building or reputation repair.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '整合執行' : 'Integrated execution'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們將公關、活動、社交媒體及內容緊密連結，讓各項工作相互強化。新聞發佈會成為內容創作的時機；產品發佈帶動社交媒體種子傳播；媒體報導為電子報提供素材。一切環環相扣，絕不孤立運作。'
                : 'We connect PR, events, social and content so activities reinforce each other. A press conference becomes a content moment. A product launch drives social seeding. Your media coverage fuels your newsletter. Nothing happens in isolation.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '親力親為的執行' : 'Hands-on delivery'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們緊扣每一個細節——新聞稿流程、賓客名單、內容日曆、製作時間表、媒體跟進。您專注於大局，我們負責統籌後勤與工藝，確保您的宣傳活動順暢推進。'
                : 'We stay close to the details—press run-downs, guest lists, content calendars, production schedules, media follow-ups. You focus on the bigger picture; we handle the logistics and the craft so your campaign runs smoothly.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '長期夥伴關係' : 'Long-term partnership'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們不追求一次性項目合作，而是致力與客戶共同成長，深入了解您的市場、持份者及挑戰，從而持續提升成效。協作、一致性與累積影響力，是我們工作方式的核心。'
                : 'We\'re not here for one-off campaigns. We aim to grow with our clients, learning your market, your stakeholders and your challenges so we can deliver better results over time. Collaboration, consistency and cumulative impact are at the core of how we work.'}
            </p>
          </div>
        </div>
      </section>

      {/* Who We Work With */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          {lang === 'zh' ? '我們的服務對象' : 'Who we work with'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          {lang === 'zh'
            ? '我們有幸與來自不同行業的商業品牌、文化機構、教育機構、非政府組織及社區項目合作。我們的經驗橫跨藝術文化、可持續發展與環保計劃、政府及機構傳播、建築、科技、時尚、美容、餐飲、酒店、銀行金融及消費生活等多個領域。如果您希望建立信任、重塑形象或提升參與度，我們樂意為您提供協助。常見的合作場景包括：'
            : 'We\'ve had the privilege of working with commercial brands, cultural organisations, educational bodies, NGOs and community initiatives across diverse sectors. Our experience spans art and culture, sustainability and environmental programmes, government and institutional communications, architecture, technology, fashion, beauty, food, hospitality, banking and finance, and consumer lifestyle. If you\'re looking to build trust, reshape perceptions or drive engagement, we can help. Typical scenarios include:'}
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {lang === 'zh'
                ? '推出新產品、服務或機構計劃，並爭取從第一天起建立可信度的媒體報導。'
                : 'Launching a new product, service or institutional initiative and securing media coverage that builds credibility from day one.'}
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {lang === 'zh'
                ? '舉辦展覽、社區活動或教育計劃，同時需要媒體曝光及真實的受眾參與。'
                : 'Running exhibitions, community events or educational programmes where you need both media visibility and authentic audience engagement.'}
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {lang === 'zh'
                ? '建立持續的社交媒體影響力，讓您的品牌在各平台上保持曝光，並與受眾持續互動。'
                : 'Building an always-on social presence that keeps your brand top-of-mind and drives conversations with your audience across platforms.'}
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {lang === 'zh'
                ? '以清晰、可信且具說服力的方式，向公眾或持份者傳遞複雜議題的資訊——從可持續發展到科技創新，再到社會影響。'
                : 'Educating the public or stakeholders on complex topics—from sustainability to technology to social impact—in a way that\'s clear, credible and compelling.'}
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {lang === 'zh'
                ? '在品牌轉型、業務增長或面臨挑戰的時期管理聲譽——無論是品牌重塑、領導層更替，還是應對市場變化。'
                : 'Managing your reputation during periods of change, growth or challenge—whether that\'s a rebrand, leadership transition or response to market shifts.'}
            </span>
          </li>
        </ul>
      </section>

      {/* Values */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          {lang === 'zh' ? '我們的信念' : 'What we believe'}
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '贏得媒體的力量不可忽視。' : 'Earned media is powerful.'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '當記者撰文報導您的品牌，或持份者主動分享您的故事，其可信度是付費內容無法比擬的。我們的策略以建立真誠的媒體關係為核心，致力創作記者樂於講述的故事。'
                : 'When a journalist writes about your brand or a stakeholder shares your story, it carries weight that paid content cannot. We centre our strategies around building genuine media relationships and crafting stories journalists actually want to tell.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '整合至關重要。' : 'Integration matters.'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '最成功的宣傳活動從不各自為政。公關、活動、社交媒體及創意製作在協同合作下效果倍增。我們設計的宣傳活動，讓每個渠道都能放大其他渠道的成效。'
                : 'The best campaigns don\'t happen in silos. PR, events, social and creative are stronger when they work together. We design campaigns so every channel amplifies the others.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '本地洞察不可或缺。' : 'Local insight is essential.'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '香港及大灣區擁有獨特的媒體生態、受眾行為及文化特質。我們的工作建立在深厚的本地知識之上——包括媒體偏好、平台動態、文化敏感度，以及真正能打動本地受眾的內容。'
                : 'Hong Kong and the Greater Bay Area have unique media landscapes, audience behaviours and cultural dynamics. We ground our work in deep local knowledge—about press preferences, platform dynamics, cultural sensitivities and what actually moves audiences here.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '有意義的故事才能打動人心。' : 'Meaningful stories matter.'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '我們被具有真正使命的品牌和機構所吸引——無論是推動創新、支持社區，還是倡議可持續發展。當我們真心認同所講述的故事，我們才能發揮最大的能量。'
                : 'We\'re drawn to brands and organisations with genuine purpose—whether that\'s driving innovation, supporting communities or championing sustainability. We work best when the story we\'re telling is one we believe in.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {lang === 'zh' ? '執行決定成敗。' : 'Execution makes the difference.'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '再好的策略，若缺乏嚴謹的執行，也只是一紙空文。我們注重細節，因為這正是大多數宣傳活動成敗的關鍵所在。從媒體推廣、活動流程安排到內容日曆，我們對每一個環節都精益求精。'
                : 'The best strategy falls flat without meticulous execution. We care about the details—because that\'s where most campaigns either succeed or fail. From media outreach to event run-downs to content calendars, we manage the craft.'}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {lang === 'zh' ? '準備好攜手合作了嗎？' : 'Ready to work together?'}
          </h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            {lang === 'zh'
              ? '無論您正在籌備宣傳活動、策劃活動、制定社交媒體策略，還是應對傳播挑戰，我們誠摯期待了解您的需求。讓我們探討Radiance如何協助您觸及目標受眾、建立信任並創造實際影響。'
              : 'Whether you\'re planning a campaign, launching an event, building a social strategy or navigating a communications challenge, we\'d love to hear about your needs. Let\'s explore how Radiance can help you reach your audience, build trust and drive impact.'}
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/vibe-demo/radiance/consultation" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              {lang === 'zh' ? '討論您的需求' : 'Discuss your brief'}
            </Link>
            <Link href="/vibe-demo/radiance/contact" className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              {lang === 'zh' ? '立即聯絡' : 'Get in touch'}
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}
