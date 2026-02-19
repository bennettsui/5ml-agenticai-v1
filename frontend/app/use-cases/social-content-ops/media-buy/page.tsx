'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DollarSign, AlertCircle, TrendingUp, Target, Layers, PieChart,
  Plus, Trash2, ChevronDown, ChevronUp, Loader2, Sparkles,
  Save, X, Edit3, Users, Eye, MousePointer, BarChart3,
  Shield, Send, CheckCircle, XCircle, Clock, Calendar,
  MessageSquare, ArrowRight, Zap, Link2, Play, Pause,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

type CampaignStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Scheduled' | 'Live' | 'Paused' | 'Completed';

interface ReviewComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  action: 'comment' | 'approve' | 'request_changes';
}

interface PlatformAllocation {
  id: string;
  platform: string;
  allocation: number;
  estimatedCpm: string;
  estimatedCpc: string;
  color: string;
}

interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  objective: string;
  budget: string;
  startDate: string;
  endDate: string;
  audience: string;
  ageRange: string;
  locations: string;
  interests: string;
  placements: string;
  adFormat: string;
  bidStrategy: string;
  status: CampaignStatus;
  notes: string;
  // Approval & scheduling
  reviews: ReviewComment[];
  scheduledLaunchDate?: string;
  scheduledLaunchTime?: string;
  metaAdSetId?: string;
}

/* ── Sample data ────────────────────────── */

const DEFAULT_PLATFORMS: PlatformAllocation[] = [
  { id: '1', platform: 'Meta (FB + IG)', allocation: 40, estimatedCpm: '$5-12', estimatedCpc: '$0.30-0.80', color: 'bg-blue-500' },
  { id: '2', platform: 'Google/YouTube', allocation: 25, estimatedCpm: '$3-10', estimatedCpc: '$0.20-1.50', color: 'bg-red-500' },
  { id: '3', platform: 'TikTok', allocation: 20, estimatedCpm: '$2-8', estimatedCpc: '$0.15-0.50', color: 'bg-purple-500' },
  { id: '4', platform: 'LinkedIn', allocation: 10, estimatedCpm: '$15-40', estimatedCpc: '$2-5', color: 'bg-cyan-500' },
  { id: '5', platform: 'X/Twitter', allocation: 5, estimatedCpm: '$4-12', estimatedCpc: '$0.25-1.00', color: 'bg-slate-400' },
];

const OBJECTIVES = [
  { label: 'Brand Awareness', icon: Target, desc: 'Maximize reach and impressions', metrics: 'CPM, Reach, Frequency' },
  { label: 'Traffic', icon: TrendingUp, desc: 'Drive clicks to landing pages', metrics: 'CPC, CTR, Sessions' },
  { label: 'Conversions', icon: Layers, desc: 'Optimize for purchases/sign-ups', metrics: 'CPA, ROAS, Conv Rate' },
  { label: 'Engagement', icon: PieChart, desc: 'Maximize likes, shares, comments', metrics: 'CPE, Engagement Rate' },
];

const AD_FORMATS = ['Single Image', 'Carousel', 'Video', 'Stories Ad', 'Collection', 'Lead Form', 'Instant Experience'];
const BID_STRATEGIES = ['Lowest Cost', 'Cost Cap', 'Bid Cap', 'Target ROAS', 'Manual CPC'];

const STATUS_CONFIG: Record<CampaignStatus, { color: string; icon: typeof Clock; label: string }> = {
  Draft: { color: 'bg-slate-700/50 text-slate-400', icon: Edit3, label: 'Draft' },
  'Pending Approval': { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Pending' },
  Approved: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Approved' },
  Scheduled: { color: 'bg-purple-500/20 text-purple-400', icon: Calendar, label: 'Scheduled' },
  Live: { color: 'bg-green-500/20 text-green-400', icon: Play, label: 'Live' },
  Paused: { color: 'bg-blue-500/20 text-blue-400', icon: Pause, label: 'Paused' },
  Completed: { color: 'bg-slate-600/50 text-slate-400', icon: CheckCircle, label: 'Completed' },
};

const STATUS_PIPELINE: CampaignStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Scheduled', 'Live', 'Paused', 'Completed'];

/* ── Helpers ─────────────────────────────── */

function emptyCampaign(): AdCampaign {
  return {
    id: '', name: '', platform: 'Meta (FB + IG)', objective: 'Traffic',
    budget: '', startDate: '', endDate: '', audience: '', ageRange: '18-65',
    locations: '', interests: '', placements: 'Automatic', adFormat: 'Single Image',
    bidStrategy: 'Lowest Cost', status: 'Draft', notes: '', reviews: [],
  };
}

/* ── Component ──────────────────────────── */

export default function MediaBuyPage() {
  const { selectedBrand } = useBrandProject();
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<PlatformAllocation[]>(DEFAULT_PLATFORMS);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'All'>('All');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [formData, setFormData] = useState<AdCampaign>(emptyCampaign());

  // Review
  const [reviewCampaignId, setReviewCampaignId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [aiReviewing, setAiReviewing] = useState(false);

  // Schedule modal
  const [scheduleCampaignId, setScheduleCampaignId] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('09:00');

  const budgetNum = useMemo(() => Number(monthlyBudget) || 0, [monthlyBudget]);
  const totalAllocation = useMemo(() => platforms.reduce((sum, p) => sum + p.allocation, 0), [platforms]);

  const filteredCampaigns = statusFilter === 'All' ? campaigns : campaigns.filter(c => c.status === statusFilter);

  /* ── Estimated reach calculator ────────── */
  const estimatedMetrics = useMemo(() => {
    if (!budgetNum) return null;
    const avgCpm = 8;
    const avgCpc = 0.60;
    const avgCtr = 1.5;
    const avgCpv = 0.03;
    return {
      impressions: Math.round(budgetNum / avgCpm * 1000),
      clicks: Math.round(budgetNum / avgCpc),
      reach: Math.round(budgetNum / avgCpm * 1000 * 0.6),
      ctr: `${avgCtr}%`,
      cpm: `$${avgCpm.toFixed(2)}`,
      cpc: `$${avgCpc.toFixed(2)}`,
      views: Math.round(budgetNum / avgCpv),
      cpv: `$${avgCpv.toFixed(3)}`,
    };
  }, [budgetNum]);

  // HK industry benchmarks for comparison
  const HK_BENCHMARKS = {
    cpm: { value: '$6-12', label: 'CPM' },
    cpc: { value: '$0.40-0.90', label: 'CPC' },
    ctr: { value: '1.2-2.5%', label: 'CTR' },
    cpv: { value: '$0.02-0.05', label: 'CPV (video)' },
    reach_per_1k: { value: '~600', label: 'Reach per 1K impr.' },
    engagement_rate: { value: '1.5-4.5%', label: 'Engagement Rate' },
  };

  /* ── Status counts ─────────────────────── */
  const statusCounts = STATUS_PIPELINE.reduce((acc, s) => {
    acc[s] = campaigns.filter(c => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  /* ── Campaign status actions ───────────── */

  function updateCampaignStatus(id: string, newStatus: CampaignStatus) {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
  }

  function addCampaignReview(campaignId: string, text: string, action: ReviewComment['action']) {
    const review: ReviewComment = {
      id: `rev-${Date.now()}`,
      author: 'You',
      role: 'Reviewer',
      text,
      timestamp: new Date().toISOString(),
      action,
    };
    setCampaigns(campaigns.map(c => {
      if (c.id !== campaignId) return c;
      const newStatus: CampaignStatus = action === 'approve' ? 'Approved' : action === 'request_changes' ? 'Draft' : c.status;
      return { ...c, reviews: [...c.reviews, review], status: newStatus };
    }));
    setReviewText('');
  }

  function scheduleCampaign(id: string) {
    if (!schedDate) return;
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: 'Scheduled' as CampaignStatus, scheduledLaunchDate: schedDate, scheduledLaunchTime: schedTime } : c));
    setScheduleCampaignId(null);
  }

  /* ── AI Review ──────────────────────────── */
  const handleAiReview = useCallback(async (campaign: AdCampaign) => {
    if (!selectedBrand) return;
    setAiReviewing(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `As Social Media Director, review this ad campaign plan and provide feedback on targeting, budget efficiency, creative direction, and expected ROI.

**Campaign**: ${campaign.name}
**Platform**: ${campaign.platform} | **Objective**: ${campaign.objective}
**Budget**: ${campaign.budget} | **Ad Format**: ${campaign.adFormat}
**Bid Strategy**: ${campaign.bidStrategy}
**Audience**: ${campaign.audience} | **Age**: ${campaign.ageRange}
**Locations**: ${campaign.locations} | **Interests**: ${campaign.interests}
**Placements**: ${campaign.placements}
**Flight Dates**: ${campaign.startDate || 'TBD'} to ${campaign.endDate || 'TBD'}
**Notes**: ${campaign.notes || 'None'}

Provide: 1) Overall assessment, 2) Targeting feedback, 3) Budget/bid recommendations, 4) Creative suggestions, 5) Expected performance range. Be direct.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Media Buy',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          addCampaignReview(campaign.id, data.message, 'comment');
          updateCampaignStatus(campaign.id, 'Pending Approval');
        }
      }
    } catch { /* silent */ }
    setAiReviewing(false);
  }, [selectedBrand, campaigns]);

  /* ── AI Optimize ─────────────────────── */
  const handleAiOptimize = useCallback(async () => {
    if (!selectedBrand) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Optimize the media buy strategy for "${selectedBrand.name}".

Monthly budget: $${monthlyBudget || 'TBD'}
Selected objective: ${selectedObjective || 'Not yet selected'}
Current platform allocation: ${platforms.map(p => `${p.platform}: ${p.allocation}%`).join(', ')}

Generate 3 ad campaign recommendations as a JSON array:
[{
  "name": "Campaign name",
  "platform": "Platform name",
  "objective": "Campaign objective",
  "budget": "Suggested budget as dollar amount",
  "audience": "Target audience description",
  "ageRange": "18-45",
  "locations": "Target locations",
  "interests": "Interest targeting",
  "placements": "Ad placements",
  "adFormat": "Single Image|Carousel|Video|Stories Ad|Collection|Lead Form",
  "bidStrategy": "Lowest Cost|Cost Cap|Bid Cap|Target ROAS|Manual CPC",
  "notes": "Strategy notes and optimization tips"
}]

Return ONLY the JSON array.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Media Buy',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message || '';
        try {
          const jsonMatch = msg.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Partial<AdCampaign>[];
            const newCampaigns: AdCampaign[] = parsed.map((c, i) => ({
              id: `ai-${Date.now()}-${i}`,
              name: c.name || `Campaign ${i + 1}`,
              platform: c.platform || 'Meta (FB + IG)',
              objective: c.objective || selectedObjective || 'Traffic',
              budget: c.budget || '',
              startDate: '',
              endDate: '',
              audience: c.audience || '',
              ageRange: c.ageRange || '18-65',
              locations: c.locations || '',
              interests: c.interests || '',
              placements: c.placements || 'Automatic',
              adFormat: c.adFormat || 'Single Image',
              bidStrategy: c.bidStrategy || 'Lowest Cost',
              status: 'Draft' as CampaignStatus,
              notes: c.notes || '',
              reviews: [],
            }));
            setCampaigns(prev => [...prev, ...newCampaigns]);
          }
        } catch {
          console.log('AI response (non-JSON):', msg.slice(0, 500));
        }
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand, monthlyBudget, selectedObjective, platforms]);

  /* ── CRUD ──────────────────────────────── */

  function openAddForm() {
    const form = emptyCampaign();
    if (selectedObjective) form.objective = selectedObjective;
    setFormData(form);
    setEditingCampaign(null);
    setShowForm(true);
  }

  function openEditForm(campaign: AdCampaign) {
    setFormData({ ...campaign });
    setEditingCampaign(campaign);
    setShowForm(true);
  }

  function saveCampaign() {
    const data = { ...formData };
    if (!data.name) return;
    if (!data.id) { data.id = `manual-${Date.now()}`; data.reviews = []; }
    if (editingCampaign) {
      setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? data : c));
    } else {
      setCampaigns([...campaigns, data]);
    }
    setShowForm(false);
  }

  function deleteCampaign(id: string) {
    setCampaigns(campaigns.filter(c => c.id !== id));
  }

  function updateForm<K extends keyof AdCampaign>(key: K, value: AdCampaign[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function updatePlatformAllocation(id: string, value: number) {
    setPlatforms(platforms.map(p => p.id === id ? { ...p, allocation: Math.max(0, Math.min(100, value)) } : p));
  }

  // Persist budget + platforms + objective to localStorage
  const [configSaved, setConfigSaved] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('media_buy_config');
      if (saved) {
        const cfg = JSON.parse(saved);
        if (cfg.monthlyBudget) setMonthlyBudget(cfg.monthlyBudget);
        if (cfg.selectedObjective) setSelectedObjective(cfg.selectedObjective);
        if (cfg.platforms) setPlatforms(cfg.platforms);
        if (cfg.campaigns) setCampaigns(cfg.campaigns);
      }
    } catch { /* ignore */ }
  }, []);

  const saveConfig = useCallback(() => {
    try {
      localStorage.setItem('media_buy_config', JSON.stringify({ monthlyBudget, selectedObjective, platforms, campaigns }));
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch { /* ignore */ }
  }, [monthlyBudget, selectedObjective, platforms, campaigns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Media Buy</h1>
          </div>
          <p className="text-sm text-slate-400">
            Plan, approve, schedule, and deliver paid media across social platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          {configSaved && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Saved
            </span>
          )}
          <button
            onClick={saveConfig}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700/30 bg-slate-700/50 text-slate-300 hover:bg-slate-700 flex items-center gap-1 transition-colors"
          >
            <Save className="w-3 h-3" /> Save
          </button>
          <button
            disabled={!selectedBrand || generating}
            onClick={handleAiOptimize}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Optimize
          </button>
          <button
            onClick={openAddForm}
            className="px-3 py-1.5 text-xs rounded-lg border border-cyan-700/30 bg-cyan-500/10 text-cyan-400 hover:opacity-80 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> New Campaign
          </button>
        </div>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to plan media buys.</p>
        </div>
      )}

      {/* ── Meta API Connection Status ──────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">Meta Business Suite</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Pending Connection</span>
        <button className="ml-auto text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
          <Link2 className="w-3 h-3" /> Connect API
        </button>
      </div>

      {/* ── Campaign Approval Pipeline ──────── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Campaign Pipeline</h2>
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
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
          {statusFilter !== 'All' && (
            <button onClick={() => setStatusFilter('All')} className="ml-2 text-[10px] text-slate-500 hover:text-white">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Budget + Estimated Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-[10px] uppercase text-slate-500 mb-2 font-semibold">Monthly Budget</h3>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="number"
              value={monthlyBudget}
              onChange={e => setMonthlyBudget(e.target.value)}
              placeholder="0"
              className="w-full bg-white/[0.03] border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-1">USD / month</p>
        </div>
        {estimatedMetrics && (
          <>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-slate-500">Est. Impressions</span>
              </div>
              <p className="text-lg font-bold text-white">{(estimatedMetrics.impressions / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-slate-500">Est. Reach</span>
              </div>
              <p className="text-lg font-bold text-white">{(estimatedMetrics.reach / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <MousePointer className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-slate-500">Est. Clicks</span>
              </div>
              <p className="text-lg font-bold text-white">{(estimatedMetrics.clicks / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] text-slate-500">Est. CTR</span>
              </div>
              <p className="text-lg font-bold text-white">{estimatedMetrics.ctr}</p>
            </div>
          </>
        )}
      </div>

      {/* HK Industry Benchmarks */}
      {budgetNum > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-400">HK Industry Benchmarks</h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full">Reference</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.values(HK_BENCHMARKS).map(b => (
              <div key={b.label} className="bg-white/[0.02] rounded-lg p-2.5">
                <p className="text-[9px] text-slate-500 uppercase mb-0.5">{b.label}</p>
                <p className="text-xs text-white font-medium">{b.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-2">* Based on Meta Ads HK market averages (social media, lifestyle vertical). Actual results vary by targeting.</p>
        </div>
      )}

      {/* Expected Results Summary */}
      {budgetNum > 0 && estimatedMetrics && (
        <div className="bg-cyan-900/10 border border-cyan-700/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-cyan-400 mb-3">Expected Results at ${budgetNum.toLocaleString()}/mo Budget</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {[
              { label: 'Impressions', value: `${(estimatedMetrics.impressions / 1000).toFixed(0)}K` },
              { label: 'Reach', value: `${(estimatedMetrics.reach / 1000).toFixed(0)}K` },
              { label: 'CPM', value: estimatedMetrics.cpm },
              { label: 'Clicks', value: `${(estimatedMetrics.clicks / 1000).toFixed(1)}K` },
              { label: 'CPC', value: estimatedMetrics.cpc },
              { label: 'CTR', value: estimatedMetrics.ctr },
              { label: 'Views', value: `${(estimatedMetrics.views / 1000).toFixed(0)}K` },
              { label: 'CPV', value: estimatedMetrics.cpv },
            ].map(m => (
              <div key={m.label} className="text-center">
                <p className="text-[9px] text-slate-500 uppercase">{m.label}</p>
                <p className="text-sm font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">These are estimates. Numbers will update to actuals once campaigns are live.</p>
        </div>
      )}

      {/* Campaign Objective */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Campaign Objective</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OBJECTIVES.map(obj => {
            const Icon = obj.icon;
            const active = selectedObjective === obj.label;
            return (
              <button
                key={obj.label}
                onClick={() => setSelectedObjective(active ? null : obj.label)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  active
                    ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                <h3 className="text-xs font-medium text-white">{obj.label}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{obj.desc}</p>
                <p className={`text-[9px] mt-1.5 ${active ? 'text-cyan-400/70' : 'text-slate-600'}`}>
                  Key metrics: {obj.metrics}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform Allocation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Allocation</h2>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${totalAllocation === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            Total: {totalAllocation}%
          </span>
        </div>

        <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-4">
          {platforms.map(p => (
            p.allocation > 0 ? (
              <div
                key={p.id}
                className={`${p.color} transition-all`}
                style={{ width: `${p.allocation}%` }}
                title={`${p.platform}: ${p.allocation}%`}
              />
            ) : null
          ))}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Platform</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500 w-48">Allocation</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Spend</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Est. CPM</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Est. CPC</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map(p => (
                <tr key={p.id} className="border-b border-slate-700/30 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs text-white font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.color}`} />
                      {p.platform}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={p.allocation}
                        onChange={e => updatePlatformAllocation(p.id, Number(e.target.value))}
                        className="flex-1 h-1.5 accent-cyan-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={p.allocation}
                        onChange={e => updatePlatformAllocation(p.id, Number(e.target.value))}
                        className="w-12 bg-white/[0.02] border border-slate-700/30 rounded px-2 py-0.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500/30"
                      />
                      <span className="text-[10px] text-slate-500">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-emerald-400 font-medium">
                    {budgetNum ? `$${(budgetNum * p.allocation / 100).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.estimatedCpm}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.estimatedCpc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ad Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ad Campaigns</h2>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{campaigns.length}</span>
          </div>
        </div>

        {filteredCampaigns.length === 0 && campaigns.length === 0 ? (
          <div className="bg-white/[0.02] border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
            <DollarSign className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-3">No ad campaigns yet</p>
            <div className="flex gap-2 justify-center">
              <button
                disabled={!selectedBrand || generating}
                onClick={handleAiOptimize}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate Campaigns
              </button>
              <button onClick={openAddForm} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700/50 rounded-lg transition-colors">
                Create Manually
              </button>
            </div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-500">No campaigns with status &quot;{statusFilter}&quot;</p>
            <button onClick={() => setStatusFilter('All')} className="text-[10px] text-cyan-400 mt-1 hover:underline">Show all</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCampaigns.map(campaign => {
              const isExpanded = expandedCampaign === campaign.id;
              const statusConf = STATUS_CONFIG[campaign.status];
              return (
                <div key={campaign.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium truncate">{campaign.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusConf.color} flex items-center gap-1`}>
                          <statusConf.icon className="w-2.5 h-2.5" />
                          {statusConf.label}
                        </span>
                        {campaign.scheduledLaunchDate && (
                          <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {campaign.scheduledLaunchDate} {campaign.scheduledLaunchTime}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-slate-500">{campaign.platform}</span>
                        <span className="text-[10px] text-slate-600">{campaign.objective}</span>
                        {campaign.budget && <span className="text-[10px] text-emerald-400">{campaign.budget}</span>}
                      </div>
                    </div>
                    {campaign.reviews.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {campaign.reviews.length}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Ad Format</label>
                          <p className="text-xs text-slate-300">{campaign.adFormat}</p>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Bid Strategy</label>
                          <p className="text-xs text-slate-300">{campaign.bidStrategy}</p>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Placements</label>
                          <p className="text-xs text-slate-300">{campaign.placements || 'Automatic'}</p>
                        </div>
                      </div>

                      {/* Targeting */}
                      <div className="bg-cyan-500/5 border border-cyan-700/20 rounded-lg p-3">
                        <label className="text-[10px] uppercase text-cyan-400 mb-1 block font-medium">Audience Targeting</label>
                        <div className="grid grid-cols-2 gap-2">
                          {campaign.audience && (
                            <div>
                              <span className="text-[9px] text-slate-500">Audience: </span>
                              <span className="text-xs text-slate-300">{campaign.audience}</span>
                            </div>
                          )}
                          {campaign.ageRange && (
                            <div>
                              <span className="text-[9px] text-slate-500">Age: </span>
                              <span className="text-xs text-slate-300">{campaign.ageRange}</span>
                            </div>
                          )}
                          {campaign.locations && (
                            <div>
                              <span className="text-[9px] text-slate-500">Locations: </span>
                              <span className="text-xs text-slate-300">{campaign.locations}</span>
                            </div>
                          )}
                          {campaign.interests && (
                            <div>
                              <span className="text-[9px] text-slate-500">Interests: </span>
                              <span className="text-xs text-slate-300">{campaign.interests}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {campaign.notes && (
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Notes</label>
                          <p className="text-xs text-slate-400 whitespace-pre-wrap">{campaign.notes}</p>
                        </div>
                      )}

                      {/* Review & Approval */}
                      <div className="border-t border-slate-700/30 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          <h4 className="text-xs font-semibold text-white">Review & Approval</h4>
                        </div>

                        {campaign.reviews.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {campaign.reviews.map(rev => (
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

                        {reviewCampaignId === campaign.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={reviewText}
                              onChange={e => setReviewText(e.target.value)}
                              rows={3}
                              placeholder="Write your review..."
                              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { addCampaignReview(campaign.id, reviewText, 'approve'); setReviewCampaignId(null); }}
                                disabled={!reviewText.trim()}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => { addCampaignReview(campaign.id, reviewText, 'request_changes'); setReviewCampaignId(null); }}
                                disabled={!reviewText.trim()}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> Request Changes
                              </button>
                              <button
                                onClick={() => { addCampaignReview(campaign.id, reviewText, 'comment'); setReviewCampaignId(null); }}
                                disabled={!reviewText.trim()}
                                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" /> Comment
                              </button>
                              <button onClick={() => setReviewCampaignId(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-white">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setReviewCampaignId(campaign.id)}
                              className="px-3 py-1.5 text-xs rounded-lg border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" /> Add Review
                            </button>
                            <button
                              onClick={() => handleAiReview(campaign)}
                              disabled={!selectedBrand || aiReviewing}
                              className="px-3 py-1.5 text-xs rounded-lg border border-cyan-700/30 bg-cyan-500/10 text-cyan-400 hover:opacity-80 disabled:opacity-40 transition-colors flex items-center gap-1"
                            >
                              {aiReviewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              AI Director Review
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700/30 flex-wrap">
                        {campaign.status === 'Draft' && (
                          <button
                            onClick={() => updateCampaignStatus(campaign.id, 'Pending Approval')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Submit for Approval
                          </button>
                        )}
                        {campaign.status === 'Approved' && (
                          <button
                            onClick={() => { setScheduleCampaignId(campaign.id); setSchedDate(campaign.startDate); }}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3" /> Schedule Launch
                          </button>
                        )}
                        {campaign.status === 'Scheduled' && (
                          <button
                            onClick={() => updateCampaignStatus(campaign.id, 'Live')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" /> Push to Platform
                          </button>
                        )}
                        {campaign.status === 'Live' && (
                          <button
                            onClick={() => updateCampaignStatus(campaign.id, 'Paused')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Pause className="w-3 h-3" /> Pause
                          </button>
                        )}
                        {campaign.status === 'Paused' && (
                          <>
                            <button
                              onClick={() => updateCampaignStatus(campaign.id, 'Live')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Resume
                            </button>
                            <button
                              onClick={() => updateCampaignStatus(campaign.id, 'Completed')}
                              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Complete
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openEditForm(campaign)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 hover:bg-white/[0.04]"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Schedule Campaign Modal ──────────── */}
      {scheduleCampaignId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Schedule Campaign Launch
              </h3>
              <button onClick={() => setScheduleCampaignId(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Launch Date</label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Launch Time</label>
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/30"
                />
              </div>

              {/* Pre-launch checklist */}
              <div className="border-t border-slate-700/30 pt-3">
                <p className="text-[10px] uppercase text-slate-500 mb-2 font-semibold">Pre-Launch Checklist</p>
                {['Creative assets uploaded', 'Audience targeting verified', 'Budget & bid strategy confirmed', 'Pixel/conversion tracking set', 'Landing page tested', 'UTM parameters added'].map(item => (
                  <label key={item} className="flex items-center gap-2 py-1 cursor-pointer group">
                    <input type="checkbox" className="rounded border-slate-600 bg-white/[0.02] text-cyan-500 focus:ring-cyan-500/20" />
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700/50">
              <button onClick={() => setScheduleCampaignId(null)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={() => scheduleCampaign(scheduleCampaignId)}
                disabled={!schedDate}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <Clock className="w-3 h-3" /> Schedule Launch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Campaign Modal ──────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">
                {editingCampaign ? 'Edit' : 'New'} Ad Campaign
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Campaign Name</label>
                  <input value={formData.name} onChange={e => updateForm('name', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30" placeholder="Campaign name" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Platform</label>
                  <select value={formData.platform} onChange={e => updateForm('platform', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/30">
                    {platforms.map(p => <option key={p.id} value={p.platform}>{p.platform}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Status</label>
                  <select value={formData.status} onChange={e => updateForm('status', e.target.value as CampaignStatus)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/30">
                    {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Objective</label>
                  <select value={formData.objective} onChange={e => updateForm('objective', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/30">
                    {OBJECTIVES.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Budget</label>
                  <input value={formData.budget} onChange={e => updateForm('budget', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30" placeholder="$500" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Ad Format</label>
                  <select value={formData.adFormat} onChange={e => updateForm('adFormat', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/30">
                    {AD_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => updateForm('startDate', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/30" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">End Date</label>
                  <input type="date" value={formData.endDate} onChange={e => updateForm('endDate', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/30" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Bid Strategy</label>
                  <select value={formData.bidStrategy} onChange={e => updateForm('bidStrategy', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/30">
                    {BID_STRATEGIES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              {/* Targeting */}
              <div className="border-t border-slate-700/30 pt-4">
                <h4 className="text-[10px] uppercase text-cyan-400 mb-3 font-semibold">Audience Targeting</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 mb-1 block">Audience Description</label>
                    <input value={formData.audience} onChange={e => updateForm('audience', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30" placeholder="Business owners, decision makers..." />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 mb-1 block">Age Range</label>
                    <input value={formData.ageRange} onChange={e => updateForm('ageRange', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30" placeholder="25-45" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 mb-1 block">Locations</label>
                    <input value={formData.locations} onChange={e => updateForm('locations', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30" placeholder="Hong Kong, Singapore..." />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 mb-1 block">Interests</label>
                    <input value={formData.interests} onChange={e => updateForm('interests', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30" placeholder="Digital marketing, AI, business growth..." />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Placements</label>
                  <input value={formData.placements} onChange={e => updateForm('placements', e.target.value)} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30" placeholder="Automatic, Feed, Stories, Reels..." />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Notes</label>
                <textarea value={formData.notes} onChange={e => updateForm('notes', e.target.value)} rows={2} className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 resize-none" placeholder="Strategy notes..." />
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50">
              <div>
                {editingCampaign && (
                  <button onClick={() => { deleteCampaign(editingCampaign.id); setShowForm(false); }} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors">Cancel</button>
                <button onClick={saveCampaign} disabled={!formData.name} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1">
                  <Save className="w-3 h-3" /> {editingCampaign ? 'Update' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
