# award-points Edge Function

**Purpose**: Data-driven points system with automatic event-based triggering.

## Architecture Overview

```
FRONTEND
========
Component emits event:
  eventBus.emit('user.checked_in', userId, { eventId })
              |
              v
EventBus notifies PointsListener
              |
              v
PointsListener maps event to action_type:
  'user.checked_in' --> 'attendance'
              |
              v
Calls Edge Function
              |
==============|===============================================
              |
EDGE FUNCTION (award-points)
==============================
              |
              v
1. Authenticate user (JWT)
2. Query rank_rules table for action_type
3. Check preconditions (committee, duplicates, limits)
4. Award points atomically
5. Update user rank if threshold crossed
              |
==============|===============================================
              |
DATABASE
========
              v
rank_rules table (DATA-DRIVEN CONFIG):

| action_type  | points | requires_committee | max_per_day | active |
|--------------|--------|--------------------|-------------|--------|
| attendance   | 3      | true               | 2           | true   |
| rsvp         | 1      | false              | null        | true   |
| photo_upload | 2      | true               | 3           | true   |
| feedback     | 2      | false              | 1           | true   |

^ Change this table = change point rules (no code changes!)
```

## How It Works

### 1. Components Emit Events (Generic)

Components emit events when actions happen. **No knowledge of points required.**

```typescript
// In check-in screen
import { eventBus } from '@/services';

async function handleCheckIn(eventId: string) {
  await checkInService.checkIn(eventId);
  
  // Just emit - that's it!
  eventBus.emit('user.checked_in', userId, { eventId });
}
```

### 2. PointsListener Catches Events

The listener (started automatically at app launch) maps events to action types:

```typescript
// Mapping in pointsListener.service.ts
const ACTION_TYPE_MAP = {
  'user.checked_in': 'attendance',
  'user.rsvp': 'rsvp',
  'user.photo_uploaded': 'photo_upload',
  'user.feedback_submitted': 'feedback',
  'user.profile_updated': null,  // No points for this
};
```

### 3. Edge Function Queries Rules

The Edge Function queries the `rank_rules` table to determine points:

```sql
SELECT * FROM rank_rules 
WHERE action_type = 'attendance' AND is_active = true;
```

### 4. Points Awarded Based on Rules

- If rule exists → award points
- If `requires_committee = true` and user isn't committee → points awarded but rank frozen
- If `max_per_day` exceeded → reject as duplicate
- If no rule exists → no points awarded

## Event Types

| Event Type | Maps To | Description |
|------------|---------|-------------|
| `user.checked_in` | `attendance` | User checked into event |
| `user.rsvp` | `rsvp` | User RSVPed to event |
| `user.photo_uploaded` | `photo_upload` | User uploaded event photo |
| `user.feedback_submitted` | `feedback` | User submitted event feedback |
| `user.early_checkin` | `early_checkin` | User checked in before start time |
| `user.profile_completed` | `verified` | User completed profile setup |
| `user.profile_updated` | `null` | No points (just tracking) |

## Rank Tiers

| Rank | Points Range |
|------|--------------|
| Unranked | 0 - 24 |
| Bronze | 25 - 49 |
| Silver | 50 - 74 |
| Gold | 75 - 100 |

## Request Schema

```typescript
{
  "action_type": "attendance",
  "metadata": {
    "event_id": "event-abc123",
    "photoType": "alumni"  // Optional: for photo multipliers
  }
}
```

## Response Schema

```typescript
// Success
{
  "success": true,
  "transaction": {
    "id": "txn-xyz789",
    "userId": "user-def456",
    "amount": 3,
    "reason": "attendance",
    "createdAt": "2026-01-06T19:00:00Z"
  },
  "newBalance": 28,
  "rank": "bronze",
  "reasons": ["Awarded 3 points for attendance"]
}

// No points awarded (valid rejection)
{
  "success": true,
  "transaction": null,
  "message": "No rule found for action type",
  "newBalance": 25,
  "rank": "bronze"
}

// Error
{
  "success": false,
  "error": "Already awarded points for this action",
  "code": "ALREADY_REWARDED"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid JWT |
| `INVALID_ACTION_TYPE` | Action type not in allowed list |
| `ALREADY_REWARDED` | Duplicate action (max_per_event exceeded) |
| `DAILY_LIMIT_REACHED` | max_per_day exceeded |
| `RULES_NOT_FOUND` | No active rule for this action type |

## Database Tables

### rank_rules

Stores the point rules (data-driven configuration):

```sql
CREATE TABLE rank_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  requires_committee BOOLEAN DEFAULT false,
  max_per_day INTEGER,
  max_per_event INTEGER,
  multipliers JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### rank_transactions

Audit trail of all point awards:

```sql
CREATE TABLE rank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  event_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### user_profiles (columns added)

```sql
ALTER TABLE user_profiles ADD COLUMN rank_points INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN rank TEXT DEFAULT 'unranked';
```

## Managing Rules (No Code Changes!)

### Add a new rule

```sql
INSERT INTO rank_rules (action_type, points, requires_committee, max_per_day)
VALUES ('workshop_attendance', 5, true, 1);
```

### Change point values

```sql
UPDATE rank_rules SET points = 5 WHERE action_type = 'attendance';
```

### Disable a rule temporarily

```sql
UPDATE rank_rules SET is_active = false WHERE action_type = 'photo_upload';
```

### Add photo multipliers

```sql
UPDATE rank_rules 
SET multipliers = '{"alumni": 2, "professional": 3, "member_of_month": 4}'
WHERE action_type = 'photo_upload';
```

## Adding a New Action Type

If you need a **completely new** action type:

1. **Add event type** in `eventBus.service.ts`:
   ```typescript
   export type ActionType = 
     | 'user.checked_in'
     | 'user.workshop_attended'  // ← Add this
     // ...
   ```

2. **Add mapping** in `pointsListener.service.ts`:
   ```typescript
   const ACTION_TYPE_MAP = {
     'user.workshop_attended': 'workshop_attendance',  // ← Add this
     // ...
   };
   ```

3. **Add action type** in `rank.service.ts`:
   ```typescript
   export type RankActionType = 
     | 'attendance'
     | 'workshop_attendance'  // ← Add this
     // ...
   ```

4. **Insert rule** in database:
   ```sql
   INSERT INTO rank_rules (action_type, points, requires_committee)
   VALUES ('workshop_attendance', 5, true);
   ```

5. **Emit event** in component:
   ```typescript
   eventBus.emit('user.workshop_attended', userId, { workshopId });
   ```

## Testing Locally

```bash
# Start Edge Function
supabase functions serve award-points

# Test attendance
curl -X POST http://localhost:54321/functions/v1/award-points \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action_type": "attendance", "metadata": {"event_id": "123"}}'
```

## Frontend Testing (No Database)

Run the test script to verify logic without database:

```bash
cd frontend
npx tsx test-rank-logic.ts
```

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Edge Function entry point |
| `ruleEngine.ts` | Pure computation module |
| `migration.sql` | SQL to create tables and seed rules |
| `README.md` | This file |

## Security

- ✅ JWT authentication required
- ✅ User can only award points to themselves
- ✅ Duplicate prevention via unique constraints
- ✅ Atomic transactions (points + rank update)
- ✅ Full audit trail in rank_transactions
- ✅ RLS policies on all tables
