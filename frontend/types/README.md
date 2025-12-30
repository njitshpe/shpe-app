# /types/ - Shared TypeScript Types

**Purpose**: Centralized type definitions for the entire app

**Current Types**:
```
types/
├── attendee.ts         # Event attendee types
├── auth.ts             # Authentication types
├── calendar.ts         # Calendar & date types
├── camera.ts           # Camera/QR scanner types
├── errors.ts           # Error handling & ServiceResponse
├── events.ts           # EventDB, EventUI, Event types
├── notifications.ts    # Notification types
└── userProfile.ts      # User profile types
```

**Type Organization**:

## events.ts (Critical - Dual Schema)
```typescript
// Database schema (snake_case, matches Supabase)
export interface EventDB {
  id: string
  event_id: string
  name: string
  start_time: string
  end_time: string
  location: string
  // ... more DB fields
}

// UI schema (camelCase, optimized for React Native)
export interface EventUI {
  id: string
  title: string
  startTimeISO: string
  endTimeISO: string
  locationName: string
  tags: string[]
  status: 'upcoming' | 'past'
  // ... more UI fields
}

// Backward compatibility alias
export type Event = EventUI;
```

## userProfile.ts
```typescript
export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  user_type: 'student' | 'alumni' | 'other'
  bio?: string
  profile_picture_url?: string
  resume_url?: string
  // ... more fields
}
```

## errors.ts
```typescript
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: { message: string }
}

export type ValidationError = {
  field: string
  title: string
  message: string
}
```

## calendar.ts
```typescript
export interface CalendarDate {
  date: Date
  dayOfWeek: string
  dayNumber: number
  isToday: boolean
}

export interface CalendarTheme {
  background: string
  selectedDateBackground: string
  selectedDateText: string
  // ... more theme fields
}
```

**Best Practices**:
- Keep types DRY (Don't Repeat Yourself)
- Use descriptive interface names
- Export types, interfaces, and enums
- Use strict TypeScript settings
- Document complex types with comments
- Use EventDB for database queries, EventUI for React components

**Import Pattern**:
```typescript
import { EventDB, EventUI } from '@/types/events';
import { UserProfile } from '@/types/userProfile';
import { ServiceResponse, ValidationError } from '@/types/errors';
```
