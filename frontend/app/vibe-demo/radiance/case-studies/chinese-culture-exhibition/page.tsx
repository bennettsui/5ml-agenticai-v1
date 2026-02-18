'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function ChineseCultureExhibitionCaseStudy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <section className="py-16 px-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Art & Culture</span>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 mt-4 leading-tight">
              Chinese Culture Exhibition: "華衣．武藝"
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Cultural celebration bridging traditional martial arts and heritage craftsmanship at Central Market
            </p>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-red-100 to-orange-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              <img
                src="/images/radiance/case-studies/chinese-culture/a-3.jpg"
                alt="Chinese Culture Exhibition at Central Market"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              "華衣．武藝" Exhibition at Central Market
            </p>
          </div>
        </section>

        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Overview</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Partners</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  PolyU SPEED Student Affairs Office, Hong Kong Chinese Culture Promotion Centre, Central Market, Twenty One Twenty
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Campaign Period</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  September 2025 – October 2025
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Background</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              The Chinese Culture Exhibition was a collaborative effort to bring traditional Chinese martial arts and costume culture into a vibrant city market space. The exhibition featured three themed zones – Tai Chi, Wing Chun and Nunchaku – each paired with corresponding traditional garments including Tai Chi suits, cheongsams and martial arts casual wear, creating a dialogue between strength and grace in Chinese culture.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              As part of the programme, PolyU SPEED students participated in a 3D Mini Qipao Design Workshop, working from 2D sketches through to 3D construction. The workshop resulted in 12 completed 3D miniature cheongsams displayed at Central Market, demonstrating how traditional craftsmanship can be reimagined through contemporary creativity and design technology.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Objectives</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Increase public awareness and appreciation of traditional Chinese culture among Hong Kong residents, particularly younger generations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Showcase integration of heritage craft with modern design approaches</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Generate positive media coverage across cultural, lifestyle and education outlets</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Position PolyU SPEED as an institution bridging tradition and innovation</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Approach</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Radiance developed a PR strategy that framed the exhibition not simply as a display of historical artefacts, but as a living conversation between heritage and the present. We positioned the student-led 3D qipao workshop as a compelling story angle that would appeal to education, design and youth-focused media, while the martial arts and costume pairing offered strong visual narratives for lifestyle and cultural outlets.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Our media outreach emphasised the accessibility of the exhibition (free, in a public market space) and its relevance to contemporary Hong Kong identity, making it appealing to general news desks as well as specialist arts and culture editors.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Exhibition Zones</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-slate-700 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Tai Chi Zone</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Soft, flowing martial art paired with Tai Chi suits and traditional uniforms</p>
              </div>
              <div className="p-6 bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-slate-700 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Wing Chun Zone</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Dynamic martial art with cheongsam and traditional dress displays</p>
              </div>
              <div className="p-6 bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-slate-700 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Nunchaku Zone</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Energetic weapons form with martial arts casual wear</p>
              </div>
            </div>
            <div className="p-6 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-lg">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Student Design Workshop</h3>
              <p className="text-slate-600 dark:text-slate-400">12 completed 3D miniature cheongsams created through 2D-to-3D design process, showcasing modern approach to traditional craftsmanship</p>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Activities</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">PR planning and strategy aligned with exhibition programming</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Bilingual press release compilation (Traditional Chinese and English)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Targeted media pitching for preview coverage and features</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Interview coordination with curators, students and partners</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Media monitoring and reporting throughout exhibition period</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Featured in Leading Media:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Ming Pao (明報)',
                  'Wen Wei Po (文匯報)',
                  'am730',
                  'Wenhuazhe (文化者)',
                  'Wenliantang (文聯堂)',
                  'RTHK (香港電台)'
                ].map((pub) => (
                  <div key={pub} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{pub}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The campaign secured strong coverage across leading cultural and mainstream media outlets. The exhibition successfully positioned traditional Chinese culture as accessible and relevant to modern Hong Kong audiences, with particular resonance among education and youth segments. The 3D qipao workshop became a standout story angle, demonstrating how heritage crafts can be reimagined through contemporary technology.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Success Factors</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">01</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Multi-Angle Storytelling</h4>
                  <p className="text-slate-600 dark:text-slate-400">Multiple themes (martial arts, costume, student design) provided different hooks for different media segments.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">02</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Heritage Meets Innovation</h4>
                  <p className="text-slate-600 dark:text-slate-400">Framing traditional content through contemporary lens (3D design, student participation) made it relevant to broader audiences.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">03</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Public Space Accessibility</h4>
                  <p className="text-slate-600 dark:text-slate-400">Free exhibition at Central Market (high foot traffic) generated both media interest and community engagement.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Exhibition & Cultural Gallery</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Behind-the-scenes from the "華衣．武藝" exhibition showcasing martial arts, traditional costumes and student designs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/images/radiance/case-studies/chinese-culture/a-3.jpg', alt: 'Exhibition Opening' },
              { src: '/images/radiance/case-studies/chinese-culture/b-3.jpg', alt: 'Traditional Martial Arts Display' },
              { src: '/images/radiance/case-studies/chinese-culture/c-3.jpg', alt: 'Cultural Costume Exhibition' },
              { src: '/images/radiance/case-studies/chinese-culture/d-3.jpg', alt: 'Student Design Showcase' },
              { src: '/images/radiance/case-studies/chinese-culture/e-2.jpg', alt: 'Heritage Craftsmanship' },
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
            <h3 className="text-2xl font-bold text-white mb-4">Let's discuss your cultural or heritage campaign</h3>
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
              className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
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
