# `/store/` - Global State Management (Zustand)

## Purpose
Centralized state for **cross-component data** using Zustand.

## Rules
- ✅ Use Zustand for global state
- ✅ Keep stores focused (single responsibility)
- ✅ Expose actions alongside state
- ❌ No UI logic in stores

## Why Zustand?
- Lightweight (no providers needed)
- TypeScript-friendly
- DevTools support
- Simple API

## Planned Stores

```
store/
├── auth.store.ts              # User session, profile, role
├── events.store.ts            # Events cache, filters
├── points.store.ts            # Points balance, history
├── feed.store.ts              # Feed items cache
└── ui.store.ts                # Modal states, loading flags
```

## Store Pattern Example

```typescript
// store/auth.store.ts
import { create } from 'zustand'
import { User } from '@/types/user.types'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  logout: () => set({ user: null })
}))
```

## Usage in Components

```typescript
import { useAuthStore } from '@/store/auth.store'

function ProfileScreen() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  return (
    <View>
      <Text>{user?.name}</Text>
      <Button onPress={logout}>Logout</Button>
    </View>
  )
}
```

## Events Store Example

```typescript
// store/events.store.ts
import { create } from 'zustand'
import { Event } from '@/types/event.types'

interface EventsState {
  events: Event[]
  selectedEvent: Event | null
  filter: 'all' | 'upcoming' | 'past'
  
  setEvents: (events: Event[]) => void
  setSelectedEvent: (event: Event | null) => void
  setFilter: (filter: 'all' | 'upcoming' | 'past') => void
  
  // Computed/derived values
  filteredEvents: () => Event[]
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  selectedEvent: null,
  filter: 'upcoming',
  
  setEvents: (events) => set({ events }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setFilter: (filter) => set({ filter }),
  
  filteredEvents: () => {
    const { events, filter } = get()
    const now = new Date()
    
    switch (filter) {
      case 'upcoming':
        return events.filter(e => new Date(e.date) >= now)
      case 'past':
        return events.filter(e => new Date(e.date) < now)
      default:
        return events
    }
  }
}))
```

## Points Store Example

```typescript
// store/points.store.ts
import { create } from 'zustand'
import { PointsTransaction } from '@/types/points.types'

interface PointsState {
  balance: number
  history: PointsTransaction[]
  rank: number | null
  
  setBalance: (balance: number) => void
  setHistory: (history: PointsTransaction[]) => void
  setRank: (rank: number | null) => void
  
  addPoints: (amount: number) => void
}

export const usePointsStore = create<PointsState>((set, get) => ({
  balance: 0,
  history: [],
  rank: null,
  
  setBalance: (balance) => set({ balance }),
  setHistory: (history) => set({ history }),
  setRank: (rank) => set({ rank }),
  
  addPoints: (amount) => {
    const currentBalance = get().balance
    set({ balance: currentBalance + amount })
  }
}))
```

## UI Store Example

```typescript
// store/ui.store.ts
import { create } from 'zustand'

interface UIState {
  isCheckInModalOpen: boolean
  isPhotoUploadModalOpen: boolean
  globalLoading: boolean
  
  openCheckInModal: () => void
  closeCheckInModal: () => void
  openPhotoUploadModal: () => void
  closePhotoUploadModal: () => void
  setGlobalLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isCheckInModalOpen: false,
  isPhotoUploadModalOpen: false,
  globalLoading: false,
  
  openCheckInModal: () => set({ isCheckInModalOpen: true }),
  closeCheckInModal: () => set({ isCheckInModalOpen: false }),
  openPhotoUploadModal: () => set({ isPhotoUploadModalOpen: true }),
  closePhotoUploadModal: () => set({ isPhotoUploadModalOpen: false }),
  setGlobalLoading: (loading) => set({ globalLoading: loading })
}))
```

## When to Use Stores vs Hooks

### Use Stores When:
- State needs to be accessed in multiple unrelated components
- State needs to persist across navigation
- You need to avoid prop drilling

### Use Hooks When:
- State is local to a screen/component
- Data is fetched and used immediately
- State doesn't need to be shared

## Best Practices

### 1. Granular Selectors
Only subscribe to what you need:
```typescript
// Good: Only re-renders when user changes
const userName = useAuthStore((state) => state.user?.name)

// Bad: Re-renders on any auth state change
const { user, loading } = useAuthStore()
```

### 2. Actions Co-located with State
Keep actions in the same store:
```typescript
// Good
const logout = useAuthStore((state) => state.logout)

// Bad: Separate action function outside store
function logout() { ... }
```

### 3. Computed Values
Use getters for derived state:
```typescript
filteredEvents: () => {
  const { events, filter } = get()
  return events.filter(/* ... */)
}
```

### 4. TypeScript Everywhere
Always define interfaces for stores:
```typescript
interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}
```

## Persistence (Future)
For offline-first features, use `zustand/middleware`:
```typescript
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({ /* ... */ }),
    { name: 'auth-storage' }
  )
)
```

## DevTools Integration
```typescript
import { devtools } from 'zustand/middleware'

export const useAuthStore = create(
  devtools<AuthState>(
    (set) => ({ /* ... */ }),
    { name: 'AuthStore' }
  )
)
```

## What Goes Here
- Cross-component shared state
- User session data
- Cached API responses
- UI modal/drawer states
- Global loading indicators

## What Does NOT Go Here
- API calls → Use `hooks/`
- Business logic → Use `hooks/`
- Device interactions → Use `services/`
- Pure functions → Use `utils/`
