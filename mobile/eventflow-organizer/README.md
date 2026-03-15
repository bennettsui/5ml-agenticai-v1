# EventFlow Organizer App

React Native (Expo) app for event organizers — create events, manage attendees, AI content, check-in kiosk.

## Features

### 🔐 Authentication
- Secure JWT login/signup with `expo-secure-store`
- Auto-restores session on app reopen
- Route protection (redirects to login if unauthenticated)

### 📊 Dashboard
- Stats overview: total events, published, attendees, check-ins
- Quick action buttons
- Recent events list

### 📅 Event Management
- Create events: title, description, location, date/time, category, capacity
- Save as draft or publish immediately
- Edit event details
- Publish / delete events
- Filter and search your events

### 🎟️ Ticket Tiers
- Create multiple tiers per event (Free, Early Bird, VIP, etc.)
- Set price, currency, capacity, color
- Enable/disable tiers

### 📝 Custom Form Fields
- Add custom RSVP questions
- Types: text, email, phone, number, textarea, select, checkbox, date
- Required/optional toggle

### 👥 Attendee Management
- List all attendees with search and status filter
- Attendee detail modal
- Manual check-in from the app
- Paginated list

### 🤖 AI Studio
- **Event Description** — AI-generated description
- **Social Media Post** — Instagram, LinkedIn, or Twitter
- **Event Agenda** — detailed schedule
- **Promotional Email** — marketing copy
- **Banner Image Prompt** — DALL-E / Midjourney prompt
- Copy to clipboard, regenerate

### 📇 Contacts CRM
- All attendee contacts across events
- Search by name, email, organization
- Contact detail view

### 📡 Check-in Kiosk (Reception Mode)
- PIN-based staff authentication (no organizer account needed for staff)
- **QR Scanner** — camera scans attendee QR codes
- **Manual Search** — find attendees by name
- Live stats bar (total, checked-in, %)
- Haptic feedback on check-in
- Automatic result display (2.5s overlay)

## Screens

```
/login                 ← Login
/signup                ← Register

/ (tabs)
├── dashboard.tsx      ← Dashboard
├── events.tsx         ← Events List
├── contacts.tsx       ← Contacts CRM
└── settings.tsx       ← Profile & Settings

/event/new             ← Create Event
/event/[id]/
├── index.tsx          ← Event Overview
├── attendees.tsx      ← Attendees
├── tiers.tsx          ← Ticket Tiers
├── form-fields.tsx    ← Custom Form Fields
├── edit.tsx           ← Edit Event
└── ai-studio.tsx      ← AI Content Generator

/reception/
├── index.tsx          ← PIN Login
└── [eventId].tsx      ← Check-in Kiosk
```

## Setup

```bash
npm install
npm start
```

## Permissions Required

| Permission | Platform | Purpose |
|-----------|---------|---------|
| `CAMERA` | iOS + Android | QR code scanning in reception mode |

## Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `expo-secure-store` | Secure JWT token storage |
| `expo-camera` | QR code scanner (CameraView) |
| `@expo/vector-icons` | Ionicons |

## Authentication Flow

1. App starts → checks SecureStore for JWT token
2. If token exists → calls `GET /organizer/me` to validate
3. If valid → navigate to `/(tabs)/dashboard`
4. If invalid/missing → navigate to `/login`
5. On login → store JWT in SecureStore, navigate to dashboard
6. On logout → delete JWT, navigate to `/login`

## Reception / Check-in Flow

Reception staff don't need an organizer account:
1. Open app → tap "Reception / Check-in Staff" on login screen
2. Enter Event ID + 4-digit PIN (from organizer)
3. Scan QR codes or search manually
4. Stats update live every 10 seconds

## API

Connects to `https://5ml-agenticai-v1.fly.dev/api/eventflow`

Auth endpoints:
- `POST /organizer/login`
- `POST /organizer/signup`
- `GET /organizer/me`

Event endpoints:
- `GET/POST /events`
- `GET/PATCH/DELETE /events/:id`
- `POST /events/:id/publish`

Check-in endpoints:
- `POST /checkin/auth`
- `POST /checkin/scan/:code`
- `POST /checkin/checkin/:id`
- `GET /checkin/events/:id/search`

AI endpoints:
- `POST /ai/describe`
- `POST /ai/social`
- `POST /ai/agenda`
- `POST /ai/email`
- `POST /ai/banner-prompt`
