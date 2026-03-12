'use client';

import { useState } from 'react';
import Link from 'next/link';
import { presentationData } from './data';
import {
  ChevronRight, BookOpen, Play,
} from 'lucide-react';

const SECTION_COLORS: Record<string, string> = {
  opening: 'bg-red-500/10 text-red-400 border-red-500/20',
  understanding: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approach: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  logistics: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lettershop: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  hsse: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  team: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  closing: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

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

export default function CLPTenderDeckPage() {
  const [activeSection, setActiveSection] = useState<string>('all');
  const { presentation } = presentationData;
  const slides = presentation.slides;

  const filteredSlides = activeSection === 'all'
    ? slides
    : slides.filter(s => s.section === activeSection);

  const sectionCounts = presentation.sections.reduce((acc, sec) => {
    acc[sec] = slides.filter(s => s.section === sec).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                {presentation.client}
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {presentation.title}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
              {slides.length} slides
            </span>
            <Link
              href="/presentation-deck/2603CLPtender/slides"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Present
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-1">
            {presentation.title}
          </h1>
          <p className="text-slate-400 text-lg mb-4">{presentation.title_cn}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>March 2026</span>
            <span>·</span>
            <span>5 Miles Lab</span>
            <span>·</span>
            <span>Internal slug: /presentation-deck/{presentation.slug}</span>
          </div>
        </div>

        {/* Section filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeSection === 'all'
                ? 'bg-slate-100 text-slate-900 border-slate-100'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            All ({slides.length})
          </button>
          {presentation.sections.map(sec => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeSection === sec
                  ? SECTION_COLORS[sec]
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {SECTION_LABELS[sec]} ({sectionCounts[sec]})
            </button>
          ))}
        </div>

        {/* Slide grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlides.map(slide => (
            <Link
              key={slide.slide_number}
              href={`/presentation-deck/2603CLPtender/slides?slide=${slide.slide_number}`}
              className="group block bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-slate-600 p-5 transition-all hover:bg-slate-800/80"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">
                    {String(slide.slide_number).padStart(2, '0')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${SECTION_COLORS[slide.section]}`}>
                    {SECTION_LABELS[slide.section]}
                  </span>
                </div>
                <span className="text-xs text-slate-600 bg-slate-900/50 px-2 py-0.5 rounded">
                  {slide.layout_type}
                </span>
              </div>

              <h3 className="font-semibold text-slate-100 text-sm leading-snug mb-2 group-hover:text-white">
                {slide.title}
              </h3>

              {slide.subtitle && (
                <p className="text-xs text-slate-500 mb-2">{slide.subtitle}</p>
              )}

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {slide.notes}
              </p>

              <div className="mt-3 flex items-center gap-1 text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
                <span>View slide</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
