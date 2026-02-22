'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';
import { useParallax } from '../../hooks/useParallax';

export default function SocialMediaServicePage() {
  const parallaxRef = useParallax(0.25);
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-3 px-6">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Services', href: '/vibe-demo/radiance/services' },
              { label: 'Social Media & Content' }
            ]} />
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative py-24 px-6 overflow-hidden">
          {/* Hero background */}
          <div className="absolute inset-0 z-0">
            <div
              ref={parallaxRef}
              className="absolute inset-0 w-full h-[130%] -top-[15%] bg-cover bg-center will-change-transform"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1920&q=80)' }}
            />
            <div className="absolute inset-0 bg-slate-950/75" />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white leading-tight">
                Social Media & Content Strategy
              </h1>
              <p className="text-lg text-white leading-relaxed">
                Your audience spends significant time on social platforms. Your brand should show up there with intention, not random posts. Radiance designs social media and content strategies that connect brand stories, community building and performance metrics into one coherent system—so every post serves both brand and business goals.
              </p>
            </div>
          </div>
        </section>

      {/* Why Social Matters */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Why social media matters</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Social media isn't just about follower counts. It's about building a consistent presence where your audience expects you, creating content they actually want to engage with, and extending your reach through shares and conversations. When integrated with PR, events and KOL partnerships, social media becomes a powerful amplifier.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Social platforms are where your audience discovers brands, vets purchases and follows their interests—a consistent presence puts you in those conversations at the right moment.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Consistent content builds community—followers who see you regularly, trust your voice and become advocates for your brand.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Social content fuels other channels—your best social moments become PR stories, event highlights and influencer moments.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Performance data is immediate—you know what resonates with your audience in real time and can adapt quickly.</span>
          </li>
        </ul>
      </section>

      {/* Our Approach */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Our approach</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          We don't treat social media as isolated posts. We start with your brand story, your audience and your business objectives, then develop a content strategy that works across platforms. We define the role each platform plays in your ecosystem, establish content themes that reflect your brand and audience interests, and build a calendar so publishing is consistent and purposeful. We create content adapted to each platform, manage community engagement and track performance so we can optimise over time.
        </p>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Platform strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We define the role of each platform in your ecosystem—for example Instagram for visual storytelling, Facebook for community and information, YouTube for depth, LinkedIn for corporate presence—aligned with your audience and objectives. Not every brand needs to be everywhere; we focus on the platforms where your audience actually is.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Content pillars and calendar</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We establish content themes that reflect your brand, products and audience interests, then build a calendar so publishing is consistent and purposeful. A good content calendar ensures you're always prepared, aligned with campaigns and not scrambling for ideas.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Creative content production</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We create copy, graphics, photos and videos adapted to each platform's format and behaviour, while keeping brand voice and visual identity consistent. Format matters—a LinkedIn post looks different from an Instagram story—but your brand should feel recognisable across all channels.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Community and engagement</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We set up processes for responding, moderating and engaging with followers, partners and KOLs to maintain a healthy, active community around your brand. Good community management turns followers into advocates.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Measurement and optimisation</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We track performance indicators such as reach, engagement, traffic and conversions, and use these insights to refine content and targeting over time. Social media is not set-and-forget; it's a practice of continuous improvement.
            </p>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Integrated with your broader strategy</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          We do not treat social media as isolated posts. We align social activity with campaigns, launches, events and KOL programmes so that each touchpoint reinforces the others. When you launch a product, media coverage feeds into social content. When you host an event, social amplifies it. When you partner with influencers, social extends their reach. This integration is what creates momentum.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg hover:border-sky-400 dark:hover:border-sky-500 transition-colors">
            <Link href="/vibe-demo/radiance/services/public-relations" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline mb-3 block">+ PR Campaigns →</Link>
            <p className="text-sm text-slate-600 dark:text-slate-400">Press coverage becomes social content, expanding reach to new audiences.</p>
          </div>
          <div className="p-6 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg hover:border-sky-400 dark:hover:border-sky-500 transition-colors">
            <Link href="/vibe-demo/radiance/services/events" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline mb-3 block">+ Events →</Link>
            <p className="text-sm text-slate-600 dark:text-slate-400">Live events create authentic content moments that fuel social engagement.</p>
          </div>
          <div className="p-6 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg hover:border-sky-400 dark:hover:border-sky-500 transition-colors">
            <Link href="/vibe-demo/radiance/services/kol-marketing" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline mb-3 block">+ KOL Partnerships →</Link>
            <p className="text-sm text-slate-600 dark:text-slate-400">Influencer collaborations amplify through your owned social channels.</p>
          </div>
        </div>
      </section>

      {/* Services Scope */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">What we provide</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Strategic Planning</h3>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Audience analysis and platform strategy aligned with your business goals.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Content pillar development and annual/quarterly planning.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Competitive analysis and opportunity identification.</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Content Creation</h3>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Written content: captions, blog posts, thought leadership pieces.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Visual content: graphics, photography, video production and editing.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Platform-specific formats: Instagram stories, TikTok, LinkedIn articles, YouTube.</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Community & Performance</h3>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Community management: monitoring, responding, engaging with followers.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Performance analytics, monthly reporting and optimisation recommendations.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Paid social strategy and campaign management if desired.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work with you</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">1. Discovery & Strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We start with your brand story, target audience, business objectives and current social presence. We analyse your performance to date, assess competitive landscape and identify opportunities on each platform.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">2. Planning & Roadmap</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We develop a social media strategy, define content pillars, establish posting frequency and create a content calendar. We show you the full roadmap so you understand the approach and can provide feedback.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">3. Content Production & Publishing</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We create content consistently according to the calendar, manage community engagement and maintain brand voice across all platforms. We stay flexible to respond to trends and real-time opportunities.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">4. Measurement & Optimisation</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We track performance monthly, identify what's working and what isn't, and adjust strategy and content accordingly. We share regular reports showing reach, engagement, audience growth and business impact.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How many times per week should we post?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              It depends on your platform and audience. Instagram might work best with 3–5 posts per week, LinkedIn with 2–3, TikTok with daily content if you have capacity. Quality matters more than quantity—better one great post than five mediocre ones. We'll recommend a frequency that fits your team's capacity and maximises engagement.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Should we use paid social advertising?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Organic social is valuable for community building, but paid social can amplify reach and drive measurable results. We often recommend a mix—strong organic foundations plus targeted paid campaigns for launches or performance goals. We can advise on whether paid social makes sense for your objectives.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What if we post something that gets negative comments?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We have community management protocols for responding to comments—both positive and critical. We don't delete or ignore complaints; instead, we respond professionally, acknowledge concerns and take conversations offline if needed. Good community management actually builds trust.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can we do this in-house with your guidance?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Absolutely. Some clients want full-service content creation; others prefer to create content and we manage strategy and community. We're flexible and can work at whatever level makes sense for your team and budget.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How do we measure social media ROI?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Metrics depend on your goals. For brand building, we track reach, engagement and sentiment. For performance, we track clicks, conversions and customer acquisition cost. We set up tracking at the start so you can see what social is driving for your business.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to strengthen your social presence?</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Whether you're starting from scratch, taking over management, or optimising existing channels, Radiance brings strategy, creativity and performance discipline to social media. Let's build a content system that engages your audience and supports your business goals.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/vibe-demo/radiance/consultation" className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors">
              Let's talk strategy
            </Link>
            <Link href="/vibe-demo/radiance/case-studies" className="px-6 py-3 border border-sky-600 dark:border-sky-400 text-sky-600 dark:text-sky-400 font-medium rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors">
              See our work
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}
