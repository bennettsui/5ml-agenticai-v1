'use client';

import { useLanguage } from '../hooks/useLanguage';

export default function EventsPage() {
  const { lang, toggle } = useLanguage();

  return (
    <main className="bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/vibe-demo/radiance" className="text-2xl font-bold tracking-tight">
            <span className="text-blue-600">Radiance</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="/vibe-demo/radiance#services" className="hover:text-blue-600 transition">{lang === 'zh' ? '服務' : 'Services'}</a>
            <a href="/vibe-demo/radiance#cases" className="hover:text-blue-600 transition">{lang === 'zh' ? '案例' : 'Cases'}</a>
            <a href="#contact" className="hover:text-blue-600 transition">{lang === 'zh' ? '聯絡' : 'Contact'}</a>
            <button
              onClick={toggle}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition"
              aria-label={lang === 'zh' ? 'Switch to English' : '切換至中文'}
            >
              {lang === 'zh' ? 'EN' : '中'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            {lang === 'zh' ? '活動策劃與體驗' : 'Events & Experiences'}
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            {lang === 'zh'
              ? '打造令人難忘的品牌時刻，讓受眾成為品牌擁護者——從產品發布會、新聞發布會，到社區活動及文化體驗，每一個細節都留下深遠印記。'
              : 'Create memorable brand moments that turn audiences into advocates—from product launches and press conferences to community events and cultural activations that leave lasting impact.'}
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            {lang === 'zh'
              ? '活動是策略落地的最佳場域。Radiance 以人為本，設計並執行每一場體驗，在真實互動中推動業務成果。無論是小型媒體產品預覽，還是大型社區活動，我們一手包辦所有細節——概念策劃、物流協調、現場管理及活動後的故事延伸——確保您的活動在公關、社交媒體及口碑傳播中持續發揮影響力。'
              : 'Events are where strategy becomes real. At Radiance, we design and execute experiences that engage audiences on a human level while driving business outcomes. From intimate product previews for press to large-scale community activations, we handle every detail—concept, logistics, on-site management, and post-event storytelling—ensuring your event amplifies your brand narrative across PR, social, and word-of-mouth.'}
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{lang === 'zh' ? '為何活動策劃與體驗至關重要' : 'Why Events & Experiences Matter'}</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            {lang === 'zh'
              ? '在數位化的世界裡，真實的線下體驗創造無可取代的人際連結。活動讓您得以即時呈現品牌故事，深化與媒體及網紅的關係，製造內容素材，並掀起遠超活動當日的話題效應。無論是產品發布會、新聞發布會，還是社區聚會，活動都能放大您的品牌敘事，讓各方持份者成為品牌大使。'
              : 'In a digital world, live experiences create irreplaceable moments of human connection. Events allow you to tell your brand story in real time, deepen relationships with media and influencers, generate content, and create buzz that extends far beyond the day itself. Whether it\'s a product launch, press conference, or community gathering, events amplify your narrative and turn stakeholders into brand ambassadors.'}
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '直接互動：' : 'Direct Engagement:'}</strong> {lang === 'zh' ? '活動為您與記者、網紅及客戶創造面對面的機會，深化關係與忠誠度。' : 'Events create face-to-face moments with journalists, influencers, and customers, deepening relationships and loyalty.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '內容生成：' : 'Content Generation:'}</strong> {lang === 'zh' ? '線下活動產生的照片、影片、引述及社交時刻，能在活動結束後數週持續為公關、社交媒體及網紅傳播提供素材。' : 'Live events produce photos, videos, quotes, and social moments that fuel PR, social media, and influencer amplification for weeks after.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '真實故事講述：' : 'Authentic Storytelling:'}</strong> {lang === 'zh' ? '體驗讓受眾親身感受您的品牌——建立廣告無法單獨達到的信任與情感連結。' : 'Experiences let audiences experience your brand firsthand—building trust and emotional connection that advertising alone cannot achieve.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '多渠道擴散：' : 'Multi-Channel Amplification:'}</strong> {lang === 'zh' ? '活動為公關報導、社交內容、網紅發文及口碑傳播提供動力，成倍提升觸及與影響力。' : 'Events fuel PR coverage, social content, influencer posts, and word-of-mouth, multiplying reach and impact.'}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">{lang === 'zh' ? '我們的活動策劃方法' : 'Our Approach to Events & Experiences'}</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '出色的活動始於清晰的目標。我們從您的成果出發，反向規劃——無論是產品發布、社區建設、製造媒體報導，還是深化持份者關係。我們精心設計每個細節，創造有意義的時刻，完美執行物流，並確保活動透過內容與後續互動延續影響力。'
              : 'Great events start with a clear purpose. We work backward from your goals—whether it\'s launching a product, building community, generating press coverage, or deepening stakeholder relationships. We design every detail to create meaningful moments, manage logistics flawlessly, and ensure the event extends beyond the day through content and follow-up engagement.'}
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '以目的為本的概念策劃' : 'Purpose-Driven Concept Development'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們首先深入了解您舉辦活動的原因。是讓媒體探索新產品？建立社區？確立思想領導力？還是慶祝里程碑？然後設計與目的相符的概念——場地選擇、形式、嘉賓組合、流程及體驗設計，在達成目標的同時創造真實的互動時刻。'
                  : 'We start by understanding why you need an event. Is it product discovery for press? Community building? Thought leadership? Celebration? We then design a concept that aligns with that purpose—venue selection, format, guest mix, flow, and experiences that deliver on your objectives while creating genuine moments of engagement.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '以體驗為核心的設計' : 'Experience-Focused Design'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '活動不只是物流操作，更是品牌時刻。我們設計每一個接觸點——從邀請函到活動後的跟進溝通——以強化您的品牌故事。我們思考出席者的感受、他們會談論什麼、會拍下哪些照片、記者會撰寫哪些報導。這樣的用心，將一場普通活動轉化為難忘的體驗。'
                  : 'Events aren\'t just logistical exercises; they\'re brand moments. We design every touchpoint—from invitation through post-event communication—to reinforce your brand story. We think about how attendees will feel, what they\'ll talk about, what photos they\'ll take, and what stories journalists will file. This turns a generic event into a memorable experience.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '與公關及社交媒體整合規劃' : 'Integrated Planning with PR & Social'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '活動與公關及社交媒體協調配合，才能發揮最大效益。我們整合媒體邀請、網紅合作、新聞資料包及社交簡報，構建統一的敘事。我們提前規劃內容拍攝，向出席者說明關鍵信息要點，並準備社交媒體團隊即時放大傳播。'
                  : 'Events deliver maximum impact when coordinated with PR and social. We align media invitations, influencer partnerships, press kits, and social briefings to create a unified narrative. We plan content shots in advance, brief attendees on key talking points, and prime social teams to amplify in real time.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '全方位物流管理與執行' : 'End-to-End Logistics & Execution'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們處理所有運作細節：場地管理、餐飲安排、視聽製作、登記、人員配置、時間表管理及應急規劃。活動當天，我們的團隊全程在場管理每個環節，讓您專注於主持精彩對話。確保演示準時開始、媒體獲得所需資料、出席者感受到熱情款待——這一切都是我們的責任。'
                  : 'We handle all operational details: venue management, catering, AV/production, registration, staffing, timeline management, and contingency planning. On the day, our team is on-site managing every moment so you can focus on hosting great conversations. We\'re the ones ensuring the presentation starts on time, the press has what they need, and attendees feel welcomed.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '活動後擴大傳播與匯報' : 'Post-Event Amplification & Reporting'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '活動並不因出席者離場而結束。我們整理活動後素材——照片、影片、出席者引述——供社交媒體團隊持續放大傳播。我們跟進記者以促進報導，感謝網紅的參與，並提供觸及率、互動及媒體成果的匯報。活動成為持久的內容資產。'
                  : 'The event doesn\'t end when attendees leave. We compile post-event materials—photos, videos, attendee quotes—that social teams amplify. We follow up with journalists to encourage coverage, thank influencers for their participation, and generate reporting on reach, engagement, and media outcomes. Events become lasting content assets.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scope of Services */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">{lang === 'zh' ? '服務範疇' : 'Scope of Services'}</h2>

          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '活動策略與概念' : 'Event Strategy & Concept'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '與品牌目標及關鍵績效指標（觸及、互動、潛在客戶、社區建設）相符的活動策略' : 'Event strategy aligned with brand goals and KPIs (awareness, engagement, leads, community building)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '概念策劃，包括形式、嘉賓組合、場地及體驗設計' : 'Concept development including format, guest mix, venues, and experiences'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '持份者及受眾分析（媒體、網紅、客戶、合作夥伴）' : 'Stakeholder and audience mapping (press, influencers, customers, partners)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '整合規劃，協調活動時間與公關推廣及社交媒體日曆' : 'Integrated planning connecting event timing with PR campaigns and social calendars'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '活動類型與體驗' : 'Event Types & Activations'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '產品發布會及媒體展示活動' : 'Product launch events and press showcase activations'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '新聞發布會、媒體簡報會及媒體午宴' : 'Press conferences, media briefings, and media luncheons'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '社區活動、慈善晚宴及慶典' : 'Community events, charity galas, and celebration activations'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '思想領導力沙龍、工作坊及社區聚會' : 'Thought leadership salons, workshops, and community gatherings'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '文化展覽、快閃體驗及品牌裝置' : 'Cultural exhibitions, pop-up experiences, and brand installations'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '線上及混合活動管理（網絡研討會、虛擬產品發布）' : 'Hybrid and virtual event management (webinars, virtual product launches)'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '全方位活動運作' : 'Full-Service Event Operations'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '場地搜尋、預訂及物流管理' : 'Venue sourcing, booking, and logistics management'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '嘉賓名單策劃及登記管理（Eventbrite、自訂平台）' : 'Guest list curation and registration management (Eventbrite, custom platforms)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '餐飲、飲品及視聽製作的採購與協調' : 'Catering, beverage, and AV/production sourcing and coordination'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '標識製作、宣傳物料生產、新聞資料包設計與印刷' : 'Signage, collateral production, press kit design and printing'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '人員配置、入場管理及出席者體驗協調' : 'Staffing, check-in management, and attendee experience coordination'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '時間表管理、活動流程制定及現場應急規劃' : 'Timeline management, run-of-show production, and on-site contingency planning'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '媒體及網紅協調' : 'Press & Influencer Coordination'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '媒體邀請策略及媒體名單制定' : 'Press invitation strategy and media list development'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '網紅及KOL簡報與合作協調' : 'Influencer and KOL briefing and partnership coordination'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '新聞資料包設計與發送（實體及數位）' : 'Press kit design and distribution (physical and digital)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '專訪安排及管理層簡報支援' : 'Interview scheduling and executive briefing support'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '活動期間的現場媒體關係及新聞支援' : 'On-site media relations and press support during the event'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '內容製作及活動後擴散' : 'Content & Post-Event Amplification'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '專業攝影及錄影服務' : 'Professional photography and videography services'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '即時社交媒體報導及現場更新' : 'Real-time social media coverage and live updates'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '活動後內容整合（照片、影片、引述、精彩回顧）' : 'Post-event content compilation (photos, videos, quotes, highlights)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '媒體跟進及報導追蹤' : 'Media follow-up and coverage tracking'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '出席者感謝及互動跟進傳播' : 'Attendee thank-you and engagement follow-up communications'}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{lang === 'zh' ? '品牌如何與我們合作' : 'How Brands Work with Us'}</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? 'Radiance 曾為科技初創、消費品牌、非政府組織及文化機構策劃並執行各類活動，從小型產品預覽到大型社區體驗，每場活動均按品牌目標及受眾量身定制，精心打造能引起共鳴、跨渠道擴散的時刻。'
              : 'Radiance has conceived and executed events ranging from intimate product previews to large-scale community activations—for tech startups, consumer brands, NGOs, and cultural institutions. Each event is tailored to the brand\'s goals and audience, with careful attention to creating moments that resonate and amplify across channels.'}
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '科技初創產品發布會' : 'Tech Startup Product Launch'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家人工智能軟件初創公司希望在香港以媒體公信力與網紅話題並重的方式推出產品。我們為80位出席者設計了精緻的發布活動，包括科技記者、行業分析師及宏觀網紅，設有現場產品示範、創辦人演講及輕鬆交流環節。我們協調媒體預覽、向網紅說明關鍵信息要點，並安排專業攝影及現場社交媒體直播。'
                  : 'An AI software startup wanted to launch its Hong Kong product with both press credibility and influencer buzz. We designed an intimate launch event for 80 attendees including tech journalists, industry analysts, and macro-influencers, featuring live product demos, founder talks, and informal networking. We coordinated press previews, briefed influencers on key talking points, and arranged for professional photography and live social coverage.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '12篇媒體報導，包括頂級科技刊物；5位網紅發文，合計觸及逾5萬受眾；活動生成的照片及影片成為發布後兩個月的核心社交內容。' : '12 media mentions including top-tier tech publications; 5 influencers posted about launch reaching 50K+ combined audience; event-generated photos and videos became core social content for 2 months post-launch.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '非政府組織社區教育計劃發布' : 'NGO Community Education Program Launch'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家香港教育非政府組織推出新的社區獎學金計劃，希望在提升公眾認知的同時表彰受惠學生。我們設計了一場社區聚會，包括學生分享、合作學校演示及小型接待——為捐款人、教育工作者及家長創造真實感人的時刻。我們協調媒體邀請及社交媒體擴散，講述計劃背後的人文故事。'
                  : 'A Hong Kong education NGO launched a new community scholarship program and wanted to build awareness while celebrating beneficiaries. We designed a community gathering featuring student testimonials, partner school presentations, and a modest reception—creating an authentic moment for donors, educators, and families. We coordinated media invitations and social amplification to tell the human story behind the program.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '150位出席者，包括10位媒體代表；4篇教育類媒體報導；合作學校強力社交媒體擴散；吸引捐款人興趣，促成3項重大資助承諾。' : '150 attendees including 10 media representatives; 4 education-focused media placements; strong social amplification from partner schools; generated donor interest resulting in 3 major grant commitments.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '消費品牌快閃體驗及媒體預覽' : 'Consumer Brand Pop-Up Experience & Press Preview'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一個生活時尚品牌希望在香港開設快閃旗艦店，同時獲得強勁的媒體報導及社區參與。我們設計了為期3天的發布活動，包括媒體預覽、客戶開幕日及社區工作坊。我們負責場地管理、媒體協調、專業攝影、社交媒體內容，以及後續社區互動，將快閃店打造為持久的社區聚點。'
                  : 'A lifestyle brand wanted to open a pop-up flagship store in Hong Kong with strong press coverage and community engagement. We designed a 3-day launch featuring a press preview event, customer opening day, and community workshop programming. We handled venue management, media coordination, professional photography, social content, and follow-up community engagement to turn the pop-up into a lasting community touchpoint.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '8篇媒體報導（平面及數位）；媒體活動吸引120位記者、網紅及客戶出席；3天合計120萬社交媒體曝光；因社區需求旺盛，快閃店延長兩週。' : '8 media placements (print and digital); press event attendance of 120 journalists, influencers, and customers; 1.2M social impressions across 3 days; pop-up extended 2 weeks due to community demand.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">{lang === 'zh' ? '我們如何與您合作' : 'How We Work with You'}</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">01</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '概念策劃' : 'Concept & Planning'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們以工作坊形式了解您的目標、受眾及預算限制，繼而制定活動概念，涵蓋形式、場地選項、嘉賓組合及整合方案（公關、社交媒體、網紅）。您確認概念後，我們進入詳細規劃階段。'
                  : 'We begin with a workshop to understand your goals, audience, and constraints. We then develop an event concept including format, venue options, guest mix, and integrated plan (PR, social, influencers). You approve the concept and we move to detailed planning.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '物流與協調' : 'Logistics & Coordination'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們搜尋並預訂供應商（場地、餐飲、視聽），建立嘉賓名單，設計宣傳物料，並制定詳細的活動流程時間表。我們定期匯報預訂進度、設計方案及協調情況，確保您對重要決策知情參與。'
                  : 'We source and book vendors (venue, catering, AV), build guest lists, design collateral, and create detailed run-of-show timelines. We share regular updates on bookings, designs, and coordination. You stay informed and involved in key decisions.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '執行與現場管理' : 'Execution & On-Site Management'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們的團隊全程在場管理每個細節：入場、視聽、時間表、演講者協調、媒體關係、攝影及即時社交更新。我們處理突發狀況，讓您的團隊專注於主持與嘉賓交流。'
                  : 'Our team is on-site managing every detail: check-ins, AV, timeline, speaker coordination, media relations, photography, and real-time social updates. We handle contingencies so your team can focus on hosting and engaging attendees.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '跟進與擴大傳播' : 'Follow-Up & Amplification'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們整合活動後素材，協調媒體跟進，發送出席者感謝信，並支援持續的社交媒體擴散。我們匯報出席數字、媒體成果及互動數據，全面呈現活動的影響力。'
                  : 'We compile post-event materials, coordinate media follow-up, deliver attendee thank-yous, and support ongoing social amplification. We report on attendance, media outcomes, and engagement metrics to show the full impact of your event.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">{lang === 'zh' ? '常見問題' : 'Frequently Asked Questions'}</h2>

          <div className="space-y-8">
            {lang === 'zh' ? [
              {
                q: "與 Radiance 合作舉辦活動需要多少費用？",
                a: "費用視乎活動規模、複雜程度及時長而定。一場80人的媒體預覽活動（包括場地、餐飲、視聽、人員及製作）總費用約為15至25萬港元。大型社區體驗活動可達40萬港元以上。我們會根據您的預算制定方案，靈活調整服務範圍。"
              },
              {
                q: "策劃一場活動需要多長時間？",
                a: "中型活動（50至150人）的典型籌備期為6至8週。大型活動或複雜體驗可能需要3至4個月。小型媒體預覽可在4至6週內完成規劃。如有需要，我們亦可加快進度，但建議預留充裕時間，以獲得最佳的供應商合作及媒體接觸效果。"
              },
              {
                q: "你們是否同時負責活動策劃及創意設計（標識、宣傳物料）？",
                a: "是的。我們負責活動策劃、物流及基本宣傳物料設計（邀請函、標識、新聞資料包）。對於較大型的創意項目（體驗式設計、精緻舞台裝置），我們可與專業製作合作夥伴協作，或與您的內部創意團隊配合。"
              },
              {
                q: "你們是否承辦線上或混合活動？",
                a: "當然可以。我們曾管理網絡研討會、虛擬產品發布及兼顧線上線下出席的混合活動。我們與活動平台合作，管理直播、協調演講者設置，並即時與網上受眾互動。"
              },
              {
                q: "如果活動當天出現問題怎麼辦？",
                a: "我們的團隊具備豐富的應急管理經驗。我們在時間表中預留緩衝，備有後備供應商，並準備應對常見狀況（技術故障、演講者缺席、天氣變化）。我們會迅速解決問題，確保活動如常進行。"
              }
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold mb-3">{item.q}</h3>
                <p className="text-gray-700 leading-relaxed">{item.a}</p>
              </div>
            )) : [
              {
                q: "How much does an event with Radiance cost?",
                a: "It depends on event size, complexity, and duration. A press preview for 80 people might run $15–25K in total spend (including venue, catering, AV, staffing, and production). A larger community activation could be $40K+. We work within your budget and can scale services to fit."
              },
              {
                q: "How long does it take to plan an event?",
                a: "A typical timeline is 6–8 weeks for medium-sized events (50–150 people). Large events or complex activations might need 3–4 months. Smaller press previews can be planned in 4–6 weeks. We'll work faster if needed, but we recommend adequate lead time for best vendor partnerships and media outreach."
              },
              {
                q: "Can you handle both event planning and the creative design (signage, collateral)?",
                a: "Yes. We handle event planning, logistics, and basic collateral design (invitations, signage, press kits). For larger creative projects (experiential design, elaborate set pieces), we can partner with specialized production partners or coordinate with your in-house creative team."
              },
              {
                q: "Do you handle virtual or hybrid events?",
                a: "Absolutely. We've managed webinars, virtual product launches, and hybrid events combining in-person and online attendance. We work with event platforms, manage live streaming, coordinate speaker setup, and engage online audiences real-time."
              },
              {
                q: "What if something goes wrong on the day of the event?",
                a: "Our team is trained in contingency management. We build buffers into timelines, have backup vendors on standby, and are prepared for common issues (tech failures, no-show speakers, weather). We'll solve problems quickly and keep your event on track."
              }
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold mb-3">{item.q}</h3>
                <p className="text-gray-700 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">{lang === 'zh' ? '準備好打造一場難忘的活動了嗎？' : 'Ready to Create an Unforgettable Event?'}</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            {lang === 'zh'
              ? '無論您正在籌備產品發布、社區建設還是里程碑慶典，Radiance 都能助您設計並執行一場引發話題、吸引媒體報導、留下美好回憶的活動。讓我們一起探討您的願景，共同創造非凡體驗。'
              : 'Whether you\'re launching a product, building community, or celebrating a milestone, Radiance can help you design and execute an event that generates buzz, press coverage, and lasting memories. Let\'s talk about your vision and the experience we can create together.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              {lang === 'zh' ? '立即策劃活動' : 'Plan an Event'}
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition">
              {lang === 'zh' ? '與我們的團隊交流' : 'Speak with Our Team'}
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
              <p className="text-sm">{lang === 'zh' ? '為香港品牌提供公關及行銷科技服務' : 'PR & Martech for Hong Kong brands'}</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">{lang === 'zh' ? '服務' : 'Services'}</h4>
              <ul className="text-sm space-y-2">
                <li><a href="/vibe-demo/radiance/public-relations" className="hover:text-white transition">Public Relations</a></li>
                <li><a href="/vibe-demo/radiance/social-content" className="hover:text-white transition">{lang === 'zh' ? '社交媒體及內容' : 'Social Media & Content'}</a></li>
                <li><a href="/vibe-demo/radiance/kol-influencer" className="hover:text-white transition">{lang === 'zh' ? 'KOL及網紅' : 'KOL & Influencer'}</a></li>
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
