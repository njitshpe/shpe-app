# `/components/` - Reusable UI Components (Presentation Only)

## Purpose
Pure presentational components with **no business logic**.

## Rules
- ❌ **NO Supabase calls**
- ❌ **NO business logic** (calculations, data fetching, state management)
- ✅ Props in → UI out
- ✅ Fully reusable across app

## Component Principles
1. **Single Responsibility**: Each component does ONE thing
2. **Props-Driven**: All data comes from props
3. **No Side Effects**: No API calls, no global state mutations
4. **Type-Safe**: All props have TypeScript interfaces

## Planned Components

### Core UI
- `EventCard.tsx` - Calendar event card display
- `FeedItem.tsx` - Feed post component
- `ProfileHeader.tsx` - Profile top section with avatar
- `PointsBadge.tsx` - Points display badge
- `QRScanButton.tsx` - Camera trigger button

### Event Features
- `HighlightPhoto.tsx` - Event photo card with reactions
- `RSVPButton.tsx` - RSVP action button
- `EventDetails.tsx` - Event info display

### Social Features
- `RankingCard.tsx` - Member ranking display
- `AnnouncementCard.tsx` - Feed announcement
- `ConnectionRequest.tsx` - Friend request UI
- `MemberOfMonthCard.tsx` - Featured member showcase

### Form Elements
- `FeedbackForm.tsx` - Post-event feedback
- `ProfileForm.tsx` - Profile editing form

## Example Component Pattern

```tsx
// components/EventCard.tsx
import { Event } from '@/types/event.types'

interface EventCardProps {
  event: Event
  onPress?: (eventId: string) => void
}

export function EventCard({ event, onPress }: EventCardProps) {
  return (
    <TouchableOpacity onPress={() => onPress?.(event.id)}>
      <View>
        <Text>{event.title}</Text>
        <Text>{event.date}</Text>
        <PointsBadge points={event.points} />
      </View>
    </TouchableOpacity>
  )
}
```

## Component Composition
Components can use other components:
```tsx
// Good: Composition
<EventCard event={event}>
  <PointsBadge points={event.points} />
  <RSVPButton eventId={event.id} />
</EventCard>
```

## What Does NOT Go Here
- Data fetching → Use `hooks/`
- API calls → Use `lib/` or `services/`
- Complex calculations → Use `utils/` or `hooks/`
- Global state → Use `store/`

## Component Testing
Each component should be:
- Testable in isolation
- Renderable in Storybook (future)
- Usable in any screen
