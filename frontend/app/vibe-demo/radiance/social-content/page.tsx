'use client';

import { useLanguage } from '../hooks/useLanguage';

export default function SocialContentPage() {
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
            {lang === 'zh' ? '社交媒體及內容創作' : 'Social Media & Content'}
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            {lang === 'zh'
              ? '以策略性社交規劃、持續內容創作及引人入勝的推廣活動主導對話，讓您的品牌始終保持關注度，同時建立真實的受眾連結。'
              : 'Own the conversation with strategic social planning, always-on content creation, and engaging campaigns that keep your brand top-of-mind while building authentic audience connection.'}
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            {lang === 'zh'
              ? '社交媒體的關鍵不在於持續發帖，而在於真實在場、即時回應並為受眾提供價值。Radiance 制定全面的社交策略，涵蓋平台選擇、內容構思、社群管理及付費推廣。我們創作長短格式影片內容，設計視覺吸引力強的社交素材，並在推廣活動及活動期間協調即時社交回應。無論是持續性品牌內容、以推廣活動為主導的社交發佈，還是危機溝通，我們都能助您保持勢頭，深化受眾關係。'
              : 'Social media isn\'t about posting consistently—it\'s about being present, responsive, and valuable. At Radiance, we build comprehensive social strategies that span platform selection, content ideation, community management, and paid amplification. We create long-form and short-form video content, design visually compelling social assets, and coordinate real-time social response during campaigns and events. Whether it\'s always-on brand content, campaign-driven social, or crisis communication, we help you maintain momentum and deepen audience relationships.'}
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{lang === 'zh' ? '為何社交媒體及內容創作至關重要' : 'Why Social Media & Content Matters'}</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            {lang === 'zh'
              ? '社交平台是受眾花費時間、發現品牌及作出購買決策的地方。策略性社交媒體不只是娛樂——它是直達客戶的渠道、放大公關及活動效果的途徑，也是即時收集反饋的來源。掌握持續內容創作及積極社群管理的品牌，能建立更強的客戶忠誠度，並產生可跨所有行銷渠道延伸的內容。'
              : 'Social platforms are where audiences spend time, discover brands, and make purchasing decisions. Strategic social media isn\'t just entertainment—it\'s a direct channel to customers, a way to amplify PR and events, and a source of real-time feedback. Brands that master always-on content and responsive community management build stronger customer loyalty and generate content that extends across all marketing channels.'}
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '建立受眾關係：' : 'Audience Relationship Building:'}</strong> {lang === 'zh' ? '社交平台讓您與客戶及持份者即時建立真實連結。' : 'Social platforms enable direct, authentic connection with customers and stakeholders in real time.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '內容擴散中心：' : 'Content Amplification Hub:'}</strong> {lang === 'zh' ? '社交媒體延長公關、活動及影片內容的生命周期——在各平台成倍提升觸及與互動。' : 'Social media extends the life of PR, event, and video content—multiply reach and engagement across platforms.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '即時相關性：' : 'Real-Time Relevance:'}</strong> {lang === 'zh' ? '社交媒體讓您迅速回應潮流趨勢，把握時機，在推廣活動期間保持關注度。' : 'Social allows you to respond quickly to trends, capitalize on moments, and stay top-of-mind during campaigns.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '表現數據洞察：' : 'Performance Insights:'}</strong> {lang === 'zh' ? '社交媒體數據直接反映受眾對內容的共鳴，為未來策略提供重要參考。' : 'Social metrics provide direct feedback on what resonates with your audience, informing future strategy.'}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">{lang === 'zh' ? '我們的社交媒體及內容創作方法' : 'Our Approach to Social Media & Content'}</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '我們相信，優秀的社交內容始於策略——了解您的受眾、界定您的聲音，以及選擇客戶真正使用的平台。我們將計劃性內容（日曆、推廣活動）與即時互動（實時回覆評論、緊貼潮流話題、回應社群需求）有機結合。這種組合建立真實的動力，將受眾轉化為品牌擁護者。'
              : 'We believe great social content starts with strategy—understanding your audience, defining your voice, and choosing platforms where your customers actually spend time. We then blend planned content (calendars, campaigns) with responsive engagement (real-time comments, trending topics, community needs). This combination builds authentic momentum and turns audiences into advocates.'}
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '受眾優先策略' : 'Audience-First Strategy'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們深入研究目標受眾——人口特徵、平台偏好、內容消費習慣、痛點及價值觀。然後界定您的社交定位：優先發展哪些平台、品牌聲音應如何呈現、哪類內容最能引起共鳴，以及如何在競爭中脫穎而出。這一策略成為所有內容決策的基礎。'
                  : 'We research your target audiences—demographics, platform preferences, content consumption habits, pain points, and values. We then define your social presence: which platforms to prioritize, what your brand voice should be, what types of content resonate, and how to differentiate from competitors. This strategy becomes the foundation for all content decisions.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '內容構思與規劃' : 'Content Ideation & Planning'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們制定3至6個月的內容日曆，涵蓋主題、推廣活動日期、核心話題及季節性內容。我們構思與品牌價值及受眾興趣相符的內容概念（教育性、娛樂性、啟發性、用戶生成內容），再按平台調適——LinkedIn長文、TikTok短片、Instagram視覺故事、Twitter即時資訊。'
                  : 'We develop 3–6 month content calendars with themes, campaign dates, pillar topics, and seasonal content. We ideate content concepts (educational, entertaining, inspirational, user-generated) that reflect your brand values and audience interests. We then adapt these concepts for each platform—long-form on LinkedIn, short-form on TikTok, visual storytelling on Instagram, real-time updates on Twitter.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '影片及視覺內容製作' : 'Video & Visual Content Creation'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '影片在各平台驅動互動。我們製作長形式內容（10至30分鐘紀錄片、訪談、幕後故事）、中形式內容（3至5分鐘教育或故事影片）及短形式內容（15至60秒TikTok、Reels、Shorts）。我們亦設計靜態社交素材（資訊圖表、引述圖、海報），既符合品牌美學，又能令滑動瀏覽的用戶駐足。'
                  : 'Video drives engagement across platforms. We produce long-form content (10–30 min documentaries, interviews, behind-the-scenes), mid-form content (3–5 min educational or story videos), and short-form content (15–60 sec TikToks, Reels, Shorts). We also design static social assets (infographics, quotes, posters) that reflect your brand aesthetic and stop scrolls.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '社群管理與互動' : 'Community Management & Engagement'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們監察各平台的評論、訊息及提及，回答受眾問題，讚揚用戶創作，並管理社群對話。我們主動參與相關主題標籤、趨勢話題及社群討論，建立存在感與關係。在推廣活動及活動期間，我們提供即時社交更新及擴散支援。'
                  : 'We monitor comments, messages, and mentions across platforms, responding to audience questions, celebrating user content, and moderating conversations. We proactively engage with relevant hashtags, trends, and community discussions to build presence and relationships. During campaigns and events, we provide real-time social updates and amplification.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '付費社交及推廣活動擴散' : 'Paid Social & Campaign Amplification'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '自然觸及有其局限。我們制定付費社交策略——定向、預算、創意測試、受眾細分——以放大重要內容及推廣活動。我們A/B測試不同廣告創意、著陸頁及信息，以優化表現。我們追蹤廣告支出回報率及互動數據，持續提升推廣活動效率。'
                  : 'Organic reach has limits. We develop paid social strategies—targeting, budgets, creative testing, audience segmentation—to amplify key content and campaigns. We A/B test different ad creative, landing pages, and messaging to optimize performance. We track ROAS and engagement metrics to continuously improve campaign efficiency.'}
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
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '社交策略與規劃' : 'Social Strategy & Planning'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '受眾研究及社交平台審計' : 'Audience research and social platform audit'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '品牌聲音及社交媒體語調指引' : 'Brand voice and tone-of-voice guidelines for social'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '平台選擇及策略建議（Instagram、TikTok、LinkedIn、Twitter等）' : 'Platform selection and strategic recommendation (Instagram, TikTok, LinkedIn, Twitter, etc.)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '涵蓋主題、推廣活動及核心話題的3至6個月內容日曆' : '3–6 month content calendar with themes, campaigns, and pillar topics'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '主題標籤策略及內容標籤框架' : 'Hashtag strategy and content tagging framework'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '內容創作與製作' : 'Content Creation & Production'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '長形式影片製作（10至30分鐘：紀錄片、訪談、深度專題）' : 'Long-form video production (10–30 minutes: documentaries, interviews, features)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '中形式影片（3至5分鐘：教育、故事講述、教學）' : 'Mid-form video (3–5 minutes: educational, storytelling, how-tos)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '短形式影片（15至60秒：TikTok、Instagram Reels、YouTube Shorts）' : 'Short-form video (15–60 seconds: TikTok, Instagram Reels, YouTube Shorts)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '攝影方向、拍攝及造型' : 'Photography direction, shooting, and styling'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '平面設計及社交素材創作（帖子、限時動態、輪播、資訊圖表）' : 'Graphic design and social asset creation (posts, stories, carousels, infographics)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '動態圖形及動畫內容' : 'Motion graphics and animated content'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '所有社交格式的文案撰寫及標題創作' : 'Copywriting and captions for all social formats'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '社群管理與互動' : 'Community Management & Engagement'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '跨平台每日社交媒體發帖與排程' : 'Daily social media posting and scheduling across platforms'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '評論及訊息監察與回覆管理' : 'Comment and message monitoring and response management'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '社群互動及對話推動' : 'Community engagement and conversation facilitation'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '主題標籤及趨勢監察，捕捉即時互動機會' : 'Hashtag and trend monitoring for real-time engagement opportunities'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '用戶生成內容策展及轉發' : 'User-generated content curation and reposting'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '危機社交回應及聲譽監察' : 'Crisis social response and reputation monitoring'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '付費社交及推廣活動擴散' : 'Paid Social & Campaign Amplification'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '付費社交策略及預算規劃' : 'Paid social strategy and budget planning'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '廣告創意開發及A/B測試' : 'Ad creative development and A/B testing'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '受眾定向及細分策略' : 'Audience targeting and segmentation strategy'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '跨平台推廣活動設置、管理及優化' : 'Campaign setup, management, and optimization across platforms'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '再定向及轉化優化' : 'Retargeting and conversion optimization'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '表現追蹤及廣告支出回報率匯報' : 'Performance tracking and ROAS reporting'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '數據分析與匯報' : 'Analytics & Reporting'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '每月社交媒體分析報告（觸及、互動、追蹤者增長、情感分析）' : 'Monthly social analytics reports (reach, engagement, follower growth, sentiment)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '內容表現分析及內容系列建議' : 'Content performance analysis and content series recommendations'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '受眾增長及人口特徵追蹤' : 'Audience growth and demographic tracking'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '推廣活動投資回報分析及優化建議' : 'Campaign ROI analysis and optimization recommendations'}</li>
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
              ? 'Radiance 協助消費品牌、科技初創、非政府組織及機構建立活躍的社交社群——從創建新帳戶，到管理擁有逾10萬追蹤者的成熟社交媒體。我們推動認知推廣活動、放大產品發布聲勢，並建立忠誠社群，將追蹤者轉化為品牌擁護者。'
              : 'Radiance has helped consumer brands, tech startups, NGOs, and institutions build engaged social communities—from launching new accounts to managing mature social presence with 100K+ followers. We\'ve driven awareness campaigns, amplified product launches, and built loyalty communities that turn followers into advocates.'}
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '消費品牌圍繞價值觀建立社群' : 'Consumer Brand Building Community Around Values'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一個可持續時裝品牌希望建立有意識的消費者社群，並在競爭中脫穎而出。我們制定以幕後故事、客戶聚光燈及可持續發展教育內容為核心的社交策略。我們每月製作紀錄片式影片，展示工匠及生產過程，創建用戶生成內容推廣活動，讓客戶故事得以呈現，並管理日常社群互動以推動對話。'
                  : 'A sustainable fashion brand wanted to build a conscious consumer community and differentiate from competitors. We developed a social strategy focused on behind-the-scenes storytelling, customer spotlights, and educational content about sustainability. We produced monthly documentary-style videos showcasing artisans and production practices, created user-generated content campaigns celebrating customer stories, and managed daily engagement to build community conversation.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '12個月內Instagram追蹤者由2.5萬增至12萬；互動率由2%提升至7%；用戶生成內容推廣活動收到逾200份社群投稿；頂級影片觸及逾50萬次觀看。' : 'Grew Instagram following from 25K to 120K in 12 months; increased engagement rate from 2% to 7%; user-generated content campaigns generated 200+ community submissions; top videos reached 500K+ views.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '科技初創以社交認知推廣活動推出新產品' : 'Tech Startup Launching New Product with Social Awareness Campaign'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家人力資源科技初創推出全新AI招聘工具，需要提升認知度及吸引試用登記。我們開發整合社交推廣活動，結合教育性內容（招聘主管實用貼士）、產品示範影片、客戶見證影片及付費社交推廣。我們協調社交發布時間與公關公告一致，並配合KOL種草以擴大觸及。'
                  : 'An HR tech startup launching a new AI-powered recruitment tool needed to drive awareness and trial sign-ups. We developed an integrated social campaign combining educational content (tips for hiring managers), product demo videos, customer testimonial videos, and paid social amplification. We coordinated social launch timing with PR announcements and coordinated KOL seeding to extend reach.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '推廣活動從社交媒體帶來5,000次登記點擊；表現最佳的影片達12萬次觀看，登記轉化率達8%；每次試用成本較行業基準低40%。' : 'Campaign generated 5K sign-up clicks from social; top-performing video reached 120K views with 8% conversion rate to sign-ups; average cost per trial was 40% below industry benchmark.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '非政府組織以持續內容維持捐款人互動' : 'NGO Sustaining Donor Engagement Through Always-On Content'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家教育非政府組織希望在推廣活動期間之外，以持續故事講述維繫捐款人及支持者的投入。我們制定內容日曆，包括受惠者聚光燈、義工故事、研究亮點及影響力更新。我們為Instagram和TikTok製作學生成功故事短片，創建每月計劃影響力資訊圖表，並管理Facebook社群討論，建立忠誠度。'
                  : 'An education NGO wanted to keep donors and supporters engaged between campaign periods with ongoing storytelling. We developed a content calendar featuring beneficiary spotlights, volunteer stories, research highlights, and impact updates. We produced short videos of student success stories for Instagram and TikTok, created monthly infographics on program impact, and managed Facebook community discussions to build loyalty.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? 'Instagram互動率提升150%；受惠者聚光燈影片平均互動率達12%；社交媒體帶動的重複捐款按年增加35%。' : 'Instagram engagement increased 150%; beneficiary spotlight videos averaged 12% engagement rate; social-driven repeat donations increased 35% year-over-year.'}
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
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '探索與策略' : 'Discovery & Strategy'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們訪問您的團隊，分析您的受眾及競爭對手，並審計您現有的社交媒體存在。然後制定全面的社交策略，涵蓋受眾界定、平台選擇、內容支柱、語調指引，以及與業務目標相符的3至6個月內容日曆。'
                  : 'We interview your team, analyze your audience and competitors, and audit your current social presence. We then develop a comprehensive social strategy including audience definition, platform selection, content pillars, voice guidelines, and a 3–6 month content calendar aligned with your business goals.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '內容規劃與創作' : 'Content Planning & Creation'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們制定每月內容主題及詳細內容大綱。我們製作影片內容，設計社交素材，並撰寫標題以供審閱。您在發布前審閱並批准內容。我們以協作方式反復完善概念，直至完全符合您的願景。'
                  : 'We develop monthly content themes and detailed content outlines. We produce video content, design social assets, and write captions for approval. You review and approve content before publishing. We work collaboratively to refine concepts until they align perfectly with your vision.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '發布與社群管理' : 'Publishing & Community Management'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們按時在所有平台發布內容，監察互動及評論，回覆社群訊息，並識別即時互動機會。您每日獲得洞察，每週收到表現報告。我們標記需要付費擴散的推廣活動，並代您管理付費社交。'
                  : 'We publish content on schedule across all platforms, monitor engagement and comments, respond to community messages, and identify real-time engagement opportunities. You get daily insights and weekly reports on performance. We flag campaigns needing paid amplification and manage paid social on your behalf.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '分析與優化' : 'Analysis & Optimization'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們提供包含觸及、互動、追蹤者增長及情感分析的月度報告。我們識別哪些內容最能引起受眾共鳴，並建議策略調整。我們根據數據及新興機遇，持續優化您的社交存在。'
                  : 'We deliver monthly reports with reach, engagement, follower growth, and sentiment analysis. We identify what content resonates most with your audience and recommend adjustments to your strategy. We continuously optimize your social presence based on data and emerging opportunities.'}
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
                q: "典型的社交策略通常涉及多少影片內容？",
                a: "視乎您的平台及預算而定。全面的社交策略每月可能包括1條長形式影片（10至30分鐘）、2至4條中形式影片（3至5分鐘）及8至12條短形式影片（15至60秒）。我們亦會創作數十個靜態社交素材。我們可根據您的製作能力及預算調整數量。"
              },
              {
                q: "你們直接管理社交帳戶，還是由我們自行管理？",
                a: "兩者皆可。大多數客戶傾向讓我們管理發帖、排程及社群互動，以便他們專注於策略及審批。我們每日向您提供洞察及需要品牌語調回覆的標記評論。您無需每日登入帳戶，仍可對情況瞭如指掌。"
              },
              {
                q: "可以先從自然增長社交開始，之後再加入付費推廣嗎？",
                a: "當然可以。許多客戶從自然內容及社群管理開始，在看到哪些內容引起共鳴後才引入付費推廣活動。我們靈活應對，隨著投資回報逐漸明朗，可按需擴大付費投放。"
              },
              {
                q: "你們如何衡量社交媒體的投資回報？",
                a: "我們追蹤追蹤者增長、互動率、觸及及情感分析。對於推廣活動，我們將社交活動與轉化目標（登記、購買、活動報名）掛鈎。我們每月匯報對您業務最重要的指標，無論是品牌認知指標還是直接收入。"
              },
              {
                q: "如果我們已有社交媒體負責人怎麼辦？",
                a: "非常好。我們可與您的團隊並肩工作。我們可提供策略指引、內容創作及付費社交管理，而您的團隊負責日常社群管理。或者，我們可培訓您的團隊後逐步退場。我們對合作模式非常靈活。"
              }
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold mb-3">{item.q}</h3>
                <p className="text-gray-700 leading-relaxed">{item.a}</p>
              </div>
            )) : [
              {
                q: "How much video content does a typical social strategy involve?",
                a: "It depends on your platforms and budget. A comprehensive social strategy might include 1 long-form video (10–30 min), 2–4 mid-form videos (3–5 min), and 8–12 short-form videos (15–60 sec) per month. We also create dozens of static social assets. We can adjust volume based on your production capacity and budget."
              },
              {
                q: "Do you manage social accounts directly, or do we do that?",
                a: "We can do either. Most clients prefer we manage posting, scheduling, and community engagement so you can focus on strategy and approval. We send you daily insights and flagged comments requiring a brand voice response. You stay informed without needing to log in daily."
              },
              {
                q: "Can you start with organic-only social, then add paid amplification later?",
                a: "Absolutely. Many clients start with organic content and community management, then introduce paid campaigns as they see what resonates. We're flexible and can scale paid spend as ROI becomes clear."
              },
              {
                q: "How do you measure social media ROI?",
                a: "We track follower growth, engagement rate, reach, and sentiment. For campaigns, we tie social activity to conversion goals (sign-ups, purchases, event registrations). We report monthly on metrics that matter to your business, whether that's brand awareness metrics or direct revenue."
              },
              {
                q: "What if we already have a social media manager?",
                a: "Great. We can work alongside your team. We can provide strategic guidance, content creation, and paid social management while your team handles daily community management. Or we can train your team and step back. We're flexible about how we partner."
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
          <h2 className="text-3xl font-bold mb-6">{lang === 'zh' ? '準備好放大您的社交影響力了嗎？' : 'Ready to Amplify Your Social Presence?'}</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            {lang === 'zh'
              ? '無論您是從零開始，還是希望提升現有的社交策略，Radiance 都能助您建立真實的受眾連結並取得實質成果。讓我們共同制定一個將追蹤者轉化為品牌擁護者的社交策略。'
              : 'Whether you\'re starting from scratch or leveling up your existing social strategy, Radiance can help you build authentic audience connections and drive results. Let\'s develop a social strategy that turns followers into advocates.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              {lang === 'zh' ? '立即策劃社交推廣活動' : 'Plan a Social Campaign'}
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
