# /store/ - Global State Management (Zustand)

**Purpose**: Centralized state for cross-component data

**Rules**:
- ✅ Use Zustand for global state
- ✅ Keep stores focused (single responsibility)
- ❌ No UI logic in stores

**Planned Stores**:
```
store/
├── auth.store.ts              # User session, profile, role
├── events.store.ts            # Events cache, filters
├── points.store.ts            # Points balance, history
├── feed.store.ts              # Feed items cache
└── ui.store.ts                # Modal states, loading flags
```

**Store Pattern**:
```typescript
// Example: auth.store.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  session: Session | null
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  clearAuth: () => set({ user: null, session: null })
}))
```

**When to Use Stores vs Hooks**:
- **Store**: Cross-component state (auth, global UI, cache)
- **Hook**: Component-specific data fetching, local state

**Best Practices**:
- Keep stores small and focused
- Use selectors to prevent unnecessary re-renders
- Sync with Supabase auth state changes
- Persist important state (auth session) if needed
