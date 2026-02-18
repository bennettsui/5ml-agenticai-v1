'use client';

import { Users, AlertCircle, MessageCircle, Heart, Flag, TrendingUp, Clock } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const QUEUES = [
  { label: 'Unread Messages', count: 0, icon: MessageCircle, color: 'text-blue-400', urgent: false },
  { label: 'Requires Response', count: 0, icon: Clock, color: 'text-amber-400', urgent: true },
  { label: 'Flagged', count: 0, icon: Flag, color: 'text-red-400', urgent: true },
  { label: 'Positive Mentions', count: 0, icon: Heart, color: 'text-pink-400', urgent: false },
];

const METRICS = [
  { label: 'Response Rate', value: '--', target: '> 90%', trend: 'neutral' },
  { label: 'Avg Response Time', value: '--', target: '< 2 hrs', trend: 'neutral' },
  { label: 'Sentiment Score', value: '--', target: '> 7.5/10', trend: 'neutral' },
  { label: 'Community Growth', value: '--', target: '> 5% MoM', trend: 'neutral' },
];

export default function CommunityManagementPage() {
  const { selectedBrand } = useBrandProject();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-orange-400" />
          <h1 className="text-2xl font-bold text-white">Community Management</h1>
        </div>
        <p className="text-sm text-slate-400">
          Daily community engagement, response management, and sentiment tracking
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to manage community interactions.</p>
        </div>
      )}

      {/* Engagement Queues */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Engagement Queues</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUEUES.map(q => {
            const Icon = q.icon;
            return (
              <div key={q.label} className={`bg-slate-800/60 border rounded-xl p-4 ${
                q.urgent && q.count > 0 ? 'border-amber-700/30' : 'border-slate-700/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${q.color}`} />
                  {q.urgent && q.count > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{q.count}</p>
                <p className="text-xs text-slate-500 mt-0.5">{q.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map(m => (
            <div key={m.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{m.label}</p>
              <p className="text-lg font-bold text-white">{m.value}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Target: <span className="text-slate-400">{m.target}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Recent Activity</h2>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <TrendingUp className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Community activity will appear here</p>
              <p className="text-[10px] text-slate-600 mt-1">Connect social accounts to start monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
