'use client';

import { useLanguage } from '../hooks/useLanguage';

export default function KOLInfluencerPage() {
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
            {lang === 'zh' ? 'KOL及網紅行銷' : 'KOL & Influencer Marketing'}
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            {lang === 'zh'
              ? '透過與值得信賴的聲音建立真實合作夥伴關係，放大您的觸及力——從宏觀網紅到充滿熱情的微型網紅，為您的品牌連結活躍且高度相關的受眾。'
              : 'Amplify your reach through authentic partnerships with trusted voices—from macro-influencers to passionate micro-influencers who connect your brand with engaged, relevant audiences.'}
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            {lang === 'zh'
              ? '網紅行銷的關鍵在於找到合適的聲音來講述您的故事。Radiance 識別與您品牌價值相符的KOL及網紅，管理合作洽談及推廣活動，並追蹤真實的互動成果。我們跨越生活時尚、科技、可持續發展、教育及社會影響等領域，與建立了真誠受眾信任的創作者合作。從種草到促進轉化，我們統籌策劃自然流暢、成效可量的網紅推廣活動。'
              : 'Influencer marketing is about finding the right voices to tell your story. At Radiance, we identify KOLs and influencers whose values align with your brand, manage partnership negotiations and campaigns, and track authentic engagement outcomes. We work across lifestyle, technology, sustainability, education, and social impact—with creators who have built genuine audience trust. From seeding product awareness to driving conversions, we orchestrate influencer campaigns that feel natural and deliver measurable results.'}
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{lang === 'zh' ? '為何KOL及網紅行銷至關重要' : 'Why KOL & Influencer Marketing Matters'}</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            {lang === 'zh'
              ? '受眾對所追蹤者的推薦，比傳統廣告更加信任。網紅合作借助這份信任——透過受眾花時間的渠道，以真實的聲音傳遞您的品牌信息。最出色的網紅推廣活動不像廣告，而像朋友的真誠推薦，這正是它比大多數付費渠道帶來更高互動、認知度及轉化率的原因。'
              : 'Audiences trust recommendations from people they follow more than traditional advertising. Influencer partnerships leverage this trust—amplifying your brand message through authentic voices in channels where your customers spend time. The best influencer campaigns don\'t feel like ads; they feel like genuine recommendations from friends, which is why they drive higher engagement, awareness, and conversion than most paid channels.'}
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '信任與真實性：' : 'Trust & Authenticity:'}</strong> {lang === 'zh' ? '受眾信任網紅推薦勝於品牌廣告，令網紅合作更具公信力及說服力。' : 'Audiences trust influencer recommendations over brand advertising, making influencer partnerships highly credible and effective.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '精準觸及：' : 'Targeted Reach:'}</strong> {lang === 'zh' ? '網紅讓您觸及特定受眾群體（細分興趣、人口特徵、價值觀），直達客戶聚集的地方。' : 'Influencers allow you to reach specific audience segments (niche interests, demographics, values) where your customers congregate.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '內容生成：' : 'Content Generation:'}</strong> {lang === 'zh' ? '網紅合作產生真實的內容資產（帖子、限時動態、影片），可在您的自有渠道重複使用。' : 'Influencer partnerships produce authentic content assets (posts, stories, videos) that you can repurpose across your own channels.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '以績效為本的投資回報：' : 'Performance-Based ROI:'}</strong> {lang === 'zh' ? '與部分行銷渠道不同，網紅合作可圍繞特定關鍵績效指標——點擊、登記、購買——進行結構化設計。' : 'Unlike some marketing channels, influencer partnerships can be structured around specific KPIs—clicks, sign-ups, purchases.'}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">{lang === 'zh' ? '我們的KOL及網紅行銷方法' : 'Our Approach to KOL & Influencer Marketing'}</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '我們相信網紅行銷成功的秘訣在於契合度——找到受眾與價值觀均與您品牌相符的創作者。我們不只追求追蹤者數量；我們看重真實的互動、受眾相關性及合作適配度。然後策略性地管理推廣活動，給予創作者創意自由，同時確保您的品牌信息清晰傳達。'
              : 'We believe the secret to influencer marketing success is alignment—finding creators whose audiences and values match your brand. We don\'t just chase follower counts; we look for authentic engagement, audience relevance, and partnership fit. We then manage campaigns strategically, giving creators creative freedom while ensuring your brand message comes through clearly.'}
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '策略性網紅識別' : 'Strategic Influencer Identification'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們跨越各類別——生活時尚、科技、可持續發展、商業、教育——研究並審核網紅，識別具備真實受眾互動（而非單純追蹤者數量）的創作者。我們分析受眾人口特徵、互動率、內容契合度及合作歷史。然後推薦宏觀、中層及微型網紅的精選組合，其追蹤者與您的目標客戶相符。'
                  : 'We research and vet influencers across categories—lifestyle, tech, sustainability, business, education—identifying creators with genuine audience engagement (not just follower count). We analyze audience demographics, engagement rates, content alignment, and partnership history. We then recommend a curated mix of macro, mid-tier, and micro-influencers whose followers match your target customer.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '合作洽談與合約管理' : 'Partnership Negotiation & Contract Management'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們代您洽談合作條款、費率、內容規格及交付要求。我們管理合約、追蹤交付物，並確保創作者符合約定的時間表及內容標準。您對合作條款及成果享有完全透明度，無需直接處理洽談事宜。'
                  : 'We negotiate partnership terms, rates, content specifications, and deliverables on your behalf. We manage contracts, track deliverables, and ensure creators meet agreed-upon timelines and content standards. You get complete transparency on partnership terms and outcomes without needing to manage negotiations directly.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '推廣活動策略與創意指引' : 'Campaign Strategy & Creative Guidance'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們制定網紅推廣活動簡報，為創作者提供方向（關鍵信息、主題標籤、行動呼籲、必要產品特點），同時保留創意自由。我們向網紅說明推廣活動時間、受眾洞察及品牌定位。我們在發布前審閱內容草稿，確保信息契合，同時保留真實性。'
                  : 'We develop influencer campaign briefs that give creators direction (key messages, hashtags, CTAs, required product features) while allowing creative freedom. We brief influencers on campaign timing, audience insights, and brand positioning. We review content drafts before publishing to ensure alignment without killing authenticity.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '表現追蹤與優化' : 'Performance Tracking & Optimization'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們監察網紅內容的互動情況——讚好、評論、分享、點擊率，以及適用時的轉化數據。我們識別表現最佳的創作者及內容角度，並建議調整或後續推廣活動。我們每月匯報觸及、互動、情感分析，以及與您的關鍵績效指標掛鈎的業務成果。'
                  : 'We monitor engagement on influencer content—likes, comments, shares, click-through rates, and conversion metrics if applicable. We identify top-performing creators and content angles, and recommend adjustments or follow-up campaigns. We report monthly on reach, engagement, sentiment, and business outcomes tied to your KPIs.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '關係管理與長期維繫' : 'Relationship Management & Retention'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '優質的網紅合作會發展成長期關係。我們培育與頂尖創作者的持續關係，洽談多輪推廣活動安排，並建立品牌大使計劃。忠誠的創作者成為真實的品牌擁護者，隨時間推移帶來更佳成效和更高真實性。'
                  : 'Great influencer partnerships become long-term relationships. We cultivate ongoing relationships with top-performing creators, negotiate multi-campaign arrangements, and build ambassador programs. Loyal creators become authentic brand advocates, delivering better results and authenticity over time.'}
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
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '網紅識別與審核' : 'Influencer Identification & Vetting'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '網紅市場研究及類別分析' : 'Influencer landscape research and category mapping'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '受眾人口特徵及互動分析（使用社交工具）' : 'Audience demographic and engagement analysis (using social tools)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '內容契合度評估及合作適配度評核' : 'Content alignment assessment and partnership fit evaluation'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '跨層級（宏觀、中層、微型）精選網紅推薦' : 'Curated influencer recommendations across tiers (macro, mid, micro)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '受眾真實性及造假帳戶偵測分析' : 'Audience authenticity and fraud detection analysis'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '推廣活動策略與規劃' : 'Campaign Strategy & Planning'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? 'KOL/網紅推廣活動目標及關鍵績效指標界定' : 'KOL / influencer campaign objectives and KPI definition'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '內容簡報制定及推廣活動指引' : 'Content brief development and campaign guidelines'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '推廣活動時間表及順序策略' : 'Campaign timeline and sequencing strategy'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '網紅組合及預算分配優化' : 'Influencer mix and budget allocation optimization'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '與公關、活動及社交推廣活動整合' : 'Integration with PR, events, and social campaigns'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '合作管理與洽談' : 'Partnership Management & Negotiation'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '網紅聯絡及關係建立' : 'Influencer outreach and relationship building'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '費率洽談及合作條款討論' : 'Rate negotiation and partnership term discussion'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '合約草擬及交付物規格制定' : 'Contract drafting and deliverable specification'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '付款處理及合規管理' : 'Payment processing and compliance management'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '多輪推廣活動及品牌大使計劃安排' : 'Multi-campaign and ambassador program arrangements'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '推廣活動執行與協調' : 'Campaign Execution & Coordination'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '創作者簡報及內容審批流程' : 'Creator briefing and content approval process'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '產品種草及樣品提供（如適用）' : 'Product seeding and sample provision (if applicable)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '內容草稿審閱及反饋協調' : 'Content draft review and feedback coordination'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '發布時間協調及推廣規劃' : 'Publishing timing coordination and promotion planning'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '推廣活動期間的即時互動支援' : 'Real-time engagement support during campaign period'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '表現量度與匯報' : 'Performance Measurement & Reporting'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '即時內容監察及互動追蹤' : 'Real-time content monitoring and engagement tracking'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '推廣活動表現匯報（觸及、互動、情感、轉化）' : 'Campaign performance reporting (reach, engagement, sentiment, conversion)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '投資回報分析及每次成效成本計算' : 'ROI analysis and cost-per-outcome calculation'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '創作者表現基準比較及建議' : 'Creator performance benchmarking and recommendations'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '為您自有渠道提供內容再利用指引' : 'Content repurposing guidance for your owned channels'}</li>
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
              ? 'Radiance 為消費品牌、科技初創、非政府組織及文化機構策劃網紅推廣活動——識別合適的創作者，管理能提升認知度、互動及轉化的合作夥伴關係。以下展示我們如何協助不同品牌透過網紅聲音放大影響力。'
              : 'Radiance has orchestrated influencer campaigns for consumer brands, tech startups, NGOs, and cultural institutions—identifying the right creators and managing partnerships that drive awareness, engagement, and conversions. Here\'s how we help different brands amplify through influencer voices.'}
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '美容及健康品牌建立創作者網絡' : 'Beauty & Wellness Brand Building Creator Network'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一個進入香港市場的新護膚品牌，希望在美容意識強的千禧一代中建立公信力。我們識別了20位美容、健康及生活時尚類別的微型網紅（1萬至10萬追蹤者），他們擁有高度活躍的受眾。我們洽談產品種草合作，向網紅說明品牌故事，並協調為期3個月的內容發布。網紅創作了真實的開箱影片、護膚程序及產品評測，感覺自然真誠。'
                  : 'A new skincare brand entering Hong Kong wanted to build credibility with beauty-conscious millennials. We identified 20 micro-influencers (10K–100K followers) in beauty, wellness, and lifestyle categories with highly engaged audiences. We negotiated product seeding partnerships, briefed influencers on brand story, and coordinated content rollout over 3 months. Influencers created authentic unboxing videos, skincare routines, and product reviews that felt genuine.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '網紅發文合計觸及250萬；平均互動率8%（行業基準的3倍）；15%的互動受眾訪問品牌網站；品牌在首6個月達到2.5萬Instagram追蹤者，主要源自網紅受眾轉化。' : '2.5M combined reach across influencer posts; 8% average engagement rate (3x industry benchmark); 15% of engaged audience visited brand website; brand achieved 25K Instagram followers in first 6 months, largely driven by influencer audience conversion.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '科技初創以KOL公信力策略發布產品' : 'Tech Startup Launching with KOL Credibility Strategy'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家AI教育科技初創希望觸及教育工作者及家長，同時建立行業公信力。我們識別了教育、育兒及科技類別的宏觀網紅（20萬至50萬追蹤者），以及能將產品定位為創新前沿的行業KOL（學者、教育工作者）。我們協調網紅合作與公關簡報，以放大自然媒體報導的效果。'
                  : 'An AI education tech startup wanted to reach educators and parents while establishing industry credibility. We identified macro-influencers (200K–500K followers) in education, parenting, and tech categories—plus industry KOLs (academics, educators) who could position the product as innovation-forward. We coordinated influencer partnerships with PR briefings to amplify earned media coverage.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '5篇網紅發文合計產生75萬曝光；平均點擊率12%，引導至產品示範；300多位教育工作者登記，來自網紅流量；合作帶來6篇媒體報導，記者被網紅的熱情所吸引。' : '5 influencer posts generated 750K combined impressions; 12% average click-through rate to product demo; 300+ educator sign-ups attributed to influencer traffic; partnership generated 6 media mentions as journalists picked up influencer enthusiasm.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '可持續發展非政府組織建立擁護者社群' : 'Sustainability NGO Building Advocate Community'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家可持續發展非政府組織希望動員年輕受眾參與重大推廣活動發布。我們識別了可持續發展、生活時尚及社會影響類別的微型及中層網紅——許多人具有明確的價值觀契合。我們創建了品牌大使計劃，為網紅提供推廣活動工具後台訪問權限及早期故事講述機會，將他們轉化為持續的擁護者，而非一次性合作夥伴。'
                  : 'A sustainability NGO wanted to mobilize younger audiences for a major campaign launch. We identified micro and mid-tier influencers in sustainability, lifestyle, and social impact categories—many with explicit values alignment. We created an ambassador program offering influencers backend access to campaign tools and early storytelling opportunities, turning them into ongoing advocates rather than one-off partners.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '10位品牌大使在6個月內創作逾40篇帖子；觸及180萬，互動率6%；推廣活動網站吸引5,000次登記，來自網紅流量；品牌大使計劃現已擴展至25位創作者，持續合作中。' : '10 ambassadors created 40+ posts over 6 months; 1.8M reach with 6% engagement rate; campaign site generated 5K sign-ups from influencer traffic; ambassador program has now expanded to 25 creators with ongoing collaboration.'}
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
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '策略與網紅識別' : 'Strategy & Influencer Identification'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們首先了解您的目標受眾、推廣活動目標及預算。然後研究並識別各層級10至30位潛在網紅，分析其受眾及互動情況，並提供附有理據的推薦。您批准我們推薦的網紅組合後，我們才開始聯絡。'
                  : 'We begin by understanding your target audience, campaign goals, and budget. We then research and identify 10–30 potential influencers across tiers, analyze their audiences and engagement, and present recommendations with rationale. You approve our recommended influencer mix before we move to outreach.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '合作洽談與規劃' : 'Partnership Negotiation & Planning'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們與已選定的網紅洽談費率、條款及交付物，並處理合約管理。我們制定推廣活動簡報，說明您的品牌、關鍵信息、內容規格及時間表。網紅在保持創意自由的同時獲得清晰的方向。'
                  : 'We negotiate rates, terms, and deliverables with selected influencers and handle contract management. We develop campaign briefs explaining your brand, key messages, content specifications, and timelines. Influencers receive clear direction while maintaining creative freedom.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '推廣活動執行與監察' : 'Campaign Execution & Monitoring'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們在網紅內容發布時即時監察，追蹤互動數據，並標記表現最佳的帖子及趨勢。我們協調多位網紅的發布時間，製造推廣活動聲勢。您每日獲得更新，可即時看到影響力。'
                  : 'We monitor influencer content as it publishes, track engagement metrics in real-time, and flag top-performing posts and trends. We coordinate timing across multiple influencers to create campaign momentum. You get daily updates and can see impact as it happens.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '分析與未來策略' : 'Analysis & Future Strategy'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們整合全面的推廣活動報告，包括觸及、互動、轉化及投資回報分析。我們識別表現最佳的創作者及內容主題，並推薦後續推廣活動、品牌大使計劃或與高績效創作者的長期合作。'
                  : 'We compile comprehensive campaign reports with reach, engagement, conversions, and ROI analysis. We identify top-performing creators and content themes. We recommend follow-up campaigns, ambassador programs, or long-term partnerships with high-performers.'}
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
                q: "你們如何為我們的品牌找到合適的網紅？",
                a: "我們研究受眾人口特徵、互動率、內容契合度及品牌安全性。我們超越追蹤者數量，著重真實互動及受眾相關性。我們審核創作者合作記錄，核查受眾真實性，並確保價值觀契合。這需要時間，因此我們建議為推廣活動規劃預留8至12週的前置期。"
              },
              {
                q: "宏觀與微型網紅有何分別？",
                a: "宏觀網紅（10萬以上追蹤者）提供廣泛觸及及認知度。微型網紅（1萬至10萬）通常具有更高的互動率及更精準的受眾。大多數成功的推廣活動兩者兼備：宏觀網紅負責認知度，微型網紅負責互動及轉化。我們根據您的目標及預算推薦策略性組合。"
              },
              {
                q: "網紅可以隨意發帖，還是需要審批？",
                a: "我們向網紅提供指引及關鍵信息，然後他們以自己的真實聲音創作內容。他們在發布前與我們分享草稿進行審批——我們確保品牌信息傳達清晰，同時不扼殺真實性。大多數創作者欣賞這種協作方式。"
              },
              {
                q: "你們如何衡量網紅推廣活動的投資回報？",
                a: "我們追蹤觸及、互動率、受眾增長、點擊率、轉化（如可追蹤）及每次成效成本。我們對比基準及過往推廣活動衡量表現。對於認知度推廣活動，我們專注於觸及及情感分析。對於轉化推廣活動，我們將網紅內容與實際登記或購買掛鈎。"
              },
              {
                q: "我們是否可以與網紅建立長期關係，而非一次性合作？",
                a: "當然可以。我們推薦品牌大使計劃，讓創作者成為持續的品牌擁護者。長期關係往往比一次性合作帶來更佳的真實性及投資回報。我們可以按議定費率安排每月或每季度的推廣活動。"
              }
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold mb-3">{item.q}</h3>
                <p className="text-gray-700 leading-relaxed">{item.a}</p>
              </div>
            )) : [
              {
                q: "How do you find the right influencers for our brand?",
                a: "We research audience demographics, engagement rates, content alignment, and brand safety. We look beyond follower count to authentic engagement and audience relevance. We vet creator partnerships, check audience authenticity, and ensure values alignment. This takes time, which is why we recommend starting with 8–12 weeks of lead time for campaign planning."
              },
              {
                q: "What's the difference between macro and micro-influencers?",
                a: "Macro-influencers (100K+ followers) offer broad reach and awareness. Micro-influencers (10K–100K) typically have higher engagement rates and more niche audiences. Most successful campaigns blend both: macros for awareness, micros for engagement and conversion. We recommend a strategic mix based on your goals and budget."
              },
              {
                q: "Can influencers post what they want, or do they need approval?",
                a: "We brief influencers with guidelines and key messages, then they create content in their authentic voice. They share drafts with us for approval before publishing—we ensure brand message comes through without killing authenticity. Most creators appreciate this collaborative approach."
              },
              {
                q: "How do you measure influencer campaign ROI?",
                a: "We track reach, engagement rate, audience growth, click-through rates, conversions (if traceable), and cost-per-outcome. We compare performance against benchmarks and previous campaigns. For awareness campaigns, we focus on reach and sentiment. For conversion campaigns, we tie influencer content to actual sign-ups or purchases."
              },
              {
                q: "Can we build long-term relationships with influencers rather than one-off campaigns?",
                a: "Absolutely. We recommend ambassador programs where creators become ongoing brand advocates. Long-term relationships often deliver better authenticity and ROI than one-off partnerships. We can structure monthly or quarterly campaign arrangements at negotiated rates."
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
          <h2 className="text-3xl font-bold mb-6">{lang === 'zh' ? '準備好透過網紅合作放大影響力了嗎？' : 'Ready to Amplify Through Influencer Partnerships?'}</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            {lang === 'zh'
              ? '無論您正在推出產品、提升認知度，還是深化受眾連結，Radiance 都能助您識別合適的網紅，統籌策劃帶來實質成果的推廣活動。讓我們建立真實自然、推動業務增長的合作夥伴關係。'
              : 'Whether you\'re launching a product, building awareness, or deepening audience connection, Radiance can help you identify the right influencers and orchestrate campaigns that deliver results. Let\'s build partnerships that feel authentic and drive business outcomes.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              {lang === 'zh' ? '立即策劃網紅推廣活動' : 'Plan an Influencer Campaign'}
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
                <li><a href="/vibe-demo/radiance/events" className="hover:text-white transition">{lang === 'zh' ? '活動策劃與體驗' : 'Events & Experiences'}</a></li>
                <li><a href="/vibe-demo/radiance/social-content" className="hover:text-white transition">{lang === 'zh' ? '社交媒體及內容' : 'Social Media & Content'}</a></li>
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
