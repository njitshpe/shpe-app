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

app/                    # Expo Router (navigation only)
components/             # UI-only reusable components
hooks/                  # Business logic (no UI)
store/                  # Global state (Zustand)
lib/                    # Supabase client + auth
services/               # Device APIs (camera, notifications)
types/                  # Shared TypeScript types
utils/                  # Small helpers
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

## 4. UI LAYER (PRESENTATION ONLY)

```

components/
├─ EventCard.tsx
├─ FeedItem.tsx
├─ ProfileHeader.tsx
├─ PointsBadge.tsx
└─ QRScanButton.tsx

```

**Rules**
- No business logic
- No Supabase
- Props in → UI out

---

## 5. APPLICATION LOGIC (CORE MVP)

```

hooks/
├─ useAuth.ts
├─ useEvents.ts
├─ useCheckIn.ts
├─ usePoints.ts
└─ useFeed.ts

```
```

store/
├─ auth.store.ts
├─ events.store.ts
├─ points.store.ts

```

**Responsibilities**
- Check-in rules
- Points updates
- Permission checks
- Derived state

**Rules**
- No UI
- No raw SQL
- Calls Supabase or Edge Functions only

---

## 6. DATA ACCESS (SUPABASE)

```

lib/
├─ supabase.ts      # client initialization
└─ auth.ts          # OAuth helpers

````

Used for:
- Reading events
- Reading feed
- Reading profiles
- Storage uploads

Example:
```ts
supabase.from('events').select('*')
````

**All reads are protected by RLS.**

---

## 7. BACKEND COMPUTE (EDGE FUNCTIONS)

These are the **only true backend APIs** in MVP.

```
supabase/
 └─ functions/
     ├─ check-in/
     │   └─ index.ts
     ├─ award-points/
     │   └─ index.ts
     └─ admin-event/
         └─ index.ts
```

### Edge Functions Handle

* QR check-in (atomic + secure)
* Points awarding
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
 ├─ camera.service.ts        # QR scanning
 ├─ photos.service.ts        # image picker
 └─ notifications.service.ts # push notifications
```

**Rules**

* No business logic
* No Supabase calls
* Device abstraction only

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
