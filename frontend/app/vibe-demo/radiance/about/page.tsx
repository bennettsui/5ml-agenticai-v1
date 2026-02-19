'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';

export default function RadianceAboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb */}
        <section className="py-6 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'About' }
            ]} />
          </div>
        </section>

      {/* Hero Intro */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            About Radiance
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Radiance PR & Martech Limited is a Hong Kong-based integrated marketing communications agency that combines public relations, events, social media, KOL marketing, and creative production into cohesive solutions for brands, NGOs, cultural institutions, and community initiatives. We believe in tailored strategies backed by hands-on execution, earned media expertise, and genuine collaboration. Every campaign is designed to deliver measurable value, reshape perceptions, and strengthen reputations in an increasingly complex digital-first landscape.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Our story</h2>
        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            Radiance was created as a one-stop integrated marketing communications agency in Hong Kong, built on a strong foundation in public relations, content creation, digital marketing and event management. From the outset, we recognised that fragmented communications—where PR, events and social media operated in silos—rarely delivered the impact our clients needed. We set out to change that by bringing all these disciplines under one roof, led by earned media strategy and backed by real execution expertise.
          </p>
          <p>
            Over the years, our team has evolved beyond traditional PR and events into a genuinely hybrid model. Today we cover KOL marketing, creative design and digital production, while keeping earned media at the heart of our work. We operate to the professional standards set by the{' '}
            <a href="https://www.hkprca.org.hk/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Hong Kong Public Relations Consultants Association (HKPRCA)</a>
            {', which promotes best practice in communications across the industry. We\'ve partnered'} with art galleries and cultural organisations, NGOs and government bodies, educational institutions, technology and fashion brands, hospitality groups, financial services firms, and consumer lifestyle brands. In every sector, we've learned that the most compelling campaigns blend strategic thinking with practical know-how—understanding not just what to say, but how to make it real through media relationships, event logistics, content calendars, and creative production.
          </p>
          <p>
            Our mission is straightforward: to empower brands and organisations through innovative marketing and communication strategies that foster meaningful connections and drive impactful results. We aim to increase both online and offline presence, helping our clients build trust, foster robust stakeholder relationships, and effectively shape attitudes and behaviours in their markets.
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">What we do</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          Radiance operates as one integrated team, not a collection of separate functions. Whether you need a press conference, a social content calendar, a{' '}
          <Link href="/vibe-demo/radiance/services/kol-marketing" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">KOL seeding strategy</Link>
          {' or a full brand campaign, we connect all the pieces so activities reinforce each other. Here\'s how we work across each discipline:'}
        </p>
        <div className="space-y-8">
          {/* PR */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/public-relations" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Public Relations →</Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We develop strategic messaging and build relationships with journalists, editors and media outlets to secure earned coverage that reshapes perceptions and strengthens reputations. This includes press release drafting and localisation, media pitching, interview coordination and crisis monitoring. For us, PR isn't just about getting mentions—it's about using media to tell your story in a way that resonates with your target audience.
            </p>
          </div>

          {/* Events */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/events" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Event & Experience →</Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We plan and execute events end-to-end: product launches, shop openings, shopping mall promotions, charity events, road shows, stage performances, carnivals and entertainment activations. We handle everything from concept and logistics to on-site management and post-event reporting. Events are often where your message comes alive—we make sure every detail, from the run-down to guest experience, reinforces your objectives.
            </p>
          </div>

          {/* Social & Content */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/social-media" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Social Media & Content →</Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We create engaging content for websites, blogs and social platforms, backed by tailored content strategies and ongoing optimisation based on performance data and audience insights. Whether you need always-on content, campaign-specific posts or long-form editorial, we ensure your voice stays consistent and your content drives the conversations that matter to your audience.
            </p>
          </div>

          {/* Creative & Production */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              <Link href="/vibe-demo/radiance/services/creative-production" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Creative & Production →</Link>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We deliver graphic design, photography, video production and motion graphics that build strong visual identities and bring campaigns to life. Every creative asset is designed to serve your strategy, whether it's a launch film, social content, event collateral or brand guidelines that anchor your visual presence.
            </p>
          </div>

          {/* Martech & Digital */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Martech & Digital Strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We bring integrated digital marketing solutions that connect your online and offline presence, powered by data-driven insights. This means aligning your social campaigns with your events, linking your PR coverage to your content calendar, and measuring impact across channels so you know what's working and what needs adjustment.
            </p>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work with you</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Insight-led strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We start by listening carefully to your brand, your audience and your business goals. Rather than applying a template, we uncover what will actually move the needle for you—whether that's thought leadership, awareness, attendance, community building or reputation repair.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Integrated execution</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We connect PR, events, social and content so activities reinforce each other. A press conference becomes a content moment. A product launch drives social seeding. Your media coverage fuels your newsletter. Nothing happens in isolation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Hands-on delivery</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We stay close to the details—press run-downs, guest lists, content calendars, production schedules, media follow-ups. You focus on the bigger picture; we handle the logistics and the craft so your campaign runs smoothly.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Long-term partnership</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We're not here for one-off campaigns. We aim to grow with our clients, learning your market, your stakeholders and your challenges so we can deliver better results over time. Collaboration, consistency and cumulative impact are at the core of how we work.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Work With */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Who we work with</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          We've had the privilege of working with commercial brands, cultural organisations, educational bodies, NGOs and community initiatives across diverse sectors. Our experience spans art and culture, sustainability and environmental programmes, government and institutional communications, architecture, technology, fashion, beauty, food, hospitality, banking and finance, and consumer lifestyle. If you're looking to build trust, reshape perceptions or drive engagement, we can help. Typical scenarios include:
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">Launching a new product, service or institutional initiative and securing media coverage that builds credibility from day one.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">Running exhibitions, community events or educational programmes where you need both media visibility and authentic audience engagement.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">Building an always-on social presence that keeps your brand top-of-mind and drives conversations with your audience across platforms.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">Educating the public or stakeholders on complex topics—from sustainability to technology to social impact—in a way that's clear, credible and compelling.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
            <span className="text-slate-600 dark:text-slate-400">Managing your reputation during periods of change, growth or challenge—whether that's a rebrand, leadership transition or response to market shifts.</span>
          </li>
        </ul>
      </section>

      {/* Values */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">What we believe</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Earned media is powerful.</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              When a journalist writes about your brand or a stakeholder shares your story, it carries weight that paid content cannot. We centre our strategies around building genuine media relationships and crafting stories journalists actually want to tell.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Integration matters.</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The best campaigns don't happen in silos. PR, events, social and creative are stronger when they work together. We design campaigns so every channel amplifies the others.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Local insight is essential.</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Hong Kong and the Greater Bay Area have unique media landscapes, audience behaviours and cultural dynamics. We ground our work in deep local knowledge—about press preferences, platform dynamics, cultural sensitivities and what actually moves audiences here.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Meaningful stories matter.</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We're drawn to brands and organisations with genuine purpose—whether that's driving innovation, supporting communities or championing sustainability. We work best when the story we're telling is one we believe in.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Execution makes the difference.</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The best strategy falls flat without meticulous execution. We care about the details—because that's where most campaigns either succeed or fail. From media outreach to event run-downs to content calendars, we manage the craft.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to work together?</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Whether you're planning a campaign, launching an event, building a social strategy or navigating a communications challenge, we'd love to hear about your needs. Let's explore how Radiance can help you reach your audience, build trust and drive impact.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/vibe-demo/radiance/consultation" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              Discuss your brief
            </Link>
            <Link href="/vibe-demo/radiance/contact" className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}
