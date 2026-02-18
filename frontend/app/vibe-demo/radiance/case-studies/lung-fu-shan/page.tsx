'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function LungFuShanCaseStudy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="py-16 px-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                Education & Environment
              </span>
            </div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Lung Fu Shan: "Into the Woods" Campaign
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Building awareness and engagement for an environmental education initiative through integrated PR and media strategy
            </p>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              <img
                src="/images/radiance/case-studies/lung-fu-shan/Lung-Fu-Shan-Environmental-Education-Centre-1-1024x683.jpg"
                alt="Lung Fu Shan Environmental Education Centre"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              Lung Fu Shan Environmental Education Centre
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          {/* Overview */}
          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Overview</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Client</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Lung Fu Shan Environmental Education Centre, established by the Environmental Protection Department and the University of Hong Kong
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Campaign</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  "Into the Woods" - A campaign to promote nature exploration and sustainable lifestyle practices
                </p>
              </div>
            </div>
          </div>

          {/* Challenge */}
          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Challenge</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Lung Fu Shan Environmental Education Centre needed to build awareness and drive engagement for new environmental education programs. They aimed to encourage Hong Kong residents to explore nature, learn about conservation, and adopt sustainable lifestyle practices. The challenge was to create buzz around the initiative and reach diverse audiences across different demographics.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Limited awareness of the environmental education centre among the general public</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Need to position environmental education as accessible and engaging for all ages</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Competitive landscape with other environmental and educational organizations</span>
              </li>
            </ul>
          </div>

          {/* Solution */}
          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Execution</h2>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Core Campaign Elements</h3>
              <div className="space-y-6">
                <div className="p-6 bg-green-50 dark:bg-slate-800 border border-green-200 dark:border-slate-700 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Forest Bathing Experience</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Developed a 45-minute "Lung Fu Shan Forest Bathing Taster Experience" introducing participants to the benefits of nature immersion and mindfulness in a forest setting.
                  </p>
                </div>
                <div className="p-6 bg-green-50 dark:bg-slate-800 border border-green-200 dark:border-slate-700 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Fitness Initiative</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Co-curated "Lung Fu Shan Workout Guide" in partnership with HKU Centre for Sports and Exercise, combining fitness with environmental awareness.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">PR & Media Strategy</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">✓</span>
                  <span className="text-slate-600 dark:text-slate-400"><strong>Media Preview Tour:</strong> Organized preview event for 12 media attendees to experience the Forest Bathing program firsthand</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">✓</span>
                  <span className="text-slate-600 dark:text-slate-400"><strong>Targeted Pitching:</strong> Crafted compelling story angles for lifestyle, health, wellness, and environmental publications</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">✓</span>
                  <span className="text-slate-600 dark:text-slate-400"><strong>Expert Commentary:</strong> Positioned centre leadership as environmental education experts for media quotes and features</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">✓</span>
                  <span className="text-slate-600 dark:text-slate-400"><strong>Partnership Promotion:</strong> Highlighted collaboration with University of Hong Kong to enhance credibility</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Results */}
          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center p-6 bg-green-50 dark:bg-slate-800 rounded-lg">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">80+</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Earned Media Placements</p>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-slate-800 rounded-lg">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">12</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Media Preview Attendees</p>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-slate-800 rounded-lg">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">Top-tier</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Publications Featured</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Featured in:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'South China Morning Post',
                  'Hong Kong Economic Times',
                  'TOPick',
                  'Post Magazine',
                  'am730',
                  'Ming Pao Weekly'
                ].map((pub) => (
                  <div key={pub} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{pub}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The campaign successfully elevated awareness of Lung Fu Shan Environmental Education Centre among Hong Kong residents and positioned the center as a leading voice in environmental education and sustainable lifestyle practices. The extensive media coverage provided third-party credibility and reached diverse audiences across different demographics.
            </p>
          </div>

          {/* Key Takeaways */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Takeaways</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 text-lg">01</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Experiential Angle Drives Coverage</h4>
                  <p className="text-slate-600 dark:text-slate-400">Offering media a first-hand experience of the programs (preview tour) generated significantly more engagement and coverage than traditional press releases alone.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 text-lg">02</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Strategic Partnerships Enhance Credibility</h4>
                  <p className="text-slate-600 dark:text-slate-400">Association with University of Hong Kong and positioning as expert commentary source strengthened media interest and placement quality.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 text-lg">03</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Multi-Angle Storytelling</h4>
                  <p className="text-slate-600 dark:text-slate-400">Multiple programs (Forest Bathing + Workout Guide) provided different story angles for different media types - wellness, fitness, environmental.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Related Case Studies */}
        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Related Case Studies</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/vibe-demo/radiance/case-studies/chinese-culture-exhibition"
                className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
              >
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Art & Culture</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">Chinese Culture Exhibition</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Showcase of traditional Chinese martial arts and cultural attire</p>
              </Link>
              <Link
                href="/vibe-demo/radiance/case-studies/venice-biennale-hk"
                className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
              >
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Architecture & Art</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">Venice Biennale 2025</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Hong Kong architecture exhibition at world-premier biennial</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Campaign & Media Gallery</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Behind-the-scenes from the "Into the Woods" campaign and environmental education initiatives</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/images/radiance/case-studies/lung-fu-shan/Lung-Fu-Shan-Environmental-Education-Centre-2-1024x683.jpg', alt: 'Environmental Education Program' },
              { src: '/images/radiance/case-studies/lung-fu-shan/Lung-Fu-Shan-Environmental-Education-Centre-3-1024x683.jpg', alt: 'Nature Exploration Activity' },
              { src: '/images/radiance/case-studies/lung-fu-shan/Lung-Fu-Shan-Environmental-Education-Centre-4-1024x683.jpg', alt: 'Community Engagement' },
              { src: '/images/radiance/case-studies/lung-fu-shan/Ecology-in-The-Making-1816-present-Exhibition.jpg', alt: 'Exhibition Opening' },
              { src: '/images/radiance/case-studies/lung-fu-shan/Into-the-Woods-Souvenir-1024x683.jpg', alt: 'Campaign Material' },
              { src: '/images/radiance/case-studies/lung-fu-shan/Lung-Fu-Shan-Workout-Guide-1024x683.jpg', alt: 'Health & Wellness Guide' },
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
            <h3 className="text-2xl font-bold text-white mb-4">Let's discuss your environmental or cultural initiative</h3>
            <Link
              href="/vibe-demo/radiance/lead-gen"
              className="inline-block px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
            >
              Schedule Your Free Session →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
