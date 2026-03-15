export const API_BASE = 'https://5ml-agenticai-v1.fly.dev/api/eventflow';

export interface Organizer {
  id: number;
  name: string;
  email: string;
  plan: 'free' | 'starter' | 'pro' | 'explab_staff';
  stripe_account_id: string | null;
  settings: { logo_url?: string; brand_color?: string };
  created_at: string;
}

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
  status: 'draft' | 'published' | 'ended' | 'cancelled';
  is_public: boolean;
  category: string;
  capacity: number | null;
  checkin_pin: string;
  settings: Record<string, unknown>;
  tiers: TicketTier[];
  stats?: EventStats;
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

export interface EventStats {
  total: number;
  checked_in: number;
  by_tier: { name: string; color: string; total: number; checked_in: number }[];
  recent_checkins: RecentCheckin[];
}

export interface RecentCheckin {
  first_name: string;
  last_name: string;
  organization: string | null;
  checked_in_at: string;
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
  metadata: Record<string, unknown>;
  checked_in_at: string | null;
  tier_name?: string;
  tier_color?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  organization: string | null;
  title: string | null;
  metadata: Record<string, unknown>;
  source_event_id: number | null;
  created_at: string;
  last_seen_at: string;
  event_count?: number;
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

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at: string;
  timezone?: string;
  category?: string;
  capacity?: number;
  is_public?: boolean;
  status?: 'draft' | 'published';
}

export interface CheckinEvent {
  id: number;
  title: string;
  location: string;
  start_at: string;
  timezone: string;
  stats: EventStats;
  tiers: TicketTier[];
}

export interface CheckinAttendee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  organization: string | null;
  status: 'registered' | 'checked_in' | 'cancelled';
  tier_name: string;
  tier_color: string;
  checked_in_at: string | null;
}
