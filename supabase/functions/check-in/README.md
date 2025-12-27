# /supabase/functions/check-in/ - QR Check-In Function

**Purpose**: Validate and record event check-ins securely

## Workflow

1. **Receive Request**
   - QR code string
   - User ID (from auth token)
   - Timestamp

2. **Validate QR Code**
   - Parse QR code to extract event ID
   - Verify event exists in database
   - Check event check-in is open (`is_check_in_open = true`)

3. **Validate User**
   - User is authenticated
   - User hasn't already checked in to this event
   - User has valid RSVP (optional requirement)

4. **Validate Timing**
   - Event has started (`start_time <= now`)
   - Event hasn't ended (`end_time >= now`)
   - Check-in window is open (admin-controlled)

5. **Record Check-In**
   - Insert record into `check_ins` table
   - Atomically to prevent race conditions

6. **Award Points**
   - Call `award-points` function
   - Award 10 points for attendance
   - Log transaction

7. **Return Response**
   - Success status
   - Points awarded
   - Check-in timestamp
   - Event details

## Request Schema

```typescript
{
  "qrCode": "event-abc123",    // QR code scanned by user
  "userId": "user-def456"      // From auth token
}
```

## Response Schema

```typescript
// Success
{
  "success": true,
  "checkIn": {
    "id": "checkin-xyz789",
    "eventId": "event-abc123",
    "userId": "user-def456",
    "checkedInAt": "2024-01-15T18:30:00Z",
    "pointsAwarded": 10
  },
  "event": {
    "title": "General Meeting",
    "startTime": "2024-01-15T18:00:00Z"
  }
}

// Error
{
  "success": false,
  "error": "Check-in is not open for this event",
  "code": "CHECK_IN_CLOSED"
}
```

## Error Codes

- `INVALID_QR_CODE` - QR code doesn't match any event
- `CHECK_IN_CLOSED` - Event check-in is not open
- `ALREADY_CHECKED_IN` - User already checked in
- `EVENT_NOT_STARTED` - Event hasn't started yet
- `EVENT_ENDED` - Event has already ended
- `UNAUTHORIZED` - User not authenticated

## Security

- Requires valid auth token
- Uses service role for database operations
- Prevents duplicate check-ins via unique constraint
- Validates all inputs server-side
- Logs all check-in attempts for audit

## Testing

```bash
# Start function locally
supabase functions serve check-in

# Test request
curl -X POST http://localhost:54321/functions/v1/check-in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "event-abc123",
    "userId": "user-def456"
  }'
```

## Implementation Notes

- Use database transactions for atomic operations
- Cache event data to reduce queries
- Rate limit to prevent abuse
- Log failed attempts for security monitoring
