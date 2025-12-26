# `/supabase/functions/` - Edge Functions (Backend Compute)

## Purpose
Serverless backend APIs for **secure, atomic operations** that cannot be trusted to the client.

## Why Edge Functions?
1. **Security**: Prevent client-side cheating
2. **Atomicity**: Ensure data consistency
3. **Business Rules**: Enforce invariants server-side
4. **Sensitive Operations**: Handle points, check-ins, admin actions

## Rules
- ✅ Use for all sensitive mutations (points, check-ins)
- ✅ Validate all inputs
- ✅ Return consistent response format
- ✅ Handle errors gracefully
- ❌ Never trust client data
- ❌ Never skip permission checks

## Planned Edge Functions

```
supabase/functions/
├── check-in/
│   └── index.ts               # QR check-in validation & recording
├── award-points/
│   └── index.ts               # Points awarding logic
└── admin-event/
    └── index.ts               # Admin-only event mutations
```

---

## Check-In Function

**Endpoint**: `POST /check-in`

**Purpose**: Validate and record event check-ins via QR code

**Request**:
```json
{
  "event_id": "uuid",
  "qr_data": "encrypted_event_qr_string"
}
```

**Responsibilities**:
1. Validate QR code matches event
2. Check event check-in is currently open
3. Prevent duplicate check-ins
4. Record check-in atomically
5. Award attendance points
6. Return success/error response

**Implementation**:
```typescript
// supabase/functions/check-in/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CheckInRequest {
  event_id: string
  qr_data: string
}

interface CheckInResponse {
  success: boolean
  check_in_id?: string
  points_awarded?: number
  message: string
}

serve(async (req) => {
  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { event_id, qr_data }: CheckInRequest = await req.json()

    // 1. Validate event exists and is open for check-in
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, check_in_open, qr_secret')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ success: false, message: 'Event not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!event.check_in_open) {
      return new Response(
        JSON.stringify({ success: false, message: 'Check-in is not open for this event' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Validate QR code
    if (qr_data !== event.qr_secret) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid QR code' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Check for duplicate check-in
    const { data: existingCheckIn } = await supabase
      .from('check_ins')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .single()

    if (existingCheckIn) {
      return new Response(
        JSON.stringify({ success: false, message: 'Already checked in to this event' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Record check-in (atomic)
    const { data: checkIn, error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        event_id,
        user_id: user.id,
        qr_data,
        checked_in_at: new Date().toISOString()
      })
      .select()
      .single()

    if (checkInError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to record check-in' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Award attendance points
    const ATTENDANCE_POINTS = 10
    const { data: pointsTransaction, error: pointsError } = await supabase
      .from('points')
      .insert({
        user_id: user.id,
        amount: ATTENDANCE_POINTS,
        action_type: 'event_attendance',
        event_id,
        description: `Attended event: ${event_id}`
      })
      .select()
      .single()

    if (pointsError) {
      console.error('Failed to award points:', pointsError)
      // Don't fail the check-in if points fail
    }

    // 6. Return success
    const response: CheckInResponse = {
      success: true,
      check_in_id: checkIn.id,
      points_awarded: ATTENDANCE_POINTS,
      message: 'Successfully checked in!'
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Check-in error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Award Points Function

**Endpoint**: `POST /award-points`

**Purpose**: Award points for various actions with multipliers

**Request**:
```json
{
  "user_id": "uuid",
  "action_type": "photo_upload",
  "event_id": "uuid",
  "metadata": {
    "has_alumni": true,
    "has_professional": false,
    "has_member_of_month": false
  }
}
```

**Responsibilities**:
1. Validate user is eligible for points
2. Calculate points based on action type and multipliers
3. Record points transaction
4. Update user's total points
5. Recalculate rank (if needed)

**Implementation**:
```typescript
// supabase/functions/award-points/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const POINTS_VALUES = {
  EVENT_ATTENDANCE: 10,
  FEEDBACK_SUBMISSION: 5,
  PHOTO_UPLOAD: 5,
  PHOTO_WITH_ALUMNI: 10,
  PHOTO_WITH_PROFESSIONAL: 15,
  PHOTO_WITH_MEMBER_OF_MONTH: 20,
}

interface AwardPointsRequest {
  user_id: string
  action_type: string
  event_id?: string
  metadata?: {
    has_alumni?: boolean
    has_professional?: boolean
    has_member_of_month?: boolean
  }
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { action_type, event_id, metadata }: AwardPointsRequest = await req.json()

    // Calculate points based on action type
    let points = 0
    
    switch (action_type) {
      case 'event_attendance':
        points = POINTS_VALUES.EVENT_ATTENDANCE
        break
      
      case 'feedback_submission':
        points = POINTS_VALUES.FEEDBACK_SUBMISSION
        break
      
      case 'photo_upload':
        // Apply multipliers
        if (metadata?.has_member_of_month) {
          points = POINTS_VALUES.PHOTO_WITH_MEMBER_OF_MONTH
        } else if (metadata?.has_professional) {
          points = POINTS_VALUES.PHOTO_WITH_PROFESSIONAL
        } else if (metadata?.has_alumni) {
          points = POINTS_VALUES.PHOTO_WITH_ALUMNI
        } else {
          points = POINTS_VALUES.PHOTO_UPLOAD
        }
        break
      
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid action type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    // Record points transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('points')
      .insert({
        user_id: user.id,
        amount: points,
        action_type,
        event_id,
        description: `Points for ${action_type}`,
        metadata
      })
      .select()
      .single()

    if (transactionError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to award points' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get updated total points
    const { data: allPoints } = await supabase
      .from('points')
      .select('amount')
      .eq('user_id', user.id)

    const totalPoints = allPoints?.reduce((sum, p) => sum + p.amount, 0) || 0

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        points_awarded: points,
        new_balance: totalPoints,
        message: `Awarded ${points} points!`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Award points error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Admin Event Function

**Endpoint**: `POST /admin-event`

**Purpose**: Admin-only event control (open/close check-in, approve photos, etc.)

**Request**:
```json
{
  "event_id": "uuid",
  "action": "open_checkin" | "close_checkin" | "approve_photo" | "delete_event",
  "photo_id": "uuid" // required for approve_photo
}
```

**Responsibilities**:
1. Verify user is admin
2. Execute requested admin action
3. Log admin activity
4. Return success/error response

**Implementation**:
```typescript
// supabase/functions/admin-event/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdminEventRequest {
  event_id: string
  action: 'open_checkin' | 'close_checkin' | 'approve_photo' | 'delete_event'
  photo_id?: string
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { event_id, action, photo_id }: AdminEventRequest = await req.json()

    let result
    let message = ''

    switch (action) {
      case 'open_checkin':
        result = await supabase
          .from('events')
          .update({ check_in_open: true })
          .eq('id', event_id)
        message = 'Check-in opened'
        break

      case 'close_checkin':
        result = await supabase
          .from('events')
          .update({ check_in_open: false })
          .eq('id', event_id)
        message = 'Check-in closed'
        break

      case 'approve_photo':
        if (!photo_id) {
          return new Response(
            JSON.stringify({ success: false, message: 'photo_id required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
        result = await supabase
          .from('photos')
          .update({ approved: true })
          .eq('id', photo_id)
        message = 'Photo approved'
        break

      case 'delete_event':
        result = await supabase
          .from('events')
          .delete()
          .eq('id', event_id)
        message = 'Event deleted'
        break

      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    if (result.error) {
      return new Response(
        JSON.stringify({ success: false, message: `Failed to ${action}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin event error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Testing Edge Functions

### Local Testing
```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve check-in --env-file .env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/check-in' \
  --header 'Authorization: Bearer YOUR_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"event_id":"...","qr_data":"..."}'
```

### Deployment
```bash
# Deploy single function
supabase functions deploy check-in

# Deploy all functions
supabase functions deploy
```

---

## Best Practices

### 1. Always Authenticate
```typescript
const authHeader = req.headers.get('Authorization')!
const token = authHeader.replace('Bearer ', '')
const { data: { user }, error } = await supabase.auth.getUser(token)

if (error || !user) {
  return new Response('Unauthorized', { status: 401 })
}
```

### 2. Validate All Inputs
```typescript
if (!event_id || !qr_data) {
  return new Response(
    JSON.stringify({ success: false, message: 'Missing required fields' }),
    { status: 400 }
  )
}
```

### 3. Use Service Role for Mutations
```typescript
// Service role bypasses RLS
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
```

### 4. Handle Errors Gracefully
```typescript
try {
  // Operation
} catch (error) {
  console.error('Error:', error)
  return new Response(
    JSON.stringify({ success: false, message: 'Internal server error' }),
    { status: 500 }
  )
}
```

### 5. Return Consistent Format
```typescript
interface Response {
  success: boolean
  message: string
  data?: any
}
```

---

## Environment Variables

Create `.env.local` for local development:
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## What Goes Here
- QR check-in validation
- Points awarding (all types)
- Admin-only mutations
- Event control (open/close check-in)
- Photo approval
- Sensitive calculations
- Business rule enforcement

## What Does NOT Go Here
- Read operations (use RLS-protected queries)
- UI logic (use components)
- Client-side validations (use utils)
- Device interactions (use services)
