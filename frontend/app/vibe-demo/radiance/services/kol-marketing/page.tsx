'use client';

export default function KOLMarketingServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/vibe-demo/radiance" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:opacity-80">
            ← Back to Radiance
          </a>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">KOL & Influencer Marketing</h2>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            KOL & Influencer Marketing
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Social media and KOLs are now essential levers for brand awareness and perception. When paired with the right content and structure, KOL collaborations can educate audiences, influence behaviour and build long-term affinity. Radiance operates as your strategic KOL partner, from campaign ideation and talent matching to coordination, media support and results analysis.
          </p>
        </div>
      </section>

      {/* Why KOL Marketing */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Why KOL marketing matters</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          People trust recommendations from creators they follow more than brand messaging. A YouTuber or Instagram influencer with engaged followers can introduce your product authentically to an audience that already respects their opinion. The right KOL partnerships extend reach, build credibility and create content that resonates with specific audience segments.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Authentic endorsements—when a creator genuinely likes your product, their audience believes it more than paid ads.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Reach specific audiences—micro-influencers in niche communities often drive higher engagement and conversion than broad celebrity endorsements.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Content creation—influencers produce high-quality content you can repurpose across your own channels.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Long-term relationships—strategic partnerships with the right creators build sustained brand presence and advocacy.</span>
          </li>
        </ul>
      </section>

      {/* Our Network */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Our KOL network</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          We maintain a database of over 3,000 KOLs spanning celebrities, YouTubers, top-tier influencers and micro-influencers with strong engagement and conversion. Our network covers categories such as beauty, gadgets, food, parenting, sport, arts, fashion and youth/Gen Z communities, allowing us to reach specific segments including high-spending consumers, professionals, young families and niche enthusiasts.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Celebrity & Talent Relations', 'YouTubers & Long-form Creators', 'Top-tier Influencers (100K–1M followers)', 'Micro-influencers (10K–100K followers)', 'Niche & Specialist Creators', 'Emerging Creators & Rising Stars'].map((item) => (
            <div key={item} className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="font-semibold text-slate-900 dark:text-white">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we can work together</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Celebrity and talent relations</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Build long-term associations with celebrities or well-known creators who can represent your brand across campaigns and touchpoints. We handle relationship management, negotiation and content coordination so you get consistent visibility.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">KOL campaign strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Design full-funnel KOL campaigns including content formats, seeding plans, paid support and measurement. We work with creators to develop storylines that feel authentic to them while meeting your brand objectives.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">YouTuber collaborations</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Develop storylines, product integrations and branded content with creators whose audiences match your target. YouTube creators often produce high-quality, narrative-driven content that builds deeper engagement than short-form formats.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Micro-influencer programmes</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Activate clusters of smaller, highly engaged KOLs to create authentic advocacy and word-of-mouth at scale. Micro-influencers often deliver higher engagement and conversion rates than celebrities, and are more cost-effective.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Crossovers and co-creations</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Partner with illustrators, designers or niche creators to co-create products, content or experiences that strengthen your brand story. Co-creation often produces more authentic and memorable brand moments than traditional sponsorships.
            </p>
          </div>
        </div>
      </section>

      {/* Services Scope */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Scope of services</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Influencer identification and outreach</h3>
            <ul className="space-y-2 ml-6">
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Database search and KOL matching based on audience demographics, engagement rate and brand alignment.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Initial outreach, negotiation and contract management.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Ongoing relationship management and repeat collaboration coordination.</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Product trial and content creation</h3>
            <ul className="space-y-2 ml-6">
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Coordinating product trials so creators can develop authentic, nuanced content.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Supporting content ideation and ensuring posts highlight key product benefits.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Managing content delivery timelines and payment terms.</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Event invitations and brand ambassadorships</h3>
            <ul className="space-y-2 ml-6">
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Identifying suitable KOLs for event attendance and live content coverage.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Structuring longer-term brand ambassador relationships and ongoing visibility.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Post-event content amplification and monitoring.</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Campaign performance tracking</h3>
            <ul className="space-y-2 ml-6">
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Real-time monitoring of post performance, engagement and sentiment.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Audience insights and demographic breakdown from influencer content.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">ROI analysis and recommendations for future campaigns.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work with you</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">1. Strategy & Goals</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We start by understanding your objectives: Are you building awareness, driving sales, establishing credibility in a new category? We define success metrics and identify audience segments most important to reach.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">2. KOL Identification & Outreach</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We search our database, analyse potential matches based on audience fit and engagement quality, and reach out with tailored proposals. We negotiate terms, pricing and deliverables so everyone is aligned from the start.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">3. Campaign Coordination</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We manage logistics: product trials, content briefs, posting schedules, paid amplification if needed. We stay in touch with creators throughout to ensure content meets brand expectations while staying authentic to their voice.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">4. Monitoring & Reporting</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We track performance in real time, monitor audience sentiment and provide regular reports showing reach, engagement, and business impact. We share insights to help you understand what worked and what to do differently next time.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How much do influencer partnerships cost?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Costs vary widely depending on influencer tier. A top-tier celebrity might cost HK$50K–200K+ per post, while micro-influencers might cost HK$2K–10K or accept product exchange. We work with your budget and recommend the best mix of creators to maximise reach and ROI.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How do we ensure the content is authentic?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We work with creators whose audiences and values already align with your brand. We provide creative briefs and key messages, but we give creators freedom to develop content in their own voice. The best influencer partnerships feel natural, not forced.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What if an influencer says something negative about our product?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We work primarily with creators who have tried and genuinely like your product. Occasionally a creator might have legitimate critique—we view this as constructive feedback, not a failure. We monitor content before posting when contractually possible.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How do we measure the success of KOL campaigns?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Success depends on your goals. For awareness, we track reach and engagement. For performance, we track clicks, conversions and customer acquisition cost. We set up tracking at the campaign outset so results are clear and measurable.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can we work with international influencers?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes, though our primary network is Hong Kong-based. If you want to reach international audiences or specific niches, we can identify and coordinate with creators globally. We'll manage the relationship and ensure brand consistency.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to amplify with the right KOLs?</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Whether you're launching a product, building brand awareness or reaching a specific audience segment, Radiance can identify and coordinate with creators who connect authentically with your brand. Let's explore what KOL partnerships can do for your business.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              Explore KOL options
            </button>
            <button className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              Our network
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 mt-16">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Radiance PR & Martech Limited | Hong Kong</p>
          <p className="mt-2">
            <a href="/vibe-demo/radiance" className="text-purple-600 dark:text-purple-400 hover:underline">Back to Radiance</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
