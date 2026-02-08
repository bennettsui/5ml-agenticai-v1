/**
 * CRM KB API client for the main 5ML platform.
 *
 * Uses NEXT_PUBLIC_CRM_KB_API_URL to reach the CRM KB FastAPI backend.
 * Falls back to same-origin /api if not set.
 */

const API_BASE =
  (typeof window !== "undefined" &&
    (window as Record<string, unknown>).__CRM_KB_API_URL) ||
  process.env.NEXT_PUBLIC_CRM_KB_API_URL ||
  "/api";

// ---------------------------------------------------------------------------
// Types (subset of CRM KB types needed for embedded pages)
// ---------------------------------------------------------------------------

export type ClientStatus = "active" | "dormant" | "prospect" | "lost";
export type ClientValueTier = "A" | "B" | "C" | "D";
export type ProjectType =
  | "website"
  | "social_campaign"
  | "rebrand"
  | "video_series"
  | "content_production"
  | "other";
export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";
export type FeedbackSource =
  | "email"
  | "meeting_notes"
  | "form"
  | "chat"
  | "phone"
  | "other";
export type Sentiment = "positive" | "neutral" | "negative";
export type FeedbackSeverity = "info" | "minor" | "major" | "critical";
export type FeedbackStatus =
  | "new"
  | "reviewed"
  | "converted_to_rule"
  | "converted_to_pattern"
  | "ignored";

export interface Client {
  id: string;
  name: string;
  legal_name: string | null;
  industry: string[] | null;
  region: string[] | null;
  status: ClientStatus;
  website_url: string | null;
  company_size: string | null;
  client_value_tier: ClientValueTier | null;
  health_score: number;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
  legal_name?: string | null;
  industry?: string[] | null;
  region?: string[] | null;
  status?: ClientStatus;
  website_url?: string | null;
  company_size?: string | null;
  client_value_tier?: ClientValueTier | null;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  type: ProjectType;
  brief: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  success_flag: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  client_id: string;
  name: string;
  type: ProjectType;
  brief?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: ProjectStatus;
}

export interface FeedbackEvent {
  id: string;
  client_id: string;
  project_id: string | null;
  source: FeedbackSource;
  date: string;
  raw_text: string;
  sentiment: Sentiment | null;
  topics: string[] | null;
  severity: FeedbackSeverity | null;
  status: FeedbackStatus;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface GmailStatus {
  connected: boolean;
  email: string | null;
  last_sync_at: string | null;
  total_synced: number;
}

export interface OrchestrationStatus {
  circuit_breaker_state: "CLOSED" | "OPEN" | "HALF_OPEN";
  daily_tokens_used: number;
  daily_token_limit: number;
  daily_cost_used_usd: number;
  daily_cost_limit_usd: number;
  active_model: string;
  budget_warning: boolean;
}

export interface ChatResponse {
  message: string;
  session_id: string;
  tool_calls: Array<{
    tool: string;
    input: Record<string, unknown>;
    result_preview: string;
  }> | null;
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: unknown;
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    throw new Error(
      `API Error ${res.status}: ${typeof body === "object" && body && "detail" in body ? (body as { detail: string }).detail : text || res.statusText}`
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// API namespaces
// ---------------------------------------------------------------------------

export const crmApi = {
  clients: {
    list(params?: { page?: number; size?: number; search?: string }) {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.size) qs.set("size", String(params.size));
      if (params?.search) qs.set("search", params.search);
      const q = qs.toString();
      return request<PaginatedResponse<Client>>(`/clients${q ? `?${q}` : ""}`);
    },
    get(id: string) {
      return request<Client>(`/clients/${id}`);
    },
    create(data: ClientCreate) {
      return request<Client>("/clients", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  projects: {
    list(params?: { page?: number; size?: number; status?: string }) {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.size) qs.set("size", String(params.size));
      if (params?.status) qs.set("status", params.status);
      const q = qs.toString();
      return request<PaginatedResponse<Project>>(
        `/projects${q ? `?${q}` : ""}`
      );
    },
    create(data: ProjectCreate) {
      return request<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  feedback: {
    list(params?: { page?: number; size?: number; sentiment?: string }) {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.size) qs.set("size", String(params.size));
      if (params?.sentiment) qs.set("sentiment", params.sentiment);
      const q = qs.toString();
      return request<PaginatedResponse<FeedbackEvent>>(
        `/feedback${q ? `?${q}` : ""}`
      );
    },
  },

  gmail: {
    status() {
      return request<GmailStatus>("/gmail/status");
    },
    authUrl() {
      return request<{ auth_url: string }>("/gmail/auth");
    },
    sync() {
      return request<{ synced_count: number; new_feedback_count: number }>(
        "/gmail/sync",
        { method: "POST", body: JSON.stringify({}) }
      );
    },
  },

  orchestration: {
    status() {
      return request<OrchestrationStatus>("/orchestration/status");
    },
  },

  chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    opts?: { model?: string; page_context?: Record<string, unknown> }
  ) {
    // Chat goes to the main Express backend, not the CRM KB FastAPI
    return fetch("/api/crm/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: opts?.model,
        page_context: opts?.page_context,
      }),
    }).then(async (res) => {
      const text = await res.text();
      if (!res.ok) {
        let detail: string;
        try {
          const j = JSON.parse(text);
          detail = j.error || j.detail || text;
        } catch {
          detail = text;
        }
        throw new Error(`API Error ${res.status}: ${detail}`);
      }
      return JSON.parse(text) as ChatResponse;
    });
  },

  /** List available LLM models */
  listModels() {
    return fetch("/api/llm/models").then(async (res) => {
      const text = await res.text();
      if (!res.ok) throw new Error(`API Error ${res.status}`);
      return JSON.parse(text) as {
        models: Array<{
          key: string;
          name: string;
          description: string;
          costPer1M: { input: number; output: number };
        }>;
        default: string;
      };
    });
  },
};
