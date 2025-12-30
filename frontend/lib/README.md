# /lib/ - Supabase Client & Data Services

**Purpose**: Supabase initialization and data access layer

**Contents**:
```
lib/
├── supabase.ts                  # Supabase client (reads from .env)
├── eventsService.ts             # Event CRUD operations
├── profileService.ts            # Profile CRUD operations
├── eventNotificationHelper.ts   # Event notification helpers
└── notificationService.ts       # Notification management
```

**Responsibilities**:
- Initialize Supabase client from environment variables
- Data access layer (CRUD operations)
- Service functions for business domains
- NO raw SQL in components/hooks

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

**Environment Configuration**:
- Supabase credentials loaded from `frontend/.env`
- `EXPO_PUBLIC_SUPABASE_URL` - Project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key
- Never hardcode credentials in source

**Import Pattern**:
```typescript
// In hooks/components
import { supabase } from '@/lib/supabase'
import { eventsService } from '@/lib/eventsService'

// Read data (protected by RLS)
const { data } = await supabase.from('events').select('*')
```
