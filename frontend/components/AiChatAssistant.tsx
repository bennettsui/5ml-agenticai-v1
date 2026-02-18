'use client';

import {
  useState, useEffect, useRef, useCallback, type FormEvent,
} from 'react';
import {
  Bot, Send, X, ChevronRight, Loader2, BarChart3,
} from 'lucide-react';
import MessageActions from './MessageActions';
import {
  createSession, getLatestSession, addMessage as persistMsg,
  pruneExpiredSessions, type ChatType, type ChatMessage,
} from '@/lib/chat-history';

/* ── Types ────────────────────────────────────── */

export interface AiChatConfig {
  /** API endpoint for chat messages */
  endpoint: string;
  /** Use case identifier sent to backend */
  useCaseId: string;
  /** Chat session type for persistence */
  chatType: ChatType;
  /** Display title */
  title?: string;
  /** Accent color class (e.g. 'purple', 'emerald', 'blue') */
  accent?: string;
  /** Extra context to send with every request */
  extraContext?: Record<string, unknown>;
  /** Enable business analyst critic mode toggle */
  criticMode?: boolean;
  /** Parse custom response format. Default expects { message, model } */
  parseResponse?: (data: unknown) => { message: string; model?: string };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
}

/* ── Default response parser ──────────────────── */

function defaultParse(data: unknown): { message: string; model?: string } {
  const d = data as Record<string, unknown>;
  return {
    message: (d.message as string) || '',
    model: (d.model as string) || undefined,
  };
}

/* ── Render helpers ───────────────────────────── */

function renderContent(text: string) {
  const parts: React.ReactNode[] = [];
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={key++}>{renderInline(text.slice(lastIdx, match.index))}</span>);
    }
    parts.push(
      <pre key={key++} className="my-2 p-3 bg-white/[0.03] border border-slate-700/50 rounded-lg overflow-x-auto text-xs">
        <code>{match[2]}</code>
      </pre>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(<span key={key++}>{renderInline(text.slice(lastIdx))}</span>);
  }
  return parts;
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <strong key={i} className="font-semibold text-white">{seg.slice(2, -2)}</strong>
      : seg
  );
}

/* ── Component ────────────────────────────────── */

export default function AiChatAssistant({ config }: { config: AiChatConfig }) {
  const {
    endpoint, useCaseId, chatType, title = 'AI Assistant',
    accent = 'purple', criticMode = false, extraContext,
    parseResponse = defaultParse,
  } = config;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCritic, setIsCritic] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Accent classes
  const accentBg = `bg-${accent}-600`;
  const accentHover = `hover:bg-${accent}-700`;
  const accentBorder = `border-${accent}-500/50`;
  const accentText = `text-${accent}-400`;

  // Init: restore or create session
  useEffect(() => {
    pruneExpiredSessions();
    const existing = getLatestSession(chatType);
    if (existing && existing.messages.length > 0) {
      setSessionId(existing.id);
      setMessages(existing.messages.map((m, i) => ({
        id: `${i}`, role: m.role, content: m.content,
        timestamp: new Date(m.timestamp),
      })));
    } else {
      const s = createSession(chatType, `New ${chatType} chat`);
      setSessionId(s.id);
    }
  }, [chatType]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user', content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    if (sessionId) {
      const cm: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
      persistMsg(sessionId, cm);
    }

    setLoading(true);
    try {
      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const body: Record<string, unknown> = {
        messages: apiMessages,
        use_case_id: useCaseId,
        ...extraContext,
      };
      if (criticMode && isCritic) body.mode = 'business_analyst';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const parsed = parseResponse(data);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', content: parsed.message,
        model: parsed.model, timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (sessionId) {
        const cm: ChatMessage = {
          role: 'assistant', content: parsed.message,
          timestamp: new Date().toISOString(),
          metadata: parsed.model ? { model: parsed.model } : undefined,
        };
        persistMsg(sessionId, cm);
      }
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId, endpoint, useCaseId, extraContext, criticMode, isCritic, parseResponse]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 w-12 h-12 ${accentBg} ${accentHover} rounded-full flex items-center justify-center shadow-lg shadow-${accent}-900/30 transition-all hover:scale-105 z-50`}
      >
        <Bot className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div className="w-[380px] flex-shrink-0 border-l border-slate-700/50 bg-slate-900 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className={`w-4 h-4 ${accentText}`} />
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">history saved</span>
        </div>
        <div className="flex items-center gap-1">
          {criticMode && (
            <button
              onClick={() => setIsCritic(!isCritic)}
              className={`p-1.5 rounded transition-colors ${isCritic ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              title={isCritic ? 'Business Analyst mode ON' : 'Switch to Business Analyst critic'}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setOpen(false)} className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className={`w-8 h-8 ${accentText} mx-auto mb-2 opacity-40`} />
            <p className="text-xs text-slate-500">Ask me anything about this use case.</p>
            {isCritic && (
              <p className="text-xs text-amber-400/60 mt-1">Business Analyst mode — I&apos;ll critique and challenge.</p>
            )}
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`group ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-slate-700/60 text-white'
                : 'bg-white/[0.03] text-slate-300 border border-slate-700/30'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{renderContent(msg.content)}</div>
              {msg.model && (
                <span className="block mt-1 text-[10px] text-slate-500">{msg.model}</span>
              )}
            </div>
            <MessageActions content={msg.content} variant={msg.role === 'user' ? 'user' : 'assistant'} />
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            {isCritic ? 'Analyzing critically...' : 'Thinking...'}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={isCritic ? 'Ask for critical analysis...' : 'Ask about this use case...'}
            rows={1}
            className={`flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:${accentBorder} resize-none`}
            style={{ maxHeight: '100px' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 100) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-2.5 ${accentBg} ${accentHover} rounded-xl text-white disabled:opacity-40 transition-colors`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
