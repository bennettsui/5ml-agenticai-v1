'use client';

import Link from 'next/link';
import { Users, Brain, MessageSquare, Shield, TrendingUp, Database, ArrowLeft, ExternalLink } from 'lucide-react';

export default function ClientCrmKbPage() {
  const features = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Full CRM with clients, contacts, contracts, opportunities, and project tracking',
      details: ['Client profiles with industry & region', 'Contact management with decision power tracking', 'Contract lifecycle management', 'Opportunity pipeline with stage tracking']
    },
    {
      icon: Shield,
      title: 'Brand Profile & Guidelines',
      description: 'Comprehensive brand setup with tone, visual rules, and AI-powered guideline extraction',
      details: ['Brand tone & values editor', 'Do\'s & Don\'ts management', 'Color palette & typography rules', 'PDF guideline AI extraction']
    },
    {
      icon: MessageSquare,
      title: 'Feedback Learning Loop',
      description: 'Log client feedback and let AI analyze sentiment, extract requirements, and suggest rules',
      details: ['Multi-source feedback logging', 'AI sentiment & topic analysis', 'Automatic rule suggestions', 'Feedback-to-rule conversion']
    },
    {
      icon: Brain,
      title: 'Knowledge Base',
      description: 'Client-specific rules that evolve into cross-client patterns and best practices',
      details: ['Client-specific rules engine', 'Cross-client pattern detection', 'Global/segment/client scoping', 'Full-text knowledge search']
    },
    {
      icon: TrendingUp,
      title: 'Health Score Tracking',
      description: 'Automatic client health scoring based on feedback, issues, and engagement',
      details: ['Multi-factor health calculation', 'Historical trend tracking', 'Critical health alerts', 'Factor-level breakdown']
    },
    {
      icon: Database,
      title: 'Taste Examples Gallery',
      description: 'Visual library of what clients like and dislike for design and content reference',
      details: ['Likes/dislikes categorization', 'Multi-type support (campaign, KV, video)', 'Tag-based filtering', 'Visual gallery interface']
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Platform
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                Client CRM + Knowledge Base
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Integrated CRM with AI-powered knowledge base that learns from every client interaction
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-medium">
                New
              </span>
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                Open App <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Architecture Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-700 mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Knowledge Evolution Engine</h2>
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
            <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-medium">
              Client Feedback
            </div>
            <span className="text-slate-400">→</span>
            <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg font-medium">
              AI Analysis
            </div>
            <span className="text-slate-400">→</span>
            <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg font-medium">
              Suggested Rules
            </div>
            <span className="text-slate-400">→</span>
            <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg font-medium">
              Human Approval
            </div>
            <span className="text-slate-400">→</span>
            <div className="px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-lg font-medium">
              Pattern Detection
            </div>
            <span className="text-slate-400">→</span>
            <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-lg font-medium">
              Global Knowledge Base
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Tech Stack */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-700 mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Backend</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>FastAPI (Python)</li>
                <li>SQLAlchemy 2.0</li>
                <li>Alembic Migrations</li>
                <li>AsyncPG</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Frontend</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Next.js 14</li>
                <li>React Query</li>
                <li>Tailwind CSS</li>
                <li>shadcn/ui</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Data</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>PostgreSQL 16</li>
                <li>Redis 7</li>
                <li>Cloudflare R2</li>
                <li>pgvector</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">AI</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Claude (Anthropic)</li>
                <li>Sentiment Analysis</li>
                <li>Rule Extraction</li>
                <li>Brand AI Extraction</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Quick Start</h2>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-6 text-sm font-mono text-slate-300 space-y-2">
            <p className="text-slate-500"># Navigate to use case directory</p>
            <p>cd use-cases/client-crm-kb</p>
            <p></p>
            <p className="text-slate-500"># Start infrastructure</p>
            <p>docker-compose up -d postgres redis</p>
            <p></p>
            <p className="text-slate-500"># Run database migrations</p>
            <p>cd apps/api && alembic upgrade head</p>
            <p></p>
            <p className="text-slate-500"># Start API server</p>
            <p>uvicorn app.main:app --reload --port 8000</p>
            <p></p>
            <p className="text-slate-500"># Start frontend (in another terminal)</p>
            <p>cd apps/web && npm install && npm run dev</p>
          </div>
        </div>
      </main>
    </div>
  );
}
