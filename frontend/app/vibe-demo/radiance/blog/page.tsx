'use client';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/vibe-demo/radiance" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:opacity-80">
            ← Back to Radiance
          </a>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Blog & Insights</h2>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Insights & Perspectives
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            The communications landscape in Hong Kong is changing quickly, but some fundamentals stay the same: clear stories, consistent execution and respect for your audience. In our articles, we share reflections from our work in public relations, events, KOL marketing and social media—with a focus on practical ideas you can apply to your own organisation.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Latest articles</h2>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {[
            {
              title: '[Article Title]',
              category: 'Public Relations',
              date: 'Coming soon',
              excerpt: 'Article excerpt coming soon.',
              readTime: '5 min read'
            },
            {
              title: '[Article Title]',
              category: 'Event Strategy',
              date: 'Coming soon',
              excerpt: 'Article excerpt coming soon.',
              readTime: '7 min read'
            },
            {
              title: '[Article Title]',
              category: 'Social Media',
              date: 'Coming soon',
              excerpt: 'Article excerpt coming soon.',
              readTime: '4 min read'
            },
            {
              title: '[Article Title]',
              category: 'KOL Marketing',
              date: 'Coming soon',
              excerpt: 'Article excerpt coming soon.',
              readTime: '6 min read'
            }
          ].map((article, idx) => (
            <div key={idx} className="group cursor-pointer border border-slate-200 dark:border-slate-800 rounded-lg p-8 hover:border-purple-400 dark:hover:border-purple-600 transition-all">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-wide">{article.category}</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{article.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed text-sm">{article.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-500">{article.date}</span>
                <span className="text-xs text-slate-500 dark:text-slate-500">{article.readTime}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Blog articles and insights are coming soon.</strong> We're developing thought leadership content on PR strategy, event management, influencer marketing and digital communications. Subscribe to be notified when new articles are published.
          </p>
        </div>
      </section>

      {/* Topics Covered */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Topics we cover</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            'PR Strategy & Media Relations',
            'Event Planning & Execution',
            'Social Media Best Practices',
            'Influencer Partnerships',
            'Content Strategy & Creation',
            'Brand Positioning & Messaging',
            'Crisis Communication',
            'Integrated Campaign Planning',
            'Audience Insights & Data',
            'Hong Kong Media Landscape',
            'Cultural Sensitivity & Inclusivity',
            'Measuring Campaign Impact'
          ].map((topic) => (
            <div key={topic} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">→</span>
              <span className="text-slate-700 dark:text-slate-300">{topic}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Get insights in your inbox</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
            Subscribe to our newsletter and get the latest articles, case studies and insights delivered to your inbox monthly. We share practical thinking on PR, events, digital and integrated campaigns.
          </p>
          <form className="flex gap-3 flex-col sm:flex-row">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Want to discuss something specific?</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
            Have a question about PR strategy, event planning, social media or influencer marketing? We're happy to discuss your specific situation and share what we've learned from similar projects.
          </p>
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
            Get in touch
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 mt-16">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Radiance PR & Martech Limited | Hong Kong</p>
          <p className="mt-2">
            <a href="/vibe-demo/radiance" className="text-purple-600 dark:text-purple-400 hover:underline">Back to Radiance</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
