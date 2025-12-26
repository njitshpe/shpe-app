# `/app/` - Expo Router (Navigation Only)

## Purpose
File-based routing using Expo Router. Routes handle **navigation and auth gating ONLY**.

## Rules
- ❌ **NO Supabase calls**
- ❌ **NO business logic**
- ✅ Auth gating only
- ✅ Navigation structure

## Structure
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

## What Goes Here
- Route files (`.tsx`)
- Layout files (`_layout.tsx`)
- Auth guards (check user role/auth state)
- Navigation configuration

## What Does NOT Go Here
- Database queries (use `hooks/`)
- Business logic (use `hooks/`)
- UI components (use `components/`)
- API calls (use `lib/` or `services/`)

## Example Route Pattern
```tsx
// app/(tabs)/calendar.tsx
import { useEvents } from '@/hooks/useEvents'
import { EventCard } from '@/components/EventCard'

export default function CalendarScreen() {
  const { events, loading } = useEvents()
  
  return (
    <View>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </View>
  )
}
```

Routes call hooks → Hooks call Supabase → Routes render components
