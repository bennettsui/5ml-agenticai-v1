'use client';

import {
  TrendingUp, AlertCircle, Calendar, Zap, RefreshCw, Filter,
  MessageSquare, Bookmark, Share2, ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function GovernmentTenderIntelligence() {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const topics = [
    { id: 'all', label: 'All Updates', count: 24 },
    { id: 'policy', label: 'Policy Changes', count: 5 },
    { id: 'opportunities', label: 'New Opportunities', count: 12 },
    { id: 'competitor', label: 'Competitor Activity', count: 4 },
    { id: 'regulatory', label: 'Regulatory Updates', count: 3 },
  ];

  const newsItems = [
    {
      id: 1,
      date: '2024-02-15',
      time: '09:30',
      category: 'Regulatory',
      title: 'New Procurement Guidelines Released for Government Tenders',
      summary: 'The government has released updated procurement guidelines effective immediately. Key changes include...',
      source: 'Government IT',
      relevance: 95,
      sentiment: 'positive',
    },
    {
      id: 2,
      date: '2024-02-14',
      time: '14:15',
      category: 'Opportunity',
      title: 'Water Authority Announces Major Infrastructure Modernization RFP',
      summary: 'Total project value estimated at HKD 50-100 million. Multiple contracts will be awarded across...',
      source: 'Water Authority',
      relevance: 88,
      sentiment: 'positive',
    },
    {
      id: 3,
      date: '2024-02-13',
      time: '11:45',
      category: 'Competitor',
      title: 'Tech Competitor Wins Major IT Service Tender',
      summary: 'Local tech firm secures 3-year IT infrastructure contract worth HKD 15 million...',
      source: 'Industry News',
      relevance: 72,
      sentiment: 'neutral',
    },
    {
      id: 4,
      date: '2024-02-12',
      time: '16:20',
      category: 'Policy',
      title: 'Budget Allocation for Public Utilities Increased by 15%',
      summary: 'Annual budget for public utilities infrastructure projects increased to support expansion...',
      source: 'Finance Bureau',
      relevance: 65,
      sentiment: 'positive',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-6 px-4 border-b border-slate-700/50 sticky top-0 bg-slate-950/80 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold text-white">Government Tender Intelligence</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time news, alerts, and procurement insights</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Stats Cards */}
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-indigo-500/30 bg-indigo-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-indigo-400 font-semibold">UPDATES TODAY</span>
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-indigo-400">12</div>
              </div>

              <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-emerald-400 font-semibold">OPPORTUNITIES</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">8</div>
              </div>

              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-400 font-semibold">URGENT ALERTS</span>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400">3</div>
              </div>
            </div>

            {/* Topic Filter */}
            <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/60">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Topics</h3>
              <div className="space-y-1">
                {topics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTopic === topic.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{topic.label}</span>
                      <span className="text-xs opacity-70">{topic.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/60">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/use-cases/government-tenders"
                  className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  → Tender Operations
                </Link>
                <a
                  href="#"
                  className="block text-sm text-slate-400 hover:text-white transition-colors"
                >
                  → Subscribe to Alerts
                </a>
                <a
                  href="#"
                  className="block text-sm text-slate-400 hover:text-white transition-colors"
                >
                  → View Archives
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-4">
            {/* Last Updated */}
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                Last updated: 2024-02-15 17:45 HKT
              </div>
              <button className="text-xs px-2 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                <Filter className="w-3 h-3 inline mr-1" /> More Filters
              </button>
            </div>

            {/* News Feed */}
            <div className="space-y-3">
              {newsItems.map((item, idx) => (
                <article
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.03] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.category === 'Regulatory'
                            ? 'bg-blue-500/20 text-blue-400'
                            : item.category === 'Opportunity'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.category === 'Competitor'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-500">{item.source}</span>
                      </div>
                      <h2 className="text-base font-semibold text-white mb-1 hover:text-indigo-400 cursor-pointer transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{item.summary}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{item.date} {item.time}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Relevance:</span>
                          <span className="font-semibold text-indigo-400">{item.relevance}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Relevance Badge */}
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600/20 to-indigo-400/20 border border-indigo-500/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-400">{item.relevance}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-500 hover:text-slate-400 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-500 hover:text-slate-400 transition-colors">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-500 hover:text-slate-400 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition-colors">
                      Read Full
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Link to live module */}
            <div className="p-5 rounded-lg border border-teal-500/30 bg-teal-500/5">
              <h3 className="font-semibold text-teal-400 mb-2">Live: HK + SG Tender Intelligence</h3>
              <p className="text-sm text-slate-400 mb-3">
                Real-time RSS/XML scraping, AI evaluation, and daily digest — now operational.
              </p>
              <a
                href="/use-cases/hk-sg-tender-intel"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors"
              >
                Open Tender Intelligence →
              </a>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
