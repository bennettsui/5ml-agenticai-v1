'use client';

import { useState } from 'react';

export default function RadiancePage() {
  const [email, setEmail] = useState('');

  return (
    <main className="bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-blue-600">Radiance</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#services" className="hover:text-blue-600 transition">Services</a>
            <a href="#cases" className="hover:text-blue-600 transition">Cases</a>
            <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            PR, Events, and Digital—Unified for Hong Kong Brands
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            We don't separate strategy from execution. Radiance connects earned media, live experiences, and social momentum to build real momentum for your brand—whether you're launching a product, shifting perception, or deepening community trust.
          </p>
          <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
            Radiance bridges the traditional PR and events world with modern digital excellence. We're a hybrid agency working across public relations, experiential activations, and always-on content—orchestrating these channels so they amplify each other. From media relations and press events to influencer partnerships and in-house video production, we design integrated campaigns that move the needle for brands and institutions across Hong Kong and beyond.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
              Plan Your Next Campaign
            </button>
            <button className="px-8 py-3 border-2 border-gray-300 text-gray-900 font-medium rounded-lg hover:border-blue-600 hover:text-blue-600 transition">
              Start a Conversation
            </button>
          </div>
        </div>
      </section>

      {/* Credibility Strip */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            We've earned trust working with leading commercial brands, cultural institutions, NGOs, and mission-driven organizations across Hong Kong. Our experience spans category launches and reputation shifts to community engagement and sustainability initiatives—each requiring a blend of strategic thinking and on-the-ground execution.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'Consumer & Lifestyle Brands',
              'Technology Companies',
              'NGOs & Charities',
              'Cultural Institutions',
              'Education & Social Enterprise',
              'Sustainability & Impact'
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Our Services</h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Integrated solutions across PR, events, digital, and creative
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Public Relations',
                desc: 'Build credibility and shape narratives through earned media and thought leadership.',
                bullets: [
                  'Strategic media relations and press release campaigns tailored to Hong Kong and regional journalists',
                  'Media training and executive positioning to amplify your voice',
                  'Press events, conferences, and media briefings—from concept through execution'
                ]
              },
              {
                title: 'Events & Experiences',
                desc: 'Create memorable moments that turn audiences into advocates.',
                bullets: [
                  'Product launches, press conferences, and brand experiences designed for impact',
                  'Community events, charity galas, exhibitions, and cultural activations',
                  'Full-service event management: logistics, registration, on-site production, and post-event storytelling'
                ]
              },
              {
                title: 'Social Media & Content',
                desc: 'Own the conversation with always-on content that resonates.',
                bullets: [
                  'Strategic social planning and community management across platforms',
                  'Long-form and short-form video content, photography, and written storytelling',
                  'Campaign ideation, content calendars, and real-time social response'
                ]
              },
              {
                title: 'KOL & Influencer Marketing',
                desc: 'Amplify reach through authentic partnerships with trusted voices.',
                bullets: [
                  'KOL identification, outreach, and partnership management aligned with brand values',
                  'Influencer campaign strategy and performance tracking',
                  'Micro and macro influencer networks across lifestyle, tech, sustainability, and social impact'
                ]
              },
              {
                title: 'Creative & Production',
                desc: 'Bring ideas to life with in-house design, video, and motion expertise.',
                bullets: [
                  'Graphic design, branding, and digital design assets',
                  'Professional video production, motion graphics, and photography services',
                  'Creative direction and post-production to ensure consistency across all channels'
                ]
              }
            ].map((service, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-8 hover:shadow-lg hover:border-blue-200 transition">
                <h3 className="text-2xl font-bold mb-2 text-blue-600">{service.title}</h3>
                <p className="text-gray-600 mb-6 font-medium">{service.desc}</p>
                <ul className="space-y-3">
                  {service.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cases */}
      <section id="cases" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Integrated Campaigns That Deliver</h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            The best campaigns aren't built in silos. We start with a clear business challenge—whether it's breaking into a new market, shifting brand perception, or driving awareness for a social cause—then orchestrate PR, events, content, and influencer partnerships into a unified strategy. Our clients see the power of integration: earned media that boosts event attendance, experiential moments that fuel social content, influencer partnerships that extend campaign reach.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Reframing a Legacy Brand as Climate-Forward',
                challenge: 'A multinational consumer brand sought to rebuild trust with Hong Kong\'s environmentally conscious audience after criticism over sustainability commitments. We combined an executive media briefing and press conference unveiling new eco-initiatives, coordinated social content and video storytelling showcasing supply-chain improvements, and partnered with sustainability micro-influencers to reach engaged audiences.',
                result: '15+ media placements in tier-1 outlets, 40% uplift in brand sentiment tracking pre/post-campaign, strong attendance and social amplification of launch event.'
              },
              {
                title: 'Building Movement for an Education-Focused Nonprofit',
                challenge: 'A Hong Kong charity launching a new youth education initiative needed to reach donors, educators, and families. We designed an integrated approach: a media campaign positioning education as systemic change, a community launch event featuring partner schools and student testimonials, professional video content shared across social platforms, and strategic partnerships with education-focused influencers.',
                result: '30% increase in website traffic, 18 new organizational partnerships, successful event with 200+ attendees and strong social lift.'
              },
              {
                title: 'Go-to-Market for AI-Powered SaaS in Asia',
                challenge: 'An early-stage tech company launching its first product in Hong Kong and Singapore needed awareness and credibility in a crowded category. We executed a pre-launch PR campaign targeting tech journalists and industry analysts, staged an intimate launch event for press and key opinion leaders, and orchestrated influencer partnerships with tech-savvy business leaders.',
                result: '25+ launch-day media mentions, 500+ event RSVPs and strong video content repurposing, 10K+ social reach in first month.'
              }
            ].map((caseItem, idx) => (
              <div key={idx} className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-lg transition">
                <h3 className="text-xl font-bold mb-4 text-blue-600">{caseItem.title}</h3>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">{caseItem.challenge}</p>
                <div className="flex gap-2 text-sm text-gray-600 italic border-l-4 border-blue-600 pl-4">
                  <span className="font-medium text-blue-600">✓</span>
                  <span>{caseItem.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Radiance */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Why Work with Radiance</h2>
          <p className="text-lg text-gray-700 mb-12 text-center leading-relaxed max-w-3xl mx-auto">
            Most agencies specialize in one channel—PR, events, or social media. That's the problem. Radiance exists because great brands need integrated thinking and hands-on execution across all three. We're not a traditional agency that hands you a strategy deck; we're in the room, on-site, managing the details that turn campaigns into results.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Integrated by Design',
                desc: 'We orchestrate PR, events, and digital as one strategy, not three separate tactics, so each channel amplifies the others.'
              },
              {
                title: 'Hands-on Execution, Not Just Strategy',
                desc: 'Our team manages everything from media relations to event logistics to video production—we own the outcome.'
              },
              {
                title: 'Hybrid Experience',
                desc: 'We\'ve worked with commercial brands, NGOs, cultural institutions, and social enterprises, so we understand both business and purpose-driven narratives.'
              },
              {
                title: 'In-House Creative & Production',
                desc: 'We shoot video, design assets, and manage content creation internally, ensuring speed, consistency, and creative control.'
              }
            ].map((item, idx) => (
              <div key={idx} className="border-l-4 border-blue-600 pl-6">
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-700 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Process */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-center">How We Work</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discover',
                desc: 'We begin with your challenge, your audience, and your goals. Through workshop conversations and market insight, we map the narrative opportunity and identify which channels—PR, events, content, influencers—will move the needle. This isn\'t about ticking boxes; it\'s about understanding what will truly resonate.'
              },
              {
                step: '02',
                title: 'Design',
                desc: 'We develop an integrated campaign strategy that weaves together earned media, experiential moments, and content into a coherent narrative arc. You\'ll see the full roadmap: media targets, event concept, content calendar, influencer partnerships, and creative deliverables. We iterate with you until the strategy feels right.'
              },
              {
                step: '03',
                title: 'Deliver',
                desc: 'Execution is where strategy becomes real. Our team manages media outreach, produces events, creates content, and coordinates partnerships in real time. We track what\'s working, adapt as we go, and report transparently so you see the impact at every stage.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="text-5xl font-bold text-blue-600 mb-4 opacity-20">{item.step}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-700 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact Strip */}
      <section id="contact" className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Move Your Brand Forward?</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            We'd love to learn about your next challenge—whether it's a campaign, an event, a reputation shift, or a market entry. We're happy to start with a 30-minute conversation, no pitch deck required. Let's explore what's possible when PR, events, and digital work as one.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              Start the Conversation
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition">
              Book a 30-Minute Call
            </button>
          </div>
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
                <li><a href="#services" className="hover:text-white transition">Public Relations</a></li>
                <li><a href="#services" className="hover:text-white transition">Events & Experiences</a></li>
                <li><a href="#services" className="hover:text-white transition">Social Media & Content</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#cases" className="hover:text-white transition">Case Studies</a></li>
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
