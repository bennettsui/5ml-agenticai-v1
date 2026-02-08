import { getToken } from "@/lib/auth";
import type {
  Client,
  ClientCreate,
  ClientUpdate,
  ClientOverview,
  Contact,
  ContactCreate,
  ContactUpdate,
  Contract,
  ContractCreate,
  Opportunity,
  OpportunityCreate,
  Project,
  ProjectCreate,
  ProjectDeliverable,
  ProjectMilestone,
  ProjectTeam,
  BrandProfile,
  BrandProfileUpdate,
  TasteExample,
  TasteExampleCreate,
  FeedbackEvent,
  FeedbackCreate,
  FeedbackAnalysis,
  ClientRule,
  ClientRuleCreate,
  Pattern,
  PatternCreate,
  LoginRequest,
  TokenResponse,
  PaginatedResponse,
} from "@/types";

// ---------------------------------------------------------------------------
// Base fetch wrapper
// ---------------------------------------------------------------------------

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, res.statusText, body);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const auth = {
  login(data: LoginRequest): Promise<TokenResponse> {
    return request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<TokenResponse> {
    return request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  me(): Promise<TokenResponse["user"]> {
    return request("/auth/me");
  },
};

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const clients = {
  list(params?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Client>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.size) qs.set("size", String(params.size));
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return request(`/clients${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<Client> {
    return request(`/clients/${id}`);
  },

  overview(id: string): Promise<ClientOverview> {
    return request(`/clients/${id}/overview`);
  },

  create(data: ClientCreate): Promise<Client> {
    return request("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ClientUpdate): Promise<Client> {
    return request(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`/clients/${id}`, { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const contacts = {
  list(clientId: string): Promise<Contact[]> {
    return request(`/clients/${clientId}/contacts`);
  },

  get(clientId: string, contactId: string): Promise<Contact> {
    return request(`/clients/${clientId}/contacts/${contactId}`);
  },

  create(clientId: string, data: ContactCreate): Promise<Contact> {
    return request(`/clients/${clientId}/contacts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(
    clientId: string,
    contactId: string,
    data: ContactUpdate
  ): Promise<Contact> {
    return request(`/clients/${clientId}/contacts/${contactId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(clientId: string, contactId: string): Promise<void> {
    return request(`/clients/${clientId}/contacts/${contactId}`, {
      method: "DELETE",
    });
  },
};

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export const contracts = {
  list(clientId: string): Promise<Contract[]> {
    return request(`/clients/${clientId}/contracts`);
  },

  get(clientId: string, contractId: string): Promise<Contract> {
    return request(`/clients/${clientId}/contracts/${contractId}`);
  },

  create(clientId: string, data: ContractCreate): Promise<Contract> {
    return request(`/clients/${clientId}/contracts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(
    clientId: string,
    contractId: string,
    data: Partial<ContractCreate>
  ): Promise<Contract> {
    return request(`/clients/${clientId}/contracts/${contractId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(clientId: string, contractId: string): Promise<void> {
    return request(`/clients/${clientId}/contracts/${contractId}`, {
      method: "DELETE",
    });
  },
};

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export const opportunities = {
  list(clientId: string): Promise<Opportunity[]> {
    return request(`/clients/${clientId}/opportunities`);
  },

  get(clientId: string, opportunityId: string): Promise<Opportunity> {
    return request(`/clients/${clientId}/opportunities/${opportunityId}`);
  },

  create(
    clientId: string,
    data: OpportunityCreate
  ): Promise<Opportunity> {
    return request(`/clients/${clientId}/opportunities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(
    clientId: string,
    opportunityId: string,
    data: Partial<OpportunityCreate>
  ): Promise<Opportunity> {
    return request(`/clients/${clientId}/opportunities/${opportunityId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(clientId: string, opportunityId: string): Promise<void> {
    return request(`/clients/${clientId}/opportunities/${opportunityId}`, {
      method: "DELETE",
    });
  },
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projects = {
  list(params?: {
    client_id?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Project>> {
    const qs = new URLSearchParams();
    if (params?.client_id) qs.set("client_id", params.client_id);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return request(`/projects${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<Project> {
    return request(`/projects/${id}`);
  },

  create(data: ProjectCreate): Promise<Project> {
    return request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<ProjectCreate>): Promise<Project> {
    return request(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`/projects/${id}`, { method: "DELETE" });
  },

  // Deliverables
  listDeliverables(projectId: string): Promise<ProjectDeliverable[]> {
    return request(`/projects/${projectId}/deliverables`);
  },

  createDeliverable(
    projectId: string,
    data: Partial<ProjectDeliverable>
  ): Promise<ProjectDeliverable> {
    return request(`/projects/${projectId}/deliverables`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Milestones
  listMilestones(projectId: string): Promise<ProjectMilestone[]> {
    return request(`/projects/${projectId}/milestones`);
  },

  createMilestone(
    projectId: string,
    data: Partial<ProjectMilestone>
  ): Promise<ProjectMilestone> {
    return request(`/projects/${projectId}/milestones`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Team
  listTeam(projectId: string): Promise<ProjectTeam[]> {
    return request(`/projects/${projectId}/team`);
  },

  addTeamMember(
    projectId: string,
    data: Partial<ProjectTeam>
  ): Promise<ProjectTeam> {
    return request(`/projects/${projectId}/team`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ---------------------------------------------------------------------------
// Brand Profile
// ---------------------------------------------------------------------------

export const brand = {
  get(clientId: string): Promise<BrandProfile> {
    return request(`/clients/${clientId}/brand-profile`);
  },

  createOrUpdate(
    clientId: string,
    data: BrandProfileUpdate
  ): Promise<BrandProfile> {
    return request(`/clients/${clientId}/brand-profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ---------------------------------------------------------------------------
// Taste Examples
// ---------------------------------------------------------------------------

export const taste = {
  list(clientId: string, category?: string): Promise<TasteExample[]> {
    const qs = category ? `?category=${category}` : "";
    return request(`/clients/${clientId}/taste-examples${qs}`);
  },

  create(
    clientId: string,
    data: TasteExampleCreate
  ): Promise<TasteExample> {
    return request(`/clients/${clientId}/taste-examples`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  delete(clientId: string, exampleId: string): Promise<void> {
    return request(`/clients/${clientId}/taste-examples/${exampleId}`, {
      method: "DELETE",
    });
  },
};

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const feedback = {
  list(params?: {
    client_id?: string;
    status?: string;
    sentiment?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<FeedbackEvent>> {
    const qs = new URLSearchParams();
    if (params?.client_id) qs.set("client_id", params.client_id);
    if (params?.status) qs.set("status", params.status);
    if (params?.sentiment) qs.set("sentiment", params.sentiment);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return request(`/feedback${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<FeedbackEvent> {
    return request(`/feedback/${id}`);
  },

  create(data: FeedbackCreate): Promise<FeedbackEvent> {
    return request("/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  analyze(id: string): Promise<FeedbackAnalysis> {
    return request(`/feedback/${id}/analyze`, { method: "POST" });
  },

  updateStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<FeedbackEvent> {
    return request(`/feedback/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, processing_notes: notes }),
    });
  },
};

// ---------------------------------------------------------------------------
// Client Rules
// ---------------------------------------------------------------------------

export const rules = {
  list(params?: {
    client_id?: string;
    status?: string;
    rule_type?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ClientRule>> {
    const qs = new URLSearchParams();
    if (params?.client_id) qs.set("client_id", params.client_id);
    if (params?.status) qs.set("status", params.status);
    if (params?.rule_type) qs.set("rule_type", params.rule_type);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return request(`/rules${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<ClientRule> {
    return request(`/rules/${id}`);
  },

  create(data: ClientRuleCreate): Promise<ClientRule> {
    return request("/rules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<ClientRuleCreate>): Promise<ClientRule> {
    return request(`/rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deprecate(id: string, reason: string): Promise<ClientRule> {
    return request(`/rules/${id}/deprecate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  delete(id: string): Promise<void> {
    return request(`/rules/${id}`, { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

export const patterns = {
  list(params?: {
    scope?: string;
    category?: string;
    client_id?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Pattern>> {
    const qs = new URLSearchParams();
    if (params?.scope) qs.set("scope", params.scope);
    if (params?.category) qs.set("category", params.category);
    if (params?.client_id) qs.set("client_id", params.client_id);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return request(`/patterns${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<Pattern> {
    return request(`/patterns/${id}`);
  },

  create(data: PatternCreate): Promise<Pattern> {
    return request("/patterns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<PatternCreate>): Promise<Pattern> {
    return request(`/patterns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`/patterns/${id}`, { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Knowledge Base (search / retrieval)
// ---------------------------------------------------------------------------

export const kb = {
  search(params: {
    query: string;
    client_id?: string;
    limit?: number;
  }): Promise<{
    results: Array<{
      type: string;
      id: string;
      title: string;
      snippet: string;
      score: number;
    }>;
  }> {
    const qs = new URLSearchParams();
    qs.set("query", params.query);
    if (params.client_id) qs.set("client_id", params.client_id);
    if (params.limit) qs.set("limit", String(params.limit));
    return request(`/kb/search?${qs.toString()}`);
  },

  context(clientId: string): Promise<{
    brand_profile: BrandProfile | null;
    rules: ClientRule[];
    patterns: Pattern[];
    recent_feedback: FeedbackEvent[];
  }> {
    return request(`/kb/context/${clientId}`);
  },
};
