# /utils/ - Small Helper Functions

**Purpose**: Pure utility functions (no side effects)

**Planned Utils**:
```
utils/
├── date.utils.ts              # Date formatting, timezone
├── points.utils.ts            # Points calculation helpers
├── validation.utils.ts        # Form validation
└── format.utils.ts            # String formatting
```

**Utility Pattern**:
```typescript
// Example: date.utils.ts
export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

export function isEventActive(startTime: string, endTime: string): boolean {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  return now >= start && now <= end
}
```

**Responsibilities by File**:

## date.utils.ts
- Format dates for display
- Parse ISO strings
- Calculate time remaining
- Check if event is active/upcoming/past
- Timezone conversions

## points.utils.ts
- Calculate point multipliers
- Format points display
- Determine ranking tier
- Calculate points for actions

## validation.utils.ts
- Email validation
- URL validation
- Required field checks
- Form error messages

## format.utils.ts
- Name capitalization
- Phone number formatting
- Truncate long text
- Pluralization helpers

**Best Practices**:
- Keep functions pure (same input = same output)
- No side effects (no API calls, no state mutations)
- Write unit testable code
- Export named functions (not default)
- Document complex logic with comments
