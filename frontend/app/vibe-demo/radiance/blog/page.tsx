'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function BlogPage() {
  const articles = [
    {
      slug: 'earned-media-strategy',
      title: 'Why Earned Media Should Be at the Heart of Your PR Strategy',
      excerpt: 'Earned media—coverage that you don\'t pay for, earned through genuine relationships and compelling stories—carries credibility that paid content cannot match. Here\'s why it matters more than ever.',
      category: 'Public Relations',
      date: '18 Feb 2026',
      readTime: '5 min read'
    },
    {
      slug: 'integrated-campaigns',
      title: 'The Power of Integrated Campaigns: When PR, Events and Social Actually Work Together',
      excerpt: 'Most campaigns fail because PR, events and social media operate in silos. Learn how integrated campaigns amplify every channel and deliver measurable results.',
      category: 'Strategy',
      date: '15 Feb 2026',
      readTime: '7 min read'
    },
    {
      slug: 'product-launch-pr',
      title: 'Launching a Product in Hong Kong: A PR Playbook for Local Market Entry',
      excerpt: 'Hong Kong\'s media landscape has unique dynamics. Discover the key steps for securing meaningful coverage and building awareness for new product launches in the market.',
      category: 'Product Launch',
      date: '12 Feb 2026',
      readTime: '6 min read'
    },
    {
      slug: 'event-media-strategy',
      title: 'Beyond the Event: How to Generate Media Coverage Before, During and After Your Launch',
      excerpt: 'Events are powerful, but they\'re even more powerful when paired with strategic PR. Learn how to maximize media impact across the full event lifecycle.',
      category: 'Events',
      date: '10 Feb 2026',
      readTime: '5 min read'
    },
    {
      slug: 'thought-leadership',
      title: 'Building Thought Leadership: Positioning Your Executives as Industry Experts',
      excerpt: 'Thought leadership isn\'t just for B2B. Learn how to position your executives or spokespeople as trusted voices in your industry through media interviews and strategic positioning.',
      category: 'Thought Leadership',
      date: '8 Feb 2026',
      readTime: '6 min read'
    },
    {
      slug: 'ngos-reputation',
      title: 'Reputation Building for NGOs: Earned Media and Community Engagement',
      excerpt: 'NGOs face unique communication challenges. Discover how strategic PR, authentic storytelling and community engagement build trust and drive support.',
      category: 'NGO Communications',
      date: '5 Feb 2026',
      readTime: '7 min read'
    },
    {
      slug: 'cultural-pr',
      title: 'Cultural Marketing: How Art and Culture Organisations Build Audiences Through PR',
      excerpt: 'Cultural organisations need to balance artistic integrity with audience development. Learn how strategic PR and media relations help galleries, museums and cultural events thrive.',
      category: 'Cultural Communications',
      date: '1 Feb 2026',
      readTime: '6 min read'
    },
    {
      slug: 'social-media-strategy',
      title: 'Beyond Posting: Why Your Social Media Strategy Needs PR at Its Core',
      excerpt: 'Social content alone isn\'t enough. The most successful brands connect their social strategy with earned media, events and consistent messaging for compounded impact.',
      category: 'Social Media',
      date: '28 Jan 2026',
      readTime: '5 min read'
    }
  ];

  const categories = ['All', ...new Set(articles.map(a => a.category))];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="pt-16 pb-12 px-6 max-w-6xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Radiance Blog
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Insights on PR strategy, integrated campaigns, media relations, and communications best practices for brands and organizations in Hong Kong.
            </p>
          </div>
        </section>

        {/* Articles */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                className="px-4 py-2 text-sm font-medium rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-600 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/vibe-demo/radiance/blog/${article.slug}`}
                className="group"
              >
                <article className="py-8 border-b border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
                        {article.category}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                        {article.title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Get communications insights in your inbox
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              Subscribe to our newsletter for regular updates on PR strategy, campaign case studies, and communications best practices.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Your email"
                className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 flex-1"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

        {/* Case Studies CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              See these insights in action
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              From environmental education to cultural events to product launches, explore how we\'ve applied PR strategy to deliver real results.
            </p>
            <Link
              href="/vibe-demo/radiance/case-studies"
              className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              View All Case Studies →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
