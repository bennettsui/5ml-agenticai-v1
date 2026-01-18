'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import AgentTesting from '@/components/AgentTesting';

export default function SocialAgentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Social Media & SEO Agents
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  AI-powered content strategy, SEO optimization, and market research
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                ● Agents Active
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AgentTesting />
      </main>
    </div>
  );
}
