'use client';

import Link from 'next/link';
import { ArrowLeft, GitBranch } from 'lucide-react';
import AgenticWorkflows from '@/components/AgenticWorkflows';

export default function AgenticWorkflowsPage() {
  return (
    <div className="min-h-screen bg-[#1a1b2e] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#1a1b2e]/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                Agentic Team Workflows
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Visual workflow editor view — agent relationships and orchestration patterns
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-0 py-0">
        <AgenticWorkflows />
      </main>
    </div>
  );
}
