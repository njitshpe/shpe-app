# `/types/` - Shared TypeScript Types

## Purpose
Centralized type definitions for the **entire app**.

## Rules
- ✅ Define all data structures
- ✅ Keep types in sync with database schema
- ✅ Export from index.ts for easy imports
- ❌ No logic/functions (types only)

## Planned Type Files

```
types/
├── database.types.ts          # Supabase generated types
├── user.types.ts              # User, Profile, Role
├── event.types.ts             # Event, RSVP, CheckIn
├── points.types.ts            # PointsTransaction, Ranking
├── feed.types.ts              # FeedItem, Highlight
├── api.types.ts               # Edge Function request/response
└── index.ts                   # Re-export all types
```

## Database Types (Generated)

```typescript
// types/database.types.ts
// Generated from Supabase CLI:
// npx supabase gen types typescript --project-id <id> > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string
          role: 'member' | 'alumni' | 'admin'
          // ... auto-generated from schema
        }
        Insert: {
          // ... insert types
        }
        Update: {
          // ... update types
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          location: string
          points: number
          check_in_open: boolean
          // ...
        }
        // ...
      }
      // ... other tables
    }
  }
}
```

## User Types

```typescript
// types/user.types.ts
import { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']

export type UserRole = 'member' | 'alumni' | 'admin'

export type MemberType = 
  | 'undergrad_njit'
  | 'undergrad_other'
  | 'alumni_njit'
  | 'alumni_other'

export interface Profile extends User {
  bio?: string
  major?: string
  graduation_year?: number
  resume_url?: string
  profile_picture_url?: string
  linkedin_url?: string
  total_points: number
  rank: number
}

export interface UserStats {
  total_events_attended: number
  total_points: number
  current_rank: number
  photos_uploaded: number
  connections_count: number
}
```

## Event Types

```typescript
// types/event.types.ts
import { Database } from './database.types'

export type Event = Database['public']['Tables']['events']['Row']

export interface EventWithRSVP extends Event {
  user_rsvp: RSVP | null
  user_checked_in: boolean
  rsvp_count: number
  checked_in_count: number
}

export interface RSVP {
  id: string
  user_id: string
  event_id: string
  created_at: string
  status: 'going' | 'maybe' | 'not_going'
}

export interface CheckIn {
  id: string
  user_id: string
  event_id: string
  checked_in_at: string
  qr_data: string
  points_awarded: number
}

export interface EventHighlight {
  id: string
  event_id: string
  user_id: string
  photo_url: string
  caption?: string
  points_awarded: number
  created_at: string
  user: {
    name: string
    profile_picture_url?: string
  }
}
```

## Points Types

```typescript
// types/points.types.ts

export type PointsActionType = 
  | 'event_attendance'
  | 'feedback_submission'
  | 'photo_upload'
  | 'photo_with_alumni'
  | 'photo_with_professional'
  | 'photo_with_member_of_month'

export interface PointsTransaction {
  id: string
  user_id: string
  amount: number
  action_type: PointsActionType
  description: string
  event_id?: string
  created_at: string
}

export interface PointsBalance {
  user_id: string
  total_points: number
  rank: number
  percentile: number
}

export interface Ranking {
  rank: number
  user_id: string
  user_name: string
  profile_picture_url?: string
  total_points: number
  member_type: string
}

export interface LeaderboardEntry extends Ranking {
  is_current_user: boolean
}
```

## Feed Types

```typescript
// types/feed.types.ts

export type FeedItemType = 
  | 'event_highlight'
  | 'announcement'
  | 'member_spotlight'
  | 'achievement'

export interface FeedItem {
  id: string
  type: FeedItemType
  title: string
  content: string
  image_url?: string
  created_at: string
  metadata?: Record<string, any>
}

export interface EventHighlightFeedItem extends FeedItem {
  type: 'event_highlight'
  event_id: string
  event_title: string
  photo_url: string
  user_id: string
  user_name: string
  points_earned: number
}

export interface AnnouncementFeedItem extends FeedItem {
  type: 'announcement'
  priority: 'low' | 'medium' | 'high'
  action_url?: string
}

export interface MemberSpotlightFeedItem extends FeedItem {
  type: 'member_spotlight'
  user_id: string
  user_name: string
  profile_picture_url?: string
  achievement: string
  spotlight_type: 'member_of_month' | 'committee_member_of_week'
}
```

## API Types (Edge Functions)

```typescript
// types/api.types.ts

// Check-in API
export interface CheckInRequest {
  event_id: string
  qr_data: string
}

export interface CheckInResponse {
  success: boolean
  check_in_id: string
  points_awarded: number
  message: string
}

// Award Points API
export interface AwardPointsRequest {
  user_id: string
  amount: number
  action_type: string
  event_id?: string
  description: string
}

export interface AwardPointsResponse {
  success: boolean
  transaction_id: string
  new_balance: number
  new_rank: number
}

// Admin Event Control API
export interface EventControlRequest {
  event_id: string
  action: 'open_checkin' | 'close_checkin' | 'approve_photo' | 'delete_event'
  photo_id?: string
}

export interface EventControlResponse {
  success: boolean
  message: string
}

// Generic API Error
export interface APIError {
  error: string
  message: string
  code?: string
}
```

## Utility Types

```typescript
// types/index.ts

// Re-export all types
export * from './database.types'
export * from './user.types'
export * from './event.types'
export * from './points.types'
export * from './feed.types'
export * from './api.types'

// Generic utility types
export type ID = string

export type Timestamp = string // ISO 8601 format

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type AsyncResult<T> = {
  data: T | null
  error: Error | null
  loading: boolean
}
```

## Form Types

```typescript
// types/forms.types.ts

export interface EventFeedbackForm {
  event_id: string
  rating: 1 | 2 | 3 | 4 | 5
  feedback: string
  would_recommend: boolean
  topics_of_interest?: string[]
}

export interface ProfileUpdateForm {
  name?: string
  bio?: string
  major?: string
  graduation_year?: number
  linkedin_url?: string
}

export interface PhotoUploadForm {
  event_id: string
  photo_uri: string
  caption?: string
  tagged_users?: string[]
}
```

## Validation Schemas (Future)

```typescript
// types/validation.types.ts
import { z } from 'zod'

export const EventFeedbackSchema = z.object({
  event_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  feedback: z.string().min(10).max(500),
  would_recommend: z.boolean(),
  topics_of_interest: z.array(z.string()).optional(),
})

export type EventFeedback = z.infer<typeof EventFeedbackSchema>
```

## Best Practices

### 1. Generate Database Types
Always regenerate when schema changes:
```bash
npx supabase gen types typescript --project-id <id> > types/database.types.ts
```

### 2. Extend Base Types
Build on generated types:
```typescript
// Good
export interface EventWithRSVP extends Event {
  user_rsvp: RSVP | null
}

// Bad: Redefining entire type
export interface EventWithRSVP {
  id: string
  title: string
  // ... duplicating Event fields
}
```

### 3. Use Discriminated Unions
For polymorphic types:
```typescript
export type FeedItem = 
  | EventHighlightFeedItem
  | AnnouncementFeedItem
  | MemberSpotlightFeedItem

// TypeScript can now narrow types based on 'type' field
```

### 4. Export from Index
Centralize exports:
```typescript
// types/index.ts
export * from './user.types'
export * from './event.types'
// ...

// Usage
import { User, Event, PointsTransaction } from '@/types'
```

### 5. Document Complex Types
Add JSDoc comments:
```typescript
/**
 * Represents a user's complete profile with computed stats
 * @property total_points - Sum of all points transactions
 * @property rank - Current leaderboard position (1-indexed)
 */
export interface Profile extends User {
  // ...
}
```

## Type Safety Patterns

### Optional Chaining
```typescript
const userName = user?.profile?.name ?? 'Anonymous'
```

### Type Guards
```typescript
function isEventHighlight(item: FeedItem): item is EventHighlightFeedItem {
  return item.type === 'event_highlight'
}

if (isEventHighlight(feedItem)) {
  // TypeScript knows it's EventHighlightFeedItem
  console.log(feedItem.event_id)
}
```

### Generic Async Patterns
```typescript
export type AsyncResult<T> = {
  data: T | null
  error: Error | null
  loading: boolean
}

// Usage
const result: AsyncResult<User[]> = await fetchUsers()
```

## What Goes Here
- Database table types (generated)
- Domain model types
- API request/response types
- Form types
- Utility types
- Type guards
- Validation schemas

## What Does NOT Go Here
- Functions/logic → Use `utils/` or `hooks/`
- React components → Use `components/`
- Constants → Use `utils/constants.ts`
- Configuration → Use root config files
