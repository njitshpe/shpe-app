# /app/tabs/ - Main Tab Navigation

**Purpose**: Core app screens accessible via bottom tab navigation

**Contents**:
- `calendar.tsx` - Events calendar (entry point to Single Event Page)
- `feed.tsx` - Social feed with event highlights, announcements, shoutouts
- `profile.tsx` - User profile with stats, resume, connections
- `admin.tsx` - Admin dashboard with analytics (eboard members only)

**Features by Tab**:

## Calendar
- List of upcoming events
- Filter by date/type
- Navigate to Single Event Page

## Feed
- Recent event highlights (photos from members)
- Member of the Month spotlight
- Committee Member of the Week
- Announcements
- LinkedIn activity scraping (post-MVP)
- Private opportunity sign-ups

## Profile
- Profile picture
- Resume upload
- Camera toggle (QR scanner for check-in)
- Stats: internships, resume score, LinkedIn activity
- Connection requests
- Ranking/points display

## Admin
- Member analytics
- Event performance metrics
- CARLA insights (post-MVP)

**Rules**:
- Navigation and layout only
- Business logic in respective hooks (`useEvents`, `useFeed`, `useProfile`, `useAdmin`)
- Render UI components from `/components/`
