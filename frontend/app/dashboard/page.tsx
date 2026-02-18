'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import ArchitectureViz from '@/components/ArchitectureViz';
import MessageActions from '@/components/MessageActions';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import PlatformOverview from '@/components/PlatformOverview';
import ApiHealthCheck from '@/components/ApiHealthCheck';
import ScheduledJobs from '@/components/ScheduledJobs';
import AgenticWorkflows from '@/components/AgenticWorkflows';
import KnowledgeBase from '@/components/KnowledgeBase';
import CostAnalysis from '@/components/CostAnalysis';
import ZiweiChat from '@/components/ZiweiChat';
import ZiweiCompatibility from '@/components/ZiweiCompatibility';
import ZiweiInsights from '@/components/ZiweiInsights';
import ZiweiRuleManagement from '@/components/ZiweiRuleManagement';
import {
  LayoutDashboard, Layers, Activity, Home, Wifi, Calendar, GitBranch,
  BookOpen, DollarSign, ArrowRight, Users, Brain, MessageSquare,
  ChevronRight, Map, Zap, Send, Loader2, Sparkles, History,
  Plus, Trash2, Clock, Monitor, TrendingUp, Wand2,
} from 'lucide-react';
import Link from 'next/link';
import {
  USE_CASES, SOLUTION_LINES, ROADMAP_ITEMS, STATUS_CONFIG,
  CSUITE_ROLES, SEVEN_LAYERS, type UseCaseConfig, type Status,
} from '@/lib/platform-config';
import {
  createSession, getLatestSession, addMessage, listSessions,
  deleteSession, getSession, pruneExpiredSessions,
  type ChatSession, type ChatType, type ChatMessage as StoredMessage,
} from '@/lib/chat-history';

type Tab = 'control' | 'overview' | 'architecture' | 'analytics' | 'scheduling' | 'knowledge' | 'costs' | 'workflows' | 'chat' | 'ziwei-rules';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LINE_BORDER: Record<string, string> = {
  GrowthOS: 'border-l-purple-500',
  IntelStudio: 'border-l-teal-500',
  TechNexus: 'border-l-blue-500',
  ExpLab: 'border-l-indigo-500',
  MediaChannel: 'border-l-rose-500',
  FrontierVentures: 'border-l-amber-500',
  CSuite: 'border-l-emerald-500',
  Platform: 'border-l-slate-500',
};

const ROLE_COLORS = ['from-purple-600/60 to-purple-500/20', 'from-teal-600/60 to-teal-500/20', 'from-rose-600/60 to-rose-500/20', 'from-blue-600/60 to-blue-500/20', 'from-amber-600/60 to-amber-500/20', 'from-slate-600/60 to-slate-500/20'];

// ---------------------------------------------------------------------------
// Agent Chat Panel
// ---------------------------------------------------------------------------

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'What agents do we have?',
  'Show GrowthOS status',
  'Suggest a new agent',
  'How does orchestration work?',
  'C-Suite agent roadmap',
  'What improvements should we make?',
];

function buildPlatformContext(): string {
  const lines = Object.values(SOLUTION_LINES).map(l => `- ${l.name}: ${l.tagline}`).join('\n');
  const cases = USE_CASES.map(u => `- ${u.name} [${STATUS_CONFIG[u.status].label}] — ${u.description} (${u.agentCount || 0} agents, ${Math.round(u.progress * 100)}% done)`).join('\n');
  const roles = CSUITE_ROLES.map(r => `- ${r.shortTitle} / ${r.agentFamily}: ${r.description} [${STATUS_CONFIG[r.status].label}, ${Math.round(r.progress * 100)}%]`).join('\n');
  const layers = SEVEN_LAYERS.map(l => `L${l.number} ${l.name}: ${l.components.join(', ')}`).join('\n');

  return `## Solution Lines\n${lines}\n\n## Use Cases (${USE_CASES.length} total)\n${cases}\n\n## C-Suite Agent Families\n${roles}\n\n## 7-Layer Architecture\n${layers}`;
}

function AgentChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState<ChatSession[]>([]);
  const [historyFilter, setHistoryFilter] = useState<ChatType | 'all'>('all');
  const [viewingSession, setViewingSession] = useState<ChatSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prune stale empty sessions, then load previous session on mount
  useEffect(() => {
    pruneExpiredSessions();
    const prev = getLatestSession('agent');
    if (prev && prev.messages.length > 0) {
      setMessages(prev.messages.map(m => ({ role: m.role, content: m.content })));
      setSessionId(prev.id);
    } else {
      const fresh = createSession('agent');
      setSessionId(fresh.id);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Refresh history list when toggled open
  useEffect(() => {
    if (showHistory) {
      setHistorySessions(listSessions(historyFilter === 'all' ? undefined : historyFilter));
    }
  }, [showHistory, historyFilter]);

  const startNewSession = useCallback(() => {
    const fresh = createSession('agent');
    setSessionId(fresh.id);
    setMessages([]);
    setViewingSession(null);
  }, []);

  const loadSession = useCallback((session: ChatSession) => {
    setMessages(session.messages.map(m => ({ role: m.role, content: m.content })));
    setSessionId(session.id);
    setViewingSession(null);
    setShowHistory(false);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    setHistorySessions(prev => prev.filter(s => s.id !== id));
    if (viewingSession?.id === id) setViewingSession(null);
  }, [viewingSession]);

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setLoading(true);

    if (sessionId) addMessage(sessionId, { role: 'user', content, timestamp: new Date().toISOString() });

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, context: buildPlatformContext() }),
      });
      const data = await res.json();
      const reply = data.message || data.error || 'No response';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (sessionId) addMessage(sessionId, { role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    } catch {
      const err = 'Failed to reach the API. Is the backend running?';
      setMessages(prev => [...prev, { role: 'assistant', content: err }]);
      if (sessionId) addMessage(sessionId, { role: 'assistant', content: err, timestamp: new Date().toISOString() });
    }
    setLoading(false);
  }, [input, messages, loading, sessionId]);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(); };

  return (
    <div className="flex h-[calc(100vh-180px)]">
      {/* History sidebar (slides in) */}
      {showHistory && (
        <div className="w-80 border-r border-slate-700/50 bg-slate-900/80 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-400" />
              Chat History
            </h3>
            <button onClick={() => { setShowHistory(false); setViewingSession(null); }} className="text-xs text-slate-500 hover:text-white transition-colors">Close</button>
          </div>

          {/* Type filter */}
          <div className="flex gap-1 px-3 py-2 border-b border-slate-700/30">
            {(['all', 'agent', 'workflow', 'crm'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setHistoryFilter(t); setViewingSession(null); }}
                className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${
                  historyFilter === t
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-500 hover:text-slate-300 bg-slate-800/60 border border-slate-700/50'
                }`}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t].label}
              </button>
            ))}
          </div>

          {/* Session list or session detail */}
          <div className="flex-1 overflow-y-auto">
            {viewingSession ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/30">
                  <button onClick={() => setViewingSession(null)} className="text-[10px] text-slate-400 hover:text-white">&larr; Back</button>
                  <span className="text-xs text-white font-medium truncate flex-1">{viewingSession.title}</span>
                  <button
                    onClick={() => loadSession(viewingSession)}
                    className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30"
                  >
                    Load
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                  {viewingSession.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600/20 text-blue-100 border border-blue-500/20'
                          : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.timestamp && <div className="text-[9px] text-slate-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : historySessions.length === 0 ? (
              <div className="text-center py-10">
                <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No chat history yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {historySessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => setViewingSession(session)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{session.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${TYPE_LABELS[session.type].color}`}>
                          {TYPE_LABELS[session.type].label}
                        </span>
                        <span className="text-[9px] text-slate-600">{new Date(session.updatedAt).toLocaleDateString()}</span>
                        <span className="text-[9px] text-slate-600">{session.messages.length} msgs</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-900/40">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            RAG-enhanced · history saved
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border transition-colors ${
                showHistory
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700 border-slate-700/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={startNewSession}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-slate-700/50"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 mb-4">
                <Brain className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Agent Team Assistant</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Ask anything about your agents, use cases, architecture, or get suggestions for improvements. Conversations are saved automatically.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/60 text-slate-400 hover:text-white hover:border-purple-500/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 text-blue-100 border border-blue-500/20'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <MessageActions content={msg.content} variant={msg.role === 'user' ? 'user' : 'assistant'} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-700/50 bg-slate-900/60 p-4">
          <form onSubmit={onSubmit} className="flex gap-3 max-w-3xl mx-auto">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about agents, use cases, suggest changes..."
              className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Chat history type labels (used inside AgentChatPanel history sidebar)
const TYPE_LABELS: Record<ChatType, { label: string; color: string }> = {
  agent: { label: 'Agent', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  workflow: { label: 'Workflow', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  crm: { label: 'CRM', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const getInitialTab = (): Tab => {
    if (typeof window === 'undefined') return 'control';
    const p = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    const valid: Tab[] = ['control','overview','architecture','analytics','scheduling','knowledge','costs','workflows','chat','ziwei-rules'];
    return p && valid.includes(p) ? p : 'control';
  };
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'control', label: 'Control Tower', icon: LayoutDashboard },
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'workflows', label: 'Agentic Workflows', icon: GitBranch },
    { id: 'scheduling', label: 'Scheduling & Jobs', icon: Calendar },
    { id: 'costs', label: 'Cost Analysis', icon: DollarSign },
    { id: 'chat', label: 'Agent Chat', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'analytics', label: 'Analytics & API', icon: Wifi },
    { id: 'ziwei-rules', label: '🧿 Ziwei Rules', icon: Wand2 },
    { id: 'architecture', label: 'Architecture', icon: Layers },
  ];

  // Derived stats
  const liveCount = USE_CASES.filter(u => u.status === 'live').length;
  const buildCount = USE_CASES.filter(u => u.status === 'in_progress').length;
  const plannedCount = USE_CASES.filter(u => u.status === 'planned' || u.status === 'prototype').length;
  const totalAgents = USE_CASES.reduce((s, u) => s + (u.agentCount || 0), 0);

  // Group by solution line
  const lineGroups = Object.entries(SOLUTION_LINES).map(([key, line]) => ({
    key,
    ...line,
    cases: USE_CASES.filter(u => u.solutionLine === key),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header + Tab Navigation — solid bar, consistent across all tabs */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
                <p className="text-sm text-slate-400 mt-1">
                  {totalAgents}+ agents · {USE_CASES.length} use cases · 7 solution lines
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-xs font-medium">
              ● System Online
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation — flat single row */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={activeTab === 'workflows' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        {/* ================================================================ */}
        {/* CONTROL TOWER TAB                                               */}
        {/* ================================================================ */}
        {activeTab === 'control' && (
          <div className="space-y-6">
            {/* Quick Actions — Social Content System */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/brand-setup"
                className="group bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:border-purple-500/60 rounded-xl p-5 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white mb-1">Create Brand Strategy</h3>
                    <p className="text-xs text-slate-400">
                      Set up a new social media brand with AI-generated strategy
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/brands"
                className="group bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl p-5 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white mb-1">Manage Brands</h3>
                    <p className="text-xs text-slate-400">
                      View, edit, and manage all your brand strategies
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            {/* KPI Metrics Strip — colored top accents */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { value: USE_CASES.length, label: 'Total Use Cases', color: 'text-white', accent: 'border-t-slate-400' },
                { value: liveCount, label: 'Live', color: 'text-green-400', accent: 'border-t-green-500' },
                { value: buildCount, label: 'In Build', color: 'text-amber-400', accent: 'border-t-amber-500' },
                { value: plannedCount, label: 'Planned', color: 'text-blue-400', accent: 'border-t-blue-500' },
                { value: `${totalAgents}+`, label: 'Active Agents', color: 'text-purple-400', accent: 'border-t-purple-500' },
              ].map((kpi) => (
                <div key={kpi.label} className={`bg-slate-800/60 rounded-xl border border-slate-700/50 border-t-2 ${kpi.accent} p-4 text-center`}>
                  <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Product / Use Case Matrix — colored group headers */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <h2 className="text-base font-bold text-white">Product / Use Case Matrix</h2>
              </div>

              {lineGroups.map((group) => {
                if (group.cases.length === 0) return null;
                const live = group.cases.filter(c => c.status === 'live').length;
                return (
                  <div key={group.id}>
                    {/* Group header with colored left bar */}
                    <div className={`flex items-center gap-3 px-5 py-2.5 bg-white/[0.02] border-b border-slate-700/30 border-l-4 ${LINE_BORDER[group.key]}`}>
                      <span className={`text-xs font-bold ${group.textColor}`}>{group.name}</span>
                      <div className="flex items-center gap-2 ml-auto">
                        {live > 0 && <span className="flex items-center gap-1 text-[10px] text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{live} live</span>}
                        <span className="text-[10px] text-slate-600">{group.cases.length} total</span>
                      </div>
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-slate-700/30">
                      {group.cases.map((uc) => {
                        const sc = STATUS_CONFIG[uc.status];
                        return (
                          <div key={uc.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0`} style={{ backgroundColor: sc.color.includes('green') ? '#4ade80' : sc.color.includes('amber') ? '#fbbf24' : sc.color.includes('blue') ? '#60a5fa' : '#a78bfa' }} />
                            <span className="text-sm text-white font-medium flex-1 min-w-0 truncate">{uc.name}</span>
                            <div className="w-20 h-1.5 rounded-full bg-white/[0.04] overflow-hidden hidden sm:block shrink-0">
                              <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${uc.progress * 100}%` }} />
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${sc.bg} ${sc.color} shrink-0`}>{sc.label}</span>
                            {uc.path !== '#' ? (
                              <Link href={uc.path} className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0">Open</Link>
                            ) : (
                              <span className="text-[10px] text-slate-700 shrink-0 w-6">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* C-Suite Assist Panel — gradient accent cards */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">C-Suite Assist Panel</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {CSUITE_ROLES.map((role, i) => {
                  const sc = STATUS_CONFIG[role.status];
                  return (
                    <div key={role.id} className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
                      {/* Gradient accent header */}
                      <div className={`h-1.5 bg-gradient-to-r ${ROLE_COLORS[i]}`} />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-white">{role.shortTitle}</span>
                          <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: sc.color.includes('green') ? '#4ade80' : sc.color.includes('amber') ? '#fbbf24' : '#60a5fa' }} />
                        </div>
                        <div className="text-[10px] text-purple-400 font-semibold mb-2">{role.agentFamily}</div>
                        {/* Progress ring visual */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative w-8 h-8">
                            <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-700/50" />
                              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-purple-400"
                                strokeDasharray={`${role.progress * 94.2} 94.2`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">{Math.round(role.progress * 100)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {role.focus.slice(0, 2).map((f, j) => (
                              <span key={j} className="text-[9px] px-1 py-0.5 bg-white/[0.04] rounded text-slate-500">{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roadmap Preview — compact */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Roadmap Preview</h2>
                </div>
                <Link href="/dashboard/roadmap" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Full Roadmap <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { items: ROADMAP_ITEMS.filter(r => r.timeframe === 'now').slice(0, 4), label: 'Now', color: 'border-l-green-500', dot: 'bg-green-400', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
                  { items: ROADMAP_ITEMS.filter(r => r.timeframe === 'next').slice(0, 4), label: 'Next', color: 'border-l-amber-500', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                  { items: ROADMAP_ITEMS.filter(r => r.timeframe === 'later').slice(0, 4), label: 'Later', color: 'border-l-blue-500', dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                ].map((bucket) => (
                  <div key={bucket.label} className={`border-l-4 ${bucket.color} pl-4`}>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${bucket.badge}`}>{bucket.label}</span>
                    <div className="space-y-2 mt-3">
                      {bucket.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${bucket.dot} shrink-0`} />
                          <span className="text-xs text-white font-medium">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* AGENT CHAT TAB                                                  */}
        {/* ================================================================ */}
        {activeTab === 'chat' && <AgentChatPanel />}

        {/* Existing tabs */}
        {activeTab === 'overview' && <PlatformOverview />}
        {activeTab === 'architecture' && <ArchitectureViz />}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <ApiHealthCheck />
            <div className="border-t border-slate-700/50 pt-8">
              <AnalyticsDashboard />
            </div>
          </div>
        )}
        {activeTab === 'scheduling' && <ScheduledJobs />}
        {activeTab === 'knowledge' && <KnowledgeBase />}
        {activeTab === 'costs' && <CostAnalysis />}
        {activeTab === 'workflows' && (
          <div className="bg-[#1a1b2e]">
            <AgenticWorkflows />
          </div>
        )}

        {/* ================================================================ */}
        {/* ZIWEI RULES MANAGEMENT TAB                                       */}
        {/* ================================================================ */}
        {activeTab === 'ziwei-rules' && <ZiweiRuleManagement />}

      </main>
    </div>
  );
}
