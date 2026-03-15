export const API_BASE = 'https://5ml-agenticai-v1.fly.dev/api/eventflow';

export interface Event {
  id: number;
  slug: string;
  title: string;
  description: string;
  banner_url: string | null;
  location: string;
  location_detail: { latitude?: number; longitude?: number } | null;
  start_at: string;
  end_at: string;
  timezone: string;
  organizer_id: number;
  organizer_name?: string;
  status: 'draft' | 'published' | 'ended' | 'cancelled';
  is_public: boolean;
  category: string;
  capacity: number | null;
  settings: Record<string, unknown>;
  tiers: TicketTier[];
  stats?: EventStats;
  form_fields?: FormField[];
}

export interface TicketTier {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  capacity: number | null;
  sold: number;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface FormField {
  id: number;
  event_id: number;
  field_key: string;
  field_type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  sort_order: number;
}

export interface EventStats {
  total: number;
  checked_in: number;
  by_tier: { name: string; color: string; total: number; checked_in: number }[];
  recent_checkins: { first_name: string; last_name: string; organization: string | null; checked_in_at: string }[];
}

export interface Attendee {
  id: number;
  event_id: number;
  tier_id: number;
  contact_id: number;
  registration_code: string;
  status: 'registered' | 'checked_in' | 'cancelled';
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  title: string | null;
  remarks: string | null;
  notify_whatsapp: boolean;
  notify_line: boolean;
  line_user_id: string | null;
  metadata: Record<string, unknown>;
  checked_in_at: string | null;
  tier_name?: string;
  tier_color?: string;
  created_at: string;
}

export interface RSVPRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  title?: string;
  tier_id: number;
  notify_whatsapp?: boolean;
  notify_line?: boolean;
  line_user_id?: string;
  custom_responses?: Record<string, unknown>;
}

export interface RSVPResponse {
  attendee: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    registration_code: string;
    tier: { name: string; price: number; currency: string };
    event_title: string;
    event_start: string;
    event_location: string;
    event_slug: string;
  };
}

export interface WishlistItem {
  id: number;
  author_type: 'organizer' | 'participant';
  author_name: string;
  author_email: string | null;
  title: string;
  description: string;
  category: 'feature' | 'ux' | 'integration' | 'ai' | 'general';
  votes: number;
  status: 'open' | 'planned' | 'done' | 'declined';
  created_at: string;
}

export interface SavedTicket {
  registration_code: string;
  first_name: string;
  last_name: string;
  email: string;
  tier_name: string;
  tier_color: string;
  event_title: string;
  event_start: string;
  event_location: string;
  event_slug: string;
  saved_at: string;
}

export interface ParticipantProfile {
  role: string;
  interests: string[];
  location: string;
  how_heard: string;
  dismissed: string[];
}
