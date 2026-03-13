'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, ImageIcon,
  Loader2, ChevronDown, ChevronUp, Zap, AlertCircle,
  RefreshCw, Filter, Sparkles,
} from 'lucide-react';

const SLUG = '2603CLPtender';

type ManifestStatus = 'pending' | 'approved' | 'skip' | 'generated';
type ManifestPriority = 'high' | 'normal' | 'low';

interface ManifestItem {
  id: string;
  slide_number: number;
  section: string;
  slide_title: string;
  usage: string;
  layout_type: string;
  original_prompt: string;
  override_prompt: string | null;
  status: ManifestStatus;
  priority: ManifestPriority;
  notes: string | null;
  asset_id: number | null;
  image_url: string | null;
  updated_at: string;
}

interface Summary {
  pending?: number;
  approved?: number;
  skip?: number;
  generated?: number;
}

const STATUS_STYLES: Record<ManifestStatus, string> = {
  pending:   'bg-slate-700/60 text-slate-300 border-slate-600/50',
  approved:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  skip:      'bg-slate-800/60 text-slate-500 border-slate-700/30',
  generated: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

const STATUS_ICON: Record<ManifestStatus, React.FC<{ className?: string }>> = {
  pending:   Clock,
  approved:  CheckCircle2,
  skip:      XCircle,
  generated: ImageIcon,
};

const USAGE_COLORS: Record<string, string> = {
  'background-hero':  'text-red-400',
  'section-hero':     'text-orange-400',
  'main-visual':      'text-amber-400',
  'secondary-visual': 'text-yellow-400',
  'content-figure':   'text-slate-400',
};

export default function ManifestPage() {
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [buildState, setBuildState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [buildMsg, setBuildMsg] = useState('');
  const [genState, setGenState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [genMsg, setGenMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Generation progress tracking
  const [isGenerating, setIsGenerating] = useState(false);
  const [genQueued, setGenQueued] = useState(0);
  const [genDone, setGenDone] = useState(0);
  const pollCountRef = useRef(0);  // safety timeout: stop after 150 polls (10 min)

  // Poll manifest-status every 4 s while generating
  useEffect(() => {
    if (!isGenerating) return;
    pollCountRef.current = 0;

    const id = setInterval(async () => {
      pollCountRef.current += 1;
      try {
        const res = await fetch(`/api/presentation-deck/${SLUG}/manifest-status`);
        if (!res.ok) return;
        const data = await res.json();
        const approvedNow: number = data.summary?.approved || 0;
        const newDone = Math.max(0, genQueued - approvedNow);
        setGenDone(newDone);
        setSummary(data.summary || {});

        const allDone = approvedNow === 0 || pollCountRef.current >= 150;
        if (allDone) {
          clearInterval(id);
          setIsGenerating(false);
          setGenDone(genQueued);
          setGenState('ok');
          setGenMsg(`${newDone} image${newDone !== 1 ? 's' : ''} generated`);
          fetchManifest();   // refresh list to show thumbnails + 'generated' badges
        }
      } catch { /* ignore transient network errors */ }
    }, 4000);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, genQueued]);

  const fetchManifest = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (filter !== 'all') params.set('status', filter);
      if (sectionFilter !== 'all') params.set('section', sectionFilter);

      const res = await fetch(`/api/presentation-deck/${SLUG}/images?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data.images || []);
      setSummary(data.summary || {});
      setTotal(data.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, sectionFilter]);

  useEffect(() => { fetchManifest(); }, [fetchManifest]);

  async function handleBuildManifest() {
    setBuildState('loading');
    setBuildMsg('');
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/build-manifest`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Build failed');
      setBuildState('ok');
      setBuildMsg(`${data.inserted} new, ${data.skipped} existing`);
      fetchManifest();
    } catch (e: unknown) {
      setBuildState('error');
      setBuildMsg(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function handleGenerateApproved() {
    setGenState('loading');
    setGenMsg('');
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/generate-approved`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.queued > 0) {
        setGenQueued(data.queued);
        setGenDone(0);
        setIsGenerating(true);   // triggers polling useEffect
      } else {
        setGenState('ok');
        setGenMsg('No approved images to generate');
      }
    } catch (e: unknown) {
      setGenState('error');
      setGenMsg(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function patchItem(id: string, patch: Partial<Pick<ManifestItem, 'status' | 'override_prompt' | 'priority' | 'notes'>>) {
    const prevItem = items.find(it => it.id === id);
    try {
      const res = await fetch(`/api/presentation-deck/images/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return; // silently skip on server error
      const updated = await res.json();
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...updated } : it));
      // Keep summary counts in sync so button counts update immediately
      if (patch.status && prevItem && patch.status !== prevItem.status) {
        setSummary(prev => ({
          ...prev,
          [prevItem.status]: Math.max(0, (prev[prevItem.status] || 0) - 1),
          [patch.status]: (prev[patch.status] || 0) + 1,
        }));
      }
    } catch {
      // Network error — skip silently, item stays unchanged
    }
  }

  async function approveAll() {
    const pendingItems = items.filter(it => it.status === 'pending');
    await Promise.all(pendingItems.map(it => patchItem(it.id, { status: 'approved' })));
  }

  const sections = [...new Set(items.map(it => it.section).filter(Boolean))];
  const approvedCount = summary.approved || 0;
  const totalCount = Object.values(summary).reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/presentation-deck/${SLUG}`}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">CLP Tender · 2603</div>
              <div className="text-sm font-semibold text-slate-100">Image Manifest</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchManifest}
              className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleBuildManifest}
              disabled={buildState === 'loading'}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 disabled:opacity-50 transition-colors"
            >
              {buildState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
              Build Manifest
            </button>
            {buildMsg && (
              <span className={`text-xs ${buildState === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                {buildMsg}
              </span>
            )}
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={approveAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Approve All Pending
            </button>
            <button
              onClick={handleGenerateApproved}
              disabled={genState === 'loading' || isGenerating || approvedCount === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors font-medium"
            >
              {isGenerating
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : genState === 'loading'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Zap className="w-3.5 h-3.5" />}
              {isGenerating
                ? `Generating… ${genDone}/${genQueued}`
                : `Generate Approved (${approvedCount})`}
            </button>
            {genMsg && !isGenerating && (
              <span className={`text-xs ${genState === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                {genMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Generation progress banner */}
      {isGenerating && (
        <div className="border-b border-emerald-500/20 bg-emerald-500/[0.04]">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-4">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-emerald-300 font-medium">
                    Generating images… each takes ~30 s
                  </span>
                  <span className="text-emerald-400 font-mono tabular-nums">
                    {genDone} / {genQueued}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${genQueued > 0 ? Math.round((genDone / genQueued) * 100) : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>High-priority items generated first</span>
                  <span>{genQueued > 0 ? Math.round((genDone / genQueued) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary chips */}
        {totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {(['all', 'pending', 'approved', 'skip', 'generated'] as const).map(s => {
              const count = s === 'all' ? totalCount : (summary[s as ManifestStatus] || 0);
              const active = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-slate-100 text-slate-900 border-slate-100'
                      : s !== 'all' && STATUS_STYLES[s as ManifestStatus]
                        ? STATUS_STYLES[s as ManifestStatus] + ' hover:opacity-80'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {s === 'all' ? `All (${count})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${count})`}
                </button>
              );
            })}

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Section filter */}
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="text-xs bg-slate-800/60 border border-slate-700/50 text-slate-400 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-500"
            >
              <option value="all">All sections</option>
              {sections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* Instruction tip */}
        {totalCount === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-slate-700 mb-4" />
            <p className="text-slate-400 mb-2 font-medium">No manifest yet</p>
            <p className="text-slate-600 text-sm mb-4">
              First seed the deck to DB, then click <strong className="text-slate-400">Build Manifest</strong> to extract all visual prompts.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          </div>
        )}

        {/* Table */}
        {!loading && items.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs text-slate-600 mb-3">{total} items</div>
            {items.map(item => {
              const StatusIcon = STATUS_ICON[item.status] ?? Clock;
              const isExpanded = expandedId === item.id;
              const activePrompt = item.override_prompt || item.original_prompt;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all ${
                    item.status === 'skip'
                      ? 'border-slate-800/50 bg-slate-900/40 opacity-50'
                      : item.status === 'generated'
                        ? 'border-blue-500/20 bg-blue-500/[0.03]'
                        : item.status === 'approved'
                          ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                          : 'border-slate-700/50 bg-slate-800/40'
                  }`}
                >
                  {/* Row */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {/* Slide number */}
                    <span className="text-xs font-mono text-slate-500 w-7 pt-0.5 shrink-0">
                      {String(item.slide_number).padStart(2, '0')}
                    </span>

                    {/* Usage + section */}
                    <div className="flex flex-col gap-0.5 w-32 shrink-0">
                      <span className={`text-xs font-medium ${USAGE_COLORS[item.usage] || 'text-slate-400'}`}>
                        {item.usage}
                      </span>
                      <span className="text-xs text-slate-600">{item.section}</span>
                    </div>

                    {/* Slide title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-300 truncate mb-0.5">{item.slide_title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{activePrompt}</p>
                    </div>

                    {/* Priority badge */}
                    {item.priority === 'high' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        high
                      </span>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusIcon className={`w-3.5 h-3.5 ${
                        item.status === 'approved' ? 'text-emerald-400' :
                        item.status === 'generated' ? 'text-blue-400' :
                        item.status === 'skip' ? 'text-slate-600' :
                        'text-slate-500'
                      }`} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[item.status]}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Expand icon */}
                    <div className="text-slate-600 shrink-0">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/30 px-4 py-4 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Prompts */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Original Prompt</label>
                            <p className="text-xs text-slate-400 bg-white/[0.02] rounded-lg p-3 border border-slate-700/30 leading-relaxed">
                              {item.original_prompt}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                              Override Prompt <span className="text-slate-600 font-normal">(optional — blank = use original)</span>
                            </label>
                            <textarea
                              defaultValue={item.override_prompt || ''}
                              onBlur={e => {
                                const val = e.target.value.trim();
                                patchItem(item.id, { override_prompt: val || '' });
                              }}
                              rows={3}
                              placeholder="Edit prompt here…"
                              className="w-full text-xs bg-slate-900/60 border border-slate-700/50 text-slate-300 rounded-lg p-3 resize-none focus:outline-none focus:border-slate-500 placeholder:text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Notes</label>
                            <input
                              type="text"
                              defaultValue={item.notes || ''}
                              onBlur={e => patchItem(item.id, { notes: e.target.value })}
                              placeholder="e.g. use illustration style, skip — using real photo…"
                              className="w-full text-xs bg-slate-900/60 border border-slate-700/50 text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500 placeholder:text-slate-700"
                            />
                          </div>
                        </div>

                        {/* Controls + preview */}
                        <div className="space-y-3">
                          {/* Status buttons */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Status</label>
                            <div className="flex gap-2">
                              {(['pending', 'approved', 'skip'] as ManifestStatus[]).map(s => (
                                <button
                                  key={s}
                                  onClick={() => patchItem(item.id, { status: s })}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                    item.status === s
                                      ? STATUS_STYLES[s]
                                      : 'bg-slate-800/60 text-slate-500 border-slate-700/30 hover:border-slate-600'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Priority */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Priority</label>
                            <div className="flex gap-2">
                              {(['high', 'normal', 'low'] as ManifestPriority[]).map(p => (
                                <button
                                  key={p}
                                  onClick={() => patchItem(item.id, { priority: p })}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                    item.priority === p
                                      ? p === 'high'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        : 'bg-slate-700/60 text-slate-300 border-slate-600/50'
                                      : 'bg-slate-800/60 text-slate-500 border-slate-700/30 hover:border-slate-600'
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Generated image preview */}
                          {item.image_url && item.status === 'generated' && (
                            <div>
                              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Generated Image</label>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image_url}
                                alt={item.slide_title}
                                className="rounded-lg border border-slate-700/50 max-h-40 object-cover w-full"
                              />
                            </div>
                          )}

                          {/* Meta */}
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <p>Layout: <span className="text-slate-500">{item.layout_type}</span></p>
                            <p>ID: <span className="font-mono text-slate-600">{item.id.slice(0, 8)}…</span></p>
                            {item.updated_at && (
                              <p>Updated: <span className="text-slate-500">
                                {new Date(item.updated_at).toLocaleString('en-HK')}
                              </span></p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
