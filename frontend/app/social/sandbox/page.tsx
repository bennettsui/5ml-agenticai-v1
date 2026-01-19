'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Beaker, Sparkles, DollarSign } from 'lucide-react';
import ModelSandbox from '@/components/ModelSandbox';
import PricingTable from '@/components/PricingTable';

type SubTab = 'testing' | 'pricing';

export default function SandboxPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('testing');

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
            <Link
              href="/social"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <Sparkles size={18} />
              Agents
            </Link>
            <Link
              href="/social/sandbox"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium text-sm"
            >
              <Beaker size={18} />
              Sandbox
            </Link>
          </div>
        </div>
      </nav>

      {/* Sub-tabs */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveSubTab('testing')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeSubTab === 'testing'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Beaker size={16} />
              Model Testing
            </button>
            <button
              onClick={() => setActiveSubTab('pricing')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeSubTab === 'pricing'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign size={16} />
              Pricing Reference
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSubTab === 'testing' && <ModelSandbox />}
        {activeSubTab === 'pricing' && <PricingTable />}
      </main>
    </div>
  );
}
