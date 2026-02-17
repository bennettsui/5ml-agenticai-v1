'use client';

import { useState } from 'react';
import ArchitectureViz from '@/components/ArchitectureViz';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import PlatformOverview from '@/components/PlatformOverview';
import ApiHealthCheck from '@/components/ApiHealthCheck';
import ScheduledJobs from '@/components/ScheduledJobs';
import AgenticWorkflows from '@/components/AgenticWorkflows';
import KnowledgeBase from '@/components/KnowledgeBase';
import CostAnalysis from '@/components/CostAnalysis';
import {
  LayoutDashboard, Layers, Activity, Home, Wifi, Calendar, GitBranch,
  BookOpen, DollarSign, ArrowRight, ExternalLink, Users, Brain,
  CheckCircle2, Clock, Zap, Map, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  USE_CASES, SOLUTION_LINES, ROADMAP_ITEMS, STATUS_CONFIG,
  CSUITE_ROLES, type UseCaseConfig, type Status,
} from '@/lib/platform-config';

type Tab = 'control' | 'overview' | 'architecture' | 'analytics' | 'api' | 'scheduling' | 'knowledge' | 'costs' | 'workflows';

const statusBadge = (status: Status) => {
  const c = STATUS_CONFIG[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>{c.label}</span>;
};

const priorityColor: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-blue-400',
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('control');

  const tabs = [
    { id: 'control' as Tab, label: 'Control Tower', icon: LayoutDashboard },
    { id: 'overview' as Tab, label: 'Overview', icon: Activity },
    { id: 'architecture' as Tab, label: 'Architecture', icon: Layers },
    { id: 'analytics' as Tab, label: 'Analytics', icon: Activity },
    { id: 'api' as Tab, label: 'API', icon: Wifi },
    { id: 'scheduling' as Tab, label: 'Scheduling', icon: Calendar },
    { id: 'knowledge' as Tab, label: 'Knowledge Base', icon: BookOpen },
    { id: 'costs' as Tab, label: 'Cost Analysis', icon: DollarSign },
    { id: 'workflows' as Tab, label: 'Workflows', icon: GitBranch },
  ];

  // Derived stats
  const liveCount = USE_CASES.filter(u => u.status === 'live').length;
  const buildCount = USE_CASES.filter(u => u.status === 'in_progress').length;
  const plannedCount = USE_CASES.filter(u => u.status === 'planned' || u.status === 'prototype').length;
  const totalAgents = USE_CASES.reduce((s, u) => s + (u.agentCount || 0), 0);

  // Group by solution line
  const lineGroups = Object.entries(SOLUTION_LINES).map(([key, line]) => ({
    ...line,
    cases: USE_CASES.filter(u => u.solutionLine === key),
  }));

  // Roadmap buckets
  const nowItems = ROADMAP_ITEMS.filter(r => r.timeframe === 'now').slice(0, 5);
  const nextItems = ROADMAP_ITEMS.filter(r => r.timeframe === 'next').slice(0, 5);
  const laterItems = ROADMAP_ITEMS.filter(r => r.timeframe === 'later').slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-500 hover:text-white transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">
                  5ML Agentic Control Tower
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal control tower — {totalAgents}+ agents · {USE_CASES.length} use cases · IAD region
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">
                ● System Online
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-slate-900/60 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={activeTab === 'workflows' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        {/* ================================================================ */}
        {/* CONTROL TOWER TAB                                               */}
        {/* ================================================================ */}
        {activeTab === 'control' && (
          <div className="space-y-6">
            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-center">
                <div className="text-2xl font-bold text-white">{USE_CASES.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Total Use Cases</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{liveCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Live</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{buildCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">In Build</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{plannedCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Planned</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{totalAgents}+</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Active Agents</div>
              </div>
            </div>

            {/* Product / Use Case Matrix */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Product / Use Case Matrix</h2>
                <span className="text-[10px] text-slate-500">{USE_CASES.length} entries across {Object.keys(SOLUTION_LINES).length} solution lines</span>
              </div>

              {lineGroups.map((group) => {
                if (group.cases.length === 0) return null;
                return (
                  <div key={group.id}>
                    <div className={`px-5 py-2.5 bg-white/[0.02] border-b border-slate-700/30`}>
                      <span className={`text-xs font-semibold ${group.textColor}`}>{group.name}</span>
                      <span className="text-[10px] text-slate-600 ml-2">{group.cases.length} use cases</span>
                    </div>
                    <div className="divide-y divide-slate-700/30">
                      {group.cases.map((uc) => (
                        <div key={uc.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white font-medium">{uc.name}</span>
                            <span className="text-[10px] text-slate-600 ml-2 hidden sm:inline">{uc.description?.slice(0, 60)}...</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {statusBadge(uc.status)}
                            {/* Progress bar */}
                            <div className="w-20 h-1.5 rounded-full bg-slate-700/50 overflow-hidden hidden sm:block">
                              <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${uc.progress * 100}%` }} />
                            </div>
                            <span className={`text-[10px] ${priorityColor[uc.priority]} hidden md:block`}>{uc.priority}</span>
                            {uc.path !== '#' ? (
                              <Link href={uc.path} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                                Open <ChevronRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-[10px] text-slate-600 w-10">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* C-Suite Assist Panel */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">C-Suite Assist Panel</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {CSUITE_ROLES.map((role) => (
                  <div key={role.id} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-white">{role.shortTitle}</span>
                      {statusBadge(role.status)}
                    </div>
                    <div className="text-xs text-purple-400 font-medium mb-1">{role.agentFamily}</div>
                    <p className="text-[10px] text-slate-500 mb-3 line-clamp-2">{role.description}</p>
                    {/* Progress */}
                    <div className="h-1 rounded-full bg-slate-700/50 overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-purple-500/60" style={{ width: `${role.progress * 100}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.focus.map((f, i) => (
                        <span key={i} className="text-[9px] px-1 py-0.5 bg-white/[0.03] rounded text-slate-600">{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap Preview */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Roadmap Preview</h2>
                </div>
                <Link href="/dashboard/roadmap" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Open Full Roadmap <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { items: nowItems, label: 'Now', sub: '0-3mo', color: 'border-l-green-500', badge: 'bg-green-500/10 text-green-400' },
                  { items: nextItems, label: 'Next', sub: '3-9mo', color: 'border-l-amber-500', badge: 'bg-amber-500/10 text-amber-400' },
                  { items: laterItems, label: 'Later', sub: '9-18mo', color: 'border-l-blue-500', badge: 'bg-blue-500/10 text-blue-400' },
                ].map((bucket) => (
                  <div key={bucket.label} className={`border-l-4 ${bucket.color} pl-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${bucket.badge} font-medium`}>{bucket.label}</span>
                      <span className="text-[10px] text-slate-600">{bucket.sub}</span>
                    </div>
                    <div className="space-y-2">
                      {bucket.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-1.5">
                          <Zap className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-600" />
                          <div>
                            <div className="text-xs text-white font-medium">{item.name}</div>
                            <div className="text-[10px] text-slate-600">{SOLUTION_LINES[item.solutionLine]?.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Existing tabs */}
        {activeTab === 'overview' && <PlatformOverview />}
        {activeTab === 'architecture' && <ArchitectureViz />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'api' && <ApiHealthCheck />}
        {activeTab === 'scheduling' && <ScheduledJobs />}
        {activeTab === 'knowledge' && <KnowledgeBase />}
        {activeTab === 'costs' && <CostAnalysis />}
        {activeTab === 'workflows' && (
          <div className="bg-[#1a1b2e]">
            <AgenticWorkflows />
          </div>
        )}
      </main>
    </div>
  );
}
