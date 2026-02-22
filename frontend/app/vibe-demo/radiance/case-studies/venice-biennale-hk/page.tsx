'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';

export default function VeniceBiennaleCaseStudy() {
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
              { label: 'Venice Biennale' }
            ]} />
          </div>
        </section>

        <section className="py-16 px-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Architecture & Art</span>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 mt-4 leading-tight">
              Venice Biennale 2025: Hong Kong Architecture Exhibition
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              International PR strategy for Hong Kong's showcase at the world's premier architecture biennial
            </p>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              <img
                src="/images/radiance/case-studies/venice-biennale/10_Radiance.png"
                alt="Venice Biennale 2025 Hong Kong Pavilion"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              Hong Kong Architecture Exhibition at Venice Biennale 2025
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
                  Hong Kong Arts Development Council / Venice Biennale Hong Kong Pavilion
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Campaign Period</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  April 2025 – November 2025
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Background</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              The Hong Kong Exhibition at the Venice Architecture Biennale 2025 explored the theme "Legacy for the Future – Inheriting the Future", responding to chief curator Carlo Ratti's overarching theme "Intelligence. Natural. Artificial. Collective."
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              The exhibition focused on often-overlooked public architecture and urban infrastructure in Hong Kong, addressing issues such as climate adaptation, population density, public space quality and the intersection of culture and daily life. The curatorial team – Au Kuai, Chow Wing and Lau Sing Yeung – presented case studies of local buildings including shopping malls, public housing estates and mixed-use complexes, showcasing Hong Kong's "collective intelligence" in creating resilient, adaptive public architecture under challenging urban conditions.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Objectives</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Generate significant media coverage for Hong Kong's participation in a prestigious international architecture event</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Position Hong Kong as a thought leader in sustainable, high-density urban design</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Engage architecture, design, culture and general news media locally and regionally</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Support the opening event in Venice and sustain media interest throughout the Biennale period</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Approach</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Radiance crafted a two-phase PR strategy spanning the exhibition's opening in Venice and its extended run through November. We positioned the exhibition not simply as a display of buildings, but as a forward-looking exploration of how Hong Kong's unique constraints have driven innovative, human-centred design solutions that hold lessons for cities worldwide.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Our media narrative emphasised the relevance of the exhibition's themes to Hong Kong's current urban challenges, making it accessible to general news audiences while maintaining depth for specialist architecture and design media. We coordinated closely with the curatorial team to facilitate interviews and provide rich storytelling materials.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Activities</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Two-phase PR strategy spanning launch, opening and sustained promotion</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Press release compilation and distribution in Traditional Chinese and English</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Opening event management and media coordination in Venice</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Targeted media relations and interview facilitation with curators</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Comprehensive media monitoring throughout the Biennale period</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-amber-50 dark:bg-slate-800 rounded-lg">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">International</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Event Coverage</p>
              </div>
              <div className="text-center p-6 bg-amber-50 dark:bg-slate-800 rounded-lg">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">Multi-sector</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Media Engagement</p>
              </div>
              <div className="text-center p-6 bg-amber-50 dark:bg-slate-800 rounded-lg">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">Extended</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Campaign Reach</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Featured in:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Ming Pao',
                  'Oriental Daily',
                  'am730',
                  'Hong Kong Economic Journal',
                  'Phoenix TV',
                  'Now TV'
                ].map((pub) => (
                  <div key={pub} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{pub}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The exhibition successfully elevated Hong Kong's profile in international architecture discourse. Coverage highlighted both the quality of the curatorial work and the relevance of Hong Kong's urban design lessons to global audiences, positioning the city as a leader in innovative, human-centred urban solutions.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Takeaways</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">01</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">International Events Require Sustained Strategy</h4>
                  <p className="text-slate-600 dark:text-slate-400">Long-running events need phased PR approach spanning opening through closing to maintain momentum.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">02</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Local Relevance Drives Global Coverage</h4>
                  <p className="text-slate-600 dark:text-slate-400">Positioning local content through global lens makes international stories resonate with local media.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Exhibition & Event Gallery</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Behind-the-scenes from the Venice Biennale opening and Hong Kong pavilion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/images/radiance/case-studies/venice-biennale/10_Radiance.png', alt: 'Venice Biennale Hong Kong Pavilion' },
              { src: '/images/radiance/case-studies/venice-biennale/11_Radiance.png', alt: 'Exhibition Opening Event' },
              { src: '/images/radiance/case-studies/venice-biennale/12_Radiance.png', alt: 'Architecture Exhibition Display' },
              { src: '/images/radiance/case-studies/venice-biennale/13_Radiance.png', alt: 'Curatorial Team Presentation' },
              { src: '/images/radiance/case-studies/venice-biennale/14_Radiance.png', alt: 'Public Architecture Showcase' },
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
            <h3 className="text-2xl font-bold text-white mb-4">Let's discuss your cultural or international event campaign</h3>
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
              className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
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
