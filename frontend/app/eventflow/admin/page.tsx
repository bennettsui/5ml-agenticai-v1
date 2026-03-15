'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  organizers: number; events: number; attendees: number;
  checkins: number; contacts: number;
}
interface ByStatus { status: string; count: number; }
interface RecentEvent { title: string; start_at: string; status: string; organizer_name: string; registered: number; }
interface Organizer {
  id: number; name: string; email: string; plan: string;
  event_count: number; attendee_count: number; created_at: string;
}
interface Event {
  id: number; slug: string; title: string; status: string; is_public: boolean; category: string | null;
  start_at: string; organizer_name: string; organizer_email: string; registered: number; checked_in: number;
}
interface NotifSummary { type: string; channel: string; status: string; count: number; }
interface WishlistItem {
  id: number; title: string; description: string | null;
  category: string; status: string; votes: number;
  author_name: string | null; author_type: string; created_at: string;
}
interface SponsorProfile {
  id: number; company: string; contact_name: string | null; contact_email: string; contact_phone: string | null;
  industries: string[] | null; event_types: string[] | null; budget_range: string | null;
  description: string | null; website: string | null; status: string; created_at: string;
}
interface SeekingEvent {
  id: number; event_id: number; title: string; slug: string; start_at: string;
  organizer_name: string; organizer_email: string; brief: string | null;
  package_types: string[] | null; budget_range: string | null;
}
interface SponsorMatch {
  id: number; event_id: number; sponsor_id: number; notes: string | null; status: string; created_at: string;
  event_title: string; slug: string; company: string; contact_email: string;
}
interface KolProfile {
  id: number; name: string; handle: string | null; platforms: string[] | null;
  follower_counts: Record<string, number>; categories: string[] | null; bio: string | null;
  contact_email: string; rate_range: string | null; status: string; created_at: string;
}
interface KolBrief {
  id: number; event_id: number; organizer_id: number; budget_range: string | null;
  deliverables: string[] | null; deadline: string | null; categories: string[] | null;
  notes: string | null; status: string; created_at: string; event_title: string; organizer_name: string;
}
interface Ambassador {
  id: number; name: string; email: string; social_handle: string | null;
  platform: string | null; follower_count: number | null; bio: string | null;
  categories: string[] | null; status: string; created_at: string;
}
interface AgencyInquiry {
  id: number; service_slug: string; contact_name: string; email: string; phone: string | null;
  company: string | null; event_date: string | null; budget_range: string | null;
  notes: string | null; status: string; created_at: string;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:         { label: 'Free',          color: 'text-slate-400 bg-slate-700' },
  pro:          { label: 'Pro',           color: 'text-blue-400 bg-blue-500/15' },
  explab_staff: { label: 'ExpLab Staff',  color: 'text-amber-400 bg-amber-500/15' },
};

const STATUS_COLORS: Record<string, string> = {
  published: 'text-green-400 bg-green-500/15',
  draft:     'text-slate-400 bg-slate-700',
  ended:     'text-slate-500 bg-slate-800',
  cancelled: 'text-red-400 bg-red-500/15',
};

const WISHLIST_STATUS_COLORS: Record<string, string> = {
  open:     'text-blue-400 bg-blue-500/15',
  planned:  'text-amber-400 bg-amber-500/15',
  done:     'text-green-400 bg-green-500/15',
  declined: 'text-slate-500 bg-slate-700',
};

type Tab = 'overview' | 'organizers' | 'events' | 'notifications' | 'wishlist' | 'sponsors' | 'kol' | 'ambassadors' | 'inquiries' | 'flows' | 'status';

// ─── Flows data (inline for admin panel) ──────────────────────────────────────

interface FlowStep { icon: string; label: string; sub?: string; highlight?: boolean; }
interface Flow { id: string; title: string; role: string; accent: string; icon: string; steps: FlowStep[]; link?: { href: string; label: string }; }

const FLOWS: Flow[] = [
  { id: 'organizer', title: 'Organizer Flow', role: 'Event Creator', accent: '#f59e0b', icon: '🏢',
    link: { href: '/eventflow/organizer', label: 'Open Dashboard' },
    steps: [
      { icon: '✍️', label: 'Sign Up', sub: 'Create organizer account' },
      { icon: '📅', label: 'Create Event', sub: 'Title, date, location, banner', highlight: true },
      { icon: '🎟️', label: 'Set Tiers', sub: 'Pricing, capacity, colors' },
      { icon: '🔑', label: 'Set Check-in PIN', sub: 'For kiosk & reception staff' },
      { icon: '🚀', label: 'Publish', sub: 'Event goes live on /eventflow' },
      { icon: '📊', label: 'Monitor', sub: 'Real-time registrations & check-ins', highlight: true },
      { icon: '👥', label: 'CRM', sub: 'Contact list grows with each RSVP' },
      { icon: '📩', label: 'Notifications', sub: '7d, 1d reminders + thank you auto-sent' },
    ] },
  { id: 'participant', title: 'Participant Flow', role: 'Event Attendee', accent: '#3b82f6', icon: '👤',
    steps: [
      { icon: '🌐', label: 'Browse Events', sub: 'Public listing at /eventflow' },
      { icon: '🎫', label: 'Select Event', sub: 'View details, tiers, date, location' },
      { icon: '📋', label: 'Register', sub: 'Name, email, organization (one form)', highlight: true },
      { icon: '✅', label: 'Confirmation', sub: 'QR code emailed + shown on screen' },
      { icon: '📧', label: '7-Day Reminder', sub: 'Email sent automatically' },
      { icon: '🔔', label: '1-Day Reminder', sub: 'Email + WhatsApp/LINE if opted in' },
      { icon: '🚪', label: 'Doors Open Alert', sub: 'Day-of notification' },
      { icon: '🙏', label: 'Post-Event Thanks', sub: 'Thank you email day after', highlight: true },
    ] },
  { id: 'checkin', title: 'Kiosk Check-in Flow', role: 'Self-service Kiosk', accent: '#22c55e', icon: '🖥️',
    link: { href: '/eventflow/checkin', label: 'Open Kiosk' },
    steps: [
      { icon: '🔐', label: 'Enter PIN', sub: 'Staff unlocks kiosk with event PIN' },
      { icon: '📷', label: 'QR Scan', sub: 'Attendee scans their QR code' },
      { icon: '👁️', label: 'Preview Card', sub: 'Name, tier, status shown' },
      { icon: '✅', label: 'Confirm Check-in', sub: 'One tap to mark arrived', highlight: true },
      { icon: '🎉', label: 'Success Screen', sub: 'Welcome message displayed' },
      { icon: '📊', label: 'Live Counter', sub: 'Real-time count updates', highlight: true },
    ] },
  { id: 'reception', title: 'Reception Staff Flow', role: 'RD / Front Desk', accent: '#a855f7', icon: '🎫',
    link: { href: '/eventflow/reception', label: 'Open Reception' },
    steps: [
      { icon: '🔐', label: 'PIN Login', sub: 'Event ID + check-in PIN' },
      { icon: '📊', label: 'Live Dashboard', sub: 'Real-time check-in progress bar' },
      { icon: '🔍', label: 'Name Search', sub: 'Find attendee instantly', highlight: true },
      { icon: '📷', label: 'QR Scan', sub: 'Camera scan from phone/email' },
      { icon: '👁️', label: 'Confirm Card', sub: 'View attendee details + tier' },
      { icon: '✅', label: 'One-tap Check-in', sub: 'Mark arrived with single tap', highlight: true },
      { icon: '🔁', label: 'Next Attendee', sub: 'Instantly ready for next scan' },
    ] },
  { id: 'admin', title: 'Super Admin Flow', role: 'ExpLab Staff', accent: '#f59e0b', icon: '⚡',
    steps: [
      { icon: '🔑', label: 'Admin Secret', sub: 'x-admin-secret header auth' },
      { icon: '📈', label: 'Platform Stats', sub: 'All organizers, events, attendees' },
      { icon: '🏢', label: 'Manage Organizers', sub: 'Set plan: Free / Pro / ExpLab Staff', highlight: true },
      { icon: '📅', label: 'Manage Events', sub: 'Change status, delete events' },
      { icon: '💡', label: 'Wishlist Admin', sub: 'Review & curate community requests', highlight: true },
      { icon: '📩', label: 'Notifications', sub: 'View notification pipeline status' },
    ] },
  { id: 'ai-studio', title: 'AI Studio Flow', role: 'Organizer — AI Tools', accent: '#a855f7', icon: '🤖',
    steps: [
      { icon: '📅', label: 'Select Event', sub: 'Open event management → AI Studio tab' },
      { icon: '✍️', label: 'Event Description', sub: 'AI generates SEO-friendly copy', highlight: true },
      { icon: '📣', label: 'Social Posts', sub: 'LinkedIn, Twitter, Facebook captions' },
      { icon: '📧', label: 'Email Draft', sub: 'Announcement email for attendees', highlight: true },
      { icon: '📋', label: 'Agenda Builder', sub: 'Structured schedule from your notes' },
      { icon: '🎨', label: 'Banner Prompt', sub: 'Midjourney / DALL-E prompt for art' },
    ] },
  { id: 'wishlist', title: 'Wishlist Board Flow', role: 'Community Members', accent: '#22c55e', icon: '💡',
    link: { href: '/eventflow/wishlist', label: 'Open Wishlist' },
    steps: [
      { icon: '🌐', label: 'Browse Wishlist', sub: 'Public board at /eventflow/wishlist' },
      { icon: '➕', label: 'Submit Idea', sub: 'Suggest a feature or integration', highlight: true },
      { icon: '👍', label: 'Vote on Ideas', sub: 'Upvote community suggestions' },
      { icon: '🏷️', label: 'Filter by Category', sub: 'Feature, UX, AI, Integration…' },
      { icon: '📊', label: 'Admin Review', sub: 'Admin curates top-voted ideas', highlight: true },
      { icon: '🎉', label: 'Ships to Roadmap', sub: 'Planned → Done lifecycle' },
    ] },
  { id: 'rsvp-form', title: 'Custom RSVP Form Flow', role: 'Organizer — Form Builder', accent: '#f59e0b', icon: '📋',
    steps: [
      { icon: '📅', label: 'Event Settings', sub: 'Open event → RSVP Form tab' },
      { icon: '🔒', label: 'Core Fields', sub: 'First/Last name, Email always required' },
      { icon: '📝', label: 'Toggle Optional', sub: 'Make phone, org, title required or not' },
      { icon: '➕', label: 'Add Custom Fields', sub: 'Text, select, date, checkbox, etc.', highlight: true },
      { icon: '💾', label: 'Save & Preview', sub: 'Changes live immediately on event page' },
      { icon: '👤', label: 'Participant Fills', sub: 'Custom fields shown in RSVP form', highlight: true },
      { icon: '🗃️', label: 'Responses Stored', sub: 'In attendee metadata, exportable' },
    ] },
];

// ─── Platform Status Data ────────────────────────────────────────────────────

type DevStatus = 'live' | 'in-dev' | 'scaffold' | 'planned';

interface PlatformFeature {
  id: string;
  name: string;
  category: string;
  status: DevStatus;
  description: string;
  files: string[];
  dbTables: string[];
  apiEndpoints: string[];
  notes: string;
  devPrompt: string;
}

const STATUS_BADGE: Record<DevStatus, { label: string; cls: string }> = {
  live:     { label: '✅ Live',     cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  'in-dev': { label: '🔧 In Dev',  cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  scaffold: { label: '🪜 Scaffold', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  planned:  { label: '📋 Planned',  cls: 'bg-slate-700 text-slate-400 border border-white/[0.06]' },
};

const PLATFORM: PlatformFeature[] = [
  // ── Infrastructure ──────────────────────────────────────────────────────────
  {
    id: 'db', name: 'PostgreSQL Database', category: 'Infrastructure',
    status: 'live',
    description: 'Fly.io managed Postgres. All tables prefixed ef_. Migrations run on startup via db.init(). pgvector extension available.',
    files: ['use-cases/eventflow/api/db.js', 'db.js (root pool)'],
    dbTables: ['ef_organizers','ef_events','ef_ticket_tiers','ef_attendees','ef_contacts','ef_notification_schedule','ef_wishlist','+ all P2–P6 tables'],
    apiEndpoints: [],
    notes: 'Root pool (db.js) used for admin queries. Feature pool (api/db.js) handles migrations and per-feature queries.',
    devPrompt: 'Add a new table ef_example with columns (id SERIAL PRIMARY KEY, event_id INT REFERENCES ef_events(id), created_at TIMESTAMPTZ DEFAULT NOW()). Add migration in db.init() using IF NOT EXISTS pattern. Export CRUD helpers from api/db.js.',
  },
  {
    id: 'auth', name: 'Auth System', category: 'Infrastructure',
    status: 'live',
    description: 'Two auth layers: Organizer JWT (Bearer token via x-organizer-token header) and Admin secret (x-admin-secret header or ?_secret query param).',
    files: ['use-cases/eventflow/api/auth.js', 'use-cases/eventflow/api/routes/admin.js'],
    dbTables: ['ef_organizers (email + password_hash + token)'],
    apiEndpoints: ['POST /api/eventflow/organizer/login', 'POST /api/eventflow/organizer/register'],
    notes: 'requireAuth middleware attaches req.organizer. requireAdmin in admin.js checks EVENTFLOW_ADMIN_SECRET env var (default: 5milesLab01).',
    devPrompt: 'To add a new protected organizer route: import { requireAuth } from "../auth"; then router.get("/my-route", requireAuth, async (req, res) => { /* req.organizer.id available */ }). For admin routes add to routes/admin.js after router.use(requireAdmin).',
  },
  {
    id: 'notifications', name: 'Notification Engine', category: 'Infrastructure',
    status: 'live',
    description: 'Background cron engine that processes ef_notification_schedule. Sends email via SMTP (Nodemailer). WhatsApp and LINE channels are scaffolded but not wired to real APIs.',
    files: ['use-cases/eventflow/api/notifications/engine.js', 'use-cases/eventflow/api/notifications/email.js', 'use-cases/eventflow/api/routes/notifications.js'],
    dbTables: ['ef_notification_schedule'],
    apiEndpoints: ['GET /api/eventflow/notifications/status', 'POST /api/eventflow/notifications/trigger (admin)'],
    notes: 'Engine runs engine.start() at route load. Processes pending notifications every 60s. Types: registration_confirm, reminder_7d, reminder_1d, doors_open, post_event_thanks.',
    devPrompt: 'To add a new notification type: 1) Add type to engine.js HANDLERS map. 2) Insert rows into ef_notification_schedule with type=\'your_type\', scheduled_at=target time. 3) Implement handler function that calls email.send() or mock WhatsApp. 4) Test with POST /api/eventflow/notifications/trigger?event_id=X.',
  },
  // ── Core Event Management ───────────────────────────────────────────────────
  {
    id: 'events', name: 'Event CRUD', category: 'Core',
    status: 'live',
    description: 'Full event lifecycle: create, read, update, delete, publish/unpublish. Slug auto-generated. Supports banner image, location, capacity, check-in PIN, category tags.',
    files: ['use-cases/eventflow/api/routes/events.js', 'use-cases/eventflow/api/routes/organizer.js', 'frontend/app/eventflow/organizer/page.tsx'],
    dbTables: ['ef_events', 'ef_ticket_tiers'],
    apiEndpoints: ['GET /api/eventflow/events/:slug', 'POST /api/eventflow/organizer/events', 'PATCH /api/eventflow/organizer/events/:id', 'DELETE /api/eventflow/organizer/events/:id', 'GET /api/eventflow/admin/events'],
    notes: 'Events must be published (status=published, is_public=true) to appear in public listing. Check-in PIN is stored plaintext (acceptable for low-security venue use).',
    devPrompt: 'To add a field to events: 1) ALTER TABLE ef_events ADD COLUMN new_field TEXT in db.init(). 2) Add to SELECT in relevant queries. 3) Add to PATCH handler body parse. 4) Add input to organizer/page.tsx event form.',
  },
  {
    id: 'tiers', name: 'Ticket Tiers', category: 'Core',
    status: 'in-dev',
    description: 'Pricing tiers per event (Free/Paid/VIP/Early Bird etc.). Basic tier: name, price, capacity, color. Extended fields added: tier_type, sale_starts_at, sale_ends_at, benefits, visibility, max_per_order — DB migrated but UI not yet built.',
    files: ['use-cases/eventflow/api/routes/organizer.js', 'use-cases/eventflow/api/db.js', 'frontend/app/eventflow/organizer/page.tsx'],
    dbTables: ['ef_ticket_tiers'],
    apiEndpoints: ['GET /api/eventflow/organizer/events/:id/tiers', 'POST /api/eventflow/organizer/events/:id/tiers', 'PATCH /api/eventflow/organizer/events/:id/tiers/:tierId', 'DELETE /api/eventflow/organizer/events/:id/tiers/:tierId'],
    notes: 'Extended columns added via IF NOT EXISTS: tier_type VARCHAR(20), sale_starts_at TIMESTAMPTZ, sale_ends_at TIMESTAMPTZ, benefits TEXT[], visibility VARCHAR(20) DEFAULT public, max_per_order INT.',
    devPrompt: 'Extend the tier builder UI in organizer/page.tsx TierForm component to add: 1) tier_type selector (general/vip/early_bird/group/staff). 2) sale_starts_at + sale_ends_at date-time pickers. 3) benefits: array of text inputs with add/remove. 4) visibility toggle (public/hidden/invite_only). 5) max_per_order number input. All fields already exist in DB.',
  },
  {
    id: 'checkin', name: 'QR Check-in Kiosk', category: 'Core',
    status: 'live',
    description: 'Self-service kiosk at /eventflow/checkin. Staff enters PIN, attendees scan QR from email. Shows name/tier/status. One-tap check-in. Live counter.',
    files: ['frontend/app/eventflow/checkin/page.tsx', 'use-cases/eventflow/api/routes/checkin.js'],
    dbTables: ['ef_attendees (status: checked_in)', 'ef_events (checkin_pin)'],
    apiEndpoints: ['POST /api/eventflow/checkin/verify-pin', 'POST /api/eventflow/checkin/scan', 'GET /api/eventflow/checkin/stats/:eventId'],
    notes: 'QR code = attendee UUID. Scan endpoint validates UUID, checks event PIN, updates attendee status to checked_in and sets checked_in_at timestamp.',
    devPrompt: 'To add badge printing on check-in: 1) Add POST /api/eventflow/checkin/print-badge endpoint that returns attendee name+tier as PDF/label data. 2) In checkin/page.tsx success screen, call print endpoint and trigger window.print() or thermal printer API. Consider adding a badge_template field to ef_events.',
  },
  {
    id: 'reception', name: 'Reception Staff View', category: 'Core',
    status: 'live',
    description: 'Mobile-optimized reception panel at /eventflow/reception. PIN login, real-time check-in progress bar, name search, QR scan, attendee card with tier info.',
    files: ['frontend/app/eventflow/reception/page.tsx'],
    dbTables: ['ef_attendees', 'ef_events', 'ef_ticket_tiers'],
    apiEndpoints: ['POST /api/eventflow/checkin/verify-pin', 'GET /api/eventflow/checkin/attendees/:eventId', 'POST /api/eventflow/checkin/scan'],
    notes: 'No separate backend — reuses checkin routes. Differs from kiosk in UX: search-first vs scan-first, staff-operated vs self-service.',
    devPrompt: 'To add bulk check-in (mark all in a tier as checked in): 1) Add POST /api/eventflow/checkin/bulk endpoint accepting event_id + tier_id. 2) UPDATE ef_attendees SET status=checked_in WHERE event_id=$1 AND tier_id=$2 AND status=registered. 3) Add "Mark Tier as Present" button in reception panel.',
  },
  {
    id: 'participant', name: 'Participant Registration', category: 'Core',
    status: 'live',
    description: 'Public RSVP form at /eventflow/[slug]. Supports tier selection, custom form fields, QR code generation on success. Email confirmation triggered automatically.',
    files: ['frontend/app/eventflow/[slug]/page.tsx', 'use-cases/eventflow/api/routes/public.js', 'use-cases/eventflow/api/routes/participant.js'],
    dbTables: ['ef_attendees', 'ef_contacts'],
    apiEndpoints: ['GET /api/eventflow/public/event/:slug', 'POST /api/eventflow/participant/register', 'GET /api/eventflow/participant/ticket/:uuid'],
    notes: 'Custom RSVP form fields stored as JSONB in ef_attendees.custom_fields. Promo/referral code field not yet added to form UI (discount codes table exists but validation not wired into registration).',
    devPrompt: 'Add promo code field to registration: 1) Add input below tier selector in [slug]/page.tsx. 2) On input blur/submit call POST /api/eventflow/events/:eventId/discounts/validate with {code}. 3) Show discount info if valid. 4) Pass discount_code_id to POST /api/eventflow/participant/register. 5) In register handler, apply discount and increment code uses.',
  },
  {
    id: 'crm', name: 'CRM / Contact List', category: 'Core',
    status: 'live',
    description: 'Every registration auto-upserts into ef_contacts (per organizer). Organizer can view and export contact list. Tracks event history per contact.',
    files: ['use-cases/eventflow/api/routes/organizer.js', 'frontend/app/eventflow/organizer/page.tsx (Contacts tab)'],
    dbTables: ['ef_contacts'],
    apiEndpoints: ['GET /api/eventflow/organizer/contacts', 'GET /api/eventflow/organizer/contacts/:id', 'GET /api/eventflow/organizer/contacts/export'],
    notes: 'Contact is identified by email per organizer. If same person registers for 2 events under same organizer, one contact record with multiple event references.',
    devPrompt: 'Add contact tags/segmentation: 1) ALTER TABLE ef_contacts ADD COLUMN tags TEXT[] DEFAULT \'{}\'. 2) Add PATCH /api/eventflow/organizer/contacts/:id endpoint to update tags. 3) Add tag filter to GET /api/eventflow/organizer/contacts. 4) Add tag chip UI in Contacts tab.',
  },
  {
    id: 'ai-studio', name: 'AI Studio', category: 'Core',
    status: 'live',
    description: 'Organizer AI tools: event description, social post copy (LinkedIn/Twitter/Facebook), email draft, agenda builder, banner art prompt. Uses DeepSeek reasoner via platform AI service.',
    files: ['use-cases/eventflow/api/routes/ai.js', 'frontend/app/eventflow/organizer/page.tsx (AI Studio tab)'],
    dbTables: [],
    apiEndpoints: ['POST /api/eventflow/ai/generate'],
    notes: 'Stateless — no DB storage of generated content. Organizer copies output. Prompt type selected via body.type field. Falls back to Claude Haiku if DeepSeek unavailable.',
    devPrompt: 'Add new AI generation type: 1) In routes/ai.js, add case to PROMPTS map with type key and system+user prompt template. 2) In organizer/page.tsx AI Studio tab, add a button for the new type. 3) Types currently available: description, social_linkedin, social_twitter, social_facebook, email_draft, agenda, banner_prompt.',
  },
  {
    id: 'wishlist', name: 'Community Wishlist', category: 'Core',
    status: 'live',
    description: 'Public feature request board at /eventflow/wishlist. Anyone can submit ideas, vote, filter by category. Admins can update status (open/planned/done/declined).',
    files: ['frontend/app/eventflow/wishlist/page.tsx', 'use-cases/eventflow/api/routes/wishlist.js'],
    dbTables: ['ef_wishlist'],
    apiEndpoints: ['GET /api/eventflow/wishlist', 'POST /api/eventflow/wishlist', 'PATCH /api/eventflow/wishlist/:id/vote', 'PATCH /api/eventflow/wishlist/:id (admin)'],
    notes: 'Voting is session-based (localStorage) with no duplicate vote enforcement on backend. Categories: feature, ux, integration, ai, other.',
    devPrompt: 'Add comment threads to wishlist: 1) CREATE TABLE ef_wishlist_comments (id SERIAL PK, item_id INT REFS ef_wishlist, author_name VARCHAR, content TEXT, created_at TIMESTAMPTZ). 2) Add GET/POST /api/eventflow/wishlist/:id/comments. 3) Add collapsible comment section in wishlist/page.tsx per item card.',
  },
  {
    id: 'rsvp-forms', name: 'Custom RSVP Forms', category: 'Core',
    status: 'live',
    description: 'Organizer can define custom registration form fields per event: toggle optional built-in fields, add custom fields (text/select/date/checkbox/radio). Responses stored as JSONB.',
    files: ['use-cases/eventflow/api/routes/organizer.js', 'frontend/app/eventflow/organizer/page.tsx (RSVP Form tab)', 'frontend/app/eventflow/[slug]/page.tsx'],
    dbTables: ['ef_events (rsvp_fields JSONB)', 'ef_attendees (custom_fields JSONB)'],
    apiEndpoints: ['GET /api/eventflow/organizer/events/:id/rsvp-fields', 'PUT /api/eventflow/organizer/events/:id/rsvp-fields'],
    notes: 'rsvp_fields schema: [{key, label, type, required, options?}]. Core fields (first_name, last_name, email) are always included and cannot be removed.',
    devPrompt: 'Add field ordering (drag-and-drop): 1) Add an order property to each field object in rsvp_fields JSONB. 2) Integrate @dnd-kit/sortable in the RSVP Form tab. 3) On drop, update field.order values and save. 4) In [slug]/page.tsx render fields sorted by order.',
  },
  // ── P2 — Discount Codes ─────────────────────────────────────────────────────
  {
    id: 'discounts', name: 'Discount Codes', category: 'P2 — Discounts',
    status: 'scaffold',
    description: 'Organizer-created promo codes per event. Supports percentage or fixed amount discounts. Max uses, expiry date, active toggle. Referral codes stored here too (source=referral).',
    files: ['use-cases/eventflow/api/routes/discounts.js', 'use-cases/eventflow/api/db.js (discount fns)'],
    dbTables: ['ef_discount_codes'],
    apiEndpoints: ['GET /api/eventflow/events/:eventId/discounts', 'POST /api/eventflow/events/:eventId/discounts', 'PATCH /api/eventflow/events/:eventId/discounts/:id', 'DELETE /api/eventflow/events/:eventId/discounts/:id', 'POST /api/eventflow/events/:eventId/discounts/validate'],
    notes: 'Backend complete. Missing: 1) Discounts tab in organizer event management UI. 2) Promo code input in registration form. 3) Discount application logic in participant/register endpoint.',
    devPrompt: 'Add Discounts tab to organizer event management: 1) Add "Discounts" to the event detail tab list in organizer/page.tsx. 2) Fetch GET /api/eventflow/events/:id/discounts. 3) Render table: code | type | value | uses/max | expires | active | actions. 4) Add "New Code" form: code (text), type (percent/fixed), value (number), max_uses (optional), expires_at (optional). 5) Wire POST to create, PATCH :id to toggle active, DELETE :id to remove.',
  },
  // ── P3 — Referral & Ambassadors ─────────────────────────────────────────────
  {
    id: 'referral', name: 'Referral Program', category: 'P3 — Referral',
    status: 'scaffold',
    description: "Organizer creates a referral program per event with two schemes: scheme A (referrer gets reward when referee registers), scheme B (both get discount). Auto-generates a referral code stored in ef_discount_codes with source='referral'.",
    files: ['use-cases/eventflow/api/routes/referral.js', 'use-cases/eventflow/api/db.js (referral fns)'],
    dbTables: ['ef_referral_programs', 'ef_discount_codes (source=referral)', 'ef_referral_events'],
    apiEndpoints: ['POST /api/eventflow/referral/programs', 'GET /api/eventflow/referral/programs/:eventId', 'POST /api/eventflow/referral/validate-code'],
    notes: 'Backend routes done. Missing: 1) Referral tab in organizer portal. 2) Referral code field in registration form. 3) Payout/reward tracking UI.',
    devPrompt: 'Add Referral tab in organizer event management: 1) Add "Referral" to event detail tabs. 2) GET /api/eventflow/referral/programs/:eventId to check if program exists. 3) If none: show setup form (scheme: A or B, discount_pct, reward_amount, reward_type: credit/cash/gift). 4) POST to create. 5) Show generated referral code + shareable link. 6) Show referral events table (who referred whom, reward status). The validate-code endpoint already handles attribution on registration.',
  },
  {
    id: 'ambassadors', name: 'Ambassador Program', category: 'P3 — Referral',
    status: 'scaffold',
    description: 'Public ambassador registration form. Ambassadors promote events and earn commissions. Admin approves/rejects. Organizers see their ambassador list.',
    files: ['use-cases/eventflow/api/routes/referral.js', 'use-cases/eventflow/api/db.js (ambassador fns)', 'use-cases/eventflow/api/routes/admin.js'],
    dbTables: ['ef_ambassador_profiles'],
    apiEndpoints: ['POST /api/eventflow/referral/ambassador', 'GET /api/eventflow/referral/ambassadors (organizer)', 'GET /api/eventflow/admin/ambassadors', 'PATCH /api/eventflow/admin/ambassadors/:id/status'],
    notes: 'Backend done. Missing: 1) Public /eventflow/ambassadors registration page. 2) Admin UI for ambassador approval. 3) Ambassador code generation (referral code linked to ambassador).',
    devPrompt: 'Create public ambassador registration page at /eventflow/ambassadors: 1) Light-themed marketing page explaining ambassador benefits. 2) Registration form: name, email, social handle, platform (Instagram/TikTok/YouTube/LinkedIn), follower count, bio, categories (tech/lifestyle/business/etc), referral code preference. 3) POST /api/eventflow/referral/ambassador. 4) Thank-you confirmation. Admin panel ambassador tab: list pending profiles with approve/reject buttons calling PATCH /api/eventflow/admin/ambassadors/:id/status.',
  },
  // ── P4 — Agency Services ────────────────────────────────────────────────────
  {
    id: 'services', name: 'Agency Service Catalog', category: 'P4 — Agency',
    status: 'scaffold',
    description: 'Static catalog of 5 agency services: Full-Service Event Management, Event Production, PR & Media, LED Sphere Rental, AI Photo Booth. Public listing + inquiry submission form.',
    files: ['use-cases/eventflow/api/routes/services.js', 'use-cases/eventflow/api/db.js (createAgencyInquiry)'],
    dbTables: ['ef_agency_inquiries'],
    apiEndpoints: ['GET /api/eventflow/services', 'GET /api/eventflow/services/:slug', 'POST /api/eventflow/services/inquire'],
    notes: 'Catalog is static (edit SERVICES array in services.js). Inquiries stored in DB. Backend done. Missing: public frontend page at /eventflow/services.',
    devPrompt: 'Create /eventflow/services page: 1) Light-themed marketing page. 2) Hero section: "Professional Event Production & Agency Services". 3) Service cards grid: name, tagline, price_hkd/price_unit, features list, "Enquire" CTA. 4) Inquiry modal: pre-fill service_slug, collect contact_name, email, phone, company, event_date, budget_range, notes. 5) POST /api/eventflow/services/inquire. 6) Thank-you state. Prices: services.base_price_hkd is in HKD cents (/100 to display).',
  },
  {
    id: 'inquiries', name: 'Agency Inquiry Management', category: 'P4 — Agency',
    status: 'scaffold',
    description: 'Admin panel view of all agency service inquiries. Status workflow: new → contacted → quoted → won/lost.',
    files: ['use-cases/eventflow/api/routes/admin.js', 'use-cases/eventflow/api/db.js'],
    dbTables: ['ef_agency_inquiries'],
    apiEndpoints: ['GET /api/eventflow/admin/inquiries', 'PATCH /api/eventflow/admin/inquiries/:id/status'],
    notes: 'Backend done. Missing: Admin UI tab for inquiries in admin/page.tsx.',
    devPrompt: 'Add Inquiries tab to admin panel: 1) Add "📨 Inquiries" to Tab type and TABS array. 2) loadInquiries() fetches GET /api/eventflow/admin/inquiries. 3) Table: service | company | contact | email | event_date | budget | status | actions. 4) Status select: new/contacted/quoted/won/lost. 5) PATCH :id/status on change. Also add Services/Inquiries summary card to Overview tab.',
  },
  // ── P5 — Sponsor Matching ───────────────────────────────────────────────────
  {
    id: 'sponsors', name: 'Sponsor Matching', category: 'P5 — Sponsors',
    status: 'scaffold',
    description: 'Three-sided marketplace: sponsors register publicly, organizers flag events as seeking sponsors, admin creates matches. Sponsors see open events. No self-serve matching.',
    files: ['use-cases/eventflow/api/routes/sponsors.js', 'use-cases/eventflow/api/routes/admin.js', 'use-cases/eventflow/api/db.js (sponsor fns)'],
    dbTables: ['ef_sponsor_profiles', 'ef_event_sponsor_flags', 'ef_sponsor_matches'],
    apiEndpoints: ['POST /api/eventflow/sponsors/register', 'GET /api/eventflow/sponsors/seeking', 'POST /api/eventflow/sponsors/events/:eventId/flag (organizer)', 'GET /api/eventflow/admin/sponsors', 'POST /api/eventflow/admin/sponsors/match', 'PATCH /api/eventflow/admin/sponsors/matches/:id/status'],
    notes: 'All backend routes done. Missing: 1) /eventflow/sponsors public registration page. 2) Sponsor seeking page. 3) Admin Sponsors tab in admin/page.tsx. 4) Organizer event flag tab.',
    devPrompt: 'Add Sponsors tab to admin panel: 1) Add "🤝 Sponsors" to Tab type and TABS. 2) loadSponsors() fetches GET /api/eventflow/admin/sponsors (returns {sponsors, seeking, matches}). 3) Three sub-sections: Sponsor Profiles (table: company, industries, budget_range, status + approve/reject), Seeking Events (event title + organizer + brief), Matches (event + sponsor + status + notes + PATCH status). 4) "Create Match" form: select event_id from seeking list, select sponsor_id from approved sponsors, notes text area. POST /api/eventflow/admin/sponsors/match.',
  },
  // ── P6 — KOL Program ────────────────────────────────────────────────────────
  {
    id: 'kol', name: 'KOL / KOC Program', category: 'P6 — KOL',
    status: 'scaffold',
    description: 'KOLs register publicly (status: pending → admin approves to active). Organizers create KOL briefs per event. Admin matches KOLs to briefs. KOLs apply to briefs.',
    files: ['use-cases/eventflow/api/routes/kol.js', 'use-cases/eventflow/api/routes/admin.js', 'use-cases/eventflow/api/db.js (kol fns)'],
    dbTables: ['ef_kol_profiles', 'ef_kol_briefs', 'ef_kol_applications'],
    apiEndpoints: ['POST /api/eventflow/kol/register', 'GET /api/eventflow/kol/profiles (public active)', 'POST /api/eventflow/kol/briefs (organizer)', 'GET /api/eventflow/kol/briefs (organizer)', 'GET /api/eventflow/admin/kol', 'PATCH /api/eventflow/admin/kol/:id/status'],
    notes: 'follower_counts stored as JSONB: {instagram: 50000, youtube: 10000}. All backend done. Missing: public /eventflow/kol page, admin KOL tab, organizer brief tab.',
    devPrompt: 'Add KOL tab to admin panel: 1) Add "🌟 KOL" to Tab type and TABS. 2) loadKol() fetches GET /api/eventflow/admin/kol (returns {profiles, briefs}). 3) Profiles table: name, handle, platforms, follower totals, categories, status + approve/reject (PATCH /admin/kol/:id/status). 4) Briefs table: event, budget_range, deliverables, deadline, categories, status. 5) Consider a "suggest match" button that opens a modal to select a KOL for a brief. Public /eventflow/kol page: KOL registration form with multi-platform follower count inputs (JSONB), categories multi-select, rate range.',
  },
  // ── Public Pages ────────────────────────────────────────────────────────────
  {
    id: 'public-listing', name: 'Public Event Listing', category: 'Public Pages',
    status: 'live',
    description: 'Homepage at /eventflow showing all published public events. Category filter, search, event cards with date/location/tier info.',
    files: ['frontend/app/eventflow/page.tsx'],
    dbTables: ['ef_events', 'ef_ticket_tiers'],
    apiEndpoints: ['GET /api/eventflow/public/events'],
    notes: 'Filter by category works. Search by title works. Pagination not yet implemented.',
    devPrompt: 'Add pagination to public event listing: 1) Add limit/offset query params to GET /api/eventflow/public/events. 2) Return total_count in response. 3) Add "Load more" button or page controls in eventflow/page.tsx. Also add a featured events section (pin 1-3 events via ef_events.featured boolean column).',
  },
  {
    id: 'flows-page', name: 'Flows / Journey Map', category: 'Public Pages',
    status: 'live',
    description: 'Visual stakeholder journey map at /eventflow/flows. Shows step-by-step flows for all roles: organizer, participant, kiosk, reception, admin, AI studio, wishlist, RSVP forms.',
    files: ['frontend/app/eventflow/flows/page.tsx'],
    dbTables: [],
    apiEndpoints: [],
    notes: 'Static page. Flows data is duplicated in admin/page.tsx for the Flows tab. If flows are updated, update both files.',
    devPrompt: 'Add new flow: 1) Add flow object to FLOWS array in flows/page.tsx AND admin/page.tsx (both files). Fields: id, title, role, accent (hex color), icon (emoji), steps [{icon, label, sub, highlight?}], link? {href, label}. Accent colors should be distinct from existing: amber (#f59e0b), blue (#3b82f6), green (#22c55e), purple (#a855f7). Use teal (#14b8a6) or rose (#f43f5e) for new flows.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats]           = useState<Stats | null>(null);
  const [byStatus, setByStatus]     = useState<ByStatus[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents]         = useState<Event[]>([]);
  const [notifSummary, setNotifSummary] = useState<NotifSummary[]>([]);
  const [wishlist, setWishlist]     = useState<WishlistItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expandedFeature, setExpandedFeature]       = useState<string | null>(null);
  const [planUpdating, setPlanUpdating]             = useState<number | null>(null);
  const [eventStatusUpdating, setEventStatusUpdating] = useState<number | null>(null);
  const [wishlistUpdating, setWishlistUpdating]     = useState<number | null>(null);

  // P5 Sponsors
  const [sponsors, setSponsors] = useState<{ profiles: SponsorProfile[]; seeking: SeekingEvent[]; matches: SponsorMatch[] } | null>(null);
  const [matchForm, setMatchForm] = useState({ event_id: '', sponsor_id: '', notes: '' });
  const [matchSubmitting, setMatchSubmitting] = useState(false);
  // P6 KOL
  const [kol, setKol] = useState<{ profiles: KolProfile[]; briefs: KolBrief[] } | null>(null);
  // P3 Ambassadors
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  // P4 Inquiries
  const [inquiries, setInquiries] = useState<AgencyInquiry[]>([]);

  function headers() { return { 'x-admin-secret': secret }; }

  async function login() {
    setAuthErr('');
    try {
      const r = await fetch(`${API}/api/eventflow/admin/stats`, { headers: headers() });
      if (!r.ok) { setAuthErr('Invalid secret'); return; }
      const data = await r.json();
      setStats(data.stats);
      setByStatus(data.byStatus || []);
      setRecentEvents(data.recentEvents || []);
      setAuthed(true);
    } catch { setAuthErr('Connection error'); }
  }

  async function loadOrganizers() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/organizers`, { headers: headers() });
    const data = await r.json();
    setOrganizers(data.organizers || []);
    setLoading(false);
  }

  async function loadEvents() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/events`, { headers: headers() });
    const data = await r.json();
    setEvents(data.events || []);
    setLoading(false);
  }

  async function loadNotifications() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/notifications`, { headers: headers() });
    const data = await r.json();
    setNotifSummary(data.summary || []);
    setLoading(false);
  }

  async function loadWishlist() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/wishlist?limit=100`, { headers: headers() });
    const data = await r.json();
    setWishlist(data.items || []);
    setLoading(false);
  }

  async function updatePlan(orgId: number, plan: string) {
    setPlanUpdating(orgId);
    await fetch(`${API}/api/eventflow/admin/organizers/${orgId}`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    await loadOrganizers();
    setPlanUpdating(null);
  }

  async function updateEventStatus(eventId: number, status: string) {
    setEventStatusUpdating(eventId);
    await fetch(`${API}/api/eventflow/admin/events/${eventId}/status`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadEvents();
    setEventStatusUpdating(null);
  }

  async function updateWishlistStatus(itemId: number, status: string) {
    setWishlistUpdating(itemId);
    await fetch(`${API}/api/eventflow/wishlist/${itemId}`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadWishlist();
    setWishlistUpdating(null);
  }

  async function loadSponsors() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/sponsors`, { headers: headers() });
    const data = await r.json();
    setSponsors({ profiles: data.sponsors || [], seeking: data.seeking || [], matches: data.matches || [] });
    setLoading(false);
  }

  async function updateSponsorProfileStatus(id: number, status: string) {
    await fetch(`${API}/api/eventflow/admin/sponsors/${id}/status`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadSponsors();
  }

  async function updateMatchStatus(id: number, status: string) {
    await fetch(`${API}/api/eventflow/admin/sponsors/matches/${id}/status`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadSponsors();
  }

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    setMatchSubmitting(true);
    await fetch(`${API}/api/eventflow/admin/sponsors/match`, {
      method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: parseInt(matchForm.event_id),
        sponsor_id: parseInt(matchForm.sponsor_id),
        notes: matchForm.notes || undefined,
      }),
    });
    setMatchForm({ event_id: '', sponsor_id: '', notes: '' });
    setMatchSubmitting(false);
    await loadSponsors();
  }

  async function loadKol() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/kol`, { headers: headers() });
    const data = await r.json();
    setKol({ profiles: data.profiles || [], briefs: data.briefs || [] });
    setLoading(false);
  }

  async function updateKolProfileStatus(id: number, status: string) {
    await fetch(`${API}/api/eventflow/admin/kol/${id}/status`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadKol();
  }

  async function loadAmbassadors() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/ambassadors`, { headers: headers() });
    const data = await r.json();
    setAmbassadors(data.ambassadors || []);
    setLoading(false);
  }

  async function updateAmbassadorProfileStatus(id: number, status: string) {
    await fetch(`${API}/api/eventflow/admin/ambassadors/${id}/status`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadAmbassadors();
  }

  async function loadInquiries() {
    setLoading(true);
    const r = await fetch(`${API}/api/eventflow/admin/inquiries`, { headers: headers() });
    const data = await r.json();
    setInquiries(data.inquiries || []);
    setLoading(false);
  }

  async function updateInquiryStatus(id: number, status: string) {
    await fetch(`${API}/api/eventflow/admin/inquiries/${id}/status`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadInquiries();
  }

  useEffect(() => {
    if (!authed) return;
    if (tab === 'organizers')   loadOrganizers();
    if (tab === 'events')       loadEvents();
    if (tab === 'notifications') loadNotifications();
    if (tab === 'wishlist')     loadWishlist();
    if (tab === 'sponsors')     loadSponsors();
    if (tab === 'kol')          loadKol();
    if (tab === 'ambassadors')  loadAmbassadors();
    if (tab === 'inquiries')    loadInquiries();
  }, [tab, authed]);

  // ─── Login gate ─────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-black">EventFlow Admin</h1>
          <p className="text-slate-500 text-sm mt-1">ExpLab internal panel</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <input
            type="password" placeholder="Admin secret"
            value={secret} onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full px-4 py-3 bg-slate-800/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          {authErr && <p className="text-red-400 text-sm text-center">{authErr}</p>}
          <button onClick={login}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-colors">
            Enter →
          </button>
          <p className="text-center text-xs text-slate-600">
            <Link href="/eventflow" className="hover:text-slate-400 transition-colors">← Back to EventFlow</Link>
          </p>
        </div>
      </div>
    );
  }

  // ─── Admin Panel ─────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',      label: 'Overview' },
    { key: 'organizers',    label: `Organizers (${stats?.organizers ?? '…'})` },
    { key: 'events',        label: `Events (${stats?.events ?? '…'})` },
    { key: 'notifications', label: 'Notifications' },
    { key: 'wishlist',      label: '💡 Wishlist' },
    { key: 'sponsors',      label: '🤝 Sponsors' },
    { key: 'kol',           label: '🌟 KOL' },
    { key: 'ambassadors',   label: '🎯 Ambassadors' },
    { key: 'inquiries',     label: '📨 Inquiries' },
    { key: 'flows',         label: '🗺️ Flows' },
    { key: 'status',        label: '🏗️ Platform Status' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/eventflow" className="text-slate-500 hover:text-white transition-colors text-sm">🎟 EventFlow</Link>
            <span className="text-slate-700">/</span>
            <span className="font-bold text-sm">Admin</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">ExpLab Staff</span>
          </div>
          <button onClick={() => setAuthed(false)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Lock →
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.06] mb-8 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 whitespace-nowrap ${
                tab === key ? 'text-amber-400 border-amber-400' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Organizers', value: stats.organizers, color: 'text-blue-400', icon: '👤' },
                { label: 'Events',     value: stats.events,     color: 'text-amber-400', icon: '🎟' },
                { label: 'Registered', value: stats.attendees,  color: 'text-purple-400', icon: '📋' },
                { label: 'Checked In', value: stats.checkins,   color: 'text-green-400', icon: '✓' },
                { label: 'Contacts',   value: stats.contacts,   color: 'text-cyan-400', icon: '📇' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5">
                  <div className="text-xl mb-2">{icon}</div>
                  <div className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</div>
                  <div className="text-slate-500 text-sm mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* By Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-4 text-slate-400 uppercase tracking-wider">Events by Status</h3>
                <div className="space-y-3">
                  {byStatus.map(({ status, count }) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.cancelled}`}>{status}</span>
                      <span className="font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-4 text-slate-400 uppercase tracking-wider">Recent Events</h3>
                <div className="space-y-3">
                  {recentEvents.map((e, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{e.title}</div>
                        <div className="text-xs text-slate-500">{e.organizer_name}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold text-blue-400">{e.registered}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status] || STATUS_COLORS.cancelled}`}>{e.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Check-in rate */}
            {stats.attendees > 0 && (
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-3 text-slate-400 uppercase tracking-wider">Platform Check-in Rate</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-green-400 rounded-full transition-all"
                      style={{ width: `${Math.round(stats.checkins / stats.attendees * 100)}%` }} />
                  </div>
                  <span className="font-black text-green-400 text-lg">
                    {Math.round(stats.checkins / stats.attendees * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{stats.checkins} checked in out of {stats.attendees} registered</p>
              </div>
            )}
          </div>
        )}

        {/* Organizers */}
        {tab === 'organizers' && (
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Organizer</th>
                    <th className="text-left px-6 py-3">Plan</th>
                    <th className="text-center px-6 py-3">Events</th>
                    <th className="text-center px-6 py-3">Attendees</th>
                    <th className="text-left px-6 py-3">Joined</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((org) => {
                    const planInfo = PLAN_LABELS[org.plan] || PLAN_LABELS.free;
                    return (
                      <tr key={org.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm">{org.name}</div>
                          <div className="text-xs text-slate-500">{org.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planInfo.color}`}>{planInfo.label}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-amber-400">{org.event_count}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-400">{org.attendee_count}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(org.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={org.plan}
                            disabled={planUpdating === org.id}
                            onChange={(e) => updatePlan(org.id, e.target.value)}
                            className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="explab_staff">ExpLab Staff</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Events */}
        {tab === 'events' && (
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Event</th>
                    <th className="text-left px-6 py-3">Organizer</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-center px-6 py-3">Registered</th>
                    <th className="text-center px-6 py-3">Check-ins</th>
                    <th className="text-left px-6 py-3">Visibility</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{ev.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="text-xs text-slate-600 font-mono">{ev.slug}</div>
                          {ev.category && (
                            <span className="text-xs text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">{ev.category}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        <div>{ev.organizer_name}</div>
                        <div className="text-xs text-slate-600">{ev.organizer_email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(ev.start_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-400">{ev.registered}</td>
                      <td className="px-6 py-4 text-center font-bold text-green-400">{ev.checked_in}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ev.is_public ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {ev.is_public ? '🌐 Public' : '🔒 Private'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[ev.status] || STATUS_COLORS.cancelled}`}>{ev.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/eventflow/${ev.slug}`} target="_blank"
                            className="text-xs text-amber-400 hover:underline">View</Link>
                          <select
                            value={ev.status}
                            disabled={eventStatusUpdating === ev.id}
                            onChange={(e) => updateEventStatus(ev.id, e.target.value)}
                            className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                            <option value="ended">ended</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : (
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                  <h3 className="font-bold text-sm">Notification Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">All scheduled notifications across all events</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left px-6 py-3">Type</th>
                      <th className="text-left px-6 py-3">Channel</th>
                      <th className="text-left px-6 py-3">Status</th>
                      <th className="text-center px-6 py-3">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifSummary.map((n, i) => (
                      <tr key={i} className="border-b border-slate-700/50">
                        <td className="px-6 py-3 text-sm font-mono text-slate-300">{n.type}</td>
                        <td className="px-6 py-3 text-sm text-slate-400">{n.channel}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            n.status === 'sent'    ? 'bg-green-500/15 text-green-400' :
                            n.status === 'failed'  ? 'bg-red-500/15 text-red-400' :
                            n.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>{n.status}</span>
                        </td>
                        <td className="px-6 py-3 text-center font-bold text-white">{n.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Wishlist */}
        {tab === 'wishlist' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : wishlist.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="text-4xl mb-3">💡</div>
                <p>No wishlist items yet.</p>
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left px-6 py-3">Idea</th>
                      <th className="text-left px-6 py-3">Category</th>
                      <th className="text-center px-6 py-3">Votes</th>
                      <th className="text-left px-6 py-3">Author</th>
                      <th className="text-left px-6 py-3">Date</th>
                      <th className="text-left px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlist.map((item) => (
                      <tr key={item.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-semibold text-sm">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">{item.category}</td>
                        <td className="px-6 py-4 text-center font-bold text-amber-400">{item.votes}</td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          <div>{item.author_name || 'Anonymous'}</div>
                          <div className="text-slate-600">{item.author_type}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.status}
                            disabled={wishlistUpdating === item.id}
                            onChange={(e) => updateWishlistStatus(item.id, e.target.value)}
                            className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                            <option value="open">open</option>
                            <option value="planned">planned</option>
                            <option value="done">done</option>
                            <option value="declined">declined</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Sponsors */}
        {tab === 'sponsors' && (
          <div className="space-y-8">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : sponsors ? (
              <>
                {/* Sponsor Profiles */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">Sponsor Profiles</h3>
                    <span className="text-xs text-slate-500">{sponsors.profiles.length} total</span>
                  </div>
                  <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                    {sponsors.profiles.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No sponsors registered yet.</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="text-left px-6 py-3">Company</th>
                            <th className="text-left px-6 py-3">Contact</th>
                            <th className="text-left px-6 py-3">Industries</th>
                            <th className="text-left px-6 py-3">Budget</th>
                            <th className="text-left px-6 py-3">Status</th>
                            <th className="px-6 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {sponsors.profiles.map(sp => (
                            <tr key={sp.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-sm">{sp.company}</div>
                                {sp.website && <div className="text-xs text-blue-400 truncate max-w-[160px]">{sp.website}</div>}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div>{sp.contact_name || '—'}</div>
                                <div className="text-xs text-slate-500">{sp.contact_email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {sp.industries?.slice(0, 2).map(ind => (
                                    <span key={ind} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{ind}</span>
                                  ))}
                                  {(sp.industries?.length ?? 0) > 2 && (
                                    <span className="text-xs text-slate-500">+{sp.industries!.length - 2}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">{sp.budget_range || '—'}</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  sp.status === 'approved' ? 'bg-green-500/15 text-green-400' :
                                  sp.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                                  'bg-amber-500/15 text-amber-400'
                                }`}>{sp.status}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {sp.status !== 'approved' && (
                                    <button onClick={() => updateSponsorProfileStatus(sp.id, 'approved')}
                                      className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 rounded-lg px-2 py-1 transition-colors">
                                      Approve
                                    </button>
                                  )}
                                  {sp.status !== 'rejected' && (
                                    <button onClick={() => updateSponsorProfileStatus(sp.id, 'rejected')}
                                      className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-2 py-1 transition-colors">
                                      Reject
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Seeking Events */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">Events Seeking Sponsors</h3>
                    <span className="text-xs text-slate-500">{sponsors.seeking.length} open</span>
                  </div>
                  <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                    {sponsors.seeking.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No events currently seeking sponsors.</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="text-left px-6 py-3">Event</th>
                            <th className="text-left px-6 py-3">Date</th>
                            <th className="text-left px-6 py-3">Organizer</th>
                            <th className="text-left px-6 py-3">Packages</th>
                            <th className="text-left px-6 py-3">Budget</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sponsors.seeking.map(ev => (
                            <tr key={ev.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-sm">{ev.title}</div>
                                {ev.brief && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ev.brief}</div>}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">
                                {new Date(ev.start_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div>{ev.organizer_name}</div>
                                <div className="text-xs text-slate-500">{ev.organizer_email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {ev.package_types?.map(p => (
                                    <span key={p} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{p}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-green-400">{ev.budget_range || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Create Match + Matches list */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-5">
                    <h3 className="font-bold text-white mb-4">Create Match</h3>
                    <form onSubmit={createMatch} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Event</label>
                        <select required value={matchForm.event_id}
                          onChange={e => setMatchForm(f => ({ ...f, event_id: e.target.value }))}
                          className="w-full bg-slate-900 border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50">
                          <option value="">Select seeking event…</option>
                          {sponsors.seeking.map(ev => (
                            <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Sponsor</label>
                        <select required value={matchForm.sponsor_id}
                          onChange={e => setMatchForm(f => ({ ...f, sponsor_id: e.target.value }))}
                          className="w-full bg-slate-900 border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50">
                          <option value="">Select approved sponsor…</option>
                          {sponsors.profiles.filter(s => s.status === 'approved').map(sp => (
                            <option key={sp.id} value={sp.id}>{sp.company}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                        <textarea value={matchForm.notes}
                          onChange={e => setMatchForm(f => ({ ...f, notes: e.target.value }))}
                          rows={2} placeholder="Match rationale or next steps…"
                          className="w-full bg-slate-900 border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-500/50" />
                      </div>
                      <button type="submit" disabled={matchSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                        {matchSubmitting ? 'Creating…' : 'Create Match →'}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                      <h3 className="font-bold text-white">Matches</h3>
                      <span className="text-xs text-slate-500">{sponsors.matches.length} total</span>
                    </div>
                    {sponsors.matches.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No matches created yet.</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="text-left px-5 py-3">Event</th>
                            <th className="text-left px-5 py-3">Sponsor</th>
                            <th className="text-left px-5 py-3">Notes</th>
                            <th className="text-left px-5 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sponsors.matches.map(m => (
                            <tr key={m.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3 text-sm font-semibold">{m.event_title}</td>
                              <td className="px-5 py-3 text-sm">
                                <div>{m.company}</div>
                                <div className="text-xs text-slate-500">{m.contact_email}</div>
                              </td>
                              <td className="px-5 py-3 text-xs text-slate-400 max-w-[150px] truncate">{m.notes || '—'}</td>
                              <td className="px-5 py-3">
                                <select value={m.status}
                                  onChange={e => updateMatchStatus(m.id, e.target.value)}
                                  className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none">
                                  <option value="proposed">proposed</option>
                                  <option value="accepted">accepted</option>
                                  <option value="rejected">rejected</option>
                                  <option value="completed">completed</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* KOL */}
        {tab === 'kol' && (
          <div className="space-y-8">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : kol ? (
              <>
                {/* KOL Profiles */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">KOL Profiles</h3>
                    <span className="text-xs text-slate-500">{kol.profiles.length} total</span>
                  </div>
                  <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                    {kol.profiles.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No KOL profiles yet.</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="text-left px-6 py-3">KOL</th>
                            <th className="text-left px-6 py-3">Platforms</th>
                            <th className="text-left px-6 py-3">Followers</th>
                            <th className="text-left px-6 py-3">Categories</th>
                            <th className="text-left px-6 py-3">Rate</th>
                            <th className="text-left px-6 py-3">Status</th>
                            <th className="px-6 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {kol.profiles.map(k => {
                            const total = Object.values(k.follower_counts || {}).reduce((a, b) => a + b, 0);
                            const display = total >= 1000000 ? `${(total / 1000000).toFixed(1)}M`
                              : total >= 1000 ? `${(total / 1000).toFixed(0)}K` : String(total);
                            return (
                              <tr key={k.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-sm">{k.name}</div>
                                  {k.handle && <div className="text-xs text-purple-400">{k.handle}</div>}
                                  <div className="text-xs text-slate-500">{k.contact_email}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {k.platforms?.slice(0, 3).map(p => (
                                      <span key={p} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{p}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-purple-400">{display}</td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {k.categories?.slice(0, 2).map(c => (
                                      <span key={c} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{c}</span>
                                    ))}
                                    {(k.categories?.length ?? 0) > 2 && (
                                      <span className="text-xs text-slate-500">+{k.categories!.length - 2}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400">{k.rate_range || '—'}</td>
                                <td className="px-6 py-4">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    k.status === 'active'   ? 'bg-green-500/15 text-green-400' :
                                    k.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                                    'bg-amber-500/15 text-amber-400'
                                  }`}>{k.status}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    {k.status !== 'active' && (
                                      <button onClick={() => updateKolProfileStatus(k.id, 'active')}
                                        className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 rounded-lg px-2 py-1 transition-colors">
                                        Approve
                                      </button>
                                    )}
                                    {k.status !== 'rejected' && (
                                      <button onClick={() => updateKolProfileStatus(k.id, 'rejected')}
                                        className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-2 py-1 transition-colors">
                                        Reject
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* KOL Briefs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">KOL Briefs</h3>
                    <span className="text-xs text-slate-500">{kol.briefs.length} total</span>
                  </div>
                  <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                    {kol.briefs.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No KOL briefs yet.</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                            <th className="text-left px-6 py-3">Event</th>
                            <th className="text-left px-6 py-3">Organizer</th>
                            <th className="text-left px-6 py-3">Budget</th>
                            <th className="text-left px-6 py-3">Deliverables</th>
                            <th className="text-left px-6 py-3">Deadline</th>
                            <th className="text-left px-6 py-3">Categories</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kol.briefs.map(b => (
                            <tr key={b.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 font-semibold text-sm">{b.event_title}</td>
                              <td className="px-6 py-4 text-sm text-slate-400">{b.organizer_name}</td>
                              <td className="px-6 py-4 text-xs text-green-400">{b.budget_range || '—'}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {b.deliverables?.slice(0, 2).map(d => (
                                    <span key={d} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{d}</span>
                                  ))}
                                  {(b.deliverables?.length ?? 0) > 2 && (
                                    <span className="text-xs text-slate-500">+{b.deliverables!.length - 2}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">
                                {b.deadline ? new Date(b.deadline).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {b.categories?.slice(0, 2).map(c => (
                                    <span key={c} className="text-xs bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full">{c}</span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Ambassadors */}
        {tab === 'ambassadors' && (
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : ambassadors.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="text-4xl mb-3">🎯</div>
                <p>No ambassador applications yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Applicant</th>
                    <th className="text-left px-6 py-3">Platform</th>
                    <th className="text-left px-6 py-3">Handle</th>
                    <th className="text-left px-6 py-3">Followers</th>
                    <th className="text-left px-6 py-3">Categories</th>
                    <th className="text-left px-6 py-3">Applied</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.map(a => (
                    <tr key={a.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{a.name}</div>
                        <div className="text-xs text-slate-500">{a.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{a.platform || '—'}</td>
                      <td className="px-6 py-4 text-sm text-green-400">{a.social_handle || '—'}</td>
                      <td className="px-6 py-4 font-bold text-green-400">
                        {a.follower_count
                          ? a.follower_count >= 1000000 ? `${(a.follower_count / 1000000).toFixed(1)}M`
                            : a.follower_count >= 1000 ? `${(a.follower_count / 1000).toFixed(0)}K`
                            : String(a.follower_count)
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {a.categories?.slice(0, 2).map(c => (
                            <span key={c} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{c}</span>
                          ))}
                          {(a.categories?.length ?? 0) > 2 && (
                            <span className="text-xs text-slate-500">+{a.categories!.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(a.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          a.status === 'approved' ? 'bg-green-500/15 text-green-400' :
                          a.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {a.status !== 'approved' && (
                            <button onClick={() => updateAmbassadorProfileStatus(a.id, 'approved')}
                              className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 rounded-lg px-2 py-1 transition-colors">
                              Approve
                            </button>
                          )}
                          {a.status !== 'rejected' && (
                            <button onClick={() => updateAmbassadorProfileStatus(a.id, 'rejected')}
                              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-2 py-1 transition-colors">
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Inquiries */}
        {tab === 'inquiries' && (
          <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading…</div>
            ) : inquiries.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="text-4xl mb-3">📨</div>
                <p>No agency inquiries yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-6 py-3">Service</th>
                    <th className="text-left px-6 py-3">Company</th>
                    <th className="text-left px-6 py-3">Contact</th>
                    <th className="text-left px-6 py-3">Event Date</th>
                    <th className="text-left px-6 py-3">Budget</th>
                    <th className="text-left px-6 py-3">Submitted</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map(inq => (
                    <tr key={inq.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{inq.service_slug}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">{inq.company || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>{inq.contact_name}</div>
                        <div className="text-xs text-slate-500">{inq.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {inq.event_date ? new Date(inq.event_date).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{inq.budget_range || '—'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(inq.created_at).toLocaleDateString('en-HK', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <select value={inq.status}
                          onChange={e => updateInquiryStatus(inq.id, e.target.value)}
                          className="text-xs bg-slate-900 border border-white/[0.08] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                          <option value="new">new</option>
                          <option value="contacted">contacted</option>
                          <option value="quoted">quoted</option>
                          <option value="won">won</option>
                          <option value="lost">lost</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Flows */}
        {tab === 'flows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-black text-lg text-white">Platform Flows</h2>
                <p className="text-slate-500 text-sm mt-0.5">Stakeholder journeys across every part of EventFlow</p>
              </div>
              <Link href="/eventflow/flows" target="_blank"
                className="text-xs text-amber-400 hover:underline">View full page →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {FLOWS.map((flow) => (
                <div key={flow.id} className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between"
                    style={{ background: flow.accent + '18' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{flow.icon}</span>
                      <div>
                        <h3 className="font-bold text-white text-sm">{flow.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: flow.accent }}>{flow.role}</p>
                      </div>
                    </div>
                    {flow.link && (
                      <Link href={flow.link.href} target="_blank"
                        className="text-xs px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80"
                        style={{ borderColor: flow.accent + '50', color: flow.accent }}>
                        {flow.link.label}
                      </Link>
                    )}
                  </div>
                  <div className="p-4">
                    <ol className="space-y-2.5">
                      {flow.steps.map((step, i) => (
                        <li key={i} className={`flex items-start gap-3 rounded-xl px-3 py-2 transition-colors ${
                          step.highlight ? 'bg-white/[0.05]' : ''
                        }`}>
                          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                            <span className="text-slate-600 text-xs font-mono w-4 text-right">{i + 1}.</span>
                            <span className="text-base leading-none">{step.icon}</span>
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${step.highlight ? 'text-white' : 'text-slate-200'}`}>
                              {step.label}
                              {step.highlight && (
                                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: flow.accent + '25', color: flow.accent }}>key</span>
                              )}
                            </div>
                            {step.sub && <div className="text-xs text-slate-500 mt-0.5">{step.sub}</div>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Status */}
        {tab === 'status' && (() => {
          const categories = Array.from(new Set(PLATFORM.map(f => f.category)));
          const statusCounts = PLATFORM.reduce((acc, f) => { acc[f.status] = (acc[f.status] || 0) + 1; return acc; }, {} as Record<string, number>);
          return (
            <div className="space-y-8">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['live', 'in-dev', 'scaffold', 'planned'] as DevStatus[]).map(s => (
                  <div key={s} className="bg-slate-800/60 border border-white/[0.08] rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[s].cls}`}>{STATUS_BADGE[s].label}</span>
                    <span className="font-black text-white text-lg">{statusCounts[s] || 0}</span>
                  </div>
                ))}
              </div>

              {/* Feature Groups */}
              {categories.map(cat => {
                const features = PLATFORM.filter(f => f.category === cat);
                return (
                  <div key={cat}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{cat}</h3>
                    <div className="space-y-2">
                      {features.map(feature => {
                        const isExpanded = expandedFeature === feature.id;
                        const badge = STATUS_BADGE[feature.status];
                        return (
                          <div key={feature.id}
                            className="bg-slate-800/60 border border-white/[0.08] rounded-2xl overflow-hidden transition-all">
                            {/* Header row — click to expand */}
                            <button
                              onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                                <span className="font-semibold text-sm text-white">{feature.name}</span>
                                <span className="text-xs text-slate-600 hidden sm:block truncate">{feature.description.slice(0, 80)}…</span>
                              </div>
                              <span className="text-slate-600 text-xs flex-shrink-0 ml-4">{isExpanded ? '▲ collapse' : '▼ expand'}</span>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                              <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">
                                {/* Description */}
                                <p className="text-sm text-slate-300">{feature.description}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Files */}
                                  {feature.files.length > 0 && (
                                    <div>
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Files</div>
                                      <ul className="space-y-1">
                                        {feature.files.map(f => (
                                          <li key={f} className="text-xs font-mono text-blue-400 bg-blue-500/[0.06] px-2.5 py-1.5 rounded-lg">{f}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* DB Tables */}
                                  {feature.dbTables.length > 0 && (
                                    <div>
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DB Tables</div>
                                      <ul className="space-y-1">
                                        {feature.dbTables.map(t => (
                                          <li key={t} className="text-xs font-mono text-violet-400 bg-violet-500/[0.06] px-2.5 py-1.5 rounded-lg">{t}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* API Endpoints */}
                                {feature.apiEndpoints.length > 0 && (
                                  <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">API Endpoints</div>
                                    <ul className="flex flex-wrap gap-2">
                                      {feature.apiEndpoints.map(ep => {
                                        const method = ep.split(' ')[0];
                                        const methodColor = method === 'GET' ? 'text-green-400 bg-green-500/[0.08]' : method === 'POST' ? 'text-blue-400 bg-blue-500/[0.08]' : method === 'PATCH' ? 'text-amber-400 bg-amber-500/[0.08]' : 'text-red-400 bg-red-500/[0.08]';
                                        return (
                                          <li key={ep} className={`text-xs font-mono px-2.5 py-1 rounded-lg ${methodColor}`}>{ep}</li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}

                                {/* Notes */}
                                {feature.notes && (
                                  <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-4 py-3">
                                    <div className="text-xs font-bold text-amber-400 mb-1">📝 Notes</div>
                                    <p className="text-xs text-slate-300">{feature.notes}</p>
                                  </div>
                                )}

                                {/* Dev Prompt */}
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-bold text-slate-400">💡 Dev Prompt</div>
                                    <button
                                      onClick={() => navigator.clipboard?.writeText(feature.devPrompt)}
                                      className="text-xs text-slate-600 hover:text-slate-300 transition-colors">
                                      copy
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{feature.devPrompt}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
