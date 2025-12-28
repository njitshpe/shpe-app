# Supabase Events Integration

## What Changed

### 1. **New File: `lib/supabase.ts`**
Created Supabase client configuration with TypeScript types for the events table.

**Database Schema Mapping:**
```typescript
interface EventRow {
  id: number;              // DB primary key
  event_id: string;        // UUID for UI
  name: string;            // → title
  description: string | null;
  start_time: string;      // → startTimeISO
  end_time: string;        // → endTimeISO
  location: string | null; // → address
  location_name: string;
  cover_image_url: string | null;
  host_name: string;
  price_label: string | null;
  tags: string[];
  is_archived: boolean;    // Used for filtering
  is_active: boolean;      // Only fetch active events
}
```

### 2. **Refactored: `context/EventsContext.tsx`**

#### Added Features:
- ✅ **Fetches events from Supabase** on mount
- ✅ **Maps DB rows to UI Event type** via `mapEventRowToEvent()`
- ✅ **Derives `isPast`** from `end_time < now`
- ✅ **Filters by `is_active = true`** (excludes deleted events)
- ✅ **Sorts by `start_time`** ascending
- ✅ **Loading state** (`isLoading`)
- ✅ **Error handling** (`error`)
- ✅ **Refetch function** (`refetchEvents()`)
- ✅ **Admin mode toggle** (kept intact)

#### Status Derivation Logic:
```typescript
const now = new Date();
const endTime = new Date(row.end_time);
const isPast = endTime < now;
status: isPast ? 'past' : 'upcoming'
```

The calendar feed already filters by `status === 'upcoming'` or `status === 'past'` in the UI, so events automatically show up in the correct section.

### 3. **Updated: `app.json`**
Added Supabase configuration placeholders.

## Setup Instructions

### Step 1: Add Your Supabase Credentials

Edit `app.json` and replace the placeholders:

```json
"extra": {
  "supabaseUrl": "https://YOUR-PROJECT.supabase.co",
  "supabaseAnonKey": "YOUR_ANON_KEY_HERE"
}
```

**Find these values in:**
- Supabase Dashboard → Settings → API
- Use the **Project URL** and **anon/public key**

### Step 2: Restart Expo

```bash
# Stop the current server (Ctrl+C)
npm start
```

The config changes require a restart to take effect.

### Step 3: Verify Data

The app will now:
1. Fetch events from Supabase on load
2. Show loading state while fetching
3. Display events grouped by date
4. Automatically mark events as `past` if `end_time < now`

## Database Requirements

Make sure your Supabase `events` table has:
- ✅ `is_active = true` for all visible events
- ✅ `start_time` and `end_time` as valid ISO timestamps
- ✅ `tags` as a PostgreSQL array (e.g., `['Workshop', 'Career Dev']`)

### Optional: Row Level Security (RLS)

If you have RLS enabled, ensure:
```sql
-- Allow public read access to active events
CREATE POLICY "Allow public read active events"
ON events FOR SELECT
USING (is_active = true);
```

## How Events Are Filtered

### In EventsContext:
```typescript
.eq('is_active', true)  // Only fetch active events
.order('start_time', { ascending: true })  // Chronological order
```

### In UI (calendar/index.tsx):
```typescript
// Already filters by status
events.filter((event) => event.status === timeFilter)
// timeFilter is either 'upcoming' or 'past'
```

### Status is derived automatically:
- `end_time < now` → `status: 'past'`
- `end_time >= now` → `status: 'upcoming'`

## New Context API

### Available Properties:
```typescript
const {
  events,        // Event[] - all events from Supabase
  isLoading,     // boolean - true while fetching
  error,         // string | null - error message
  isAdminMode,   // boolean - admin toggle state
  refetchEvents, // () => Promise<void> - manual refresh
  toggleAdminMode,
  addEvent,      // For future use
  updateEvent,   // For future use
  deleteEvent,   // For future use
} = useEvents();
```

### Example: Show Loading State

```tsx
const { events, isLoading, error } = useEvents();

if (isLoading) {
  return <Text>Loading events...</Text>;
}

if (error) {
  return <Text>Error: {error}</Text>;
}

// Render events
```

## Testing Without Supabase

If you don't have Supabase credentials yet, the app will:
- Show a console warning
- Return empty events array
- Not crash (graceful fallback)

To test with mock data temporarily, you can:
1. Comment out the `useEffect` in EventsContext
2. Set initial state to `mockEvents` instead of `[]`

## Next Steps

1. ✅ **Add Supabase credentials** to `app.json`
2. ✅ **Populate your events table** with test data
3. 🔄 **Test the app** - events should load from Supabase
4. 🔄 **Add loading indicators** to the UI (optional)
5. 🔄 **Implement create/update/delete** functions (future)

## Notes

- **No UI changes** - All components work as before
- **Backwards compatible** - Event type interface unchanged
- **Automatic status** - Past/upcoming derived from `end_time`
- **Filtered by default** - Only active events shown
- **Admin mode** - Still works for local state management
