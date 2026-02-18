'use client';

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/vibe-demo/radiance" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:opacity-80">
            ← Back to Radiance
          </a>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Case Studies</h2>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Our Work
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Our work spans art and culture, NGOs, government and institutions, technology, consumer brands and more. Below is a selection of campaigns and events that demonstrate how we bring strategy, creativity and execution together. Each project reflects our commitment to integrated thinking and measurable results.
          </p>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Featured campaigns & events</h2>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {[
            {
              title: 'Chinese Culture Exhibition',
              category: 'Cultural Institution',
              description: 'Media strategy, press events and audience engagement for a major cultural exhibition.',
              tags: ['PR', 'Events', 'Content']
            },
            {
              title: 'Venice Biennale Hong Kong Exhibition',
              category: 'Art & Culture',
              description: 'International exhibition launch, media relations and global audience outreach.',
              tags: ['PR', 'Events', 'International']
            },
            {
              title: 'Consumer Brand Product Launch',
              category: 'Consumer & Lifestyle',
              description: 'Integrated campaign combining press conference, KOL partnerships and social amplification.',
              tags: ['PR', 'KOL', 'Social Media']
            },
            {
              title: 'Tech Company Market Entry',
              category: 'Technology',
              description: 'Go-to-market strategy for Asian expansion with PR, events and industry outreach.',
              tags: ['PR', 'Events', 'Strategy']
            },
            {
              title: 'NGO Awareness Campaign',
              category: 'Social Enterprise',
              description: 'Multi-channel campaign raising awareness and fundraising for social impact initiatives.',
              tags: ['PR', 'Events', 'Content']
            },
            {
              title: 'Beauty Brand Social Campaign',
              category: 'Consumer & Lifestyle',
              description: 'Influencer partnerships, user-generated content and social community building.',
              tags: ['KOL', 'Social Media', 'Community']
            }
          ].map((caseItem, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="bg-gradient-to-br from-purple-50 to-purple-25 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8 h-full hover:border-purple-400 dark:hover:border-purple-600 transition-all">
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">{caseItem.category}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{caseItem.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{caseItem.description}</p>
                <div className="flex flex-wrap gap-2">
                  {caseItem.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
            Each of these projects demonstrates a different aspect of our expertise. We're happy to share more detail about specific campaigns that align with your industry or objectives. Let's discuss what you're looking to achieve.
          </p>
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
            Schedule a conversation
          </button>
        </div>
      </section>

      {/* Approach Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800 mt-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work on every project</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Strategy First</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Every campaign starts with clear business objectives and audience insights. We identify the most effective channels—PR, events, KOL partnerships, social content—and design an integrated strategy that makes each channel stronger.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Creativity + Execution</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We develop compelling ideas and then execute meticulously. Our team manages media relations, produces events, creates content, coordinates partnerships—whatever it takes to bring the strategy to life.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Measurement & Impact</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We track what matters to your business: media coverage and sentiment, audience engagement, event attendance, conversions, brand lift. We share transparent reporting so you see the impact at every stage.
            </p>
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Industries we serve</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Art & Culture', 'NGOs & Social Enterprise', 'Consumer & Lifestyle Brands', 'Technology & Innovation', 'Financial Services', 'Education & Institutions', 'Food & Hospitality', 'Fashion & Beauty'].map((industry) => (
            <div key={industry} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">✓</span>
              <span className="text-slate-700 dark:text-slate-300">{industry}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready for your next campaign?</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Whether your challenge is brand awareness, perception shift, community engagement or market entry, we bring integrated strategy and hands-on execution. Let's discuss what's possible for your brand.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              Let's talk
            </button>
            <button className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              See all services
            </button>
          </div>
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
