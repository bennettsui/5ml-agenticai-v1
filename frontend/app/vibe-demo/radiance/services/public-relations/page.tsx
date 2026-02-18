'use client';

export default function PublicRelationsServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/vibe-demo/radiance" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:opacity-80">
            ← Back to Radiance
          </a>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Public Relations</h2>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Public Relations
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Positive, credible media exposure strengthens both brand reputation and commercial performance. Radiance PR specialises in developing communication strategies, news angles and media relationships that help your stories land in the right places, with the right framing. We see PR as more than press releases—it is an ongoing process of building relevance, trust and authority with your audiences.
          </p>
        </div>
      </section>

      {/* Strategic Overview */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Why media matters</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Earned media—coverage you didn't pay for—carries more credibility than advertising. When journalists feature your brand, your spokesperson or your story, audiences trust it more because it's been editorially vetted. Strategic PR builds long-term visibility, strengthens brand authority and supports every other channel: events, social media, even sales conversations all benefit from positive press coverage and media relationships.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Earned media reaches audiences who wouldn't see your paid ads—journalists introduce your brand to new, relevant audiences and lending it third-party credibility.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Strong media relationships compound—journalists who know you, trust you and understand your story are more likely to cover you again, building a flywheel of visibility.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">PR shapes perception in moments that matter—product launches, leadership changes, crisis response—where how the story is framed determines brand impact.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Integrated PR amplifies other channels—media coverage boosts event attendance, provides social content, and strengthens influencer partnerships.</span>
          </li>
        </ul>
      </section>

      {/* Our Approach */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Our approach</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          We start by understanding your positioning, your audiences and your business objectives. We develop PR strategies that identify newsworthy angles—whether that's a product innovation, leadership perspective, market trend or social mission. We maintain active relationships with journalists and editors across Hong Kong media, understand what they need, and provide timely, credible content that builds long-term relationships. PR is not one-off announcements; it's a consistent effort to keep your brand visible, relevant and trusted.
        </p>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Strategy and messaging</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We clarify your positioning, audiences and objectives, then develop PR strategies and key messages that support campaigns, launches and long-term brand building. This is the foundation—everything flows from a clear, defensible story.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Media relations</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We maintain regular dialogue with journalists and editors across Hong Kong, understand what they need, and provide timely, useful content that builds long-term relationships. Strong relationships mean better pickup, better framing and better outcomes.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Press materials and distribution</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We write clear, newsworthy press releases and media materials, and manage distribution through appropriate channels and timings to maximise pickup. Poor timing or unclear writing wastes a good story; we ensure your announcement lands effectively.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Media interviews</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We identify interview opportunities, invite target outlets, prepare spokespeople and manage logistics so that interviews strengthen your narrative and brand perception. A strong interview can shape how your brand is understood for months.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Media pitching and publicity</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We actively pitch story ideas, features and product angles to secure coverage that enhances visibility, trust and consideration among your target customers. We don't wait for journalists to find you; we bring them your best stories.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Executive profiling</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We arrange interviews and opinion opportunities for senior leaders, turning their expertise and stories into a strategic asset for corporate positioning. Strong executive profiles strengthen brand perception and leadership credibility.
            </p>
          </div>
        </div>
      </section>

      {/* PR Events */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">PR events</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          To concentrate news value and deepen engagement, we also design and manage PR-led events such as press conferences, launch presentations, media luncheons and preview tours of venues or exhibitions. These formats give media first-hand experience of your brand and create richer stories than remote outreach alone.
        </p>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
              <span className="text-slate-600 dark:text-slate-400">Press conferences and launch presentations designed for news value and ease of coverage.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
              <span className="text-slate-600 dark:text-slate-400">Media luncheons and briefing sessions that allow one-on-one conversations with key journalists.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
              <span className="text-slate-600 dark:text-slate-400">Preview tours and behind-the-scenes experiences that give media authentic story material.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
              <span className="text-slate-600 dark:text-slate-400">Spokesperson training and media preparation so your team feels confident in interviews and public appearances.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Who We Work With */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Who we partner with</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Radiance works with commercial brands launching new products or entering new markets, NGOs building awareness and advocacy for social causes, cultural institutions developing media presence, and corporate leaders establishing thought leadership. Whether your goal is awareness, perception shift, credibility or visibility, we bring media expertise tailored to Hong Kong's media landscape.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Consumer & Lifestyle Brands', 'Technology & Innovation Companies', 'NGOs & Social Enterprises', 'Cultural Institutions & Museums', 'Financial Services & Corporate', 'Education & Professional Organisations'].map((item) => (
            <div key={item} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">✓</span>
              <span className="text-slate-700 dark:text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How We Work */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work with you</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">1. Discovery & Strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We start with a detailed conversation about your business, positioning, target audiences and PR objectives. We research your competitive landscape, identify media opportunities and develop a PR strategy that aligns with your broader business goals.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">2. Messaging & Planning</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We develop key messages, identify newsworthy angles and create a media relations plan. We clarify which journalists and outlets matter most to your business and what story angles will resonate with each.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">3. Execution & Relationship Building</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We pitch stories, manage interviews, distribute press materials and maintain active relationships with journalists. We provide you with coverage tracking and media analysis so you understand the impact of our work.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">4. Measurement & Refinement</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We track media coverage, measure reach and perception impact, and refine our approach based on results. We share regular reports with transparent metrics so you see the value PR is delivering.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How long does it take to see PR results?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              It depends on your objectives. For a press conference or product launch, you might see coverage within days or weeks. For longer-term brand building and media relationship cultivation, results compound over 3–6 months or longer. We recommend ongoing PR engagement, not one-off campaigns, for sustained visibility.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can you guarantee media coverage?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              No agency can guarantee coverage—that's ultimately a journalist's decision. But what we can do is develop compelling stories, have strong relationships with journalists, and pitch effectively so that your chance of coverage is significantly higher than if you tried alone.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What happens if there's a crisis?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We can advise on crisis communication strategies and media response, helping you navigate difficult situations and protect your reputation. Many clients retain PR support specifically for crisis readiness and rapid response when needed.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Do you work with Hong Kong media only?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We specialise in Hong Kong media and regional outlets, but we can also coordinate with international journalists and publications if your audience or business scope extends beyond HK. We'll discuss your specific media targets during planning.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can PR work alongside other agencies?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Absolutely. We coordinate regularly with social media teams, event agencies, advertising partners and others. In fact, we integrate PR into broader campaigns—so coverage, events and content all work together. We're collaborative and transparent with all partners involved.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to build your media presence?</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Whether you're launching something new, shifting brand perception or building long-term visibility, Radiance brings media expertise and strong journalist relationships to help your brand earn credible coverage. Let's discuss your PR objectives and develop a strategy that works.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              Start a conversation
            </button>
            <button className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              Learn about our approach
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
