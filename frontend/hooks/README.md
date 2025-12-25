# /hooks/ - Business Logic (No UI)

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

**Responsibilities**:
- Data fetching via Supabase client
- State management for async operations
- Error handling
- Calling Edge Functions for sensitive operations
- NO UI rendering
