'use client';

import { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Activity,
  Network,
  BarChart3,
  Bell,
  Calendar,
  Zap,
  LayoutList,
  ExternalLink,
  Circle,
} from 'lucide-react';
import { crmApi, USE_CASES, type Project, type Deliverable, type DeliverablePriority } from '@/lib/crm-kb-api';
import { useCrmAi } from './context';
import MessageActions from '@/components/MessageActions';

interface DashboardStats {
  totalBrands: number;
  activeProjects: number;
  feedbackItems: number;
  healthScore: number;
}

// ── Quick links ──────────────────────────────────────────

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
    description: 'Track relationship health and engagement',
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

// ── Mock signals ──

interface Signal {
  id: string;
  type: 'at_risk' | 'positive' | 'feedback' | 'connection';
  title: string;
  description: string;
  brand: string;
  timestamp: string;
  actions: string[];
}

const MOCK_SIGNALS: Signal[] = [
  {
    id: 's1',
    type: 'at_risk',
    title: 'No communication for 42 days',
    description: 'Project completion delayed, last response was 6 weeks ago.',
    brand: 'StartupXYZ',
    timestamp: '2h ago',
    actions: ['Schedule Review', 'Send Check-in'],
  },
  {
    id: 's2',
    type: 'positive',
    title: 'Contact promoted to VP',
    description: 'LinkedIn update detected — Maria Rodriguez promoted to VP Marketing.',
    brand: 'EnterpriseCo',
    timestamp: '5h ago',
    actions: ['Send Congratulations', 'Update Strategy'],
  },
  {
    id: 's3',
    type: 'feedback',
    title: '"Loved the Q3 report format"',
    description: 'Positive feedback from David Kim on monthly deliverable quality.',
    brand: 'RetailBrand',
    timestamp: '1d ago',
    actions: ['Log Preference', 'Apply to Others'],
  },
  {
    id: 's4',
    type: 'connection',
    title: 'Key contact connected with competitor',
    description: 'Sarah Chen added a connection from a competing agency on LinkedIn.',
    brand: 'TechCorp',
    timestamp: '2d ago',
    actions: ['Monitor', 'Schedule Check-in'],
  },
];

const SIGNAL_CONFIG: Record<Signal['type'], { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  at_risk: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'At Risk' },
  positive: { icon: ArrowUpRight, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Positive' },
  feedback: { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Feedback' },
  connection: { icon: Network, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Connection' },
};

const MOCK_ACTIONS = [
  { id: 'a1', label: 'Send follow-up to Alex @FinTech', due: 'Due tomorrow', done: false },
  { id: 'a2', label: 'Schedule Q4 review with TechCorp team', due: 'Next week', done: false },
  { id: 'a3', label: 'Share industry report with 3 clients', due: 'This week', done: false },
  { id: 'a4', label: 'Update 5 team member profiles', due: 'This week', done: false },
];

const MOCK_AUTO_ACTIONS = [
  { label: 'Weekly relationship summaries sent', done: true },
  { label: 'Monthly at-risk alerts generated', done: true },
  { label: 'Quarterly deep-dive reports prepared', done: true },
  { label: 'Birthday reminders (configure)', done: false },
];

// ── Priority helpers ──────────────────────────────────────

const PRIORITY_DOT: Record<DeliverablePriority, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  medium:   'bg-yellow-400',
  low:      'bg-slate-500',
};

const UC_BADGE: Record<string, string> = {
  emerald: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
  violet:  'bg-violet-900/30 text-violet-400 border-violet-700/40',
  blue:    'bg-blue-900/30 text-blue-400 border-blue-700/40',
  pink:    'bg-pink-900/30 text-pink-400 border-pink-700/40',
  amber:   'bg-amber-900/30 text-amber-400 border-amber-700/40',
  sky:     'bg-sky-900/30 text-sky-400 border-sky-700/40',
  cyan:    'bg-cyan-900/30 text-cyan-400 border-cyan-700/40',
  orange:  'bg-orange-900/30 text-orange-400 border-orange-700/40',
};

function deadlineColor(iso: string | null): string {
  if (!iso) return 'text-slate-500';
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'text-red-400';
  if (diff <= 3) return 'text-orange-400';
  if (diff <= 7) return 'text-yellow-400';
  return 'text-slate-400';
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diff < 0) return `${label} (overdue)`;
  if (diff === 0) return `${label} (today)`;
  if (diff <= 7) return `${label} (in ${diff}d)`;
  return label;
}

// ── Delivery Board component ──────────────────────────────

type BoardDeliverable = Deliverable & { projectId: string; projectName: string };

function DeliveryBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'done'>('all');
  const [filterUseCase, setFilterUseCase] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await crmApi.projects.list({ page: 1, size: 100 });
      setProjects(res.items ?? []);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Flatten all deliverables across all projects
  const allDeliverables: BoardDeliverable[] = useMemo(() => {
    const flat: BoardDeliverable[] = [];
    for (const p of projects) {
      for (const d of p.deliverables ?? []) {
        flat.push({ ...d, projectId: p.id, projectName: p.name });
      }
    }
    return flat;
  }, [projects]);

  // Apply filters
  const filtered = useMemo(() => {
    return allDeliverables.filter(d => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (filterUseCase !== 'all' && (d.use_case ?? '') !== filterUseCase) return false;
      if (filterPriority !== 'all' && (d.priority ?? '') !== filterPriority) return false;
      return true;
    });
  }, [allDeliverables, filterStatus, filterUseCase, filterPriority]);

  // Group filtered deliverables by project
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: BoardDeliverable[] }>();
    for (const d of filtered) {
      if (!map.has(d.projectId)) map.set(d.projectId, { name: d.projectName, items: [] });
      map.get(d.projectId)!.items.push(d);
    }
    return Array.from(map.entries()).map(([id, v]) => ({ projectId: id, ...v }));
  }, [filtered]);

  // Unique use cases present in the data
  const useCasesInData = useMemo(() => {
    const slugs = new Set<string>();
    for (const d of allDeliverables) { if (d.use_case) slugs.add(d.use_case); }
    return Array.from(slugs);
  }, [allDeliverables]);

  const overdue = allDeliverables.filter(d => {
    if (d.status === 'done' || !d.deadline) return false;
    return new Date(d.deadline) < new Date();
  }).length;

  if (!loaded) {
    return (
      <div className="text-center py-16">
        <LayoutList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 text-sm mb-4">Load deliverables across all projects</p>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutList className="w-4 h-4" />}
          {loading ? 'Loading…' : 'Load Board'}
        </button>
        {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center gap-4 flex-wrap text-sm">
        <span className="text-slate-400">{allDeliverables.length} total deliverables</span>
        {overdue > 0 && (
          <span className="text-red-400 font-medium">{overdue} overdue</span>
        )}
        <span className="text-slate-500">{allDeliverables.filter(d => d.status === 'done').length} done</span>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        >
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {useCasesInData.length > 0 && (
          <select
            value={filterUseCase}
            onChange={e => setFilterUseCase(e.target.value)}
            className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          >
            <option value="all">All use cases</option>
            {useCasesInData.map(slug => (
              <option key={slug} value={slug}>{USE_CASES[slug]?.label ?? slug}</option>
            ))}
          </select>
        )}
      </div>

      {/* Board */}
      {grouped.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">No deliverables match your filters.</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ projectId, name, items }) => {
            const doneCount = items.filter(d => d.status === 'done').length;
            return (
              <div key={projectId} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                {/* Project header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700/30 border-b border-slate-700/40">
                  <Link
                    href={`/use-cases/crm/projects/detail?id=${projectId}`}
                    className="text-sm font-medium text-white hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    {name}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Link>
                  <span className="text-[11px] text-slate-500">{doneCount}/{items.length} done</span>
                </div>

                {/* Deliverable rows */}
                <div className="divide-y divide-slate-700/30">
                  {items.map(d => {
                    const uc = d.use_case ? USE_CASES[d.use_case] : null;
                    const ucBadge = uc ? UC_BADGE[uc.color] ?? UC_BADGE.blue : '';
                    return (
                      <div key={d.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                        {/* Priority dot */}
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${d.priority ? PRIORITY_DOT[d.priority] : 'bg-slate-700'}`} />

                        {/* Status icon */}
                        {d.status === 'done' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : d.status === 'in_progress' ? (
                          <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                        )}

                        {/* Title */}
                        <span className={`flex-1 text-sm min-w-0 truncate ${d.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {d.title}
                        </span>

                        {/* Use-case badge */}
                        {uc && (
                          <a
                            href={uc.href}
                            className={`hidden sm:inline-flex items-center gap-1 flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border ${ucBadge} hover:opacity-80 transition-opacity`}
                          >
                            {uc.label}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        {/* Deadline */}
                        {d.deadline && (
                          <span className={`text-[11px] flex-shrink-0 ${deadlineColor(d.deadline)}`}>
                            {formatDeadline(d.deadline)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

type Tab = 'dashboard' | 'board';

export default function DashboardPage() {
  const { setPageState } = useCrmAi();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    setPageState({ pageType: 'dashboard', pageTitle: 'Relationship Intelligence' });
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

        let healthScore = 85;
        if (brandsRes.status === 'fulfilled' && brandsRes.value.items?.length > 0) {
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
    { label: 'Relationship Score', value: loading ? '...' : stats.healthScore + '%', color: 'text-emerald-400', icon: Activity },
    { label: 'At-Risk Brands', value: loading ? '...' : Math.max(0, Math.round(stats.totalBrands * 0.03)), color: 'text-red-400', icon: AlertTriangle },
    { label: 'Recent Signals', value: loading ? '...' : MOCK_SIGNALS.length, color: 'text-amber-400', icon: Bell },
    { label: 'Upcoming Reviews', value: loading ? '...' : Math.max(1, Math.round(stats.totalBrands * 0.15)), color: 'text-blue-400', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Relationship Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">
            {stats.totalBrands} brands &middot; {stats.activeProjects} active projects &middot; {stats.feedbackItems} feedback items
          </p>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {([
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'board', label: 'Delivery Board', icon: LayoutList },
        ] as { id: Tab; label: string; icon: typeof Activity }[]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && activeTab === 'dashboard' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Dashboard tab ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <Icon className={'w-4 h-4 ' + stat.color} />
                  </div>
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-700/50 animate-pulse rounded" />
                  ) : (
                    <p className={'text-2xl font-bold ' + stat.color}>{stat.value}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Signal Feed + Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signal Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Signal Feed
                </h2>
                <span className="text-xs text-slate-500">Real-time relationship signals</span>
              </div>
              <div className="space-y-3">
                {MOCK_SIGNALS.map((signal) => {
                  const cfg = SIGNAL_CONFIG[signal.type];
                  const SIcon = cfg.icon;
                  return (
                    <div
                      key={signal.id}
                      className={'bg-slate-800/60 border rounded-xl p-4 ' + cfg.bg}
                    >
                      <div className="flex items-start gap-3">
                        <div className={'p-1.5 rounded-lg mt-0.5 ' + cfg.bg}>
                          <SIcon className={'w-4 h-4 ' + cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{signal.title}</span>
                            <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium ' + cfg.bg + ' ' + cfg.color}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{signal.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-slate-500">{signal.brand} &middot; {signal.timestamp}</span>
                            {signal.actions.map((action) => (
                              <button
                                key={action}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Center */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Action Center
                </h2>
                <span className="text-xs text-slate-500">{MOCK_ACTIONS.length} pending</span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pending Actions</h3>
                <div className="space-y-2">
                  {MOCK_ACTIONS.map((action) => (
                    <div key={action.id} className="flex items-center gap-3 group">
                      <button className="w-4 h-4 rounded border border-slate-600 hover:border-emerald-500 transition-colors shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">{action.label}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.due}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Automated Actions</h3>
                <div className="space-y-2">
                  {MOCK_AUTO_ACTIONS.map((action) => (
                    <div key={action.label} className="flex items-center gap-2">
                      {action.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                      )}
                      <span className={'text-xs ' + (action.done ? 'text-slate-400' : 'text-slate-500')}>
                        {action.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {['New Check-in', 'Schedule Review', 'Log Interaction', 'Send Update'].map((label) => (
                  <button
                    key={label}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 border border-slate-600/50 hover:bg-slate-600 hover:text-white transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Relationship Analytics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Relationship Analytics
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-3">Health Distribution</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Strong', pct: 25, color: 'bg-green-500/70', text: 'text-green-400' },
                    { label: 'Stable', pct: 72, color: 'bg-slate-400/50', text: 'text-slate-300' },
                    { label: 'At Risk', pct: 3, color: 'bg-red-500/70', text: 'text-red-400' },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={row.text}>{row.label}</span>
                        <span className="text-slate-400">{row.pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-3">Trends</h3>
                <div className="space-y-3">
                  {[
                    ['Communication freq.', '+15%'],
                    ['Positive feedback', '+22%'],
                    ['Avg response time', '-3.2h'],
                    ['Project renewals', '+22%'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{k}</span>
                      <span className="text-xs text-green-400 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-3">Key Insights</h3>
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Clients with monthly check-ins have <span className="text-emerald-400 font-medium">40% higher satisfaction</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Email follow-ups within 24h increase project renewal by <span className="text-emerald-400 font-medium">35%</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Personal touches improve relationship scores by avg <span className="text-emerald-400 font-medium">12 points</span>
                  </p>
                </div>
              </div>
            </div>
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
                    className="group bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-800 transition-colors"
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
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
              {chatMessages.length > 0 && (
                <div className="max-h-72 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={'flex group ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
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
                        <MessageActions content={msg.content} variant={msg.role === 'user' ? 'user' : 'assistant'} />
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
              <form onSubmit={handleChatSubmit} className="flex items-center border-t border-slate-700/50">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about relationships, brands, signals, or projects..."
                  className="flex-1 bg-transparent text-white text-sm px-4 py-3.5 placeholder-slate-500 focus:outline-none"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-3.5 text-slate-400 hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Board tab ── */}
      {activeTab === 'board' && <DeliveryBoard />}
    </div>
  );
}
