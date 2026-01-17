# CODEBASE STRUCTURE — 2-WEEK MVP (EXPO + SUPABASE)

This document defines the **clean, minimal codebase structure** for the 2-week MVP.

Goals:
- Ship fast
- Keep responsibilities clear
- Avoid premature AI complexity
- Prepare clean extension points for post-MVP intelligence / AI

---

## 1. HIGH-LEVEL ARCHITECTURE

```

Expo Mobile App
│
├─ UI (screens + components)
├─ App Logic (hooks + stores)
├─ Data Access (Supabase client)
├─ Backend Compute (Edge Functions)
└─ Platform Services (camera, notifications)

```

**Important rule:**
AI does NOT live in the mobile app.
AI will be added later as a **separate intelligence layer**.

---

## 2. FRONTEND (EXPO APP)

### Root Structure

```

app/                    # Expo Router (file-based navigation)
components/             # UI-only components (domain-organized)
  ├── auth/             # Authentication UI
  ├── events/           # Event components
  ├── media/            # Media/file handling
  ├── onboarding/       # Onboarding screens
  ├── profile/          # Profile components
  └── shared/           # Shared utilities
hooks/                  # Business logic (domain-organized)
  ├── calendar/         # Calendar hooks
  ├── events/           # Event hooks
  ├── media/            # Media hooks
  └── profile/          # Profile hooks
store/                  # Global state (Zustand)
lib/                    # Supabase client + data services
services/               # Device APIs (camera, calendar, photo)
types/                  # Shared TypeScript types
utils/                  # Pure helper functions
  ├── events.ts         # Type mapping (EventDB ↔ EventUI)
  ├── phoneNumber.ts    # Phone formatting
  └── validation.ts     # Pure validation
constants/              # App-wide constants
  ├── colors.ts         # SHPE brand colors
  ├── calendar-theme.ts # Calendar theming (SCREAMING_SNAKE_CASE)
  └── index.ts          # Barrel export
assets/                 # Images, icons

```

---

## 3. ROUTING (Expo Router)

```

app/
├─ (auth)/
│   └─ login.tsx
│
├─ (tabs)/
│   ├─ calendar.tsx
│   ├─ feed.tsx
│   ├─ profile.tsx
│   └─ admin.tsx        # role-gated
│
├─ event/
│   └─ [id].tsx         # single event page
│
└─ _layout.tsx

```

**Rules**
- No Supabase calls in routes
- Auth gating only
- Routes = navigation, not logic

---

## 4. UI LAYER (DOMAIN-ORGANIZED)

```

components/
├─ auth/
│  └─ AuthInput.tsx
├─ events/
│  ├─ AttendeesPreview.tsx
│  ├─ EventActionBar.tsx
│  └─ RegistrationSuccessModal.tsx
├─ media/
│  ├─ ImageSourceModal.tsx
│  └─ ResumeUploader.tsx
├─ profile/
│  ├─ EditProfileScreen.tsx
│  ├─ InterestPicker.tsx
│  └─ ProfileForm.tsx
└─ shared/
   ├─ ErrorBoundary.tsx
   └─ MapPreview.tsx

```

**Rules**
- No business logic
- No Supabase
- Props in → UI out
- Organized by domain with barrel exports

---

## 5. APPLICATION LOGIC (DOMAIN-ORGANIZED)

```

hooks/
├─ calendar/
│  ├─ useAdaptiveTheme.ts
│  └─ useCalendarScroll.ts
├─ events/
│  ├─ useEventAttendees.ts
│  └─ useEventRegistration.ts
├─ media/
│  └─ useProfilePhoto.ts
└─ profile/
   ├─ useEditProfile.ts
   ├─ useProfile.ts
   └─ useResume.ts

```
```

store/
├─ auth.store.ts
├─ events.store.ts
├─ points.store.ts

```

**Responsibilities**
- Business logic (check-in, points, validation)
- State management
- Permission checks
- Data fetching

**Rules**
- No UI
- No raw SQL
- Calls Supabase or Edge Functions only
- Organized by domain

---

## 6. DATA ACCESS (SUPABASE)

```

lib/
├─ supabase.ts        # client initialization (reads from .env)
├─ eventsService.ts   # Event CRUD
└─ profileService.ts  # Profile CRUD

```

**Type System:**
- `EventDB`: Database schema (snake_case, matches Supabase)
- `EventUI`: Frontend schema (camelCase, optimized for React Native)
- Mapping utilities in `utils/events.ts`

Used for:
- Reading events (EventDB → EventUI mapping)
- Reading feed
- Reading/updating profiles
- Storage uploads

Example:
```ts
// Database query returns EventDB
const { data } = await supabase.from('shpe_events').select('*')
// Map to EventUI for frontend
const uiEvents = data.map(mapEventDBToUI)
```

**All reads are protected by RLS.**

**Environment:**
- Supabase credentials loaded from `frontend/.env`
- No hardcoded keys in source code

---

## 7. BACKEND COMPUTE (EDGE FUNCTIONS)

These are the **only true backend APIs** in MVP.

```
supabase/
 └─ functions/
     ├─ check-in/
     │   └─ index.ts
     └─ admin-event/
         └─ index.ts
```

**Note:** Points awarding is handled by the `award_points` Postgres RPC function, not an Edge Function.

### Edge Functions Handle

* QR check-in (atomic + secure)
* Event open / close
* Admin-only mutations

**Why**

* Prevent cheating
* Enforce invariants
* Keep logic trusted

---

## 8. STORAGE (SUPABASE)

```
Buckets:
- profile-pictures/
- event-photos/
```

Used for:

* Profile images
* Event highlight uploads

Policies:

* Auth required
* Upload allowed only after check-in (enforced via Edge Function or RLS)

---

## 9. PLATFORM / DEVICE SERVICES

```
services/
 ├─ camera.service.ts          # QR scanning
 ├─ photo.service.ts            # Image picker (PhotoHelper)
 ├─ deviceCalendar.service.ts   # Calendar integration
 ├─ registration.service.ts     # Event registration
 └─ share.service.ts            # Native sharing
```

**Rules**

* No business logic
* No Supabase calls
* Device abstraction only
* Returns raw data/results

---

## 10. DATABASE (MVP TABLES)

```
users
events
rsvps
check_ins
points
photos
feed_items
```

**Prepared for post-MVP**

* `metadata` JSONB columns
* `source_type` enums
* `actor_id` / `target_id` patterns

This allows AI enrichment later without schema changes.

---

## 11. PREPARED AI / INTELLIGENCE LAYER (POST-MVP)

⚠️ **NOT IMPLEMENTED IN MVP**

Designed boundary only.

```
intelligence/              # NOT in mobile app
 ├─ ingestion/
 ├─ enrichment/
 ├─ scoring/
 └─ insights/
```

Future responsibilities:

* Facial recognition
* Resume parsing
* LinkedIn enrichment
* CARLA insights
* Recommendation systems

**Integration method**

* Writes to existing tables
* Triggers via background jobs
* Read-only for mobile app initially

---

## 12. NON-NEGOTIABLE RULES

* No AI code in MVP
* No REST server
* No business logic in UI
* No client-side points mutation
* All sensitive logic = Edge Functions
* Reads protected via RLS

---

## 13. MVP SCOPE SUMMARY

### INCLUDED (2 WEEKS)

* Events
* RSVP
* QR check-in
* Points
* Feed
* Profiles
* Admin controls

### EXCLUDED (POST-MVP)

* Facial recognition
* Resume parsing
* LinkedIn scraping
* Recommendations
* CARLA AI
