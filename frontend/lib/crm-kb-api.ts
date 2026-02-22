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

export type BrandStatus = "active" | "dormant" | "prospect" | "lost";
export type BrandValueTier = "A" | "B" | "C" | "D";
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

export interface Brand {
  id: string;
  name: string;
  legal_name: string | null;
  industry: string[] | null;
  region: string[] | null;
  status: BrandStatus;
  website_url: string | null;
  company_size: string | null;
  client_value_tier: BrandValueTier | null;
  health_score: number;
  created_at: string;
  updated_at: string;
}

export interface BrandCreate {
  name: string;
  legal_name?: string | null;
  industry?: string[] | null;
  region?: string[] | null;
  status?: BrandStatus;
  website_url?: string | null;
  company_size?: string | null;
  client_value_tier?: BrandValueTier | null;
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

// ---------------------------------------------------------------------------
// Debug types
// ---------------------------------------------------------------------------

export type DebugSubjectType =
  | "web_page"
  | "website"
  | "design"
  | "video"
  | "social_post"
  | "agent_workflow"
  | "document"
  | "other";
export type DebugSessionStatus =
  | "open"
  | "in_review"
  | "addressed"
  | "ignored"
  | "archived";
export type DebugOverallStatus = "pass" | "warning" | "fail";
export type IssueSeverity = "critical" | "major" | "minor" | "info";
export type IssuePriority = "P0" | "P1" | "P2" | "P3";
export type ResolutionStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "accepted_risk"
  | "wont_fix"
  | "duplicate";

export interface DebugModule {
  id: string;
  name: string;
  description: string | null;
  applicable_subject_types: string[] | null;
  version: string;
  status: string;
}

export interface DebugSession {
  id: string;
  project_id: string | null;
  client_id: string | null;
  subject_type: DebugSubjectType;
  subject_ref: string | null;
  modules_invoked: Array<{
    module: string;
    status: string;
    execution_time_ms: number;
    issues_found?: number;
    error_message?: string;
  }> | null;
  overall_score: number | null;
  overall_status: DebugOverallStatus | null;
  overall_summary: string | null;
  kb_entries_used: Array<{ type: string; id: string }> | null;
  status: DebugSessionStatus;
  status_notes: string | null;
  initiated_by: string | null;
  trace_enabled: boolean;
  created_at: string;
  updated_at: string;
  issue_count?: number;
  critical_count?: number;
  major_count?: number;
  issues?: DebugIssue[];
  page_results?: Array<{
    url: string;
    title: string;
    status_code: number;
    fetch_time_ms: number;
    score: number;
    issue_count: number;
    critical_count: number;
  }>;
  orchestration?: {
    total_cost: number;
    budget: number;
    cost_per_page?: number;
    fetch_time_ms: number;
    modules_run: number;
    modules_skipped: number;
    layer_scores: Record<string, { total_impact: number; count: number }>;
    pages_scanned?: number;
    api_cost_usd?: number;
  };
}

export interface DebugIssue {
  id: string;
  debug_session_id: string;
  client_id: string;
  project_id: string;
  module: string;
  area: string;
  severity: IssueSeverity;
  finding: string;
  evidence: Record<string, unknown> | null;
  recommendation: string | null;
  priority: IssuePriority;
  related_rule_ids: string[] | null;
  related_pattern_ids: string[] | null;
  score_impact: number;
  business_impact: string | null;
  user_impact: string | null;
  page_url?: string | null;
  resolution_status: ResolutionStatus;
  assigned_to: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebugStats {
  total_sessions: number;
  pass_count: number;
  warning_count: number;
  fail_count: number;
  total_issues: number;
  open_issues: number;
  critical_open: number;
  avg_score: number | null;
}

export interface DebugSessionCreate {
  project_id?: string;
  client_id?: string;
  subject_type: DebugSubjectType;
  subject_ref?: string;
  module_ids: string[];
  trace_enabled?: boolean;
  auto_run?: boolean;
}

export interface GmailStatus {
  configured: boolean;
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
  brands: {
    list(params?: { page?: number; size?: number; search?: string }) {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.size) qs.set("size", String(params.size));
      if (params?.search) qs.set("search", params.search);
      const q = qs.toString();
      return request<PaginatedResponse<Brand>>(`/brands${q ? `?${q}` : ""}`);
    },
    get(id: string) {
      return request<Brand>(`/brands/${id}`);
    },
    create(data: BrandCreate) {
      return request<Brand>("/brands", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    delete(id: string) {
      return request<void>(`/brands/${id}`, { method: "DELETE" });
    },
    projects(clientId: string, params?: { page?: number; size?: number }) {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.size) qs.set("size", String(params.size));
      const q = qs.toString();
      return request<PaginatedResponse<Project>>(
        `/brands/${clientId}/projects${q ? `?${q}` : ""}`
      );
    },
    feedback(clientId: string, params?: { page?: number; size?: number }) {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.size) qs.set("size", String(params.size));
      const q = qs.toString();
      return request<PaginatedResponse<FeedbackEvent>>(
        `/brands/${clientId}/feedback${q ? `?${q}` : ""}`
      );
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
    delete(id: string) {
      return request<void>(`/projects/${id}`, { method: "DELETE" });
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

  debug: {
    modules() {
      return request<DebugModule[]>("/debug/modules");
    },
    sessions(params?: {
      client_id?: string;
      project_id?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) {
      const qs = new URLSearchParams();
      if (params?.client_id) qs.set("client_id", params.client_id);
      if (params?.project_id) qs.set("project_id", params.project_id);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return request<{ items: DebugSession[]; total: number; page: number; limit: number }>(
        `/debug/sessions${q ? `?${q}` : ""}`
      );
    },
    getSession(id: string) {
      return request<DebugSession>(`/debug/sessions/${id}`);
    },
    createSession(data: DebugSessionCreate) {
      return request<DebugSession>("/debug/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    runSession(id: string) {
      return request<DebugSession>(`/debug/sessions/${id}/run`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    updateSession(id: string, data: { status?: string; status_notes?: string }) {
      return request<DebugSession>(`/debug/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    issues(params?: {
      client_id?: string;
      session_id?: string;
      severity?: string;
      resolution?: string;
      page?: number;
      limit?: number;
    }) {
      const qs = new URLSearchParams();
      if (params?.client_id) qs.set("client_id", params.client_id);
      if (params?.session_id) qs.set("session_id", params.session_id);
      if (params?.severity) qs.set("severity", params.severity);
      if (params?.resolution) qs.set("resolution", params.resolution);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return request<{ items: DebugIssue[]; total: number; page: number; limit: number }>(
        `/debug/issues${q ? `?${q}` : ""}`
      );
    },
    updateIssue(id: string, data: { resolution_status?: string; assigned_to?: string; priority?: string; resolution_notes?: string }) {
      return request<DebugIssue>(`/debug/issues/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    stats(params?: { client_id?: string }) {
      const qs = new URLSearchParams();
      if (params?.client_id) qs.set("client_id", params.client_id);
      const q = qs.toString();
      return request<DebugStats>(`/debug/stats${q ? `?${q}` : ""}`);
    },
  },

  chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    opts?: { model?: string; page_context?: Record<string, unknown>; use_case_id?: string }
  ) {
    // Chat goes to the main Express backend, not the CRM KB FastAPI
    return fetch("/api/crm/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: opts?.model,
        page_context: opts?.page_context,
        use_case_id: opts?.use_case_id || "crm",
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
