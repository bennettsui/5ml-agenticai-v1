import { API_BASE, Event, RSVPRequest, RSVPResponse, WishlistItem } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

// Public Events
export const publicApi = {
  getEvents: (params?: { search?: string; category?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ events: Event[]; total: number; page: number; pages: number }>(
      `/public/events?${query.toString()}`
    );
  },

  getCategories: () =>
    request<{ categories: { name: string; count: number }[] }>('/public/categories'),

  getEvent: (slug: string) =>
    request<{ event: Event }>(`/public/events/${slug}`),

  getFormFields: (slug: string) =>
    request<{ fields: import('./types').FormField[] }>(`/public/events/${slug}/form-fields`),

  rsvp: (slug: string, data: RSVPRequest) =>
    request<RSVPResponse>(`/public/events/${slug}/rsvp`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getQrUrl: (code: string) =>
    `${API_BASE}/public/qr/${code}`,
};

// Wishlist
export const wishlistApi = {
  getItems: (params?: { status?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    return request<{ items: WishlistItem[] }>(`/wishlist?${query.toString()}`);
  },

  submit: (data: {
    author_name: string;
    author_email?: string;
    title: string;
    description: string;
    category: string;
  }) =>
    request<{ item: WishlistItem }>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ ...data, author_type: 'participant' }),
    }),

  vote: (id: number) =>
    request<{ votes: number }>(`/wishlist/${id}/vote`, { method: 'POST' }),
};

// Participant Profile
export const participantApi = {
  getProfile: (sid: string) =>
    request<{ profile: import('./types').ParticipantProfile }>(`/participant/profile?sid=${sid}`),

  updateProfile: (sid: string, key: string, value: unknown) =>
    request('/participant/profile', {
      method: 'POST',
      body: JSON.stringify({ sid, key, value }),
    }),
};
