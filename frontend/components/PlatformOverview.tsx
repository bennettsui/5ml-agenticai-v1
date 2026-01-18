'use client';

import { useEffect, useState } from 'react';
import { Bot, Zap, Database, Layers, CheckCircle2, TrendingUp } from 'lucide-react';

interface PlatformStats {
  agents: Array<{ id: string; name: string; description: string; status: string }>;
  models: Array<{ id: string; name: string; type: string; status: string }>;
  layers: { total: number; active: number; planned: number; completion: number };
  database?: { projects?: number; analyses?: number; status: string };
}

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <Bot size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.agents.length || 4}</div>
          <div className="text-sm opacity-90">Specialized Agents</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <Zap size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.models.length || 4}</div>
          <div className="text-sm opacity-90">AI Models</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <Layers size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.layers.active || 5}/{stats?.layers.total || 7}</div>
          <div className="text-sm opacity-90">Architecture Layers</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <Database size={32} className="mb-3 opacity-90" />
          <div className="text-4xl font-bold mb-1">{stats?.database?.projects || 0}</div>
          <div className="text-sm opacity-90">Projects Analyzed</div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Available Agents</h2>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
            {stats?.agents.length || 4} Active
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats?.agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{agent.description}</p>
              <div className="mt-3">
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                  {agent.status}
                </span>
              </div>
            </div>
          ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Architecture Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Platform Completion</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {stats?.layers.active || 5} of {stats?.layers.total || 7} Layers Active
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {stats?.layers.completion || 71}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                style={{ width: `${stats?.layers.completion || 71}%` }}
              >
                <TrendingUp size={12} className="text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.layers.active || 5}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.layers.planned || 2}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Planned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.layers.total || 7}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status */}
      {stats?.database && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Database Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Projects</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.database.projects || 0}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Analyses</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.database.analyses || 0}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</div>
              <div className={`text-sm font-semibold ${
                stats.database.status === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {stats.database.status === 'connected' ? '● Connected' : '○ Disconnected'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
