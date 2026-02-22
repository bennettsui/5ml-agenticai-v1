'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';

export default function GPBatteriesCaseStudy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-3 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Case Studies', href: '/vibe-demo/radiance/case-studies' },
              { label: 'GP Batteries' }
            ]} />
          </div>
        </section>

        <section className="py-16 px-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Consumer Products</span>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 mt-4 leading-tight">
              GP Batteries: Limited Edition Minions Collection
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Product collaboration and brand awareness campaign for novelty collectible collection
            </p>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              <img
                src="/images/radiance/case-studies/gp-batteries/GP-Batteries-x-Minions.jpg"
                alt="GP Batteries Minions Limited Edition Collection"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              GP Batteries × Minions Limited Edition Collaboration
            </p>
          </div>
        </section>

        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Overview</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Client</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  GP Batteries International – leading battery and portable power solution provider
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Product Category</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Limited edition collectible batteries and accessories
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Background</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              GP Batteries International collaborated with Universal Pictures to launch a limited-edition Minions collection featuring portable fans and alkaline batteries. The collection was positioned as a fun, functional and collectible summer essential, tapping into the enduring popularity of the Minions IP among families and young adults in Hong Kong.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The campaign aimed to drive awareness and sales during the summer season, when demand for portable fans peaks, while reinforcing GP Batteries' reputation for quality and innovation through a high-profile IP partnership.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Objectives</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Generate media coverage and consumer awareness for the GP x Minions limited-edition collection</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Position the products as must-have summer items for families and Minions fans</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Drive retail and e-commerce sales during the peak summer period</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Secure placements in lifestyle, parenting, consumer and entertainment media</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Approach</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Radiance framed the launch as a seasonal lifestyle story rather than a pure product announcement, emphasising the fun, collectible nature of the Minions designs and the practical utility of the portable fans during Hong Kong's hot, humid summer. This angle made the story appealing to lifestyle, parenting and consumer editors looking for timely, relatable content.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Our media outreach targeted outlets with strong family and consumer readership, and we emphasised the limited-edition nature of the collection to create urgency and newsworthiness.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Product Collection</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-yellow-50 dark:bg-slate-800 border border-yellow-200 dark:border-slate-700 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Limited Edition Hand-held Fan</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Cute collectible personal cooling device with Minions character design</p>
              </div>
              <div className="p-6 bg-yellow-50 dark:bg-slate-800 border border-yellow-200 dark:border-slate-700 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Limited Edition Alkaline Batteries</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Novelty battery packs with Minions branding and collectible packaging</p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Activities</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">PR planning and campaign timeline aligned with product availability</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Press release drafting in Traditional Chinese for lifestyle and consumer media</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Targeted media pitching to parenting, lifestyle, consumer and entertainment outlets</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Media relations and follow-up to secure product features and seasonal round-ups</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-yellow-50 dark:bg-slate-800 rounded-lg">
                <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">20+</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Media Placements</p>
              </div>
              <div className="text-center p-6 bg-yellow-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Summer</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Peak Season Campaign</p>
              </div>
              <div className="text-center p-6 bg-yellow-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Limited</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Edition Success</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Featured in Popular Consumer & Parenting Media:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'HK01',
                  'TOPick',
                  'Baby Kingdom',
                  'Ming Pao Power Up'
                ].map((pub) => (
                  <div key={pub} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{pub}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The coverage successfully positioned the GP x Minions collection as a fun, practical summer product, supporting retail visibility and sales momentum during the peak season. The campaign transformed GP Batteries' image from a commodity product provider to a brand capable of delivering collectible lifestyle items. Character-driven storytelling resonated strongly with family and lifestyle media segments, driving both consumer interest and retail activity.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Takeaways</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">01</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Character Licensing Drives Consumer Appeal</h4>
                  <p className="text-slate-600 dark:text-slate-400">Pairing utilitarian products with beloved characters transforms them into collectibles and lifestyle items.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">02</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Limited Availability Creates Urgency</h4>
                  <p className="text-slate-600 dark:text-slate-400">Emphasizing limited edition nature and seasonal availability makes coverage more newsworthy and compelling.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">03</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Multi-Media Angle Strategy</h4>
                  <p className="text-slate-600 dark:text-slate-400">Appealing to toy media, parenting publications and lifestyle editors simultaneously maximizes reach and coverage.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Campaign & Product Gallery</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Behind-the-scenes from the Minions limited edition product launch and retail collaboration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/images/radiance/case-studies/gp-batteries/GP-Batteries-x-Minions.jpg', alt: 'Limited Edition Minions Collection' },
              { src: '/images/radiance/case-studies/gp-batteries/GP-Batteries-x-Minions-batteries.jpg', alt: 'Product Display' },
              { src: '/images/radiance/case-studies/gp-batteries/GP-Batteries-Minions-collaboration-handheld-fan-1024x683.jpg', alt: 'Retail Collaboration' },
              { src: '/images/radiance/case-studies/gp-batteries/GP超霸電池-x-Minions-小黃人-1-1024x1024.jpg', alt: 'Product Packaging' },
              { src: '/images/radiance/case-studies/gp-batteries/GP超霸電池-x-Minions-小黃人-2-1024x768.jpg', alt: 'Campaign Material' },
            ].map((image, idx) => (
              <div
                key={idx}
                className="relative group overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 aspect-video"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-medium">{image.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Let's discuss your product launch or consumer campaign</h3>
            <Link
              href="/vibe-demo/radiance/consultation"
              className="inline-block px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
            >
              Schedule Your Free Consultation →
            </Link>
          </div>
        </section>

        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="inline-block px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
            >
              ← Back to All Case Studies
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
