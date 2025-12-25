# SHPE App - Codebase Setup Instructions for Claude Code

This document provides step-by-step instructions for setting up the complete directory structure for the SHPE mobile app MVP.

## Overview

This is a **2-week MVP** for a SHPE (Society of Hispanic Professional Engineers) member engagement app built with:
- **Frontend**: Expo (React Native)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: OAuth via Supabase
- **Storage**: Supabase Storage

**Core Philosophy**: Ship fast, keep it clean, no AI complexity in MVP.

---

## Directory Structure to Create

Execute the following commands to create the complete directory structure:

```bash
# Navigate to project root
cd /path/to/shpe-app

# Create main directories
mkdir -p app/{auth,tabs,event}
mkdir -p components
mkdir -p hooks
mkdir -p store
mkdir -p lib
mkdir -p services
mkdir -p types
mkdir -p utils
mkdir -p assets/{images,icons}
mkdir -p supabase/functions/{check-in,award-points,admin-event}

# Create README files for each directory
touch app/README.md
touch app/auth/README.md
touch app/tabs/README.md
touch app/event/README.md
touch components/README.md
touch hooks/README.md
touch store/README.md
touch lib/README.md
touch services/README.md
touch types/README.md
touch utils/README.md
touch assets/README.md
touch supabase/functions/README.md
touch supabase/functions/check-in/README.md
touch supabase/functions/award-points/README.md
touch supabase/functions/admin-event/README.md
```

---

## Directory Documentation

### `/app/` - Expo Router (Navigation Only)

**Purpose**: File-based routing using Expo Router. Routes handle navigation and auth gating ONLY.

**Rules**:
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Auth gating only
- ✅ Navigation structure

**Structure**:
```
app/
├── (auth)/
│   └── login.tsx              # OAuth login screen
├── (tabs)/
│   ├── calendar.tsx           # Events calendar view
│   ├── feed.tsx               # Social feed with highlights
│   ├── profile.tsx            # User profile
│   └── admin.tsx              # Admin analytics (role-gated)
├── event/
│   └── [id].tsx               # Single event detail page
└── _layout.tsx                # Root layout with auth provider
```

---

### `/app/auth/` - Authentication Routes

**Purpose**: Login and authentication screens

**Contents**:
- `login.tsx` - OAuth login screen (Google, LinkedIn, etc.)

---

### `/app/tabs/` - Main Tab Navigation

**Purpose**: Core app screens accessible via bottom tab navigation

**Contents**:
- `calendar.tsx` - Events calendar (entry point to Single Event Page)
- `feed.tsx` - Social feed with event highlights, announcements, shoutouts
- `profile.tsx` - User profile with stats, resume, connections
- `admin.tsx` - Admin dashboard with analytics (eboard members only)

**Features by Tab**:

**Calendar**:
- List of upcoming events
- Filter by date/type
- Navigate to Single Event Page

**Feed**:
- Recent event highlights (photos from members)
- Member of the Month spotlight
- Committee Member of the Week
- Announcements
- LinkedIn activity scraping (post-MVP)
- Private opportunity sign-ups

**Profile**:
- Profile picture
- Resume upload
- Camera toggle (QR scanner for check-in)
- Stats: internships, resume score, LinkedIn activity
- Connection requests
- Ranking/points display

**Admin**:
- Member analytics
- Event performance metrics
- CARLA insights (post-MVP)

---

### `/app/event/` - Event Detail Routes

**Purpose**: Dynamic route for individual event pages

**Contents**:
- `[id].tsx` - Single event detail page

**Features**:
- Event details (date, time, location, description)
- RSVP button
- QR code check-in (opens when event starts, closes when event ends)
- Post-event feedback form (triggers notification, awards points)
- Event highlights gallery (member photo uploads)
- Directions to event (post-MVP)

---

### `/components/` - Reusable UI Components (Presentation Only)

**Purpose**: Pure presentational components with no business logic

**Rules**:
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Props in → UI out
- ✅ Fully reusable

**Planned Components**:
```
components/
├── EventCard.tsx              # Calendar event card
├── FeedItem.tsx               # Feed post component
├── ProfileHeader.tsx          # Profile top section
├── PointsBadge.tsx            # Points display badge
├── QRScanButton.tsx           # Camera trigger button
├── HighlightPhoto.tsx         # Event photo card
├── RankingCard.tsx            # Member ranking display
├── AnnouncementCard.tsx       # Feed announcement
└── ConnectionRequest.tsx      # Friend request UI
```

---

### `/hooks/` - Business Logic (No UI)

**Purpose**: Custom React hooks that encapsulate business logic and data fetching

**Rules**:
- ❌ No UI/JSX
- ❌ No raw SQL
- ✅ Calls Supabase client or Edge Functions
- ✅ Returns data + loading states

**Planned Hooks**:
```
hooks/
├── useAuth.ts                 # Authentication state & methods
├── useEvents.ts               # Events CRUD & filtering
├── useCheckIn.ts              # QR check-in logic
├── usePoints.ts               # Points calculation & display
├── useFeed.ts                 # Feed data fetching
├── useProfile.ts              # Profile data & updates
├── useRSVP.ts                 # RSVP management
├── useHighlights.ts           # Event photo uploads
└── useAdmin.ts                # Admin analytics data
```

**Example Pattern**:
```typescript
// useEvents.ts
export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Calls Supabase, returns data
  // NO UI, NO SQL, just business logic
}
```

---

### `/store/` - Global State Management (Zustand)

**Purpose**: Centralized state for cross-component data

**Rules**:
- ✅ Use Zustand for global state
- ✅ Keep stores focused (single responsibility)
- ❌ No UI logic in stores

**Planned Stores**:
```
store/
├── auth.store.ts              # User session, profile, role
├── events.store.ts            # Events cache, filters
├── points.store.ts            # Points balance, history
├── feed.store.ts              # Feed items cache
└── ui.store.ts                # Modal states, loading flags
```

---

### `/lib/` - Supabase Client & Core Services

**Purpose**: Supabase initialization and authentication helpers

**Contents**:
```
lib/
├── supabase.ts                # Supabase client initialization
└── auth.ts                    # OAuth helpers (Google, LinkedIn)
```

**Responsibilities**:
- Initialize Supabase client
- Configure OAuth providers
- Auth state management

**Usage**:
```typescript
import { supabase } from '@/lib/supabase'

// Read data (protected by RLS)
const { data } = await supabase.from('events').select('*')
```

---

### `/services/` - Platform/Device Services (No Business Logic)

**Purpose**: Abstraction layer for native device APIs

**Rules**:
- ❌ No business logic
- ❌ No Supabase calls
- ✅ Device abstraction only
- ✅ Returns raw data/results

**Planned Services**:
```
services/
├── camera.service.ts          # QR code scanning
├── photos.service.ts          # Image picker & compression
├── notifications.service.ts   # Push notifications
└── location.service.ts        # GPS/directions (post-MVP)
```

**Example**:
```typescript
// camera.service.ts
export async function scanQRCode(): Promise<string> {
  // Opens camera, returns QR data
  // NO check-in logic here
}
```

---

### `/types/` - Shared TypeScript Types

**Purpose**: Centralized type definitions for the entire app

**Planned Types**:
```
types/
├── database.types.ts          # Supabase generated types
├── user.types.ts              # User, Profile, Role
├── event.types.ts             # Event, RSVP, CheckIn
├── points.types.ts            # PointsTransaction, Ranking
├── feed.types.ts              # FeedItem, Highlight
└── api.types.ts               # Edge Function request/response
```

**Best Practice**:
- Generate database types from Supabase schema
- Keep types in sync with database

---

### `/utils/` - Small Helper Functions

**Purpose**: Pure utility functions (no side effects)

**Planned Utils**:
```
utils/
├── date.utils.ts              # Date formatting, timezone
├── points.utils.ts            # Points calculation helpers
├── validation.utils.ts        # Form validation
└── format.utils.ts            # String formatting
```

---

### `/assets/` - Static Assets

**Purpose**: Images, icons, and static files

**Structure**:
```
assets/
├── images/                    # App images, logos
└── icons/                     # Custom icons
```

---

### `/supabase/functions/` - Edge Functions (Backend Compute)

**Purpose**: Serverless backend APIs for secure, atomic operations

**Why Edge Functions?**
- Prevent client-side cheating
- Enforce business rules server-side
- Handle sensitive operations (points, check-ins)

**Planned Functions**:
```
supabase/functions/
├── check-in/
│   └── index.ts               # QR check-in validation & recording
├── award-points/
│   └── index.ts               # Points awarding logic
└── admin-event/
    └── index.ts               # Admin-only event mutations
```

**Responsibilities**:

**`check-in`**:
- Validate QR code
- Check event is open
- Record check-in atomically
- Award attendance points

**`award-points`**:
- Validate point-worthy action
- Apply multipliers (2x for photos with alumni, 3x with professionals, 4x with member of month)
- Record transaction
- Update user balance

**`admin-event`**:
- Open/close event check-in
- Create/update/delete events
- Approve highlights
- Role verification

---

## Database Schema (Reference)

**MVP Tables** (create in Supabase dashboard):
```sql
users               # User profiles
events              # SHPE events
rsvps               # Event RSVPs
check_ins           # Event check-in records
points              # Points transactions
photos              # Event highlight photos
feed_items          # Feed posts (highlights, announcements)
```

**Prepared for Post-MVP AI**:
- `metadata` JSONB columns (for AI enrichment)
- `source_type` enums (manual, ai_generated, etc.)
- `actor_id` / `target_id` patterns (for graph analysis)

---

## Supabase Storage Buckets

Create these buckets in Supabase dashboard:
```
- profile-pictures/          # User avatars
- event-photos/              # Event highlight uploads
```

**Policies**:
- Auth required for all uploads
- Event photos: upload allowed only after check-in (enforced via RLS or Edge Function)

---

## Key Features & User Flows

### Pre-Event
1. User browses calendar
2. User RSVPs to event
3. User receives reminder notification

### During Event
1. Admin opens QR check-in
2. User scans QR code → auto check-in (no form)
3. User receives attendance points
4. User uploads event photos for bonus points
   - 2x points for photos with alumni
   - 3x points for photos with professionals
   - 4x points for photos with member of month (facial recognition - post-MVP)

### Post-Event
1. User receives feedback form notification
2. User submits feedback → earns points
3. Photos appear in feed
4. User sees updated ranking

---

## Points System

**Point-Worthy Actions**:
- Event attendance: 10 points
- Feedback form: 5 points
- Photo upload: 5 points
- Photo with alumni: 10 points (2x)
- Photo with professional: 15 points (3x)
- Photo with member of month: 20 points (4x)

**Ranking System**:
- Current members
- Alumni
- Winner of the Month featured on feed

**Rewards**:
- Social: Featured on app, profile badge
- Empirical: Gift cards, lunch with team, SHPE merch

---

## Authentication & Roles

**OAuth Providers**:
- Google
- LinkedIn (for automatic resume enrichment - post-MVP)

**User Types**:
1. Undergrad NJIT Member (full access)
2. Undergrad Other Member (limited)
3. Alumni NJIT (networking focus)
4. Alumni Other (networking focus)
5. Admin/Eboard (analytics access)

---

## Non-Negotiable MVP Rules

✅ **DO**:
- Use Expo Router for navigation
- Use Supabase for data & auth
- Use Edge Functions for sensitive logic
- Protect all reads with RLS
- Keep UI components pure (no logic)
- Use hooks for business logic

❌ **DON'T**:
- Add AI code in MVP
- Create a REST server
- Put business logic in UI components
- Mutate points client-side
- Skip Edge Functions for check-ins/points

---

## Post-MVP Intelligence Layer (NOT IN MVP)

**Future Directory** (create later, NOT NOW):
```
intelligence/              # NOT in mobile app
├── ingestion/            # Data collection
├── enrichment/           # AI processing
├── scoring/              # ML models
└── insights/             # Analytics engine
```

**Future Capabilities**:
- Facial recognition (photo point multipliers)
- Resume parsing (automatic profile enrichment)
- LinkedIn scraping (activity promotion on feed)
- CARLA AI (intelligent meeting insights, event suggestions)
- Recommendation system (connection suggestions)

**Integration Method**:
- Writes to existing tables via background jobs
- Triggers via Supabase webhooks
- Mobile app reads enriched data (read-only initially)

---

## Next Steps After Directory Setup

1. **Initialize Expo App**:
   ```bash
   npx create-expo-app@latest shpe-app
   cd shpe-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install @supabase/supabase-js
   npm install zustand
   npm install expo-camera expo-image-picker
   npx expo install expo-router
   ```

3. **Initialize Supabase Project**:
   - Create project at supabase.com
   - Set up database tables
   - Configure OAuth providers
   - Create storage buckets
   - Enable RLS policies

4. **Create `.env` File**:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Start Coding**:
   - Begin with auth flow (`lib/supabase.ts`, `app/auth/login.tsx`)
   - Build core hooks (`hooks/useAuth.ts`, `hooks/useEvents.ts`)
   - Create UI components (`components/EventCard.tsx`)
   - Implement Edge Functions (`supabase/functions/check-in`)

---

## Development Workflow

1. **Work in features branches**: `feature/calendar`, `feature/check-in`
2. **Test on real devices**: Use Expo Go for testing
3. **Deploy Edge Functions**: `supabase functions deploy check-in`
4. **Iterate fast**: 2-week deadline, focus on core flows

---

## Success Metrics for MVP

- ✅ Users can RSVP to events
- ✅ Users can check-in via QR code
- ✅ Users earn points automatically
- ✅ Users can upload event photos
- ✅ Feed shows recent highlights
- ✅ Admin can open/close check-ins
- ✅ Admin can view analytics

---

## Questions to Resolve Before Coding

1. Which OAuth provider to prioritize? (Google vs LinkedIn)
2. Photo upload size limits?
3. Notification service? (Expo Push vs native)
4. Admin role assignment strategy?
5. Points deduction for no-shows?

---

## Final Checklist

- [ ] All directories created with README.md files
- [ ] Expo project initialized
- [ ] Supabase project created
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database schema designed
- [ ] Storage buckets created
- [ ] RLS policies planned
- [ ] Edge Functions scaffolded

---

**Ready to build? Let's ship this MVP in 2 weeks! 🚀**
