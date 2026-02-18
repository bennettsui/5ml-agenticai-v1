'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';

export default function PublicRelationsServicePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <div className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-6 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Services', href: '/vibe-demo/radiance/services' },
              { label: 'Public Relations' }
            ]} />
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                Public Relations
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Positive, credible media exposure strengthens both brand reputation and commercial performance. Radiance PR specialises in developing communication strategies, news angles and media relationships that help your stories land in the right places, with the right framing. We see PR as more than press releases—it is an ongoing process of building relevance, trust and authority with your audiences.
              </p>
            </div>
          </div>
        </section>

        {/* Strategic Overview */}
        <section className="py-16 px-6 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Why media matters</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Earned media—coverage you didn't pay for—carries more credibility than advertising. When journalists feature your brand, your spokesperson or your story, audiences trust it more because it's been editorially vetted. Strategic PR builds long-term visibility, strengthens brand authority and supports every other channel: events, social media, even sales conversations all benefit from positive press coverage and media relationships.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Earned media reaches audiences who wouldn't see your paid ads—journalists introduce your brand to new, relevant audiences and lending it third-party credibility.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Strong media relationships compound—journalists who know you, trust you and understand your story are more likely to cover you again, building a flywheel of visibility.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">PR shapes perception in moments that matter—product launches, leadership changes, crisis response—where how the story is framed determines brand impact.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Integrated PR amplifies other channels—media coverage boosts event attendance, provides social content, and strengthens influencer partnerships.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to build your media presence?</h3>
              <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                Whether you're launching something new, shifting brand perception or building long-term visibility, Radiance brings media expertise and strong journalist relationships to help your brand earn credible coverage. Let's discuss your PR objectives and develop a strategy that works.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link
                  href="/vibe-demo/radiance/consultation"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Start a conversation
                </Link>
                <Link
                  href="/vibe-demo/radiance/about"
                  className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                >
                  Learn about our approach
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
