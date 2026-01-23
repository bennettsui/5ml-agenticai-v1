'use client';

import Link from 'next/link';
import { Home, Settings, LayoutDashboard, Radio, PlusCircle, Users, Newspaper, Mail, Search, Rss, Database, Workflow } from 'lucide-react';

interface AgentCard {
  name: string;
  nameZh: string;
  description: string;
  model: string;
  temperature: number;
  icon: React.ElementType;
  color: string;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const agents: AgentCard[] = [
  {
    name: 'Source Curator',
    nameZh: '源頭策展官',
    description: 'Discovers 20 authoritative sources for any topic with URLs, authority scores, and descriptions',
    model: '5ml-source-curator-v1',
    temperature: 0.3,
    icon: Search,
    color: 'blue',
  },
  {
    name: 'News Analyst',
    nameZh: '新聞分析官',
    description: 'Analyzes and scores news importance across 5 dimensions (Relevance, Actionability, Authority, Timeliness, Originality)',
    model: '5ml-news-analyst-v1',
    temperature: 0.4,
    icon: Newspaper,
    color: 'green',
  },
  {
    name: 'News Writer',
    nameZh: '新聞編寫官',
    description: 'Generates HTML email newsletters with top 15 curated articles for weekly digests',
    model: '5ml-news-writer-v1',
    temperature: 0.7,
    icon: Mail,
    color: 'purple',
  },
];

const features: FeatureCard[] = [
  {
    title: 'Topic Setup',
    description: 'Create new topics, discover authoritative sources, and configure monitoring',
    icon: PlusCircle,
    href: '/intelligence/setup',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'Live Scan',
    description: 'Real-time WebSocket scanning with per-source status and article streaming',
    icon: Radio,
    href: '/intelligence/live-scan',
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Dashboard',
    description: 'Daily news feed, stats overview, and article management',
    icon: LayoutDashboard,
    href: '/intelligence/dashboard',
    color: 'from-purple-500 to-pink-600',
  },
  {
    title: 'Settings',
    description: 'Configure scan schedules, digest times, email recipients, and topic preferences',
    icon: Settings,
    href: '/intelligence/settings',
    color: 'from-orange-500 to-red-600',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-900 dark:text-blue-100', icon: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700', text: 'text-green-900 dark:text-green-100', icon: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-900 dark:text-purple-100', icon: 'text-purple-600 dark:text-purple-400' },
};

export default function TopicIntelligencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Topic Intelligence
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Multi-topic news monitoring with daily scraping, real-time analysis, and weekly digests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-full text-xs font-medium">
                ● 3 Agents Active
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/intelligence"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 font-medium text-sm"
            >
              <Users size={18} />
              Overview
            </Link>
            <Link
              href="/intelligence/setup"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <PlusCircle size={18} />
              Setup
            </Link>
            <Link
              href="/intelligence/live-scan"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <Radio size={18} />
              Live Scan
            </Link>
            <Link
              href="/intelligence/dashboard"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link
              href="/intelligence/settings"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.title} href={feature.href} className="group block">
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 h-full">
                    <div className={`bg-gradient-to-br ${feature.color} p-4 text-white`}>
                      <Icon className="w-8 h-8 opacity-90" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                      <div className="mt-4 flex items-center text-teal-600 dark:text-teal-400 text-sm font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                        <span>Open</span>
                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Agents Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">AI Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon;
              const colors = colorClasses[agent.color];
              return (
                <div
                  key={agent.name}
                  className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6 transition-all duration-300 hover:shadow-md`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-white dark:bg-slate-700 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${colors.text}`}>{agent.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{agent.nameZh}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{agent.description}</p>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Model: <span className="font-mono text-slate-700 dark:text-slate-300">{agent.model}</span></span>
                    <span className="text-slate-500 dark:text-slate-400">Temp: <span className="font-mono text-slate-700 dark:text-slate-300">{agent.temperature}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">System Architecture</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Rss className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">L2: Tools</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">InternalLLM, Notion, Scraper, Resend</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">L3: Agents</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Source Curator, News Analyst, Writer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">L4: Knowledge</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Notion DBs: Topics, Sources, News, Digests</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Workflow className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">L5-L7: Workflows</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Setup, Daily Scan, Weekly Digest, WebSocket</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Summary */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Automated Workflows</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Topic Setup</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">One-time workflow to create topics, discover sources, and initialize monitoring</p>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">User Input</span>
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">Source Curator</span>
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">Notion Save</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Daily News Discovery</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Runs daily at 06:00 HKT to scrape sources and analyze news importance</p>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">Multi-Scraper</span>
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">News Analyst</span>
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">WebSocket</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Weekly Digest</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Runs Monday 08:00 HKT to curate top articles and send email newsletter</p>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">Top 15 Curation</span>
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">News Writer</span>
                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded mr-2 mb-1">Resend Email</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
