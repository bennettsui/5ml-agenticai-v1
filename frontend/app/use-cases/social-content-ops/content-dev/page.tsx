'use client';

import { useState } from 'react';
import {
  Pencil, AlertCircle, Image, FileText, Video, Sparkles,
  Loader2, ChevronDown, ChevronUp, Eye, Palette,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

interface ContentCard {
  id: string;
  platform: string;
  format: 'Reel' | 'Static' | 'Carousel';
  date: string;
  pillar: string;
  campaign: string;
  objective: string;
  audienceInsight: string;
  coreMessage: string;
  // Copy fields
  hook: string[];
  talkingPoints: string[];
  caption: string;
  hashtags: string[];
  cta: string;
  // Carousel-specific
  slides?: { headline: string; points: string[] }[];
  // Reel-specific
  scenes?: { text: string; onScreen: string }[];
  duration?: string;
  // Nano Banana Visual Brief
  visualBrief: {
    visualId: string;
    formatRatio: string;
    visualType: string;
    subjectComposition: string;
    brandStyleMood: string;
    brandAssets: string;
    textOnImage: string;
    specialNotes: string;
  };
}

/* ── Sample data ────────────────────────── */

const SAMPLE_CARDS: ContentCard[] = [
  {
    id: '2026-03-03-IG-Reel-Educate',
    platform: 'IG', format: 'Reel', date: '2026-03-03', pillar: 'Educate',
    campaign: 'Mar – Spring Launch', objective: 'Awareness',
    audienceInsight: 'SMB owners spending 3+ hrs/week on manual social management',
    coreMessage: 'AI agents can automate 80% of social content operations',
    hook: ['Stop wasting 3 hours on social — AI does it in minutes', 'Your competitor is already using AI for social. Are you?'],
    talkingPoints: ['Manual content creation takes 3x longer', 'AI agents handle scheduling, copy, and analytics', 'Focus on strategy, not execution'],
    scenes: [
      { text: 'The old way: manual posting', onScreen: '"3 hours per day"' },
      { text: 'The AI way: automated pipeline', onScreen: '"15 minutes to review"' },
      { text: 'Results speak for themselves', onScreen: '"3x engagement"' },
    ],
    duration: '20-30s',
    caption: 'Stop spending hours on social content. AI agents handle the heavy lifting so you can focus on what matters — strategy and relationships.',
    hashtags: ['#AImarketing', '#SocialMedia', '#ContentAutomation', '#GrowthOS', '#5ML', '#AgenticAI'],
    cta: 'Save this for later',
    visualBrief: {
      visualId: '2026-03-03-IG-Reel-Educate-VIS',
      formatRatio: '9:16 vertical (IG Reel)',
      visualType: 'Product + lifestyle',
      subjectComposition: 'Split screen: left shows person stressed at laptop (manual), right shows clean dashboard with AI agents working. Modern office, warm lighting.',
      brandStyleMood: 'Clean, tech-forward, warm. Brand purple (#7c3aed) accents on dark background. Professional but approachable.',
      brandAssets: 'Logo bottom-right, 5ML wordmark on closing frame',
      textOnImage: '"3hrs → 15min" large center text on scene 2',
      specialNotes: 'Use motion graphics for the AI agent workflow animation',
    },
  },
  {
    id: '2026-03-10-Both-Carousel-Auth',
    platform: 'Both', format: 'Carousel', date: '2026-03-10', pillar: 'Authority',
    campaign: 'Mar – Spring Launch', objective: 'Engagement',
    audienceInsight: 'Marketing directors seeking proven ROI data before adopting new tools',
    coreMessage: 'Real case study showing 3x ROAS improvement with agentic social approach',
    hook: ['How we turned $1 into $3 for a HK F&B brand', 'The exact playbook behind 3x ROAS in 30 days'],
    talkingPoints: ['Client background: mid-size F&B chain, 12 locations', 'Challenge: inconsistent social presence, low engagement', 'Solution: 14-agent pipeline for content + community'],
    slides: [
      { headline: '3x ROAS in 30 Days', points: ['Real case study from a HK F&B brand'] },
      { headline: 'The Challenge', points: ['12 locations, no unified social', '< 1% engagement rate', '$0.50 CPM with poor targeting'] },
      { headline: 'Our Approach', points: ['14-agent agentic pipeline', 'AI content + community management', 'Budget optimizer per location'] },
      { headline: 'The Results', points: ['3.2x ROAS', '4.5% engagement rate', '60% reduction in content production time'] },
      { headline: 'Want the Same Results?', points: ['DM us for a free social audit'] },
    ],
    caption: 'We helped a 12-location F&B chain go from scattered social to 3.2x ROAS in just 30 days. Here\'s exactly how we did it.',
    hashtags: ['#CaseStudy', '#ROAS', '#SocialMediaMarketing', '#AImarketing', '#5ML', '#AgenticAI', '#HongKong'],
    cta: 'DM us "AUDIT" for a free social review',
    visualBrief: {
      visualId: '2026-03-10-Both-Carousel-Auth-VIS',
      formatRatio: '4:5 (IG) + 1:1 (FB)',
      visualType: 'Data graphics + photo',
      subjectComposition: 'Slide 1: Bold "3x" number with subtle brand background. Slides 2-4: Clean data cards with icons. Slide 5: CTA with brand gradient.',
      brandStyleMood: 'Professional, data-driven. Dark theme with purple/emerald accents. Clean typography.',
      brandAssets: 'Logo on slide 1 and 5. Brand gradient (#7c3aed → #10b981) as accent.',
      textOnImage: 'Each slide: headline top, 2-3 bullet points center',
      specialNotes: 'Maintain visual consistency across all 5 slides. FB version: adapt to 1:1 ratio.',
    },
  },
];

/* ── Helpers ─────────────────────────────── */

const FORMAT_ICONS = { Reel: Video, Static: Image, Carousel: FileText };

const PILLAR_COLORS: Record<string, string> = {
  Educate: 'bg-blue-500/20 text-blue-400 border-blue-700/30',
  Authority: 'bg-purple-500/20 text-purple-400 border-purple-700/30',
  Conversion: 'bg-amber-500/20 text-amber-400 border-amber-700/30',
  Showcase: 'bg-emerald-500/20 text-emerald-400 border-emerald-700/30',
  Community: 'bg-pink-500/20 text-pink-400 border-pink-700/30',
};

/* ── Component ──────────────────────────── */

export default function ContentDevPage() {
  const { selectedBrand } = useBrandProject();
  const [cards] = useState<ContentCard[]>(SAMPLE_CARDS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showVisualBrief, setShowVisualBrief] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pencil className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Content Development</h1>
          </div>
          <p className="text-sm text-slate-400">
            Expand calendar posts into full content cards — copy/script + Nano Banana visual briefs
          </p>
        </div>
        <button
          disabled={!selectedBrand || generating}
          onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 3000); }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          AI Expand All
        </button>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand for brand-aligned content development.</p>
        </div>
      )}

      {/* Content Cards */}
      <div className="space-y-4">
        {cards.map(card => {
          const expanded = expandedId === card.id;
          const briefOpen = showVisualBrief === card.id;
          const FormatIcon = FORMAT_ICONS[card.format] || Image;
          const pillarClass = PILLAR_COLORS[card.pillar] || PILLAR_COLORS.Educate;

          return (
            <div key={card.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
              {/* Card header — always visible */}
              <button
                onClick={() => setExpandedId(expanded ? null : card.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <FormatIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-500">{card.date}</span>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs font-medium text-slate-300">{card.platform}</span>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-300">{card.format}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${pillarClass}`}>{card.pillar}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">{card.id}</h3>
                  <p className="text-xs text-slate-400 truncate">{card.coreMessage}</p>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {/* Expanded content */}
              {expanded && (
                <div className="border-t border-slate-700/30 px-5 py-5 space-y-5">
                  {/* Meta row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Campaign', value: card.campaign },
                      { label: 'Objective', value: card.objective },
                      { label: 'Audience Insight', value: card.audienceInsight },
                      { label: 'Core Message', value: card.coreMessage },
                    ].map(m => (
                      <div key={m.label} className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[10px] uppercase text-slate-500 mb-0.5">{m.label}</p>
                        <p className="text-xs text-slate-300">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Hook options */}
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2">Hook Options</h4>
                    <div className="space-y-1.5">
                      {card.hook.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-700/20 rounded-lg">
                          <span className="text-[10px] text-amber-400 font-bold mt-0.5">#{i + 1}</span>
                          <p className="text-xs text-white">{h}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Format-specific: Reel scenes */}
                  {card.format === 'Reel' && card.scenes && (
                    <div>
                      <h4 className="text-xs font-semibold text-white mb-2">
                        Reel Scenes <span className="text-slate-500 font-normal">({card.duration})</span>
                      </h4>
                      <div className="space-y-1.5">
                        {card.scenes.map((s, i) => (
                          <div key={i} className="flex items-start gap-3 px-3 py-2 bg-white/[0.02] border border-slate-700/30 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">S{i + 1}</span>
                            <div className="flex-1">
                              <p className="text-xs text-slate-300">{s.text}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">On-screen: {s.onScreen}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Format-specific: Carousel slides */}
                  {card.format === 'Carousel' && card.slides && (
                    <div>
                      <h4 className="text-xs font-semibold text-white mb-2">Slide Plan</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {card.slides.map((sl, i) => (
                          <div key={i} className="bg-white/[0.02] border border-slate-700/30 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 mb-1">Slide {i + 1}</p>
                            <p className="text-xs font-medium text-white mb-1">{sl.headline}</p>
                            {sl.points.map((pt, j) => (
                              <p key={j} className="text-[10px] text-slate-400">• {pt}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2">Caption</h4>
                    <div className="bg-white/[0.02] border border-slate-700/30 rounded-lg p-3">
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{card.caption}</p>
                      <p className="text-xs text-amber-400 mt-2 font-medium">CTA: {card.cta}</p>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {card.hashtags.map(h => (
                          <span key={h} className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nano Banana Visual Brief toggle */}
                  <div>
                    <button
                      onClick={() => setShowVisualBrief(briefOpen ? null : card.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Nano Banana Visual Brief
                      {briefOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {briefOpen && (
                      <div className="mt-2 bg-purple-900/10 border border-purple-700/20 rounded-lg p-4 space-y-2">
                        {Object.entries(card.visualBrief).map(([key, val]) => (
                          <div key={key} className="flex gap-3">
                            <span className="text-[10px] uppercase text-purple-400/60 w-28 flex-shrink-0 font-medium">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <p className="text-xs text-slate-300">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-700/30">
                    <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors">
                      Save Draft
                    </button>
                    <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-16">
          <Pencil className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No content cards yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Add posts in the Content Calendar first, then expand them here.
          </p>
        </div>
      )}
    </div>
  );
}
