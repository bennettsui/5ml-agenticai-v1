'use client';

import { useState, useCallback } from 'react';
import {
  Activity, AlertCircle, Loader2, Sparkles, TrendingUp, TrendingDown,
  Bell, Mail, MessageSquare, Zap, AlertTriangle, Eye, Heart,
  MessageCircle, Share2, ChevronDown, ChevronUp, Plus, Trash2,
  Save, X, Settings, Clock, ThumbsUp, ThumbsDown, Minus,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertType = 'spike_likes' | 'spike_comments' | 'spike_shares' | 'negative_sentiment' | 'viral_potential' | 'mention_surge';
type NotificationChannel = 'email' | 'slack' | 'sms' | 'in_app';

interface MonitoringAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  platform: string;
  postTitle: string;
  metric: string;
  currentValue: string;
  baseline: string;
  change: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  timestamp: string;
  acknowledged: boolean;
  details: string;
  suggestedAction: string;
}

interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  threshold: string;
  channels: NotificationChannel[];
  enabled: boolean;
}

/* ── Sample data ────────────────────────── */

const SAMPLE_ALERTS: MonitoringAlert[] = [
  {
    id: '1', type: 'spike_likes', severity: 'warning',
    platform: 'IG', postTitle: 'Why AI Agents Save 10x Time (Reel)',
    metric: 'Likes', currentValue: '2,847', baseline: '~350 avg', change: '+713%',
    sentiment: 'positive', timestamp: '12 min ago', acknowledged: false,
    details: 'This Reel is significantly outperforming your average. It appears to have entered the Explore/Reels feed. Engagement is accelerating — comments are 80% positive with high save rate.',
    suggestedAction: 'Consider boosting this post with ad spend while momentum is high. Pin a comment with CTA. Respond to all comments within 1 hour to maintain engagement velocity.',
  },
  {
    id: '2', type: 'negative_sentiment', severity: 'critical',
    platform: 'FB', postTitle: 'March Offer – Free Audit (Static)',
    metric: 'Negative Comments', currentValue: '23', baseline: '~2 avg', change: '+1050%',
    sentiment: 'negative', timestamp: '45 min ago', acknowledged: false,
    details: 'Surge in negative comments about misleading offer terms. Multiple users reporting "bait and switch". Sentiment score dropped from 7.2 to 2.1 in the last hour. 3 comments threatening to report the post.',
    suggestedAction: 'URGENT: Review the offer terms for accuracy. Post a clarification comment immediately. Consider editing the post or adding a disclaimer. Assign community manager to respond to each complaint individually.',
  },
  {
    id: '3', type: 'viral_potential', severity: 'info',
    platform: 'TikTok', postTitle: 'Behind the Scenes: AI Content Pipeline',
    metric: 'Shares', currentValue: '456', baseline: '~25 avg', change: '+1724%',
    sentiment: 'positive', timestamp: '2 hrs ago', acknowledged: true,
    details: 'This video is being widely shared and stitched by other creators. Two accounts with 50K+ followers have stitched it. View velocity suggests potential viral trajectory.',
    suggestedAction: 'Engage with all stitches and duets. Create a follow-up video while the topic is hot. Consider a series based on the same theme.',
  },
  {
    id: '4', type: 'mention_surge', severity: 'warning',
    platform: 'X', postTitle: 'Brand mentions (not a specific post)',
    metric: 'Mentions', currentValue: '89', baseline: '~12/day', change: '+641%',
    sentiment: 'mixed', timestamp: '1 hr ago', acknowledged: false,
    details: 'Sudden increase in brand mentions on X. Appears to be triggered by an industry influencer tweet about AI content tools. Mix of positive curiosity and skeptical questions.',
    suggestedAction: 'Monitor the conversation thread. Engage with the influencer if appropriate. Prepare FAQ responses for common questions. Consider a proactive tweet addressing the discussion.',
  },
];

const SAMPLE_RULES: AlertRule[] = [
  { id: '1', name: 'Engagement Spike', type: 'spike_likes', threshold: '> 3x baseline', channels: ['email', 'in_app'], enabled: true },
  { id: '2', name: 'Comment Surge', type: 'spike_comments', threshold: '> 5x baseline', channels: ['email', 'slack'], enabled: true },
  { id: '3', name: 'Negative Sentiment Alert', type: 'negative_sentiment', threshold: 'Sentiment < 4.0/10', channels: ['email', 'sms', 'slack'], enabled: true },
  { id: '4', name: 'Viral Potential', type: 'viral_potential', threshold: 'Shares > 10x baseline', channels: ['email', 'in_app'], enabled: true },
  { id: '5', name: 'Mention Surge', type: 'mention_surge', threshold: '> 5x daily avg', channels: ['email', 'in_app'], enabled: true },
];

const SEVERITY_CONFIG: Record<AlertSeverity, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-700/30', text: 'text-red-400', icon: AlertTriangle },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-700/30', text: 'text-amber-400', icon: Zap },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-700/30', text: 'text-blue-400', icon: Eye },
};

const TYPE_LABELS: Record<AlertType, string> = {
  spike_likes: 'Like Spike',
  spike_comments: 'Comment Spike',
  spike_shares: 'Share Spike',
  negative_sentiment: 'Negative Sentiment',
  viral_potential: 'Viral Potential',
  mention_surge: 'Mention Surge',
};

const SENTIMENT_ICONS = {
  positive: { icon: ThumbsUp, color: 'text-emerald-400' },
  neutral: { icon: Minus, color: 'text-slate-400' },
  negative: { icon: ThumbsDown, color: 'text-red-400' },
  mixed: { icon: Activity, color: 'text-amber-400' },
};

const CHANNEL_CONFIG: Record<NotificationChannel, { icon: typeof Mail; label: string; color: string }> = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-400' },
  slack: { icon: MessageSquare, label: 'Slack', color: 'text-purple-400' },
  sms: { icon: MessageCircle, label: 'SMS', color: 'text-emerald-400' },
  in_app: { icon: Bell, label: 'In-App', color: 'text-amber-400' },
};

/* ── Component ──────────────────────────── */

export default function SocialMonitoringPage() {
  const { selectedBrand } = useBrandProject();
  const [alerts, setAlerts] = useState<MonitoringAlert[]>(SAMPLE_ALERTS);
  const [rules, setRules] = useState<AlertRule[]>(SAMPLE_RULES);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [tab, setTab] = useState<'alerts' | 'rules'>('alerts');
  const [generating, setGenerating] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');

  // Rule form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState<AlertRule>({
    id: '', name: '', type: 'spike_likes', threshold: '', channels: ['email', 'in_app'], enabled: true,
  });

  const filteredAlerts = filterSeverity === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filterSeverity);

  const alertCounts = {
    all: alerts.filter(a => !a.acknowledged).length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
    info: alerts.filter(a => a.severity === 'info' && !a.acknowledged).length,
  };

  /* ── AI Analyze ─────────────────────────── */

  const handleAiAnalyze = useCallback(async (alert: MonitoringAlert) => {
    if (!selectedBrand) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Analyze this social media alert for "${selectedBrand.name}" and provide detailed recommendations:

Alert: ${TYPE_LABELS[alert.type]}
Platform: ${alert.platform}
Post: ${alert.postTitle}
Metric: ${alert.metric} at ${alert.currentValue} (baseline: ${alert.baseline}, change: ${alert.change})
Sentiment: ${alert.sentiment}

Provide:
1. Root cause analysis (why this is happening)
2. Immediate actions (next 1-2 hours)
3. Short-term strategy (next 24-48 hours)
4. Long-term takeaway for future content

Be specific and actionable.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setAlerts(alerts.map(a =>
            a.id === alert.id ? { ...a, suggestedAction: data.message } : a
          ));
        }
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand, alerts]);

  function acknowledgeAlert(id: string) {
    setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }

  function saveRule() {
    if (!ruleForm.name) return;
    const r = { ...ruleForm, id: ruleForm.id || `rule-${Date.now()}` };
    setRules([...rules, r]);
    setShowRuleForm(false);
    setRuleForm({ id: '', name: '', type: 'spike_likes', threshold: '', channels: ['email', 'in_app'], enabled: true });
  }

  function toggleRule(id: string) {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-red-400" />
            <h1 className="text-2xl font-bold text-white">Social Monitoring</h1>
            {alertCounts.critical > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium animate-pulse">
                {alertCounts.critical} Critical
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Real-time spike detection, sentiment analysis, and instant notifications
          </p>
        </div>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to monitor social activity.</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { key: 'all', label: 'Active Alerts', icon: Bell, color: 'text-slate-400' },
          { key: 'critical', label: 'Critical', icon: AlertTriangle, color: 'text-red-400' },
          { key: 'warning', label: 'Warnings', icon: Zap, color: 'text-amber-400' },
          { key: 'info', label: 'Info', icon: Eye, color: 'text-blue-400' },
        ] as const).map(c => {
          const Icon = c.icon;
          const active = filterSeverity === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilterSeverity(c.key as AlertSeverity | 'all')}
              className={`p-3 rounded-xl border transition-all text-left ${
                active
                  ? 'bg-red-500/10 border-red-700/30 ring-1 ring-red-500/20'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 mb-1 ${active ? 'text-red-400' : c.color}`} />
              <p className="text-lg font-bold text-white">{alertCounts[c.key]}</p>
              <p className="text-[10px] text-slate-500">{c.label}</p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setTab('alerts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'alerts'
              ? 'bg-red-600/20 text-red-400 border border-red-700/30'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Activity className="w-3 h-3" /> Alerts ({filteredAlerts.length})
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'rules'
              ? 'bg-red-600/20 text-red-400 border border-red-700/30'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Settings className="w-3 h-3" /> Alert Rules ({rules.length})
        </button>
      </div>

      {/* ═══ ALERTS TAB ═══════════════════════ */}
      {tab === 'alerts' && (
        <div className="space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white/[0.02] border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
              <Activity className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No alerts in this category</p>
            </div>
          ) : filteredAlerts.map(alert => {
            const isExpanded = expandedAlert === alert.id;
            const sev = SEVERITY_CONFIG[alert.severity];
            const SevIcon = sev.icon;
            const sentCfg = SENTIMENT_ICONS[alert.sentiment];
            const SentIcon = sentCfg.icon;

            return (
              <div key={alert.id} className={`${sev.bg} border ${sev.border} rounded-xl overflow-hidden ${
                alert.acknowledged ? 'opacity-50' : ''
              }`}>
                <button
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <SevIcon className={`w-4 h-4 flex-shrink-0 ${sev.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-medium ${sev.text}`}>{TYPE_LABELS[alert.type]}</span>
                      <span className="text-[10px] text-slate-500">{alert.platform}</span>
                      <SentIcon className={`w-3 h-3 ${sentCfg.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium truncate">{alert.postTitle}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                      <span className="text-slate-400">{alert.metric}: <span className="text-white font-medium">{alert.currentValue}</span></span>
                      <span className={alert.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}>{alert.change}</span>
                      <span className="text-slate-600">baseline: {alert.baseline}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 whitespace-nowrap">{alert.timestamp}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 mb-1 block">Analysis</label>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{alert.details}</p>
                    </div>

                    <div className={`${sev.bg} border ${sev.border} rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[10px] uppercase ${sev.text} font-medium`}>Suggested Action</label>
                        <button
                          disabled={!selectedBrand || generating}
                          onClick={() => handleAiAnalyze(alert)}
                          className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sev.text} bg-white/[0.05] disabled:opacity-40`}
                        >
                          {generating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                          AI Analyze
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{alert.suggestedAction}</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ RULES TAB ═══════════════════════ */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Configure when and how you get notified about social media activity spikes.
            </p>
            <button
              onClick={() => setShowRuleForm(true)}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-700/30 bg-red-500/10 text-red-400 hover:opacity-80 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Rule
            </button>
          </div>

          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className={`bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 ${
                !rule.enabled ? 'opacity-50' : ''
              }`}>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    rule.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    rule.enabled ? 'left-[22px]' : 'left-0.5'
                  }`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{rule.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] text-slate-500 rounded">{TYPE_LABELS[rule.type]}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">Threshold: {rule.threshold}</span>
                    <span className="text-[10px] text-slate-600">→</span>
                    <div className="flex gap-1">
                      {rule.channels.map(ch => {
                        const cfg = CHANNEL_CONFIG[ch];
                        const ChIcon = cfg.icon;
                        return (
                          <span key={ch} className={`text-[9px] flex items-center gap-0.5 ${cfg.color}`}>
                            <ChIcon className="w-2.5 h-2.5" /> {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Rule Modal ──────────────────── */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">New Alert Rule</h3>
              <button onClick={() => setShowRuleForm(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Rule Name</label>
                <input
                  value={ruleForm.name}
                  onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/30"
                  placeholder="e.g., Engagement Spike Alert"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Alert Type</label>
                  <select
                    value={ruleForm.type}
                    onChange={e => setRuleForm({ ...ruleForm, type: e.target.value as AlertType })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/30"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 mb-1 block">Threshold</label>
                  <input
                    value={ruleForm.threshold}
                    onChange={e => setRuleForm({ ...ruleForm, threshold: e.target.value })}
                    className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/30"
                    placeholder="> 3x baseline"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Notification Channels</label>
                <div className="flex gap-2">
                  {(Object.keys(CHANNEL_CONFIG) as NotificationChannel[]).map(ch => {
                    const cfg = CHANNEL_CONFIG[ch];
                    const ChIcon = cfg.icon;
                    const selected = ruleForm.channels.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => {
                          setRuleForm({
                            ...ruleForm,
                            channels: selected
                              ? ruleForm.channels.filter(c => c !== ch)
                              : [...ruleForm.channels, ch],
                          });
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
                          selected
                            ? `${cfg.color} bg-white/[0.05] border-white/10`
                            : 'text-slate-600 border-slate-700/30'
                        }`}
                      >
                        <ChIcon className="w-3 h-3" /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700/50">
              <button onClick={() => setShowRuleForm(false)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg">Cancel</button>
              <button
                onClick={saveRule}
                disabled={!ruleForm.name}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 flex items-center gap-1"
              >
                <Save className="w-3 h-3" /> Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration note */}
      <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-3.5 h-3.5 text-red-400" />
          <h3 className="text-xs font-medium text-slate-400">Real-time Monitoring</h3>
        </div>
        <p className="text-[10px] text-slate-500">
          Currently showing sample alerts. Connect Meta Graph API webhooks and platform APIs
          for real-time spike detection. Email notifications will be sent via configured SMTP.
          Sentiment analysis uses the AI chatbot engine for instant classification.
        </p>
      </div>
    </div>
  );
}
