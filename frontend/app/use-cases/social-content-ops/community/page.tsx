'use client';

import { useState, useCallback } from 'react';
import {
  Users, AlertCircle, MessageCircle, Heart, Flag, TrendingUp, Clock,
  Loader2, Sparkles, ChevronDown, ChevronUp, Send, RefreshCw,
  ThumbsUp, ThumbsDown, Minus, AlertTriangle, Mail, Bell,
  Hash, AtSign, Plus, Trash2, X, Save,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

type Sentiment = 'positive' | 'neutral' | 'negative';
type InteractionType = 'comment' | 'dm' | 'mention' | 'review' | 'tag';
type QueueFilter = 'all' | 'unread' | 'requires_response' | 'flagged' | 'positive';

interface Interaction {
  id: string;
  type: InteractionType;
  platform: string;
  user: string;
  content: string;
  sentiment: Sentiment;
  timestamp: string;
  responded: boolean;
  flagged: boolean;
  aiSuggestedReply: string;
  notes: string;
}

interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  language: string;
}

/* ── Sample data ────────────────────────── */

const SAMPLE_INTERACTIONS: Interaction[] = [
  {
    id: '1', type: 'comment', platform: 'IG', user: '@design.lover',
    content: 'This is amazing! How can I learn more about your AI services?',
    sentiment: 'positive', timestamp: '2 min ago', responded: false, flagged: false,
    aiSuggestedReply: 'Thanks so much! 🙏 We\'d love to tell you more — drop us a DM or visit the link in our bio for a free consultation!',
    notes: '',
  },
  {
    id: '2', type: 'dm', platform: 'IG', user: '@startup.ceo',
    content: 'Hi, I saw your post about AI agents. We\'re interested in a demo. Can we schedule a call?',
    sentiment: 'positive', timestamp: '15 min ago', responded: false, flagged: false,
    aiSuggestedReply: 'Hi! Thanks for reaching out! We\'d love to schedule a demo. Let me check our availability — are you free this week? In the meantime, feel free to check out our case studies on the website.',
    notes: '',
  },
  {
    id: '3', type: 'comment', platform: 'FB', user: 'Sarah Chen',
    content: 'The checkout page keeps crashing on mobile. Very frustrated with the experience.',
    sentiment: 'negative', timestamp: '32 min ago', responded: false, flagged: true,
    aiSuggestedReply: 'Hi Sarah, we\'re sorry about this experience. Our team is looking into it right now. Could you DM us your device and browser info? We\'ll get this sorted for you ASAP.',
    notes: '',
  },
  {
    id: '4', type: 'mention', platform: 'X', user: '@techreview_hk',
    content: 'Just tried @5ml_ai\'s new content platform. The AI calendar generation is surprisingly good. 8/10 would recommend.',
    sentiment: 'positive', timestamp: '1 hr ago', responded: false, flagged: false,
    aiSuggestedReply: 'Thanks for the kind review! 🎉 We\'re constantly improving — stay tuned for even more features coming soon. Let us know if you have any feedback!',
    notes: '',
  },
  {
    id: '5', type: 'review', platform: 'Google', user: 'Mark Wong',
    content: 'Good service but the onboarding process took too long. 3 stars.',
    sentiment: 'neutral', timestamp: '3 hrs ago', responded: false, flagged: false,
    aiSuggestedReply: 'Hi Mark, thanks for your feedback! We\'ve recently streamlined our onboarding process. We\'d love the chance to show you our improvements. Feel free to reach out anytime.',
    notes: '',
  },
];

const SAMPLE_TEMPLATES: ResponseTemplate[] = [
  { id: '1', name: 'Thank You (General)', category: 'Positive', template: 'Thanks so much for your kind words! 🙏 We really appreciate your support. Stay tuned for more exciting updates!', language: 'EN' },
  { id: '2', name: 'Issue Acknowledgment', category: 'Negative', template: 'We\'re sorry to hear about this experience. Our team is investigating now. Could you DM us more details so we can resolve this quickly?', language: 'EN' },
  { id: '3', name: 'Lead Follow-up', category: 'Lead', template: 'Thanks for your interest! We\'d love to learn more about your needs. Feel free to DM us or book a free consultation via the link in our bio.', language: 'EN' },
  { id: '4', name: 'FAQ Redirect', category: 'FAQ', template: 'Great question! You can find the answer in our FAQ section — [link]. Let us know if you need any further help!', language: 'EN' },
  { id: '5', name: '多謝支持', category: 'Positive', template: '多謝你嘅支持！🙏 我哋會繼續努力，記得follow我哋唔好錯過更新！', language: '粵' },
  { id: '6', name: '問題處理', category: 'Negative', template: '唔好意思帶嚟不便！我哋團隊已經跟進緊，可以PM我哋詳情方便我哋儘快處理？', language: '粵' },
];

const SENTIMENT_CONFIG = {
  positive: { icon: ThumbsUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-700/30' },
  neutral: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-700/30', border: 'border-slate-700/50' },
  negative: { icon: ThumbsDown, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-700/30' },
};

const TYPE_LABELS: Record<InteractionType, { label: string; color: string }> = {
  comment: { label: 'Comment', color: 'text-blue-400' },
  dm: { label: 'DM', color: 'text-purple-400' },
  mention: { label: 'Mention', color: 'text-pink-400' },
  review: { label: 'Review', color: 'text-amber-400' },
  tag: { label: 'Tag', color: 'text-cyan-400' },
};

const PLATFORM_COLORS: Record<string, string> = {
  IG: 'text-pink-400', FB: 'text-blue-400', X: 'text-slate-300',
  Google: 'text-amber-400', LinkedIn: 'text-cyan-400',
};

/* ── Component ──────────────────────────── */

export default function CommunityManagementPage() {
  const { selectedBrand } = useBrandProject();
  const [interactions, setInteractions] = useState<Interaction[]>(SAMPLE_INTERACTIONS);
  const [templates, setTemplates] = useState<ResponseTemplate[]>(SAMPLE_TEMPLATES);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [selectedInteraction, setSelectedInteraction] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<'inbox' | 'templates'>('inbox');

  // Template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState<ResponseTemplate>({ id: '', name: '', category: 'Positive', template: '', language: 'EN' });

  // Filter interactions
  const filtered = interactions.filter(i => {
    if (filter === 'unread') return !i.responded;
    if (filter === 'requires_response') return !i.responded && (i.type === 'dm' || i.sentiment === 'negative');
    if (filter === 'flagged') return i.flagged;
    if (filter === 'positive') return i.sentiment === 'positive';
    return true;
  });

  const queueCounts = {
    all: interactions.length,
    unread: interactions.filter(i => !i.responded).length,
    requires_response: interactions.filter(i => !i.responded && (i.type === 'dm' || i.sentiment === 'negative')).length,
    flagged: interactions.filter(i => i.flagged).length,
    positive: interactions.filter(i => i.sentiment === 'positive').length,
  };

  // Sentiment summary
  const sentimentSummary = {
    positive: interactions.filter(i => i.sentiment === 'positive').length,
    neutral: interactions.filter(i => i.sentiment === 'neutral').length,
    negative: interactions.filter(i => i.sentiment === 'negative').length,
  };
  const totalSentiment = sentimentSummary.positive + sentimentSummary.neutral + sentimentSummary.negative;

  /* ── AI Generate Reply ─────────────────── */

  const handleAiReply = useCallback(async (interaction: Interaction) => {
    if (!selectedBrand) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a professional, on-brand reply for "${selectedBrand.name}" to this ${interaction.platform} ${interaction.type}:

From: ${interaction.user}
Content: "${interaction.content}"
Sentiment: ${interaction.sentiment}

Requirements:
- Match the brand voice
- Be empathetic if negative sentiment
- Include CTA if positive/neutral
- Keep under 280 characters for X, under 500 for others
- If appropriate, offer to move to DM for complex issues

Return ONLY the reply text, no other formatting.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Community Management',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplyText(data.message || '');
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand]);

  function markResponded(id: string) {
    setInteractions(interactions.map(i => i.id === id ? { ...i, responded: true } : i));
    setSelectedInteraction(null);
    setReplyText('');
  }

  function toggleFlag(id: string) {
    setInteractions(interactions.map(i => i.id === id ? { ...i, flagged: !i.flagged } : i));
  }

  function saveTemplate() {
    if (!templateForm.name || !templateForm.template) return;
    const t = { ...templateForm, id: templateForm.id || `t-${Date.now()}` };
    setTemplates([...templates, t]);
    setShowTemplateForm(false);
    setTemplateForm({ id: '', name: '', category: 'Positive', template: '', language: 'EN' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-orange-400" />
            <h1 className="text-2xl font-bold text-white">Community Management</h1>
          </div>
          <p className="text-sm text-slate-400">
            Daily engagement, response management, and sentiment tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700/50 rounded-lg transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
        </div>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to manage community interactions.</p>
        </div>
      )}

      {/* Queues + Sentiment Overview */}
      <div className="grid grid-cols-5 gap-3">
        {([
          { key: 'all', label: 'All', icon: MessageCircle, color: 'text-slate-400' },
          { key: 'unread', label: 'Unread', icon: Clock, color: 'text-blue-400' },
          { key: 'requires_response', label: 'Needs Reply', icon: AlertTriangle, color: 'text-amber-400' },
          { key: 'flagged', label: 'Flagged', icon: Flag, color: 'text-red-400' },
          { key: 'positive', label: 'Positive', icon: Heart, color: 'text-pink-400' },
        ] as const).map(q => {
          const Icon = q.icon;
          const active = filter === q.key;
          return (
            <button
              key={q.key}
              onClick={() => setFilter(q.key)}
              className={`p-3 rounded-xl border transition-all text-left ${
                active
                  ? 'bg-orange-500/10 border-orange-700/30 ring-1 ring-orange-500/20'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-400' : q.color}`} />
                {q.key === 'requires_response' && queueCounts[q.key] > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <p className="text-lg font-bold text-white">{queueCounts[q.key]}</p>
              <p className="text-[10px] text-slate-500">{q.label}</p>
            </button>
          );
        })}
      </div>

      {/* Sentiment bar */}
      {totalSentiment > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white">Sentiment Overview</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-emerald-400">{sentimentSummary.positive} positive</span>
              <span className="text-slate-400">{sentimentSummary.neutral} neutral</span>
              <span className="text-red-400">{sentimentSummary.negative} negative</span>
            </div>
          </div>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 transition-all" style={{ width: `${sentimentSummary.positive / totalSentiment * 100}%` }} />
            <div className="bg-slate-500 transition-all" style={{ width: `${sentimentSummary.neutral / totalSentiment * 100}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${sentimentSummary.negative / totalSentiment * 100}%` }} />
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1">
        {[
          { key: 'inbox', label: `Inbox (${filtered.length})` },
          { key: 'templates', label: `Response Templates (${templates.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'inbox' | 'templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.key
                ? 'bg-orange-600/20 text-orange-400 border border-orange-700/30'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INBOX TAB ──────────────────────── */}
      {tab === 'inbox' && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white/[0.02] border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
              <MessageCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No interactions in this queue</p>
            </div>
          ) : filtered.map(interaction => {
            const sentCfg = SENTIMENT_CONFIG[interaction.sentiment];
            const SentIcon = sentCfg.icon;
            const typeCfg = TYPE_LABELS[interaction.type];
            const isSelected = selectedInteraction === interaction.id;

            return (
              <div key={interaction.id} className={`bg-slate-800/60 border rounded-xl overflow-hidden transition-all ${
                interaction.flagged ? 'border-red-700/30' : 'border-slate-700/50'
              } ${interaction.responded ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => {
                    setSelectedInteraction(isSelected ? null : interaction.id);
                    setReplyText(interaction.aiSuggestedReply);
                  }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <SentIcon className={`w-3.5 h-3.5 flex-shrink-0 ${sentCfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] ${PLATFORM_COLORS[interaction.platform] || 'text-slate-400'}`}>{interaction.platform}</span>
                      <span className={`text-[10px] ${typeCfg.color}`}>{typeCfg.label}</span>
                      <span className="text-xs text-white font-medium">{interaction.user}</span>
                      {interaction.flagged && <Flag className="w-2.5 h-2.5 text-red-400" />}
                      {interaction.responded && <span className="text-[9px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Responded</span>}
                    </div>
                    <p className="text-xs text-slate-300 truncate">{interaction.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 whitespace-nowrap">{interaction.timestamp}</span>
                  {isSelected ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                {isSelected && (
                  <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                    {/* Full message */}
                    <div className={`${sentCfg.bg} border ${sentCfg.border} rounded-lg p-3`}>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{interaction.content}</p>
                    </div>

                    {/* Reply area */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] uppercase text-slate-500 font-medium">Reply</label>
                        <div className="flex gap-1">
                          {templates.slice(0, 3).map(t => (
                            <button
                              key={t.id}
                              onClick={() => setReplyText(t.template)}
                              className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] text-slate-500 hover:text-white rounded transition-colors"
                              title={t.name}
                            >
                              {t.name}
                            </button>
                          ))}
                          <button
                            disabled={!selectedBrand || generating}
                            onClick={() => handleAiReply(interaction)}
                            className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded flex items-center gap-0.5 disabled:opacity-40"
                          >
                            {generating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                            AI Reply
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={3}
                        className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/30 resize-none"
                        placeholder="Type your reply..."
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFlag(interaction.id)}
                          className={`px-2 py-1 text-[10px] rounded transition-colors flex items-center gap-1 ${
                            interaction.flagged
                              ? 'text-red-400 bg-red-400/10'
                              : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
                          }`}
                        >
                          <Flag className="w-2.5 h-2.5" /> {interaction.flagged ? 'Unflag' : 'Flag'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => markResponded(interaction.id)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700/50 rounded-lg transition-colors"
                        >
                          Mark Responded
                        </button>
                        <button
                          onClick={() => markResponded(interaction.id)}
                          disabled={!replyText}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TEMPLATES TAB ──────────────────── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTemplateForm(true)}
              className="px-3 py-1.5 text-xs rounded-lg border border-orange-700/30 bg-orange-500/10 text-orange-400 hover:opacity-80 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map(t => (
              <div key={t.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white">{t.name}</h3>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] text-slate-500 rounded">{t.category}</span>
                    <span className="text-[9px] px-1 py-0.5 bg-purple-500/10 text-purple-400 rounded">{t.language}</span>
                  </div>
                  <button
                    onClick={() => setTemplates(templates.filter(x => x.id !== t.id))}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">{t.template}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Template Modal ──────────────── */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">New Response Template</h3>
              <button onClick={() => setShowTemplateForm(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Template Name</label>
                  <input
                    value={templateForm.name}
                    onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/30"
                    placeholder="Thank You (General)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 mb-1 block">Category</label>
                    <select
                      value={templateForm.category}
                      onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/30"
                    >
                      {['Positive', 'Negative', 'Lead', 'FAQ', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 mb-1 block">Language</label>
                    <select
                      value={templateForm.language}
                      onChange={e => setTemplateForm({ ...templateForm, language: e.target.value })}
                      className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/30"
                    >
                      {['EN', '粵', '繁中', '簡中'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Template Text</label>
                <textarea
                  value={templateForm.template}
                  onChange={e => setTemplateForm({ ...templateForm, template: e.target.value })}
                  rows={4}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/30 resize-none"
                  placeholder="Type the template response..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700/50">
              <button onClick={() => setShowTemplateForm(false)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg">Cancel</button>
              <button
                onClick={saveTemplate}
                disabled={!templateForm.name || !templateForm.template}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 flex items-center gap-1"
              >
                <Save className="w-3 h-3" /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note about Meta API */}
      <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          <h3 className="text-xs font-medium text-slate-400">Meta API Integration</h3>
        </div>
        <p className="text-[10px] text-slate-500">
          Currently using sample data. Connect Meta Graph API, X API, and Google Business Profile
          to sync real comments, DMs, mentions, and reviews in real time.
        </p>
      </div>
    </div>
  );
}
