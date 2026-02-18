'use client';

import { useState } from 'react';
import { Calendar, AlertCircle, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLATFORMS = [
  { name: 'Instagram', color: 'bg-pink-500/20 text-pink-400 border-pink-700/30' },
  { name: 'Facebook', color: 'bg-blue-500/20 text-blue-400 border-blue-700/30' },
  { name: 'LinkedIn', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-700/30' },
  { name: 'TikTok', color: 'bg-purple-500/20 text-purple-400 border-purple-700/30' },
  { name: 'X/Twitter', color: 'bg-slate-500/20 text-slate-300 border-slate-600/30' },
];

export default function ContentCalendarPage() {
  const { selectedBrand } = useBrandProject();
  const [month] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

  // Generate calendar grid (5 weeks)
  const weeks = Array.from({ length: 5 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = w * 7 + d + 1;
      return day <= 31 ? day : null;
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
        </div>
        <p className="text-sm text-slate-400">
          Plan, schedule, and manage content publishing across platforms — monthly cadence
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to manage content calendar.</p>
        </div>
      )}

      {/* Platform filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {PLATFORMS.map(p => (
          <button key={p.name} className={`px-3 py-1 text-xs rounded-full border ${p.color} hover:opacity-80 transition-opacity`}>
            {p.name}
          </button>
        ))}
        <button className="px-3 py-1 text-xs rounded-full border border-emerald-700/30 bg-emerald-500/20 text-emerald-400 hover:opacity-80 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Post
        </button>
      </div>

      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white">{month}</h2>
        <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="border border-slate-700/50 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-slate-800/60">
          {DAYS.map(d => (
            <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase text-slate-500 border-b border-slate-700/50">
              {d}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => (
              <div
                key={di}
                className={`min-h-[80px] p-1.5 border-b border-r border-slate-700/30 ${
                  day ? 'hover:bg-white/[0.02] cursor-pointer' : 'bg-slate-900/30'
                } transition-colors`}
              >
                {day && (
                  <>
                    <span className="text-xs text-slate-500">{day}</span>
                    {/* Placeholder slots */}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
