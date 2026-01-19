'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Beaker, Sparkles } from 'lucide-react';
import AgentTesting from '@/components/AgentTesting';

type Tab = 'agents' | 'sandbox';

export default function SocialAgentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('agents');

  const tabs = [
    { id: 'agents' as Tab, label: 'Agent Testing', icon: Sparkles },
    { id: 'sandbox' as Tab, label: 'Sandbox', icon: Beaker },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Social Media & SEO Agents
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  AI-powered content strategy, SEO optimization, and market research
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                ● Agents Active
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
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
        {activeTab === 'agents' && <AgentTesting />}
        {activeTab === 'sandbox' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <div className="text-center py-12">
              <Beaker className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Sandbox Environment
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Experimental features and testing environment. Coming soon.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
