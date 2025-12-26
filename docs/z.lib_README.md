# `/lib/` - Supabase Client & Core Services

## Purpose
Supabase initialization and authentication helpers.

## Rules
- ✅ Initialize Supabase client
- ✅ Configure OAuth providers
- ✅ Auth utilities
- ❌ No business logic (use `hooks/`)
- ❌ No UI components

## Planned Files

```
lib/
├── supabase.ts                # Supabase client initialization
└── auth.ts                    # OAuth helpers (Google, LinkedIn)
```

## Supabase Client Example

```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

## Auth Helpers Example

```typescript
// lib/auth.ts
import { supabase } from './supabase'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'

WebBrowser.maybeCompleteAuthSession()

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: AuthSession.makeRedirectUri({
        scheme: 'shpe-app',
        path: 'auth/callback'
      })
    }
  })
  
  if (error) throw error
  return data
}

export async function signInWithLinkedIn() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: AuthSession.makeRedirectUri({
        scheme: 'shpe-app',
        path: 'auth/callback'
      })
    }
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
```

## Usage in Hooks

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signInWithGoogle, signOut } from '@/lib/auth'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    user: session?.user ?? null,
    loading,
    signInWithGoogle,
    signOut
  }
}
```

## Database Queries

Use the Supabase client for **reads only** (protected by RLS):

```typescript
// In a hook (hooks/useEvents.ts)
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('events')
  .select('*')
  .order('date', { ascending: true })
```

## Edge Function Calls

For **writes and sensitive operations**, use Edge Functions:

```typescript
// In a hook (hooks/useCheckIn.ts)
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.functions.invoke('check-in', {
  body: { eventId, qrData }
})
```

## Storage Operations

```typescript
// In a hook (hooks/usePhotoUpload.ts)
import { supabase } from '@/lib/supabase'

// Upload photo
const { data, error } = await supabase.storage
  .from('event-photos')
  .upload(`${eventId}/${userId}-${Date.now()}.jpg`, file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('event-photos')
  .getPublicUrl(filePath)
```

## Environment Variables

Create `.env` file in project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Type Safety

Generate types from Supabase schema:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

Then use in Supabase client:

```typescript
// lib/supabase.ts
import { Database } from '@/types/database.types'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  // ...
})
```

## Real-time Subscriptions (Future)

```typescript
// lib/supabase.ts
export function subscribeToEvents(callback: (payload: any) => void) {
  return supabase
    .channel('events')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      callback
    )
    .subscribe()
}
```

## Best Practices

1. **Single Client Instance**: Export one Supabase client, import everywhere
2. **Environment Variables**: Never hardcode credentials
3. **RLS Protection**: All reads protected by Row Level Security
4. **Edge Functions for Writes**: Never mutate sensitive data client-side
5. **Error Handling**: Always check `error` from Supabase responses

## What Goes Here
- Supabase client initialization
- OAuth configuration
- Auth state listeners
- Database type definitions
- Storage helpers

## What Does NOT Go Here
- Business logic → Use `hooks/`
- UI components → Use `components/`
- Device APIs → Use `services/`
- Data transformations → Use `utils/`
