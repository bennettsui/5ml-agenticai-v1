'use client';

export default function PublicRelationsPage() {
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
            Public Relations
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            Build credibility and shape narratives through strategic media relations, compelling storytelling, and earned media placements that position your brand as a trusted voice in your industry.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            At Radiance, PR isn't just press releases and media pitches. We integrate earned media strategy with your events, social content, and influencer partnerships to amplify messages and build momentum. Whether you're managing reputation, launching a product, or establishing thought leadership, we craft narratives that resonate with journalists, stakeholders, and your target audiences across Hong Kong and beyond.
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Why Public Relations Matters</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            In a crowded media landscape, earned media remains the most credible way to amplify your message. Unlike paid advertising, PR placements carry third-party endorsement—journalists have vetted your story and deemed it newsworthy. Strategic PR builds brand authority, drives awareness, and establishes your leadership voice in ways owned and paid channels cannot achieve alone.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Credibility & Trust:</strong> Media coverage signals third-party validation, strengthening stakeholder confidence in your brand.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Extended Reach:</strong> A single press placement reaches journalists, industry influencers, and engaged audiences beyond your direct network.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Narrative Control:</strong> PR helps frame your story—product launches, reputation management, thought leadership—on your terms.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Long-term Value:</strong> Earned media creates lasting content assets that social teams amplify and customers revisit.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Our Approach to Public Relations</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            Radiance brings strategic thinking and hands-on execution to every PR engagement. We combine deep knowledge of Hong Kong's media landscape with integrated planning—connecting PR with your events, social campaigns, and influencer partnerships. Our approach is collaborative, transparent, and outcome-focused: we listen, plan strategically, execute flawlessly, and report on real impact.
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">Insight-Led Media Strategy</h3>
              <p className="text-gray-700 leading-relaxed">
                Before we pitch, we listen. We interview stakeholders, analyze your competitive landscape, audit coverage trends, and identify the narrative angles that matter most to journalists and your target audiences. This research informs a clear media strategy with defined target publications, key messages, and campaign milestones.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Deep Local Media Knowledge</h3>
              <p className="text-gray-700 leading-relaxed">
                We maintain relationships with Hong Kong's top journalists and editors across business, technology, lifestyle, NGO, and specialty media. We understand what different outlets cover, the story angles they favor, and the timeliness required. This network accelerates placements and ensures your story reaches the right journalists.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Compelling Narrative Crafting</h3>
              <p className="text-gray-700 leading-relaxed">
                Great PR starts with a strong story. We work with you to identify the human angle, the market insight, or the innovation that makes your news genuinely noteworthy. We then craft press releases, pitch materials, and media briefing talking points that make journalists want to cover you.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Integrated Campaign Planning</h3>
              <p className="text-gray-700 leading-relaxed">
                PR works best alongside other channels. We coordinate media announcements with press events, align social content calendars to amplify coverage, and brief influencers to seed earned media narratives. This integration amplifies impact—earned media drives event attendance and social buzz.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Crisis & Reputation Management</h3>
              <p className="text-gray-700 leading-relaxed">
                When reputation is at stake, speed and messaging discipline matter. We provide rapid-response strategy, media statement drafting, and proactive outreach to shape the narrative during sensitive moments. We help you communicate authentically while protecting brand integrity.
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
              <h3 className="text-xl font-bold mb-4 text-blue-600">Strategy & Planning</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Communication strategy and key messaging framework aligned with business goals</li>
                <li className="text-gray-700">• Annual PR planning and campaign roadmaps (product launches, thought leadership, reputation management)</li>
                <li className="text-gray-700">• Media landscape analysis and competitive coverage audit</li>
                <li className="text-gray-700">• Integrated planning connecting PR, events, social content, and influencer partnerships</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Media Relations & Outreach</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Target media list building and ongoing journalist relationship management</li>
                <li className="text-gray-700">• Press release drafting, editing, and localization for Hong Kong and regional outlets</li>
                <li className="text-gray-700">• Personalized media pitching, journalist follow-ups, and story placement management</li>
                <li className="text-gray-700">• Media interview coordination, spokesperson training, and talking point development</li>
                <li className="text-gray-700">• Story angle customization for different outlets and journalist preferences</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">PR Events & Media Showcases</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Press conferences, media luncheons, and media preview events</li>
                <li className="text-gray-700">• Product launch events and brand showcase activations for press and influencers</li>
                <li className="text-gray-700">• Executive roundtables and thought leadership salon events</li>
                <li className="text-gray-700">• On-site run-of-show management, logistics, media check-in, and post-event follow-up</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Reputation & Crisis Management</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Crisis communication strategy and rapid-response messaging</li>
                <li className="text-gray-700">• Media statement drafting and executive communication guidance</li>
                <li className="text-gray-700">• Proactive media outreach and narrative shaping during sensitive moments</li>
                <li className="text-gray-700">• Coverage monitoring and sentiment analysis reporting</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Analytics & Reporting</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Media monitoring and coverage tracking across print, online, and broadcast</li>
                <li className="text-gray-700">• Monthly coverage reports with placement analysis, reach estimates, and sentiment assessment</li>
                <li className="text-gray-700">• Message penetration and brand visibility metrics</li>
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
            Radiance has applied strategic PR across product launches, reputation shifts, thought leadership campaigns, and crisis moments—for consumer brands, tech startups, NGOs, and institutions. Here's how we help different clients move their narratives forward.
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Global Consumer Brand Entering Hong Kong Market</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A multinational consumer brand was entering Hong Kong for the first time and needed to build awareness and credibility quickly. We crafted a market entry narrative positioning the brand as innovative and locally-attuned, pitched regional business and lifestyle journalists, coordinated an exclusive press preview event, and briefed local KOLs to amplify launch messaging across social platforms.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> 18 media placements in tier-1 outlets within the first month; press event drove KOL partnerships and social content amplification; brand achieved category awareness leadership in first quarter.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Sustainability-Focused NGO Building Institutional Credibility</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A Hong Kong NGO working on climate education wanted to position itself as a thought leader and increase donor engagement. We developed a thought leadership PR strategy positioning the organization's director as an expert voice, pitched opinion pieces and interviews to business and sustainability journalists, organized a media briefing on upcoming research findings, and coordinated messaging with a community event campaign.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> 8 media placements including opinion editorial; director became a quoted expert in subsequent coverage; increased institutional visibility led to three major grant inquiries.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Tech Startup Managing Reputation During Rapid Growth</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                An AI startup experienced negative coverage on social media related to data privacy practices. We developed a crisis communication strategy, drafted a transparent media statement addressing concerns, proactively reached out to tech journalists with context and the founder's perspective, and coordinated third-party expert commentary to rebuild credibility.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> Shifted conversation from controversy to company's privacy-first approach; published 5 follow-up stories focusing on company safeguards; investor confidence stabilized.
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
                We begin with a deep-dive workshop to understand your brand, goals, target audiences, and competitive context. We audit your current coverage, identify narrative opportunities, and collaboratively develop a PR strategy and target media list that align with your business objectives.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">Planning & Content Development</h3>
              <p className="text-gray-700 leading-relaxed">
                We develop a clear PR roadmap with monthly milestones, key messages, and planned announcements. We draft press releases, media materials, and talking points, and share these with you for feedback before any outreach begins. You stay informed and aligned at every step.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">Execution & Relationship Management</h3>
              <p className="text-gray-700 leading-relaxed">
                We manage all media outreach: pitching journalists, securing interviews, organizing PR events, and coordinating timing with your other campaigns. We keep you updated on outreach status, feedback, and upcoming placements. You stay connected without needing to manage journalists directly.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">Reporting & Optimization</h3>
              <p className="text-gray-700 leading-relaxed">
                We monitor all coverage, compile monthly reports with placements, reach, and sentiment analysis, and share insights on what's resonating with journalists. We adapt our strategy based on results and emerging opportunities, ensuring your PR evolves with your business.
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
                q: "How long does a typical PR engagement take?",
                a: "It depends on your objectives. A focused product launch campaign might run 2–3 months; ongoing thought leadership or reputation management typically spans 6–12 months. We're flexible and can structure engagements month-to-month or as project-based retainers."
              },
              {
                q: "Do you work with smaller brands or NGOs, or just big corporations?",
                a: "We work with brands and institutions of all sizes. Whether you're a scrappy startup or an established corporation, an NGO or a cultural institution, we tailor our approach and pricing to match your needs. Many of our best stories come from smaller, mission-driven organizations."
              },
              {
                q: "How do you handle media relations if I don't have a press team?",
                a: "That's exactly what we do. We manage all journalist relationships, pitching, interview coordination, and follow-up on your behalf. You provide the insights and approvals; we handle the media relations mechanics."
              },
              {
                q: "Can you start with a pilot project rather than a long-term contract?",
                a: "Absolutely. We can run a 2–4 week PR project (like a product launch campaign or reputation response) to see how we work together, then expand to ongoing engagement if it's a good fit."
              },
              {
                q: "Do you also handle social media and events, or only PR?",
                a: "We specialize in PR, but our real strength is integration. We coordinate earned media with your events, social campaigns, and influencer partnerships so all channels amplify each other. If you need social or events support, we can either team with colleagues or recommend partners."
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
          <h2 className="text-3xl font-bold mb-6">Ready to Amplify Your Brand's Story?</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            Whether you're launching a product, shifting perception, or establishing thought leadership, Radiance can help you earn credibility through strategic PR. Let's talk about your goals and the stories we can tell together.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              Plan a PR Project
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
            公共關係（PR）是品牌建立信譽感、塑造故事、爭取媒體報導的關鍵渠道。Radiance 提供從策略規劃、媒體關係管理、新聞發佈、PR 活動策劃，到危機溝通和結果報告的全方位服務。我們深入了解香港媒體生態和記者偏好，為消費品牌、科技公司、NGO 和文化機構量身設計傳播戰略。我們不只撰寫新聞稿，而是融合媒體關係、活動策劃和社交內容，讓每個渠道相互增強，為品牌爭取更大影響力。無論是產品發佈、聲譽管理或建立思想領導力，我們都能幫助你透過扎實的 PR 執行，贏得媒體和持份者的信任。立即聯絡我們，探索如何透過整合 PR 策略推動你的品牌前進。
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
                <li><a href="/vibe-demo/radiance/events" className="hover:text-white transition">Events & Experiences</a></li>
                <li><a href="/vibe-demo/radiance/social-content" className="hover:text-white transition">Social Media & Content</a></li>
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
