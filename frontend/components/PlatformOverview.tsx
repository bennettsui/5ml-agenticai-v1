'use client';

import { useEffect, useState } from 'react';
import { Bot, Zap, Database, Layers, CheckCircle2, TrendingUp, Table2, Newspaper, Users, FileSpreadsheet, Camera, BarChart3, Megaphone, Briefcase } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  category?: string;
}

interface LayerDetail {
  id: string;
  name: string;
  status: string;
  description?: string;
}

interface DatabaseTable {
  name: string;
  description: string;
  category: string;
}

interface UseCase {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  status: string;
}

interface PlatformStats {
  agents: Agent[];
  models: Array<{ id: string; name: string; type: string; status: string }>;
  layers: {
    total: number;
    active: number;
    planned: number;
    completion: number;
    details?: LayerDetail[];
  };
  useCases?: UseCase[];
  database?: {
    projects?: number;
    analyses?: number;
    topics?: number;
    sources?: number;
    status: string;
  };
  databaseTables?: DatabaseTable[];
}

const categoryIcons: Record<string, React.ElementType> = {
  marketing: Megaphone,
  ads: BarChart3,
  photobooth: Camera,
  intelligence: Newspaper,
  accounting: FileSpreadsheet,
  social: Users,
};

const categoryColors: Record<string, string> = {
  marketing: 'purple',
  ads: 'blue',
  photobooth: 'pink',
  intelligence: 'teal',
  accounting: 'orange',
  social: 'purple',
};

const categoryLabels: Record<string, string> = {
  marketing: 'Marketing Strategy',
  ads: 'Ads Performance',
  photobooth: 'Photo Booth',
  intelligence: 'Topic Intelligence',
  accounting: 'Receipt Tracking',
  social: 'Social & SEO',
};

export default function PlatformOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Group agents by category
  const agentsByCategory = stats?.agents.reduce((acc, agent) => {
    const category = agent.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>) || {};

  // Group database tables by category
  const tablesByCategory = stats?.databaseTables?.reduce((acc, table) => {
    const category = table.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(table);
    return acc;
  }, {} as Record<string, DatabaseTable[]>) || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <Bot size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.agents.length || 30}</div>
          <div className="text-sm opacity-90">Specialized Agents</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <Briefcase size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.useCases?.length || 5}</div>
          <div className="text-sm opacity-90">Use Cases</div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <Zap size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.models.length || 6}</div>
          <div className="text-sm opacity-90">AI Models</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <Layers size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.layers.active || 7}/{stats?.layers.total || 7}</div>
          <div className="text-sm opacity-90">Architecture Layers</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <Database size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.databaseTables?.length || 11}</div>
          <div className="text-sm opacity-90">Database Tables</div>
        </div>
      </div>

      {/* Use Cases Overview */}
      {stats?.useCases && stats.useCases.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Production Use Cases</h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
              {stats.useCases.length} Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.useCases.map((useCase) => {
              const Icon = categoryIcons[useCase.id] || Briefcase;
              const color = categoryColors[useCase.id] || 'slate';
              return (
                <div
                  key={useCase.id}
                  className={`p-4 rounded-lg border-2 border-${color}-200 dark:border-${color}-800 bg-${color}-50 dark:bg-${color}-900/20 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={20} className={`text-${color}-600 dark:text-${color}-400`} />
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{useCase.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{useCase.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{useCase.agentCount} agents</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300`}>
                      {useCase.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agents by Category */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agents by Use Case</h2>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
            {stats?.agents.length || 8} Active
          </span>
        </div>

        <div className="space-y-6">
          {Object.entries(agentsByCategory).map(([category, agents]) => {
            const Icon = categoryIcons[category] || Bot;
            const color = categoryColors[category] || 'slate';
            const label = categoryLabels[category] || category;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={18} className={`text-${color}-600 dark:text-${color}-400`} />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">{label}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({agents.length} agents)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h4>
                        <CheckCircle2 size={18} className="text-green-500" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{agent.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Models Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Models</h2>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
            Multi-Provider
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats?.models.map((model) => (
            <div
              key={model.id}
              className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{model.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  model.type === 'primary' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  model.type === 'fallback' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                  model.type === 'advanced' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                  model.type === 'flagship' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' :
                  model.type === 'research' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300' :
                  model.type === 'image-gen' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                }`}>
                  {model.type}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">Status: {model.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Layers */}
      {stats?.layers.details && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">7-Layer Agentic Architecture</h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
              {stats.layers.completion}% Complete
            </span>
          </div>
          <div className="space-y-3">
            {stats.layers.details.map((layer) => (
              <div
                key={layer.id}
                className={`p-4 rounded-lg border-2 ${
                  layer.status === 'active'
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    : layer.status === 'partial'
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                      layer.status === 'active'
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : layer.status === 'partial'
                        ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}>
                      {layer.id}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">{layer.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    layer.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      : layer.status === 'partial'
                      ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                      : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}>
                    {layer.status}
                  </span>
                </div>
                {layer.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 ml-10">{layer.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Tables */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Database Schema</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            stats?.database?.status === 'connected'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            {stats?.database?.status === 'connected' ? '● Connected' : '○ Not Connected'}
          </span>
        </div>

        {/* Database Stats */}
        {stats?.database?.status === 'connected' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Projects</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.database.projects || 0}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Analyses</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.database.analyses || 0}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Topics</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.database.topics || 0}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Sources</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.database.sources || 0}</div>
            </div>
          </div>
        )}

        {/* Tables by Category */}
        <div className="space-y-4">
          {Object.entries(tablesByCategory).map(([category, tables]) => {
            const Icon = categoryIcons[category] || Table2;
            const label = categoryLabels[category] || category;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-slate-500 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {tables.map((table) => (
                    <div
                      key={table.name}
                      className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <Table2 size={14} className="text-blue-500" />
                        <span className="font-mono text-sm text-slate-900 dark:text-white">{table.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{table.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Completion Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Platform Completion</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {stats?.layers.active || 6} of {stats?.layers.total || 7} Layers Active
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {stats?.layers.completion || 86}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                style={{ width: `${stats?.layers.completion || 86}%` }}
              >
                <TrendingUp size={12} className="text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.layers.active || 6}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.layers.planned || 1}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Planned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.layers.total || 7}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
