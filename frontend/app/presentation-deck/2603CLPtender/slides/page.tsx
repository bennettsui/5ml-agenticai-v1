'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { presentationData } from '../data';
import {
  ChevronLeft, ChevronRight, Grid3X3, Image, MessageSquare,
  BrainCircuit, History, RotateCcw, Loader2, CheckCircle2,
  Zap, Eye, EyeOff, X, Download,
} from 'lucide-react';

const SLUG = '2603CLPtender';

// ─── Section metadata ────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  opening: 'Opening', understanding: 'Understanding', approach: 'Design & Production',
  logistics: 'Logistics', lettershop: 'Lettershop', hsse: 'HSSE',
  team: 'Team', closing: 'Closing',
};
const SECTION_ACCENT: Record<string, string> = {
  opening: '#E60000', understanding: '#0057A8', approach: '#F4A742',
  logistics: '#22C55E', lettershop: '#A855F7', hsse: '#F97316',
  team: '#14B8A6', closing: '#F43F5E',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlideOverride {
  slide_number: number;
  title?: string | null;
  subtitle?: string | null;
  content: Record<string, unknown>;
  notes?: string | null;
  updated_at: string;
}

interface AIReview {
  overall: string;
  issues: string[];
  suggestions: string[];
  change_summary: string;
  updated_content: Record<string, unknown>;
}

interface VersionEntry {
  id: number;
  version_number: number;
  title?: string | null;
  subtitle?: string | null;
  content: Record<string, unknown>;
  notes?: string | null;
  change_summary: string;
  changed_by: string;
  ai_comment?: string | null;
  created_at: string;
}

// ─── Slide renderers ─────────────────────────────────────────────────────────

function CoverSlide({ content }: { content: Record<string, string> }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-16">
      <div className="text-red-400 text-xs font-medium tracking-widest uppercase mb-6">
        {content.company} · Tender Response
      </div>
      <h1 className="text-5xl font-bold text-white leading-tight mb-4 max-w-3xl">{content.main_title}</h1>
      <p className="text-2xl text-slate-400 mb-8">{content.subtitle_cn}</p>
      <div className="w-16 h-px bg-red-500/50 mb-8" />
      <p className="text-slate-400 text-sm max-w-lg leading-relaxed">{content.project_name}</p>
      <p className="text-slate-600 text-sm mt-6">{content.date}</p>
    </div>
  );
}

function StatementSlide({ content }: { content: Record<string, string | string[]> }) {
  const points = Array.isArray(content.supporting_points) ? content.supporting_points : [];
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full">
      <p className="text-slate-400 text-lg mb-6 leading-relaxed">{String(content.problem)}</p>
      <h2 className="text-3xl font-bold text-white mb-8 leading-snug">{String(content.our_difference)}</h2>
      <div className="space-y-3">
        {points.map((pt, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            </div>
            <p className="text-slate-300 text-base leading-relaxed">{pt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentSlide({ content }: { content: { blocks?: { heading: string; body: string }[] } }) {
  const blocks = content.blocks || [];
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full">
      <div className="space-y-7">
        {blocks.map((block, i) => (
          <div key={i} className="flex gap-6">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono text-slate-500">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1.5">{block.heading}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{block.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualHeavySlide({ content }: { content: Record<string, unknown> }) {
  const colorStrategy = content.color_strategy as Record<string, string> | undefined;
  const characterDesign = content.character_design as Record<string, string> | undefined;
  const sceneStyle = content.scene_style as string | undefined;
  const blocks = content.blocks as { heading: string; body: string }[] | undefined;

  if (blocks) return <ContentSlide content={{ blocks }} />;

  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full gap-6">
      {colorStrategy && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(colorStrategy).map(([k, v]) => (
            <div key={k} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-xs font-medium text-slate-500 mb-2 capitalize">{k.replace('_', ' ')}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      )}
      {characterDesign && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(characterDesign).map(([k, v]) => (
            <div key={k} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-xs font-medium text-amber-400/80 mb-2 capitalize">{k.replace('_', ' ')}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      )}
      {sceneStyle && (
        <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-4">{sceneStyle}</p>
      )}
    </div>
  );
}

function TwoColumnSlide({ content }: { content: { left: { title: string; items: string[] }; right: { title: string; items: string[] } } }) {
  return (
    <div className="h-full flex items-center px-16 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-12 w-full">
        {[content.left, content.right].map((col, ci) => (
          <div key={ci}>
            <h3 className="text-base font-semibold text-white mb-4 pb-3 border-b border-white/[0.06]">{col.title}</h3>
            <div className="space-y-3">
              {col.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSlide({ content }: { content: { phases: { label: string; title: string; activities: string[]; client_role: string }[] } }) {
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-4 gap-4">
        {content.phases.map((phase, i) => (
          <div key={i} className="relative">
            {i < content.phases.length - 1 && (
              <div className="absolute top-4 left-full w-4 h-px bg-slate-700 z-10" />
            )}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-xs font-mono text-slate-600 mb-2">{phase.label}</div>
              <h4 className="text-xs font-semibold text-white mb-3 leading-snug">{phase.title}</h4>
              <div className="space-y-1.5 mb-3">
                {phase.activities.map((act, j) => (
                  <div key={j} className="flex items-start gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0 mt-1.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">{act}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 italic">{phase.client_role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionDividerSlide({ content, section }: { content: { section_title: string; section_subtitle: string }; section: string }) {
  const accent = SECTION_ACCENT[section] || '#E60000';
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-16">
      <div className="w-16 h-1 rounded-full mb-8" style={{ backgroundColor: accent }} />
      <h2 className="text-5xl font-bold text-white mb-4">{content.section_title}</h2>
      <p className="text-xl text-slate-400 max-w-xl">{content.section_subtitle}</p>
    </div>
  );
}

function SplitMetricsSlide({ content }: { content: { left: { title: string; items: string[] }; right: { title: string; items: string[] } } }) {
  return (
    <div className="h-full flex items-center px-16 max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-8 w-full">
        {[content.left, content.right].map((col, ci) => (
          <div key={ci} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">{col.title}</h3>
            <div className="space-y-2.5">
              {col.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-slate-500" />
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type AnySlide = (typeof presentationData.presentation.slides)[number];

function SlideContent({ slide }: { slide: AnySlide & { content: unknown } }) {
  const { layout_type, content } = slide;
  switch (layout_type) {
    case 'cover':         return <CoverSlide content={content as Record<string, string>} />;
    case 'statement':     return <StatementSlide content={content as Record<string, string | string[]>} />;
    case 'content':       return <ContentSlide content={content as { blocks: { heading: string; body: string }[] }} />;
    case 'two-column':    return <TwoColumnSlide content={content as { left: { title: string; items: string[] }; right: { title: string; items: string[] } }} />;
    case 'timeline':      return <TimelineSlide content={content as { phases: { label: string; title: string; activities: string[]; client_role: string }[] }} />;
    case 'section-divider': return <SectionDividerSlide content={content as { section_title: string; section_subtitle: string }} section={slide.section} />;
    case 'split-metrics': return <SplitMetricsSlide content={content as { left: { title: string; items: string[] }; right: { title: string; items: string[] } }} />;
    case 'visual-heavy':  return <VisualHeavySlide content={content as Record<string, unknown>} />;
    default:              return <ContentSlide content={content as { blocks: { heading: string; body: string }[] }} />;
  }
}

// ─── AI Panel ────────────────────────────────────────────────────────────────

interface AIPanelProps {
  slide: AnySlide & { content: unknown; slide_number: number };
  totalSlides: number;
  hasOverride: boolean;
  onApplied: (content: Record<string, unknown>) => void;
  onClose: () => void;
}

function AIPanel({ slide, totalSlides, hasOverride, onApplied, onClose }: AIPanelProps) {
  const [tab, setTab] = useState<'review' | 'history'>('review');
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [aiReview, setAiReview] = useState<AIReview | null>(null);
  const [applyState, setApplyState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [history, setHistory] = useState<VersionEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Reset when slide changes (parent re-mounts panel, but just in case)
  useEffect(() => {
    setAiReview(null);
    setAiState('idle');
    setApplyState('idle');
  }, [slide.slide_number]);

  useEffect(() => {
    if (tab !== 'history') return;
    setHistoryLoading(true);
    fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/history`)
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [tab, slide.slide_number]);

  async function handleReview() {
    setAiState('loading');
    setAiReview(null);
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: { ...slide, total: totalSlides } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');
      setAiReview(data.review);
      setAiState('done');
    } catch { setAiState('error'); }
  }

  async function handleApply() {
    if (!aiReview) return;
    setApplyState('loading');
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: slide.title, subtitle: slide.subtitle,
          content: aiReview.updated_content, notes: slide.notes,
          change_summary: aiReview.change_summary,
          changed_by: 'ai', ai_comment: aiReview.overall,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onApplied(aiReview.updated_content);
      setApplyState('done');
    } catch { setApplyState('error'); }
  }

  async function handleRestore(v: VersionEntry) {
    if (!confirm(`Restore slide to v${v.version_number}?`)) return;
    try {
      await fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/restore/${v.id}`, { method: 'POST' });
      onApplied(v.content);
      setTab('review');
      setHistory([]);
    } catch {}
  }

  return (
    <div className="w-80 flex-shrink-0 border-l border-slate-800/60 bg-slate-900/70 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-slate-200">AI Assistant</span>
          {hasOverride && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">modified</span>}
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 flex-shrink-0">
        {(['review', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'review' ? 'Review' : 'History'}
          </button>
        ))}
      </div>

      {/* Review tab */}
      {tab === 'review' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <button
            onClick={handleReview}
            disabled={aiState === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium disabled:opacity-50 transition-colors"
          >
            {aiState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
            {aiState === 'loading' ? 'Analysing slide…' : 'Analyse This Slide'}
          </button>

          {aiState === 'error' && (
            <p className="text-xs text-red-400 text-center">Review failed. Check DeepSeek API key.</p>
          )}

          {aiReview && (
            <div className="space-y-3">
              {/* Assessment */}
              <div className="bg-white/[0.03] border border-slate-700/30 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assessment</div>
                <p className="text-xs text-slate-300 leading-relaxed">{aiReview.overall}</p>
              </div>

              {/* Issues */}
              {aiReview.issues.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-red-400/80 uppercase tracking-wide mb-1.5">Issues</div>
                  <ul className="space-y-1">
                    {aiReview.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-2">
                        <span className="text-red-500 shrink-0 mt-0.5">·</span>{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {aiReview.suggestions.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-wide mb-1.5">Suggestions</div>
                  <ul className="space-y-1">
                    {aiReview.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-2">
                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[10px] text-slate-600 italic border-t border-slate-800/60 pt-2">
                {aiReview.change_summary}
              </div>

              {/* Apply button */}
              <button
                onClick={handleApply}
                disabled={applyState === 'loading' || applyState === 'done'}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50 transition-colors"
              >
                {applyState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                  applyState === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                  <Zap className="w-3.5 h-3.5" />}
                {applyState === 'done' ? 'Applied to slide!' :
                  applyState === 'loading' ? 'Saving…' : 'Apply Changes to Slide'}
              </button>
              {applyState === 'error' && <p className="text-xs text-red-400 text-center">Save failed.</p>}
            </div>
          )}

          {aiState === 'idle' && !aiReview && (
            <p className="text-xs text-slate-600 text-center leading-relaxed">
              Click "Analyse This Slide" to get AI-powered feedback and suggested improvements using DeepSeek.
            </p>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto p-4">
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">No version history yet.<br />Apply an AI review to create the first version.</p>
          ) : (
            <div className="space-y-2">
              {history.map(v => (
                <div key={v.id} className="bg-white/[0.02] border border-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300">v{v.version_number}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      v.changed_by === 'ai'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : v.changed_by === 'restore'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-slate-700/60 text-slate-400 border-slate-600/50'
                    }`}>
                      {v.changed_by}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1">{v.change_summary}</p>
                  {v.ai_comment && (
                    <p className="text-[10px] text-slate-600 italic mb-2 line-clamp-2">{v.ai_comment}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-700">
                      {new Date(v.created_at).toLocaleString('en-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleRestore(v)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Presenter ───────────────────────────────────────────────────────────

function SlidesPresenter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slides = presentationData.presentation.slides;

  const initialSlide = Math.max(1, Math.min(parseInt(searchParams.get('slide') || '1', 10), slides.length));
  const [currentIndex, setCurrentIndex] = useState(initialSlide - 1);
  const [showNotes, setShowNotes] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showBgImage, setShowBgImage] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Content overrides from DB (AI/user edits)
  const [overrides, setOverrides] = useState<Record<number, SlideOverride>>({});
  // Generated images indexed by slide_number
  const [genImages, setGenImages] = useState<Record<number, string[]>>({});

  // Load overrides once on mount
  useEffect(() => {
    fetch(`/api/presentation-deck/${SLUG}/slide-overrides`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setOverrides(d.overrides || {}))
      .catch(() => {});
  }, []);

  // Load generated images once on mount
  useEffect(() => {
    fetch(`/api/presentation-deck/${SLUG}/images?status=generated&limit=500`)
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        const bySlide: Record<number, string[]> = {};
        for (const img of (d.images || [])) {
          if (!img.image_url) continue;
          if (!bySlide[img.slide_number]) bySlide[img.slide_number] = [];
          bySlide[img.slide_number].push(img.image_url);
        }
        setGenImages(bySlide);
      })
      .catch(() => {});
  }, []);

  const rawSlide = slides[currentIndex];
  const override = overrides[rawSlide.slide_number];
  // Merge static data with any DB override (override wins for title/subtitle/content/notes)
  const slide = override
    ? { ...rawSlide, ...override, content: override.content as typeof rawSlide.content }
    : rawSlide;

  const accent = SECTION_ACCENT[slide.section] || '#E60000';

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setCurrentIndex(clamped);
    router.replace(`?slide=${clamped + 1}`, { scroll: false });
  }, [slides.length, router]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') goTo(currentIndex + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(currentIndex - 1);
      if (e.key === 'Escape') { setShowThumbnails(false); setShowAI(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, goTo]);

  async function handleDownloadPptx() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/export/pptx`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Export failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `5ML-CLP-Tender-${SLUG}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(`PPTX export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  }

  function handleAIApplied(updatedContent: Record<string, unknown>) {
    setOverrides(prev => ({
      ...prev,
      [rawSlide.slide_number]: {
        ...(prev[rawSlide.slide_number] || { slide_number: rawSlide.slide_number }),
        content: updatedContent,
        updated_at: new Date().toISOString(),
      },
    }));
  }

  const bgImageUrl = genImages[rawSlide.slide_number]?.[0];
  const bgOpacity = ['cover', 'section-divider'].includes(slide.layout_type) ? 0.28 : 0.14;

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/60 bg-slate-900/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/presentation-deck/2603CLPtender" className="text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-slate-500 font-medium">CLP Power Hong Kong</div>
            <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              {slide.title}
              {override && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-normal">edited</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Background image toggle (only when slide has generated image) */}
          {bgImageUrl && (
            <button
              onClick={() => setShowBgImage(!showBgImage)}
              className={`p-1.5 rounded transition-colors ${showBgImage ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
              title={showBgImage ? 'Hide generated background image' : 'Show generated background image'}
            >
              {showBgImage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 rounded transition-colors ${showNotes ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
            title="Speaker notes"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowVisuals(!showVisuals)}
            className={`p-1.5 rounded transition-colors ${showVisuals ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
            title="Generated images & visual prompts"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded transition-colors ${showThumbnails ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
            title="Slide grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          {/* AI assistant toggle */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={`p-1.5 rounded transition-colors ${showAI ? 'text-purple-400 bg-purple-500/10' : 'text-slate-600 hover:text-slate-400'}`}
            title="AI Assistant"
          >
            <BrainCircuit className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          {/* Download PPTX */}
          <button
            onClick={handleDownloadPptx}
            disabled={downloading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white disabled:opacity-50 transition-colors border border-slate-700/60"
            title="Download as PPTX"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? 'Exporting…' : 'PPTX'}
          </button>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <span className="text-xs text-slate-500 tabular-nums">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section label */}
          <div className="px-6 pt-3 pb-1 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
                {SECTION_LABELS[slide.section]}
              </span>
            </div>
          </div>

          {/* Slide title */}
          {slide.layout_type !== 'cover' && slide.layout_type !== 'section-divider' && (
            <div className="px-16 pt-4 pb-2 flex-shrink-0">
              <h1 className="text-2xl font-bold text-white leading-snug">{slide.title}</h1>
              {slide.subtitle && <p className="text-slate-400 text-sm mt-1">{slide.subtitle}</p>}
            </div>
          )}

          {/* Slide content (with generated image as background) */}
          <div className="flex-1 overflow-y-auto relative">
            {showBgImage && bgImageUrl && (
              <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImageUrl})`, opacity: bgOpacity }}
              />
            )}
            <div className="relative z-10">
              <SlideContent slide={slide as AnySlide & { content: unknown }} />
            </div>
          </div>

          {/* Notes / Visuals panel */}
          {(showNotes || showVisuals) && (
            <div className="border-t border-slate-800/60 bg-slate-900/40 flex-shrink-0 max-h-56 overflow-y-auto">
              {showNotes && slide.notes && (
                <div className="px-6 py-3">
                  <div className="text-xs font-medium text-amber-400 mb-1">Speaker notes</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{slide.notes}</p>
                </div>
              )}
              {showVisuals && (
                <div className="px-6 py-3 space-y-4">
                  {(genImages[rawSlide.slide_number] || []).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-emerald-400 mb-2">Generated images</div>
                      <div className="flex gap-3 flex-wrap">
                        {(genImages[rawSlide.slide_number] || []).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Generated image ${i + 1}`}
                              className="h-28 w-auto rounded-lg border border-emerald-500/20 object-cover hover:border-emerald-400/50 transition-colors"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {(slide.visual_prompts?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-xs font-medium text-blue-400 mb-2">Visual prompts</div>
                      <div className="space-y-1.5">
                        {(slide.visual_prompts || []).map((vp, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs font-mono text-slate-600 flex-shrink-0">{i + 1}.</span>
                            <p className="text-xs text-slate-400 leading-relaxed">{vp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(genImages[rawSlide.slide_number] || []).length === 0 && (slide.visual_prompts?.length ?? 0) === 0 && (
                    <p className="text-xs text-slate-600">No visuals for this slide.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav controls */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/40 flex-shrink-0">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />Previous
            </button>
            <div className="flex-1 mx-8 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / slides.length) * 100}%`, backgroundColor: accent }}
              />
            </div>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thumbnail panel */}
        {showThumbnails && (
          <div className="w-56 border-l border-slate-800/60 bg-slate-900/40 overflow-y-auto flex-shrink-0">
            <div className="p-3 space-y-2">
              {slides.map((s, i) => (
                <button
                  key={s.slide_number}
                  onClick={() => { goTo(i); setShowThumbnails(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    i === currentIndex ? 'bg-white/[0.08] border border-white/[0.1]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-600">{String(s.slide_number).padStart(2, '0')}</span>
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: SECTION_ACCENT[s.section] }} />
                    {overrides[s.slide_number] && <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" title="Edited" />}
                    {genImages[s.slide_number]?.length > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" title="Has generated image" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">{s.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI assistant panel */}
        {showAI && (
          <AIPanel
            key={rawSlide.slide_number}    // remount panel on slide change to reset state
            slide={slide as AnySlide & { content: unknown; slide_number: number }}
            totalSlides={slides.length}
            hasOverride={!!override}
            onApplied={handleAIApplied}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function SlidesPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-sm">Loading…</div>}>
      <SlidesPresenter />
    </Suspense>
  );
}
