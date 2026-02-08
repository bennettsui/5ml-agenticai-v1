'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wrench,
  MinusCircle,
} from 'lucide-react';
import { useCrmAi } from '../context';
import { crmApi, type ChatResponse } from '@/lib/crm-kb-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  result_preview: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[] | null;
  isThinking?: boolean;
}

interface Suggestion {
  id: string;
  description: string;
  acceptLabel: string;
  onAccept: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let msgIdCounter = 0;
function nextId() {
  return `msg-${Date.now()}-${++msgIdCounter}`;
}

function getWelcomeMessage(pageType: string): string {
  switch (pageType) {
    case 'clients-new':
      return "I'm here to help you set up a new client. Start typing the client name and I can research their details.";
    case 'projects-new':
      return "I'll help you create a new project. I can suggest briefs and check existing work.";
    case 'clients-list':
      return 'Ask me anything about your clients, or search for specific information.';
    case 'projects-list':
      return 'Need help finding a project or analyzing project status? Just ask.';
    case 'feedback':
      return 'I can help analyze feedback trends or find specific entries.';
    case 'integrations':
      return 'I can help with Gmail sync or orchestration settings.';
    default:
      return 'How can I help you today?';
  }
}

/**
 * Try to extract a JSON object from a markdown-style ```json ... ``` block
 * inside a string. Falls back to finding the first { ... } pair.
 */
function extractJson(text: string): Record<string, unknown> | null {
  // Try fenced code block first
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      // fall through
    }
  }

  // Try bare JSON object
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(text.slice(braceStart, braceEnd + 1));
    } catch {
      // fall through
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToolCallBadge({ tc }: { tc: ToolCall }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded bg-slate-700/60 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <Wrench size={11} />
        {tc.tool}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <pre className="mt-1 max-h-32 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-400 font-mono leading-tight">
          {tc.result_preview}
        </pre>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.isThinking) {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-shrink-0 mt-0.5 rounded-full bg-emerald-600/20 p-1">
          <Loader2 size={14} className="text-emerald-400 animate-spin" />
        </div>
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">
          Thinking...
        </div>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] rounded-lg bg-emerald-600/80 px-3 py-2 text-sm text-white">
          {msg.content}
        </div>
      </div>
    );
  }

  // assistant or system
  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="flex-shrink-0 mt-0.5 rounded-full bg-emerald-600/20 p-1">
        <Bot size={14} className="text-emerald-400" />
      </div>
      <div className="max-w-[85%]">
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 whitespace-pre-wrap break-words">
          {renderContent(msg.content)}
        </div>
        {msg.toolCalls?.map((tc, i) => (
          <ToolCallBadge key={i} tc={tc} />
        ))}
      </div>
    </div>
  );
}

/** Render content with basic bold markdown and code block formatting */
function renderContent(text: string) {
  // Split on ```...``` code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const inner = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return (
        <pre
          key={i}
          className="my-1 max-h-40 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-400 font-mono leading-tight"
        >
          {inner}
        </pre>
      );
    }

    // Handle **bold** within normal text
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={i}>
        {boldParts.map((bp, j) => {
          if (bp.startsWith('**') && bp.endsWith('**')) {
            return (
              <strong key={j} className="text-slate-100 font-semibold">
                {bp.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{bp}</span>;
        })}
      </span>
    );
  });
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="mb-3 animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-300 leading-snug">
            {renderContent(suggestion.description)}
          </p>
        </div>
        <div className="flex gap-2 ml-6">
          <button
            type="button"
            onClick={suggestion.onAccept}
            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            <Check size={12} />
            {suggestion.acceptLabel}
          </button>
          <button
            type="button"
            onClick={suggestion.onDismiss}
            className="inline-flex items-center gap-1 rounded bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600 transition-colors"
          >
            <X size={12} />
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AiAssistant() {
  const { pageState, formUpdateRef } = useCrmAi();

  // Panel state
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Chat history for API (no system messages)
  const chatHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Track which form values have already triggered a suggestion
  const shownClientNamesRef = useRef<Set<string>>(new Set());
  const shownProjectKeysRef = useRef<Set<string>>(new Set());

  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll container
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Track previous pageType for welcome messages
  const prevPageTypeRef = useRef<string>('');

  // Whether the first user message has been sent (to prepend context)
  const contextSentRef = useRef(false);

  // -----------------------------------------------------------------------
  // Auto-scroll
  // -----------------------------------------------------------------------
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestions, scrollToBottom]);

  // -----------------------------------------------------------------------
  // Welcome message on pageType change
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (pageState.pageType && pageState.pageType !== prevPageTypeRef.current) {
      prevPageTypeRef.current = pageState.pageType;
      contextSentRef.current = false;
      chatHistoryRef.current = [];

      const welcome: Message = {
        id: nextId(),
        role: 'system',
        content: getWelcomeMessage(pageState.pageType),
      };

      setMessages([welcome]);
      setSuggestions([]);
      shownClientNamesRef.current = new Set();
      shownProjectKeysRef.current = new Set();
    }
  }, [pageState.pageType]);

  // -----------------------------------------------------------------------
  // Proactive suggestion logic (debounced formData watcher)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const { pageType, formData } = pageState;
      if (!formData) return;

      // --- clients-new: research company ---
      if (pageType === 'clients-new') {
        const name = typeof formData.name === 'string' ? formData.name.trim() : '';
        if (name.length >= 2 && !shownClientNamesRef.current.has(name)) {
          shownClientNamesRef.current.add(name);

          const suggestionId = nextId();
          const suggestion: Suggestion = {
            id: suggestionId,
            description: `I notice you're adding **${name}** as a client. Would you like me to research this company and help fill in the remaining details (industry, region, website, etc.)?`,
            acceptLabel: 'Yes, research',
            onAccept: () => handleClientResearch(name, suggestionId),
            onDismiss: () => dismissSuggestion(suggestionId),
          };

          setSuggestions((prev) => [...prev, suggestion]);
          if (collapsed) setHasUnread(true);
        }
      }

      // --- projects-new: check existing projects ---
      if (pageType === 'projects-new') {
        const name = typeof formData.name === 'string' ? formData.name.trim() : '';
        const clientId = formData.client_id;
        if (name.length > 0 && clientId) {
          const key = `${clientId}-${name}`;
          if (!shownProjectKeysRef.current.has(key)) {
            shownProjectKeysRef.current.add(key);

            const suggestionId = nextId();
            const suggestion: Suggestion = {
              id: suggestionId,
              description:
                'Want me to check existing projects for this client and suggest a brief?',
              acceptLabel: 'Yes, check',
              onAccept: () => handleProjectCheck(name, String(clientId), suggestionId),
              onDismiss: () => dismissSuggestion(suggestionId),
            };

            setSuggestions((prev) => [...prev, suggestion]);
            if (collapsed) setHasUnread(true);
          }
        }
      }
    }, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [pageState, collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Dismiss a suggestion
  // -----------------------------------------------------------------------
  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // -----------------------------------------------------------------------
  // Handle client research (user accepted suggestion)
  // -----------------------------------------------------------------------
  const handleClientResearch = useCallback(
    async (name: string, suggestionId: string) => {
      // Remove the suggestion card
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

      // Add user intent message
      const userMsg: Message = {
        id: nextId(),
        role: 'user',
        content: `Yes, please research "${name}" for me.`,
      };

      // Add thinking message
      const thinkingId = nextId();
      const thinkingMsg: Message = {
        id: thinkingId,
        role: 'assistant',
        content: '',
        isThinking: true,
      };

      setMessages((prev) => [...prev, userMsg, thinkingMsg]);

      // Build the API call
      const prompt = `I'm on the ${pageState.pageTitle} page. Current form data: ${JSON.stringify(pageState.formData)}. Please research ${name} and provide the following fields as JSON in your response: industry (array), region (array), website_url, company_size, client_value_tier (A/B/C/D). Wrap the JSON in \`\`\`json blocks.`;

      const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: prompt },
      ];

      try {
        const response = await crmApi.chat(apiMessages);

        // Remove thinking message
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

        // Try to extract JSON and push form updates
        const parsed = extractJson(response.message);
        if (parsed && formUpdateRef.current) {
          formUpdateRef.current(parsed);
        }

        const assistantMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: response.message,
          toolCalls: response.tool_calls,
        };

        chatHistoryRef.current = [
          ...apiMessages,
          { role: 'assistant', content: response.message },
        ];
        contextSentRef.current = true;

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        // Remove thinking message
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

        const errorMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: `Sorry, I ran into an error while researching "${name}". ${err instanceof Error ? err.message : 'Please try again.'}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [pageState, formUpdateRef],
  );

  // -----------------------------------------------------------------------
  // Handle project check (user accepted suggestion)
  // -----------------------------------------------------------------------
  const handleProjectCheck = useCallback(
    async (name: string, clientId: string, suggestionId: string) => {
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

      const userMsg: Message = {
        id: nextId(),
        role: 'user',
        content: `Yes, please check existing projects for this client and suggest a brief.`,
      };

      const thinkingId = nextId();
      const thinkingMsg: Message = {
        id: thinkingId,
        role: 'assistant',
        content: '',
        isThinking: true,
      };

      setMessages((prev) => [...prev, userMsg, thinkingMsg]);

      const prompt = `I'm on the ${pageState.pageTitle} page. Current form data: ${JSON.stringify(pageState.formData)}. The client_id is ${clientId} and the project name is "${name}". Please check what existing projects this client has and suggest a brief for this new project. If you have suggestions for the brief, include them as JSON with a "brief" field wrapped in \`\`\`json blocks.`;

      const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: prompt },
      ];

      try {
        const response = await crmApi.chat(apiMessages);

        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

        const parsed = extractJson(response.message);
        if (parsed && formUpdateRef.current) {
          formUpdateRef.current(parsed);
        }

        const assistantMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: response.message,
          toolCalls: response.tool_calls,
        };

        chatHistoryRef.current = [
          ...apiMessages,
          { role: 'assistant', content: response.message },
        ];
        contextSentRef.current = true;

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

        const errorMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: `Sorry, I ran into an error checking projects. ${err instanceof Error ? err.message : 'Please try again.'}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [pageState, formUpdateRef],
  );

  // -----------------------------------------------------------------------
  // Regular chat send
  // -----------------------------------------------------------------------
  const handleSend = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || sending) return;

      setInput('');
      setSending(true);

      // Show the user message
      const userMsg: Message = {
        id: nextId(),
        role: 'user',
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Build the message to send to API with context
      let apiContent = text;
      if (!contextSentRef.current) {
        const ctx = `Context: I'm on the ${pageState.pageTitle || 'CRM'} page. Form data: ${JSON.stringify(pageState.formData ?? {})}.\n\n`;
        apiContent = ctx + text;
        contextSentRef.current = true;
      }

      const newApiMessages = [
        ...chatHistoryRef.current,
        { role: 'user' as const, content: apiContent },
      ];

      // Add thinking indicator
      const thinkingId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: thinkingId, role: 'assistant', content: '', isThinking: true },
      ]);

      try {
        const response = await crmApi.chat(newApiMessages);

        // Remove thinking
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

        const assistantMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: response.message,
          toolCalls: response.tool_calls,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Update chat history
        chatHistoryRef.current = [
          ...newApiMessages,
          { role: 'assistant', content: response.message },
        ];
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

        const errorMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: `Sorry, something went wrong. ${err instanceof Error ? err.message : 'Please try again.'}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, pageState],
  );

  // -----------------------------------------------------------------------
  // Collapsed state: floating button
  // -----------------------------------------------------------------------
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => {
          setCollapsed(false);
          setHasUnread(false);
        }}
        className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 border border-slate-700 shadow-lg hover:bg-slate-700 transition-colors"
        aria-label="Open AI Assistant"
      >
        <Bot size={20} className="text-emerald-400" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-800 animate-pulse" />
        )}
      </button>
    );
  }

  // -----------------------------------------------------------------------
  // Expanded panel
  // -----------------------------------------------------------------------
  return (
    <aside className="flex h-full w-[380px] flex-shrink-0 flex-col border-l border-slate-700 bg-slate-900/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-emerald-600/20 p-1.5">
            <Bot size={16} className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">AI Assistant</h2>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Minimize assistant"
        >
          <MinusCircle size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 scroll-smooth"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Suggestion cards */}
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-700 px-3 py-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={sending}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </form>
    </aside>
  );
}
