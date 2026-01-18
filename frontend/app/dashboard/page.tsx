'use client';

import { useState } from 'react';
import ArchitectureViz from '@/components/ArchitectureViz';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AgentTesting from '@/components/AgentTesting';
import ProjectManagement from '@/components/ProjectManagement';
import PlatformOverview from '@/components/PlatformOverview';
import { LayoutDashboard, Layers, Activity, FlaskConical, FolderKanban, Home } from 'lucide-react';
import Link from 'next/link';

type Tab = 'overview' | 'architecture' | 'analytics' | 'agents' | 'projects';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'architecture' as Tab, label: 'Architecture', icon: Layers },
    { id: 'analytics' as Tab, label: 'Analytics', icon: Activity },
    { id: 'agents' as Tab, label: 'Agent Testing', icon: FlaskConical },
    { id: 'projects' as Tab, label: 'Projects', icon: FolderKanban },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Platform Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Multi-layer AI orchestration with specialized agents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                ● System Online
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    }
                  `}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <PlatformOverview />}
        {activeTab === 'architecture' && <ArchitectureViz />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'agents' && <AgentTesting />}
        {activeTab === 'projects' && <ProjectManagement />}
      </main>
    </div>
  );
}
