'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';
import { useParallax } from '../../hooks/useParallax';

export default function CreativeProductionServicePage() {
  const parallaxRef = useParallax(0.25);
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-3 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Services', href: '/vibe-demo/radiance/services' },
              { label: 'Creative & Production' }
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
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=80)' }}
            />
            <div className="absolute inset-0 bg-slate-950/75" />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white leading-tight">
                Creative Design & Content Production
              </h1>
              <p className="text-lg text-white leading-relaxed">
                Good creative doesn't decorate a campaign—it is the campaign. The right visual identity, the right words, the right film can change how people see your brand. Radiance brings design, photography, video and copywriting together under one roof, so every asset across your{' '}
                <Link href="/vibe-demo/radiance/services/public-relations" className="text-emerald-300 hover:underline font-medium">PR</Link>
                {', '}
                <Link href="/vibe-demo/radiance/services/events" className="text-emerald-300 hover:underline font-medium">events</Link>
                {' and '}
                <Link href="/vibe-demo/radiance/services/social-media" className="text-emerald-300 hover:underline font-medium">social activity</Link>
                {' feels intentional and cohesive.'}
              </p>
              <p className="text-white/80 leading-relaxed">
                Creative production isn't an afterthought—it's integral to every campaign. Whether you're launching a product, running an event, building social presence or reshaping your brand identity, exceptional creative assets amplify your message and strengthen stakeholder connections. We integrate design, photography, video and copywriting so your communications feel cohesive and professional across all touchpoints.
              </p>
            </div>
          </div>
        </section>

      {/* Why This Service Matters */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Why creative production matters</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          In today's cluttered digital landscape, generic content doesn't cut through the noise. Audiences engage with work that feels authentic, well-crafted and aligned to their values. Strategic creative production—underpinned by audience research and aligned to your business objectives—is what transforms casual interest into genuine engagement and loyalty.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Your visual identity and brand assets are often the first impression stakeholders have—make it count with consistent, high-quality design that reinforces your positioning.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Engaging video, photography and infographics drive higher engagement rates and make complex messages more digestible and shareable.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Strategic copywriting—from headlines to body copy to social captions—sets the tone and ensures your voice remains consistent and on-brand across channels.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Coordinated creative production saves time, reduces cost, and ensures all assets serve a unified campaign narrative rather than operating independently.</span>
          </li>
        </ul>
      </section>

      {/* Our Approach */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Our approach to creative & production</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          We don't believe in one-size-fits-all creative. Every brand has a unique voice, audience and set of objectives. Our process starts with deep discovery, moves through collaborative ideation, and culminates in thoughtful execution backed by data and feedback.
        </p>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Strategy-first ideation</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Before we create anything, we research your brand, competitors, industry and target audience. We align creative direction to your business objectives and brand positioning, ensuring every asset has a clear purpose and contributes to your broader campaign goals.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Integrated asset creation</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Whether you need a cohesive visual identity, a suite of social assets, product photography, explainer video or campaign collateral, we coordinate across disciplines so your creative feels unified. Your PR press release, event branding, social post and website graphics all work together.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Quality copywriting</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Beyond visuals, compelling copy is essential. We craft attention-grabbing headlines, resonant body copy, social captions and website text that speak to your audience, stay true to your brand voice and motivate action. From landing pages to blog posts to social media, every word matters.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Iterative refinement</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We present concepts, gather your feedback, refine and iterate. Once assets are live, we monitor performance—engagement, shares, conversions—and continuously optimise based on audience response and data insights.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Local, cultural sensitivity</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Hong Kong and the Greater Bay Area have distinct visual and cultural preferences. We ground our creative in local insight—colour psychology, design trends, language nuance, cultural references—ensuring your message resonates authentically with your market.
            </p>
          </div>
        </div>
      </section>

      {/* Scope of Services */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Scope of services</h2>
        <div className="space-y-12">
          {/* Copywriting */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Copywriting</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Website copy, landing pages and value propositions that convert visitors to customers.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Blog articles, whitepapers and thought-leadership content that establish your authority.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Social media captions, email copy and campaign messaging optimised for each platform.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Press releases, media kits and corporate communications that maintain professional tone.</span>
              </li>
            </ul>
          </div>

          {/* Graphic Design */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Graphic Design</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Logo design, brand identity systems and visual guidelines that anchor your brand.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Social media graphics, infographics and visual content assets that drive engagement.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Web graphics, UI design and digital assets for websites and applications.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Print collateral—brochures, business cards, posters, event materials—that reflect your brand offline.</span>
              </li>
            </ul>
          </div>

          {/* Video Production */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Video Production</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Product demos and explainer videos that simplify complex offerings.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Corporate profiles, team spotlights and behind-the-scenes content that humanise your brand.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Campaign films and social clips optimised for different platforms and audiences.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Event coverage, testimonials and user-generated content curation for authentic storytelling.</span>
              </li>
            </ul>
          </div>

          {/* Photography */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Photography & Visual Content</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Product photography that showcases features, quality and unique selling points.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Team and portrait photography that humanise your organisation.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Event and lifestyle photography capturing authentic moments for social and marketing use.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Motion graphics and animation for dynamic infographics and multimedia storytelling.</span>
              </li>
            </ul>
          </div>

          {/* Content Strategy */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Content Strategy & Optimisation</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Content strategy development aligned to your brand goals, audience and channel mix.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Content calendars and editorial planning for consistent, on-brand output.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Performance monitoring and optimisation based on engagement, reach and conversion data.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">A/B testing different creative approaches to identify what resonates with your audience.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Examples of Work */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How brands work with us</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          Radiance applies creative production across diverse industries and campaign types. Often, we combine design and video with{' '}
          <Link href="/vibe-demo/radiance/services/public-relations" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">PR</Link>
          {' and '}
          <Link href="/vibe-demo/radiance/services/social-media" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">social strategy</Link>
          {' to create fully integrated campaigns where every asset reinforces the core message.'}
        </p>
        <div className="space-y-8">
          {/* Use Case 1 */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Product Launch, Consumer Brand</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              A fashion or beauty brand needed to launch a new product line with integrated PR and social presence. We designed product photography, created launch video assets, developed social content calendar, and coordinated press release copy and event collateral—ensuring the visual identity and messaging felt consistent across media coverage, Instagram, the website and the launch event itself.
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">→</span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">Strong visual differentiation in market, coordinated media and social coverage, higher social engagement through platform-specific creative.</span>
              </li>
            </ul>
          </div>

          {/* Use Case 2 */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Exhibition & Cultural Programme, Art Institution</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              A museum or gallery running an exhibition needed promotional materials, event graphics, artist interviews and social content to drive attendance. We developed the visual identity, photographed key artworks, created social media series, produced interview videos and coordinated all written collateral—press materials, website copy, social captions—into a cohesive storytelling campaign.
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">→</span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">Unified visual and narrative identity across all touchpoints; increased event awareness and attendance through coordinated creative assets.</span>
              </li>
            </ul>
          </div>

          {/* Use Case 3 */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Brand Refresh & Sustainability Initiative, NGO</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              An environmental NGO needed to rebrand and launch a new sustainability programme. We created a new visual identity, designed collateral and social assets, filmed beneficiary testimonials and impact videos, developed website copy, and coordinated all creative to reinforce the organisation's evolved mission and credibility with donors, partners and the community.
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">→</span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">Modern, cohesive brand identity reflecting organisational evolution; authentic storytelling through video and photography strengthening trust with stakeholders.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work with you</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">1. Discovery & Strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We kick off with a workshop or brief where we understand your brand, business objectives, target audience and creative preferences. We research your market, competitors and industry trends. This foundation shapes every creative decision we make.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">2. Concept & Creative Direction</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We present creative concepts, design directions and copy concepts for your feedback. We iterate and refine based on your input, ensuring the direction aligns to your vision before we move into full production.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">3. Production & Execution</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Once direction is locked, we move into execution—shooting, designing, filming, writing. We keep you updated with work-in-progress, gather feedback in real time, and make adjustments to ensure the output meets your expectations.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">4. Delivery & Optimisation</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We deliver final assets in all required formats—social, web, print, video. Once live, we monitor performance, gather audience feedback and identify optimisation opportunities for future iterations or ongoing campaigns.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Do you work with in-house teams or external agencies?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes, both. Whether you have an internal marketing team, work with other agencies, or manage campaigns independently, we adapt our process to fit your workflow. We're comfortable collaborating with stakeholders, providing assets for your distribution, or managing the full production from start to finish.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can you create content in both English and Chinese?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Absolutely. We have native speakers and cultural experts who craft copy, design and messaging that resonates in both English and Traditional Chinese. This includes understanding tone, cultural nuance and platform-specific language preferences for Hong Kong and Greater Bay Area audiences.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How long does a typical creative project take?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              It depends on scope and complexity. A social media graphics package might take 2–3 weeks; a full brand identity redesign could take 6–8 weeks; a video production typically takes 4–6 weeks from concept to delivery. We'll give you a clear timeline during the discovery phase.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can we start with a pilot or smaller project?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Of course. Many clients start with a smaller scope—a social content series, product photography shoot or campaign video—to see how we work together. Once you're comfortable, we can scale up to larger integrated projects.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Do you handle copyright and asset ownership?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes. All work we create is yours to own and use. We discuss usage rights, file formats and deliverables upfront so you know exactly what you're getting and how you can use it.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to elevate your brand with exceptional creative?</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Whether you need a one-off project or ongoing creative support, our team is ready to craft assets that captivate your audience and drive results. Let's talk about your creative needs and explore how we can help you stand out in a crowded marketplace.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/vibe-demo/radiance/consultation" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
              Start a creative project
            </Link>
            <Link href="/vibe-demo/radiance/case-studies" className="px-6 py-3 border border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 font-medium rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
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
