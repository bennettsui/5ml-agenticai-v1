'use client';

import Link from 'next/link';
import { FileSpreadsheet, TrendingUp, BarChart3, Layers, BookOpen, Newspaper, Camera } from 'lucide-react';

export default function Home() {
  const useCases = [
    {
      id: 'mans-accounting',
      title: "Man's Accounting Firm",
      description: 'Receipt to P&L automation with Claude Vision OCR and HK compliance',
      icon: FileSpreadsheet,
      href: '/use-cases/mans-accounting',
      color: 'from-blue-500 to-cyan-600',
      features: ['OCR Processing', 'Auto-Categorization', 'Excel Export', 'HK Compliance'],
      status: 'Production Ready'
    },
    {
      id: 'social-agents',
      title: 'Social Media & SEO Agents',
      description: 'AI agents for creative content, SEO optimization, and social media strategy',
      icon: TrendingUp,
      href: '/social',
      color: 'from-purple-500 to-pink-600',
      features: ['Creative Agent', 'SEO Agent', 'Social Agent', 'Research Agent'],
      status: 'Active'
    },
    {
      id: 'topic-intelligence',
      title: 'Topic Intelligence',
      description: 'Multi-topic news monitoring with daily scraping, real-time analysis, and weekly digests',
      icon: Newspaper,
      href: '/intelligence',
      color: 'from-teal-500 to-cyan-600',
      features: ['Source Curator', 'News Analyst', 'Newsletter Writer', 'Real-time Scan'],
      status: 'New'
    },
    {
      id: 'photo-booth',
      title: 'AI Photo Booth',
      description: '18th-century fashion portrait generator for live events with real-time AI transformation',
      icon: Camera,
      href: '/photo-booth',
      color: 'from-amber-500 to-orange-600',
      features: ['Face Detection', 'Theme Selection', '18th Century Styles', 'QR Code Sharing'],
      status: 'New'
    },
    {
      id: 'platform-dashboard',
      title: 'Platform Dashboard',
      description: 'System overview, analytics, architecture visualization, and agent testing',
      icon: BarChart3,
      href: '/dashboard',
      color: 'from-green-500 to-emerald-600',
      features: ['Analytics', 'Architecture', 'Agent Testing', 'Projects'],
      status: 'Active'
    },
    {
      id: 'api-documentation',
      title: 'API Documentation',
      description: 'Complete API reference, endpoints, request/response schemas, and examples',
      icon: BookOpen,
      href: '/api-docs',
      color: 'from-slate-500 to-slate-700',
      features: ['REST API', 'Agent Endpoints', 'Authentication', 'Code Examples'],
      status: 'Documentation'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                5ML Agentic AI Platform
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Multi-layer AI orchestration with specialized agents and use cases
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                ● System Online
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Choose a Use Case
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Select from our production-ready AI solutions or explore the platform capabilities
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <Link
                key={useCase.id}
                href={useCase.href}
                className="group block"
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600">
                  {/* Card Header with Gradient */}
                  <div className={`bg-gradient-to-br ${useCase.color} p-6 text-white`}>
                    <div className="flex items-start justify-between">
                      <Icon className="w-10 h-10 opacity-90" />
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                        {useCase.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mt-4 mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {useCase.description}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Key Features:
                      </h4>
                      {useCase.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-medium text-sm">
                        <span>Open Use Case</span>
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* System Info */}
        <div className="mt-16 bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Platform Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Agents</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">16</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Creative, SEO, Social, Research, OCR, Source Curator, News Analyst, News Writer, Photo Booth (8 agents)</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Use Cases</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{useCases.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Production-ready AI solutions</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">System Status</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">Operational</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">All services running</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>5ML Agentic AI Platform v1.0 • Powered by Claude, DeepSeek, and Perplexity</p>
            <p className="mt-2">Deployed on Fly.io • Region: IAD (Ashburn, Virginia)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
