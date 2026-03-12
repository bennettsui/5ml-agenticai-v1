'use client';

import Link from 'next/link';
import { Printer, ArrowLeft } from 'lucide-react';
import PrintFinance from '@/components/PrintFinance';

export default function PrintFinancePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav bar */}
      <div className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/use-cases"
            className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/[0.05]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-slate-700/60" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Printer className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">3D Print Finance</span>
              <span className="ml-2 text-xs text-slate-500">Job costing · P&amp;L · Invoicing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <PrintFinance />
      </div>
    </div>
  );
}
