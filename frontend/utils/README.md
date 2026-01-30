# /utils/ - Pure Helper Functions

**Purpose**: Pure utility functions (no side effects)

**Current Utils**:
```
utils/
├── date.ts              # Date formatting, manipulation
├── events.ts            # Event type mapping (EventDB ↔ EventUI)
├── phoneNumber.ts       # Phone number formatting
├── validation.ts        # Pure validation functions
└── index.ts             # Barrel export
```

**Utility Pattern**:
```typescript
// Example: phoneNumber.ts
export function formatPhoneNumber(value: string): string {
  const cleaned = ('' + value).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return value;
}
```

**Responsibilities by File**:

## date.ts
- Format dates for display
- Parse ISO strings
- Date calculations

## events.ts
- Type mapping: `mapEventDBToUI(event: EventDB): EventUI`
- Type mapping: `mapEventUIToDB(event: EventUI): EventDB`
- Converts between database (snake_case) and UI (camelCase) schemas

## phoneNumber.ts
- Format phone numbers as (XXX) XXX-XXXX
- Partial formatting as user types
- Pure function, no validation

## validation.ts
- Pure validation functions (no side effects)
- Returns `ValidationError[]` instead of calling Alert
- Email validation, URL validation, etc.

**Best Practices**:
- Keep functions pure (same input = same output)
- No side effects (no API calls, no Alert, no state mutations)
- Write unit testable code
- Export named functions (not default)
- Use barrel exports via index.ts

**Import Pattern**:
```typescript
// Use barrel export
import { formatPhoneNumber, validateProfile, mapEventDBToUI } from '@/utils';

// Or direct import
import { formatPhoneNumber } from '@/utils/phoneNumber';
```
