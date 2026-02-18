'use client';

import { useState, useCallback } from 'react';
import {
  Calendar, AlertCircle, Plus, ChevronLeft, ChevronRight,
  LayoutGrid, Table, Loader2, Sparkles, Filter, X,
  Edit3, Trash2, Save, Image, Video, FileText,
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
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const FORMAT_ICONS: Record<string, typeof Image> = { Reel: Video, Static: Image, Carousel: FileText };

type ViewMode = 'grid' | 'table';

/* ── New Post Form defaults ──────────────── */

function emptyPost(): CalendarPost {
  return {
    id: '', date: '', day: '', platform: 'IG', format: 'Static', pillar: 'Educate',
    campaign: '', title: '', objective: '', keyMessage: '', visualType: '',
    nanoBriefId: '', captionStatus: 'Draft', visualStatus: 'Draft',
    boostPlan: 'Organic only', link: '', notes: '',
  };
}

function getDayFromDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return DAYS[((d.getDay() + 6) % 7)]; // Mon=0 ... Sun=6
  } catch { return ''; }
}

/* ── Component ──────────────────────────── */

export default function ContentCalendarPage() {
  const { selectedBrand } = useBrandProject();
  const [view, setView] = useState<ViewMode>('grid');
  const [posts, setPosts] = useState<CalendarPost[]>(SAMPLE_POSTS);
  const [month] = useState('March 2026');
  const [generating, setGenerating] = useState(false);
  const [filterPillar, setFilterPillar] = useState<string | null>(null);

  // Add / Edit post modal
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [formData, setFormData] = useState<CalendarPost>(emptyPost());

  const filteredPosts = filterPillar ? posts.filter(p => p.pillar === filterPillar) : posts;

  // Build weekly grid data
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

  /* ── AI Generate Month ───────────────── */
  const handleAiGenerate = useCallback(async () => {
    if (!selectedBrand) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a full March 2026 content calendar for "${selectedBrand.name}".

Create 12-16 posts spread across the month with a mix of:
- Platforms: IG, FB, Both
- Formats: Reel, Static, Carousel
- Pillars: Educate (30%), Authority (20%), Showcase (20%), Conversion (15%), Community (15%)

For each post, provide these exact fields as a JSON array:
[{
  "date": "2026-03-XX",
  "platform": "IG|FB|Both",
  "format": "Reel|Static|Carousel",
  "pillar": "Educate|Authority|Showcase|Conversion|Community",
  "campaign": "Mar – Spring Launch",
  "title": "Short post title",
  "objective": "Awareness|Engagement|Lead|Traffic|Conversion",
  "keyMessage": "Core message in one sentence",
  "visualType": "Product + lifestyle|Graphic|Photo + data graphics|UGC|Behind the scenes",
  "boostPlan": "Organic only|Boost candidate|Ad version",
  "notes": ""
}]

IMPORTANT: Return ONLY the JSON array, no other text.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message || '';
        // Try to parse JSON from the response
        try {
          const jsonMatch = msg.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Partial<CalendarPost>[];
            const newPosts: CalendarPost[] = parsed.map((p, i) => {
              const date = p.date || `2026-03-${String(i + 1).padStart(2, '0')}`;
              const day = getDayFromDate(date);
              const id = `${date}-${p.platform || 'IG'}-${p.format || 'Static'}-${p.pillar || 'Educate'}`;
              return {
                id,
                date,
                day,
                platform: (p.platform as CalendarPost['platform']) || 'IG',
                format: (p.format as CalendarPost['format']) || 'Static',
                pillar: p.pillar || 'Educate',
                campaign: p.campaign || 'Mar – Spring Launch',
                title: p.title || `Post ${i + 1}`,
                objective: p.objective || 'Awareness',
                keyMessage: p.keyMessage || '',
                visualType: p.visualType || '',
                nanoBriefId: `${id}-VIS`,
                captionStatus: 'Draft',
                visualStatus: 'Draft',
                boostPlan: (p.boostPlan as CalendarPost['boostPlan']) || 'Organic only',
                link: 'TBC',
                notes: p.notes || '',
              };
            });
            if (newPosts.length > 0) {
              setPosts(newPosts);
            }
          }
        } catch {
          // If JSON parsing fails, show the raw text via console for debugging
          console.log('AI response (non-JSON):', msg.slice(0, 500));
        }
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand]);

  /* ── CRUD operations ───────────────────── */

  function openAddForm(preDate?: string) {
    const form = emptyPost();
    if (preDate) {
      form.date = preDate;
      form.day = getDayFromDate(preDate);
    }
    setFormData(form);
    setEditingPost(null);
    setShowForm(true);
  }

  function openEditForm(post: CalendarPost) {
    setFormData({ ...post });
    setEditingPost(post);
    setShowForm(true);
  }

  function savePost() {
    const data = { ...formData };
    if (!data.date) return;
    data.day = getDayFromDate(data.date);
    if (!data.id) {
      data.id = `${data.date}-${data.platform}-${data.format}-${data.pillar}-${Date.now()}`;
      data.nanoBriefId = `${data.id}-VIS`;
    }

    if (editingPost) {
      setPosts(posts.map(p => p.id === editingPost.id ? data : p));
    } else {
      setPosts([...posts, data]);
    }
    setShowForm(false);
  }

  function deletePost(id: string) {
    setPosts(posts.filter(p => p.id !== id));
  }

  /* ── Form field updater ────────────────── */
  function updateForm<K extends keyof CalendarPost>(key: K, value: CalendarPost[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

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
          <span className="text-[10px] text-slate-500 ml-2">{filteredPosts.length} posts</span>
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
            onClick={handleAiGenerate}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Generate Month
          </button>
          <button
            onClick={() => openAddForm()}
            className="px-3 py-1.5 text-xs rounded-lg border border-emerald-700/30 bg-emerald-500/10 text-emerald-400 hover:opacity-80 flex items-center gap-1"
          >
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
                const dateStr = day ? `2026-03-${String(day).padStart(2, '0')}` : '';
                return (
                  <div
                    key={di}
                    className={`min-h-[90px] p-1.5 border-b border-r border-slate-700/30 ${
                      day ? 'hover:bg-white/[0.02] cursor-pointer group' : 'bg-slate-900/30'
                    } transition-colors`}
                    onClick={() => day && openAddForm(dateStr)}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 block mb-0.5">{day}</span>
                          <Plus className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {dayPosts.map(post => {
                          const FormatIcon = FORMAT_ICONS[post.format] || Image;
                          return (
                            <div
                              key={post.id}
                              onClick={e => { e.stopPropagation(); openEditForm(post); }}
                              className={`text-[9px] leading-tight px-1.5 py-1 rounded mb-0.5 truncate cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${PILLAR_COLORS[post.pillar] || 'bg-slate-700/50 text-slate-400'}`}
                              title={`${post.platform} – ${post.format} – ${post.pillar} – ${post.title}`}
                            >
                              <div className="flex items-center gap-1">
                                <FormatIcon className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className={PLATFORM_COLORS[post.platform]}>{post.platform}</span>
                                <span className="text-slate-500">·</span>
                                <span className="truncate">{post.title}</span>
                              </div>
                            </div>
                          );
                        })}
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
                {['Date', 'Day', 'Platform', 'Format', 'Pillar', 'Campaign', 'Post Title', 'Objective', 'Key Message', 'Visual Type', 'Brief ID', 'Caption', 'Visual', 'Boost/Ad', 'Notes', ''].map(col => (
                  <th key={col} className="px-3 py-2.5 text-[10px] font-semibold uppercase text-slate-500 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-xs text-slate-500">
                    No posts yet. Use &quot;AI Generate Month&quot; or add posts manually.
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => (
                  <tr key={post.id} className="border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors group">
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
                    <td className="px-2 py-2.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(post)} className="p-1 text-slate-500 hover:text-white transition-colors" title="Edit">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={() => deletePost(post.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
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

      {/* ── Add/Edit Post Modal ──────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">
                {editingPost ? 'Edit Post' : 'Add New Post'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Row 1: Date, Platform, Format, Pillar */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => updateForm('date', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={e => updateForm('platform', e.target.value as CalendarPost['platform'])}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    <option value="IG">IG</option>
                    <option value="FB">FB</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Format</label>
                  <select
                    value={formData.format}
                    onChange={e => updateForm('format', e.target.value as CalendarPost['format'])}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    <option value="Static">Static</option>
                    <option value="Carousel">Carousel</option>
                    <option value="Reel">Reel</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Pillar</label>
                  <select
                    value={formData.pillar}
                    onChange={e => updateForm('pillar', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Title, Campaign */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Post Title</label>
                  <input
                    value={formData.title}
                    onChange={e => updateForm('title', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
                    placeholder="Short descriptive title"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Campaign</label>
                  <input
                    value={formData.campaign}
                    onChange={e => updateForm('campaign', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
                    placeholder="Mar – Spring Launch"
                  />
                </div>
              </div>

              {/* Row 3: Objective, Key Message */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Objective</label>
                  <select
                    value={formData.objective}
                    onChange={e => updateForm('objective', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    {['Awareness', 'Engagement', 'Lead', 'Traffic', 'Conversion'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Key Message</label>
                  <input
                    value={formData.keyMessage}
                    onChange={e => updateForm('keyMessage', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
                    placeholder="Core message of this post"
                  />
                </div>
              </div>

              {/* Row 4: Visual Type, Boost Plan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Visual Type</label>
                  <input
                    value={formData.visualType}
                    onChange={e => updateForm('visualType', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
                    placeholder="Product + lifestyle, Graphic, UGC..."
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Boost Plan</label>
                  <select
                    value={formData.boostPlan}
                    onChange={e => updateForm('boostPlan', e.target.value as CalendarPost['boostPlan'])}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    <option value="Organic only">Organic only</option>
                    <option value="Boost candidate">Boost candidate</option>
                    <option value="Ad version">Ad version</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Statuses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Caption Status</label>
                  <select
                    value={formData.captionStatus}
                    onChange={e => updateForm('captionStatus', e.target.value as CalendarPost['captionStatus'])}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Needs client input">Needs client input</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Visual Status</label>
                  <select
                    value={formData.visualStatus}
                    onChange={e => updateForm('visualStatus', e.target.value as CalendarPost['visualStatus'])}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Client to provide">Client to provide</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  rows={2}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30 resize-none"
                  placeholder="Additional notes, client instructions..."
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50">
              <div>
                {editingPost && (
                  <button
                    onClick={() => { deletePost(editingPost.id); setShowForm(false); }}
                    className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete Post
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePost}
                  disabled={!formData.date || !formData.title}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  {editingPost ? 'Update' : 'Add Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
