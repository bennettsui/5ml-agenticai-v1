'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Target, Loader2, AlertCircle, TrendingUp, Users, Globe, Megaphone,
  Sparkles, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2,
  Clock, Hash, BarChart3, MessageSquare, Palette, Save, RotateCcw, CheckCircle,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';
import { useAutosave } from '@/lib/useAutosave';

/* ── Types ──────────────────────────────── */

interface PlatformStrategy {
  id: string;
  platform: string;
  priority: 'Primary' | 'Secondary' | 'Experimental';
  audience: string;
  contentTypes: string;
  postingFrequency: string;
  goals: string;
  notes: string;
}

interface ContentPillar {
  id: string;
  name: string;
  description: string;
  percentage: string;
  examples: string;
  color: string;
}

interface KPI {
  id: string;
  metric: string;
  current: string;
  target: string;
  timeframe: string;
  platform: string;
}

type StrategySection = 'audit' | 'platforms' | 'pillars' | 'goals' | 'cadence' | 'voice';

/* ── Sample data ────────────────────────── */

const SAMPLE_PLATFORMS: PlatformStrategy[] = [
  {
    id: '1', platform: 'Instagram', priority: 'Primary',
    audience: 'Age 25-40, lifestyle-focused, visual learners',
    contentTypes: 'Reels (40%), Carousels (35%), Static (15%), Stories (10%)',
    postingFrequency: '5-7x per week',
    goals: 'Brand awareness, engagement, community building',
    notes: 'Reels algorithm favors 15-30s content. Carousels get highest saves.',
  },
  {
    id: '2', platform: 'Facebook', priority: 'Secondary',
    audience: 'Age 30-55, business professionals, community groups',
    contentTypes: 'Link posts (30%), Carousels (30%), Video (25%), Events (15%)',
    postingFrequency: '3-4x per week',
    goals: 'Traffic, lead generation, community management',
    notes: 'Focus on groups and event marketing. Cross-post IG content with adaptations.',
  },
];

const SAMPLE_PILLARS: ContentPillar[] = [
  { id: '1', name: 'Educate', description: 'Tips, how-tos, industry insights that position the brand as a knowledge leader', percentage: '30%', examples: 'Quick tip reels, infographic carousels, "Did you know" posts', color: 'blue' },
  { id: '2', name: 'Authority', description: 'Case studies, testimonials, data-driven proof of expertise', percentage: '20%', examples: 'Client result carousels, before/after reels, metric breakdowns', color: 'purple' },
  { id: '3', name: 'Showcase', description: 'Product/service features, behind-the-scenes, team highlights', percentage: '20%', examples: 'Product demos, team day-in-life, office/process tours', color: 'emerald' },
  { id: '4', name: 'Conversion', description: 'Direct offers, CTAs, limited-time promotions, lead magnets', percentage: '15%', examples: 'Promo graphics, free audit offers, pricing announcements', color: 'amber' },
  { id: '5', name: 'Community', description: 'UGC, polls, Q&A, engagement-first content that builds relationships', percentage: '15%', examples: 'Polls, "This or that", user spotlights, Q&A sessions', color: 'pink' },
];

const SAMPLE_KPIS: KPI[] = [
  { id: '1', metric: 'Follower Growth', current: '--', target: '+15% MoM', timeframe: 'Monthly', platform: 'All' },
  { id: '2', metric: 'Engagement Rate', current: '--', target: '> 4.5%', timeframe: 'Monthly', platform: 'Instagram' },
  { id: '3', metric: 'Post Reach', current: '--', target: '> 10K avg', timeframe: 'Per post', platform: 'Instagram' },
  { id: '4', metric: 'Website Traffic from Social', current: '--', target: '+25% QoQ', timeframe: 'Quarterly', platform: 'All' },
  { id: '5', metric: 'Lead Generation', current: '--', target: '> 20 leads/mo', timeframe: 'Monthly', platform: 'Facebook' },
  { id: '6', metric: 'Content Production Time', current: '--', target: '< 10 hrs/week', timeframe: 'Weekly', platform: 'All' },
];

/* ── Section config ─────────────────────── */

const SECTIONS: { id: StrategySection; label: string; icon: typeof Target; desc: string }[] = [
  { id: 'audit', label: 'Social Audit', icon: BarChart3, desc: 'Current state assessment' },
  { id: 'platforms', label: 'Platform Strategy', icon: Globe, desc: 'Where & why' },
  { id: 'pillars', label: 'Content Pillars', icon: Hash, desc: 'What to post' },
  { id: 'goals', label: 'Goals & KPIs', icon: TrendingUp, desc: 'Measurable targets' },
  { id: 'cadence', label: 'Posting Cadence', icon: Clock, desc: 'When to post' },
  { id: 'voice', label: 'Brand Voice', icon: Palette, desc: 'How to sound' },
];

const PILLAR_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/15 border-blue-700/30 text-blue-400',
  purple: 'bg-purple-500/15 border-purple-700/30 text-purple-400',
  emerald: 'bg-emerald-500/15 border-emerald-700/30 text-emerald-400',
  amber: 'bg-amber-500/15 border-amber-700/30 text-amber-400',
  pink: 'bg-pink-500/15 border-pink-700/30 text-pink-400',
};

/* ── Component ──────────────────────────── */

export default function SocialStrategyPage() {
  const { selectedBrand } = useBrandProject();
  const isMounted = useRef(false);
  const [activeSection, setActiveSection] = useState<StrategySection>('audit');
  const [generating, setGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);

  // Audit state
  const [auditSummary, setAuditSummary] = useState('');
  const [currentPresence, setCurrentPresence] = useState('');
  const [swot, setSwot] = useState({ strengths: '', weaknesses: '', opportunities: '', threats: '' });

  // Platform state
  const [platforms, setPlatforms] = useState<PlatformStrategy[]>(SAMPLE_PLATFORMS);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  // Pillars state
  const [pillars, setPillars] = useState<ContentPillar[]>(SAMPLE_PILLARS);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // Goals state
  const [kpis, setKpis] = useState<KPI[]>(SAMPLE_KPIS);

  // Cadence state
  const [cadenceOverview, setCadenceOverview] = useState('');
  const [weeklyPlan, setWeeklyPlan] = useState('');

  // Voice state
  const [voiceTone, setVoiceTone] = useState('');
  const [dosDonts, setDosDonts] = useState('');
  const [sampleCaptions, setSampleCaptions] = useState('');

  // AI Analysis preview (for structured sections)
  const [aiPreview, setAiPreview] = useState('');
  const [aiPreviewSection, setAiPreviewSection] = useState<StrategySection | null>(null);

  /* ── Autosave ──────────────────────────── */

  const { autosave, manualSave, status: saveStatus } = useAutosave({
    onSave: async (data) => {
      if (!selectedBrand) return;
      await fetch(`/api/social/strategy/${selectedBrand.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: (selectedBrand as Record<string, unknown>).projectId, ...(data as object) }),
      });
    },
  });

  // Load saved data when brand changes
  useEffect(() => {
    if (!selectedBrand) return;
    isMounted.current = false;
    async function load() {
      try {
        const res = await fetch(`/api/social/strategy/${selectedBrand!.id}`);
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setAuditSummary(data.objectives || '');
            setCurrentPresence(data.target_audiences || '');
            try { setPlatforms(JSON.parse(data.channel_mix) || SAMPLE_PLATFORMS); } catch { setPlatforms(SAMPLE_PLATFORMS); }
            try { setPillars(JSON.parse(data.content_pillars) || SAMPLE_PILLARS); } catch { setPillars(SAMPLE_PILLARS); }
            try {
              const cd = JSON.parse(data.posting_cadence || '{}');
              setCadenceOverview(cd.overview || ''); setWeeklyPlan(cd.weeklyPlan || '');
            } catch { /* ignore */ }
            try {
              const md = JSON.parse(data.media_approach || '{}');
              setVoiceTone(md.voiceTone || ''); setDosDonts(md.dosDonts || ''); setSampleCaptions(md.sampleCaptions || '');
            } catch { /* ignore */ }
            try { setKpis(JSON.parse(data.kpis) || SAMPLE_KPIS); } catch { setKpis(SAMPLE_KPIS); }
            try {
              const sw = JSON.parse(data.assumptions || '{}');
              setSwot({ strengths: sw.strengths || '', weaknesses: sw.weaknesses || '', opportunities: sw.opportunities || '', threats: sw.threats || '' });
            } catch { /* ignore */ }
          }
        }
      } catch { /* silent */ }
      isMounted.current = true;
    }
    load();
  }, [selectedBrand?.id]);

  // Auto-save whenever key state changes (debounced via useAutosave)
  useEffect(() => {
    if (!isMounted.current || !selectedBrand) return;
    autosave({
      objectives: auditSummary,
      targetAudiences: currentPresence,
      channelMix: JSON.stringify(platforms),
      contentPillars: JSON.stringify(pillars),
      postingCadence: JSON.stringify({ overview: cadenceOverview, weeklyPlan }),
      mediaApproach: JSON.stringify({ voiceTone, dosDonts, sampleCaptions }),
      kpis: JSON.stringify(kpis),
      assumptions: JSON.stringify(swot),
      risks: '',
    });
  }, [auditSummary, currentPresence, platforms, pillars, cadenceOverview, weeklyPlan, voiceTone, dosDonts, sampleCaptions, kpis, swot]);

  /* ── AI Generation ─────────────────────── */

  const generateSection = useCallback(async (section: StrategySection) => {
    if (!selectedBrand) return;
    setGeneratingSection(section);

    const prompts: Record<StrategySection, string> = {
      audit: `Perform a social media audit for "${selectedBrand.name}". Provide: 1) Current social presence summary 2) SWOT analysis (strengths, weaknesses, opportunities, threats) for their social media. Format as structured text.`,
      platforms: `Recommend a platform strategy for "${selectedBrand.name}". For each platform (Instagram, Facebook, LinkedIn, TikTok, YouTube), suggest priority level, target audience on that platform, content types and mix, posting frequency, and key goals.`,
      pillars: `Define 5 content pillars for "${selectedBrand.name}" social media strategy: Educate, Authority, Showcase, Conversion, Community. For each pillar: describe it, suggest percentage allocation, and give 3 content examples.`,
      goals: `Set social media KPIs for "${selectedBrand.name}". Include: follower growth targets, engagement rate targets, reach/impressions goals, website traffic from social, lead generation, and content efficiency metrics. Provide current baseline and target for each.`,
      cadence: `Create a weekly posting cadence for "${selectedBrand.name}". Include: overview of posting rhythm, best times per platform, weekly content plan (Mon-Sun with platform, format, pillar for each slot).`,
      voice: `Define the brand voice and tone guidelines for "${selectedBrand.name}" social media. Include: voice characteristics (3-5 adjectives), tone variations by context, language guidelines (formal vs casual), do's and don'ts, and 3 sample captions showing the voice.`,
    };

    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[section] }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Social Strategy',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message || '';
        // Place generated content into the appropriate text fields
        switch (section) {
          case 'audit': setAuditSummary(msg); break;
          case 'cadence': setCadenceOverview(msg); break;
          case 'voice': setVoiceTone(msg); break;
          default: setAiPreview(msg); setAiPreviewSection(section); break;
        }
      }
    } catch { /* silent */ }
    setGeneratingSection(null);
  }, [selectedBrand]);

  const generateFullStrategy = useCallback(async () => {
    if (!selectedBrand) return;
    setGenerating(true);
    // Generate each section sequentially
    for (const section of ['audit', 'cadence', 'voice'] as StrategySection[]) {
      await generateSection(section);
    }
    setGenerating(false);
  }, [selectedBrand, generateSection]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Social Strategy</h1>
          </div>
          <p className="text-sm text-slate-400">
            Comprehensive social media strategy — one-off creation or annual review
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus.lastSaved && !saveStatus.hasUnsaved && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Autosaved
            </span>
          )}
          {saveStatus.hasUnsaved && (
            <span className="text-[10px] text-amber-400">Unsaved changes...</span>
          )}
          <button
            disabled={!selectedBrand || saveStatus.isSaving}
            onClick={manualSave}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {saveStatus.isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {saveStatus.isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            disabled={!selectedBrand || generating}
            onClick={generateFullStrategy}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? 'Generating...' : 'AI Generate Strategy'}
          </button>
        </div>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand from the sidebar to generate a strategy.</p>
        </div>
      )}

      {/* Section navigation pills */}
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-700/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-purple-400' : 'text-slate-500'}`} />
              {s.label}
              <span className={`text-[9px] ${active ? 'text-purple-400/60' : 'text-slate-600'}`}>{s.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION: Social Audit                       */}
      {/* ═══════════════════════════════════════════ */}
      {activeSection === 'audit' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Social Media Audit
            </h2>
            <button
              disabled={!selectedBrand || generatingSection === 'audit'}
              onClick={() => generateSection('audit')}
              className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 flex items-center gap-1 disabled:opacity-40"
            >
              {generatingSection === 'audit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Audit
            </button>
          </div>

          {/* Current Presence */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-2">Current Social Presence</h3>
            <textarea
              value={currentPresence}
              onChange={e => setCurrentPresence(e.target.value)}
              placeholder="List current social accounts, follower counts, posting frequency, avg engagement rate per platform..."
              rows={3}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
            />
          </div>

          {/* SWOT */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'strengths', label: 'Strengths', color: 'emerald', placeholder: 'Strong visual brand, loyal community, unique voice...' },
              { key: 'weaknesses', label: 'Weaknesses', color: 'red', placeholder: 'Inconsistent posting, low video output, weak FB presence...' },
              { key: 'opportunities', label: 'Opportunities', color: 'blue', placeholder: 'Reels trending, competitor gaps, new platform features...' },
              { key: 'threats', label: 'Threats', color: 'amber', placeholder: 'Algorithm changes, market saturation, budget constraints...' },
            ].map(item => (
              <div key={item.key} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className={`text-xs font-semibold text-${item.color}-400 mb-2`}>{item.label}</h3>
                <textarea
                  value={swot[item.key as keyof typeof swot]}
                  onChange={e => setSwot({ ...swot, [item.key]: e.target.value })}
                  placeholder={item.placeholder}
                  rows={3}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                />
              </div>
            ))}
          </div>

          {/* Audit Summary */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-2">Audit Summary & Recommendations</h3>
            <textarea
              value={auditSummary}
              onChange={e => setAuditSummary(e.target.value)}
              placeholder="Key findings, gaps identified, quick wins, and priority recommendations..."
              rows={5}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION: Platform Strategy                   */}
      {/* ═══════════════════════════════════════════ */}
      {activeSection === 'platforms' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Platform Strategy
            </h2>
            <div className="flex gap-2">
              <button
                disabled={!selectedBrand || generatingSection === 'platforms'}
                onClick={() => generateSection('platforms')}
                className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 flex items-center gap-1 disabled:opacity-40"
              >
                {generatingSection === 'platforms' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Analyze
              </button>
              <button
                onClick={() => setPlatforms([...platforms, {
                  id: Date.now().toString(), platform: '', priority: 'Secondary',
                  audience: '', contentTypes: '', postingFrequency: '',
                  goals: '', notes: '',
                }])}
                className="px-2.5 py-1 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Platform
              </button>
            </div>
          </div>

          {/* AI Analysis Preview */}
          {aiPreviewSection === 'platforms' && aiPreview && (
            <div className="bg-purple-900/15 border border-purple-700/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <h3 className="text-xs font-semibold text-purple-400">AI Analysis — Review & Apply</h3>
                </div>
                <button onClick={() => { setAiPreview(''); setAiPreviewSection(null); }} className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.05]">
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">{aiPreview}</p>
              <p className="text-[10px] text-slate-500 mt-3">Review the analysis above and manually update the platform forms below with relevant insights.</p>
            </div>
          )}

          <div className="space-y-2">
            {platforms.map((plat, idx) => {
              const isExpanded = expandedPlatform === plat.id;
              const priorityColors = {
                Primary: 'bg-emerald-500/15 text-emerald-400 border-emerald-700/30',
                Secondary: 'bg-blue-500/15 text-blue-400 border-blue-700/30',
                Experimental: 'bg-amber-500/15 text-amber-400 border-amber-700/30',
              };
              return (
                <div key={plat.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedPlatform(isExpanded ? null : plat.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[10px] text-slate-500 font-mono w-5">{idx + 1}</span>
                    <span className="flex-1 text-sm text-white font-medium">{plat.platform || 'New Platform'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${priorityColors[plat.priority]}`}>
                      {plat.priority}
                    </span>
                    {plat.postingFrequency && <span className="text-[10px] text-slate-500 hidden md:block">{plat.postingFrequency}</span>}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Platform</label>
                          <input
                            value={plat.platform}
                            onChange={e => { const p = [...platforms]; p[idx] = { ...p[idx], platform: e.target.value }; setPlatforms(p); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30"
                            placeholder="Instagram, Facebook, TikTok..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Priority</label>
                          <select
                            value={plat.priority}
                            onChange={e => { const p = [...platforms]; p[idx] = { ...p[idx], priority: e.target.value as PlatformStrategy['priority'] }; setPlatforms(p); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/30"
                          >
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                            <option value="Experimental">Experimental</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Posting Frequency</label>
                          <input
                            value={plat.postingFrequency}
                            onChange={e => { const p = [...platforms]; p[idx] = { ...p[idx], postingFrequency: e.target.value }; setPlatforms(p); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30"
                            placeholder="5-7x per week"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 mb-1 block">Target Audience on Platform</label>
                        <textarea
                          value={plat.audience}
                          onChange={e => { const p = [...platforms]; p[idx] = { ...p[idx], audience: e.target.value }; setPlatforms(p); }}
                          rows={2}
                          className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                          placeholder="Who are we reaching on this platform?"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 mb-1 block">Content Types & Mix</label>
                        <textarea
                          value={plat.contentTypes}
                          onChange={e => { const p = [...platforms]; p[idx] = { ...p[idx], contentTypes: e.target.value }; setPlatforms(p); }}
                          rows={2}
                          className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                          placeholder="Reels (40%), Carousels (35%), Static (15%), Stories (10%)"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 mb-1 block">Goals</label>
                        <textarea
                          value={plat.goals}
                          onChange={e => { const p = [...platforms]; p[idx] = { ...p[idx], goals: e.target.value }; setPlatforms(p); }}
                          rows={2}
                          className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                          placeholder="Brand awareness, engagement, traffic, lead generation..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 mb-1 block">Notes & Tactics</label>
                        <textarea
                          value={plat.notes}
                          onChange={e => { const p = [...platforms]; p[idx] = { ...p[idx], notes: e.target.value }; setPlatforms(p); }}
                          rows={2}
                          className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                          placeholder="Algorithm tips, best practices, platform-specific tactics..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setPlatforms(platforms.filter(p => p.id !== plat.id))}
                          className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION: Content Pillars                     */}
      {/* ═══════════════════════════════════════════ */}
      {activeSection === 'pillars' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              Content Pillars & Themes
            </h2>
            <div className="flex gap-2">
              <button
                disabled={!selectedBrand || generatingSection === 'pillars'}
                onClick={() => generateSection('pillars')}
                className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 flex items-center gap-1 disabled:opacity-40"
              >
                {generatingSection === 'pillars' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Analyze
              </button>
              <button
                onClick={() => setPillars([...pillars, {
                  id: Date.now().toString(), name: '', description: '',
                  percentage: '', examples: '', color: 'blue',
                }])}
                className="px-2.5 py-1 text-xs rounded-lg border border-emerald-700/30 bg-emerald-500/10 text-emerald-400 hover:opacity-80 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Pillar
              </button>
            </div>
          </div>

          {/* AI Analysis Preview */}
          {aiPreviewSection === 'pillars' && aiPreview && (
            <div className="bg-purple-900/15 border border-purple-700/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <h3 className="text-xs font-semibold text-purple-400">AI Analysis — Review & Apply</h3>
                </div>
                <button onClick={() => { setAiPreview(''); setAiPreviewSection(null); }} className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.05]">
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">{aiPreview}</p>
              <p className="text-[10px] text-slate-500 mt-3">Review the analysis above and update the pillar forms below with relevant insights.</p>
            </div>
          )}

          {/* Pillar allocation overview */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-3">Content Mix Allocation</h3>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden">
              {pillars.map(p => {
                const pct = parseInt(p.percentage) || 0;
                const colorMap: Record<string, string> = {
                  blue: 'bg-blue-500', purple: 'bg-purple-500', emerald: 'bg-emerald-500',
                  amber: 'bg-amber-500', pink: 'bg-pink-500',
                };
                return pct > 0 ? (
                  <div
                    key={p.id}
                    className={`${colorMap[p.color] || 'bg-slate-600'} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${p.name}: ${p.percentage}`}
                  />
                ) : null;
              })}
            </div>
            <div className="flex gap-3 mt-2">
              {pillars.map(p => (
                <span key={p.id} className="text-[10px] text-slate-500">
                  <span className={`inline-block w-2 h-2 rounded-sm mr-1 bg-${p.color}-500`} />
                  {p.name || '—'} {p.percentage}
                </span>
              ))}
            </div>
          </div>

          {/* Pillar cards */}
          <div className="space-y-2">
            {pillars.map((pillar, idx) => {
              const isExpanded = expandedPillar === pillar.id;
              const colorClass = PILLAR_COLOR_MAP[pillar.color] || PILLAR_COLOR_MAP.blue;
              return (
                <div key={pillar.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${colorClass}`}>
                      {pillar.percentage || '—'}
                    </span>
                    <span className="flex-1 text-sm text-white font-medium">{pillar.name || 'New Pillar'}</span>
                    <span className="text-[10px] text-slate-500 hidden md:block max-w-[300px] truncate">{pillar.description}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Pillar Name</label>
                          <input
                            value={pillar.name}
                            onChange={e => { const p = [...pillars]; p[idx] = { ...p[idx], name: e.target.value }; setPillars(p); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30"
                            placeholder="Educate, Authority, etc."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Allocation %</label>
                          <input
                            value={pillar.percentage}
                            onChange={e => { const p = [...pillars]; p[idx] = { ...p[idx], percentage: e.target.value }; setPillars(p); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30"
                            placeholder="30%"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Color</label>
                          <select
                            value={pillar.color}
                            onChange={e => { const p = [...pillars]; p[idx] = { ...p[idx], color: e.target.value }; setPillars(p); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/30"
                          >
                            <option value="blue">Blue</option>
                            <option value="purple">Purple</option>
                            <option value="emerald">Emerald</option>
                            <option value="amber">Amber</option>
                            <option value="pink">Pink</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 mb-1 block">Description</label>
                        <textarea
                          value={pillar.description}
                          onChange={e => { const p = [...pillars]; p[idx] = { ...p[idx], description: e.target.value }; setPillars(p); }}
                          rows={2}
                          className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                          placeholder="What kind of content falls under this pillar?"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 mb-1 block">Content Examples</label>
                        <textarea
                          value={pillar.examples}
                          onChange={e => { const p = [...pillars]; p[idx] = { ...p[idx], examples: e.target.value }; setPillars(p); }}
                          rows={2}
                          className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
                          placeholder="Quick tip reels, infographic carousels, how-to posts..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setPillars(pillars.filter(p => p.id !== pillar.id))}
                          className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION: Goals & KPIs                        */}
      {/* ═══════════════════════════════════════════ */}
      {activeSection === 'goals' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Goals & KPIs
            </h2>
            <div className="flex gap-2">
              <button
                disabled={!selectedBrand || generatingSection === 'goals'}
                onClick={() => generateSection('goals')}
                className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 flex items-center gap-1 disabled:opacity-40"
              >
                {generatingSection === 'goals' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Analyze
              </button>
              <button
                onClick={() => setKpis([...kpis, {
                  id: Date.now().toString(), metric: '', current: '',
                  target: '', timeframe: 'Monthly', platform: 'All',
                }])}
                className="px-2.5 py-1 text-xs rounded-lg border border-emerald-700/30 bg-emerald-500/10 text-emerald-400 hover:opacity-80 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add KPI
              </button>
            </div>
          </div>

          {/* AI Analysis Preview */}
          {aiPreviewSection === 'goals' && aiPreview && (
            <div className="bg-purple-900/15 border border-purple-700/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <h3 className="text-xs font-semibold text-purple-400">AI Analysis — Review & Apply</h3>
                </div>
                <button onClick={() => { setAiPreview(''); setAiPreviewSection(null); }} className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.05]">
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">{aiPreview}</p>
              <p className="text-[10px] text-slate-500 mt-3">Review the suggested KPIs above and update the table below accordingly.</p>
            </div>
          )}

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 text-left">
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Metric</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Platform</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Current</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Target</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Timeframe</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi, idx) => (
                  <tr key={kpi.id} className="border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2">
                      <input
                        value={kpi.metric}
                        onChange={e => { const k = [...kpis]; k[idx] = { ...k[idx], metric: e.target.value }; setKpis(k); }}
                        className="w-full bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none"
                        placeholder="Engagement Rate"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={kpi.platform}
                        onChange={e => { const k = [...kpis]; k[idx] = { ...k[idx], platform: e.target.value }; setKpis(k); }}
                        className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 focus:outline-none"
                        placeholder="All"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={kpi.current}
                        onChange={e => { const k = [...kpis]; k[idx] = { ...k[idx], current: e.target.value }; setKpis(k); }}
                        className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 focus:outline-none"
                        placeholder="--"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={kpi.target}
                        onChange={e => { const k = [...kpis]; k[idx] = { ...k[idx], target: e.target.value }; setKpis(k); }}
                        className="w-full bg-transparent text-xs text-emerald-400 placeholder-slate-600 focus:outline-none font-medium"
                        placeholder="> 4.5%"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={kpi.timeframe}
                        onChange={e => { const k = [...kpis]; k[idx] = { ...k[idx], timeframe: e.target.value }; setKpis(k); }}
                        className="bg-transparent text-xs text-slate-400 focus:outline-none"
                      >
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Per post">Per post</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => setKpis(kpis.filter(k => k.id !== kpi.id))}
                        className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION: Posting Cadence                     */}
      {/* ═══════════════════════════════════════════ */}
      {activeSection === 'cadence' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Posting Cadence
            </h2>
            <button
              disabled={!selectedBrand || generatingSection === 'cadence'}
              onClick={() => generateSection('cadence')}
              className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 flex items-center gap-1 disabled:opacity-40"
            >
              {generatingSection === 'cadence' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Suggest
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-2">Cadence Overview</h3>
            <textarea
              value={cadenceOverview}
              onChange={e => setCadenceOverview(e.target.value)}
              placeholder="Overall posting rhythm: e.g. IG 5-7x/week (2 Reels, 2 Carousels, 1-2 Statics, daily Stories), FB 3-4x/week..."
              rows={4}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
            />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-2">Weekly Content Plan Template</h3>
            <p className="text-[10px] text-slate-500 mb-3">
              Define the recurring weekly structure — which platform, format, and pillar for each day
            </p>
            <textarea
              value={weeklyPlan}
              onChange={e => setWeeklyPlan(e.target.value)}
              placeholder={"Mon: IG Reel (Educate) + FB Link Post (Authority)\nTue: IG Carousel (Showcase) \nWed: IG Static (Conversion) + FB Event/Promo\nThu: IG Reel (Authority) \nFri: IG Carousel (Community) + FB Carousel (Community)\nSat: IG Stories only (Behind the scenes)\nSun: Rest / Evergreen repost"}
              rows={8}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none font-mono"
            />
          </div>

          {/* Best times reference */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-3">Optimal Posting Times</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { platform: 'IG Feed', times: '11am-1pm, 7-9pm', color: 'text-pink-400' },
                { platform: 'IG Reels', times: '9am, 12pm, 7pm', color: 'text-pink-400' },
                { platform: 'Facebook', times: '1-4pm, 8-9pm', color: 'text-blue-400' },
                { platform: 'LinkedIn', times: '8-10am, 12pm', color: 'text-sky-400' },
              ].map(t => (
                <div key={t.platform} className="bg-white/[0.02] rounded-lg p-3">
                  <p className={`text-[10px] font-medium ${t.color} mb-1`}>{t.platform}</p>
                  <p className="text-xs text-slate-300">{t.times}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-2">* Times in HKT — adjust based on actual analytics data</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION: Brand Voice & Tone                  */}
      {/* ═══════════════════════════════════════════ */}
      {activeSection === 'voice' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-400" />
              Brand Voice & Tone
            </h2>
            <button
              disabled={!selectedBrand || generatingSection === 'voice'}
              onClick={() => generateSection('voice')}
              className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/30 bg-purple-500/10 text-purple-400 hover:opacity-80 flex items-center gap-1 disabled:opacity-40"
            >
              {generatingSection === 'voice' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Define Voice
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-2">Voice & Tone Guidelines</h3>
            <p className="text-[10px] text-slate-500 mb-3">
              Define the brand personality: how should the brand sound on social media?
            </p>
            <textarea
              value={voiceTone}
              onChange={e => setVoiceTone(e.target.value)}
              placeholder={"Voice Characteristics:\n• Professional yet approachable\n• Tech-savvy but not jargon-heavy\n• Confident without being arrogant\n• Data-driven with a human touch\n\nTone Variations:\n• Educational content → Knowledgeable, helpful teacher\n• Promotional content → Enthusiastic, benefit-focused\n• Community content → Warm, conversational, peer-to-peer\n• Authority content → Confident, data-backed, expert"}
              rows={10}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
            />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-2">Do&apos;s & Don&apos;ts</h3>
            <textarea
              value={dosDonts}
              onChange={e => setDosDonts(e.target.value)}
              placeholder={"DO:\n✓ Use active voice and short sentences\n✓ Include specific numbers and data points\n✓ Ask questions to drive engagement\n✓ Use emojis strategically (1-3 per post)\n\nDON'T:\n✗ Use corporate buzzwords or filler language\n✗ Make claims without backing data\n✗ Post walls of text without line breaks\n✗ Use aggressive sales language"}
              rows={8}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
            />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white mb-2">Sample Captions (Voice Examples)</h3>
            <textarea
              value={sampleCaptions}
              onChange={e => setSampleCaptions(e.target.value)}
              placeholder={"[Educate Post]\nStop wasting 3 hours on social content every day.\n\nWe analyzed 500+ SMB social accounts and found that 80% of the work can be automated with AI agents.\n\nHere's the breakdown: ↓\n\n[Authority Post]\nWe helped a 12-location F&B chain go from 0.8% to 4.5% engagement rate in 30 days.\n\nThe secret? A 14-agent AI pipeline that handles everything from content creation to community management.\n\nSwipe for the full case study →"}
              rows={10}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
