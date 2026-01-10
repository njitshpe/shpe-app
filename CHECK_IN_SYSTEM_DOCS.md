# Check-In System Documentation

Complete documentation for the SHPE App Event Check-In system with QR code functionality.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Quick Start Guide](#quick-start-guide)
4. [Deployment Guide](#deployment-guide)
5. [Security](#security)
6. [Troubleshooting](#troubleshooting)
7. [Version History](#version-history)

---

## System Overview

The Check-In System allows admins to generate secure, time-limited QR codes for events. Students scan these QR codes to check in to events, with their attendance tracked in the database.

### Key Features

- **Time-windowed QR codes**: QR codes are only valid during the event's check-in window
- **Offline support**: QR codes are cached for offline use if network is unavailable
- **Admin-only generation**: Only users with admin roles can generate QR codes
- **JWT-based security**: QR codes contain signed JWT tokens validated on scan
- **Automatic token refresh**: Session tokens are refreshed automatically to prevent auth errors

---

## Architecture

### Components

1. **Frontend (React Native)**
   - `CheckInQRModal.tsx` - UI component for displaying QR codes
   - `checkInToken.service.ts` - Service for fetching and caching tokens

2. **Backend (Supabase Edge Functions)**
   - `check-in-token` - Generates JWT tokens for QR codes
   - `validate-check-in` - Validates scanned tokens and records attendance

3. **Database (PostgreSQL via Supabase)**
   - `events` - Event details and check-in windows
   - `admin_roles` - Admin access control
   - `attendance` - Check-in records

### Data Flow

```
Admin Opens Modal → Frontend Requests Token → Edge Function Validates Admin
→ Edge Function Generates JWT → Frontend Displays QR Code → Student Scans
→ validate-check-in Edge Function → Validates Token → Records Attendance
```

### Authentication Flow

1. Frontend calls `getCheckInToken(eventId)` with user session token
2. Service checks if session token expires soon and refreshes if needed
3. Edge Function receives request (JWT verification disabled)
4. Edge Function manually decodes JWT to extract user ID
5. Edge Function verifies user has admin role via service role client
6. Edge Function generates check-in JWT token and returns to frontend

---

## Quick Start Guide

### For Admins (Generating QR Codes)

1. Navigate to an active event in the app
2. Tap "Show QR Code" or similar button
3. Wait for QR code to load (requires network on first load)
4. Display QR code to students
5. QR code automatically refreshes if check-in window changes

### For Students (Checking In)

1. Open the SHPE App
2. Tap "Scan QR Code" or use the scanner feature
3. Point camera at admin's QR code
4. Wait for confirmation message
5. Check-in recorded with timestamp and location (if available)

### For Developers

#### Local Development

```bash
# Install dependencies
npm install

# Start local Supabase
npx supabase start

# Serve Edge Functions locally
npx supabase functions serve

# Deploy Edge Functions
./deploy-edge-function.sh
```

---

## Deployment Guide

### Prerequisites

- Supabase CLI installed (`npx supabase` works)
- Access to Supabase project (ID: jsayqpclkkoqglulvzbu)
- Required environment variables configured

### Deployment Steps

1. **Deploy Edge Functions**

```bash
./deploy-edge-function.sh
```

This script will:
- Link to your Supabase project
- Deploy `check-in-token` function with JWT verification disabled
- Deploy `validate-check-in` function with JWT verification disabled

2. **Verify Environment Variables**

Navigate to [Supabase Dashboard → Settings → Functions](https://supabase.com/dashboard/project/jsayqpclkkoqglulvzbu/settings/functions)

Required secrets:
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- `CHECK_IN_JWT_SECRET` (manually set)

To set `CHECK_IN_JWT_SECRET`:
```bash
npx supabase secrets set CHECK_IN_JWT_SECRET=your_generated_secret_here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

3. **Verify Deployment**

- Test QR code generation in the app
- Check function logs in Supabase Dashboard if issues occur
- Verify check-in window validation works correctly

### Configuration Files

#### supabase/config.toml

```toml
[functions.check-in-token]
verify_jwt = false

[functions.validate-check-in]
verify_jwt = false
```

**Why JWT verification is disabled:**
The Edge Functions manually decode and validate JWTs to use service role access (bypassing RLS). Automatic JWT verification conflicts with this approach.

---

## Security

### Current Implementation

#### Authentication
- Frontend sends user's Supabase auth JWT to Edge Functions
- Edge Functions manually decode JWT to extract user ID
- Edge Functions use service role to check admin status (bypasses RLS)

#### Authorization
- Only users with valid `admin_roles` entries can generate QR codes
- Admin roles are checked with `revoked_at IS NULL` filter

#### QR Code Tokens
- Check-in tokens are separate JWTs signed with `CHECK_IN_JWT_SECRET`
- Tokens include event ID, expiration time, and token type
- Tokens expire when check-in window closes

### Security Implementation

✅ **JWT Signature Validation - IMPLEMENTED**

The Edge Functions now properly validate JWT signatures using Supabase's `auth.getUser()`:

```typescript
// Create client with user's auth token
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  {
    global: {
      headers: { Authorization: req.headers.get("Authorization")! },
    },
  }
);

// Supabase validates JWT signature automatically
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

**Security Guarantees:**
- ✅ JWT signatures are cryptographically verified
- ✅ Forged tokens are rejected
- ✅ Expired tokens are rejected
- ✅ Matches team standard authentication pattern

### Best Practices

1. **Always use HTTPS** - QR codes should only be displayed over secure connections
2. **Time-limit tokens** - QR codes expire when check-in window closes
3. **Validate on scan** - Every scan validates token signature and expiration
4. **Log attempts** - Failed check-ins are logged for security monitoring
5. **Rate limiting** - Consider adding rate limits to prevent abuse

---

## Troubleshooting

### Common Issues

#### 1. "401 Invalid JWT" Error

**Symptoms:**
- QR code fails to load
- Error: "Edge Function returned a non-2xx status code"
- Backend response: `{"code": 401, "message": "Invalid JWT"}`

**Causes:**
- JWT verification is enabled on Edge Functions (fixed in latest deployment)
- Session token is expired (now handled automatically)

**Solutions:**
- ✅ Deploy Edge Functions with `--no-verify-jwt` flag (run `./deploy-edge-function.sh`)
- ✅ Session tokens now auto-refresh before API calls
- If issue persists, user may need to log out and log back in

#### 2. QR Code Not Loading

**Symptoms:**
- Spinner shows indefinitely
- No error message displayed

**Causes:**
- Network connectivity issues
- Edge Function not responding
- Missing environment variables

**Solutions:**
- Check network connection
- Verify Edge Functions are deployed and running
- Check Supabase Dashboard logs
- Verify `CHECK_IN_JWT_SECRET` is set

#### 3. "Admin Access Required" Error

**Symptoms:**
- Error message: "Admin access required"
- QR code fails to generate

**Causes:**
- User doesn't have admin role
- Admin role has been revoked (`revoked_at` is not null)

**Solutions:**
- Verify user has an entry in `admin_roles` table
- Ensure `revoked_at` is null for that entry
- Grant admin access via database or admin panel

#### 4. "Check-in Not Open" or "Check-in Closed"

**Symptoms:**
- QR code shows time-based error message
- Modal displays countdown or closed status

**Causes:**
- Current time is outside check-in window
- Event's `check_in_opens` or `check_in_closes` values are incorrect

**Solutions:**
- Wait until check-in opens
- Verify event check-in window times in database
- Contact event administrator to adjust times

#### 5. Offline Mode Not Working

**Symptoms:**
- QR code doesn't load when offline
- "Network error" displayed instead of cached QR code

**Causes:**
- QR code was never loaded online first
- Cache was cleared
- Token expiration passed while offline

**Solutions:**
- Load QR code while online first to cache it
- QR code will work offline until check-in window closes
- If check-in closed while offline, must go online to get new token

### Debugging Tips

1. **Check function logs**:
   ```bash
   npx supabase functions logs check-in-token
   npx supabase functions logs validate-check-in
   ```

2. **Verify secrets are set**:
   ```bash
   npx supabase secrets list
   ```

3. **Test Edge Function directly**:
   ```bash
   curl -X GET \
     https://jsayqpclkkoqglulvzbu.supabase.co/functions/v1/check-in-token/EVENT_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Check database state**:
   ```sql
   -- Verify admin role
   SELECT * FROM admin_roles WHERE user_id = 'USER_ID' AND revoked_at IS NULL;

   -- Check event check-in window
   SELECT event_id, name, check_in_opens, check_in_closes
   FROM events WHERE event_id = 'EVENT_ID';
   ```

---

## Version History

### v1.2.0 (Current) - Secure Authentication Pattern
**Released:** 2026-01-09

**Changes:**
- ✅ Updated to match admin-event secure authentication pattern
- ✅ Uses `auth.getUser()` with ANON_KEY for JWT validation
- ✅ Disabled gateway-level JWT verification (--no-verify-jwt)
- ✅ JWT signatures ARE validated securely in function code
- ✅ Added automatic session token refresh (5-minute proactive refresh)
- ✅ Simplified error logging and handling
- ✅ Cleaned up debug console logs
- ✅ Created comprehensive documentation

**Security Improvements:**
- JWT signatures now properly validated via `auth.getUser()`
- Eliminated manual JWT decoding vulnerability
- Matches team standard authentication pattern
- Full audit trail via Supabase auth logs

**Fixes:**
- Fixed 401 "Invalid JWT" errors on QR code generation
- Fixed token expiration handling
- Fixed insecure JWT validation

**Files Modified:**
- `supabase/functions/check-in-token/index.ts` (major security update)
- `frontend/services/checkInToken.service.ts`
- `frontend/components/admin/CheckInQRModal.tsx`
- `deploy-edge-function.sh`

### v1.1.5 - Error Detection Hardening
**Released:** 2026-01-08

**Changes:**
- Added deep status checks for error detection
- Added case-insensitive abort handling
- Improved offline detection reliability

### v1.1.4 - AbortError Support
**Released:** 2026-01-08

**Changes:**
- Added AbortError detection for request timeouts
- Enhanced network error detection logic

### v1.1.3 - Offline Fallback Fix
**Released:** 2026-01-08

**Changes:**
- Fixed offline fallback by properly detecting HTTP errors
- Stopped masking Supabase errors
- Improved server-reached detection

### v1.1.2 - Critical Security Patch
**Released:** 2026-01-08

**Changes:**
- Fixed Supabase HTTP error handling
- Added proper error type detection
- Improved cache invalidation logic

### v1.1.0 - Fetch-First Implementation
**Released:** 2026-01-08

**Changes:**
- Implemented fetch-first strategy for QR codes
- Added offline cache fallback
- Added time-window validation UI
- Improved error handling and user feedback

### v1.0.0 - Initial Release
**Released:** 2026-01-07

**Features:**
- QR code generation for events
- Time-windowed check-ins
- Admin access control
- Basic offline support

---

## API Reference

### Edge Functions

#### check-in-token

**Endpoint:** `GET /functions/v1/check-in-token/{eventId}`

**Headers:**
```
Authorization: Bearer {user_jwt_token}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "event": {
    "id": "event-123",
    "name": "General Meeting",
    "checkInOpens": "2026-01-09T18:00:00Z",
    "checkInCloses": "2026-01-09T20:00:00Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (no valid JWT)
- `403` - Forbidden (not admin, event inactive, or outside time window)
- `404` - Event not found
- `500` - Server error

#### validate-check-in

**Endpoint:** `POST /functions/v1/validate-check-in`

**Body:**
```json
{
  "token": "check_in_jwt_token",
  "latitude": 34.0522,
  "longitude": -118.2437
}
```

**Success Response (200):**
```json
{
  "success": true,
  "attendance": { ... },
  "event": { ... }
}
```

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review function logs in Supabase Dashboard
3. Contact development team
4. Check GitHub issues (if applicable)

---

## License

Internal use only - SHPE App Development Team
