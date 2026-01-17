# Feed Feature Documentation

## Overview
The Feed feature serves as a central social hub for the SHPE app, allowing users to share updates, images, and engage with the community. It supports chronological post viewing, event tagging, liking, and commenting. It may be combined with other features in the future.

## Architecture

### Frontend Components
- **`FeedCard.tsx`**: The primary display component for a post. calling `useLikes` for optimistic UI updates.
- **`EventAutocomplete.tsx`**: A specialized input for searching and selecting SHPE events to tag in posts.
- **`CreatePostScreen.tsx`**: The interface for creating and editing posts, handling image selection and upload.

### Service Layer (`feedService.ts`)
The `feedService` handles all interactions with Supabase. Key functions include:

- **`fetchFeedPosts`**: Retrieves paginated posts with joined data:
  - `author`: User profile details.
  - `event`: Tagged event details.
  - `likes`/`comments`: Counts and current user status.
- **`createPost`**: 
  - Validates content length.
  - Uploads up to 5 images to Supabase Storage (`feed-images` bucket).
  - Inserts post record and associated user tags.
- **`deletePost`**: Performs a **hard delete** on the post (resolving RLS complexities with soft deletes).
- **`updatePost`**: Allows modification of content and event tags.
- **`likePost` / `unlikePost`**: Toggles like status (using unique constraints to prevent duplicates).

### Data Model (`types/feed.ts`)
The feature relies on strict typing for both Database (snake_case) and UI (camelCase) models:

- **`feed_posts`**: Stores content, image URLs, and event pointers.
- **`feed_likes`**: Junction table for user-post likes.
- **`feed_comments`**: Stores comments on posts.
- **`feed_post_tags`**: Stores user tags (mentions) on posts.

## Key Features

### 1. Event Tagging
Users can tag specific SHPE events in their posts. These tags appear as navigable chips in the post header.
- **Fetching**: Uses `fetchFeedPosts` with a join on `events`.
- **Navigation**: Tapping a tag navigates to `/event/[id]` (using the public event ID).

### 2. Image Handling
- Images are compressed using `expo-image-manipulator` (WebP format, max width 1080px) before upload.
- Stored in Supabase Storage under structured paths: `userId/timestamp_index.webp`.

### 3. Error Handling
The service uses a standardized `ServiceResponse` pattern like the rest of the app:
- **`createError`**: Helper to generate consistent `AppError` objects.
- **`mapSupabaseError`**: Transforms Supabase exceptions into `AppError` types (e.g., `DATABASE_ERROR`, `UNAUTHORIZED`).

## Database Schema (Reference)

```sql
-- Core Post Table
create table feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id),
  content text,
  image_urls text[], -- Array of public URLs
  event_id uuid references events(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Likes
create table feed_likes (
  post_id uuid references feed_posts(id) on delete cascade,
  user_id uuid references user_profiles(id),
  primary key (post_id, user_id)
);
```

## Future Improvements

### 1. Feed Ranking Algorithm (Proposed)
Moving from strict chronological order to "Engagement-Weighted Recency" to balance new content with popular posts.

**Core Concept:**
Posts are ranked by a score combining:
- **Recency**: Freshness of the content.
- **Engagement**: User interactions (likes and comments).
- **Time Decay**: Older posts gradually move down.

**Scoring Formula:**
```
score = engagement_score * time_decay_factor
```
Where:
- `engagement_score = (like_count * 1.0) + (comment_count * 2.0)`
- `time_decay_factor = 1 / (hours_since_post + 2)^1.5`

**Rationale:**
- **Comments weighted 2x**: Indicates deeper engagement than likes.
- **Time Decay**: Posts lose ~50% of their score every 6 hours.
- **Offset (+2)**: Gives new posts a "grace period" to gain initial traction.

### 2. User Experience
- **User Profiles**: Ability to tap user names/avatars to view their full profile (will implement after branch merges).
- **Colored Event Tags**: Update tag UI to match the color themes of event cards from events-feed branch.
- **Comment Threading**: Support for nested replies (potential).
- **Video Support**: Allow video uploads alongside images (potential).
