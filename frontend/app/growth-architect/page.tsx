'use client';

import Link from 'next/link';
import { Home, ArrowLeft, TrendingUp, BarChart3, Users, Target, Brain, Zap } from 'lucide-react';

export default function GrowthArchitectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-white transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Growth Architect</h1>
              <p className="text-xs text-slate-500 mt-0.5">AI-powered growth strategy & market analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-8">
            <div className="max-w-3xl mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400 mb-4">
                <Zap className="w-3 h-3" /> AI-Powered Growth
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Build Winning Growth Strategies</h2>
              <p className="text-lg text-slate-400 mb-6">
                Get AI-powered analysis of your market, audience, and competitive landscape. Receive actionable growth tactics tailored to your goals.
              </p>
              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors">
                Start Analysis
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: TrendingUp,
                title: 'Market Analysis',
                description: 'Deep-dive analysis of your market, trends, and growth opportunities with competitive intelligence',
              },
              {
                icon: Users,
                title: 'Audience Insights',
                description: 'Understand your target audience - demographics, behaviors, preferences, and pain points',
              },
              {
                icon: Target,
                title: 'Strategy Builder',
                description: 'AI-generated growth strategies aligned with your goals, timeline, and resources',
              },
              {
                icon: BarChart3,
                title: 'KPI Dashboard',
                description: 'Track and measure growth with custom KPIs, benchmarks, and performance metrics',
              },
              {
                icon: Brain,
                title: 'Recommendations',
                description: 'Personalized recommendations for optimization based on market data and your performance',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-500">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Coming Soon Notice */}
        <section className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-6 text-center">
          <p className="text-slate-400">Growth Architect is currently in development. Return to the dashboard to try other features.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}
