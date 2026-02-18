'use client';

export default function SocialContentPage() {
  return (
    <main className="bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/vibe-demo/radiance" className="text-2xl font-bold tracking-tight">
            <span className="text-blue-600">Radiance</span>
          </a>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <a href="/vibe-demo/radiance#services" className="hover:text-blue-600 transition">Services</a>
            <a href="/vibe-demo/radiance#cases" className="hover:text-blue-600 transition">Cases</a>
            <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Social Media & Content
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            Own the conversation with strategic social planning, always-on content creation, and engaging campaigns that keep your brand top-of-mind while building authentic audience connection.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            Social media isn't about posting consistently—it's about being present, responsive, and valuable. At Radiance, we build comprehensive social strategies that span platform selection, content ideation, community management, and paid amplification. We create long-form and short-form video content, design visually compelling social assets, and coordinate real-time social response during campaigns and events. Whether it's always-on brand content, campaign-driven social, or crisis communication, we help you maintain momentum and deepen audience relationships.
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Why Social Media & Content Matters</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Social platforms are where audiences spend time, discover brands, and make purchasing decisions. Strategic social media isn't just entertainment—it's a direct channel to customers, a way to amplify PR and events, and a source of real-time feedback. Brands that master always-on content and responsive community management build stronger customer loyalty and generate content that extends across all marketing channels.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Audience Relationship Building:</strong> Social platforms enable direct, authentic connection with customers and stakeholders in real time.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Content Amplification Hub:</strong> Social media extends the life of PR, event, and video content—multiply reach and engagement across platforms.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Real-Time Relevance:</strong> Social allows you to respond quickly to trends, capitalize on moments, and stay top-of-mind during campaigns.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Performance Insights:</strong> Social metrics provide direct feedback on what resonates with your audience, informing future strategy.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Our Approach to Social Media & Content</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            We believe great social content starts with strategy—understanding your audience, defining your voice, and choosing platforms where your customers actually spend time. We then blend planned content (calendars, campaigns) with responsive engagement (real-time comments, trending topics, community needs). This combination builds authentic momentum and turns audiences into advocates.
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">Audience-First Strategy</h3>
              <p className="text-gray-700 leading-relaxed">
                We research your target audiences—demographics, platform preferences, content consumption habits, pain points, and values. We then define your social presence: which platforms to prioritize, what your brand voice should be, what types of content resonate, and how to differentiate from competitors. This strategy becomes the foundation for all content decisions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Content Ideation & Planning</h3>
              <p className="text-gray-700 leading-relaxed">
                We develop 3–6 month content calendars with themes, campaign dates, pillar topics, and seasonal content. We ideate content concepts (educational, entertaining, inspirational, user-generated) that reflect your brand values and audience interests. We then adapt these concepts for each platform—long-form on LinkedIn, short-form on TikTok, visual storytelling on Instagram, real-time updates on Twitter.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Video & Visual Content Creation</h3>
              <p className="text-gray-700 leading-relaxed">
                Video drives engagement across platforms. We produce long-form content (10–30 min documentaries, interviews, behind-the-scenes), mid-form content (3–5 min educational or story videos), and short-form content (15–60 sec TikToks, Reels, Shorts). We also design static social assets (infographics, quotes, posters) that reflect your brand aesthetic and stop scrolls.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Community Management & Engagement</h3>
              <p className="text-gray-700 leading-relaxed">
                We monitor comments, messages, and mentions across platforms, responding to audience questions, celebrating user content, and moderating conversations. We proactively engage with relevant hashtags, trends, and community discussions to build presence and relationships. During campaigns and events, we provide real-time social updates and amplification.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Paid Social & Campaign Amplification</h3>
              <p className="text-gray-700 leading-relaxed">
                Organic reach has limits. We develop paid social strategies—targeting, budgets, creative testing, audience segmentation—to amplify key content and campaigns. We A/B test different ad creative, landing pages, and messaging to optimize performance. We track ROAS and engagement metrics to continuously improve campaign efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scope of Services */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Scope of Services</h2>

          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Social Strategy & Planning</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Audience research and social platform audit</li>
                <li className="text-gray-700">• Brand voice and tone-of-voice guidelines for social</li>
                <li className="text-gray-700">• Platform selection and strategic recommendation (Instagram, TikTok, LinkedIn, Twitter, etc.)</li>
                <li className="text-gray-700">• 3–6 month content calendar with themes, campaigns, and pillar topics</li>
                <li className="text-gray-700">• Hashtag strategy and content tagging framework</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Content Creation & Production</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Long-form video production (10–30 minutes: documentaries, interviews, features)</li>
                <li className="text-gray-700">• Mid-form video (3–5 minutes: educational, storytelling, how-tos)</li>
                <li className="text-gray-700">• Short-form video (15–60 seconds: TikTok, Instagram Reels, YouTube Shorts)</li>
                <li className="text-gray-700">• Photography direction, shooting, and styling</li>
                <li className="text-gray-700">• Graphic design and social asset creation (posts, stories, carousels, infographics)</li>
                <li className="text-gray-700">• Motion graphics and animated content</li>
                <li className="text-gray-700">• Copywriting and captions for all social formats</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Community Management & Engagement</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Daily social media posting and scheduling across platforms</li>
                <li className="text-gray-700">• Comment and message monitoring and response management</li>
                <li className="text-gray-700">• Community engagement and conversation facilitation</li>
                <li className="text-gray-700">• Hashtag and trend monitoring for real-time engagement opportunities</li>
                <li className="text-gray-700">• User-generated content curation and reposting</li>
                <li className="text-gray-700">• Crisis social response and reputation monitoring</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Paid Social & Campaign Amplification</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Paid social strategy and budget planning</li>
                <li className="text-gray-700">• Ad creative development and A/B testing</li>
                <li className="text-gray-700">• Audience targeting and segmentation strategy</li>
                <li className="text-gray-700">• Campaign setup, management, and optimization across platforms</li>
                <li className="text-gray-700">• Retargeting and conversion optimization</li>
                <li className="text-gray-700">• Performance tracking and ROAS reporting</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Analytics & Reporting</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Monthly social analytics reports (reach, engagement, follower growth, sentiment)</li>
                <li className="text-gray-700">• Content performance analysis and content series recommendations</li>
                <li className="text-gray-700">• Audience growth and demographic tracking</li>
                <li className="text-gray-700">• Campaign ROI analysis and optimization recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">How Brands Work with Us</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            Radiance has helped consumer brands, tech startups, NGOs, and institutions build engaged social communities—from launching new accounts to managing mature social presence with 100K+ followers. We've driven awareness campaigns, amplified product launches, and built loyalty communities that turn followers into advocates.
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Consumer Brand Building Community Around Values</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A sustainable fashion brand wanted to build a conscious consumer community and differentiate from competitors. We developed a social strategy focused on behind-the-scenes storytelling, customer spotlights, and educational content about sustainability. We produced monthly documentary-style videos showcasing artisans and production practices, created user-generated content campaigns celebrating customer stories, and managed daily engagement to build community conversation.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> Grew Instagram following from 25K to 120K in 12 months; increased engagement rate from 2% to 7%; user-generated content campaigns generated 200+ community submissions; top videos reached 500K+ views.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Tech Startup Launching New Product with Social Awareness Campaign</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                An HR tech startup launching a new AI-powered recruitment tool needed to drive awareness and trial sign-ups. We developed an integrated social campaign combining educational content (tips for hiring managers), product demo videos, customer testimonial videos, and paid social amplification. We coordinated social launch timing with PR announcements and coordinated KOL seeding to extend reach.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> Campaign generated 5K sign-up clicks from social; top-performing video reached 120K views with 8% conversion rate to sign-ups; average cost per trial was 40% below industry benchmark.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">NGO Sustaining Donor Engagement Through Always-On Content</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                An education NGO wanted to keep donors and supporters engaged between campaign periods with ongoing storytelling. We developed a content calendar featuring beneficiary spotlights, volunteer stories, research highlights, and impact updates. We produced short videos of student success stories for Instagram and TikTok, created monthly infographics on program impact, and managed Facebook community discussions to build loyalty.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> Instagram engagement increased 150%; beneficiary spotlight videos averaged 12% engagement rate; social-driven repeat donations increased 35% year-over-year.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">How We Work with You</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">01</div>
              <h3 className="text-2xl font-bold mb-3">Discovery & Strategy</h3>
              <p className="text-gray-700 leading-relaxed">
                We interview your team, analyze your audience and competitors, and audit your current social presence. We then develop a comprehensive social strategy including audience definition, platform selection, content pillars, voice guidelines, and a 3–6 month content calendar aligned with your business goals.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">Content Planning & Creation</h3>
              <p className="text-gray-700 leading-relaxed">
                We develop monthly content themes and detailed content outlines. We produce video content, design social assets, and write captions for approval. You review and approve content before publishing. We work collaboratively to refine concepts until they align perfectly with your vision.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">Publishing & Community Management</h3>
              <p className="text-gray-700 leading-relaxed">
                We publish content on schedule across all platforms, monitor engagement and comments, respond to community messages, and identify real-time engagement opportunities. You get daily insights and weekly reports on performance. We flag campaigns needing paid amplification and manage paid social on your behalf.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">Analysis & Optimization</h3>
              <p className="text-gray-700 leading-relaxed">
                We deliver monthly reports with reach, engagement, follower growth, and sentiment analysis. We identify what content resonates most with your audience and recommend adjustments to your strategy. We continuously optimize your social presence based on data and emerging opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Frequently Asked Questions</h2>

          <div className="space-y-8">
            {[
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
          <h2 className="text-3xl font-bold mb-6">Ready to Amplify Your Social Presence?</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            Whether you're starting from scratch or leveling up your existing social strategy, Radiance can help you build authentic audience connections and drive results. Let's develop a social strategy that turns followers into advocates.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              Plan a Social Campaign
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition">
              Speak with Our Team
            </button>
          </div>
        </div>
      </section>

      {/* Chinese Summary */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto border-t-4 border-blue-600 pt-12">
          <h3 className="text-2xl font-bold mb-6 text-blue-600">繁體中文總結</h3>
          <p className="text-gray-700 leading-relaxed text-lg">
            社交媒體與內容是品牌與受眾建立直接互動、維持品牌活躍度的核心渠道。Radiance 提供完整的社交媒體策略與執行服務，包括平台選擇、受眾研究、內容日曆規劃、視頻製作、設計創意、日常社交管理和有償社交放大。我們為消費品牌、科技公司、NGO 和文化機構構建參與度高的社區，透過故事化內容、用戶生成內容和實時互動，把粉絲轉化為品牌倡導者。無論是產品發佈、品牌意識提升，還是社群忠誠度建設，我們都能幫助你規劃和執行高效的社交媒體戰略。立即聯絡我們，一起探索如何透過社交媒體放大你的品牌聲量。
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Radiance</h4>
              <p className="text-sm">PR & Martech for Hong Kong brands</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Services</h4>
              <ul className="text-sm space-y-2">
                <li><a href="/vibe-demo/radiance/public-relations" className="hover:text-white transition">Public Relations</a></li>
                <li><a href="/vibe-demo/radiance/events" className="hover:text-white transition">Events & Experiences</a></li>
                <li><a href="/vibe-demo/radiance/kol-influencer" className="hover:text-white transition">KOL & Influencer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="text-sm space-y-2">
                <li><a href="/vibe-demo/radiance" className="hover:text-white transition">Home</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Hong Kong</h4>
              <p className="text-sm">hello@radiancehk.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Radiance PR & Martech Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
