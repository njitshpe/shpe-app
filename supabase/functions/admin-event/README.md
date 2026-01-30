# /supabase/functions/admin-event/ - Admin Event Management Function

**Purpose**: Secure admin-only operations for event management

## Workflow

1. **Authenticate Request**
   - Verify user is authenticated
   - Check user has admin/eboard role
   - Validate auth token

2. **Route Operation**
   - Parse operation type (create, update, delete, open_checkin, close_checkin)
   - Validate request payload
   - Execute operation

3. **Perform Operation**
   - Execute admin action
   - Validate business rules
   - Update database atomically

4. **Log Action**
   - Record admin action for audit trail
   - Include user ID, operation, timestamp

5. **Return Response**
   - Success status
   - Updated/created data
   - Operation details

## Operations

### Create Event
```typescript
{
  "operation": "create",
  "data": {
    "title": "General Meeting",
    "description": "Monthly general meeting",
    "startTime": "2024-01-15T18:00:00Z",
    "endTime": "2024-01-15T20:00:00Z",
    "location": "GITC 1100",
    "qrCode": "event-abc123"
  }
}
```

### Update Event
```typescript
{
  "operation": "update",
  "eventId": "event-abc123",
  "data": {
    "location": "GITC 1200",
    "description": "Updated description"
  }
}
```

### Delete Event
```typescript
{
  "operation": "delete",
  "eventId": "event-abc123"
}
```

### Open Check-In
```typescript
{
  "operation": "open_checkin",
  "eventId": "event-abc123"
}
```

### Close Check-In
```typescript
{
  "operation": "close_checkin",
  "eventId": "event-abc123"
}
```

### Approve Highlight Photo
```typescript
{
  "operation": "approve_highlight",
  "photoId": "photo-xyz789"
}
```

## Response Schema

```typescript
// Success
{
  "success": true,
  "operation": "create",
  "event": {
    "id": "event-abc123",
    "title": "General Meeting",
    "isCheckInOpen": false,
    "createdAt": "2024-01-15T12:00:00Z"
  }
}

// Error
{
  "success": false,
  "error": "Unauthorized: User does not have admin privileges",
  "code": "FORBIDDEN"
}
```

## Error Codes

- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User doesn't have admin role
- `INVALID_OPERATION` - Unrecognized operation type
- `EVENT_NOT_FOUND` - Event doesn't exist
- `VALIDATION_ERROR` - Invalid input data
- `CONFLICT` - Operation conflicts with current state

## Role Verification

```typescript
async function verifyAdmin(userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'admin' || user?.role === 'eboard'
}
```

## Business Rules

### Event Creation
- Title is required and non-empty
- Start time must be in the future
- End time must be after start time
- QR code must be unique
- Location is required

### Event Updates
- Cannot change past events (end_time < now)
- Cannot change QR code if check-ins exist
- Maintain data integrity

### Event Deletion
- Soft delete (set `deleted_at` timestamp)
- Cascade rules for RSVPs and check-ins
- Cannot delete if check-in is open

### Check-In Control
- Can only open check-in for current/upcoming events
- Cannot open check-in before event starts (optional rule)
- Closing check-in is always allowed

## Security

- Requires valid auth token
- Strict role verification (admin/eboard only)
- All operations logged for audit
- Input validation on all fields
- Protected against SQL injection
- Rate limiting to prevent abuse

## Audit Logging

All admin actions are logged:

```typescript
{
  "adminUserId": "user-admin123",
  "operation": "open_checkin",
  "eventId": "event-abc123",
  "timestamp": "2024-01-15T17:55:00Z",
  "ipAddress": "192.168.1.1"
}
```

## Testing

```bash
# Start function locally
supabase functions serve admin-event

# Test create event
curl -X POST http://localhost:54321/functions/v1/admin-event \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "create",
    "data": {
      "title": "Test Meeting",
      "description": "Test event",
      "startTime": "2024-02-01T18:00:00Z",
      "endTime": "2024-02-01T20:00:00Z",
      "location": "GITC 1100",
      "qrCode": "event-test123"
    }
  }'

# Test open check-in
curl -X POST http://localhost:54321/functions/v1/admin-event \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "open_checkin",
    "eventId": "event-test123"
  }'

# Test with non-admin user (should fail)
curl -X POST http://localhost:54321/functions/v1/admin-event \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "create",
    "data": {...}
  }'
```

## Implementation Notes

- Use database transactions for multi-step operations
- Implement comprehensive input validation
- Cache user roles to reduce database queries
- Consider implementing operation permissions matrix
- Log all operations for compliance and debugging
- Send notifications to admins for critical operations
