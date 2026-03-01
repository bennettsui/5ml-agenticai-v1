'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type ChangeEvent,
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
  Paperclip,
  Image as ImageIcon,
  FileText,
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
  /** Image data URLs to display in the bubble */
  imagePreviews?: string[];
  /** File names attached to this message */
  fileNames?: string[];
}

interface Suggestion {
  id: string;
  description: string;
  acceptLabel: string;
  onAccept: () => void;
  onDismiss: () => void;
}

/** A file staged for upload */
interface Attachment {
  id: string;
  file: File;
  kind: 'image' | 'text' | 'other';
  /** Data URL for image preview */
  preview?: string;
  /** Base64-only string (no prefix) for images */
  base64?: string;
  mediaType?: string;
  /** Text content for plain-text files */
  textContent?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let msgIdCounter = 0;
function nextId() { return `msg-${Date.now()}-${++msgIdCounter}`; }

function attachId() { return Math.random().toString(36).slice(2); }

function getWelcomeMessage(pageType: string): string {
  switch (pageType) {
    case 'brands-new': return "I'm here to help you set up a new brand. Start typing the brand name and I can research their details.";
    case 'projects-new': return "I'll help you create a new project. I can suggest briefs and check existing work.";
    case 'brands-list': return 'Ask me anything about your brands, or search for specific information.';
    case 'projects-list': return 'Need help finding a project or analyzing project status? Just ask.';
    case 'project-detail': return 'I can help with the project brief, deliverables, or any questions about this project.';
    case 'feedback': return 'I can help analyze feedback trends or find specific entries.';
    case 'integrations': return 'I can help with Gmail sync or orchestration settings.';
    default: return 'How can I help you today?';
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (fencedMatch) { try { return JSON.parse(fencedMatch[1].trim()); } catch { /* fall through */ } }
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch { /* fall through */ }
  }
  return null;
}

function extractActions(text: string): AiAction[] {
  const actions: AiAction[] = [];
  const regex = /```action\s*([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try { const action = JSON.parse(match[1].trim()); if (action.type) actions.push(action); } catch { /* skip */ }
  }
  return actions;
}

function stripActionBlocks(text: string): string {
  return text.replace(/```action[\s\S]*?```/g, '').trim();
}

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

/** Convert a File to a base64 string + media type */
function fileToBase64(file: File): Promise<{ base64: string; mediaType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mediaType = header.replace('data:', '').replace(';base64', '');
      resolve({ base64, mediaType, preview: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Read a text file as a string */
function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'text/html'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToolCallBadge({ tc }: { tc: ToolCall }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 rounded bg-slate-700/60 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors">
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
  const iconMap = { navigate: ArrowRight, update_form: FileEdit, create_brand: Sparkles, create_project: Sparkles, refresh: RefreshCw };
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
    <button type="button" onClick={() => onExecute(action)} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">
      <Icon size={12} />
      {label}
    </button>
  );
}

function MessageBubble({ msg, onExecuteAction }: { msg: Message; onExecuteAction: (a: AiAction) => void }) {
  if (msg.isThinking) {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-shrink-0 mt-0.5 rounded-full bg-emerald-600/20 p-1">
          <Loader2 size={14} className="text-emerald-400 animate-spin" />
        </div>
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">Thinking...</div>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3 group">
        <div className="max-w-[85%] space-y-1.5">
          {/* Image previews */}
          {msg.imagePreviews && msg.imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {msg.imagePreviews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="attachment" className="max-h-32 max-w-[160px] rounded-lg object-cover border border-slate-600/50" />
              ))}
            </div>
          )}
          {/* File name chips */}
          {msg.fileNames && msg.fileNames.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {msg.fileNames.map((name, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-[11px]">
                  <FileText size={10} />
                  {name}
                </span>
              ))}
            </div>
          )}
          {/* Text bubble */}
          {msg.content && (
            <div className="rounded-lg bg-emerald-600/80 px-3 py-2 text-sm text-white">
              {msg.content}
              <MessageActions content={msg.content} variant="user" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (msg.role === 'system' && msg.content.startsWith('[')) {
    return (
      <div className="flex justify-center mb-3">
        <span className="text-[11px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{msg.content}</span>
      </div>
    );
  }

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
        {msg.toolCalls?.map((tc, i) => <ToolCallBadge key={i} tc={tc} />)}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.actions.map((action, i) => <ActionButton key={i} action={action} onExecute={onExecuteAction} />)}
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
      return <pre key={i} className="my-1 max-h-40 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-400 font-mono leading-tight">{inner}</pre>;
    }
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={i}>
        {boldParts.map((bp, j) => {
          if (bp.startsWith('**') && bp.endsWith('**')) return <strong key={j} className="text-slate-100 font-semibold">{bp.slice(2, -2)}</strong>;
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
          <p className="text-sm text-slate-300 leading-snug">{renderContent(suggestion.description)}</p>
        </div>
        <div className="flex gap-2 ml-6">
          <button type="button" onClick={suggestion.onAccept} className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">
            <Check size={12} />{suggestion.acceptLabel}
          </button>
          <button type="button" onClick={suggestion.onDismiss} className="inline-flex items-center gap-1 rounded bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600 transition-colors">
            <X size={12} />No thanks
          </button>
        </div>
      </div>
    </div>
  );
}

/** Staged attachment chip */
function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 pr-1">
      {att.kind === 'image' && att.preview ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={att.preview} alt={att.file.name} className="h-14 w-14 object-cover rounded-lg border border-slate-600/50" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-500 transition-colors"
          >
            <X size={9} />
          </button>
        </div>
      ) : (
        <div className="relative group flex items-center gap-1.5 px-2 py-1 bg-slate-700/60 border border-slate-600/50 rounded-lg">
          <FileText size={12} className="text-slate-400 flex-shrink-0" />
          <span className="text-[11px] text-slate-300 max-w-[100px] truncate">{att.file.name}</span>
          <button
            type="button"
            onClick={onRemove}
            className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AiAssistant() {
  const { pageState, formUpdateRef, navigate, refreshRef } = useCrmAi();

  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId(), role: 'system', content: 'How can I help you today?' },
  ]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [crmSessionId, setCrmSessionId] = useState<string | null>(null);
  const shownClientNamesRef = useRef<Set<string>>(new Set());
  const shownProjectKeysRef = useRef<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevPageTypeRef = useRef<string>('');
  const contextSentRef = useRef(false);

  // Auto-scroll
  const scrollToBottom = useCallback(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, suggestions, scrollToBottom]);

  // Restore previous session
  useEffect(() => {
    pruneExpiredSessions();
    const prev = getLatestSession('crm');
    if (prev && prev.messages.length > 0) {
      const restored: Message[] = [
        { id: nextId(), role: 'system', content: 'How can I help you today?' },
        ...prev.messages.map(m => ({ id: nextId(), role: m.role as 'user' | 'assistant', content: m.content })),
      ];
      setMessages(restored);
      chatHistoryRef.current = prev.messages.map(m => ({ role: m.role, content: m.content }));
      setCrmSessionId(prev.id);
    } else {
      setCrmSessionId(createSession('crm').id);
    }
  }, []);

  // Page change notification
  useEffect(() => {
    if (pageState.pageType && pageState.pageType !== prevPageTypeRef.current) {
      const isFirst = !prevPageTypeRef.current;
      prevPageTypeRef.current = pageState.pageType;
      contextSentRef.current = false;
      if (isFirst) {
        setMessages([{ id: nextId(), role: 'system', content: getWelcomeMessage(pageState.pageType) }]);
      } else {
        setMessages((prev) => [...prev, { id: nextId(), role: 'system', content: `[Navigated to ${pageState.pageTitle || pageState.pageType}]` }]);
      }
      shownClientNamesRef.current = new Set();
      shownProjectKeysRef.current = new Set();
      setSuggestions([]);
    }
  }, [pageState.pageType, pageState.pageTitle]);

  // -----------------------------------------------------------------------
  // Execute AI action
  // -----------------------------------------------------------------------
  const executeAction = useCallback(async (action: AiAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.path) {
          navigate(action.path);
          setMessages((prev) => [...prev, { id: nextId(), role: 'system', content: `[Navigating to ${PAGE_LABELS[action.path!] || action.path}...]` }]);
        }
        break;
      case 'update_form':
        if (action.data && formUpdateRef.current) {
          formUpdateRef.current(action.data);
          setMessages((prev) => [...prev, { id: nextId(), role: 'system', content: `[Updated form fields: ${Object.keys(action.data!).join(', ')}]` }]);
        }
        break;
      case 'create_brand':
        if (action.data) {
          try {
            const brand = await crmApi.brands.create(action.data as Parameters<typeof crmApi.brands.create>[0]);
            setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: `Brand **${brand.name}** created successfully!`, actions: [{ type: 'navigate', path: '/use-cases/crm/brands', label: 'View Brands' }] }]);
          } catch (err) {
            setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: `Failed to create brand: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
          }
        }
        break;
      case 'create_project':
        if (action.data) {
          try {
            const project = await crmApi.projects.create(action.data as Parameters<typeof crmApi.projects.create>[0]);
            setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: `Project **${project.name}** created successfully!`, actions: [{ type: 'navigate', path: '/use-cases/crm/projects', label: 'View Projects' }] }]);
          } catch (err) {
            setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: `Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
          }
        }
        break;
      case 'refresh':
        if (refreshRef.current) {
          refreshRef.current();
          setMessages((prev) => [...prev, { id: nextId(), role: 'system', content: '[Refreshing page data...]' }]);
        }
        break;
    }
  }, [navigate, formUpdateRef, refreshRef]);

  // -----------------------------------------------------------------------
  // Process AI response
  // -----------------------------------------------------------------------
  const processAiResponse = useCallback((responseText: string, toolCalls?: ToolCall[] | null) => {
    const actions = extractActions(responseText);
    const parsed = extractJson(responseText);
    if (parsed && formUpdateRef.current) {
      const formFields = ['name', 'legal_name', 'legalName', 'industry', 'region', 'website_url', 'websiteUrl', 'company_size', 'companySize', 'client_value_tier', 'valueTier', 'brief', 'type', 'status', 'start_date', 'end_date'];
      if (Object.keys(parsed).some(k => formFields.includes(k))) {
        formUpdateRef.current(parsed);
        if (!actions.some(a => a.type === 'update_form')) actions.push({ type: 'update_form', data: parsed, label: 'Re-apply to form' });
      }
    }
    for (const action of actions) { if (action.type === 'refresh') executeAction(action); }
    return { id: nextId(), role: 'assistant' as const, content: responseText, toolCalls, actions: actions.length > 0 ? actions : undefined };
  }, [formUpdateRef, executeAction]);

  // -----------------------------------------------------------------------
  // Proactive suggestions
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
          const sid = nextId();
          setSuggestions((prev) => [...prev, {
            id: sid,
            description: `I notice you're adding **${name}** as a brand. Would you like me to research this company and help fill in the remaining details?`,
            acceptLabel: 'Yes, research',
            onAccept: () => handleClientResearch(name, sid),
            onDismiss: () => setSuggestions((p) => p.filter((s) => s.id !== sid)),
          }]);
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
            const sid = nextId();
            setSuggestions((prev) => [...prev, {
              id: sid,
              description: 'Want me to check existing projects and suggest a brief?',
              acceptLabel: 'Yes, check',
              onAccept: () => handleProjectCheck(name, String(clientId), sid),
              onDismiss: () => setSuggestions((p) => p.filter((s) => s.id !== sid)),
            }]);
            if (collapsed) setHasUnread(true);
          }
        }
      }
    }, 2000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [pageState, collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClientResearch = useCallback(async (name: string, suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    const userMsg: Message = { id: nextId(), role: 'user', content: `Yes, please research "${name}" for me.` };
    const thinkingId = nextId();
    setMessages((prev) => [...prev, userMsg, { id: thinkingId, role: 'assistant', content: '', isThinking: true }]);
    const prompt = `Research the company "${name}" and provide: industry (array), region (array), website_url, company_size, client_value_tier (A/B/C/D), legal_name. Return the data as JSON in \`\`\`json blocks. Current form: ${JSON.stringify(pageState.formData)}`;
    const apiMessages = [{ role: 'user' as const, content: prompt }];
    try {
      const response = await crmApi.chat(apiMessages, { page_context: { pageType: pageState.pageType, pageTitle: pageState.pageTitle, formData: pageState.formData } });
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      const assistantMsg = processAiResponse(response.message, response.tool_calls);
      chatHistoryRef.current = [...apiMessages, { role: 'assistant', content: response.message }];
      contextSentRef.current = true;
      setMessages((prev) => [...prev, assistantMsg]);
      if (crmSessionId) {
        persistChatMessage(crmSessionId, { role: 'user', content: prompt, timestamp: new Date().toISOString() });
        persistChatMessage(crmSessionId, { role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
      }
    } catch (err) {
      setMessages((prev) => [...prev.filter((m) => m.id !== thinkingId), { id: nextId(), role: 'assistant', content: `Sorry, error researching "${name}". ${err instanceof Error ? err.message : 'Please try again.'}` }]);
    }
  }, [pageState, processAiResponse, crmSessionId]);

  const handleProjectCheck = useCallback(async (name: string, clientId: string, suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    const userMsg: Message = { id: nextId(), role: 'user', content: `Check existing projects for this brand and suggest a brief.` };
    const thinkingId = nextId();
    setMessages((prev) => [...prev, userMsg, { id: thinkingId, role: 'assistant', content: '', isThinking: true }]);
    const prompt = `Brand ID: ${clientId}, project name: "${name}". Check existing projects and suggest a brief. Include as JSON with "brief" field in \`\`\`json blocks. Form: ${JSON.stringify(pageState.formData)}`;
    const apiMessages = [{ role: 'user' as const, content: prompt }];
    try {
      const response = await crmApi.chat(apiMessages, { page_context: { pageType: pageState.pageType, pageTitle: pageState.pageTitle, formData: pageState.formData } });
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      const assistantMsg = processAiResponse(response.message, response.tool_calls);
      chatHistoryRef.current = [...apiMessages, { role: 'assistant', content: response.message }];
      contextSentRef.current = true;
      setMessages((prev) => [...prev, assistantMsg]);
      if (crmSessionId) {
        persistChatMessage(crmSessionId, { role: 'user', content: prompt, timestamp: new Date().toISOString() });
        persistChatMessage(crmSessionId, { role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
      }
    } catch (err) {
      setMessages((prev) => [...prev.filter((m) => m.id !== thinkingId), { id: nextId(), role: 'assistant', content: `Sorry, error checking projects. ${err instanceof Error ? err.message : 'Please try again.'}` }]);
    }
  }, [pageState, processAiResponse, crmSessionId]);

  // -----------------------------------------------------------------------
  // File attachment handling
  // -----------------------------------------------------------------------
  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newAttachments: Attachment[] = [];
    for (const file of files) {
      const id = attachId();
      if (IMAGE_TYPES.includes(file.type)) {
        try {
          const { base64, mediaType, preview } = await fileToBase64(file);
          newAttachments.push({ id, file, kind: 'image', preview, base64, mediaType });
        } catch { /* skip unreadable files */ }
      } else if (TEXT_TYPES.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        try {
          const textContent = await fileToText(file);
          newAttachments.push({ id, file, kind: 'text', textContent });
        } catch { /* skip */ }
      } else {
        newAttachments.push({ id, file, kind: 'other' });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // -----------------------------------------------------------------------
  // Send message
  // -----------------------------------------------------------------------
  const handleSend = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && attachments.length === 0) || sending) return;

    setInput('');
    setSending(true);

    const currentAttachments = [...attachments];
    setAttachments([]);

    // Build display message
    const imagePreviews = currentAttachments.filter(a => a.kind === 'image').map(a => a.preview!);
    const fileNames = currentAttachments.filter(a => a.kind !== 'image').map(a => a.file.name);
    const userMsg: Message = { id: nextId(), role: 'user', content: text, imagePreviews, fileNames };
    setMessages((prev) => [...prev, userMsg]);

    // Build API content
    // For multimodal (images), use content array; otherwise string
    let apiContent: string | Array<{type: string; [key: string]: unknown}>;

    const imageBlocks = currentAttachments
      .filter(a => a.kind === 'image' && a.base64)
      .map(a => ({
        type: 'image',
        source: { type: 'base64', media_type: a.mediaType!, data: a.base64! },
      }));

    const textBlocks: Array<{type: string; text: string}> = [];

    // Prepend text file contents
    for (const att of currentAttachments.filter(a => a.kind === 'text' && a.textContent)) {
      textBlocks.push({ type: 'text', text: `[File: ${att.file.name}]\n${att.textContent}` });
    }
    // Note unsupported files
    for (const att of currentAttachments.filter(a => a.kind === 'other')) {
      textBlocks.push({ type: 'text', text: `[Attached file: ${att.file.name} — content not readable in browser]` });
    }

    let contextPrefix = '';
    if (!contextSentRef.current) {
      contextPrefix = `Context: I'm on the "${pageState.pageTitle || 'CRM'}" page (${pageState.pageType}). Form data: ${JSON.stringify(pageState.formData ?? {})}.\n\n`;
      contextSentRef.current = true;
    }

    const userTextBlock = { type: 'text', text: contextPrefix + (text || '(see attached)') };

    if (imageBlocks.length > 0) {
      // Must use content array for multimodal
      apiContent = [...imageBlocks, ...textBlocks, userTextBlock] as Array<{type: string; [key: string]: unknown}>;
    } else if (textBlocks.length > 0) {
      // Text files: prepend to string message
      apiContent = [...textBlocks.map(b => b.text), userTextBlock.text].join('\n\n');
    } else {
      apiContent = userTextBlock.text;
    }

    // For history, store only a summary (avoid storing large base64 blobs)
    const historyText = [
      ...currentAttachments.filter(a => a.kind === 'image').map(a => `[Image: ${a.file.name}]`),
      ...currentAttachments.filter(a => a.kind === 'text').map(a => `[File: ${a.file.name}]`),
      text,
    ].filter(Boolean).join(' ');

    const newApiMessages = [
      ...chatHistoryRef.current,
      { role: 'user' as const, content: apiContent as string }, // types are compatible at runtime
    ];

    const thinkingId = nextId();
    setMessages((prev) => [...prev, { id: thinkingId, role: 'assistant', content: '', isThinking: true }]);

    try {
      const response = await crmApi.chat(newApiMessages, {
        page_context: { pageType: pageState.pageType, pageTitle: pageState.pageTitle, formData: pageState.formData },
      });
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      const assistantMsg = processAiResponse(response.message, response.tool_calls);
      setMessages((prev) => [...prev, assistantMsg]);
      // Store summary in history (not base64)
      chatHistoryRef.current = [...chatHistoryRef.current, { role: 'user', content: historyText }, { role: 'assistant', content: response.message }];
      if (crmSessionId) {
        persistChatMessage(crmSessionId, { role: 'user', content: historyText, timestamp: new Date().toISOString() });
        persistChatMessage(crmSessionId, { role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== thinkingId),
        { id: nextId(), role: 'assistant', content: `Sorry, something went wrong. ${err instanceof Error ? err.message : 'Please try again.'}` },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, attachments, sending, pageState, processAiResponse, crmSessionId]);

  // -----------------------------------------------------------------------
  // Collapsed state
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
        {hasUnread && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-800 animate-pulse" />}
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
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{pageState.pageTitle}</span>
          )}
        </div>
        <button type="button" onClick={() => setCollapsed(true)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors" aria-label="Minimize assistant">
          <MinusCircle size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 scroll-smooth">
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onExecuteAction={executeAction} />)}
        {suggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} />)}
        <div ref={bottomRef} />
      </div>

      {/* Attachment previews (staged, above input) */}
      {attachments.length > 0 && (
        <div className="border-t border-slate-700/60 px-3 pt-2 pb-1 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <AttachmentChip key={att.id} att={att} onRemove={() => removeAttachment(att.id)} />
          ))}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-slate-700 px-3 py-3">
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Attach image or file"
          >
            <Paperclip size={15} />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if ((input.trim() || attachments.length > 0) && !sending) handleSend(e as unknown as React.FormEvent);
              }
            }}
            placeholder={attachments.length > 0 ? 'Add a message or just send…' : 'Ask me anything… (Shift+Enter for new line)'}
            disabled={sending}
            rows={1}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 resize-none"
            style={{ maxHeight: '100px' }}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px'; }}
          />

          <button
            type="submit"
            disabled={sending || (!input.trim() && attachments.length === 0)}
            className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,text/*,.md,.csv,.json,.pdf,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hint */}
        <p className="mt-1.5 text-[10px] text-slate-600 text-center">
          <ImageIcon size={9} className="inline mr-0.5" />
          Images · text · CSV · JSON · PDF
        </p>
      </form>
    </aside>
  );
}
