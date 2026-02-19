'use client';

import Link from 'next/link';
import { Newspaper, Sparkles, Smartphone, Star, Palette, Target } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';

export default function ServicesPage() {
  const services = [
    {
      title: 'Public Relations',
      desc: 'Earn credible media coverage through strategic communications and strong media relationships.',
      icon: Newspaper,
      href: '/vibe-demo/radiance/services/public-relations',
      features: ['Media relations', 'Press releases', 'Media pitching', 'Crisis management']
    },
    {
      title: 'Events & Experiences',
      desc: 'Create memorable brand moments that connect with audiences and generate social momentum.',
      icon: Sparkles,
      href: '/vibe-demo/radiance/services/events',
      features: ['Product launches', 'Brand activations', 'Conferences', 'Experiential marketing']
    },
    {
      title: 'Social Media & Content',
      desc: 'Build engaged communities through strategic content and consistent social presence.',
      icon: Smartphone,
      href: '/vibe-demo/radiance/services/social-media',
      features: ['Content strategy', 'Social management', 'Community building', 'Analytics']
    },
    {
      title: 'KOL & Influencer Marketing',
      desc: 'Amplify reach through authentic partnerships with creators your audience trusts.',
      icon: Star,
      href: '/vibe-demo/radiance/services/kol-marketing',
      features: ['Influencer partnerships', 'Ambassador programs', 'Creator relations', 'Campaign seeding']
    },
    {
      title: 'Creative & Production',
      desc: 'Professional design, video, and content production that brings ideas to life.',
      icon: Palette,
      href: '/vibe-demo/radiance/services/creative-production',
      features: ['Video production', 'Graphic design', 'Content creation', 'Brand assets']
    },
    {
      title: 'Integrated Campaigns',
      desc: 'All channels working together so each touchpoint reinforces the others.',
      icon: Target,
      href: '/vibe-demo/radiance/lead-gen',
      features: ['Campaign strategy', 'Multi-channel execution', 'Budget optimization', 'Reporting']
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-6 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Services' }
            ]} />
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-24 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">
              Our Expertise
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Integrated Marketing Solutions
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              From earned media to creative production, we offer comprehensive services designed to work together. Each discipline amplifies the others, creating campaigns that deliver measurable results.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {services.map((service, idx) => (
                <Link
                  key={idx}
                  href={service.href}
                  className="group p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xl dark:hover:shadow-purple-900/20 transition-all"
                >
                  <service.icon className="w-12 h-12 mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {service.desc}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="text-purple-600 dark:text-purple-400 flex-shrink-0">→</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Integration Matters */}
        <section className="py-24 px-6 bg-gradient-to-br from-purple-950 to-purple-900 text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">Why Integrated Services Matter</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-lg font-semibold mb-3">Synergy</h3>
                <p className="text-purple-100 leading-relaxed">
                  When PR, events, and digital work together, they amplify each other. A press release becomes event content. An event generates social momentum. Your content feeds your media strategy.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-lg font-semibold mb-3">Consistency</h3>
                <p className="text-purple-100 leading-relaxed">
                  One team means one message. Your brand voice, visual identity, and strategic direction remain consistent across every touchpoint, every channel, every campaign.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-lg font-semibold mb-3">Efficiency</h3>
                <p className="text-purple-100 leading-relaxed">
                  No duplicate efforts, no siloed thinking. We coordinate budgets, timelines, and resources across all services to maximize impact and minimize waste.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-lg font-semibold mb-3">Results</h3>
                <p className="text-purple-100 leading-relaxed">
                  Integrated campaigns drive measurable outcomes: more media mentions, larger event attendance, stronger social growth, and ultimately stronger business results.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Ready to Work Together?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
              Let's discuss how our integrated services can drive real results for your brand. Book a free consultation to explore what's possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/vibe-demo/radiance/consultation"
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                Book Free Consultation
              </Link>
              <Link
                href="/vibe-demo/radiance/case-studies"
                className="px-8 py-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
              >
                See Our Work
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
