# /components/ - Reusable UI Components (Presentation Only)

**Purpose**: Pure presentational components with no business logic

**Rules**:
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Props in → UI out
- ✅ Fully reusable

**Planned Components**:
```
components/
├── EventCard.tsx              # Calendar event card
├── FeedItem.tsx               # Feed post component
├── ProfileHeader.tsx          # Profile top section
├── PointsBadge.tsx            # Points display badge
├── QRScanButton.tsx           # Camera trigger button
├── HighlightPhoto.tsx         # Event photo card
├── RankingCard.tsx            # Member ranking display
├── AnnouncementCard.tsx       # Feed announcement
└── ConnectionRequest.tsx      # Friend request UI
```

**Component Pattern**:
```typescript
// Example: EventCard.tsx
interface EventCardProps {
  title: string
  date: Date
  location: string
  onPress: () => void
}

export function EventCard({ title, date, location, onPress }: EventCardProps) {
  // Pure UI - no hooks, no API calls
  return (
    // JSX here
  )
}
```

**Best Practices**:
- Keep components small and focused
- Use TypeScript interfaces for props
- No useState unless for pure UI state (e.g., hover, animation)
- All data comes from props
- All actions via callback props
