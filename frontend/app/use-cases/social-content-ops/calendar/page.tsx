'use client';

import { useState } from 'react';
import {
  Calendar, AlertCircle, Plus, ChevronLeft, ChevronRight,
  LayoutGrid, Table, Loader2, Sparkles, Filter,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

interface CalendarPost {
  id: string;
  date: string;
  day: string;
  platform: 'IG' | 'FB' | 'Both';
  format: 'Static' | 'Carousel' | 'Reel';
  pillar: string;
  campaign: string;
  title: string;
  objective: string;
  keyMessage: string;
  visualType: string;
  nanoBriefId: string;
  captionStatus: 'Draft' | 'Approved' | 'Needs client input';
  visualStatus: 'Draft' | 'Approved' | 'Client to provide';
  boostPlan: 'Organic only' | 'Boost candidate' | 'Ad version';
  link: string;
  notes: string;
}

/* ── Sample data ────────────────────────── */

const SAMPLE_POSTS: CalendarPost[] = [
  {
    id: '2026-03-03-IG-Reel-Educate',
    date: '2026-03-03', day: 'Mon', platform: 'IG', format: 'Reel', pillar: 'Educate',
    campaign: 'Mar – Spring Launch', title: 'Why AI Agents Save 10x Time',
    objective: 'Awareness', keyMessage: 'AI agents automate repetitive social tasks',
    visualType: 'Product + lifestyle', nanoBriefId: '2026-03-03-IG-Reel-Educate-VIS',
    captionStatus: 'Draft', visualStatus: 'Draft', boostPlan: 'Boost candidate',
    link: 'TBC', notes: '',
  },
  {
    id: '2026-03-05-FB-Static-Promo',
    date: '2026-03-05', day: 'Wed', platform: 'FB', format: 'Static', pillar: 'Conversion',
    campaign: 'Mar – Spring Launch', title: 'March Offer – Free Audit',
    objective: 'Lead', keyMessage: 'Free social audit for new clients this month',
    visualType: 'Graphic', nanoBriefId: '2026-03-05-FB-Static-Promo-VIS',
    captionStatus: 'Needs client input', visualStatus: 'Client to provide', boostPlan: 'Ad version',
    link: 'TBC', notes: 'Client to share offer details',
  },
  {
    id: '2026-03-10-Both-Carousel-Auth',
    date: '2026-03-10', day: 'Mon', platform: 'Both', format: 'Carousel', pillar: 'Authority',
    campaign: 'Mar – Spring Launch', title: 'Case Study: 3x ROAS in 30 Days',
    objective: 'Engagement', keyMessage: 'Real results from our agentic social approach',
    visualType: 'Photo + data graphics', nanoBriefId: '2026-03-10-Both-Carousel-Auth-VIS',
    captionStatus: 'Draft', visualStatus: 'Draft', boostPlan: 'Boost candidate',
    link: 'TBC', notes: '',
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PILLARS = ['Educate', 'Showcase', 'Authority', 'Conversion', 'Community'];

const PILLAR_COLORS: Record<string, string> = {
  Educate: 'bg-blue-500/20 text-blue-400',
  Showcase: 'bg-emerald-500/20 text-emerald-400',
  Authority: 'bg-purple-500/20 text-purple-400',
  Conversion: 'bg-amber-500/20 text-amber-400',
  Community: 'bg-pink-500/20 text-pink-400',
};

const PLATFORM_COLORS: Record<string, string> = {
  IG: 'text-pink-400',
  FB: 'text-blue-400',
  Both: 'text-purple-400',
};

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-700/50 text-slate-400',
  Approved: 'bg-emerald-500/20 text-emerald-400',
  'Needs client input': 'bg-amber-500/20 text-amber-400',
  'Client to provide': 'bg-amber-500/20 text-amber-400',
};

type ViewMode = 'grid' | 'table';

/* ── Component ──────────────────────────── */

export default function ContentCalendarPage() {
  const { selectedBrand } = useBrandProject();
  const [view, setView] = useState<ViewMode>('grid');
  const [posts] = useState<CalendarPost[]>(SAMPLE_POSTS);
  const [month] = useState('March 2026');
  const [generating, setGenerating] = useState(false);
  const [filterPillar, setFilterPillar] = useState<string | null>(null);

  const filteredPosts = filterPillar ? posts.filter(p => p.pillar === filterPillar) : posts;

  // Build weekly grid data — group posts by week/day
  function getPostsForDay(dayNum: number): CalendarPost[] {
    const dateStr = `2026-03-${String(dayNum).padStart(2, '0')}`;
    return filteredPosts.filter(p => p.date === dateStr);
  }

  const weeks = Array.from({ length: 5 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = w * 7 + d + 1;
      return day <= 31 ? day : null;
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
          </div>
          <p className="text-sm text-slate-400">
            Monthly content planning — weekly grid overview + master calendar table
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg text-xs transition-colors ${view === 'grid' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Weekly Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded-lg text-xs transition-colors ${view === 'table' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Master Table"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to manage content calendar.</p>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-white min-w-[120px] text-center">{month}</h2>
          <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Pillar filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <button
              onClick={() => setFilterPillar(null)}
              className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${!filterPillar ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              All
            </button>
            {PILLARS.map(p => (
              <button
                key={p}
                onClick={() => setFilterPillar(filterPillar === p ? null : p)}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${filterPillar === p ? PILLAR_COLORS[p] : 'text-slate-500 hover:text-slate-300'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            disabled={!selectedBrand || generating}
            onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 3000); }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Generate Month
          </button>
          <button className="px-3 py-1.5 text-xs rounded-lg border border-emerald-700/30 bg-emerald-500/10 text-emerald-400 hover:opacity-80 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Post
          </button>
        </div>
      </div>

      {/* ── VIEW: Weekly Grid ──────────────── */}
      {view === 'grid' && (
        <div className="border border-slate-700/50 rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-slate-800/60">
            {DAYS.map(d => (
              <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase text-slate-500 border-b border-slate-700/50">
                {d}
              </div>
            ))}
          </div>
          {/* Week rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                return (
                  <div
                    key={di}
                    className={`min-h-[90px] p-1.5 border-b border-r border-slate-700/30 ${
                      day ? 'hover:bg-white/[0.02] cursor-pointer' : 'bg-slate-900/30'
                    } transition-colors`}
                  >
                    {day && (
                      <>
                        <span className="text-[10px] text-slate-500 block mb-0.5">{day}</span>
                        {dayPosts.map(post => (
                          <div
                            key={post.id}
                            className={`text-[9px] leading-tight px-1 py-0.5 rounded mb-0.5 truncate ${PILLAR_COLORS[post.pillar] || 'bg-slate-700/50 text-slate-400'}`}
                            title={`${post.platform} – ${post.format} – ${post.pillar} – ${post.title}`}
                          >
                            <span className={PLATFORM_COLORS[post.platform]}>{post.platform}</span>
                            {' – '}{post.format}{' – '}{post.title}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── VIEW: Master Calendar Table ──── */}
      {view === 'table' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                {['Date', 'Day', 'Platform', 'Format', 'Pillar', 'Campaign', 'Post Title', 'Objective', 'Key Message', 'Visual Type', 'Brief ID', 'Caption', 'Visual', 'Boost/Ad', 'Notes'].map(col => (
                  <th key={col} className="px-3 py-2.5 text-[10px] font-semibold uppercase text-slate-500 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-xs text-slate-500">
                    No posts yet. Use &quot;AI Generate Month&quot; or add posts manually.
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => (
                  <tr key={post.id} className="border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5 text-xs text-white font-mono whitespace-nowrap">{post.date}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{post.day}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium ${PLATFORM_COLORS[post.platform]}`}>{post.platform}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-300">{post.format}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PILLAR_COLORS[post.pillar]}`}>{post.pillar}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[120px] truncate">{post.campaign}</td>
                    <td className="px-3 py-2.5 text-xs text-white font-medium max-w-[160px] truncate">{post.title}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{post.objective}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[180px] truncate">{post.keyMessage}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{post.visualType}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500 font-mono max-w-[120px] truncate">{post.nanoBriefId}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[post.captionStatus]}`}>{post.captionStatus}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[post.visualStatus]}`}>{post.visualStatus}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{post.boostPlan}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[120px] truncate">{post.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <span>Pillars:</span>
        {PILLARS.map(p => (
          <span key={p} className={`px-1.5 py-0.5 rounded ${PILLAR_COLORS[p]}`}>{p}</span>
        ))}
      </div>
    </div>
  );
}
