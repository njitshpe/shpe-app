# /supabase/functions/ - Edge Functions (Backend Compute)

**Purpose**: Serverless backend APIs for secure, atomic operations

**Why Edge Functions?**
- Prevent client-side cheating
- Enforce business rules server-side
- Handle sensitive operations (points, check-ins)
- Protect against unauthorized mutations

**Planned Functions**:
```
supabase/functions/
├── check-in/
│   └── index.ts               # QR check-in validation & recording
└── admin-event/
    └── index.ts               # Admin-only event mutations
```

**Note:** Points awarding is handled by the `award_points` Postgres RPC function (not an Edge Function).

**Function Responsibilities**:

## check-in/
**Purpose**: Validate and record event check-ins

**Workflow**:
1. Receive QR code + user ID
2. Validate QR code matches an event
3. Check event check-in is open
4. Verify user hasn't already checked in
5. Record check-in atomically
6. Return success (points awarded separately via `award_points` RPC)

**Security**:
- Verify user authentication
- Prevent duplicate check-ins
- Enforce time windows (event must be active)

## admin-event/
**Purpose**: Admin-only event management operations

**Operations**:
- Open/close event check-in
- Create new events
- Update event details
- Delete events
- Approve event highlights

**Security**:
- Verify user has admin role
- Validate all mutations
- Log admin actions

**Edge Function Pattern**:
```typescript
// Example: check-in/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { qrCode, userId } = await req.json()

  // Initialize Supabase client with service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Business logic here
  // ...

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Deployment**:
```bash
supabase functions deploy check-in
supabase functions deploy admin-event
```

**Testing**:
```bash
supabase functions serve check-in
curl -X POST http://localhost:54321/functions/v1/check-in \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "event-123", "userId": "user-456"}'
```
