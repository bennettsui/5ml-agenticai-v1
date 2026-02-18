'use client';

export default function RadianceLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/vibe-demo" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:opacity-80">
            ← Back to Vibe Demo
          </a>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Radiance PR & Martech</h2>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-purple-600 dark:text-purple-400">
              Radiance PR & Martech Limited
            </span>
            <h1 className="text-6xl font-bold text-slate-900 dark:text-white leading-tight">
              Integrated Communications, Built for Impact
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Hong Kong-based PR, events, social and creative agency that blends strategic thinking with hands-on execution. From earned media to always-on content, we help brands and organisations build trust, reshape perceptions and drive meaningful results.
            </p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap pt-4">
            <a href="/vibe-demo/radiance/about" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
              Our Story
            </a>
            <button className="px-8 py-4 border-2 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              Explore Services
            </button>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">
            What We Deliver
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">🎤</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Public Relations</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Strategic messaging, media relations, press releases and earned coverage that reshape perceptions and strengthen reputations.
              </p>
            </div>

            {/* Service Card 2 */}
            <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Events & Experience</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                End-to-end planning and execution for product launches, activations, shop openings and brand experiences.
              </p>
            </div>

            {/* Service Card 3 */}
            <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">📱</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Social & Content</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Content creation, strategy and optimisation across websites, blogs and social platforms backed by audience insights.
              </p>
            </div>

            {/* Service Card 4 */}
            <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">KOL & Influencer</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Influencer identification, partnership management and seeding campaigns that connect your brand with trusted voices.
              </p>
            </div>

            {/* Service Card 5 */}
            <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">🎨</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Creative & Production</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Graphic design, photography, video production and motion graphics that bring your brand vision to life.
              </p>
            </div>

            {/* Service Card 6 */}
            <div className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">📊</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Martech & Digital</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Integrated digital marketing solutions that connect online and offline presence with data-driven insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-20 px-6 bg-purple-50 dark:bg-purple-950/20 border-t border-purple-200 dark:border-purple-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">
            Why Radiance
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">✓</span>
                Integrated Approach
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                PR, events, social and creative work together. We don't operate in silos.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">✓</span>
                Earned Media at Heart
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We build genuine media relationships and craft stories journalists want to tell.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">✓</span>
                Local Expertise
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Deep knowledge of HK media, platforms and cultural dynamics that actually move audiences.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">✓</span>
                Hands-On Execution
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We stay close to the details from media outreach to event logistics to content calendars.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">✓</span>
                Diverse Experience
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                10+ years working with brands, NGOs, cultural institutions, and educational bodies.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">✓</span>
                True Partnership
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We aim to grow with you. Long-term collaboration, not one-off campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to elevate your brand?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Whether you're launching a campaign, managing an event, building social presence or navigating a communications challenge, Radiance can help. Let's talk about your needs and explore how we can work together.
            </p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
              Start a conversation
            </button>
            <a href="/vibe-demo/radiance/about" className="px-8 py-4 border-2 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              Learn our story
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500 dark:text-slate-400 space-y-4">
          <p className="font-semibold">Radiance PR & Martech Limited</p>
          <p>Hong Kong</p>
          <p className="pt-4">
            <a href="/vibe-demo" className="text-purple-600 dark:text-purple-400 hover:underline">Back to Vibe Demo</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
