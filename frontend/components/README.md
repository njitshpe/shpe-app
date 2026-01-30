# /components/ - Reusable UI Components (Domain-Organized)

**Purpose**: Pure presentational components with no business logic

**Rules**:
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Props in → UI out
- ✅ Fully reusable
- ✅ Organized by domain

**Structure**:
```
components/
├── auth/               # Authentication UI
│   ├── AuthInput.tsx
│   └── index.ts
├── events/             # Event-related components
│   ├── AttendeesPreview.tsx
│   ├── EventActionBar.tsx
│   ├── EventMoreMenu.tsx
│   ├── RegistrationSuccessModal.tsx
│   └── index.ts
├── media/              # Media & file handling
│   ├── ImageSourceModal.tsx
│   ├── ResumeUploader.tsx
│   └── index.ts
├── onboarding/         # Onboarding screens
│   ├── OnboardingPage1.tsx
│   ├── OnboardingPage2.tsx
│   ├── OnboardingPage3.tsx
│   └── index.ts
├── profile/            # Profile-related UI
│   ├── EditProfileScreen.tsx
│   ├── InterestPicker.tsx
│   ├── ProfileForm.tsx
│   └── index.ts
└── shared/             # Shared utilities
    ├── ErrorBoundary.tsx
    ├── MapPreview.tsx
    └── index.ts
```

**Import Pattern**:
```typescript
// Use barrel exports for cleaner imports
import { AuthInput } from '@/components/auth';
import { MapPreview } from '@/components/shared';
import {
  AttendeesPreview,
  EventActionBar,
  ACTION_BAR_BASE_HEIGHT,
} from '@/components/events';
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
- Export from domain index.ts for barrel exports
