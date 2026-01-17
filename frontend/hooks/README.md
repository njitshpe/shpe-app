# /hooks/ - Business Logic (Domain-Organized)

**Purpose**: Custom React hooks that encapsulate business logic and data fetching

**Rules**:
- ❌ No UI/JSX
- ❌ No raw SQL
- ✅ Calls Supabase client or Edge Functions
- ✅ Returns data + loading states
- ✅ Organized by domain

**Structure**:
```
hooks/
├── calendar/           # Calendar-specific hooks
│   ├── useAdaptiveTheme.ts
│   └── useCalendarScroll.ts
├── events/             # Event management
│   ├── useEventAttendees.ts
│   └── useEventRegistration.ts
├── media/              # Media handling
│   └── useProfilePhoto.ts
└── profile/            # Profile management
    ├── useEditProfile.ts
    ├── useProfile.ts
    └── useResume.ts
```

**Hook Pattern**:
```typescript
// Example: useEvents.ts
export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch from Supabase
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')

      if (error) setError(error)
      else setEvents(data)
      setLoading(false)
    }

    fetchEvents()
  }, [])

  return { events, loading, error }
}
```

**Import Pattern**:
```typescript
import { useProfile, useEditProfile } from '@/hooks/profile/useProfile';
import { useEventRegistration } from '@/hooks/events/useEventRegistration';
import { useProfilePhoto } from '@/hooks/media/useProfilePhoto';
```

**Responsibilities**:
- Data fetching via Supabase client
- State management for async operations
- Error handling
- Calling Edge Functions for sensitive operations
- NO UI rendering
