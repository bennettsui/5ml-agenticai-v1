# EventFlow Native Apps

Two React Native (Expo) apps for the EventFlow event management platform.

| App | Directory | Purpose |
|-----|-----------|---------|
| **Participant App** | `eventflow-participant/` | Browse events, RSVP, view QR tickets, wishlist |
| **Organizer App** | `eventflow-organizer/` | Manage events, attendees, AI tools, check-in kiosk |

Both apps connect to: **https://5ml-agenticai-v1.fly.dev**

---

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode + iOS Simulator (macOS only)
- Android: Android Studio + Emulator, or physical device with Expo Go

### Run Participant App
```bash
cd eventflow-participant
npm install
npm start          # Opens Expo dev server
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

### Run Organizer App
```bash
cd eventflow-organizer
npm install
npm start          # Opens Expo dev server
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

---

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure (one-time)
eas login
eas build:configure

# Build for iOS (requires Apple Developer account)
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## App Architecture

Both apps use **Expo Router** (file-based routing) with TypeScript.
