/**
 * Shared chat history utility — localStorage persistence.
 * All chatbots (Agent, Workflow, CRM) use this for session management.
 */

export type ChatType = 'agent' | 'workflow' | 'crm' | 'social';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  type: ChatType;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = '5ml-chat-sessions';
const MAX_SESSIONS_PER_TYPE = 50;
const EMPTY_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readAll(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — prune oldest
    const pruned = sessions.slice(-MAX_SESSIONS_PER_TYPE * 3);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned)); } catch { /* noop */ }
  }
}

/**
 * Remove empty sessions (no messages) older than 24 hours.
 * Sessions with conversations are kept indefinitely.
 */
export function pruneExpiredSessions(): void {
  const all = readAll();
  const now = Date.now();
  const filtered = all.filter(s => {
    if (s.messages.length > 0) return true; // keep sessions with conversations
    const age = now - new Date(s.createdAt).getTime();
    return age < EMPTY_SESSION_TTL_MS;
  });
  if (filtered.length < all.length) {
    writeAll(filtered);
  }
}

/** Create and persist a new empty session. */
export function createSession(type: ChatType, title?: string, metadata?: Record<string, unknown>): ChatSession {
  const session: ChatSession = {
    id: genId(),
    type,
    title: title || `New ${type} chat`,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };
  const all = readAll();
  all.push(session);
  // Prune per type
  const ofType = all.filter(s => s.type === type);
  if (ofType.length > MAX_SESSIONS_PER_TYPE) {
    const removeIds = new Set(
      ofType
        .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        .slice(0, ofType.length - MAX_SESSIONS_PER_TYPE)
        .map(s => s.id)
    );
    writeAll(all.filter(s => !removeIds.has(s.id)));
  } else {
    writeAll(all);
  }
  return session;
}

/** Get the most recent session for a type (or null). */
export function getLatestSession(type: ChatType): ChatSession | null {
  const ofType = readAll().filter(s => s.type === type);
  if (ofType.length === 0) return null;
  return ofType.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
}

/** List all sessions, newest first. Optionally filter by type. */
export function listSessions(type?: ChatType): ChatSession[] {
  const all = readAll();
  const filtered = type ? all.filter(s => s.type === type) : all;
  return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** Get a single session by id. */
export function getSession(id: string): ChatSession | null {
  return readAll().find(s => s.id === id) ?? null;
}

/** Delete a session. */
export function deleteSession(id: string): void {
  writeAll(readAll().filter(s => s.id !== id));
}

/** Append a message and update the session title from first user message. */
export function addMessage(sessionId: string, msg: ChatMessage): void {
  const all = readAll();
  const session = all.find(s => s.id === sessionId);
  if (!session) return;
  session.messages.push(msg);
  session.updatedAt = new Date().toISOString();
  // Auto-title from first user message
  if (session.title.startsWith('New ')) {
    const firstUser = session.messages.find(m => m.role === 'user');
    if (firstUser) {
      session.title = firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? '...' : '');
    }
  }
  writeAll(all);
}

/** Update session metadata. */
export function updateSession(sessionId: string, updates: Partial<Pick<ChatSession, 'title' | 'metadata'>>): void {
  const all = readAll();
  const session = all.find(s => s.id === sessionId);
  if (!session) return;
  if (updates.title) session.title = updates.title;
  if (updates.metadata) session.metadata = { ...session.metadata, ...updates.metadata };
  session.updatedAt = new Date().toISOString();
  writeAll(all);
}
