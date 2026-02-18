'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function FiIorgaCaseStudy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <section className="py-16 px-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Beauty & Skincare</span>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 mt-4 leading-tight">
              FILORGA: NCEF-SHOT & TIME-FILLER Launch
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Premium positioning and holiday season media strategy for advanced anti-aging skincare products
            </p>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              <img
                src="/images/radiance/case-studies/filorga/FILORGA-XMAS-Countdown-Calendar.jpg"
                alt="FILORGA Christmas Countdown Calendar Campaign"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              FILORGA Christmas Countdown Calendar Campaign
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
                  FILORGA Hong Kong – French medical aesthetics brand specializing in science-backed skincare and aesthetic medicine
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Products</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  NCEF-SHOT & TIME-FILLER INTENSIVE – premium winter skincare solutions
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Background</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              FILORGA launched two intensive skincare products tailored for winter skin concerns: NCEF-SHOT and TIME-FILLER INTENSIVE. Both products were positioned as "non-surgical" solutions offering multi-layered repair, deep hydration and anti-ageing benefits, addressing heightened skin sensitivity and dryness common in colder months.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
              To support the launch, FILORGA Hong Kong introduced limited-time promotions and a Christmas advent calendar on its official website and e-commerce platforms, designed to drive traffic, trial and conversion during the competitive holiday shopping season.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Objectives</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Generate high-impact beauty and lifestyle media coverage to build product awareness</span>
              </li>
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Position FILORGA's products as premium, science-backed winter skincare essentials</span>
              </li>
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Drive traffic to e-commerce channels and support promotional campaigns</span>
              </li>
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Secure coverage in top-tier fashion, beauty and lifestyle publications</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Approach</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Radiance crafted a PR narrative centred on the science and efficacy behind FILORGA's formulations, appealing to Hong Kong's sophisticated beauty consumers who value both results and brand heritage. We positioned the products within the broader winter skincare category, tapping into seasonal editorial planning at key beauty and lifestyle titles.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Our approach combined product seeding with KOL and media engagement, allowing editors and influencers to experience the products first-hand and share authentic feedback. We also emphasised limited-time holiday offers to create urgency and newsworthiness.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Activities</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Campaign timeline aligned with product launch and holiday shopping calendar</span>
              </li>
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Bilingual press release drafting highlighting product benefits and seasonal relevance</span>
              </li>
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Strategic product seeding to beauty editors, lifestyle journalists and KOLs</span>
              </li>
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Targeted media pitching to secure product reviews and holiday gift guides</span>
              </li>
              <li className="flex gap-3">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Ongoing media relations and follow-up for maximum coverage quality</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-rose-50 dark:bg-slate-800 rounded-lg">
                <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2">20+</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Media Placements</p>
              </div>
              <div className="text-center p-6 bg-rose-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">Premium</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Fashion & Beauty Titles</p>
              </div>
              <div className="text-center p-6 bg-rose-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">Holiday</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Shopping Season Support</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Featured in:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Hong Kong Tatler',
                  'Madame Figaro Hong Kong',
                  'Girl Secret',
                  'Liv Magazine',
                  'am730',
                  'TOPick',
                  'TOP Beauty',
                  'Headline Daily',
                  'U Magazine / U Beauty'
                ].map((pub) => (
                  <div key={pub} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{pub}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The strong media presence reinforced FILORGA's positioning as a premium skincare authority and supported the brand's e-commerce and retail objectives during the critical holiday season. Product coverage in beauty editors' gift guides and feature articles directly contributed to conversion and trial during peak shopping period.
            </p>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Campaign & Product Gallery</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Product launches, promotional campaigns and seasonal marketing materials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/images/radiance/case-studies/filorga/NCEF-Shot-SUPER-SERUM.jpg', alt: 'NCEF-SHOT Super Serum Product' },
              { src: '/images/radiance/case-studies/filorga/TIME-FILLER-INTENSIVE-SERUM.jpg', alt: 'TIME-FILLER Intensive Serum' },
              { src: '/images/radiance/case-studies/filorga/FILORGA-Website-Promotion-scaled.jpg', alt: 'Website Promotion' },
              { src: '/images/radiance/case-studies/filorga/FILORGA-XMAS-Countdown-Calendar.jpg', alt: 'Holiday Countdown Campaign' },
              { src: '/images/radiance/case-studies/filorga/6.jpg', alt: 'Product Display' },
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
            <h3 className="text-2xl font-bold text-white mb-4">Let's discuss your beauty or product launch campaign</h3>
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
              className="inline-block px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors"
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
