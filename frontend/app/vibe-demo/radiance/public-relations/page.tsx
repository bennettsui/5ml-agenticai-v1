'use client';

import { useLanguage } from '../hooks/useLanguage';

export default function PublicRelationsPage() {
  const { lang, toggle } = useLanguage();

  return (
    <main className="bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/vibe-demo/radiance" className="text-2xl font-bold tracking-tight">
            <span className="text-blue-600">Radiance</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/vibe-demo/radiance#services" className="hover:text-blue-600 transition">
              {lang === 'zh' ? '服務' : 'Services'}
            </a>
            <a href="/vibe-demo/radiance#cases" className="hover:text-blue-600 transition">
              {lang === 'zh' ? '案例' : 'Cases'}
            </a>
            <a href="#contact" className="hover:text-blue-600 transition">
              {lang === 'zh' ? '聯絡' : 'Contact'}
            </a>
            <button
              onClick={toggle}
              aria-label={lang === 'zh' ? 'Switch to English' : '切換至中文'}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition"
            >
              {lang === 'zh' ? '🇬🇧 EN' : '🇭🇰 中'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">
            {lang === 'zh' ? '公關服務 — 香港' : 'Public Relations — Hong Kong'}
          </p>
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            {lang === 'zh' ? <>贏得公信力<br />推動商業成果</> : <>Earn Credibility<br />That Converts</>}
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            {lang === 'zh'
              ? '正面、可信的媒體曝光能鞏固品牌聲譽，帶動商業成果。作為香港整合型公關公司，Radiance 構建策略性傳播生態系統——精準新聞角度、深耕媒體關係、掌握敘事主導權——讓您的故事在頂尖媒體中發揮最大影響力。'
              : 'Positive, credible media exposure fortifies brand reputation and fuels commercial results. As Hong Kong\'s integrated PR agency, Radiance engineers strategic communication ecosystems—precision news angles, nurtured media ties, narrative mastery—that position your stories for peak impact in top outlets.'}
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            {lang === 'zh'
              ? '我們視公關為持續累積信任的加速器，而非單純的新聞稿發布。每份簡報、每次推銷、每個媒體報道，都旨在複利式地建立公信力——將媒體曝光轉化為持份者信心、銷售對話及長期品牌資產。'
              : 'We view PR as an ongoing trust accelerator, not just press releases. Every brief, pitch, and placement is engineered to compound credibility—turning media exposure into stakeholder confidence, sales conversations, and long-term brand equity.'}
          </p>
        </div>
      </section>

      {/* Trust Stat Banner */}
      <section className="py-12 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl font-bold opacity-20 hidden md:block">❝</div>
          <div>
            <p className="text-xl md:text-2xl font-semibold leading-snug">
              {lang === 'zh'
                ? '92% 的全球消費者信任自媒體——即推薦及經審核的報道——其可信度高於一切廣告形式。'
                : '92% of global consumers trust earned media—recommendations and vetted coverage—above all forms of advertising.'}
            </p>
            <p className="text-sm mt-3 opacity-75">Nielsen Global Trust in Advertising Report</p>
          </div>
        </div>
      </section>

      {/* Why Earned Media Matter */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {lang === 'zh' ? '為何自媒體如此重要' : 'Why Earned Media Matter'}
          </h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '自媒體的表現勝過付費渠道，因為它具備第三方公信力。當記者審核並推廣您的品牌時，受眾的信任度是付費廣告的 3 倍。我們整合的公關方法能創造複利式飛輪效應：報道帶動活動、建立社會認可、促成銷售對話——每個循環相互強化。'
              : <>Earned media outperforms paid channels because it carries third-party credibility. When journalists vet and amplify your brand, audiences trust it <strong>3× more</strong> than paid advertising. Our integrated PR approach creates a compounding flywheel: coverage fuels events, social proof, and sales conversations—each cycle reinforcing the next.</>}
          </p>

          <ul className="space-y-6">
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">
                  {lang === 'zh' ? '即時建立規模化公信力。' : 'Instant Legitimacy at Scale.'}
                </strong>
                <span className="text-gray-700">
                  {lang === 'zh'
                    ? ' 透過記者的媒體網絡觸及新受眾，以內建公信力介紹您的品牌，這是付費廣告無法複製的效果。'
                    : ' Reaches new audiences through journalists\' networks, introducing your brand with built-in credibility that paid placements cannot replicate.'}
                </span>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">
                  {lang === 'zh' ? '複利式回報。' : 'Compounding Returns.'}
                </strong>
                <span className="text-gray-700">
                  {lang === 'zh'
                    ? ' 與熟悉您故事的媒體建立的信任關係，帶來持續且愈來愈正面的報道——每次曝光都在上一次的基礎上延伸。'
                    : ' Trusted relationships with media who know your story generate repeated, increasingly favorable coverage—each placement building on the last.'}
                </span>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">
                  {lang === 'zh' ? '精準掌控敘事。' : 'Precision Narrative Control.'}
                </strong>
                <span className="text-gray-700">
                  {lang === 'zh'
                    ? ' 在關鍵時刻——產品發布、危機應對、領導層更替——透過精準的訊息框架，搶先於揣測填補輿論空白前塑造形象。'
                    : ' Shapes perception at critical moments—launches, crises, leadership transitions—through precise message framing before speculation fills the void.'}
                </span>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">
                  {lang === 'zh' ? '跨渠道放大效益。' : 'Cross-Channel Amplification.'}
                </strong>
                <span className="text-gray-700">
                  {lang === 'zh'
                    ? ' 媒體報道提升活動出席率、點燃社交分享熱度，並強化 KOL 合作提案——一次報道在每個渠道倍增。'
                    : ' Press clips elevate event RSVPs, ignite social sharing, and strengthen KOL partnership pitches—one placement multiplied across every channel.'}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Integrated PR Services */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {lang === 'zh' ? '整合公關服務' : 'Our Integrated PR Services'}
          </h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '從策略制定到登上頭條，每項服務均旨在贏得信任、深化媒體關係，並將報道轉化為可量化的業務成果。'
              : 'From strategy to headline, every service is designed to earn trust, deepen media relationships, and translate coverage into measurable business outcomes.'}
          </p>

          <div className="space-y-10">
            {[
              {
                en: 'Communication Strategy',
                zh: '傳播策略',
                enDesc: 'Deep-dive brand positioning → audience mapping → PR objectives → killer news angles → targeted media network → real-time optimization. Your narrative architecture, built to last.',
                zhDesc: '深度品牌定位 → 受眾分析 → 公關目標 → 突破性新聞角度 → 精準媒體網絡 → 即時優化。為您構建持久的敘事框架。',
              },
              {
                en: 'Media Relations',
                zh: '媒體關係',
                enDesc: 'Proactive, relationship-first engagement. We invest time understanding each journalist\'s beat, deliver exclusive value, and secure the sustained positive coverage that retainer agencies promise but rarely deliver.',
                zhDesc: '主動、以關係為先的媒體接觸。我們深入了解每位記者的報道範疇，提供專屬價值，確保持續獲得正面報道——這是許多公關公司承諾卻鮮少兌現的成果。',
              },
              {
                en: 'Press Releases',
                zh: '新聞稿',
                enDesc: 'News-worthy, concise copy tailored to media demands—not corporate memos dressed as news. Precision timing and multi-channel distribution engineered for peak pickup across Hong Kong and regional outlets.',
                zhDesc: '具新聞價值、符合媒體需求的簡潔文案——而非偽裝成新聞的企業內部備忘錄。精準把握發布時機，透過多渠道分發，在香港及區域媒體達到最高採用率。',
              },
              {
                en: 'Media Interviews',
                zh: '媒體專訪',
                enDesc: 'Curated invitations with exclusive angles that give journalists a reason to say yes. We build rapport, prepare your spokespeople, and lock in favorable features before the conversation begins.',
                zhDesc: '精心策劃的邀約配以專屬角度，讓記者有充分理由接受採訪。我們建立融洽關係、培訓發言人，在對話開始前便確保獲得有利的報道立場。',
              },
              {
                en: 'Media Pitching & Publicity',
                zh: '媒體推廣及曝光',
                enDesc: 'Strategic placements in the publications that move markets—elevating brand trust, deepening audience affinity, and accelerating sales velocity through third-party endorsement.',
                zhDesc: '在影響市場的刊物中進行策略性布局——透過第三方背書提升品牌信任、加深受眾親和力，並加速銷售增長。',
              },
              {
                en: 'Executive Thought Leadership',
                zh: '高管思想領袖建立',
                enDesc: 'Position C-suite leaders as definitive industry voices through key outlet interviews, contributed editorials, and speaking opportunities—driving brand awareness, stakeholder favorability, and market leadership perception.',
                zhDesc: '透過重要媒體專訪、投稿評論及演講機會，將管理層塑造為業界權威聲音——提升品牌知名度、持份者好感度及市場領導者形象。',
              },
            ].map((s) => (
              <div key={s.en} className="border-l-4 border-blue-600 pl-6">
                <h3 className="text-xl font-bold mb-2 text-gray-900">{lang === 'zh' ? s.zh : s.en}</h3>
                <p className="text-gray-700 leading-relaxed">{lang === 'zh' ? s.zhDesc : s.enDesc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Impact PR Events */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {lang === 'zh' ? '高影響力公關活動' : 'High-Impact PR Events'}
          </h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '當報道與體驗相遇，公信力倍增。我們設計並執行媒體活動，即時製造話題，建立持久關係——每種活動形式均針對品牌敘事中的不同時機精心設計。'
              : 'When coverage meets experience, credibility compounds. We design and execute media events that generate immediate buzz and lasting relationships—each format engineered for a different moment in your brand narrative.'}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                letter: 'P',
                en: 'Press Conferences', zh: '新聞發布會',
                enDesc: 'Orchestrate announcements that command attention from media and key stakeholders. From venue and AV through spokesperson briefing and post-event follow-up, we manage every moment so your message lands without distortion.',
                zhDesc: '策劃令媒體及重要持份者矚目的公告活動。從場地、視聽設備到發言人簡報及活動後跟進，我們管理每個環節，確保您的訊息完整傳達。',
              },
              {
                letter: 'L',
                en: 'Product Launches', zh: '產品發布活動',
                enDesc: 'Memorable unveilings that generate buzz, secure coverage, and create immediate market traction. We align media invitations, influencer briefings, and social amplification so the launch narrative fills every channel simultaneously.',
                zhDesc: '令人難忘的產品發布，製造話題、確保媒體報道並即時建立市場動力。我們協調媒體邀請、KOL簡報及社交放大，讓發布敘事同步充滿每個渠道。',
              },
              {
                letter: 'M',
                en: 'Media Luncheons', zh: '媒體午宴',
                enDesc: 'Intimate editorial briefings that foster the journalist relationships driving repeated, favorable coverage. We curate the right guest mix, prepare exclusive story angles, and create an environment where candid conversations become long-term media advocacy.',
                zhDesc: '親密的編輯簡報會，培育帶動持續正面報道的記者關係。我們精心策劃賓客組合、準備專屬故事角度，營造讓坦誠對話演變為長期媒體支持的氛圍。',
              },
              {
                letter: 'T',
                en: 'Media Preview Tours', zh: '媒體預覽參觀',
                enDesc: 'Immersive facility or product experiences designed to give journalists firsthand insight—yielding deeper, more accurate, and more favorable stories than any press kit alone can achieve.',
                zhDesc: '沉浸式設施或產品體驗，讓記者親身獲得第一手了解——帶來比任何新聞資料冊更深入、更準確、更正面的報道。',
              },
            ].map((e) => (
              <div key={e.en} className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold text-lg">{e.letter}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? e.zh : e.en}</h3>
                <p className="text-gray-700 leading-relaxed">{lang === 'zh' ? e.zhDesc : e.enDesc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {lang === 'zh' ? '我們如何與您合作' : 'How We Work with You'}
          </h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '公關成果透過關係與一致性複利累積。我們的流程為此而建——從一開始的嚴謹策略，到全程的靈活執行，始終保持透明匯報。'
              : 'PR results compound through relationships and consistency. Our process is built for both—rigorous strategy at the start, agile execution throughout, transparent reporting always.'}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                n: '01',
                en: 'Discovery & Strategy', zh: '探索與策略制定',
                enDesc: 'Deep-dive brand audit, audience mapping, and competitive coverage analysis. We identify your strongest news angles and build a targeted media network before a single pitch goes out.',
                zhDesc: '深度品牌審核、受眾分析及競爭對手報道分析。在發出第一個推銷前，我們已找出您最有力的新聞角度並建立精準媒體網絡。',
              },
              {
                n: '02',
                en: 'Content & Materials', zh: '內容與素材製作',
                enDesc: 'Press releases, pitch narratives, media briefing notes, and spokesperson talking points—crafted to meet editorial standards, reviewed with you, and ready for precision timing.',
                zhDesc: '新聞稿、推銷敘事、媒體簡報及發言人要點——按編輯標準精心撰寫，與您確認後，準備在精準時機發布。',
              },
              {
                n: '03',
                en: 'Execution & Relationship Management', zh: '執行與關係管理',
                enDesc: 'We manage all journalist outreach, interview coordination, PR event logistics, and cross-channel timing. You stay informed—without needing to manage media relationships directly.',
                zhDesc: '我們管理所有記者接觸、專訪協調、公關活動後勤及跨渠道時程。您保持知情——無需直接管理媒體關係。',
              },
              {
                n: '04',
                en: 'Reporting & Real-Time Optimisation', zh: '匯報與即時優化',
                enDesc: 'Monthly coverage reports with placement data, reach estimates, and sentiment analysis. We adapt angles and outreach based on what\'s resonating—strategy in motion, not set in stone.',
                zhDesc: '每月報道總結，涵蓋刊登數據、觸及估算及情感分析。我們根據市場反應調整角度及外展策略——策略因時制宜，而非一成不變。',
              },
            ].map((s) => (
              <div key={s.n} className="bg-gray-50 rounded-xl p-8">
                <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">{s.n}</div>
                <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? s.zh : s.en}</h3>
                <p className="text-gray-700 leading-relaxed">{lang === 'zh' ? s.zhDesc : s.enDesc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {lang === 'zh' ? '品牌如何與我們合作' : 'How Brands Work with Us'}
          </h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '從市場進入到危機應對，從思想領袖建立到產品發布——策略性公關塑造建立持久品牌的敘事。'
              : 'From market entries to crisis moments, thought leadership campaigns to product unveilings—strategic PR shapes the narratives that build durable brands.'}
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-xl p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">
                {lang === 'zh' ? '跨國消費品牌進軍香港市場' : 'Global Consumer Brand Entering Hong Kong'}
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家跨國企業進軍香港市場，需要迅速建立品牌知名度和公信力。我們策劃市場進入敘事，將品牌定位為創新且貼近本地的形象，向區域商業及生活媒體記者進行推銷，協調獨家媒體預覽，並向本地 KOL 簡報，在社交媒體上放大發布訊息。'
                  : 'A multinational entering Hong Kong needed awareness and credibility fast. We crafted a market entry narrative positioning the brand as innovative and locally attuned, pitched regional business and lifestyle journalists, coordinated an exclusive press preview, and briefed local KOLs to amplify launch messaging across social.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong>
                  {lang === 'zh'
                    ? ' 首月內在頂級媒體獲得 18 篇報道；媒體發布活動帶動 KOL 合作及社交媒體擴散；品牌於首季確立品類知名度領導地位。'
                    : ' 18 media placements in tier-1 outlets within the first month; press event fuelled KOL partnerships and social amplification; brand achieved category awareness leadership in Q1.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">
                {lang === 'zh' ? '可持續發展非牟利機構建立機構公信力' : 'Sustainability NGO Building Institutional Credibility'}
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家香港氣候教育非牟利機構希望將其總監定位為思想領袖，並提升捐款者參與度。我們爭取編輯版面、推銷研究主導的專訪角度，並協調訊息與社區活動相互配合。'
                  : 'A Hong Kong climate education NGO wanted to position its director as a thought leader and increase donor engagement. We secured editorial placements, pitched research-led interview angles, and coordinated messaging with a community campaign.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong>
                  {lang === 'zh'
                    ? ' 獲得 8 篇媒體報道，包括一篇評論文章；總監成為後續業界報道中的引用專家；曝光度提升帶來三項主要資助查詢。'
                    : ' 8 media placements including an opinion editorial; director became a cited expert in subsequent industry coverage; increased visibility generated three major grant inquiries.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">
                {lang === 'zh' ? '科技初創企業在壓力下管理聲譽' : 'Tech Startup Managing Reputation Under Pressure'}
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家人工智能初創企業在社交媒體上面臨數據私隱方面的負面報道。我們制定快速應對策略、起草透明的媒體聲明、主動與科技記者溝通創辦人觀點，並協調第三方專家評論，重建公信力。'
                  : 'An AI startup faced negative social coverage on data privacy. We developed a rapid-response strategy, drafted a transparent media statement, proactively engaged tech journalists with founder context, and coordinated third-party expert commentary to rebuild credibility.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong>
                  {lang === 'zh'
                    ? ' 輿論從爭議轉向私隱保護領導者形象；5 篇後續報道聚焦公司保護措施；投資者信心趨於穩定。'
                    : ' Narrative shifted from controversy to privacy leadership; 5 follow-up stories foregrounded company safeguards; investor confidence stabilised.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">
            {lang === 'zh' ? '常見問題' : 'Frequently Asked Questions'}
          </h2>

          <div className="space-y-8">
            {[
              {
                enQ: 'What is earned media and why does it outperform paid advertising?',
                zhQ: '什麼是自媒體？為何它比付費廣告更有效？',
                enA: 'Earned media is coverage secured through editorial merit—journalists choosing to feature your brand because the story is newsworthy. Because it carries third-party validation, Nielsen research shows 92% of consumers trust it above all forms of advertising. Unlike paid placements, earned coverage cannot be bought; it must be earned through credible storytelling and strong media relationships.',
                zhA: '自媒體是指透過編輯價值獲得的報道——記者因故事具有新聞價值而選擇報道您的品牌。由於其具備第三方認可，尼爾森研究顯示 92% 的消費者對其信任度高於一切廣告形式。與付費廣告不同，自媒體報道無法購買，必須透過可信的敘事和強大的媒體關係來贏得。',
              },
              {
                enQ: 'How long does a PR engagement take to show results?',
                zhQ: '公關工作需要多久才能見到成效？',
                enA: 'A focused product launch campaign typically runs 2–3 months. Ongoing thought leadership or reputation management spans 6–12 months, where coverage compounds as media relationships deepen. We\'re flexible: month-to-month retainers and project-based engagements are both available.',
                zhA: '一個針對性的產品發布活動通常歷時 2 至 3 個月。持續的思想領袖建立或聲譽管理一般需要 6 至 12 個月，隨著媒體關係深化，報道效果持續複利累積。我們靈活應對：按月計算的保留費及項目制合作均可安排。',
              },
              {
                enQ: 'Do you work with startups and NGOs, or only established corporates?',
                zhQ: '你們只服務大型企業，還是也歡迎初創公司和非牟利機構？',
                enA: 'We work with brands and institutions of all sizes—startups, NGOs, cultural institutions, and multinationals. Some of our most impactful PR work comes from smaller, mission-driven organisations with compelling stories and the conviction to tell them.',
                zhA: '我們服務各種規模的品牌和機構——包括初創公司、非牟利機構、文化機構及跨國企業。我們一些最具影響力的公關工作，往往來自有使命感、有說服力故事且有決心講述的小型機構。',
              },
              {
                enQ: 'What if we don\'t have an in-house PR or comms team?',
                zhQ: '如果我們沒有內部公關或傳訊團隊，怎麼辦？',
                enA: 'We function as your external PR team. We manage all journalist relationships, pitching, interview coordination, event logistics, and reporting. You provide insights and approvals; we handle everything else.',
                zhA: '我們擔任您的外部公關團隊。我們管理所有記者關係、推銷、專訪協調、活動後勤及匯報工作。您提供見解和審批；其餘一切由我們處理。',
              },
              {
                enQ: 'Can we start with a pilot project before committing to a retainer?',
                zhQ: '我們可以先試行一個小項目，再決定是否簽署保留費合約嗎？',
                enA: 'Absolutely. A 2–4 week pilot (product launch campaign, crisis response, or media relations sprint) lets both sides verify fit before expanding to an ongoing engagement.',
                zhA: '當然可以。一個為期 2 至 4 週的試行項目（產品發布活動、危機應對或媒體關係衝刺），讓雙方在擴展為長期合作前驗證契合度。',
              },
            ].map((item, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-8 last:border-0">
                <h3 className="text-lg font-bold mb-3 text-gray-900">
                  {lang === 'zh' ? item.zhQ : item.enQ}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {lang === 'zh' ? item.zhA : item.enA}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-75">
            {lang === 'zh' ? '與 Radiance 合作' : 'Partner with Radiance'}
          </p>
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            {lang === 'zh'
              ? <>92% 的信任優勢等您把握。<br />讓我們為您的品牌創造成果。</>
              : <>92% trust edge awaits.<br />Let's put it to work for your brand.</>}
          </h2>
          <p className="text-lg mb-8 leading-relaxed opacity-90">
            {lang === 'zh'
              ? '無論您是發布新產品、應對形象危機，還是建立高管思想領袖地位，Radiance 能為您打造帶來轉化的公信力。讓我們談談您的故事。'
              : 'Whether you\'re launching a product, navigating a reputation shift, or establishing executive thought leadership, Radiance engineers the credibility that converts. Let\'s talk about your story.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition">
              {lang === 'zh' ? '開始公關對話' : 'Start a PR Conversation'}
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition">
              {lang === 'zh' ? '查看我們的工作' : 'View Our Work'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Radiance</h4>
              <p className="text-sm">
                {lang === 'zh' ? '為香港品牌提供公關及行銷科技服務' : 'PR & Martech for Hong Kong brands'}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">{lang === 'zh' ? '服務' : 'Services'}</h4>
              <ul className="text-sm space-y-2">
                <li><a href="/vibe-demo/radiance/events" className="hover:text-white transition">{lang === 'zh' ? '活動策劃與體驗' : 'Events & Experiences'}</a></li>
                <li><a href="/vibe-demo/radiance/social-content" className="hover:text-white transition">{lang === 'zh' ? '社交媒體及內容' : 'Social Media & Content'}</a></li>
                <li><a href="/vibe-demo/radiance/kol-influencer" className="hover:text-white transition">{lang === 'zh' ? 'KOL及網紅行銷' : 'KOL & Influencer'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">{lang === 'zh' ? '公司' : 'Company'}</h4>
              <ul className="text-sm space-y-2">
                <li><a href="/vibe-demo/radiance" className="hover:text-white transition">{lang === 'zh' ? '主頁' : 'Home'}</a></li>
                <li><a href="#contact" className="hover:text-white transition">{lang === 'zh' ? '聯絡' : 'Contact'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">{lang === 'zh' ? '香港' : 'Hong Kong'}</h4>
              <p className="text-sm">hello@radiancehk.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Radiance PR & Martech Limited. {lang === 'zh' ? '版權所有。' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
