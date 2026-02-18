'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function DaikinCaseStudy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Home Appliances & Technology</span>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 mt-4 leading-tight">
              Daikin: Thought Leadership Campaign
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Establishing technical authority through expert positioning and consumer-focused PR strategy
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
                  Daikin Air Conditioning Hong Kong – leading Japanese air conditioning brand
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Campaign Period</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  May 2025 – July 2025 (peak summer season)
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Background</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Daikin sought to strengthen its reputation for technical expertise and customer service excellence in Hong Kong's residential and commercial air conditioning markets. The campaign centred on an in-depth interview with Alan Pak, a senior engineer from Daikin's Technical Solutions division with 18+ years of experience.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
              By positioning a senior engineer as a trusted expert voice, Daikin aimed to build consumer confidence, address practical concerns and differentiate itself from competitors in a crowded and commoditised category.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Objectives</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Reinforce Daikin's positioning as a technical leader and trusted advisor</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Generate credible, educational media coverage addressing real consumer concerns</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Secure placements in mainstream news and lifestyle media</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Support brand consideration during peak summer purchase season</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Approach</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Radiance developed a thought leadership PR strategy that leveraged Alan Pak's expertise to create valuable, service-oriented content for media and consumers. Rather than focusing solely on product promotion, we framed the story around practical advice – installation tips, maintenance routines and troubleshooting guidance – that would appeal to editors seeking useful, expert-driven content.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              We prepared detailed Q&A materials and media proposals tailored to different outlet types, ensuring the story could flex for news, lifestyle, property and consumer advice sections.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Activities</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Expert interview strategy development and Q&A preparation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Bilingual press release drafting with practical consumer tips</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Media proposal development tailored to news, property, lifestyle and consumer segments</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Coordination of journalist interviews with Alan Pak</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Media monitoring and coverage reporting</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-blue-50 dark:bg-slate-800 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Executive</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Feature Coverage</p>
              </div>
              <div className="text-center p-6 bg-blue-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Mainstream</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Publication Reach</p>
              </div>
              <div className="text-center p-6 bg-blue-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Summer</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Season Alignment</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Featured in:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Ming Pao Daily',
                  'Ming Pao Supplement',
                  'am730',
                  'TOPick'
                ].map((pub) => (
                  <div key={pub} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{pub}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The expert-driven approach successfully positioned Daikin as a credible, consumer-focused brand. Coverage emphasised technical quality and service reliability rather than promotional messaging, building trust with both residential and commercial customers considering air conditioning investments during peak season.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Insights</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">01</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Thought Leadership Works in B2C</h4>
                  <p className="text-slate-600 dark:text-slate-400">Expert positioning isn't just for B2B – consumer audiences value credible, practical expertise.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">02</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Timing Matters</h4>
                  <p className="text-slate-600 dark:text-slate-400">Aligning PR with seasonal purchase cycles (summer for AC) amplifies relevance and impact.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
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
