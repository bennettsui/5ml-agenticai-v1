import * as SecureStore from 'expo-secure-store';
import {
  API_BASE,
  Organizer,
  Event,
  Attendee,
  Contact,
  FormField,
  TicketTier,
  CreateEventInput,
  CheckinEvent,
  CheckinAttendee,
  EventStats,
} from './types';

const TOKEN_KEY = 'ef_organizer_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; organizer: Organizer }>('/organizer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name: string, email: string, password: string) =>
    request<{ token: string; organizer: Organizer }>('/organizer/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => request<{ organizer: Organizer }>('/organizer/me'),

  updateMe: (data: Partial<{ name: string; settings: Record<string, unknown> }>) =>
    request<{ organizer: Organizer }>('/organizer/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Events
export const eventsApi = {
  list: () =>
    request<{ events: Event[] }>('/events'),

  get: (id: number) =>
    request<{ event: Event }>(`/events/${id}`),

  create: (data: CreateEventInput) =>
    request<{ event: Event }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateEventInput>) =>
    request<{ event: Event }>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/events/${id}`, { method: 'DELETE' }),

  publish: (id: number) =>
    request<{ event: Event }>(`/events/${id}/publish`, { method: 'POST' }),

  getStats: (id: number) =>
    request<{ stats: EventStats }>(`/events/${id}/stats`),
};

// Tiers
export const tiersApi = {
  create: (eventId: number, data: Partial<TicketTier>) =>
    request<{ tier: TicketTier }>(`/events/${eventId}/tiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (eventId: number, tierId: number, data: Partial<TicketTier>) =>
    request<{ tier: TicketTier }>(`/events/${eventId}/tiers/${tierId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (eventId: number, tierId: number) =>
    request<{ success: boolean }>(`/events/${eventId}/tiers/${tierId}`, { method: 'DELETE' }),
};

// Attendees
export const attendeesApi = {
  list: (
    eventId: number,
    params?: { status?: string; tier_id?: number; search?: string; page?: number; limit?: number }
  ) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.tier_id) query.set('tier_id', String(params.tier_id));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ attendees: Attendee[]; total: number; page: number; pages: number }>(
      `/events/${eventId}/attendees?${query.toString()}`
    );
  },

  checkin: (eventId: number, attendeeId: number) =>
    request<{ attendee: Attendee }>(`/events/${eventId}/attendees/${attendeeId}/checkin`, {
      method: 'POST',
    }),
};

// Contacts
export const contactsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ contacts: Contact[]; total: number; page: number; pages: number }>(
      `/organizer/contacts?${query.toString()}`
    );
  },
};

// Form Fields
export const formFieldsApi = {
  list: (eventId: number) =>
    request<{ fields: FormField[] }>(`/events/${eventId}/form-fields`),

  create: (eventId: number, data: Partial<FormField>) =>
    request<{ field: FormField }>(`/events/${eventId}/form-fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (eventId: number, fieldId: number, data: Partial<FormField>) =>
    request<{ field: FormField }>(`/events/${eventId}/form-fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (eventId: number, fieldId: number) =>
    request<{ success: boolean }>(`/events/${eventId}/form-fields/${fieldId}`, {
      method: 'DELETE',
    }),
};

// AI Studio
export const aiApi = {
  describe: (eventId: number) =>
    request<{ description: string }>('/ai/describe', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    }),

  social: (eventId: number, platform: 'instagram' | 'linkedin' | 'twitter') =>
    request<{ post: string }>('/ai/social', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, platform }),
    }),

  agenda: (eventId: number) =>
    request<{ agenda: string }>('/ai/agenda', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    }),

  email: (eventId: number) =>
    request<{ email: string }>('/ai/email', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    }),

  bannerPrompt: (eventId: number) =>
    request<{ prompt: string }>('/ai/banner-prompt', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    }),
};

// Notifications
export const notificationsApi = {
  getLog: (eventId: number) =>
    request<{ log: unknown[] }>(`/notifications/log/${eventId}`),

  blast: (eventId: number, subject: string, message: string, filterStatus?: string) =>
    request('/notifications/blast/' + eventId, {
      method: 'POST',
      body: JSON.stringify({ subject, message, filter_status: filterStatus }),
    }),
};

// Check-in (Reception)
export const checkinApi = {
  auth: (eventId: number, pin: string) =>
    request<{ event: CheckinEvent }>('/checkin/auth', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, pin }),
    }),

  scan: (code: string) =>
    request<{ attendee: CheckinAttendee }>(`/checkin/scan/${code}`, { method: 'POST' }),

  checkin: (attendeeId: number) =>
    request<{ attendee: CheckinAttendee }>(`/checkin/checkin/${attendeeId}`, { method: 'POST' }),

  search: (eventId: number, query: string) =>
    request<{ attendees: CheckinAttendee[] }>(
      `/checkin/events/${eventId}/search?q=${encodeURIComponent(query)}`
    ),

  getStats: (eventId: number) =>
    request<{ stats: EventStats }>(`/checkin/events/${eventId}/stats`),
};
