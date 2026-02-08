'use client';

import Link from 'next/link';
import { Users, Brain, MessageSquare, Shield, TrendingUp, Database } from 'lucide-react';

export default function AgenticDashboardPage() {
  const features = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Full CRM with clients, contacts, contracts, opportunities, and project tracking',
      details: ['Client profiles with industry & region', 'Contact management with decision power tracking', 'Contract lifecycle management', 'Opportunity pipeline with stage tracking'],
      href: '/use-cases/crm/clients',
    },
    {
      icon: Shield,
      title: 'Brand Profile & Guidelines',
      description: 'Comprehensive brand setup with tone, visual rules, and AI-powered guideline extraction',
      details: ['Brand tone & values editor', 'Do\'s & Don\'ts management', 'Color palette & typography rules', 'PDF guideline AI extraction'],
      href: '/use-cases/crm/clients',
    },
    {
      icon: MessageSquare,
      title: 'Feedback Learning Loop',
      description: 'Log client feedback and let AI analyze sentiment, extract requirements, and suggest rules',
      details: ['Multi-source feedback logging', 'AI sentiment & topic analysis', 'Automatic rule suggestions', 'Feedback-to-rule conversion'],
      href: '/use-cases/crm/feedback',
    },
    {
      icon: Brain,
      title: 'Knowledge Base',
      description: 'Client-specific rules that evolve into cross-client patterns and best practices',
      details: ['Client-specific rules engine', 'Cross-client pattern detection', 'Global/segment/client scoping', 'Full-text knowledge search'],
      href: '/use-cases/crm/feedback',
    },
    {
      icon: TrendingUp,
      title: 'Health Score Tracking',
      description: 'Automatic client health scoring based on feedback, issues, and engagement',
      details: ['Multi-factor health calculation', 'Historical trend tracking', 'Critical health alerts', 'Factor-level breakdown'],
      href: '/use-cases/crm/clients',
    },
    {
      icon: Database,
      title: 'Taste Examples Gallery',
      description: 'Visual library of what clients like and dislike for design and content reference',
      details: ['Likes/dislikes categorization', 'Multi-type support (campaign, KV, video)', 'Tag-based filtering', 'Visual gallery interface'],
      href: '/use-cases/crm/clients',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Brain className="w-7 h-7 text-emerald-400" />
          Agentic Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          AI-powered knowledge evolution engine and system overview
        </p>
      </div>

      {/* Knowledge Evolution Engine */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-lg font-bold text-white mb-4">Knowledge Evolution Engine</h2>
        <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
          <div className="px-4 py-2 bg-blue-500/10 text-blue-300 rounded-lg font-medium border border-blue-500/20">
            Client Feedback
          </div>
          <span className="text-slate-500">&rarr;</span>
          <div className="px-4 py-2 bg-purple-500/10 text-purple-300 rounded-lg font-medium border border-purple-500/20">
            AI Analysis
          </div>
          <span className="text-slate-500">&rarr;</span>
          <div className="px-4 py-2 bg-amber-500/10 text-amber-300 rounded-lg font-medium border border-amber-500/20">
            Suggested Rules
          </div>
          <span className="text-slate-500">&rarr;</span>
          <div className="px-4 py-2 bg-green-500/10 text-green-300 rounded-lg font-medium border border-green-500/20">
            Human Approval
          </div>
          <span className="text-slate-500">&rarr;</span>
          <div className="px-4 py-2 bg-teal-500/10 text-teal-300 rounded-lg font-medium border border-teal-500/20">
            Pattern Detection
          </div>
          <span className="text-slate-500">&rarr;</span>
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-300 rounded-lg font-medium border border-emerald-500/20">
            Global Knowledge Base
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="group bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
              </div>
              <p className="text-sm text-slate-400 mb-3">{feature.description}</p>
              <ul className="space-y-1.5">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>

      {/* Tech Stack */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-lg font-bold text-white mb-5">Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Backend</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>FastAPI (Python)</li>
              <li>SQLAlchemy 2.0</li>
              <li>Alembic Migrations</li>
              <li>AsyncPG</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Frontend</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>Next.js 15</li>
              <li>React 19</li>
              <li>Tailwind CSS</li>
              <li>Lucide Icons</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Data</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>PostgreSQL 16</li>
              <li>Redis 7</li>
              <li>Cloudflare R2</li>
              <li>pgvector</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">AI</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>Claude (Anthropic)</li>
              <li>Gmail Integration</li>
              <li>Orchestration Engine</li>
              <li>AI Chatbot</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
