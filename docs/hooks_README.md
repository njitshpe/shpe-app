# `/hooks/` - Business Logic (No UI)

## Purpose
Custom React hooks that encapsulate **business logic and data fetching**.

## Rules
- ❌ **NO UI/JSX**
- ❌ **NO raw SQL** (use Supabase client methods)
- ✅ Calls Supabase client or Edge Functions
- ✅ Returns data + loading states + errors
- ✅ Encapsulates business rules

## Hook Responsibilities
1. **Data Fetching**: Query Supabase tables
2. **Mutations**: Create/Update/Delete via Edge Functions
3. **Business Rules**: Check-in validation, points calculation
4. **Derived State**: Transform raw data into usable format
5. **Permission Checks**: Role-based access control

## Planned Hooks

### Core Features
- `useAuth.ts` - Authentication state & methods
- `useEvents.ts` - Events CRUD & filtering
- `useCheckIn.ts` - QR check-in logic
- `usePoints.ts` - Points calculation & display
- `useFeed.ts` - Feed data fetching
- `useProfile.ts` - Profile data & updates

### Event Management
- `useRSVP.ts` - RSVP creation & cancellation
- `useHighlights.ts` - Event photo uploads
- `useFeedback.ts` - Post-event feedback submission

### Admin Features
- `useAdmin.ts` - Admin analytics data
- `useEventControl.ts` - Open/close check-in, approve photos

### Social Features
- `useConnections.ts` - Friend requests & connections
- `useRankings.ts` - Leaderboard data

## Hook Pattern Example

```typescript
// hooks/useEvents.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types/event.types'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
        
        if (error) throw error
        setEvents(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return { events, loading, error }
}
```

## Mutation Hook Example

```typescript
// hooks/useCheckIn.ts
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useCheckIn() {
  const [loading, setLoading] = useState(false)

  async function checkIn(eventId: string, qrData: string) {
    setLoading(true)
    try {
      // Call Edge Function (NOT direct Supabase insert)
      const { data, error } = await supabase.functions.invoke('check-in', {
        body: { eventId, qrData }
      })
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Check-in failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { checkIn, loading }
}
```

## Hook with Business Logic

```typescript
// hooks/usePoints.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function usePoints() {
  const { user } = useAuth()
  const [points, setPoints] = useState(0)
  const [rank, setRank] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchPoints() {
      // Fetch user's total points
      const { data: pointsData } = await supabase
        .from('points')
        .select('amount')
        .eq('user_id', user.id)
      
      const total = pointsData?.reduce((sum, p) => sum + p.amount, 0) || 0
      setPoints(total)

      // Calculate rank (business logic)
      const { data: allUsers } = await supabase
        .from('points')
        .select('user_id, amount')
      
      // Sort users by points
      const rankings = allUsers
        ?.reduce((acc, p) => {
          acc[p.user_id] = (acc[p.user_id] || 0) + p.amount
          return acc
        }, {} as Record<string, number>)
      
      const sorted = Object.entries(rankings || {})
        .sort((a, b) => b[1] - a[1])
      
      const userRank = sorted.findIndex(([id]) => id === user.id) + 1
      setRank(userRank)
    }

    fetchPoints()
  }, [user])

  return { points, rank }
}
```

## Best Practices

### 1. Single Responsibility
Each hook does ONE thing well:
```typescript
// Good
useEvents() // Just fetches events
useRSVP()   // Just handles RSVPs

// Bad
useEventsAndRSVPs() // Too much
```

### 2. Error Handling
Always handle errors:
```typescript
try {
  const { data, error } = await supabase.from('events').select()
  if (error) throw error
} catch (err) {
  setError(err as Error)
}
```

### 3. Loading States
Always track loading:
```typescript
const [loading, setLoading] = useState(false)
```

### 4. Edge Functions for Mutations
Never mutate sensitive data directly:
```typescript
// Good: Use Edge Function
supabase.functions.invoke('award-points', { body: { userId, amount } })

// Bad: Direct insert
supabase.from('points').insert({ ... })
```

## What Goes Here
- Data fetching from Supabase
- Edge Function calls
- Business rule validation
- State management logic
- Derived calculations

## What Does NOT Go Here
- UI components → Use `components/`
- Device APIs → Use `services/`
- Pure utilities → Use `utils/`
- Global state → Use `store/`
