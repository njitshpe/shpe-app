# /app/event/ - Event Detail Routes

**Purpose**: Dynamic route for individual event pages

**Contents**:
- `[id].tsx` - Single event detail page

**Features**:
- Event details (date, time, location, description)
- RSVP button
- QR code check-in (opens when event starts, closes when event ends)
- Post-event feedback form (triggers notification, awards points)
- Event highlights gallery (member photo uploads)
- Directions to event (post-MVP)

**User Flow**:
1. User navigates from calendar
2. Views event details
3. RSVPs to event
4. During event: QR check-in becomes available
5. During/after event: Upload photos for bonus points
6. Post-event: Submit feedback form

**Rules**:
- Navigation and layout only
- Business logic in `/hooks/useEvents.ts`, `/hooks/useCheckIn.ts`, `/hooks/useRSVP.ts`
- Components from `/components/EventCard.tsx`, `/components/HighlightPhoto.tsx`
