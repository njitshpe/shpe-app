# /supabase/functions/award-points/ - Points Awarding Function

**Purpose**: Securely award points for user actions with proper validation

## Workflow

1. **Receive Request**
   - User ID (from auth token)
   - Action type (attendance, feedback, photo, etc.)
   - Event ID (if applicable)
   - Metadata (photo type, etc.)

2. **Validate Action**
   - Action type is valid
   - User owns the action
   - Action hasn't been rewarded yet (prevent duplicates)
   - Required preconditions met (e.g., checked in before photo upload)

3. **Calculate Points**
   - Base points for action type
   - Apply multipliers based on metadata
   - Check for special bonuses

4. **Award Points**
   - Create transaction record
   - Update user's points balance atomically
   - Log transaction details

5. **Return Response**
   - Points awarded
   - New total balance
   - Transaction ID

## Point Values

| Action Type | Base Points | Notes |
|------------|-------------|-------|
| Attendance | 10 | For event check-in |
| Feedback | 5 | Post-event survey |
| Photo Upload | 5 | Event highlight photo |
| Photo w/ Alumni | 10 | 2x multiplier |
| Photo w/ Professional | 15 | 3x multiplier |
| Photo w/ Member of Month | 20 | 4x multiplier |

## Request Schema

```typescript
{
  "userId": "user-def456",
  "actionType": "photo_upload",
  "eventId": "event-abc123",
  "metadata": {
    "photoType": "alumni",        // optional: alumni, professional, member_of_month
    "photoUrl": "storage/path"
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
    "amount": 10,
    "reason": "photo_with_alumni",
    "createdAt": "2024-01-15T19:00:00Z"
  },
  "newBalance": 125
}

// Error
{
  "success": false,
  "error": "User has not checked in to this event",
  "code": "PRECONDITION_FAILED"
}
```

## Error Codes

- `INVALID_ACTION_TYPE` - Unrecognized action type
- `ALREADY_REWARDED` - Points already awarded for this action
- `PRECONDITION_FAILED` - Required condition not met (e.g., no check-in)
- `UNAUTHORIZED` - User not authenticated
- `INVALID_EVENT` - Event doesn't exist

## Point Calculation Logic

```typescript
function calculatePoints(actionType: string, metadata?: any): number {
  const basePoints = {
    attendance: 10,
    feedback: 5,
    photo_upload: 5
  }

  let points = basePoints[actionType] || 0

  // Apply multipliers for photos
  if (actionType === 'photo_upload' && metadata?.photoType) {
    const multipliers = {
      alumni: 2,
      professional: 3,
      member_of_month: 4
    }
    points *= multipliers[metadata.photoType] || 1
  }

  return points
}
```

## Security

- Requires valid auth token
- Validates user owns the action
- Prevents duplicate point awards via unique constraints
- Uses database transactions for atomicity
- Logs all point transactions for audit trail

## Database Operations

1. **Check for existing transaction**
   ```sql
   SELECT * FROM points
   WHERE user_id = $1 AND event_id = $2 AND reason = $3
   ```

2. **Insert transaction**
   ```sql
   INSERT INTO points (user_id, event_id, amount, reason)
   VALUES ($1, $2, $3, $4)
   ```

3. **Update user balance**
   ```sql
   UPDATE users
   SET points = points + $1
   WHERE id = $2
   ```

## Testing

```bash
# Start function locally
supabase functions serve award-points

# Test attendance points
curl -X POST http://localhost:54321/functions/v1/award-points \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-def456",
    "actionType": "attendance",
    "eventId": "event-abc123"
  }'

# Test photo with alumni multiplier
curl -X POST http://localhost:54321/functions/v1/award-points \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-def456",
    "actionType": "photo_upload",
    "eventId": "event-abc123",
    "metadata": {
      "photoType": "alumni",
      "photoUrl": "storage/photos/abc.jpg"
    }
  }'
```

## Implementation Notes

- Use database transactions to ensure atomicity
- Implement idempotency to prevent duplicate awards
- Rate limit to prevent abuse
- Consider caching user balances for performance
- Log all transactions for analytics and debugging
