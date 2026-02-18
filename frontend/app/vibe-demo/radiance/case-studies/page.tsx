'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      slug: 'her-own-words-sport',
      title: 'Her Own Words Sport - Sportswear Launch',
      category: 'Fashion & Apparel',
      challenge: 'Launch Hong Kong\'s first sportswear brand featuring 17 Asian sizing options',
      result: '40+ media placements in major fashion and lifestyle outlets',
      metrics: ['40+ Media Placements', 'Featured in Marie Claire, Elle, Cosmopolitan', 'Celebrity partnership with Sammie (Collar)'],
      tags: ['PR', 'Fashion', 'Launch']
    },
    {
      slug: 'daikin',
      title: 'Daikin - Thought Leadership Campaign',
      category: 'Home Appliances',
      challenge: 'Establish thought leadership and strengthen brand image in air conditioning market',
      result: 'Secured coverage from Ming Pao, am730, and TOPick',
      metrics: ['Executive Feature Coverage', '18+ years expertise highlighted', 'Multiple mainstream publications'],
      tags: ['PR', 'Thought Leadership', 'Executive Positioning']
    },
    {
      slug: 'gp-batteries',
      title: 'GP Batteries - Limited Edition Minions Collection',
      category: 'Consumer Products',
      challenge: 'Drive brand awareness and consumer interest through unique product collaboration',
      result: '20+ media placements for novelty product line',
      metrics: ['20+ Media Placements', 'Featured in HK01, TOPick, Baby Kingdom', 'Collectible product success'],
      tags: ['PR', 'Product Launch', 'Consumer Goods']
    },
    {
      slug: 'filorga',
      title: 'FILORGA - NCEF-SHOT & TIME-FILLER Launch',
      category: 'Beauty & Skincare',
      challenge: 'Launch premium winter skincare products and support holiday e-commerce campaign',
      result: '20+ media placements in top-tier fashion and beauty publications',
      metrics: ['20+ Media Placements', 'Featured in Hong Kong Tatler, Madame Figaro, Girl Secret', 'Holiday shopping season support'],
      tags: ['PR', 'Beauty', 'Product Launch']
    },
    {
      slug: 'lung-fu-shan',
      title: 'Lung Fu Shan - "Into the Woods" Environmental Campaign',
      category: 'Education & Environment',
      challenge: 'Promote environmental education and encourage public engagement with nature',
      result: '80+ earned media placements from top-tier outlets',
      metrics: ['80+ Media Placements', '12 media attendees at preview', 'South China Morning Post, Hong Kong Economic Times featured'],
      tags: ['PR', 'Events', 'Environmental', 'Education']
    },
    {
      slug: 'chinese-culture-exhibition',
      title: 'Chinese Culture Exhibition - "華衣．武藝" (Robes & Martial Arts)',
      category: 'Art & Culture',
      challenge: 'Showcase relationship between traditional Chinese martial arts and cultural attire',
      result: 'Successful cultural event promotion and media coverage',
      metrics: ['Cultural dialogue', 'Multiple partner coordination', 'Community engagement'],
      tags: ['PR', 'Events', 'Cultural', 'Art']
    },
    {
      slug: 'venice-biennale-hk',
      title: 'Venice Biennale 2025 - Hong Kong Architecture Exhibition',
      category: 'Architecture & Art',
      challenge: 'Promote Hong Kong\'s architectural heritage and innovation at world-premier architecture biennial',
      result: 'International PR and media coverage for prestigious architecture exhibition',
      metrics: ['International Event', 'Architecture Focus', 'Global Media Reach'],
      tags: ['PR', 'International', 'Architecture', 'Cultural']
    },
    {
      slug: 'richmond-fellowship',
      title: 'Richmond Fellowship - Mental Health Advocacy Campaign',
      category: 'NGO & Healthcare',
      challenge: 'Raise public awareness of mental health issues and advocate for policy support',
      result: 'Secured coverage on TVB and Medical Inspire platforms',
      metrics: ['TVB Broadcast Coverage', 'Medical Inspire Platform', 'Policy Advocacy Support'],
      tags: ['PR', 'Healthcare', 'Advocacy', 'NGO']
    }
  ];

  const categories = ['All', ...new Set(caseStudies.map(cs => cs.category))];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="pt-16 pb-12 px-6 max-w-6xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Our Work
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Integrated campaigns across PR, events, and digital that deliver real business results for brands and institutions across Hong Kong and beyond.
            </p>
          </div>
        </section>

        {/* Case Studies Grid */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                className="px-4 py-2 text-sm font-medium rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-600 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {caseStudies.map((caseItem) => (
              <Link
                key={caseItem.slug}
                href={`/vibe-demo/radiance/case-studies/${caseItem.slug}`}
                className="group"
              >
                <div className="bg-gradient-to-br from-purple-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-8 h-full hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
                    {caseItem.category}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {caseItem.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                    {caseItem.challenge}
                  </p>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold text-sm mb-4">
                    ✓ {caseItem.result}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {caseItem.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-300 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Industries Served */}
        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              Industries We Serve
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'Architecture & City Planning',
                'Art & Culture',
                'Beauty & Skincare',
                'Consumer Products',
                'Education',
                'Environment & Conservation',
                'Fashion & Apparel',
                'Food & Hospitality',
                'Home Appliances',
                'Luxury Goods',
                'Technology'
              ].map((industry) => (
                <div key={industry} className="flex gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready for your next campaign?</h3>
            <p className="text-purple-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              Whether your challenge is brand awareness, perception shift, community engagement or market entry, we bring integrated strategy and hands-on execution. Let's discuss what's possible for your brand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/vibe-demo/radiance/lead-gen"
                className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
              >
                Schedule Your Free Session →
              </Link>
              <Link
                href="/vibe-demo/radiance/contact"
                className="px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
