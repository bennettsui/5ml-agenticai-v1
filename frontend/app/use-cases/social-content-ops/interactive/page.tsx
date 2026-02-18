'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles, AlertCircle, Zap, MessageCircle, Vote, Gamepad2, Camera,
  Plus, Trash2, ChevronDown, ChevronUp, Loader2, Calendar, Clock,
  Target, Users, Hash, Save, X, Edit3, Copy, Eye,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

type ContentType = 'polls' | 'quizzes' | 'qna' | 'ar' | 'stories' | 'ugc';

interface InteractiveCampaign {
  id: string;
  type: ContentType;
  name: string;
  platform: string;
  startDate: string;
  endDate: string;
  objective: string;
  targetAudience: string;
  description: string;
  contentDetails: string;
  cta: string;
  hashtags: string;
  status: 'Draft' | 'Planned' | 'Active' | 'Completed';
  notes: string;
}

/* ── Config ─────────────────────────────── */

const INTERACTIVE_TYPES: {
  id: ContentType; label: string; icon: typeof Vote; desc: string;
  platforms: string[]; color: string; templates: string[];
}[] = [
  {
    id: 'polls', label: 'Polls & Surveys', icon: Vote,
    desc: 'Engage audience with quick polls and multi-question surveys',
    platforms: ['IG Stories', 'X/Twitter', 'LinkedIn', 'FB'],
    color: 'purple',
    templates: ['This or That', 'Opinion Poll', 'Product Preference', 'NPS Survey', 'Feedback Survey'],
  },
  {
    id: 'quizzes', label: 'Quizzes', icon: Gamepad2,
    desc: 'Create interactive quizzes for education and entertainment',
    platforms: ['IG Stories', 'Web embed', 'FB'],
    color: 'pink',
    templates: ['Knowledge Quiz', 'Personality Quiz', 'Product Finder', 'Trivia Challenge', 'Industry IQ Test'],
  },
  {
    id: 'qna', label: 'Q&A Sessions', icon: MessageCircle,
    desc: 'Host live or async Q&A with audience',
    platforms: ['IG Live', 'LinkedIn Live', 'X Spaces', 'YouTube Live'],
    color: 'blue',
    templates: ['AMA (Ask Me Anything)', 'Expert Panel Q&A', 'Product Launch Q&A', 'Monthly Community Q&A'],
  },
  {
    id: 'ar', label: 'AR Filters', icon: Camera,
    desc: 'Custom branded AR filters and effects',
    platforms: ['Instagram', 'TikTok', 'Snapchat'],
    color: 'amber',
    templates: ['Brand Frame/Border', 'Try-On Effect', 'Face Filter', 'World Effect', 'Game Filter'],
  },
  {
    id: 'stories', label: 'Interactive Stories', icon: Zap,
    desc: 'Story sequences with branching paths and CTAs',
    platforms: ['IG Stories', 'FB Stories'],
    color: 'emerald',
    templates: ['Choose Your Path', 'Countdown Series', 'Behind the Scenes', 'Day in the Life', 'Product Reveal'],
  },
  {
    id: 'ugc', label: 'Contests & UGC', icon: Sparkles,
    desc: 'User-generated content campaigns and contests',
    platforms: ['All platforms'],
    color: 'cyan',
    templates: ['Photo Contest', 'Video Challenge', 'Hashtag Campaign', 'Testimonial Drive', 'Creative Remix'],
  },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-700/30', badge: 'bg-purple-500/20 text-purple-400' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-700/30', badge: 'bg-pink-500/20 text-pink-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-700/30', badge: 'bg-blue-500/20 text-blue-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-700/30', badge: 'bg-amber-500/20 text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-700/30', badge: 'bg-emerald-500/20 text-emerald-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-700/30', badge: 'bg-cyan-500/20 text-cyan-400' },
};

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-700/50 text-slate-400',
  Planned: 'bg-blue-500/20 text-blue-400',
  Active: 'bg-emerald-500/20 text-emerald-400',
  Completed: 'bg-purple-500/20 text-purple-400',
};

/* ── Helpers ─────────────────────────────── */

function emptyCampaign(type: ContentType): InteractiveCampaign {
  return {
    id: '', type, name: '', platform: '', startDate: '', endDate: '',
    objective: '', targetAudience: '', description: '', contentDetails: '',
    cta: '', hashtags: '', status: 'Draft', notes: '',
  };
}

/* ── Component ──────────────────────────── */

export default function InteractiveContentPage() {
  const { selectedBrand } = useBrandProject();
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [campaigns, setCampaigns] = useState<InteractiveCampaign[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<InteractiveCampaign | null>(null);
  const [formData, setFormData] = useState<InteractiveCampaign>(emptyCampaign('polls'));

  const typeConfig = selectedType ? INTERACTIVE_TYPES.find(t => t.id === selectedType) : null;
  const filteredCampaigns = selectedType
    ? campaigns.filter(c => c.type === selectedType)
    : campaigns;

  /* ── AI Generate ─────────────────────── */

  const handleAiGenerate = useCallback(async () => {
    if (!selectedBrand || !typeConfig) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate 3 interactive ${typeConfig.label} campaign ideas for "${selectedBrand.name}".

For each campaign, provide as a JSON array:
[{
  "name": "Campaign name",
  "platform": "Best platform for this",
  "objective": "What this achieves",
  "targetAudience": "Who this targets",
  "description": "2-3 sentence description of the campaign concept",
  "contentDetails": "Specific content: questions for polls/quizzes, topics for Q&A, filter description for AR, story flow for stories, contest rules for UGC",
  "cta": "Call to action text",
  "hashtags": "#brand #campaign #relevant"
}]

Available platforms: ${typeConfig.platforms.join(', ')}
Available templates: ${typeConfig.templates.join(', ')}

Return ONLY the JSON array.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message || '';
        try {
          const jsonMatch = msg.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Partial<InteractiveCampaign>[];
            const newCampaigns: InteractiveCampaign[] = parsed.map((c, i) => ({
              id: `${selectedType}-${Date.now()}-${i}`,
              type: selectedType!,
              name: c.name || `${typeConfig.label} Campaign ${i + 1}`,
              platform: c.platform || typeConfig.platforms[0],
              startDate: '',
              endDate: '',
              objective: c.objective || '',
              targetAudience: c.targetAudience || '',
              description: c.description || '',
              contentDetails: c.contentDetails || '',
              cta: c.cta || '',
              hashtags: c.hashtags || '',
              status: 'Draft' as const,
              notes: '',
            }));
            setCampaigns(prev => [...prev, ...newCampaigns]);
          }
        } catch {
          console.log('AI response (non-JSON):', msg.slice(0, 500));
        }
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand, typeConfig, selectedType]);

  /* ── CRUD ──────────────────────────────── */

  function openAddForm() {
    if (!selectedType) return;
    setFormData(emptyCampaign(selectedType));
    setEditingCampaign(null);
    setShowForm(true);
  }

  function openEditForm(campaign: InteractiveCampaign) {
    setFormData({ ...campaign });
    setEditingCampaign(campaign);
    setShowForm(true);
  }

  function saveCampaign() {
    const data = { ...formData };
    if (!data.name) return;
    if (!data.id) {
      data.id = `${data.type}-${Date.now()}`;
    }
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

  function updateForm<K extends keyof InteractiveCampaign>(key: K, value: InteractiveCampaign[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h1 className="text-2xl font-bold text-white">Interactive Content Planning</h1>
          </div>
          <p className="text-sm text-slate-400">
            Plan interactive experiences — polls, quizzes, AR filters, stories, contests
          </p>
        </div>
        {selectedType && (
          <div className="flex items-center gap-2">
            <button
              disabled={!selectedBrand || generating}
              onClick={handleAiGenerate}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Generate Ideas
            </button>
            <button
              onClick={openAddForm}
              className="px-3 py-1.5 text-xs rounded-lg border border-pink-700/30 bg-pink-500/10 text-pink-400 hover:opacity-80 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New Campaign
            </button>
          </div>
        )}
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to plan interactive content.</p>
        </div>
      )}

      {/* Content Type Selector */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Content Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {INTERACTIVE_TYPES.map(it => {
            const Icon = it.icon;
            const colors = TYPE_COLORS[it.color];
            const active = selectedType === it.id;
            const typeCount = campaigns.filter(c => c.type === it.id).length;
            return (
              <button
                key={it.id}
                onClick={() => setSelectedType(selectedType === it.id ? null : it.id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  active
                    ? `${colors.bg} ${colors.border} ring-1 ring-white/10`
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${active ? colors.text : 'text-slate-500'}`} />
                  {typeCount > 0 && (
                    <span className={`text-[9px] px-1 py-0.5 rounded-full ${colors.badge}`}>{typeCount}</span>
                  )}
                </div>
                <h3 className={`text-[11px] font-medium ${active ? 'text-white' : 'text-slate-300'}`}>{it.label}</h3>
                <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">{it.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Type Detail */}
      {typeConfig && (
        <div className="space-y-5">
          {/* Templates & Platforms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white mb-2">Templates</h3>
              <div className="flex flex-wrap gap-1.5">
                {typeConfig.templates.map(t => (
                  <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_COLORS[typeConfig.color].border} ${TYPE_COLORS[typeConfig.color].text}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white mb-2">Supported Platforms</h3>
              <div className="flex flex-wrap gap-1.5">
                {typeConfig.platforms.map(p => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Campaigns List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Campaigns</h2>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{filteredCampaigns.length}</span>
              </div>
            </div>

            {filteredCampaigns.length === 0 ? (
              <div className="bg-white/[0.02] border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
                <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-3">No {typeConfig.label.toLowerCase()} campaigns yet</p>
                <div className="flex gap-2 justify-center">
                  <button
                    disabled={!selectedBrand || generating}
                    onClick={handleAiGenerate}
                    className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs disabled:opacity-40 transition-colors flex items-center gap-1"
                  >
                    {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Generate Ideas
                  </button>
                  <button onClick={openAddForm} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700/50 rounded-lg transition-colors">
                    Create Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCampaigns.map(campaign => {
                  const isExpanded = expandedCampaign === campaign.id;
                  const colors = TYPE_COLORS[typeConfig.color];
                  return (
                    <div key={campaign.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium truncate">{campaign.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[campaign.status]}`}>
                              {campaign.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-slate-500">{campaign.platform}</span>
                            {campaign.startDate && (
                              <span className="text-[10px] text-slate-600">{campaign.startDate}{campaign.endDate ? ` → ${campaign.endDate}` : ''}</span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                          {campaign.objective && (
                            <div>
                              <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Objective</label>
                              <p className="text-xs text-slate-300">{campaign.objective}</p>
                            </div>
                          )}
                          {campaign.targetAudience && (
                            <div>
                              <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Target Audience</label>
                              <p className="text-xs text-slate-300">{campaign.targetAudience}</p>
                            </div>
                          )}
                          {campaign.description && (
                            <div>
                              <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Description</label>
                              <p className="text-xs text-slate-300 whitespace-pre-wrap">{campaign.description}</p>
                            </div>
                          )}
                          {campaign.contentDetails && (
                            <div className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
                              <label className={`text-[10px] uppercase ${colors.text} mb-1 block font-medium`}>Content Details</label>
                              <p className="text-xs text-slate-300 whitespace-pre-wrap">{campaign.contentDetails}</p>
                            </div>
                          )}
                          {campaign.cta && (
                            <div>
                              <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Call to Action</label>
                              <p className="text-xs text-white font-medium">{campaign.cta}</p>
                            </div>
                          )}
                          {campaign.hashtags && (
                            <div>
                              <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Hashtags</label>
                              <p className={`text-xs ${colors.text}`}>{campaign.hashtags}</p>
                            </div>
                          )}
                          {campaign.notes && (
                            <div>
                              <label className="text-[10px] uppercase text-slate-500 mb-0.5 block">Notes</label>
                              <p className="text-xs text-slate-400">{campaign.notes}</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
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
        </div>
      )}

      {/* Fallback when no type selected */}
      {!selectedType && (
        <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-1">Select a content type above to start planning</p>
          <p className="text-xs text-slate-600">Each type has templates, platform support, and AI campaign generation</p>
        </div>
      )}

      {/* ── Add/Edit Campaign Modal ──────── */}
      {showForm && typeConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {editingCampaign ? 'Edit' : 'New'} {typeConfig.label} Campaign
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Row 1: Name, Platform, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Campaign Name</label>
                  <input
                    value={formData.name}
                    onChange={e => updateForm('name', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30"
                    placeholder="Give it a catchy name"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={e => updateForm('platform', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/30"
                  >
                    <option value="">Select platform</option>
                    {typeConfig.platforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => updateForm('status', e.target.value as InteractiveCampaign['status'])}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/30"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Planned">Planned</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => updateForm('startDate', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => updateForm('endDate', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/30"
                  />
                </div>
              </div>

              {/* Objective & Audience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Objective</label>
                  <input
                    value={formData.objective}
                    onChange={e => updateForm('objective', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30"
                    placeholder="Engagement, awareness, lead gen..."
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Target Audience</label>
                  <input
                    value={formData.targetAudience}
                    onChange={e => updateForm('targetAudience', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30"
                    placeholder="Who is this for?"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={3}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30 resize-none"
                  placeholder="Describe the campaign concept..."
                />
              </div>

              {/* Content Details */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">
                  Content Details
                  <span className="normal-case ml-1 text-slate-600">
                    ({selectedType === 'polls' ? 'Poll questions & options' :
                      selectedType === 'quizzes' ? 'Quiz questions & answers' :
                      selectedType === 'qna' ? 'Q&A topics & format' :
                      selectedType === 'ar' ? 'Filter description & specs' :
                      selectedType === 'stories' ? 'Story flow & branches' :
                      'Contest rules & mechanics'})
                  </span>
                </label>
                <textarea
                  value={formData.contentDetails}
                  onChange={e => updateForm('contentDetails', e.target.value)}
                  rows={4}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30 resize-none"
                  placeholder="Specific content details for this type..."
                />
              </div>

              {/* CTA & Hashtags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Call to Action</label>
                  <input
                    value={formData.cta}
                    onChange={e => updateForm('cta', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30"
                    placeholder="Vote now! / Take the quiz / Join the challenge"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Hashtags</label>
                  <input
                    value={formData.hashtags}
                    onChange={e => updateForm('hashtags', e.target.value)}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30"
                    placeholder="#brand #campaign"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  rows={2}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/30 resize-none"
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50">
              <div>
                {editingCampaign && (
                  <button
                    onClick={() => { deleteCampaign(editingCampaign.id); setShowForm(false); }}
                    className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveCampaign}
                  disabled={!formData.name}
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  {editingCampaign ? 'Update' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
