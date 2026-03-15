# EventFlow Participant App

React Native (Expo) app for event attendees — browse events, RSVP, view QR tickets.

## Features

### 🔍 Discover Events
- Browse public events with search and category filters
- Event cards with banner images, dates, location, pricing
- Pull-to-refresh + infinite scroll pagination

### 📋 Event Detail & RSVP
- Full event info: description, location, schedule, ticket tiers
- RSVP form with ticket tier selection
- Custom form fields (defined by organizer)
- Notification preferences (WhatsApp, LINE)
- One-tap registration

### 🎫 My Tickets
- All RSVPs stored on-device
- Large QR code display for check-in
- Event details on ticket card
- Share ticket functionality

### 💡 Wishlist
- Vote on feature requests
- Submit new ideas
- Filter by category and status

### 👤 Profile
- Anonymous preference tracking (no login required)
- Role, interests, location
- Session-based identity

## Screens

```
/ (tabs)
├── index.tsx          ← Discover (home)
├── tickets.tsx        ← My Tickets
├── wishlist.tsx       ← Wishlist
└── profile.tsx        ← Profile

/event/[slug]          ← Event Detail
/rsvp/[slug]           ← RSVP Form
/ticket/[code]         ← Ticket + QR Code
```

## Setup

```bash
npm install
npm start
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `react-native-qrcode-svg` | QR code display |
| `@react-native-async-storage/async-storage` | Local ticket storage |
| `@expo/vector-icons` | Ionicons |
| `react-native-svg` | Required by QR library |

## API

Connects to `https://5ml-agenticai-v1.fly.dev/api/eventflow`

Public endpoints used:
- `GET /public/events` — list events
- `GET /public/events/:slug` — event detail
- `POST /public/events/:slug/rsvp` — register
- `GET /wishlist` — feature requests
- `POST /wishlist/:id/vote` — vote
