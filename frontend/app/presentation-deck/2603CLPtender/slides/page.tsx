'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { presentationData } from '../data';
import {
  ChevronLeft, ChevronRight, Grid3X3, Image, MessageSquare,
  BrainCircuit, History, RotateCcw, Loader2, CheckCircle2,
  Zap, Eye, EyeOff, X, Download, ExternalLink,
} from 'lucide-react';

const SLUG = '2603CLPtender';

// ─── Section metadata ────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  opening: 'Opening', understanding: 'Understanding', approach: 'Design & Production',
  logistics: 'Logistics', lettershop: 'Lettershop', hsse: 'HSSE',
  team: 'Team', closing: 'Closing',
};
const SECTION_ACCENT: Record<string, string> = {
  opening: '#E60000', understanding: '#0057A8', approach: '#F4A742',
  logistics: '#22C55E', lettershop: '#A855F7', hsse: '#F97316',
  team: '#14B8A6', closing: '#F43F5E',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlideOverride {
  slide_number: number;
  title?: string | null;
  subtitle?: string | null;
  content: Record<string, unknown>;
  notes?: string | null;
  updated_at: string;
}

interface AIReview {
  overall: string;
  issues: string[];
  suggestions: string[];
  change_summary: string;
  updated_content: Record<string, unknown>;
}

interface VersionEntry {
  id: number;
  version_number: number;
  title?: string | null;
  subtitle?: string | null;
  content: Record<string, unknown>;
  notes?: string | null;
  change_summary: string;
  changed_by: string;
  ai_comment?: string | null;
  created_at: string;
}

// ─── Slide renderers ─────────────────────────────────────────────────────────

function CoverSlide({ content }: { content: Record<string, string> }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-16">
      <div className="text-[#0057A8] text-xs font-medium tracking-widest uppercase mb-6">
        {content.company} · Tender Response
      </div>
      <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-4 max-w-3xl">{content.main_title}</h1>
      <p className="text-2xl text-slate-600 mb-8">{content.subtitle_cn}</p>
      <div className="w-16 h-px bg-[#0057A8]/40 mb-8" />
      <p className="text-slate-600 text-sm max-w-lg leading-relaxed">{content.project_name}</p>
      <p className="text-slate-400 text-sm mt-6">{content.date}</p>
    </div>
  );
}

function StatementSlide({ content }: { content: Record<string, string | string[]> }) {
  const points = Array.isArray(content.supporting_points) ? content.supporting_points : [];
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full">
      <p className="text-slate-600 text-lg mb-6 leading-relaxed">{String(content.problem)}</p>
      <h2 className="text-3xl font-bold text-slate-900 mb-8 leading-snug">{String(content.our_difference)}</h2>
      <div className="space-y-3">
        {points.map((pt, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0057A8]/10 border border-[#0057A8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0057A8]" />
            </div>
            <p className="text-slate-700 text-base leading-relaxed">{pt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentSlide({ content }: { content: { blocks?: { heading: string; body: string }[] } }) {
  const blocks = content.blocks || [];
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full">
      <div className="space-y-7">
        {blocks.map((block, i) => (
          <div key={i} className="flex gap-6">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono text-slate-500">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">{block.heading}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{block.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualHeavySlide({ content }: { content: Record<string, unknown> }) {
  const colorStrategy = content.color_strategy as Record<string, string> | undefined;
  const characterDesign = content.character_design as Record<string, string> | undefined;
  const sceneStyle = content.scene_style as string | undefined;
  const blocks = content.blocks as { heading: string; body: string }[] | undefined;

  if (blocks) return <ContentSlide content={{ blocks }} />;

  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-4xl mx-auto w-full gap-6">
      {colorStrategy && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(colorStrategy).map(([k, v]) => (
            <div key={k} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-500 mb-2 capitalize">{k.replace('_', ' ')}</div>
              <p className="text-xs text-slate-700 leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      )}
      {characterDesign && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(characterDesign).map(([k, v]) => (
            <div key={k} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-medium text-[#0057A8] mb-2 capitalize">{k.replace('_', ' ')}</div>
              <p className="text-xs text-slate-700 leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      )}
      {sceneStyle && (
        <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-300 pl-4">{sceneStyle}</p>
      )}
    </div>
  );
}

function TwoColumnSlide({ content }: { content: { left: { title: string; items: string[] }; right: { title: string; items: string[] } } }) {
  return (
    <div className="h-full flex items-center px-16 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-12 w-full">
        {[content.left, content.right].map((col, ci) => (
          <div key={ci}>
            <h3 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">{col.title}</h3>
            <div className="space-y-3">
              {col.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSlide({ content }: { content: { phases: { label: string; title: string; activities: string[]; client_role: string }[] } }) {
  return (
    <div className="h-full flex flex-col justify-center px-16 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-4 gap-4">
        {content.phases.map((phase, i) => (
          <div key={i} className="relative">
            {i < content.phases.length - 1 && (
              <div className="absolute top-4 left-full w-4 h-px bg-slate-300 z-10" />
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-mono text-[#0057A8] mb-2">{phase.label}</div>
              <h4 className="text-xs font-semibold text-slate-900 mb-3 leading-snug">{phase.title}</h4>
              <div className="space-y-1.5 mb-3">
                {phase.activities.map((act, j) => (
                  <div key={j} className="flex items-start gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">{act}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 italic">{phase.client_role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionDividerSlide({ content, section }: { content: { section_title: string; section_subtitle: string }; section: string }) {
  const accent = SECTION_ACCENT[section] || '#0057A8';
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-16">
      <div className="w-16 h-1 rounded-full mb-8" style={{ backgroundColor: accent }} />
      <h2 className="text-5xl font-bold text-slate-900 mb-4">{content.section_title}</h2>
      <p className="text-xl text-slate-600 max-w-xl">{content.section_subtitle}</p>
    </div>
  );
}

function SplitMetricsSlide({ content }: { content: { left: { title: string; items: string[] }; right: { title: string; items: string[] } } }) {
  return (
    <div className="h-full flex items-center px-16 max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-8 w-full">
        {[content.left, content.right].map((col, ci) => (
          <div key={ci} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{col.title}</h3>
            <div className="space-y-2.5">
              {col.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type AnySlide = (typeof presentationData.presentation.slides)[number];

function SlideContent({ slide }: { slide: AnySlide & { content: unknown } }) {
  const { layout_type, content } = slide;
  switch (layout_type) {
    case 'cover':         return <CoverSlide content={content as Record<string, string>} />;
    case 'statement':     return <StatementSlide content={content as Record<string, string | string[]>} />;
    case 'content':       return <ContentSlide content={content as { blocks: { heading: string; body: string }[] }} />;
    case 'two-column':    return <TwoColumnSlide content={content as { left: { title: string; items: string[] }; right: { title: string; items: string[] } }} />;
    case 'timeline':      return <TimelineSlide content={content as { phases: { label: string; title: string; activities: string[]; client_role: string }[] }} />;
    case 'section-divider': return <SectionDividerSlide content={content as { section_title: string; section_subtitle: string }} section={slide.section} />;
    case 'split-metrics': return <SplitMetricsSlide content={content as { left: { title: string; items: string[] }; right: { title: string; items: string[] } }} />;
    case 'visual-heavy':  return <VisualHeavySlide content={content as Record<string, unknown>} />;
    default:              return <ContentSlide content={content as { blocks: { heading: string; body: string }[] }} />;
  }
}

// ─── AI Panel ────────────────────────────────────────────────────────────────

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  created_at: string;
}

interface AIPanelProps {
  slide: AnySlide & { content: unknown; slide_number: number };
  totalSlides: number;
  hasOverride: boolean;
  onApplied: (content: Record<string, unknown>) => void;
  onClose: () => void;
}

function AIPanel({ slide, totalSlides, hasOverride, onApplied, onClose }: AIPanelProps) {
  const [tab, setTab] = useState<'review' | 'history'>('review');

  // Persistent chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);

  // User instruction textarea
  const [userComment, setUserComment] = useState('');

  // AI analysis state
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [aiError, setAiError] = useState('');
  const [latestReview, setLatestReview] = useState<AIReview | null>(null);
  const [latestModel, setLatestModel] = useState('');

  // Apply state
  const [applyState, setApplyState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [applyError, setApplyError] = useState('');

  // Version history
  const [history, setHistory] = useState<VersionEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load chat history when panel opens or slide changes
  useEffect(() => {
    setChatLoading(true);
    setMessages([]);
    setLatestReview(null);
    setAiState('idle');
    setAiError('');
    setApplyState('idle');
    setApplyError('');
    fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/chat`)
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => {
        const msgs: ChatMessage[] = d.messages || [];
        setMessages(msgs);
        // Restore latest AI review from last assistant message
        const lastAI = [...msgs].reverse().find(m => m.role === 'assistant');
        if (lastAI) {
          try {
            setLatestReview(JSON.parse(lastAI.content));
            setLatestModel(lastAI.model || 'deepseek-chat');
            setAiState('done');
          } catch { /* not JSON, ignore */ }
        }
      })
      .catch(() => {})
      .finally(() => setChatLoading(false));
  }, [slide.slide_number]);

  // Load version history when history tab is opened
  useEffect(() => {
    if (tab !== 'history') return;
    setHistoryLoading(true);
    fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/history`)
      .then(r => r.ok ? r.json() : { history: [] })
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [tab, slide.slide_number]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleAnalyse() {
    const instruction = userComment.trim() || 'Analyse this slide and suggest improvements.';
    setAiState('loading');
    setAiError('');
    setLatestReview(null);
    setUserComment('');

    // Optimistically add user message
    const userMsg: ChatMessage = { role: 'user', content: instruction, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide: { ...slide, total: totalSlides },
          userComment: instruction,
          // Strip updated_content from AI messages to avoid blowing up token count
          chatHistory: messages.slice(-4).map(m => {
            if (m.role !== 'assistant') return { role: m.role, content: m.content };
            try {
              const r = JSON.parse(m.content);
              return { role: 'assistant', content: `Overall: ${r.overall}\nChanges: ${r.change_summary}` };
            } catch { return { role: 'assistant', content: m.content }; }
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.usage_hint || data.error || 'Review failed');

      const review: AIReview = data.review;
      const model: string = data.model || 'deepseek-chat';
      setLatestReview(review);
      setLatestModel(model);
      setAiState('done');

      // Add AI response to local chat (include token usage for debugging)
      const usage = data.usage;
      const usageStr = usage ? ` · ${usage.prompt_tokens}↑ ${usage.completion_tokens}↓ tokens` : '';
      const aiMsg: ChatMessage = { role: 'assistant', content: JSON.stringify(review), model: model + usageStr, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);

      // Persist both messages (non-blocking)
      fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMsg, aiMsg] }),
      }).catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setAiError(msg);
      setAiState('error');
      // Remove optimistic user message
      setMessages(prev => prev.filter(m => m !== userMsg));
    }
  }

  async function handleApply() {
    if (!latestReview) return;
    setApplyState('loading');
    setApplyError('');
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: slide.title, subtitle: slide.subtitle,
          content: latestReview.updated_content,
          notes: slide.notes,
          change_summary: latestReview.change_summary,
          changed_by: 'ai',
          ai_comment: latestReview.overall,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onApplied(latestReview.updated_content);
      setApplyState('done');
      setTimeout(() => setApplyState('idle'), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setApplyError(msg);
      setApplyState('error');
    }
  }

  async function handleRestore(v: VersionEntry) {
    if (!confirm(`Restore slide to v${v.version_number}?`)) return;
    try {
      const res = await fetch(
        `/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/restore/${v.id}`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Restore failed (HTTP ${res.status})`);
      if (!data.ok) throw new Error('Restore returned unexpected response');
      // Use content from server response (authoritative) — fall back to cached v.content
      const restoredContent = data.content ?? v.content;
      if (!restoredContent || Object.keys(restoredContent).length === 0) {
        throw new Error('Restored content is empty — version may be corrupt');
      }
      onApplied(restoredContent);
      setTab('review');
      setHistory([]);
    } catch (e: unknown) {
      alert(`Restore failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  async function handleNewChat() {
    if (!confirm('Clear conversation history for this slide?')) return;
    await fetch(`/api/presentation-deck/${SLUG}/slides/${slide.slide_number}/chat`, { method: 'DELETE' }).catch(() => {});
    setMessages([]);
    setLatestReview(null);
    setAiState('idle');
    setAiError('');
    setApplyState('idle');
    setApplyError('');
  }

  const hasConversation = messages.length > 0;
  const showNewChat = messages.length >= 4;

  return (
    <div className="w-80 flex-shrink-0 border-l border-slate-800/60 bg-slate-900/70 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-slate-200">AI Assistant</span>
          {hasOverride && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">modified</span>}
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 flex-shrink-0">
        {(['review', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {t === 'review' ? 'Review' : 'Version History'}
          </button>
        ))}
      </div>

      {/* ── Review tab ─────────────────────────────────────────────────────────── */}
      {tab === 'review' && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Chat history area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-600" /></div>
            ) : !hasConversation ? (
              <p className="text-xs text-slate-600 text-center py-6 leading-relaxed">
                Type your instructions below, or just click Analyse to let AI review this slide.
              </p>
            ) : (
              messages.map((msg, i) => {
                if (msg.role === 'user') {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] bg-slate-700/60 border border-slate-600/40 rounded-lg rounded-br-sm px-3 py-2">
                        <p className="text-xs text-slate-200 leading-relaxed break-all">{msg.content}</p>
                        <p className="text-[10px] text-slate-600 mt-1 text-right">
                          {new Date(msg.created_at).toLocaleString('en-HK', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                }
                // AI message — parse and show compact review
                let review: AIReview | null = null;
                try { review = JSON.parse(msg.content); } catch {}
                const isLatest = i === messages.length - 1;
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[92%] bg-white/[0.03] border border-purple-500/15 rounded-lg rounded-bl-sm px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BrainCircuit className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-purple-400 font-medium">AI</span>
                        {msg.model && <span className="text-[9px] text-slate-600">{msg.model}</span>}
                      </div>
                      {review ? (
                        <>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{review.overall}</p>
                          {review.issues?.length > 0 && (
                            <ul className="space-y-0.5">
                              {review.issues.map((issue, j) => (
                                <li key={j} className="text-[10px] text-slate-500 flex gap-1.5">
                                  <span className="text-red-500 shrink-0">·</span>{issue}
                                </li>
                              ))}
                            </ul>
                          )}
                          {review.suggestions?.length > 0 && (
                            <ul className="space-y-0.5">
                              {review.suggestions.map((s, j) => (
                                <li key={j} className="text-[10px] text-slate-500 flex gap-1.5">
                                  <span className="text-emerald-500 shrink-0">✓</span>{s}
                                </li>
                              ))}
                            </ul>
                          )}
                          {isLatest && (
                            <div className="pt-1">
                              <button
                                onClick={handleApply}
                                disabled={applyState === 'loading'}
                                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-[11px] font-medium transition-colors ${
                                  applyState === 'done'
                                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                } disabled:opacity-50`}
                              >
                                {applyState === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                  applyState === 'done' ? <CheckCircle2 className="w-3 h-3" /> :
                                  <Zap className="w-3 h-3" />}
                                {applyState === 'done' ? 'Applied!' :
                                  applyState === 'loading' ? 'Applying…' : 'Apply to Slide'}
                              </button>
                              {applyState === 'error' && (
                                <p className="text-[10px] text-red-400 mt-1">{applyError || 'Save failed'}</p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-400">{msg.content}</p>
                      )}
                      <p className="text-[9px] text-slate-700">
                        {new Date(msg.created_at).toLocaleString('en-HK', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {/* Loading indicator for in-progress AI response */}
            {aiState === 'loading' && (
              <div className="flex justify-start">
                <div className="bg-white/[0.03] border border-purple-500/15 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                    <span className="text-[11px] text-slate-500">Analysing slide…</span>
                  </div>
                </div>
              </div>
            )}
            {aiState === 'error' && (
              <div className="flex justify-start">
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2.5 space-y-1.5 max-w-[92%]">
                  <p className="text-[11px] text-red-400 font-medium">Analysis failed</p>
                  {aiError && <p className="text-[10px] text-red-400/70 break-all">{aiError}</p>}
                  <button onClick={handleAnalyse} className="text-[10px] text-red-400 hover:text-red-300 underline">
                    Retry
                  </button>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-slate-800/60 p-3 space-y-2">
            <textarea
              value={userComment}
              onChange={e => setUserComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyse(); }}
              placeholder="Your instructions, e.g. 'Make it more concise' or 'Focus on ROI'…"
              rows={2}
              className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyse}
                disabled={aiState === 'loading'}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium disabled:opacity-50 transition-colors"
              >
                {aiState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                {aiState === 'loading' ? 'Analysing…' : 'Analyse'}
              </button>
              {showNewChat && (
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-1 py-2 px-2.5 rounded-lg border border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs transition-colors"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-3 h-3" />New chat
                </button>
              )}
            </div>
            {latestModel && aiState !== 'idle' && (
              <p className="text-[10px] text-slate-700 text-center">Model: {latestModel}</p>
            )}
          </div>
        </div>
      )}

      {/* ── History tab ─────────────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto p-3">
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8 leading-relaxed">No version history yet.<br />Apply an AI review to create the first version.</p>
          ) : (
            <div className="space-y-2">
              {history.map(v => (
                <div key={v.id} className="bg-white/[0.02] border border-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300">v{v.version_number}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      v.changed_by === 'ai' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      v.changed_by === 'restore' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-700/60 text-slate-400 border-slate-600/50'}`}>
                      {v.changed_by}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1">{v.change_summary}</p>
                  {v.ai_comment && <p className="text-[10px] text-slate-600 italic mb-2 line-clamp-2">{v.ai_comment}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-700">
                      {new Date(v.created_at).toLocaleString('en-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleRestore(v)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Presenter ───────────────────────────────────────────────────────────

function SlidesPresenter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slides = presentationData.presentation.slides;

  const initialSlide = Math.max(1, Math.min(parseInt(searchParams.get('slide') || '1', 10), slides.length));
  const [currentIndex, setCurrentIndex] = useState(initialSlide - 1);
  const [showNotes, setShowNotes] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showBgImage, setShowBgImage] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [slideFlash, setSlideFlash] = useState(false);
  const [canvaConnected, setCanvaConnected] = useState<boolean | null>(null);
  const [pushingToCanva, setPushingToCanva] = useState(false);

  // Content overrides from DB (AI/user edits)
  const [overrides, setOverrides] = useState<Record<number, SlideOverride>>({});
  // Generated images indexed by slide_number
  const [genImages, setGenImages] = useState<Record<number, string[]>>({});

  // Check Canva connection on mount (and after ?canva=connected redirect)
  useEffect(() => {
    fetch(`/api/presentation-deck/canva/status`)
      .then(r => r.ok ? r.json() : { connected: false })
      .then(d => setCanvaConnected(d.connected))
      .catch(() => setCanvaConnected(false));
  }, [searchParams]);

  // Load overrides once on mount
  useEffect(() => {
    fetch(`/api/presentation-deck/${SLUG}/slide-overrides`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setOverrides(d.overrides || {}))
      .catch(() => {});
  }, []);

  // Load generated images once on mount
  useEffect(() => {
    fetch(`/api/presentation-deck/${SLUG}/images?status=generated&limit=500`)
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        const bySlide: Record<number, string[]> = {};
        for (const img of (d.images || [])) {
          if (!img.image_url) continue;
          if (!bySlide[img.slide_number]) bySlide[img.slide_number] = [];
          bySlide[img.slide_number].push(img.image_url);
        }
        setGenImages(bySlide);
      })
      .catch(() => {});
  }, []);

  const rawSlide = slides[currentIndex];
  const override = overrides[rawSlide.slide_number];
  // Merge static data with any DB override (override wins for title/subtitle/content/notes)
  const slide = override
    ? { ...rawSlide, ...override, content: override.content as typeof rawSlide.content }
    : rawSlide;

  const accent = SECTION_ACCENT[slide.section] || '#E60000';

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setCurrentIndex(clamped);
    router.replace(`?slide=${clamped + 1}`, { scroll: false });
  }, [slides.length, router]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') goTo(currentIndex + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(currentIndex - 1);
      if (e.key === 'Escape') { setShowThumbnails(false); setShowAI(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, goTo]);

  async function handleDownloadPptx() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/export/pptx`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Export failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `5ML-CLP-Tender-${SLUG}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(`PPTX export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  }

  async function handlePushToCanva() {
    if (!canvaConnected) {
      const returnTo = encodeURIComponent(`/presentation-deck/${SLUG}/slides`);
      window.location.href = `/api/presentation-deck/canva/auth?returnTo=/presentation-deck/${SLUG}/slides`;
      return;
    }
    setPushingToCanva(true);
    try {
      const res = await fetch(`/api/presentation-deck/${SLUG}/export/canva`, { method: 'POST' });
      if (res.status === 401) {
        window.location.href = `/api/presentation-deck/canva/auth?returnTo=/presentation-deck/${SLUG}/slides`;
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Push to Canva failed');
      window.open(data.edit_url, '_blank');
    } catch (e: unknown) {
      alert(`Canva push failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setPushingToCanva(false);
    }
  }

  function handleAIApplied(updatedContent: Record<string, unknown>) {
    setOverrides(prev => ({
      ...prev,
      [rawSlide.slide_number]: {
        ...(prev[rawSlide.slide_number] || { slide_number: rawSlide.slide_number }),
        content: updatedContent,
        updated_at: new Date().toISOString(),
      },
    }));
    // Flash the slide to confirm the change
    setSlideFlash(true);
    setTimeout(() => setSlideFlash(false), 1200);
  }

  const bgImageUrl = genImages[rawSlide.slide_number]?.[0];
  const bgOpacity = ['cover', 'section-divider'].includes(slide.layout_type) ? 0.28 : 0.14;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/presentation-deck/2603CLPtender" className="text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-slate-500 font-medium">CLP Power Hong Kong</div>
            <div className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
              {slide.title}
              {override && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-normal">edited</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Background image toggle (only when slide has generated image) */}
          {bgImageUrl && (
            <button
              onClick={() => setShowBgImage(!showBgImage)}
              className={`p-1.5 rounded transition-colors ${showBgImage ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
              title={showBgImage ? 'Hide generated background image' : 'Show generated background image'}
            >
              {showBgImage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 rounded transition-colors ${showNotes ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
            title="Speaker notes"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowVisuals(!showVisuals)}
            className={`p-1.5 rounded transition-colors ${showVisuals ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
            title="Generated images & visual prompts"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded transition-colors ${showThumbnails ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            title="Slide grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          {/* AI assistant toggle */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={`p-1.5 rounded transition-colors ${showAI ? 'text-purple-600 bg-purple-100' : 'text-slate-500 hover:text-slate-700'}`}
            title="AI Assistant"
          >
            <BrainCircuit className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          {/* Download PPTX */}
          <button
            onClick={handleDownloadPptx}
            disabled={downloading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 disabled:opacity-50 transition-colors border border-slate-200"
            title="Download as PPTX"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? 'Exporting…' : 'PPTX'}
          </button>
          {/* Push to Canva */}
          <button
            onClick={handlePushToCanva}
            disabled={pushingToCanva}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium disabled:opacity-50 transition-colors border ${
              canvaConnected
                ? 'bg-[#7D2AE7]/10 hover:bg-[#7D2AE7]/20 text-[#7D2AE7] border-[#7D2AE7]/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
            title={canvaConnected ? 'Push to Canva' : 'Connect Canva account'}
          >
            {pushingToCanva ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {pushingToCanva ? 'Pushing…' : canvaConnected ? 'Canva' : 'Connect Canva'}
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          <span className="text-xs text-slate-500 tabular-nums">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section label */}
          <div className="px-6 pt-3 pb-1 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
                {SECTION_LABELS[slide.section]}
              </span>
            </div>
          </div>

          {/* Slide title */}
          {slide.layout_type !== 'cover' && slide.layout_type !== 'section-divider' && (
            <div className="px-16 pt-4 pb-2 flex-shrink-0">
              <h1 className="text-2xl font-bold text-slate-900 leading-snug">{slide.title}</h1>
              {slide.subtitle && <p className="text-slate-600 text-sm mt-1">{slide.subtitle}</p>}
            </div>
          )}

          {/* Slide content (with generated image as background) */}
          <div className={`flex-1 overflow-y-auto relative bg-white transition-all duration-300 ${slideFlash ? 'ring-2 ring-inset ring-purple-500/50' : ''}`}>
            {showBgImage && bgImageUrl && (
              <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImageUrl})`, opacity: bgOpacity }}
              />
            )}
            <div className="relative z-10">
              <SlideContent slide={slide as AnySlide & { content: unknown }} />
            </div>
          </div>

          {/* Notes / Visuals panel */}
          {(showNotes || showVisuals) && (
            <div className="border-t border-slate-200 bg-slate-50 flex-shrink-0 max-h-56 overflow-y-auto">
              {showNotes && slide.notes && (
                <div className="px-6 py-3">
                  <div className="text-xs font-medium text-amber-600 mb-1">Speaker notes</div>
                  <p className="text-sm text-slate-600 leading-relaxed">{slide.notes}</p>
                </div>
              )}
              {showVisuals && (
                <div className="px-6 py-3 space-y-4">
                  {(genImages[rawSlide.slide_number] || []).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-emerald-400 mb-2">Generated images</div>
                      <div className="flex gap-3 flex-wrap">
                        {(genImages[rawSlide.slide_number] || []).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Generated image ${i + 1}`}
                              className="h-28 w-auto rounded-lg border border-emerald-500/20 object-cover hover:border-emerald-400/50 transition-colors"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {(slide.visual_prompts?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-xs font-medium text-blue-600 mb-2">Visual prompts</div>
                      <div className="space-y-1.5">
                        {(slide.visual_prompts || []).map((vp, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs font-mono text-slate-500 flex-shrink-0">{i + 1}.</span>
                            <p className="text-xs text-slate-600 leading-relaxed">{vp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(genImages[rawSlide.slide_number] || []).length === 0 && (slide.visual_prompts?.length ?? 0) === 0 && (
                    <p className="text-xs text-slate-500">No visuals for this slide.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav controls */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white flex-shrink-0">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />Previous
            </button>
            <div className="flex-1 mx-8 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / slides.length) * 100}%`, backgroundColor: accent }}
              />
            </div>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thumbnail panel */}
        {showThumbnails && (
          <div className="w-56 border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <div className="p-3 space-y-2">
              {slides.map((s, i) => (
                <button
                  key={s.slide_number}
                  onClick={() => { goTo(i); setShowThumbnails(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    i === currentIndex ? 'bg-slate-100 border border-slate-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-400">{String(s.slide_number).padStart(2, '0')}</span>
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: SECTION_ACCENT[s.section] }} />
                    {overrides[s.slide_number] && <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" title="Edited" />}
                    {genImages[s.slide_number]?.length > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" title="Has generated image" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-snug line-clamp-2">{s.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI assistant panel */}
        {showAI && (
          <AIPanel
            key={rawSlide.slide_number}    // remount panel on slide change to reset state
            slide={slide as AnySlide & { content: unknown; slide_number: number }}
            totalSlides={slides.length}
            hasOverride={!!override}
            onApplied={handleAIApplied}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function SlidesPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center text-slate-500 text-sm">Loading…</div>}>
      <SlidesPresenter />
    </Suspense>
  );
}
