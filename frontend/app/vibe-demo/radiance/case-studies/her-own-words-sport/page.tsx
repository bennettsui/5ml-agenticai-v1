'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function HerOwnWordsSportCaseStudy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <section className="py-16 px-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Fashion & Apparel</span>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 mt-4 leading-tight">
              Her Own Words Sport: Sportswear Launch Campaign
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Launching Hong Kong's first sportswear brand with inclusive Asian sizing through strategic PR and celebrity partnerships
            </p>
          </div>
        </section>

        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Challenge</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Her Own Words, an established lingerie brand, was launching Her Own Words SPORT—positioning it as Hong Kong's first sports bra brand to offer 17 Asian sizing options specifically designed for Asian body standards. The challenge was to differentiate the brand in a competitive market, communicate the unique value proposition of inclusive sizing, and build awareness among active women in Hong Kong.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Execution</h2>
            <div className="space-y-6">
              <div className="p-6 bg-pink-50 dark:bg-slate-800 border border-pink-200 dark:border-slate-700 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Celebrity Partnership</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Collaborated with Sammie from the popular Hong Kong girl group Collar, a relatable figure with strong influence among target demographics. Produced professional promotional video featuring the celebrity in lifestyle settings.
                </p>
              </div>
              <div className="p-6 bg-pink-50 dark:bg-slate-800 border border-pink-200 dark:border-slate-700 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Media Outreach</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Targeted fashion, lifestyle, and women's publications. Crafted story angles around inclusive sizing, body positivity, and local brand innovation.
                </p>
              </div>
              <div className="p-6 bg-pink-50 dark:bg-slate-800 border border-pink-200 dark:border-slate-700 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Integrated Campaign</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Combined press release distribution, exclusive interviews, and social media amplification for cohesive market launch.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center p-6 bg-pink-50 dark:bg-slate-800 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">40+</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Media Placements</p>
              </div>
              <div className="text-center p-6 bg-pink-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">Premium Titles</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Marie Claire, Elle, Cosmopolitan</p>
              </div>
              <div className="text-center p-6 bg-pink-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">Celebrity Boost</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Sammie partnership amplified reach</p>
              </div>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The campaign successfully positioned Her Own Words SPORT as an innovative, inclusive brand leader. Coverage in premium lifestyle and fashion publications established credibility and reached the target demographic of active, fashion-conscious women. Celebrity partnership amplified organic social reach and brand awareness.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Success Factors</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">✓</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Right Celebrity Partner</h4>
                  <p className="text-slate-600 dark:text-slate-400">Sammie's authentic connection to target audience enhanced credibility and appeal.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">✓</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Clear Differentiation</h4>
                  <p className="text-slate-600 dark:text-slate-400">Inclusive sizing message resonated with media and audiences seeking body positivity narratives.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
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
