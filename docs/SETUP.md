# SHPE App Setup

## Quick Start

### Requirements
- Node.js 20+
- Expo Go (on your phone)

### Run Locally
1. Clone the repo
2. `cd frontend && npm install`
3. `npx expo start --tunnel`
4. Scan the QR code in Expo Go

### Notes
- If LAN works for you, you can run: `npx expo start`
- If you get timeouts, use `--tunnel`

---

## Project Overview

This is a **2-week MVP** for a SHPE (Society of Hispanic Professional Engineers) member engagement app built with:
- **Frontend**: Expo (React Native)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: OAuth via Supabase
- **Storage**: Supabase Storage

**Core Philosophy**: Ship fast, keep it clean, no AI complexity in MVP.

---

## Architecture

### Directory Structure

```
frontend/
├── app/                    # Expo Router (file-based routing)
│   ├── (tabs)/            # Main tab navigation
│   ├── event/[id]/        # Event detail pages
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI (presentation only)
├── hooks/                 # Business logic hooks
├── services/              # Device API abstractions
├── lib/                   # Supabase client
├── types/                 # TypeScript types
└── utils/                 # Pure helper functions
```

### Key Principles

**Components (`/components/`):**
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Props in → UI out
- ✅ Fully reusable

**Hooks (`/hooks/`):**
- ❌ No UI/JSX
- ✅ Business logic
- ✅ Supabase calls
- ✅ Returns data + loading states

**Services (`/services/`):**
- ❌ No business logic
- ❌ No Supabase
- ✅ Device abstraction only (camera, notifications, etc.)

**Routes (`/app/`):**
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Navigation structure
- ✅ Auth gating

---

## Supabase Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Note your project URL and anon key

### 2. Database Tables (MVP)
```sql
users               # User profiles
events              # SHPE events
rsvps               # Event RSVPs
check_ins           # Event check-in records
points              # Points transactions
photos              # Event highlight photos
feed_items          # Feed posts
```

### 3. Storage Buckets
```
- profile-pictures/
- event-photos/
```

### 4. Environment Variables

**IMPORTANT**: Supabase credentials are now loaded from `.env` (not hardcoded in `app.json`).

Create `frontend/.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Security Notes**:
- Never commit `.env` to version control (already in `.gitignore`)
- Get these values from your Supabase project dashboard
- `EXPO_PUBLIC_` prefix makes them available at build time

---

## Development

### Install Dependencies
```bash
cd frontend
npm install
```

### Key Dependencies
- `@supabase/supabase-js` - Backend client
- `expo-router` - File-based navigation
- `expo-camera` - QR scanning
- `date-fns` - Date utilities

### Run Development Server
```bash
npx expo start --tunnel
```

### Edge Functions (Optional)
```bash
cd supabase
supabase functions deploy check-in
```

---

## Core Features

### Pre-Event
1. User browses calendar
2. User RSVPs to event
3. User receives reminder notification

### During Event
1. Admin opens QR check-in
2. User scans QR → auto check-in
3. User receives attendance points
4. User uploads event photos for bonus points

### Post-Event
1. User receives feedback form notification
2. User submits feedback → earns points
3. Photos appear in feed
4. User sees updated ranking

---

## Points System

**Point-Worthy Actions:**
- Event attendance: 10 points
- Feedback form: 5 points
- Photo upload: 5 points
- Photo with alumni: 10 points (2x)
- Photo with professional: 15 points (3x)

---

## Authentication & Roles

**OAuth Providers:**
- Google
- LinkedIn (for resume enrichment - post-MVP)

**User Types:**
1. Undergrad NJIT Member (full access)
2. Undergrad Other Member (limited)
3. Alumni NJIT (networking focus)
4. Alumni Other (networking focus)
5. Admin/Eboard (analytics access)

---

## MVP Rules

✅ **DO:**
- Use Expo Router for navigation
- Use Supabase for data & auth
- Use Edge Functions for sensitive logic
- Protect reads with RLS
- Keep UI components pure
- Use hooks for business logic

❌ **DON'T:**
- Add AI code in MVP
- Put business logic in UI
- Mutate points client-side
- Skip Edge Functions for check-ins/points

---

## Success Metrics

- ✅ Users can RSVP to events
- ✅ Users can check-in via QR code
- ✅ Users earn points automatically
- ✅ Users can upload event photos
- ✅ Feed shows recent highlights
- ✅ Admin can open/close check-ins
- ✅ Admin can view analytics

---

For detailed API design, see [API_DESIGN.md](API_DESIGN.md).
For codebase structure details, see [CODEBASE.md](CODEBASE.md).
For device services, see [DEVICE_SERVICES.md](DEVICE_SERVICES.md).
>>>>>>> 71b979c270a999042977d4af9aa37a7584e5e242
