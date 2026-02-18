'use client';

import Link from 'next/link';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RadianceLogo } from './components/RadianceLogo';
import { ServicesCube } from './components/ServicesCube';

export default function RadiancePage() {
  return (
    <main className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 bg-white dark:bg-slate-950 relative overflow-hidden">
        {/* Subtle background gradients */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-300 dark:bg-purple-900/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 -left-48 w-80 h-80 bg-slate-300 dark:bg-slate-800/30 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-12 inline-block">
            <RadianceLogo variant="text" size="md" />
          </div>
          <h1 className="text-7xl md:text-8xl font-light mb-8 leading-tight text-slate-900 dark:text-white tracking-tight">
            Integrated PR<br className="hidden md:block" />& Marketing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-16 leading-relaxed max-w-2xl mx-auto font-light">
            Strategy meets execution. We orchestrate PR, events, and digital to build real momentum for your brand in Hong Kong.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/vibe-demo/radiance/consultation"
              className="px-8 py-3 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-medium rounded-none hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300 text-lg"
            >
              Free Consultation
            </Link>
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="px-8 py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-none hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white transition-all duration-300 text-lg"
            >
              See Our Work
            </Link>
          </div>
        </div>
      </section>

      {/* Trust/Credibility Strip */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-500 dark:text-slate-500 mb-12 text-sm uppercase tracking-wide font-medium">
            Trusted by leading brands across sectors
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center text-xs font-medium text-slate-700 dark:text-slate-300 tracking-wide">
            {[
              'Consumer & Lifestyle',
              'Technology',
              'NGOs & Social Impact',
              'Cultural Institutions',
              'Financial Services',
              'Education'
            ].map((item) => (
              <div key={item}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 3D Services Cube */}
      <ServicesCube />

      {/* Services Overview */}
      <section id="services" className="py-32 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-6xl md:text-7xl font-light text-slate-900 dark:text-white mb-6 tracking-tight">
              Our Services
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Integrated solutions across PR, events, digital, and creative
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Public Relations',
                desc: 'Earn credible media coverage through strategic communications and strong media relationships.',
                icon: '📰',
                href: '/vibe-demo/radiance/services/public-relations'
              },
              {
                title: 'Events & Experiences',
                desc: 'Create memorable brand moments that connect with audiences and generate social momentum.',
                icon: '🎉',
                href: '/vibe-demo/radiance/services/events'
              },
              {
                title: 'Social Media & Content',
                desc: 'Build engaged communities through strategic content and consistent social presence.',
                icon: '📱',
                href: '/vibe-demo/radiance/services/social-media'
              },
              {
                title: 'KOL & Influencer Marketing',
                desc: 'Amplify reach through authentic partnerships with creators your audience trusts.',
                icon: '⭐',
                href: '/vibe-demo/radiance/services/kol-marketing'
              },
              {
                title: 'Creative & Production',
                desc: 'Professional design, video, and content production that brings ideas to life.',
                icon: '🎨',
                href: '/vibe-demo/radiance/services/creative-production'
              },
              {
                title: 'Integrated Campaigns',
                desc: 'All channels working together so each touchpoint reinforces the others.',
                icon: '🎯',
                href: '/vibe-demo/radiance/lead-gen'
              }
            ].map((service, idx) => (
              <Link
                key={idx}
                href={service.href}
                className="group p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xl dark:hover:shadow-purple-900/20 transition-all"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{service.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Radiance */}
      <section className="py-24 px-6 bg-gradient-to-br from-purple-950 to-purple-900 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold mb-16 text-center">Why Work with Radiance</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: 'Integrated by Design',
                desc: 'We orchestrate PR, events, and digital as one strategy. Each channel amplifies the others instead of working in isolation.'
              },
              {
                title: 'Hands-On Execution',
                desc: 'We\'re not strategists who disappear. Our team manages media relations, produces events, creates content—we own the outcomes.'
              },
              {
                title: 'Hybrid Experience',
                desc: 'We\'ve worked with commercial brands, NGOs, cultural institutions, and social enterprises. That breadth informs every project.'
              },
              {
                title: 'In-House Creative',
                desc: 'We produce video, design assets, and manage content internally. You get speed, consistency, and creative control.'
              }
            ].map((item, idx) => (
              <div key={idx} className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-purple-100 leading-relaxed text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Highlight */}
      <section id="cases" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Results That Speak
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Integrated campaigns that drive real business outcomes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: 'Lung Fu Shan Conservation',
                challenge: 'Build awareness for environmental education initiative',
                result: '80+ earned media placements, featured in top-tier outlets'
              },
              {
                title: 'Art & Cultural Launch',
                challenge: 'Generate buzz for international exhibition in Hong Kong',
                result: 'Record attendance, strong media coverage, sustained social engagement'
              },
              {
                title: 'Tech Company Entry',
                challenge: 'Market entry for AI-powered platform in Asia',
                result: '25+ launch day mentions, strong analyst coverage, 10K+ social reach'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-8 bg-gradient-to-br from-purple-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all"
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  <span className="font-semibold">Challenge:</span> {item.challenge}
                </p>
                <p className="text-purple-600 dark:text-purple-400 font-semibold">
                  ✓ {item.result}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              View All Case Studies →
            </Link>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-16 text-center">
            Our Process
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discover',
                desc: 'We start with your challenge and goals. Through workshops and research, we map narrative opportunities and identify which channels will move the needle.'
              },
              {
                step: '02',
                title: 'Design',
                desc: 'We develop an integrated strategy weaving together PR, events, content, and partnerships into a coherent narrative. You see the full roadmap before execution begins.'
              },
              {
                step: '03',
                title: 'Deliver',
                desc: 'Our team executes across all channels—media outreach, event production, content creation, partnerships. We track results and adapt in real time.'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -top-8 left-0 w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                  {item.step}
                </div>
                <div className="pt-12 p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-16 text-center">
            What Our Clients Say
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: 'Radiance transformed how we think about integrated marketing. The PR actually drives event attendance, the content gets picked up by media. It works.',
                author: 'Marketing Director',
                company: 'Tech Startup'
              },
              {
                quote: 'We went from completely unknown to being recognized as an industry thought leader in 6 months. The team is professional, responsive, and actually delivers.',
                author: 'Founder',
                company: 'SaaS Company'
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="p-8 bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-lg italic mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Move Your Brand Forward?
          </h2>
          <p className="text-2xl text-purple-100 mb-12 leading-relaxed">
            Let's discuss your next challenge. Whether it's a campaign, reputation shift, or market entry—we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vibe-demo/radiance/lead-gen"
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors text-lg"
            >
              Schedule Your Free Session →
            </Link>
            <Link
              href="/vibe-demo/radiance/contact"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-lg"
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
