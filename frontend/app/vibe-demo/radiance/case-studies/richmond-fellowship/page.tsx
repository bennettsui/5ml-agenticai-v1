'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function RichmondFellowshipCaseStudy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <section className="py-16 px-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">NGO & Healthcare</span>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 mt-4 leading-tight">
              Richmond Fellowship: Mental Health Advocacy Campaign
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Policy advocacy and public awareness strategy for mental health and psychiatric rehabilitation services
            </p>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              <img
                src="/images/radiance/case-studies/richmond-fellowship/Richmond-1.jpg"
                alt="Richmond Fellowship Mental Health Advocacy Campaign"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              Richmond Fellowship Mental Health Advocacy Initiative
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
                  Richmond Fellowship of Hong Kong – leading NGO providing mental health and psychiatric rehabilitation services
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Campaign Period</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  2025 (Active around November 2025 - Mental Health Month)
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Background</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Richmond Fellowship of Hong Kong is a leading NGO providing mental health and psychiatric rehabilitation services to individuals and families affected by mental illness. In 2025, the organisation sought to raise public awareness of mental health issues, reduce stigma and advocate for stronger policy support through a strategic communications and media campaign.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Radiance supported Richmond Fellowship in developing a medical communications strategy that combined public education, policy advocacy and high-impact media outreach. The campaign emphasised real stories, expert voices and evidence-based messaging to shift public perceptions and influence decision-makers.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Objectives</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Increase public awareness and understanding of mental health and recovery</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Reduce stigma associated with mental illness through authentic storytelling and education</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Secure high-impact media coverage across news, health and current affairs platforms</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Support policy advocacy efforts by demonstrating public interest and need</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Position Richmond Fellowship as trusted expert resource on mental health in Hong Kong</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Strategy & Approach</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Radiance developed a multi-channel communications strategy that combined earned media, expert positioning and strategic event activation. We worked closely with Richmond Fellowship's leadership and programme teams to identify compelling human stories and policy messages that would resonate with both general audiences and policymakers.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Our media strategy prioritised high-reach, credible outlets including broadcast television and specialist health media, recognising the importance of trust and authority when communicating on sensitive health topics. We also coordinated media engagement around key moments such as Mental Health Month and programme milestones to maximise relevance and newsworthiness.
            </p>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Activities</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Medical communications strategy tailored to mental health and NGO context</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Policy advocacy messaging and materials preparation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">High-impact media outreach targeting news, health and current affairs desks</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Media interviews coordination with spokespeople, service users and clinical experts</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Event planning and media coordination for public engagement activities</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span className="text-slate-600 dark:text-slate-400">Ongoing media relations and coverage monitoring</span>
              </li>
            </ul>
          </div>

          <div className="mb-16 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>
            <div className="bg-cyan-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Featured in Leading Platforms:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-cyan-600 rounded-full"></span>
                  <span className="text-slate-600 dark:text-slate-400"><strong>TVB</strong> – Hong Kong's most-watched broadcaster, reaching millions of viewers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-cyan-600 rounded-full"></span>
                  <span className="text-slate-600 dark:text-slate-400"><strong>Medical Inspire</strong> – Leading health and medical information platform</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-cyan-600 rounded-full"></span>
                  <span className="text-slate-600 dark:text-slate-400"><strong>Mainstream and Health-focused Media</strong> – Additional coverage across relevant outlets</span>
                </div>
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              The campaign successfully elevated Richmond Fellowship's profile, contributed to public discourse on mental health policy and reinforced the organisation's role as a trusted leader in Hong Kong's mental health sector. Coverage on TVB and specialist health platforms provided credibility and reached diverse audience segments including service users, families, healthcare professionals and policymakers.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Takeaways</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">01</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Trust & Authority Matter in Health Communications</h4>
                  <p className="text-slate-600 dark:text-slate-400">Sensitive health topics require high-credibility platforms (broadcast, specialist media) to ensure message authenticity.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">02</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Real Stories Shift Perceptions</h4>
                  <p className="text-slate-600 dark:text-slate-400">Authentic narratives from service users and experts are more powerful than statistics alone in reducing stigma.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">03</span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Timing with Awareness Months Amplifies Impact</h4>
                  <p className="text-slate-600 dark:text-slate-400">Coordinating advocacy with Mental Health Month and similar observances creates editorial hooks and media urgency.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Campaign & Community Gallery</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Behind-the-scenes from mental health advocacy events and community engagement initiatives</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/images/radiance/case-studies/richmond-fellowship/Richmond-1.jpg', alt: 'Community Event' },
              { src: '/images/radiance/case-studies/richmond-fellowship/Richmond-2.jpg', alt: 'Mental Health Awareness Activity' },
              { src: '/images/radiance/case-studies/richmond-fellowship/Richmond-3.jpg', alt: 'Community Engagement' },
              { src: '/images/radiance/case-studies/richmond-fellowship/Richmond-4.jpg', alt: 'Support Program' },
              { src: '/images/radiance/case-studies/richmond-fellowship/Richmond-5.jpg', alt: 'Advocacy Campaign' },
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
            <h3 className="text-2xl font-bold text-white mb-4">Let's discuss your NGO, healthcare or advocacy campaign</h3>
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
              className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
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
