'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database, Globe, FileText, Mail, BookOpen, Brain, Search, RefreshCw,
  TrendingUp, Users, MessageSquare, Newspaper, Layers, HardDrive,
  CheckCircle2, XCircle, AlertCircle, Zap, BarChart3, Clock, ChevronDown,
  ChevronUp, ExternalLink,
} from 'lucide-react';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface KBStats {
  timestamp: string;
  overview: {
    totalKnowledgeItems: number;
    ragDocuments: number;
    ragTerms: number;
    vectorDocuments: number;
    vectorStoreAvailable: boolean;
    embeddingProvider: string;
  };
  crm: {
    clients: number;
    projects: number;
    feedback: number;
    recentClients: Array<{ id: string; name: string; status: string; created_at: string }>;
    recentFeedback: Array<{ id: string; sentiment: string; topics: string[]; source: string; created_at: string }>;
  };
  intelligence: {
    topics: number;
    news: number;
    sources: number;
    topicDetails: Array<{ id: string; name: string; status: string; schedule: string; last_run_at: string; created_at: string }>;
    recentNews: Array<{ id: string; title: string; source: string; created_at: string }>;
  };
  rag: {
    totalDocuments: number;
    uniqueTerms: number;
    useCases: string[];
  };
  connectors: Array<{ id: string; name: string; status: string; type: string }>;
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function timeAgo(dateStr: string) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ElementType }> = {
    configured: { color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle2 },
    available: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: CheckCircle2 },
    not_configured: { color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', icon: XCircle },
    active: { color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle2 },
    paused: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  };
  const c = config[status] || config.not_configured;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${c.color}`}>
      <Icon className="w-3 h-3" />
      {status.replace('_', ' ')}
    </span>
  );
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export default function KnowledgeBase() {
  const [stats, setStats] = useState<KBStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    crm: true,
    intelligence: true,
    rag: true,
    connectors: true,
    infra: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-base/stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading knowledge base...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-600 dark:text-red-400 font-medium">Failed to load knowledge base stats</p>
        <p className="text-sm text-red-500 dark:text-red-500 mt-1">{error}</p>
        <button onClick={fetchStats} className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const { overview, crm, intelligence, rag, connectors } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Knowledge Base
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Layer 4: Knowledge management across all use cases
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchStats(); }}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={Database} label="Total Items" value={overview.totalKnowledgeItems} color="purple" />
        <StatCard icon={Users} label="CRM Clients" value={crm.clients} color="blue" />
        <StatCard icon={MessageSquare} label="Feedback" value={crm.feedback} color="cyan" />
        <StatCard icon={Newspaper} label="News Articles" value={intelligence.news} color="teal" />
        <StatCard icon={Brain} label="RAG Documents" value={overview.ragDocuments} color="purple" />
        <StatCard icon={HardDrive} label="Vector Docs" value={overview.vectorDocuments} color="indigo" />
      </div>

      {/* Infrastructure Status */}
      <CollapsibleSection
        title="Infrastructure"
        icon={Layers}
        expanded={expandedSections.infra}
        onToggle={() => toggleSection('infra')}
        badge={overview.vectorStoreAvailable ? 'pgvector active' : 'in-memory'}
        badgeColor={overview.vectorStoreAvailable ? 'green' : 'amber'}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Vector Store</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Engine</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {overview.vectorStoreAvailable ? 'PostgreSQL + pgvector' : 'In-memory (dev)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dimensions</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">384</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Index Type</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">IVFFlat (cosine)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Documents</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{overview.vectorDocuments}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Embedding Service</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Provider</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{overview.embeddingProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chunk Size</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">500 words</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overlap</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">50 words</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Semantic Search</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Algorithm</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Cosine Similarity</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Re-ranking</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Context-aware</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Multi-query</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Supported</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Data Connectors */}
      <CollapsibleSection
        title="Data Connectors"
        icon={Globe}
        expanded={expandedSections.connectors}
        onToggle={() => toggleSection('connectors')}
        badge={`${connectors.filter(c => c.status === 'configured' || c.status === 'available').length}/${connectors.length} active`}
        badgeColor="blue"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {connectors.map(conn => {
            const iconMap: Record<string, React.ElementType> = {
              notion: FileText,
              web: Globe,
              pdf: FileText,
              email: Mail,
              dropbox: HardDrive,
            };
            const Icon = iconMap[conn.id] || Database;
            return (
              <div key={conn.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-600 shadow-sm">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{conn.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{conn.type}</div>
                  </div>
                </div>
                <StatusBadge status={conn.status} />
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* CRM Knowledge */}
      <CollapsibleSection
        title="CRM Knowledge"
        icon={Users}
        expanded={expandedSections.crm}
        onToggle={() => toggleSection('crm')}
        badge={`${crm.clients} clients`}
        badgeColor="blue"
      >
        <div className="space-y-4">
          {/* CRM Summary */}
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Clients" value={crm.clients} icon={Users} />
            <MiniStat label="Projects" value={crm.projects} icon={Layers} />
            <MiniStat label="Feedback" value={crm.feedback} icon={MessageSquare} />
          </div>

          {/* Recent Clients */}
          {crm.recentClients.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Clients</div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Name</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crm.recentClients.map(client => (
                      <tr key={client.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium">{client.name}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            client.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500">{timeAgo(client.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Feedback */}
          {crm.recentFeedback.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Feedback</div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Sentiment</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Topics</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Source</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crm.recentFeedback.map(fb => (
                      <tr key={fb.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            fb.sentiment === 'positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : fb.sentiment === 'negative' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                          }`}>
                            {fb.sentiment || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                          {Array.isArray(fb.topics) ? fb.topics.slice(0, 3).join(', ') : '-'}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{fb.source}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{timeAgo(fb.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Topic Intelligence */}
      <CollapsibleSection
        title="Topic Intelligence"
        icon={Newspaper}
        expanded={expandedSections.intelligence}
        onToggle={() => toggleSection('intelligence')}
        badge={`${intelligence.topics} topics`}
        badgeColor="teal"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Topics" value={intelligence.topics} icon={Newspaper} />
            <MiniStat label="Articles" value={intelligence.news} icon={FileText} />
            <MiniStat label="Sources" value={intelligence.sources} icon={Globe} />
          </div>

          {/* Topic Details */}
          {intelligence.topicDetails.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Monitored Topics</div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Topic</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Schedule</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Last Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelligence.topicDetails.map(topic => (
                      <tr key={topic.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium">{topic.name}</td>
                        <td className="px-4 py-2"><StatusBadge status={topic.status} /></td>
                        <td className="px-4 py-2 text-slate-500 font-mono text-[10px]">{topic.schedule || '-'}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{timeAgo(topic.last_run_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent News */}
          {intelligence.recentNews.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Articles</div>
              <div className="space-y-2">
                {intelligence.recentNews.map(news => (
                  <div key={news.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{news.title}</div>
                      <div className="text-[10px] text-slate-500">{news.source}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-3">{timeAgo(news.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* RAG Service */}
      <CollapsibleSection
        title="RAG Service"
        icon={Brain}
        expanded={expandedSections.rag}
        onToggle={() => toggleSection('rag')}
        badge={`${rag.totalDocuments} docs`}
        badgeColor="purple"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Documents" value={rag.totalDocuments} icon={FileText} />
            <MiniStat label="Indexed Terms" value={rag.uniqueTerms} icon={Search} />
            <MiniStat label="Use Cases" value={rag.useCases.length} icon={Layers} />
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">How RAG Works</div>
            <div className="space-y-2">
              {[
                { step: '1', text: 'Documents indexed at startup (orchestration patterns, best practices, business frameworks)' },
                { step: '2', text: 'User query triggers TF-IDF search across the knowledge base' },
                { step: '3', text: 'Top-K relevant documents retrieved and injected into LLM system prompt' },
                { step: '4', text: 'LLM generates grounded responses with reduced hallucination' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {item.step}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {rag.useCases.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Use Cases</div>
              <div className="flex flex-wrap gap-2">
                {rag.useCases.map(uc => (
                  <span key={uc} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400 pt-2">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400" />
      <div>
        <div className="text-lg font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</div>
        <div className="text-[10px] text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, expanded, onToggle, badge, badgeColor, children }: {
  title: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  const badgeColors: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    teal: 'bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeColors[badgeColor || 'blue']}`}>
              {badge}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
