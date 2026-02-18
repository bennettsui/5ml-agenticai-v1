'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';

export default function ServicesPage() {
  const services = [
    {
      title: 'Public Relations',
      desc: 'Earn credible media coverage through strategic communications and strong media relationships.',
      longDesc: 'We build authentic media relationships and craft narratives that resonate. Whether it\'s product launches, thought leadership, or crisis management, we deliver earned media that builds credibility.',
      icon: '📰',
      href: '/vibe-demo/radiance/services/public-relations',
      benefits: ['Media coverage', 'Press releases', 'Media relations', 'Thought leadership']
    },
    {
      title: 'Events & Experiences',
      desc: 'Create memorable brand moments that connect with audiences and generate social momentum.',
      longDesc: 'From intimate workshops to large-scale conferences, we design and execute events that create real momentum. Every touchpoint is orchestrated to amplify your brand message.',
      icon: '🎉',
      href: '/vibe-demo/radiance/services/events',
      benefits: ['Event strategy', 'Logistics management', 'Live production', 'Post-event amplification']
    },
    {
      title: 'Social Media & Content',
      desc: 'Build engaged communities through strategic content and consistent social presence.',
      longDesc: 'We create content that resonates and builds communities. From daily posts to long-form narratives, we help you stay relevant and connected with your audience.',
      icon: '📱',
      href: '/vibe-demo/radiance/services/social-media',
      benefits: ['Content calendars', 'Community management', 'Engagement strategy', 'Analytics & reporting']
    },
    {
      title: 'KOL & Influencer Marketing',
      desc: 'Amplify reach through authentic partnerships with creators your audience trusts.',
      longDesc: 'We identify and partner with the right voices for your brand. Not just reach—authentic alignment that drives real conversations and conversions.',
      icon: '⭐',
      href: '/vibe-demo/radiance/services/kol-marketing',
      benefits: ['Creator identification', 'Negotiation & contracts', 'Campaign management', 'Performance tracking']
    },
    {
      title: 'Creative & Production',
      desc: 'Professional design, video, and content production that brings ideas to life.',
      longDesc: 'Our in-house creative team produces everything from stunning visuals to compelling video content. Fast turnarounds, consistent quality, full creative control.',
      icon: '🎨',
      href: '/vibe-demo/radiance/services/creative-production',
      benefits: ['Graphic design', 'Video production', 'Photography', 'Content creation']
    },
    {
      title: 'Integrated Campaigns',
      desc: 'All channels working together so each touchpoint reinforces the others.',
      longDesc: 'This is where our strength shines. We weave PR, events, content, and creative into cohesive campaigns. Each channel amplifies the others, creating momentum that\'s greater than the sum of its parts.',
      icon: '🎯',
      href: '/vibe-demo/radiance/consultation',
      benefits: ['Strategy development', 'Cross-channel execution', 'ROI optimization', 'Performance metrics']
    }
  ];

  return (
    <main className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      {/* Breadcrumb */}
      <section className="py-6 px-6 border-b border-slate-200 dark:border-slate-800 pt-24">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[
            { label: 'Home', href: '/vibe-demo/radiance' },
            { label: 'Services' }
          ]} />
        </div>
      </section>

      {/* Hero */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
            Our Services
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Integrated solutions across PR, events, digital, and creative. We don't just execute tactics—we orchestrate strategies that build real momentum for your brand.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <Link
                key={idx}
                href={service.href}
                className="group h-full"
              >
                <div className="h-full p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xl dark:hover:shadow-purple-900/20 transition-all">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                    {service.longDesc}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {service.benefits.slice(0, 2).map((benefit, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                    {service.benefits.length > 2 && (
                      <span className="text-xs px-3 py-1 text-slate-500 dark:text-slate-400">
                        +{service.benefits.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Integrated Approach */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-12 text-center">
            Why Integrated Matters
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Each channel amplifies the others',
                desc: 'A press mention drives social conversation. An event creates content. Content becomes earned media. This is multiplication, not addition.'
              },
              {
                title: 'Consistent narrative across touchpoints',
                desc: 'Your audience hears the same story everywhere—PR, social, events, email. This repetition builds recall and trust.'
              },
              {
                title: 'Efficient resource use',
                desc: 'One campaign fuels multiple channels. We maximize impact while minimizing waste. Your budget goes further.'
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl mb-4 text-purple-600 dark:text-purple-400">✓</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to discuss your challenge?
          </h2>
          <p className="text-xl text-purple-100 mb-8 leading-relaxed">
            Let's explore which services fit your goals. No obligation—just a conversation about what's possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vibe-demo/radiance/consultation"
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
            >
              Schedule Consultation →
            </Link>
            <Link
              href="/vibe-demo/radiance/contact"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
