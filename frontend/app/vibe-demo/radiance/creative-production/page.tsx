'use client';

import { useLanguage } from '../hooks/useLanguage';

export default function CreativeProductionPage() {
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
            {lang === 'zh' ? '創意製作' : 'Creative & Production'}
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            {lang === 'zh'
              ? '以專業設計、影片製作、攝影及動態圖形將您的創意付諸實現——全程內部製作，確保一致性、效率與卓越品質。'
              : 'Bring your ideas to life with professional design, video production, photography, and motion graphics—created in-house to ensure consistency, speed, and creative excellence.'}
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            {lang === 'zh'
              ? '出色的推廣活動需要出色的創意。Radiance 在內部自主完成設計、影片、攝影及動態圖形製作——將創意從概念到成品，在數週內完成，而非數月。我們承接從品牌識別及活動宣傳物料到社交媒體素材及專業紀錄片式影片的一切工作。自主掌控製作流程，確保各渠道視覺一致，並以卓越創意放大您的公關、活動及社交推廣成效。'
              : 'Great campaigns need great creative. At Radiance, we produce design, video, photography, and motion graphics in-house—bringing ideas from concept to finished asset in weeks, not months. We handle everything from brand identity and event collateral to social media assets and professional documentary-style videos. By owning the production process, we ensure visual consistency across channels and deliver creative excellence that amplifies your PR, events, and social campaigns.'}
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{lang === 'zh' ? '為何創意製作至關重要' : 'Why Creative & Production Matters'}</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            {lang === 'zh'
              ? '在視覺為先的世界裡，專業創意不可或缺。精美的設計、精良的影片及震撼的攝影作品能令人駐足，傳遞專業形象，讓品牌留下深刻印記。內部製作意味著更快的周轉速度、視覺一致性，以及深諳您品牌脈絡的創意夥伴。與其將設計外包給不了解您推廣活動的代理商，不如擁有一個深度嵌入您策略的團隊。'
              : 'In a visual-first world, professional creative is non-negotiable. Beautiful design, polished video, and striking photography stop scrolls, convey professionalism, and make your brand memorable. In-house production means you move faster, maintain visual consistency, and get creative partners who understand your brand context. Rather than outsourcing design to agencies that don\'t know your campaigns, you get a team that\'s embedded in your strategy.'}
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '品牌一致性：' : 'Brand Consistency:'}</strong> {lang === 'zh' ? '內部創意確保每項資產——從社交帖子到活動標識再到影片——均呈現一致的品牌識別與信息。' : 'In-house creative ensures every asset—from social posts to event signage to videos—reflects your brand identity and messaging.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '快速上市：' : 'Speed to Market:'}</strong> {lang === 'zh' ? '內部製作意味著快速交付——概念可在數天內成為成品，而非數週，讓您把握趨勢與機遇。' : 'In-house production means rapid turnarounds—concepts can become finished assets in days, not weeks, allowing you to capitalize on trends and opportunities.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '內容倍增：' : 'Content Multiplication:'}</strong> {lang === 'zh' ? '專業影片及攝影創造可供公關、社交媒體、活動及網站使用的資產——跨渠道倍增價值。' : 'Professional video and photography create assets that feed PR, social media, events, and website—multiplying value across channels.'}</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>{lang === 'zh' ? '策略優勢：' : 'Strategic Advantage:'}</strong> {lang === 'zh' ? '深度嵌入推廣活動策略的創意團隊，能提出非情境化代理商所忽略的創新概念。' : 'Creative teams embedded in campaign strategy can innovate and suggest concepts that non-contextual agencies miss.'}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">{lang === 'zh' ? '我們的創意製作方法' : 'Our Approach to Creative & Production'}</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            {lang === 'zh'
              ? '我們以策略為起點——了解您的品牌、推廣活動、受眾及目標。然後構思植根於您敘事的概念，而非單純為美觀而美觀。我們以卓越品質製作——從攝影中的構圖與光線，到影片中的音效設計與調色。每項資產的誕生都有其意圖：推動推廣活動前進，強化品牌識別。'
              : 'We start with strategy—understanding your brand, campaigns, audience, and goals. We then ideate concepts rooted in your narrative, not just aesthetics for aesthetics\' sake. We produce with excellence—from composition and lighting in photography to sound design and color grading in video. Every asset is created with intention: it moves your campaign forward and reinforces your brand identity.'}
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '策略性創意概念開發' : 'Strategic Creative Concept Development'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們不只是讓事物看起來美觀——我們創造講述您故事的視覺。我們與您的公關及行銷團隊緊密合作，了解推廣活動主題、關鍵信息及受眾洞察。然後開發放大這些信息的創意概念——無論是社交推廣活動、活動宣傳物料，還是影片紀錄片。概念優先，執行其次。'
                  : 'We don\'t just make things pretty—we create visuals that tell your story. We work closely with your PR and marketing teams to understand campaign themes, key messages, and audience insights. We then develop creative concepts that amplify these messages—whether it\'s a social campaign, event collateral, or video documentary. Concept comes first; execution follows.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '專業攝影與造型' : 'Professional Photography & Styling'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們為產品展示、團隊肖像、活動記錄及生活時尚拍攝提供專業攝影服務。我們處理所有環節：拍攝方向、造型、場地勘察、燈光及後期製作。每張照片的構圖都是為了講述故事，並為印刷及數位使用而設計——確保無論是大型海報上的清晰震撼，還是社交媒體上的精巧呈現，同樣出色。'
                  : 'We produce professional photography for product showcases, team portraits, event coverage, and lifestyle shoots. We handle all aspects: shot direction, styling, location scouting, lighting, and post-production editing. Each photo is composed to tell a story and designed for both print and digital use—ensuring clarity and impact whether displayed large on a poster or small on social media.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '跨格式影片製作' : 'Video Production Across Formats'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '從紀錄片式長形式內容到生動的短形式社交影片，我們製作能引發共鳴的影片。我們負責所有製作階段：創意開發、場地勘察、拍攝、調色、音效設計及最終剪輯。我們為不同平台製作——YouTube影片、Instagram Reels、TikTok、LinkedIn內容——針對每個受眾優化格式、比例及節奏。'
                  : 'From documentary-style long-form content to snappy short-form social videos, we produce video that engages. We handle all production phases: creative development, location scouting, shooting, color grading, sound design, and final editing. We produce for different platforms—YouTube videos, Instagram Reels, TikToks, LinkedIn content—optimizing format, aspect ratio, and pacing for each audience.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '平面設計與視覺識別' : 'Graphic Design & Visual Identity'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們設計品牌宣傳物料、社交媒體圖形、資訊圖表、活動標識及數位資產。我們以您的品牌指引為基礎，在所有接觸點創造統一的視覺語言。設計不只是裝飾——它是功能性溝通。每張圖形的設計都旨在吸引眼球、清晰傳達，並引導行動。'
                  : 'We design brand collateral, social media graphics, infographics, event signage, and digital assets. We work from your brand guidelines to create cohesive visual language across all touchpoints. Design isn\'t just decoration—it\'s functional communication. Every graphic is designed to draw attention, communicate clearly, and guide action.'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">{lang === 'zh' ? '動態圖形與動畫' : 'Motion Graphics & Animation'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '動態吸引眼球。我們創作動畫解說影片、社交媒體動態圖形、動畫資訊圖表及影片片頭。動畫讓我們得以簡化複雜概念，為品牌內容注入個性，並創作在動態驅動互動的社交平台上表現最佳的素材。'
                  : 'Motion grabs attention. We create animated explainers, motion graphics for social media, animated infographics, and video introductions. Animation allows us to simplify complex concepts, add personality to brand content, and create assets optimized for social platforms where movement drives engagement.'}
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
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '品牌識別與設計' : 'Brand Identity & Design'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '標誌設計及品牌識別開發' : 'Logo design and brand identity development'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '品牌指引及風格指南制定' : 'Brand guidelines and style guide creation'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '視覺識別系統開發（色彩、字體、圖像）' : 'Visual identity system development (color, typography, imagery)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '品牌宣傳物料設計（名片、信頭、文件夾）' : 'Brand collateral design (business cards, letterheads, folders)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '網站設計及用戶體驗（UX/UI）' : 'Website design and user experience (UX/UI)'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '攝影服務' : 'Photography Services'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '專業活動攝影（新聞發布活動、發布會、體驗）' : 'Professional event photography (press events, launches, activations)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '產品攝影及造型' : 'Product photography and styling'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '團隊及管理層肖像攝影' : 'Team and executive portrait photography'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '生活時尚品牌攝影' : 'Lifestyle and lifestyle brand photography'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '場地勘察及拍攝管理' : 'Location scouting and shoot management'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '照片編輯及後期製作' : 'Photo editing and post-production'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '影片製作' : 'Video Production'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '長形式影片製作（10至30分鐘：紀錄片、訪談、深度專題）' : 'Long-form video production (10–30 minutes: documentaries, interviews, features)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '中形式影片（3至5分鐘：產品示範、教育、故事講述）' : 'Mid-form video (3–5 minutes: product demos, educational, storytelling)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '短形式影片（15至60秒：社交媒體、Reels、Shorts、TikTok）' : 'Short-form video (15–60 seconds: social media, Reels, Shorts, TikToks)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '影片腳本及分鏡' : 'Video scripting and storyboarding'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '專業設備外景拍攝' : 'On-location shooting with professional equipment'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '調色、音效設計及後期製作' : 'Color grading, sound design, and post-production'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '動畫及動態圖形整合' : 'Animation and motion graphics integration'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '平面設計與數位資產' : 'Graphic Design & Digital Assets'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '社交媒體圖形及帖子模板' : 'Social media graphics and post templates'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '資訊圖表及數據視覺化' : 'Infographics and data visualization'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '活動宣傳物料（標識、節目單、推廣材料）' : 'Event collateral (signage, programs, promotional materials)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '演示文稿設計（PowerPoint、Keynote）' : 'Presentation design (PowerPoint, Keynote)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '印刷設計（宣傳冊、海報、橫幅）' : 'Print design (brochures, posters, banners)'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '動態GIF及社交貼紙' : 'Animated GIFs and social stickers'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '動態圖形與動畫' : 'Motion Graphics & Animation'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '動畫解說及教育影片' : 'Animated explainers and educational videos'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '社交媒體動態圖形' : 'Motion graphics for social media content'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '動畫資訊圖表及數據視覺化' : 'Animated infographics and data visualization'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '影片片頭及標題序列' : 'Video introductions and title sequences'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '2D及3D動畫' : '2D and 3D animation'}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '創意指導與策略' : 'Creative Direction & Strategy'}</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• {lang === 'zh' ? '與品牌及推廣活動相符的創意策略開發' : 'Creative strategy development aligned with brand and campaigns'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '拍攝及製作的藝術指導' : 'Art direction for shoots and productions'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '概念構思及創意開發工作坊' : 'Concept ideation and creative development workshops'}</li>
                <li className="text-gray-700">• {lang === 'zh' ? '品牌聲音及視覺基調開發' : 'Brand voice and visual tone development'}</li>
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
              ? 'Radiance 為消費品牌、科技初創、非政府組織及文化機構創作全面的創意推廣活動——從品牌識別設計到紀錄片影片，到整合社交媒體推廣活動。以下展示我們如何將創意概念轉化為放大您推廣活動的成品資產。'
              : 'Radiance has created comprehensive creative campaigns for consumer brands, tech startups, NGOs, and cultural institutions—from brand identity design to documentary videos to integrated social media campaigns. Here\'s how we turn creative concepts into finished assets that amplify your campaigns.'}
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '科技初創建立品牌識別及發布影片' : 'Tech Startup Building Brand Identity & Launch Video'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家人工智能金融科技初創需要完整的品牌識別及發布推廣活動素材。我們開發了現代品牌識別，包括標誌、色彩方案及字體。然後製作了4分鐘品牌紀錄片，講述創辦故事及產品創新，以及6條說明核心功能的短形式社交影片。我們設計了活動標識、社交媒體圖形及演示文稿模板。所有資產強化了傳遞創新與親和力的一致視覺語言。'
                  : 'An AI fintech startup needed a complete brand identity and launch campaign assets. We developed a modern brand identity with logo, color palette, and typography. We then produced a 4-minute brand documentary explaining the founding story and product innovation, plus 6 short-form social videos explaining key features. We designed event signage, social graphics, and presentation templates. All assets reinforced a consistent visual language conveying innovation and accessibility.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '品牌識別以統一的視覺面貌在網頁、社交媒體及活動上亮相。紀錄片影片獲得5萬次觀看，將創辦人定位為思想領袖。社交影片平均互動率6%。設計一致性在投資者及客戶中建立了專業印象。' : 'Brand identity launched with cohesive visual presence across web, social, and events. Documentary video generated 50K views and positioned founder as thought leader. Social videos averaged 6% engagement rate. Design consistency created professional impression with investors and customers.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '消費品牌產品發布推廣活動' : 'Consumer Brand Product Launch Campaign'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一個美容品牌推出新護膚系列，需要整合創意支援。我們以「肌膚故事」為推廣活動主題，製作了一系列資產：真實客戶的生活時尚攝影、3分鐘產品示範影片、TikTok風格成分解析影片及社交媒體模板。我們創建了解釋新配方科學的資訊圖表、快閃店活動標識及包裝設計模型。所有資產以真實故事講述為核心，同時展示產品效益。'
                  : 'A beauty brand launching a new skincare line needed integrated creative support. We conceptualized a campaign theme "Skin Stories," then produced a library of assets: lifestyle photography of real customers, 3-minute product demo video, TikTok-style ingredient breakdown videos, and social media templates. We created infographics explaining the science behind new formulations, event signage for pop-up stores, and packaging design mockups. All assets centered on authentic storytelling while showcasing product benefits.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '推廣活動素材用於Instagram、TikTok、YouTube及店內展示。產品示範影片達20萬次觀看。用戶生成內容推廣活動（使用提供的圖形模板）收到逾500份投稿。一致的視覺語言令推廣後調查的品牌回憶率提升40%。' : 'Campaign assets used across Instagram, TikTok, YouTube, and in-store displays. Product demo video reached 200K views. User-generated content campaign (using provided graphics templates) generated 500+ submissions. Consistent visual language increased brand recall 40% in post-campaign survey.'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">{lang === 'zh' ? '非政府組織記錄社會影響力' : 'NGO Creating Impact Documentation'}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {lang === 'zh'
                  ? '一家以健康為重點的非政府組織希望記錄社區計劃影響力，用於募款及倡議。我們製作了一部12分鐘紀錄片，跟隨受惠者經歷整個計劃，呈現個人蛻變。我們創作了配套的社交媒體短片、顯示計劃數據的設計資訊圖表，以及年報及網站用的攝影作品。紀錄片傳遞了情感影響力，而數據視覺化則向潛在捐款人證明了計劃成效。'
                  : 'A health-focused NGO wanted to document their community program impact for fundraising and advocacy. We produced a 12-minute documentary following beneficiaries through the program, highlighting personal transformations. We created supporting short videos for social media, design infographics showing program metrics, and photography for annual reports and website. The documentary conveyed emotional impact while data visualization proved efficacy to potential donors.'}
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">{lang === 'zh' ? '成果：' : 'Result:'}</strong> {lang === 'zh' ? '紀錄片在募款活動中放映，用於向主要潛在捐款人進行募款演示。短形式影片在社交媒體獲得7.5萬次觀看，互動率12%。更新的品牌及設計物料提升了專業形象。有據可查的影響力助力贏得3項重大資助，總計50萬美元。' : 'Documentary screened at fundraising events; used in pitch meetings with major donor prospects. Short-form videos generated 75K social media views and 12% engagement rate. Updated branding and design materials increased professional perception. Documented impact contributed to 3 major grant wins totaling $500K.'}
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
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '探索與創意簡報' : 'Discovery & Creative Brief'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們首先了解您的品牌、推廣活動目標、目標受眾及品牌指引。我們審閱現有資產及競爭作品。然後制定創意簡報，界定概念、視覺方向、關鍵信息及交付物。您批准簡報後，我們才開始製作。'
                  : 'We begin by understanding your brand, campaign goals, target audiences, and brand guidelines. We review existing assets and competitive work. We then develop a creative brief defining the concept, visual direction, key messages, and deliverables. You approve the brief before we move to production.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '概念開發與審批' : 'Concept Development & Approval'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '對於設計項目，我們提供初步概念（2至3個設計方向）。對於影片/攝影，我們開發腳本及分鏡。我們提交概念供您反饋，並根據您的方向進行修訂。這個迭代過程確保製作開始前已達成共識。'
                  : 'For design projects, we create initial concepts (2–3 design directions). For video/photo, we develop scripts and shot lists. We present concepts for your feedback and refine based on your direction. This iterative process ensures alignment before production begins.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '製作與執行' : 'Production & Execution'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們管理所有製作事項：影棚預訂、燈光設置、拍攝方向（影片/攝影）、剪輯及後期製作、調色、音效設計及最終資產交付。對於設計，我們根據反饋進行修訂直至完成。您定期收到製作進度更新，可隨時提出調整。'
                  : 'We manage all production logistics: studio booking, lighting setup, shot direction (for video/photo), editing and post-production, color grading, sound design, and final asset delivery. For design, we refine based on feedback until assets are complete. You receive regular production updates and can flag adjustments as needed.'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">{lang === 'zh' ? '交付與資產管理' : 'Delivery & Asset Management'}</h3>
              <p className="text-gray-700 leading-relaxed">
                {lang === 'zh'
                  ? '我們以所需的所有格式交付成品資產——印刷用高解析度版本、網頁用壓縮版本、各平台優化比例版本。我們創建資產庫及使用指引，讓您的團隊能一致地運用。我們隨時可提供修訂及格式調整，協助您跨渠道重複使用資產。'
                  : 'We deliver finished assets in all required formats—high-res for print, compressed for web, optimized aspect ratios for each platform. We create asset libraries and usage guidelines so your team can implement consistently. We\'re available for revisions and format adjustments as you repurpose assets across channels.'}
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
                q: "影片製作需要多少費用？",
                a: "視乎範圍而定。一條2分鐘產品示範影片（包括腳本、拍攝及剪輯）費用約為8至15萬港元。一部10分鐘紀錄片視場地複雜度及團隊需求，可達25至50萬港元。包含多條短形式影片的推廣活動視數量及複雜程度，費用約為5至30萬港元。了解您的需求後，我們將提供詳細報價。"
              },
              {
                q: "影片項目的製作周期是多少？",
                a: "簡單的產品影片（2至3分鐘）從概念到最終交付通常需要6至8週。紀錄片（10分鐘以上）通常需要10至14週。短形式社交影片如概念已預先確認，可在3至4週內完成。我們可為急項加快進度，但建議預留充裕時間以確保品質。"
              },
              {
                q: "你們可以提供創意意念，還是只負責執行？",
                a: "兩者皆可。我們從創意探索及概念開發出發，而非單純執行。我們與您一起集思廣益，制定創意簡報，並在製作前精煉概念。卓越創意始於絕妙想法；我們與您合力創造。"
              },
              {
                q: "如果我們只需要設計，不需要影片製作怎麼辦？",
                a: "當然可以。我們提供獨立設計服務——社交媒體圖形、品牌識別、活動宣傳物料、資訊圖表、網頁設計。您可單獨委託我們的設計團隊，無需影片製作。或兩者結合：日常素材用設計，重大推廣活動用影片。"
              },
              {
                q: "你們是否可以針對不同平台提供不同格式的資產？",
                a: "是的。我們為所有平台提供優化的資產：YouTube影片、Instagram Reels、TikTok、LinkedIn、電郵、網頁、印刷、活動。我們處理格式轉換、比例優化、文件壓縮及各平台特定要求。一次製作可高效服務多個渠道。"
              }
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold mb-3">{item.q}</h3>
                <p className="text-gray-700 leading-relaxed">{item.a}</p>
              </div>
            )) : [
              {
                q: "How much does video production cost?",
                a: "It depends on scope. A 2-minute product demo video might run $8K–15K (including scripting, shooting, and editing). A 10-minute documentary could be $25K–50K depending on location complexity and crew needs. A campaign with multiple short-form videos might be $5K–30K depending on quantity and complexity. We'll provide detailed quotes after understanding your needs."
              },
              {
                q: "What's the production timeline for a video project?",
                a: "A simple product video (2–3 minutes) typically takes 6–8 weeks from concept to final delivery. A documentary (10+ minutes) usually takes 10–14 weeks. Short-form social videos can be turned around in 3–4 weeks if concept is pre-approved. We can sometimes accelerate for rush projects, but we recommend adequate lead time for quality results."
              },
              {
                q: "Can you help with ideas or do you just execute?",
                a: "We do both. We start with creative discovery and concept development, not just execution. We'll brainstorm ideas with you, develop creative briefs, and refine concepts before production. Creative excellence starts with great ideas; we partner with you to generate them."
              },
              {
                q: "What if we need just design, not video production?",
                a: "Absolutely. We offer standalone design services—social graphics, brand identity, event collateral, infographics, web design. You can work with our design team without video production. Or you can mix: design for everyday assets, video for major campaigns."
              },
              {
                q: "Can you deliver assets in multiple formats for different platforms?",
                a: "Yes. We deliver assets optimized for all platforms: YouTube videos, Instagram Reels, TikTok, LinkedIn, email, web, print, events. We handle format conversion, aspect ratio optimization, file compression, and platform-specific requirements. One production can feed multiple channels efficiently."
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
          <h2 className="text-3xl font-bold mb-6">{lang === 'zh' ? '準備好創作引人注目的品牌資產了嗎？' : 'Ready to Create Compelling Brand Assets?'}</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            {lang === 'zh'
              ? '無論您需要全面的品牌識別更新、專業影片製作，還是整合創意推廣活動，Radiance 都能助您將願景付諸實現。讓我們攜手創作放大您品牌及推廣活動的卓越資產。'
              : 'Whether you need a complete brand identity refresh, professional video production, or integrated creative campaigns, Radiance can help you bring your vision to life. Let\'s work together to create assets that amplify your brand and campaigns.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              {lang === 'zh' ? '立即策劃創意項目' : 'Plan a Creative Project'}
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
