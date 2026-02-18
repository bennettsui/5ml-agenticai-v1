'use client';

import { useState, useCallback } from 'react';
import {
  Search, AlertCircle, Building2, Users, ShoppingBag,
  Loader2, Sparkles, Globe, TrendingUp, Target, Package,
  ChevronDown, ChevronUp, Plus, Trash2, Edit3, Save,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

type ResearchTab = 'business' | 'audience' | 'products';

interface CompetitorEntry {
  id: string;
  name: string;
  website: string;
  strengths: string;
  weaknesses: string;
  socialPresence: string;
  notes: string;
}

interface AudienceSegment {
  id: string;
  name: string;
  demographics: string;
  psychographics: string;
  painPoints: string;
  channels: string;
  size: string;
}

interface ProductEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  keyFeatures: string;
  priceRange: string;
  targetSegment: string;
  usp: string;
}

/* ── Sample data ────────────────────────── */

const SAMPLE_COMPETITORS: CompetitorEntry[] = [
  {
    id: '1', name: 'Competitor A', website: 'https://example.com',
    strengths: 'Strong brand recognition, large follower base',
    weaknesses: 'Low engagement rate, inconsistent posting',
    socialPresence: 'IG: 50K, FB: 30K, LinkedIn: 10K',
    notes: 'Posts 3x/week, mostly static images',
  },
];

const SAMPLE_SEGMENTS: AudienceSegment[] = [
  {
    id: '1', name: 'Growth-minded SMB Owners',
    demographics: 'Age 28-45, HK-based, English + Cantonese bilingual',
    psychographics: 'Tech-savvy, efficiency-focused, early adopters',
    painPoints: 'No time for social media, inconsistent brand voice, low ROI on ads',
    channels: 'Instagram, LinkedIn, WhatsApp',
    size: 'Est. 15,000 in HK',
  },
];

const SAMPLE_PRODUCTS: ProductEntry[] = [
  {
    id: '1', name: 'Social Content Ops Package',
    category: 'Service',
    description: 'End-to-end social media management powered by AI agents',
    keyFeatures: 'Content calendar, AI copywriting, community management, ad optimization',
    priceRange: 'HK$15,000 - 50,000/mo',
    targetSegment: 'Growth-minded SMB Owners',
    usp: 'AI-first approach reduces content production time by 80%',
  },
];

/* ── Tab config ─────────────────────────── */

const TABS: { id: ResearchTab; label: string; icon: typeof Building2; desc: string }[] = [
  { id: 'business', label: 'Business & Competitors', icon: Building2, desc: 'Company overview, customer base, and competitive landscape' },
  { id: 'audience', label: 'Target Audience', icon: Users, desc: 'Segmentation, positioning, and persona analysis' },
  { id: 'products', label: 'Products & Services', icon: ShoppingBag, desc: 'Portfolio, features, pricing, and USP' },
];

/* ── Component ──────────────────────────── */

export default function ResearchPage() {
  const { selectedBrand } = useBrandProject();
  const [tab, setTab] = useState<ResearchTab>('business');
  const [generating, setGenerating] = useState(false);

  // Business section state
  const [businessOverview, setBusinessOverview] = useState('');
  const [mission, setMission] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>(SAMPLE_COMPETITORS);
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  // Audience section state
  const [positioning, setPositioning] = useState('');
  const [segments, setSegments] = useState<AudienceSegment[]>(SAMPLE_SEGMENTS);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  // Products section state
  const [products, setProducts] = useState<ProductEntry[]>(SAMPLE_PRODUCTS);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const handleAiGenerate = useCallback(async () => {
    if (!selectedBrand) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Research the brand "${selectedBrand.name}" for ${tab === 'business' ? 'business overview, key customers, and competitive landscape' : tab === 'audience' ? 'target audience segmentation, demographics, psychographics, and positioning' : 'products and services portfolio, key features, pricing, and unique selling propositions'}. Provide structured data.` }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Brand & Competitive Research',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Show result in the overview field as a starting point
        if (tab === 'business') setBusinessOverview(data.message || '');
        else if (tab === 'audience') setPositioning(data.message || '');
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand, tab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Brand & Competitive Research</h1>
          </div>
          <p className="text-sm text-slate-400">
            Comprehensive brand intelligence — business overview, audience analysis, and product portfolio
          </p>
        </div>
        <button
          disabled={!selectedBrand || generating}
          onClick={handleAiGenerate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          AI Research
        </button>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand from the sidebar to begin research.</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TAB 1: Business, Customers & Competitors   */}
      {/* ═══════════════════════════════════════════ */}
      {tab === 'business' && (
        <div className="space-y-6">
          {/* Business Overview */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Business Overview</h2>
            </div>
            <textarea
              value={businessOverview}
              onChange={e => setBusinessOverview(e.target.value)}
              placeholder="Describe the business: what they do, their market position, key differentiators, and brand story..."
              rows={4}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30 resize-none"
            />
          </div>

          {/* Mission & Values */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Mission, Vision & Values</h2>
            </div>
            <textarea
              value={mission}
              onChange={e => setMission(e.target.value)}
              placeholder="Mission statement, brand vision, core values, and brand personality..."
              rows={3}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30 resize-none"
            />
          </div>

          {/* Competitive Landscape */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Competitive Landscape</h2>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{competitors.length}</span>
              </div>
              <button
                onClick={() => setCompetitors([...competitors, {
                  id: Date.now().toString(), name: '', website: '',
                  strengths: '', weaknesses: '', socialPresence: '', notes: '',
                }])}
                className="px-2.5 py-1 text-xs rounded-lg border border-blue-700/30 bg-blue-500/10 text-blue-400 hover:opacity-80 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Competitor
              </button>
            </div>
            <div className="space-y-2">
              {competitors.map((comp, idx) => {
                const isExpanded = expandedCompetitor === comp.id;
                return (
                  <div key={comp.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCompetitor(isExpanded ? null : comp.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-[10px] text-slate-500 font-mono w-5">{idx + 1}</span>
                      <span className="flex-1 text-sm text-white font-medium">{comp.name || 'New Competitor'}</span>
                      {comp.socialPresence && <span className="text-[10px] text-slate-500 hidden md:block">{comp.socialPresence}</span>}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Name</label>
                            <input
                              value={comp.name}
                              onChange={e => { const c = [...competitors]; c[idx] = { ...c[idx], name: e.target.value }; setCompetitors(c); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30"
                              placeholder="Competitor name"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Website</label>
                            <input
                              value={comp.website}
                              onChange={e => { const c = [...competitors]; c[idx] = { ...c[idx], website: e.target.value }; setCompetitors(c); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Social Presence</label>
                          <input
                            value={comp.socialPresence}
                            onChange={e => { const c = [...competitors]; c[idx] = { ...c[idx], socialPresence: e.target.value }; setCompetitors(c); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30"
                            placeholder="IG: 50K, FB: 30K, LinkedIn: 10K"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Strengths</label>
                            <textarea
                              value={comp.strengths}
                              onChange={e => { const c = [...competitors]; c[idx] = { ...c[idx], strengths: e.target.value }; setCompetitors(c); }}
                              rows={2}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30 resize-none"
                              placeholder="Key strengths..."
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Weaknesses</label>
                            <textarea
                              value={comp.weaknesses}
                              onChange={e => { const c = [...competitors]; c[idx] = { ...c[idx], weaknesses: e.target.value }; setCompetitors(c); }}
                              rows={2}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30 resize-none"
                              placeholder="Key weaknesses..."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Notes</label>
                          <textarea
                            value={comp.notes}
                            onChange={e => { const c = [...competitors]; c[idx] = { ...c[idx], notes: e.target.value }; setCompetitors(c); }}
                            rows={2}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/30 resize-none"
                            placeholder="Posting frequency, content style, engagement patterns..."
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setCompetitors(competitors.filter(c => c.id !== comp.id))}
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
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB 2: Target Audience Analysis             */}
      {/* ═══════════════════════════════════════════ */}
      {tab === 'audience' && (
        <div className="space-y-6">
          {/* Positioning Statement */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Positioning Statement</h2>
            </div>
            <textarea
              value={positioning}
              onChange={e => setPositioning(e.target.value)}
              placeholder="For [target audience] who [need/want], [brand] is a [category] that [key benefit]. Unlike [competitors], we [unique differentiator]."
              rows={3}
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/30 resize-none"
            />
          </div>

          {/* Audience Segments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Audience Segments</h2>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{segments.length}</span>
              </div>
              <button
                onClick={() => setSegments([...segments, {
                  id: Date.now().toString(), name: '', demographics: '',
                  psychographics: '', painPoints: '', channels: '', size: '',
                }])}
                className="px-2.5 py-1 text-xs rounded-lg border border-emerald-700/30 bg-emerald-500/10 text-emerald-400 hover:opacity-80 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Segment
              </button>
            </div>
            <div className="space-y-2">
              {segments.map((seg, idx) => {
                const isExpanded = expandedSegment === seg.id;
                return (
                  <div key={seg.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedSegment(isExpanded ? null : seg.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-[10px] text-slate-500 font-mono w-5">{idx + 1}</span>
                      <span className="flex-1 text-sm text-white font-medium">{seg.name || 'New Segment'}</span>
                      {seg.size && <span className="text-[10px] text-slate-500 hidden md:block">{seg.size}</span>}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Segment Name</label>
                            <input
                              value={seg.name}
                              onChange={e => { const s = [...segments]; s[idx] = { ...s[idx], name: e.target.value }; setSegments(s); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
                              placeholder="e.g. Growth-minded SMB Owners"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Est. Size</label>
                            <input
                              value={seg.size}
                              onChange={e => { const s = [...segments]; s[idx] = { ...s[idx], size: e.target.value }; setSegments(s); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
                              placeholder="e.g. 15,000 in HK"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Demographics</label>
                          <textarea
                            value={seg.demographics}
                            onChange={e => { const s = [...segments]; s[idx] = { ...s[idx], demographics: e.target.value }; setSegments(s); }}
                            rows={2}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30 resize-none"
                            placeholder="Age, location, language, income, education..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Psychographics</label>
                          <textarea
                            value={seg.psychographics}
                            onChange={e => { const s = [...segments]; s[idx] = { ...s[idx], psychographics: e.target.value }; setSegments(s); }}
                            rows={2}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30 resize-none"
                            placeholder="Values, interests, lifestyle, attitudes..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Pain Points</label>
                          <textarea
                            value={seg.painPoints}
                            onChange={e => { const s = [...segments]; s[idx] = { ...s[idx], painPoints: e.target.value }; setSegments(s); }}
                            rows={2}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30 resize-none"
                            placeholder="What problems do they face that your brand solves?"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Preferred Channels</label>
                          <input
                            value={seg.channels}
                            onChange={e => { const s = [...segments]; s[idx] = { ...s[idx], channels: e.target.value }; setSegments(s); }}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
                            placeholder="Instagram, LinkedIn, WhatsApp, YouTube..."
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setSegments(segments.filter(s => s.id !== seg.id))}
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
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB 3: Products & Services                  */}
      {/* ═══════════════════════════════════════════ */}
      {tab === 'products' && (
        <div className="space-y-6">
          {/* Products list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Products & Services Portfolio</h2>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{products.length}</span>
              </div>
              <button
                onClick={() => setProducts([...products, {
                  id: Date.now().toString(), name: '', category: '',
                  description: '', keyFeatures: '', priceRange: '',
                  targetSegment: '', usp: '',
                }])}
                className="px-2.5 py-1 text-xs rounded-lg border border-amber-700/30 bg-amber-500/10 text-amber-400 hover:opacity-80 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Product/Service
              </button>
            </div>
            <div className="space-y-2">
              {products.map((prod, idx) => {
                const isExpanded = expandedProduct === prod.id;
                return (
                  <div key={prod.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-[10px] text-slate-500 font-mono w-5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-medium">{prod.name || 'New Product/Service'}</span>
                        {prod.category && <span className="text-[10px] text-slate-500 ml-2">{prod.category}</span>}
                      </div>
                      {prod.priceRange && <span className="text-[10px] text-emerald-400 hidden md:block">{prod.priceRange}</span>}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Name</label>
                            <input
                              value={prod.name}
                              onChange={e => { const p = [...products]; p[idx] = { ...p[idx], name: e.target.value }; setProducts(p); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30"
                              placeholder="Product or service name"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Category</label>
                            <input
                              value={prod.category}
                              onChange={e => { const p = [...products]; p[idx] = { ...p[idx], category: e.target.value }; setProducts(p); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30"
                              placeholder="Service / Product / Package"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Description</label>
                          <textarea
                            value={prod.description}
                            onChange={e => { const p = [...products]; p[idx] = { ...p[idx], description: e.target.value }; setProducts(p); }}
                            rows={2}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30 resize-none"
                            placeholder="What is this product/service?"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Key Features</label>
                          <textarea
                            value={prod.keyFeatures}
                            onChange={e => { const p = [...products]; p[idx] = { ...p[idx], keyFeatures: e.target.value }; setProducts(p); }}
                            rows={2}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30 resize-none"
                            placeholder="Main features, capabilities, deliverables..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Price Range</label>
                            <input
                              value={prod.priceRange}
                              onChange={e => { const p = [...products]; p[idx] = { ...p[idx], priceRange: e.target.value }; setProducts(p); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30"
                              placeholder="HK$X,XXX - XX,XXX/mo"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 mb-1 block">Target Segment</label>
                            <input
                              value={prod.targetSegment}
                              onChange={e => { const p = [...products]; p[idx] = { ...p[idx], targetSegment: e.target.value }; setProducts(p); }}
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30"
                              placeholder="Which audience segment is this for?"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Unique Selling Proposition (USP)</label>
                          <textarea
                            value={prod.usp}
                            onChange={e => { const p = [...products]; p[idx] = { ...p[idx], usp: e.target.value }; setProducts(p); }}
                            rows={2}
                            className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30 resize-none"
                            placeholder="What makes this uniquely valuable compared to competitors?"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setProducts(products.filter(p => p.id !== prod.id))}
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
        </div>
      )}
    </div>
  );
}
