'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Pencil, AlertCircle, Image, FileText, Video, Sparkles,
  Loader2, ChevronDown, ChevronUp, Eye, Palette, Plus,
  Clock, CheckCircle, XCircle, Send, MessageSquare, Shield,
  Calendar, ArrowRight, BookOpen, X, Save, Edit3, Trash2,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';
import { useAutosave } from '@/lib/useAutosave';

/* ── Types ──────────────────────────────── */

type ContentStatus = 'Draft' | 'Submitted' | 'In Review' | 'Changes Requested' | 'Approved' | 'Scheduled' | 'Published';

interface ReviewComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  action: 'comment' | 'approve' | 'request_changes';
}

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
  hook: string[];
  talkingPoints: string[];
  caption: string;
  hashtags: string[];
  cta: string;
  slides?: { headline: string; points: string[] }[];
  scenes?: { text: string; onScreen: string }[];
  duration?: string;
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
  // Scheduling & approval
  status: ContentStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  publishedUrl?: string;
  reviews: ReviewComment[];
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
      subjectComposition: 'Split screen: left shows person stressed at laptop (manual), right shows clean dashboard with AI agents working.',
      brandStyleMood: 'Clean, tech-forward, warm. Brand purple (#7c3aed) accents on dark background.',
      brandAssets: 'Logo bottom-right, 5ML wordmark on closing frame',
      textOnImage: '"3hrs → 15min" large center text on scene 2',
      specialNotes: 'Use motion graphics for the AI agent workflow animation',
    },
    status: 'Draft',
    reviews: [],
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
      { headline: 'The Challenge', points: ['12 locations, no unified social', '< 1% engagement rate'] },
      { headline: 'Our Approach', points: ['14-agent agentic pipeline', 'AI content + community management'] },
      { headline: 'The Results', points: ['3.2x ROAS', '4.5% engagement rate', '60% reduction in content production time'] },
      { headline: 'Want the Same Results?', points: ['DM us for a free social audit'] },
    ],
    caption: 'We helped a 12-location F&B chain go from scattered social to 3.2x ROAS in just 30 days.',
    hashtags: ['#CaseStudy', '#ROAS', '#SocialMediaMarketing', '#AImarketing', '#5ML', '#AgenticAI', '#HongKong'],
    cta: 'DM us "AUDIT" for a free social review',
    visualBrief: {
      visualId: '2026-03-10-Both-Carousel-Auth-VIS',
      formatRatio: '4:5 (IG) + 1:1 (FB)',
      visualType: 'Data graphics + photo',
      subjectComposition: 'Slide 1: Bold "3x" number. Slides 2-4: Clean data cards. Slide 5: CTA with brand gradient.',
      brandStyleMood: 'Professional, data-driven. Dark theme with purple/emerald accents.',
      brandAssets: 'Logo on slide 1 and 5. Brand gradient (#7c3aed → #10b981) as accent.',
      textOnImage: 'Each slide: headline top, 2-3 bullet points center',
      specialNotes: 'Maintain visual consistency across all 5 slides.',
    },
    status: 'Approved',
    scheduledDate: '2026-03-10',
    scheduledTime: '19:00',
    reviews: [
      { id: 'r1', author: 'Sarah Chen', role: 'Creative Director', text: 'Strong case study angle. The data visualization on slides 2-4 needs to pop more — suggest using brand gradient as card background.', timestamp: '2026-02-28T14:30:00', action: 'comment' },
      { id: 'r2', author: 'James Wong', role: 'Brand Manager', text: 'Approved. Caption tone is on-brand. Slide flow tells the story well.', timestamp: '2026-03-01T10:15:00', action: 'approve' },
    ],
  },
];

/* ── Constants ──────────────────────────── */

const FORMAT_ICONS = { Reel: Video, Static: Image, Carousel: FileText };

const PILLARS = ['Educate', 'Authority', 'Conversion', 'Showcase', 'Community'];

const PILLAR_COLORS: Record<string, string> = {
  Educate: 'bg-blue-500/20 text-blue-400 border-blue-700/30',
  Authority: 'bg-purple-500/20 text-purple-400 border-purple-700/30',
  Conversion: 'bg-amber-500/20 text-amber-400 border-amber-700/30',
  Showcase: 'bg-emerald-500/20 text-emerald-400 border-emerald-700/30',
  Community: 'bg-pink-500/20 text-pink-400 border-pink-700/30',
};

const STATUS_CONFIG: Record<ContentStatus, { color: string; icon: typeof Clock; label: string }> = {
  Draft: { color: 'bg-slate-700/50 text-slate-400', icon: Pencil, label: 'Draft' },
  Submitted: { color: 'bg-blue-500/20 text-blue-400', icon: Send, label: 'Submitted' },
  'In Review': { color: 'bg-amber-500/20 text-amber-400', icon: Eye, label: 'In Review' },
  'Changes Requested': { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Changes Req.' },
  Approved: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Approved' },
  Scheduled: { color: 'bg-purple-500/20 text-purple-400', icon: Clock, label: 'Scheduled' },
  Published: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Published' },
};

const STATUS_PIPELINE: ContentStatus[] = ['Draft', 'Submitted', 'In Review', 'Changes Requested', 'Approved', 'Scheduled', 'Published'];

const FORMAT_SPECS: Record<string, { specs: string[]; tips: string[]; seo: string }> = {
  Reel: {
    specs: ['9:16 vertical', '15-90s (sweet spot 15-30s)', 'Hook in first 1.5s', 'Cover image matters for grid', 'Trending audio boosts reach 30%'],
    tips: ['Use text overlays for accessibility', 'Pattern interrupt in first 2s', 'End with clear CTA', 'Cross-post to FB Reels (native preferred)'],
    seo: 'Keywords in caption, trending audio, 3-5 niche hashtags. Saves > Shares > Comments for algorithm.',
  },
  Carousel: {
    specs: ['4:5 or 1:1 ratio', '5-10 slides optimal', 'Slide 1 = hook, Last = CTA', 'Consistent visual style across slides'],
    tips: ['Educational carousels get 1.4x more reach', 'Use "swipe for more" CTA on slide 1', 'Each slide should stand alone', 'Save-worthy content = algorithm boost'],
    seo: 'Alt-text on each slide, keyword-rich caption, 3-5 hashtags. Carousel shares signal high value to algorithm.',
  },
  Static: {
    specs: ['4:5 preferred (takes more feed space)', '1080x1350px', 'Max 30 chars headline on image', 'CTA should be visible in image'],
    tips: ['Faces in images boost engagement 38%', 'Bright, high-contrast colors stop the scroll', 'Alt-text is critical for SEO', 'Less text on image = better reach'],
    seo: 'Alt-text mandatory, keyword caption, location tags. Clean images with faces perform best.',
  },
};

/* ── Component ──────────────────────────── */

export default function ContentDevPage() {
  const { selectedBrand } = useBrandProject();
  const isMounted = useRef(false);
  const [cards, setCards] = useState<ContentCard[]>(SAMPLE_CARDS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showVisualBrief, setShowVisualBrief] = useState<string | null>(null);
  const [showFormatRef, setShowFormatRef] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'All'>('All');

  // Review panel
  const [reviewCardId, setReviewCardId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [aiReviewing, setAiReviewing] = useState(false);

  // Scheduling
  const [scheduleCardId, setScheduleCardId] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('19:00');

  // Draft creation
  const [showNewDraftModal, setShowNewDraftModal] = useState(false);
  const [draftForm, setDraftForm] = useState({
    platform: 'IG' as 'IG' | 'FB' | 'Both',
    format: 'Static' as 'Reel' | 'Static' | 'Carousel',
    title: '',
    pillar: 'Educate' as string,
    objective: '',
    keyMessage: '',
    copyHook: '',
    cta: '',
    caption: '',
    hashtags: '' as string,
  });
  const [savingDraft, setSavingDraft] = useState(false);

  /* ── Autosave ──────────────────────────── */
  const { autosave, manualSave, status: saveStatus } = useAutosave({
    onSave: async (data) => {
      if (!selectedBrand) return;
      await fetch(`/api/social/content-dev/${selectedBrand.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  });

  // Load saved drafts on brand change
  useEffect(() => {
    if (!selectedBrand) return;
    isMounted.current = false;
    async function load() {
      try {
        const res = await fetch(`/api/social/content-dev/${selectedBrand!.id}`);
        if (res.ok) {
          const { data } = await res.json();
          if (data && data.length > 0) {
            setCards(data.length > 0 ? data : SAMPLE_CARDS);
          }
        }
      } catch { /* silent */ }
      isMounted.current = true;
    }
    load();
  }, [selectedBrand?.id]);

  // Auto-save cards when they change
  useEffect(() => {
    if (!isMounted.current || !selectedBrand) return;
    autosave(cards);
  }, [cards]);

  // Drafts state
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const filteredCards = statusFilter === 'All' ? cards : cards.filter(c => c.status === statusFilter);

  /* ── Load drafts on brand change ────────────── */

  useEffect(() => {
    if (selectedBrand) {
      loadDrafts();
    }
  }, [selectedBrand?.id]);

  /* ── Status actions ────────────────────── */

  function updateCardStatus(id: string, newStatus: ContentStatus) {
    setCards(cards.map(c => c.id === id ? { ...c, status: newStatus } : c));
  }

  function addReview(cardId: string, text: string, action: ReviewComment['action']) {
    const review: ReviewComment = {
      id: `rev-${Date.now()}`,
      author: 'You',
      role: 'Reviewer',
      text,
      timestamp: new Date().toISOString(),
      action,
    };
    setCards(cards.map(c => {
      if (c.id !== cardId) return c;
      const newStatus: ContentStatus = action === 'approve' ? 'Approved' : action === 'request_changes' ? 'Changes Requested' : c.status;
      return { ...c, reviews: [...c.reviews, review], status: newStatus };
    }));
    setReviewText('');
  }

  function scheduleCard(id: string) {
    if (!schedDate) return;
    setCards(cards.map(c => c.id === id ? { ...c, status: 'Scheduled' as ContentStatus, scheduledDate: schedDate, scheduledTime: schedTime } : c));
    setScheduleCardId(null);
  }

  /* ── AI Review ──────────────────────────── */

  const handleAiReview = useCallback(async (card: ContentCard) => {
    if (!selectedBrand) return;
    setAiReviewing(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `As Creative Director, review this content card and provide feedback on brand alignment, copy quality, platform optimization, and commercial impact.

**Post**: ${card.id}
**Platform**: ${card.platform} | **Format**: ${card.format} | **Pillar**: ${card.pillar}
**Objective**: ${card.objective}
**Core Message**: ${card.coreMessage}
**Hook Options**: ${card.hook.join(' | ')}
**Caption**: ${card.caption}
**CTA**: ${card.cta}
**Hashtags**: ${card.hashtags.join(', ')}
${card.scenes ? `**Scenes**: ${card.scenes.map((s, i) => `S${i + 1}: ${s.text} (on-screen: ${s.onScreen})`).join(', ')}` : ''}
${card.slides ? `**Slides**: ${card.slides.map((s, i) => `S${i + 1}: ${s.headline}`).join(', ')}` : ''}

Provide your review as: 1) Overall assessment (1-2 lines), 2) What works, 3) What needs improvement, 4) Specific suggestions. Be direct and constructive.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Content Development',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          addReview(card.id, data.message, 'comment');
          updateCardStatus(card.id, 'In Review');
        }
      }
    } catch { /* silent */ }
    setAiReviewing(false);
  }, [selectedBrand, cards]);

  /* ── AI Expand All ──────────────────────── */

  const handleAiExpand = useCallback(async () => {
    if (!selectedBrand) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate 2 new content cards for "${selectedBrand.name}" as a JSON array.
Each card should have: id, platform (IG/FB/Both), format (Reel/Static/Carousel), date (2026-03-XX), pillar (Educate/Authority/Showcase/Conversion/Community), campaign, objective, audienceInsight, coreMessage, hook (array of 2 strings), talkingPoints (array of 3 strings), caption, hashtags (array), cta.
For Reels add: scenes (array of {text, onScreen}), duration.
For Carousels add: slides (array of {headline, points}).
Return ONLY the JSON array.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Content Development',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message || '';
        const jsonMatch = msg.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const newCards: ContentCard[] = parsed.map((c: Partial<ContentCard>) => ({
            ...c,
            id: c.id || `ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            status: 'Draft' as ContentStatus,
            reviews: [],
            visualBrief: c.visualBrief || {
              visualId: `${c.id || 'new'}-VIS`, formatRatio: c.format === 'Reel' ? '9:16' : '4:5',
              visualType: 'TBD', subjectComposition: 'TBD', brandStyleMood: 'TBD',
              brandAssets: 'Logo + brand colors', textOnImage: 'TBD', specialNotes: '',
            },
          }));
          setCards(prev => [...prev, ...newCards]);
        }
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand]);

  /* ── Load drafts on brand change ────────────── */

  useCallback(() => {
    if (selectedBrand) {
      loadDrafts();
    }
  }, [selectedBrand?.id])();

  async function loadDrafts() {
    setLoadingDrafts(true);
    try {
      // For now using mock data since we don't have taskId
      // In production: const res = await fetch(`/api/social/drafts/${taskId}`);
      setDrafts([]);
    } catch (err) {
      console.error('Error loading drafts:', err);
    }
    setLoadingDrafts(false);
  }

  async function handleCreateDraft() {
    if (!selectedBrand || !draftForm.title || !draftForm.objective) {
      alert('Please fill in title and objective');
      return;
    }

    setSavingDraft(true);
    try {
      // For now, simulate adding draft locally
      // In production: const res = await fetch('/api/social/drafts', { method: 'POST', ... });
      const newDraft = {
        draft_id: `draft-${Date.now()}`,
        id: `draft-${Date.now()}`,
        ...draftForm,
        hashtags: draftForm.hashtags.split(',').map(h => h.trim()).filter(h => h),
        status: 'draft',
        syncedToCalendar: false,
        createdAt: new Date(),
      };
      setDrafts([newDraft, ...drafts]);
      setDraftForm({
        platform: 'IG',
        format: 'Static',
        title: '',
        pillar: 'Educate',
        objective: '',
        keyMessage: '',
        copyHook: '',
        cta: '',
        caption: '',
        hashtags: '',
      });
      setShowNewDraftModal(false);
    } catch (err) {
      console.error('Error creating draft:', err);
      alert('Failed to create draft');
    }
    setSavingDraft(false);
  }

  /* ── Status counts ─────────────────────── */

  const statusCounts = STATUS_PIPELINE.reduce((acc, s) => {
    acc[s] = cards.filter(c => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pencil className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Content Development</h1>
          </div>
          <p className="text-sm text-slate-400">
            Full content cards with copy, visual briefs, review workflow, and scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus.lastSaved && !saveStatus.hasUnsaved && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Autosaved
            </span>
          )}
          {saveStatus.hasUnsaved && <span className="text-[10px] text-amber-400">Unsaved...</span>}
          <button
            disabled={!selectedBrand || saveStatus.isSaving}
            onClick={manualSave}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700/30 bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            {saveStatus.isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {saveStatus.isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            disabled={!selectedBrand || generating}
            onClick={handleAiExpand}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Generate Cards
          </button>
        </div>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand for brand-aligned content development.</p>
        </div>
      )}

      {/* ── Approval Pipeline Visualization ─── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content Pipeline</h2>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_PIPELINE.map((status, i) => {
            const config = STATUS_CONFIG[status];
            const count = statusCounts[status] || 0;
            const isActive = statusFilter === status;
            return (
              <div key={status} className="flex items-center">
                <button
                  onClick={() => setStatusFilter(isActive ? 'All' : status)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    isActive ? config.color + ' ring-1 ring-white/10' : 'text-slate-500 hover:bg-white/[0.03]'
                  }`}
                >
                  <config.icon className="w-3 h-3" />
                  {config.label}
                  {count > 0 && (
                    <span className={`px-1 py-0.5 rounded text-[9px] ${isActive ? 'bg-white/10' : 'bg-slate-700/50'}`}>
                      {count}
                    </span>
                  )}
                </button>
                {i < STATUS_PIPELINE.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-700 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content Cards ─────────────────── */}
      <div className="space-y-4">
        {filteredCards.map(card => {
          const expanded = expandedId === card.id;
          const briefOpen = showVisualBrief === card.id;
          const formatRefOpen = showFormatRef === card.id;
          const FormatIcon = FORMAT_ICONS[card.format] || Image;
          const pillarClass = PILLAR_COLORS[card.pillar] || PILLAR_COLORS.Educate;
          const statusConf = STATUS_CONFIG[card.status];

          return (
            <div key={card.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
              {/* Card header */}
              <button
                onClick={() => setExpandedId(expanded ? null : card.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <FormatIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-mono text-slate-500">{card.date}</span>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs font-medium text-slate-300">{card.platform}</span>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-300">{card.format}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${pillarClass}`}>{card.pillar}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusConf.color} flex items-center gap-1`}>
                      <statusConf.icon className="w-2.5 h-2.5" />
                      {statusConf.label}
                    </span>
                    {card.scheduledDate && (
                      <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {card.scheduledDate} {card.scheduledTime}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">{card.id}</h3>
                  <p className="text-xs text-slate-400 truncate">{card.coreMessage}</p>
                </div>
                {card.reviews.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" />
                    {card.reviews.length}
                  </span>
                )}
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

                  {/* Format Best Practices Reference */}
                  <div>
                    <button
                      onClick={() => setShowFormatRef(formatRefOpen ? null : card.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {card.format} Best Practices
                      {formatRefOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {formatRefOpen && FORMAT_SPECS[card.format] && (
                      <div className="mt-2 bg-blue-900/10 border border-blue-700/20 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-[10px] uppercase text-blue-400 font-semibold mb-1">Specs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {FORMAT_SPECS[card.format].specs.map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-blue-400 font-semibold mb-1">Tips</p>
                          <ul className="space-y-0.5">
                            {FORMAT_SPECS[card.format].tips.map((t, i) => (
                              <li key={i} className="text-[10px] text-slate-400">• {t}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-blue-400 font-semibold mb-1">SEO & Algorithm</p>
                          <p className="text-[10px] text-slate-400">{FORMAT_SPECS[card.format].seo}</p>
                        </div>
                      </div>
                    )}
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

                  {/* Nano Banana Visual Brief */}
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

                  {/* ── Review & Approval Section ──── */}
                  <div className="border-t border-slate-700/30 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <h4 className="text-xs font-semibold text-white">Review & Approval</h4>
                    </div>

                    {/* Existing reviews */}
                    {card.reviews.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {card.reviews.map(rev => (
                          <div key={rev.id} className={`rounded-lg p-3 border ${
                            rev.action === 'approve' ? 'bg-emerald-900/10 border-emerald-700/20' :
                            rev.action === 'request_changes' ? 'bg-red-900/10 border-red-700/20' :
                            'bg-white/[0.02] border-slate-700/30'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-white">{rev.author}</span>
                              <span className="text-[10px] text-slate-500">{rev.role}</span>
                              <span className={`text-[9px] px-1 py-0.5 rounded ${
                                rev.action === 'approve' ? 'bg-emerald-500/20 text-emerald-400' :
                                rev.action === 'request_changes' ? 'bg-red-500/20 text-red-400' :
                                'bg-slate-700/50 text-slate-400'
                              }`}>
                                {rev.action === 'approve' ? 'Approved' : rev.action === 'request_changes' ? 'Changes Requested' : 'Comment'}
                              </span>
                              <span className="text-[10px] text-slate-600 ml-auto">
                                {new Date(rev.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 whitespace-pre-wrap">{rev.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add review */}
                    {reviewCardId === card.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={reviewText}
                          onChange={e => setReviewText(e.target.value)}
                          rows={3}
                          placeholder="Write your review feedback..."
                          className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { addReview(card.id, reviewText, 'approve'); setReviewCardId(null); }}
                            disabled={!reviewText.trim()}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => { addReview(card.id, reviewText, 'request_changes'); setReviewCardId(null); }}
                            disabled={!reviewText.trim()}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Request Changes
                          </button>
                          <button
                            onClick={() => { addReview(card.id, reviewText, 'comment'); setReviewCardId(null); }}
                            disabled={!reviewText.trim()}
                            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" /> Comment
                          </button>
                          <button onClick={() => setReviewCardId(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-white">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setReviewCardId(card.id)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> Add Review
                        </button>
                        <button
                          onClick={() => handleAiReview(card)}
                          disabled={!selectedBrand || aiReviewing}
                          className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 disabled:opacity-40 transition-colors flex items-center gap-1"
                        >
                          {aiReviewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI Director Review
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Actions ──────────────────── */}
                  <div className="flex gap-2 pt-3 border-t border-slate-700/30 flex-wrap">
                    {card.status === 'Draft' && (
                      <button
                        onClick={() => updateCardStatus(card.id, 'Submitted')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Submit for Review
                      </button>
                    )}
                    {card.status === 'Changes Requested' && (
                      <button
                        onClick={() => updateCardStatus(card.id, 'Submitted')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Resubmit
                      </button>
                    )}
                    {card.status === 'Submitted' && (
                      <button
                        onClick={() => updateCardStatus(card.id, 'In Review')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Start Review
                      </button>
                    )}
                    {card.status === 'Approved' && (
                      <button
                        onClick={() => { setScheduleCardId(card.id); setSchedDate(card.date); }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" /> Schedule
                      </button>
                    )}
                    {card.status === 'Scheduled' && (
                      <button
                        onClick={() => updateCardStatus(card.id, 'Published')}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Mark Published
                      </button>
                    )}
                    <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 2000); }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-16">
          <Pencil className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {statusFilter !== 'All' ? `No content cards with status "${statusFilter}"` : 'No content cards yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Add posts in the Content Calendar first, then expand them here.
          </p>
        </div>
      )}

      {/* ── Draft Pool (unpublished posts) ──── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Draft Pool</h2>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
              {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            disabled={!selectedBrand}
            onClick={() => setShowNewDraftModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Draft Post
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Posts in the draft pool are saved for later use but not yet scheduled in the calendar. Promote them to add a specific publish date.
        </p>

        {drafts.length === 0 ? (
          <div className="bg-white/[0.02] rounded-lg p-6 border border-slate-700/20 text-center">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No draft posts yet</p>
            <p className="text-[10px] text-slate-500 mt-1">Click "New Draft Post" to create your first draft</p>
          </div>
        ) : (
          <div className="space-y-2">
            {drafts.map(draft => (
              <div key={draft.id} className="bg-white/[0.02] rounded-lg p-3 border border-slate-700/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-white">{draft.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-slate-400">{draft.platform}</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400">{draft.format}</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${PILLAR_COLORS[draft.pillar]}`}>{draft.pillar}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-white/[0.05] rounded text-slate-400 hover:text-white text-xs transition-colors">
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 text-xs transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── New Draft Post Modal ────────────── */}
      {showNewDraftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 sticky top-0 bg-slate-900">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Create New Draft Post
              </h3>
              <button onClick={() => setShowNewDraftModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Platform & Format Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Platform</label>
                  <select
                    value={draftForm.platform}
                    onChange={(e) => setDraftForm({ ...draftForm, platform: e.target.value as any })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    <option value="IG">Instagram</option>
                    <option value="FB">Facebook</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Format</label>
                  <select
                    value={draftForm.format}
                    onChange={(e) => setDraftForm({ ...draftForm, format: e.target.value as any })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    <option value="Static">Static</option>
                    <option value="Carousel">Carousel</option>
                    <option value="Reel">Reel</option>
                  </select>
                </div>
              </div>

              {/* Pillar & Objective Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Pillar</label>
                  <select
                    value={draftForm.pillar}
                    onChange={(e) => setDraftForm({ ...draftForm, pillar: e.target.value })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  >
                    {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Objective</label>
                  <input
                    type="text"
                    placeholder="e.g. Awareness, Engagement"
                    value={draftForm.objective}
                    onChange={(e) => setDraftForm({ ...draftForm, objective: e.target.value })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Post Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Why AI Agents Save 10x Time"
                  value={draftForm.title}
                  onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                />
              </div>

              {/* Key Message */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Core Message</label>
                <textarea
                  placeholder="Main message for this post"
                  value={draftForm.keyMessage}
                  onChange={(e) => setDraftForm({ ...draftForm, keyMessage: e.target.value })}
                  rows={2}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30 resize-none"
                />
              </div>

              {/* Copy Hook */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Hook / Opening Line</label>
                <input
                  type="text"
                  placeholder="First line that grabs attention"
                  value={draftForm.copyHook}
                  onChange={(e) => setDraftForm({ ...draftForm, copyHook: e.target.value })}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Caption / Copy</label>
                <textarea
                  placeholder="Full caption text"
                  value={draftForm.caption}
                  onChange={(e) => setDraftForm({ ...draftForm, caption: e.target.value })}
                  rows={3}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30 resize-none"
                />
              </div>

              {/* CTA & Hashtags Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">CTA</label>
                  <input
                    type="text"
                    placeholder="e.g. Learn more, Save this"
                    value={draftForm.cta}
                    onChange={(e) => setDraftForm({ ...draftForm, cta: e.target.value })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-2 block font-semibold">Hashtags</label>
                  <input
                    type="text"
                    placeholder="Comma-separated: #tag1, #tag2"
                    value={draftForm.hashtags}
                    onChange={(e) => setDraftForm({ ...draftForm, hashtags: e.target.value })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700/50">
              <button onClick={() => setShowNewDraftModal(false)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleCreateDraft}
                disabled={savingDraft || !draftForm.title}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                {savingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Modal ──────────────────── */}
      {scheduleCardId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Schedule Content
              </h3>
              <button onClick={() => setScheduleCardId(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Publish Date</label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Publish Time (HKT)</label>
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/30"
                />
                <p className="text-[10px] text-slate-600 mt-1">Optimal: IG 7-9PM, FB 12-2PM, TikTok 6-10PM</p>
              </div>

              {/* Delivery checklist */}
              <div className="border-t border-slate-700/30 pt-3">
                <p className="text-[10px] uppercase text-slate-500 mb-2 font-semibold">Pre-Publish Checklist</p>
                {['Caption proofread & approved', 'Visual assets finalized', 'Hashtags verified (3-5 niche)', 'CTA link tested', 'Alt-text added', 'Boost/ad plan confirmed'].map(item => (
                  <label key={item} className="flex items-center gap-2 py-1 cursor-pointer group">
                    <input type="checkbox" className="rounded border-slate-600 bg-white/[0.02] text-purple-500 focus:ring-purple-500/20" />
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700/50">
              <button onClick={() => setScheduleCardId(null)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={() => scheduleCard(scheduleCardId)}
                disabled={!schedDate}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <Clock className="w-3 h-3" /> Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
