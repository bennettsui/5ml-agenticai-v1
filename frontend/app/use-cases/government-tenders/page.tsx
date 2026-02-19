'use client';

import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle, Target } from 'lucide-react';
import Link from 'next/link';

export default function GovernmentTendersOverview() {
  // Mock data for dashboard
  const stats = [
    { label: 'Active Tenders', value: '24', icon: Target, color: 'indigo' },
    { label: 'Bid Pipeline', value: '8', icon: TrendingUp, color: 'blue' },
    { label: 'Closing Soon', value: '3', icon: Clock, color: 'amber' },
    { label: 'Won Bids', value: '12', icon: CheckCircle2, color: 'emerald' },
  ];

  const recentTenders = [
    {
      id: 1,
      title: 'IT Infrastructure Tender - 2024',
      authority: 'Immigration Department',
      deadline: '2024-02-28',
      budget: 'HKD 2,500,000',
      status: 'drafting',
    },
    {
      id: 2,
      title: 'Facility Management Services',
      authority: 'Water Authority',
      deadline: '2024-03-05',
      budget: 'HKD 1,200,000',
      status: 'submitted',
    },
    {
      id: 3,
      title: 'Legal Consultancy Services',
      authority: 'Public Housing Authority',
      deadline: '2024-02-25',
      budget: 'HKD 800,000',
      status: 'interested',
    },
  ];

  const statusBadge = {
    interested: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    drafting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    submitted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    won: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Government Tender Dashboard</h1>
        <p className="text-slate-400">Track tenders, manage bids, and analyze procurement opportunities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          const colorMap = {
            indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
            blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
            amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
            emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          };
          return (
            <div key={stat.label} className={`p-4 rounded-lg border ${colorMap[stat.color as keyof typeof colorMap] || ''}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tenders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Tenders</h2>
            <Link
              href="/use-cases/government-tenders/monitoring"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTenders.map(tender => (
              <div
                key={tender.id}
                className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">{tender.title}</h3>
                    <p className="text-xs text-slate-400">{tender.authority}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-medium border ${statusBadge[tender.status as keyof typeof statusBadge] || ''}`}>
                    {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-700/30">
                  <div className="flex gap-4">
                    <span>Closes: {tender.deadline}</span>
                    <span>Budget: {tender.budget}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/use-cases/government-tenders/monitoring"
              className="flex items-center gap-3 w-full p-4 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.05] transition-all text-left"
            >
              <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Search Tenders</div>
                <p className="text-xs text-slate-500">Find relevant opportunities</p>
              </div>
            </Link>

            <Link
              href="/use-cases/government-tenders/bid-management"
              className="flex items-center gap-3 w-full p-4 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.05] transition-all text-left"
            >
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Start New Bid</div>
                <p className="text-xs text-slate-500">Create proposal document</p>
              </div>
            </Link>

            <Link
              href="/use-cases/government-tenders/resources"
              className="flex items-center gap-3 w-full p-4 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.05] transition-all text-left"
            >
              <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Resources</div>
                <p className="text-xs text-slate-500">Templates & documents</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/60">
        <h2 className="text-lg font-bold text-white mb-4">Bid Pipeline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {['Interested', 'Drafting', 'Review', 'Submitted', 'Won'].map((stage, idx) => (
            <div key={stage} className="p-3 rounded-lg bg-white/[0.02] border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{Math.floor(Math.random() * 8) + 1}</div>
              <p className="text-xs text-slate-400">{stage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="p-6 rounded-lg border border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-400 mb-1">Beta Launch</h3>
            <p className="text-sm text-amber-400/80">
              This module is under development. Real tender data, scraping, and advanced features coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing imports at the top if needed
import { Search, FileText, Activity } from 'lucide-react';
