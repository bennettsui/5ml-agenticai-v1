'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { presentationData } from '../data';
import {
  ChevronLeft, ChevronRight, Grid3X3,
  Image, MessageSquare,
} from 'lucide-react';

const SECTION_LABELS: Record<string, string> = {
  opening: 'Opening',
  understanding: 'Understanding',
  approach: 'Design & Production',
  logistics: 'Logistics',
  lettershop: 'Lettershop',
  hsse: 'HSSE',
  team: 'Team',
  closing: 'Closing',
};

const SECTION_ACCENT: Record<string, string> = {
  opening: '#E60000',
  understanding: '#0057A8',
  approach: '#F4A742',
  logistics: '#22C55E',
  lettershop: '#A855F7',
  hsse: '#F97316',
  team: '#14B8A6',
  closing: '#F43F5E',
};

// ─── Slide renderers by layout_type ─────────────────────────────────────────

function CoverSlide({ content }: { content: Record<string, string> }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-16">
      <div className="text-red-400 text-xs font-medium tracking-widest uppercase mb-6">
        {content.company} · Tender Response
      </div>
      <h1 className="text-5xl font-bold text-white leading-tight mb-4 max-w-3xl">
        {content.main_title}
      </h1>
      <p className="text-2xl text-slate-400 mb-8">{content.subtitle_cn}</p>
      <div className="w-16 h-px bg-red-500/50 mb-8" />
      <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
        {content.project_name}
      </p>
      <p className="text-slate-600 text-sm mt-6">{content.date}</p>
    </div>
  );
}

function StatementSlide({ content }: { content: Record<string, string | string[]> }) {
  const points = Array.isArray(content.supporting_points)
    ? content.supporting_points
    : [];
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full">
      <p className="text-slate-400 text-lg mb-6 leading-relaxed">
        {String(content.problem)}
      </p>
      <h2 className="text-3xl font-bold text-white mb-8 leading-snug">
        {String(content.our_difference)}
      </h2>
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

function ContentSlide({ content }: { content: { blocks: { heading: string; body: string }[] } }) {
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full">
      <div className="space-y-7">
        {content.blocks.map((block, i) => (
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

function TwoColumnSlide({ content }: { content: { left: { title: string; items: string[] }; right: { title: string; items: string[] } } }) {
  return (
    <div className="h-full flex items-center px-16 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-12 w-full">
        {[content.left, content.right].map((col, ci) => (
          <div key={ci}>
            <h3 className="text-base font-semibold text-white mb-4 pb-3 border-b border-white/[0.06]">
              {col.title}
            </h3>
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

function TimelineSlide({ content }: {
  content: {
    phases: {
      label: string;
      title: string;
      activities: string[];
      client_role: string;
    }[];
  };
}) {
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-4 gap-4">
        {content.phases.map((phase, i) => (
          <div key={i} className="relative">
            {i < content.phases.length - 1 && (
              <div className="absolute top-4 left-full w-4 h-px bg-slate-700 z-10" />
            )}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-xs font-mono text-red-400 mb-1">{phase.label}</div>
              <h4 className="text-xs font-semibold text-white mb-3 leading-snug">{phase.title}</h4>
              <div className="space-y-1.5 mb-3">
                {phase.activities.map((act, j) => (
                  <div key={j} className="flex items-start gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0 mt-1.5" />
                    <p className="text-slate-400 text-xs leading-relaxed">{act}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.04] pt-2">
                <p className="text-xs text-blue-400/70 leading-relaxed">{phase.client_role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionDividerSlide({ content, section }: {
  content: { section_title: string; section_subtitle: string };
  section: string;
}) {
  const accent = SECTION_ACCENT[section] || '#E60000';
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-16">
      <div
        className="w-12 h-1 rounded-full mb-8"
        style={{ backgroundColor: accent }}
      />
      <h2 className="text-5xl font-bold text-white mb-4">{content.section_title}</h2>
      <p className="text-xl text-slate-400 max-w-xl">{content.section_subtitle}</p>
    </div>
  );
}

function SplitMetricsSlide({ content }: {
  content: {
    left: { title: string; items: string[] };
    right: { title: string; items: string[] };
  };
}) {
  return (
    <div className="h-full flex items-center px-16 max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-8 w-full">
        {[content.left, content.right].map((col, ci) => (
          <div
            key={ci}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7"
          >
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

function SlideContent({ slide }: { slide: (typeof presentationData.presentation.slides)[number] }) {
  const { layout_type, content } = slide;
  switch (layout_type) {
    case 'cover':
      return <CoverSlide content={content as Record<string, string>} />;
    case 'statement':
      return <StatementSlide content={content as Record<string, string | string[]>} />;
    case 'content':
      return <ContentSlide content={content as { blocks: { heading: string; body: string }[] }} />;
    case 'two-column':
      return (
        <TwoColumnSlide
          content={content as { left: { title: string; items: string[] }; right: { title: string; items: string[] } }}
        />
      );
    case 'timeline':
      return (
        <TimelineSlide
          content={content as {
            phases: { label: string; title: string; activities: string[]; client_role: string }[];
          }}
        />
      );
    case 'section-divider':
      return (
        <SectionDividerSlide
          content={content as { section_title: string; section_subtitle: string }}
          section={slide.section}
        />
      );
    case 'split-metrics':
      return (
        <SplitMetricsSlide
          content={content as { left: { title: string; items: string[] }; right: { title: string; items: string[] } }}
        />
      );
    default:
      return <ContentSlide content={content as { blocks: { heading: string; body: string }[] }} />;
  }
}

// ─── Main Presenter ──────────────────────────────────────────────────────────

function SlidesPresenter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slides = presentationData.presentation.slides;

  const initialSlide = Math.max(
    1,
    Math.min(parseInt(searchParams.get('slide') || '1', 10), slides.length)
  );
  const [currentIndex, setCurrentIndex] = useState(initialSlide - 1);
  const [showNotes, setShowNotes] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const slide = slides[currentIndex];
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
      if (e.key === 'Escape') setShowThumbnails(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, goTo]);

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/60 bg-slate-900/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/presentation-deck/2603CLPtender"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-slate-500 font-medium">CLP Power Hong Kong</div>
            <div className="text-xs text-slate-300 font-semibold">{slide.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            title="Visual prompts"
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
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <span className="text-xs text-slate-500">
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
              <div
                className="h-0.5 w-8 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
                {SECTION_LABELS[slide.section]}
              </span>
            </div>
          </div>

          {/* Slide title */}
          {slide.layout_type !== 'cover' && slide.layout_type !== 'section-divider' && (
            <div className="px-16 pt-4 pb-2 flex-shrink-0">
              <h1 className="text-2xl font-bold text-white leading-snug">{slide.title}</h1>
              {slide.subtitle && (
                <p className="text-slate-400 text-sm mt-1">{slide.subtitle}</p>
              )}
            </div>
          )}

          {/* Slide content */}
          <div className="flex-1 overflow-y-auto">
            <SlideContent slide={slide} />
          </div>

          {/* Notes / Visuals panel */}
          {(showNotes || showVisuals) && (
            <div className="border-t border-slate-800/60 bg-slate-900/40 flex-shrink-0 max-h-44 overflow-y-auto">
              {showNotes && slide.notes && (
                <div className="px-6 py-3">
                  <div className="text-xs font-medium text-amber-400 mb-1">Speaker notes</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{slide.notes}</p>
                </div>
              )}
              {showVisuals && slide.visual_prompts.length > 0 && (
                <div className="px-6 py-3">
                  <div className="text-xs font-medium text-blue-400 mb-2">Visual prompts</div>
                  <div className="space-y-1.5">
                    {slide.visual_prompts.map((vp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-mono text-slate-600 flex-shrink-0">{i + 1}.</span>
                        <p className="text-xs text-slate-400 leading-relaxed">{vp}</p>
                      </div>
                    ))}
                  </div>
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
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            {/* Progress bar */}
            <div className="flex-1 mx-8 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / slides.length) * 100}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
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
                    i === currentIndex
                      ? 'bg-white/[0.08] border border-white/[0.1]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-600">
                      {String(s.slide_number).padStart(2, '0')}
                    </span>
                    <div
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SECTION_ACCENT[s.section] }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">{s.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SlidesPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-sm">Loading…</div>}>
      <SlidesPresenter />
    </Suspense>
  );
}
