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
  ArrowRight,
  RefreshCw,
  FileEdit,
} from 'lucide-react';
import { useCrmAi } from '../context';
import { crmApi, type ChatResponse } from '@/lib/crm-kb-api';
import {
  createSession, getLatestSession, addMessage as persistChatMessage,
  pruneExpiredSessions,
} from '@/lib/chat-history';
import MessageActions from '@/components/MessageActions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  result_preview: string;
}

interface AiAction {
  type: 'navigate' | 'update_form' | 'create_brand' | 'create_project' | 'refresh';
  path?: string;
  data?: Record<string, unknown>;
  label?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[] | null;
  actions?: AiAction[];
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
    case 'brands-new':
      return "I'm here to help you set up a new brand. Start typing the brand name and I can research their details.";
    case 'projects-new':
      return "I'll help you create a new project. I can suggest briefs and check existing work.";
    case 'brands-list':
      return 'Ask me anything about your brands, or search for specific information.';
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

/** Extract JSON from ```json ... ``` blocks or bare { ... } */
function extractJson(text: string): Record<string, unknown> | null {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch { /* fall through */ }
  }
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(text.slice(braceStart, braceEnd + 1));
    } catch { /* fall through */ }
  }
  return null;
}

/** Extract action blocks from ```action ... ``` in AI response */
function extractActions(text: string): AiAction[] {
  const actions: AiAction[] = [];
  const regex = /```action\s*([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const action = JSON.parse(match[1].trim());
      if (action.type) actions.push(action);
    } catch { /* skip invalid */ }
  }
  return actions;
}

/** Remove action blocks from display text */
function stripActionBlocks(text: string): string {
  return text.replace(/```action[\s\S]*?```/g, '').trim();
}

// Page name map for user-friendly labels
const PAGE_LABELS: Record<string, string> = {
  '/use-cases/crm': 'Dashboard',
  '/use-cases/crm/brands': 'Brands',
  '/use-cases/crm/brands/new': 'New Brand',
  '/use-cases/crm/brands/detail': 'Brand Detail',
  '/use-cases/crm/projects': 'Projects',
  '/use-cases/crm/projects/new': 'New Project',
  '/use-cases/crm/projects/detail': 'Project Detail',
  '/use-cases/crm/feedback': 'Feedback',
  '/use-cases/crm/integrations': 'Integrations',
  '/use-cases/crm/agentic-dashboard': 'Agentic Dashboard',
};

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

function ActionButton({ action, onExecute }: { action: AiAction; onExecute: (a: AiAction) => void }) {
  const iconMap = {
    navigate: ArrowRight,
    update_form: FileEdit,
    create_brand: Sparkles,
    create_project: Sparkles,
    refresh: RefreshCw,
  };
  const Icon = iconMap[action.type] || ArrowRight;
  const label = action.label || (
    action.type === 'navigate' ? `Go to ${PAGE_LABELS[action.path || ''] || action.path}`
    : action.type === 'update_form' ? 'Apply to form'
    : action.type === 'create_brand' ? 'Create brand'
    : action.type === 'create_project' ? 'Create project'
    : action.type === 'refresh' ? 'Refresh data'
    : action.type
  );

  return (
    <button
      type="button"
      onClick={() => onExecute(action)}
      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function MessageBubble({
  msg,
  onExecuteAction,
}: {
  msg: Message;
  onExecuteAction: (a: AiAction) => void;
}) {
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
      <div className="flex justify-end mb-3 group">
        <div className="max-w-[85%] rounded-lg bg-emerald-600/80 px-3 py-2 text-sm text-white">
          {msg.content}
          <MessageActions content={msg.content} variant="user" />
        </div>
      </div>
    );
  }

  // system page-change notification
  if (msg.role === 'system' && msg.content.startsWith('[')) {
    return (
      <div className="flex justify-center mb-3">
        <span className="text-[11px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  // assistant or system
  return (
    <div className="flex items-start gap-2 mb-3 group">
      <div className="flex-shrink-0 mt-0.5 rounded-full bg-emerald-600/20 p-1">
        <Bot size={14} className="text-emerald-400" />
      </div>
      <div className="max-w-[85%]">
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 whitespace-pre-wrap break-words">
          {renderContent(stripActionBlocks(msg.content))}
          <MessageActions content={stripActionBlocks(msg.content)} variant="assistant" />
        </div>
        {msg.toolCalls?.map((tc, i) => (
          <ToolCallBadge key={i} tc={tc} />
        ))}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.actions.map((action, i) => (
              <ActionButton key={i} action={action} onExecute={onExecuteAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderContent(text: string) {
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
  const { pageState, formUpdateRef, navigate, refreshRef } = useCrmAi();

  // Panel state
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId(), role: 'system', content: 'How can I help you today?' },
  ]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Chat history for API (no system messages)
  const chatHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [crmSessionId, setCrmSessionId] = useState<string | null>(null);

  // Prune stale empty sessions, then load previous CRM session on mount
  useEffect(() => {
    pruneExpiredSessions();
    const prev = getLatestSession('crm');
    if (prev && prev.messages.length > 0) {
      // Restore messages into UI
      const restored: Message[] = [
        { id: nextId(), role: 'system', content: 'How can I help you today?' },
        ...prev.messages.map(m => ({
          id: nextId(),
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];
      setMessages(restored);
      // Restore API history
      chatHistoryRef.current = prev.messages.map(m => ({ role: m.role, content: m.content }));
      setCrmSessionId(prev.id);
    } else {
      const fresh = createSession('crm');
      setCrmSessionId(fresh.id);
    }
  }, []);

  // Track which form values have already triggered a suggestion
  const shownClientNamesRef = useRef<Set<string>>(new Set());
  const shownProjectKeysRef = useRef<Set<string>>(new Set());

  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll container
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Track previous pageType for context-change messages
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
  // Page change notification (persist chat, just add a note)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (pageState.pageType && pageState.pageType !== prevPageTypeRef.current) {
      const isFirst = !prevPageTypeRef.current;
      prevPageTypeRef.current = pageState.pageType;
      contextSentRef.current = false;

      if (isFirst) {
        // First load - set welcome message
        setMessages([{
          id: nextId(),
          role: 'system',
          content: getWelcomeMessage(pageState.pageType),
        }]);
      } else {
        // Page changed - add a small notification, keep history
        const note: Message = {
          id: nextId(),
          role: 'system',
          content: `[Navigated to ${pageState.pageTitle || pageState.pageType}]`,
        };
        setMessages((prev) => [...prev, note]);
      }

      // Reset proactive suggestion tracking for the new page
      shownClientNamesRef.current = new Set();
      shownProjectKeysRef.current = new Set();
      setSuggestions([]);
    }
  }, [pageState.pageType, pageState.pageTitle]);

  // -----------------------------------------------------------------------
  // Execute an AI action
  // -----------------------------------------------------------------------
  const executeAction = useCallback(
    async (action: AiAction) => {
      switch (action.type) {
        case 'navigate':
          if (action.path) {
            navigate(action.path);
            setMessages((prev) => [...prev, {
              id: nextId(), role: 'system',
              content: `[Navigating to ${PAGE_LABELS[action.path!] || action.path}...]`,
            }]);
          }
          break;

        case 'update_form':
          if (action.data && formUpdateRef.current) {
            formUpdateRef.current(action.data);
            setMessages((prev) => [...prev, {
              id: nextId(), role: 'system',
              content: `[Updated form fields: ${Object.keys(action.data).join(', ')}]`,
            }]);
          }
          break;

        case 'create_brand':
          if (action.data) {
            try {
              const brand = await crmApi.brands.create(action.data as any);
              setMessages((prev) => [...prev, {
                id: nextId(), role: 'assistant',
                content: `Brand **${brand.name}** created successfully!`,
                actions: [{ type: 'navigate', path: '/use-cases/crm/brands', label: 'View Brands' }],
              }]);
            } catch (err) {
              setMessages((prev) => [...prev, {
                id: nextId(), role: 'assistant',
                content: `Failed to create brand: ${err instanceof Error ? err.message : 'Unknown error'}`,
              }]);
            }
          }
          break;

        case 'create_project':
          if (action.data) {
            try {
              const project = await crmApi.projects.create(action.data as any);
              setMessages((prev) => [...prev, {
                id: nextId(), role: 'assistant',
                content: `Project **${project.name}** created successfully!`,
                actions: [{ type: 'navigate', path: '/use-cases/crm/projects', label: 'View Projects' }],
              }]);
            } catch (err) {
              setMessages((prev) => [...prev, {
                id: nextId(), role: 'assistant',
                content: `Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}`,
              }]);
            }
          }
          break;

        case 'refresh':
          if (refreshRef.current) {
            refreshRef.current();
            setMessages((prev) => [...prev, {
              id: nextId(), role: 'system', content: '[Refreshing page data...]',
            }]);
          }
          break;
      }
    },
    [navigate, formUpdateRef, refreshRef]
  );

  // -----------------------------------------------------------------------
  // Process AI response - extract actions, form data, auto-execute
  // -----------------------------------------------------------------------
  const processAiResponse = useCallback(
    (responseText: string, toolCalls?: ToolCall[] | null) => {
      const actions = extractActions(responseText);

      // Try to extract form JSON and push updates
      const parsed = extractJson(responseText);
      if (parsed && formUpdateRef.current) {
        const formFields = ['name', 'legal_name', 'legalName', 'industry', 'region', 'website_url',
          'websiteUrl', 'company_size', 'companySize', 'client_value_tier', 'valueTier',
          'brief', 'type', 'status', 'start_date', 'end_date'];
        const isFormData = Object.keys(parsed).some(k => formFields.includes(k));
        if (isFormData) {
          formUpdateRef.current(parsed);
          if (!actions.some(a => a.type === 'update_form')) {
            actions.push({ type: 'update_form', data: parsed, label: 'Re-apply to form' });
          }
        }
      }

      // Auto-execute refresh actions
      for (const action of actions) {
        if (action.type === 'refresh') executeAction(action);
      }

      return {
        id: nextId(),
        role: 'assistant' as const,
        content: responseText,
        toolCalls,
        actions: actions.length > 0 ? actions : undefined,
      };
    },
    [formUpdateRef, executeAction]
  );

  // -----------------------------------------------------------------------
  // Proactive suggestion logic (debounced formData watcher)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const { pageType, formData } = pageState;
      if (!formData) return;

      if (pageType === 'brands-new') {
        const name = typeof formData.name === 'string' ? formData.name.trim() : '';
        if (name.length >= 2 && !shownClientNamesRef.current.has(name)) {
          shownClientNamesRef.current.add(name);
          const suggestionId = nextId();
          setSuggestions((prev) => [
            ...prev,
            {
              id: suggestionId,
              description: `I notice you're adding **${name}** as a brand. Would you like me to research this company and help fill in the remaining details?`,
              acceptLabel: 'Yes, research',
              onAccept: () => handleClientResearch(name, suggestionId),
              onDismiss: () => setSuggestions((p) => p.filter((s) => s.id !== suggestionId)),
            },
          ]);
          if (collapsed) setHasUnread(true);
        }
      }

      if (pageType === 'projects-new') {
        const name = typeof formData.name === 'string' ? formData.name.trim() : '';
        const clientId = formData.client_id;
        if (name.length > 0 && clientId) {
          const key = `${clientId}-${name}`;
          if (!shownProjectKeysRef.current.has(key)) {
            shownProjectKeysRef.current.add(key);
            const suggestionId = nextId();
            setSuggestions((prev) => [
              ...prev,
              {
                id: suggestionId,
                description: 'Want me to check existing projects and suggest a brief?',
                acceptLabel: 'Yes, check',
                onAccept: () => handleProjectCheck(name, String(clientId), suggestionId),
                onDismiss: () => setSuggestions((p) => p.filter((s) => s.id !== suggestionId)),
              },
            ]);
            if (collapsed) setHasUnread(true);
          }
        }
      }
    }, 2000);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [pageState, collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Handle client research
  // -----------------------------------------------------------------------
  const handleClientResearch = useCallback(
    async (name: string, suggestionId: string) => {
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      const userMsg: Message = { id: nextId(), role: 'user', content: `Yes, please research "${name}" for me.` };
      const thinkingId = nextId();
      setMessages((prev) => [...prev, userMsg, { id: thinkingId, role: 'assistant', content: '', isThinking: true }]);

      const prompt = `Research the company "${name}" and provide: industry (array), region (array), website_url, company_size, client_value_tier (A/B/C/D), legal_name. Return the data as JSON in \`\`\`json blocks. Current form: ${JSON.stringify(pageState.formData)}`;
      const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [{ role: 'user', content: prompt }];

      try {
        const response = await crmApi.chat(apiMessages, {
          page_context: { pageType: pageState.pageType, pageTitle: pageState.pageTitle, formData: pageState.formData },
        });
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
        const assistantMsg = processAiResponse(response.message, response.tool_calls);
        chatHistoryRef.current = [...apiMessages, { role: 'assistant', content: response.message }];
        contextSentRef.current = true;
        setMessages((prev) => [...prev, assistantMsg]);
        // Persist to chat history
        if (crmSessionId) {
          persistChatMessage(crmSessionId, { role: 'user', content: prompt, timestamp: new Date().toISOString() });
          persistChatMessage(crmSessionId, { role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
        setMessages((prev) => [...prev, {
          id: nextId(), role: 'assistant',
          content: `Sorry, error researching "${name}". ${err instanceof Error ? err.message : 'Please try again.'}`,
        }]);
      }
    },
    [pageState, processAiResponse, crmSessionId],
  );

  // -----------------------------------------------------------------------
  // Handle project check
  // -----------------------------------------------------------------------
  const handleProjectCheck = useCallback(
    async (name: string, clientId: string, suggestionId: string) => {
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      const userMsg: Message = { id: nextId(), role: 'user', content: `Check existing projects for this brand and suggest a brief.` };
      const thinkingId = nextId();
      setMessages((prev) => [...prev, userMsg, { id: thinkingId, role: 'assistant', content: '', isThinking: true }]);

      const prompt = `Brand ID: ${clientId}, project name: "${name}". Check existing projects and suggest a brief. Include as JSON with "brief" field in \`\`\`json blocks. Form: ${JSON.stringify(pageState.formData)}`;
      const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [{ role: 'user', content: prompt }];

      try {
        const response = await crmApi.chat(apiMessages, {
          page_context: { pageType: pageState.pageType, pageTitle: pageState.pageTitle, formData: pageState.formData },
        });
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
        const assistantMsg = processAiResponse(response.message, response.tool_calls);
        chatHistoryRef.current = [...apiMessages, { role: 'assistant', content: response.message }];
        contextSentRef.current = true;
        setMessages((prev) => [...prev, assistantMsg]);
        // Persist to chat history
        if (crmSessionId) {
          persistChatMessage(crmSessionId, { role: 'user', content: prompt, timestamp: new Date().toISOString() });
          persistChatMessage(crmSessionId, { role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
        setMessages((prev) => [...prev, {
          id: nextId(), role: 'assistant',
          content: `Sorry, error checking projects. ${err instanceof Error ? err.message : 'Please try again.'}`,
        }]);
      }
    },
    [pageState, processAiResponse, crmSessionId],
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

      const userMsg: Message = { id: nextId(), role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);

      let apiContent = text;
      if (!contextSentRef.current) {
        apiContent = `Context: I'm on the "${pageState.pageTitle || 'CRM'}" page (${pageState.pageType}). Form data: ${JSON.stringify(pageState.formData ?? {})}.\n\n${text}`;
        contextSentRef.current = true;
      }

      const newApiMessages = [...chatHistoryRef.current, { role: 'user' as const, content: apiContent }];
      const thinkingId = nextId();
      setMessages((prev) => [...prev, { id: thinkingId, role: 'assistant', content: '', isThinking: true }]);

      try {
        const response = await crmApi.chat(newApiMessages, {
          page_context: { pageType: pageState.pageType, pageTitle: pageState.pageTitle, formData: pageState.formData },
        });
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
        const assistantMsg = processAiResponse(response.message, response.tool_calls);
        setMessages((prev) => [...prev, assistantMsg]);
        chatHistoryRef.current = [...newApiMessages, { role: 'assistant', content: response.message }];
        // Persist to chat history
        if (crmSessionId) {
          persistChatMessage(crmSessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });
          persistChatMessage(crmSessionId, { role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
        setMessages((prev) => [...prev, {
          id: nextId(), role: 'assistant',
          content: `Sorry, something went wrong. ${err instanceof Error ? err.message : 'Please try again.'}`,
        }]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, pageState, processAiResponse],
  );

  // -----------------------------------------------------------------------
  // Collapsed state: floating button
  // -----------------------------------------------------------------------
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => { setCollapsed(false); setHasUnread(false); }}
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
    <aside className="flex h-screen w-[380px] flex-shrink-0 flex-col border-l border-slate-700 bg-slate-900/95 backdrop-blur sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-emerald-600/20 p-1.5">
            <Bot size={16} className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-100">AI Assistant</h2>
          {pageState.pageTitle && (
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {pageState.pageTitle}
            </span>
          )}
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 scroll-smooth">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onExecuteAction={executeAction} />
        ))}
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-slate-700 px-3 py-3">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim() && !sending) handleSend(e as unknown as React.FormEvent); } }}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            disabled={sending}
            rows={1}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 resize-none"
            style={{ maxHeight: '100px' }}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px'; }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </aside>
  );
}
