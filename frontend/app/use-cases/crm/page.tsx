'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  Brain,
  TrendingUp,
  Image,
  Plus,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { crmApi } from '@/lib/crm-kb-api';
import { useCrmAi } from './context';

interface DashboardStats {
  totalBrands: number;
  activeProjects: number;
  feedbackItems: number;
  healthScore: number;
}

const quickLinks = [
  {
    title: 'Brand Management',
    description: 'Manage brand profiles, contacts, and contracts',
    href: '/use-cases/crm/brands',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Brand Profile',
    description: 'Brand tone, guidelines, and visual rules',
    href: '/use-cases/crm/brands',
    icon: Image,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Feedback',
    description: 'Log and analyze brand feedback',
    href: '/use-cases/crm/feedback',
    icon: MessageSquare,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    title: 'Knowledge Base',
    description: 'Brand rules and cross-brand patterns',
    href: '/use-cases/crm/knowledge',
    icon: Brain,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'Health Scores',
    description: 'Track brand health and engagement',
    href: '/use-cases/crm/health',
    icon: TrendingUp,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    title: 'Taste Gallery',
    description: 'Visual library of brand preferences',
    href: '/use-cases/crm/gallery',
    icon: Image,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
];

export default function DashboardPage() {
  const { setPageState } = useCrmAi();

  useEffect(() => {
    setPageState({ pageType: 'dashboard', pageTitle: 'CRM Dashboard' });
  }, []);

  const [stats, setStats] = useState<DashboardStats>({
    totalBrands: 0,
    activeProjects: 0,
    feedbackItems: 0,
    healthScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        const [brandsRes, projectsRes, feedbackRes] = await Promise.allSettled([
          crmApi.brands.list({ page: 1, size: 1 }),
          crmApi.projects.list({ page: 1, size: 1, status: 'in_progress' }),
          crmApi.feedback.list({ page: 1, size: 1 }),
        ]);

        const totalBrands =
          brandsRes.status === 'fulfilled' ? (brandsRes.value.total ?? 0) : 0;
        const activeProjects =
          projectsRes.status === 'fulfilled' ? (projectsRes.value.total ?? 0) : 0;
        const feedbackItems =
          feedbackRes.status === 'fulfilled' ? (feedbackRes.value.total ?? 0) : 0;

        // Health score: average from clients or fallback placeholder
        let healthScore = 85;
        if (brandsRes.status === 'fulfilled' && brandsRes.value.items?.length > 0) {
          // Fetch more brands to compute average health
          try {
            const allBrands = await crmApi.brands.list({ page: 1, size: 50 });
            if ((allBrands.items ?? []).length > 0) {
              const sum = (allBrands.items ?? []).reduce(
                (acc, c) => acc + (c.health_score ?? 0),
                0
              );
              healthScore = Math.round(sum / allBrands.items.length);
            }
          } catch {
            // keep default
          }
        }

        setStats({ totalBrands, activeProjects, feedbackItems, healthScore });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const newMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...chatMessages,
      { role: 'user', content: message },
    ];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await crmApi.chat(newMessages);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.message },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not process your request. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Brands', value: stats.totalBrands, color: 'text-blue-400' },
    { label: 'Active Projects', value: stats.activeProjects, color: 'text-emerald-400' },
    { label: 'Feedback Items', value: stats.feedbackItems, color: 'text-amber-400' },
    { label: 'Health Score', value: stats.healthScore + '%', color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/use-cases/crm/brands/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Brand
          </Link>
          <Link
            href="/use-cases/crm/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5"
          >
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            {loading ? (
              <div className="h-8 w-16 bg-slate-700/50 animate-pulse rounded" />
            ) : (
              <p className={'text-2xl font-bold ' + stat.color}>{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick links grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.title}
                href={link.href}
                className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={'p-2 rounded-lg ' + link.bg}>
                    <Icon className={'w-5 h-5 ' + link.color} />
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {link.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {link.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* AI Chatbot */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">AI Assistant</h2>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          {/* Chat messages */}
          {chatMessages.length > 0 && (
            <div className="max-h-72 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={
                    'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')
                  }
                >
                  <div
                    className={
                      'max-w-[80%] px-4 py-2.5 rounded-lg text-sm ' +
                      (msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-200')
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-400 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat input */}
          <form onSubmit={handleChatSubmit} className="flex items-center border-t border-slate-700/50">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about brands, projects, or knowledge base..."
              className="flex-1 bg-transparent text-white text-sm px-4 py-3.5 placeholder-slate-500 focus:outline-none"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-3.5 text-slate-400 hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
