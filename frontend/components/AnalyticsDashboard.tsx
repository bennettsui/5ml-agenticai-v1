'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Zap, Activity } from 'lucide-react';

interface AnalyticsData {
  usageByDay: { date: string; requests: number; tokens: number }[];
  modelDistribution: { name: string; value: number; color: string }[];
  agentPerformance: { agent: string; requests: number; avgTime: number; successRate: number }[];
  costAnalysis: { model: string; cost: number; requests: number }[];
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    // Simulate loading analytics data
    // In production, this would fetch from the backend API
    setTimeout(() => {
      setData({
        usageByDay: [
          { date: '2026-01-12', requests: 45, tokens: 25000 },
          { date: '2026-01-13', requests: 62, tokens: 38000 },
          { date: '2026-01-14', requests: 58, tokens: 32000 },
          { date: '2026-01-15', requests: 73, tokens: 45000 },
          { date: '2026-01-16', requests: 81, tokens: 52000 },
          { date: '2026-01-17', requests: 95, tokens: 61000 },
          { date: '2026-01-18', requests: 102, tokens: 68000 },
        ],
        modelDistribution: [
          { name: 'DeepSeek', value: 65, color: '#3b82f6' },
          { name: 'Claude Haiku', value: 25, color: '#10b981' },
          { name: 'Perplexity', value: 8, color: '#f59e0b' },
          { name: 'Claude Sonnet', value: 2, color: '#8b5cf6' },
        ],
        agentPerformance: [
          { agent: 'Creative', requests: 156, avgTime: 2.3, successRate: 98.5 },
          { agent: 'SEO', requests: 143, avgTime: 3.1, successRate: 97.2 },
          { agent: 'Social', requests: 128, avgTime: 2.8, successRate: 99.1 },
          { agent: 'Research', requests: 89, avgTime: 4.5, successRate: 96.8 },
        ],
        costAnalysis: [
          { model: 'DeepSeek', cost: 12.50, requests: 338 },
          { model: 'Claude Haiku', cost: 8.30, requests: 130 },
          { model: 'Perplexity', cost: 6.20, requests: 41 },
          { model: 'Claude Sonnet', cost: 4.10, requests: 7 },
        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!data) return null;

  const totalRequests = data.usageByDay.reduce((sum, day) => sum + day.requests, 0);
  const totalTokens = data.usageByDay.reduce((sum, day) => sum + day.tokens, 0);
  const totalCost = data.costAnalysis.reduce((sum, model) => sum + model.cost, 0);
  const avgSuccessRate = data.agentPerformance.reduce((sum, agent) => sum + agent.successRate, 0) / data.agentPerformance.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Requests</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalRequests}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> +23% vs last week
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Tokens</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{(totalTokens / 1000).toFixed(0)}K</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> +18% vs last week
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${totalCost.toFixed(2)}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Efficient usage
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Success Rate</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{avgSuccessRate.toFixed(1)}%</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Excellent performance
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Activity className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Usage Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.usageByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name="Requests" />
              <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} name="Tokens (scaled)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Model Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Model Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.modelDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.modelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Agent Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.agentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="agent" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
              <Bar dataKey="avgTime" fill="#10b981" name="Avg Time (s)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Cost Analysis by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.costAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="model" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="cost" fill="#f59e0b" name="Cost ($)" />
              <Bar dataKey="requests" fill="#8b5cf6" name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Detailed Agent Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Agent</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">Requests</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">Avg Response Time</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">Success Rate</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.agentPerformance.map((agent) => (
                <tr key={agent.agent} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{agent.agent} Agent</td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{agent.requests}</td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{agent.avgTime}s</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${agent.successRate >= 98 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {agent.successRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                      Healthy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
