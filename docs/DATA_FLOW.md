# SHPE App Data Flow & Event Management

This doc outlines how the app handles the event lifecycle CRUD (Create, Read, Update, Delete) and other key database interactions.

## 1. Event System
Everything related to creating, viewing, and attending events.

### Admin Management
**Managed by:** `frontend/services/adminEvents.service.ts` & `checkInToken.service.ts`

#### `createEvent(eventData)`
*   **Purpose:** creates a new event in the system.
*   **How it works:**
    *   Calls the `admin-event` Edge Function with `{ operation: 'create', data: ... }`.
    *   The Edge Function validates the admin session and inserts a new row into the `events` table.
    *   It handles optional fields like images and location coordinates.

#### `updateEvent(eventId, eventData)`
*   **Purpose:** updates details of an existing event.
*   **How it works:**
    *   Calls the `admin-event` Edge Function with `{ operation: 'update', eventId, data: ... }`.
    *   The Edge Function verifies admin privileges and performs an `update` on the `events` table for the specified ID.

#### `deleteEvent(eventId)`
*   **Purpose:** removes an event from the system.
*   **How it works:**
    *   Calls the `admin-event` Edge Function with `{ operation: 'delete', eventId }`.
    *   The Edge Function executes a Hard Delete (removing the row).

#### `getCheckInToken(eventId)`
*   **Purpose:** generates a time-limited, signed JWT for the QR code display (Admin Side).
*   **How it works:**
    *   Calls the `check-in-token` Edge Function.
    *   **Security:** The function verifies the user is an admin and that the event is currently active (within time window).
    *   Returns a JWT containing the Event ID and metadata.
    *   **Caching:** The frontend aggressively caches this token (local storage) to ensure Admin QR codes work even with poor connectivity.


### User Experience
**Managed by:** `frontend/contexts/EventsContext.tsx`, `registration.service.ts`, & `checkInToken.service.ts`

#### `refetchEvents()`
*   **Purpose:** fetches the main list of active events for the user.
*   **How it works:**
    *   Runs a direct Supabase Query: `supabase.from('events').select('*').eq('is_active', true)`.
    *   Orders results by `start_time` ascending.
    *   Maps the raw database rows (`EventRow`) into the frontend `Event` interface (handling date parsing and status calculation like 'past' vs 'upcoming').

#### `isRegistered(eventSlug)`
*   **Purpose:** checks if the current user is RSVP'd to an event.
*   **How it works:**
    *   First resolves the `eventSlug` (text) to a UUID (if needed) via the `events` table (with caching).
    *   Queries `event_attendance` to see if a row exists for the user + event with `status = 'going'`.

#### `register(eventSlug)`
*   **Purpose:** RSVPs the user to an event.
*   **How it works:**
    *   Resolves the Event UUID.
    *   Performs an `upsert` on `event_attendance` with `status: 'going'` and `rsvp_at: now()`.
    *   *Note:* This action triggers the `trigger_award_points_for_event` logic on the backend if configured for RSVP bonuses.

#### `validateCheckIn(token, lat, lon)`
*   **Purpose:** processes the scanned QR code (Student Side).
*   **How it works:**
    *   Calls the `validate-check-in` Edge Function.
    *   **Security:** detailed validation happens server-side:
        1.  Verifies JWT signature (preventing spoofing).
        2.  Checks expiration (preventing reuse).
        3.  Checks for duplicate check-ins.
        4.  (Future) Will validate geolocation distance if coordinates (based off address) and radius are provided.
    *   If successful, it inserts a row into `event_attendance`, which *then* triggers the points award system.

#### `getAttendees(eventSlug)`
*   **Purpose:** fetches the list of people going to an event (for "Who's Going").
*   **How it works:**
    *   Queries `event_attendance` for users with `status='going'`.
    *   Performs a manual "app-side join" to fetch `user_profiles` for those IDs.
    *   Combines them into a list of attendees with profile pictures.

---

## 2. Social Feed System
**Managed by:** `frontend/lib/feedService.ts`

#### `fetchFeedPosts(page, limit)`
*   **Purpose:** retrieves the social feed posts with pagination.
*   **How it works:**
    *   Queries `feed_posts_visible` view (which filters out blocked/deleted content).
    *   Performs "Manual Joins" to get related data:
        *   Fetches `user_profiles` for all authors.
        *   Fetches `events` for any tagged events.
        *   Fetches `feed_likes` and `feed_comments` counts for each post.
    *   Combines all this data into a `FeedPostUI` object for the timeline.

#### `createPost`
*   **Purpose:** handles the complex flow of creating a new post.
*   **How it works:**
    *   **Uploads:** Compresses and uploads images to Supabase Storage first.
    *   **Insert:** Inserts a row to `feed_posts`.
    *   **Trigger:** The database automatically detects if it's a photo or text post to award points via `trigger_award_points_for_post`.

---

## 3. User Data & Gamification
Managing the user's identity and their progress.

### Profile Management
**Managed by:** `frontend/services/profile.service.ts`

#### `getProfile(userId)`
*   **Purpose:** fetches the full user profile, including flexible JSON data.
*   **How it works:**
    *   Queries `user_profiles` by ID.
    *   **Data Normalization:** Automatically "flattens" the nested `profile_data` JSONB column into the main object. This allows the app to handle both legacy columns (e.g., `major`) and new dynamic fields (e.g., `github_url`) transparently.

#### `updateProfile(userId, updates)`
*   **Purpose:** updates user profile fields.
*   **How it works:**
    *   Separates "Direct Columns" (first_name, last_name) from "Dynamic Fields" (bio, links).
    *   Merges dynamic fields into the existing `profile_data` JSON.
    *   Performs a single `update` on `user_profiles`.

### Ranks & Points
**Managed by:** `frontend/services/rank.service.ts`

#### `getLeaderboard(limit)`
*   **Purpose:** fetches the top ranked users for the current season.
*   **How it works:**
    *   Calls the Postgres RPC `get_leaderboard_current_season`.
    *   This RPC automatically determines the active season ID.
    *   It queries the aggregated `points_balances` table (not raw transactions) for speed.
    *   Returns a sorted list of users with their total points and rank.

#### `getMyRank()`
*   **Purpose:** fetches the current user's specific rank and points.
*   **How it works:**
    *   Also calls `get_leaderboard_current_season` (or similar RPC) but filters for the current user ID.
    *   Returns their exact position (e.g., "5th place").

#### `subscribeToPoints(callback)`
*   **Purpose:** listens for new points awarded to the user (e.g., while they are using the app).
*   **How it works:**
    *   Opens a Supabase Realtime channel (`points_updates`).
    *   Subscribes to `INSERT` events on the `points_transactions` table.
    *   When the server (via triggers) awards points, this listener fires, allowing the UI to show a "Success Toast" immediately.
