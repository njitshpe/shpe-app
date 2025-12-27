# /lib/ - Supabase Client & Core Services

**Purpose**: Supabase initialization and authentication helpers

**Contents**:
```
lib/
├── supabase.ts                # Supabase client initialization
└── auth.ts                    # OAuth helpers (Google, LinkedIn)
```

**Responsibilities**:
- Initialize Supabase client
- Configure OAuth providers
- Auth state management setup

**Usage Example**:
```typescript
// supabase.ts
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

**auth.ts Responsibilities**:
- OAuth provider configuration
- Sign in/sign out helpers
- Session management utilities
- Auth state listeners

**Import Pattern**:
```typescript
// In hooks/components
import { supabase } from '@/lib/supabase'

// Read data (protected by RLS)
const { data } = await supabase.from('events').select('*')
```
