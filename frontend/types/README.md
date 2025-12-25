# /types/ - Shared TypeScript Types

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

**Type Organization**:

## database.types.ts
- Auto-generated from Supabase schema
- Generated via: `supabase gen types typescript`
- DO NOT manually edit this file

## user.types.ts
```typescript
export interface User {
  id: string
  email: string
  role: UserRole
  profile: UserProfile
}

export enum UserRole {
  UNDERGRAD_NJIT = 'undergrad_njit',
  UNDERGRAD_OTHER = 'undergrad_other',
  ALUMNI_NJIT = 'alumni_njit',
  ALUMNI_OTHER = 'alumni_other',
  ADMIN = 'admin'
}

export interface UserProfile {
  full_name: string
  avatar_url?: string
  resume_url?: string
  linkedin_url?: string
  points: number
}
```

## event.types.ts
```typescript
export interface Event {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  qr_code: string
  is_check_in_open: boolean
}

export interface RSVP {
  user_id: string
  event_id: string
  created_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  event_id: string
  checked_in_at: string
  points_awarded: number
}
```

## points.types.ts
```typescript
export interface PointsTransaction {
  id: string
  user_id: string
  event_id?: string
  amount: number
  reason: PointsReason
  created_at: string
}

export enum PointsReason {
  ATTENDANCE = 'attendance',
  FEEDBACK = 'feedback',
  PHOTO_UPLOAD = 'photo_upload',
  PHOTO_WITH_ALUMNI = 'photo_with_alumni',
  PHOTO_WITH_PROFESSIONAL = 'photo_with_professional',
  PHOTO_WITH_MEMBER_OF_MONTH = 'photo_with_member_of_month'
}
```

**Best Practices**:
- Keep types DRY (Don't Repeat Yourself)
- Use database.types.ts as source of truth
- Export types, interfaces, and enums
- Use strict TypeScript settings
- Sync types with database schema regularly
