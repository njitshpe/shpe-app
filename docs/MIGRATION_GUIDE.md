# Migration Guide - Codebase Restructuring (Phases 1-7)

This document describes the codebase restructuring completed in phases 1-7, including path changes, breaking changes, and updated import patterns.

---

## Summary of Changes

### Phase 1: Security & Cleanup
- **Moved Supabase credentials to `.env`** (previously hardcoded in `app.json`)
- **Deleted legacy files**: `ios-device.log`, `data/events.mock.json`
- **Updated**: `lib/supabase.ts` now reads only from `process.env`

### Phase 2: Type Consolidation & Mapping
- **Separated Event types**: `EventDB` (database schema, snake_case) and `EventUI` (frontend schema, camelCase)
- **Created mapping utilities**: `utils/events.ts` with `mapEventDBToUI` and `mapEventUIToDB`
- **Renamed type files**: Removed `.types` suffix (e.g., `attendee.types.ts` → `attendee.ts`)

### Phase 3: Business Logic Extraction
- **Extracted hooks**: `useEditProfile`, `useProfilePhoto`, `useResume`
- **Created pure utils**: `utils/validation.ts` (no side effects), `utils/phoneNumber.ts`
- **Refactored**: `EditProfileScreen.tsx` reduced by 35% (UI-only)

### Phase 4: Services & Hooks Organization
- **Reorganized by domain**:
  - `hooks/events/` (useEventAttendees, useEventRegistration)
  - `hooks/profile/` (useProfile, useResume, useEditProfile)
  - `hooks/media/` (useProfilePhoto)
- **Renamed services**: `calendarService` → `deviceCalendarService` for clarity

### Phase 5: Component Reorganization
- **Created domain folders**: `components/auth/`, `components/media/`, `components/profile/`, `components/shared/`, `components/events/`, `components/onboarding/`
- **Added barrel exports**: All component domains now have `index.ts` files
- **Improved imports**: Use barrel exports for cleaner import statements

### Phase 6: Constants & Utils Cleanup
- **Renamed constants**: `constants/calendarTheme.ts` → `constants/calendar-theme.ts`
- **Updated naming convention**: All exports now use SCREAMING_SNAKE_CASE
- **Removed duplication**: Inline color constants removed, now centralized in `constants/colors.ts`
- **Created barrel exports**: `constants/index.ts`, `utils/index.ts`

### Phase 7: Debug UI Cleanup
- **Wrapped debug UI in `__DEV__`**: Debug tools now hidden in production builds

---

## Path Migration Map

### Components

| Old Path | New Path |
|----------|----------|
| `components/AuthInput.tsx` | `components/auth/AuthInput.tsx` |
| `components/ImageSourceModal.tsx` | `components/media/ImageSourceModal.tsx` |
| `components/ResumeUploader.tsx` | `components/media/ResumeUploader.tsx` |
| `components/InterestPicker.tsx` | `components/profile/InterestPicker.tsx` |
| `components/ProfileForm.tsx` | `components/profile/ProfileForm.tsx` |
| `components/ErrorBoundary.tsx` | `components/shared/ErrorBoundary.tsx` |
| `components/MapPreview.tsx` | `components/shared/MapPreview.tsx` |

### Hooks

| Old Path | New Path |
|----------|----------|
| `hooks/Profile/useProfile.ts` | `hooks/profile/useProfile.ts` |
| `hooks/Profile/useResume.ts` | `hooks/profile/useResume.ts` |
| `hooks/useEventAttendees.ts` | `hooks/events/useEventAttendees.ts` |
| `hooks/useEventRegistration.ts` | `hooks/events/useEventRegistration.ts` |
| *(new)* | `hooks/profile/useEditProfile.ts` |
| *(new)* | `hooks/media/useProfilePhoto.ts` |

### Services

| Old Path | New Path |
|----------|----------|
| `lib/PhotoService.ts` | `services/photo.service.ts` |
| `lib/cameraService.ts` | `services/camera.service.ts` |
| `services/calendarService.ts` | `services/deviceCalendar.service.ts` |
| `services/registrationService.ts` | `services/registration.service.ts` |
| `services/shareService.ts` | `services/share.service.ts` |

### Constants

| Old Path | New Path |
|----------|----------|
| `constants/calendarTheme.ts` | `constants/calendar-theme.ts` |

### Types

| Old Path | New Path |
|----------|----------|
| `types/attendee.types.ts` | `types/attendee.ts` |
| `types/calendar.types.ts` | `types/calendar.ts` |

### Utils

| Old Path | New Path | Notes |
|----------|----------|-------|
| *(new)* | `utils/phoneNumber.ts` | Extracted from `validation.ts` |
| `utils/validation.ts` | `utils/validation.ts` | Now pure (no `formatPhoneNumber`) |

---

## Breaking Changes

### 1. Environment Variables (Phase 1)

**Before:**
```typescript
// Supabase credentials hardcoded in app.json
expo.extra.supabaseUrl
expo.extra.supabaseAnonKey
```

**After:**
```bash
# frontend/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Action Required:**
- Create `frontend/.env` with Supabase credentials
- Remove credentials from `app.json` (if any remain)

---

### 2. Import Path Updates

#### Components (Phase 5)

**Before:**
```typescript
import { AuthInput } from '../components/AuthInput';
import MapPreview from '../components/MapPreview';
```

**After:**
```typescript
import { AuthInput } from '../components/auth';
import { MapPreview } from '../components/shared';
```

#### Event Types (Phase 2)

**Before:**
```typescript
import { Event } from '../types/events';
// Used for both DB and UI
```

**After:**
```typescript
import { EventDB, EventUI } from '../types/events';
import { mapEventDBToUI } from '../utils/events';

// Use EventDB for database queries
const { data } = await supabase.from('shpe_events').select('*');
const uiEvents = data.map(mapEventDBToUI);

// Use EventUI for React components
function EventCard({ event }: { event: EventUI }) { ... }
```

#### Constants (Phase 6)

**Before:**
```typescript
import { dayModeTheme, neonColors, calendarTheme } from '../constants/calendarTheme';
```

**After:**
```typescript
import { DAY_MODE_THEME, NEON_COLORS, CALENDAR_THEME } from '../constants/calendar-theme';
// or use barrel export:
import { DAY_MODE_THEME, NEON_COLORS, CALENDAR_THEME } from '../constants';
```

#### Hooks (Phase 4)

**Before:**
```typescript
import { useProfile } from '../hooks/Profile/useProfile';
import { useEventRegistration } from '../hooks/useEventRegistration';
```

**After:**
```typescript
import { useProfile } from '../hooks/profile/useProfile';
import { useEventRegistration } from '../hooks/events/useEventRegistration';
```

#### Services (Phase 4)

**Before:**
```typescript
import { PhotoService } from '../lib/PhotoService';
import { calendarService } from '../services/calendarService';
```

**After:**
```typescript
import { PhotoHelper } from '../services/photo.service';
import { deviceCalendarService } from '../services/deviceCalendar.service';
```

#### Validation & Formatting (Phase 3 & 6)

**Before:**
```typescript
import { validateProfile, formatPhoneNumber } from '../utils/validation';
```

**After:**
```typescript
import { validateProfile } from '../utils/validation';
import { formatPhoneNumber } from '../utils/phoneNumber';
// or use barrel export:
import { validateProfile, formatPhoneNumber } from '../utils';
```

---

### 3. Validation API Changes (Phase 3)

**Before:**
```typescript
// Returns boolean, calls Alert directly
const isValid = validateProfile(profile);
if (!isValid) {
  // Alert already shown
}
```

**After:**
```typescript
// Returns ValidationError[], no side effects
const errors = validateProfile(profile);
if (errors.length > 0) {
  const firstError = errors[0];
  Alert.alert(firstError.title, firstError.message);
}
```

---

## Updated Import Patterns

### Barrel Exports (Recommended)

**Components:**
```typescript
// Auth components
import { AuthInput } from '@/components/auth';

// Media components
import { ImageSourceModal, ResumeUploader } from '@/components/media';

// Profile components
import { InterestPicker, ProfileForm, EditProfileScreen } from '@/components/profile';

// Shared components
import { ErrorBoundary, MapPreview } from '@/components/shared';

// Event components
import {
  AttendeesPreview,
  EventActionBar,
  ACTION_BAR_BASE_HEIGHT,
  RegistrationSuccessModal,
  EventMoreMenu,
} from '@/components/events';
```

**Constants:**
```typescript
import { SHPE_COLORS, DAY_MODE_THEME, NEON_COLORS } from '@/constants';
```

**Utils:**
```typescript
import { validateProfile, formatPhoneNumber, mapEventDBToUI } from '@/utils';
```

---

## Codebase Health Improvements

### Removed Duplication
- **Color constants**: Removed 3 instances of duplicate color definitions
- **Mock data**: Removed outdated `events.mock.json` (now using `mockEvents.ts`)
- **Phone formatting**: Centralized in `utils/phoneNumber.ts` (was duplicated in components)

### Improved Organization
- **35% reduction** in `EditProfileScreen.tsx` complexity
- **Domain-based structure** for components, hooks, and services
- **Pure functions** in `utils/` (no side effects)
- **Type safety** with separate `EventDB` and `EventUI` interfaces

### Security Enhancements
- **No hardcoded credentials** in source code
- **Environment variables** for all sensitive config
- **.gitignore** updated to exclude `.env`

---

## Migration Checklist

- [ ] Create `frontend/.env` with Supabase credentials
- [ ] Update all component imports to use barrel exports
- [ ] Replace `Event` type with `EventDB`/`EventUI` where appropriate
- [ ] Update constant imports to use SCREAMING_SNAKE_CASE
- [ ] Update hook imports to use domain-based paths
- [ ] Replace `formatPhoneNumber` imports to point to `utils/phoneNumber`
- [ ] Update `validateProfile` calls to handle `ValidationError[]`
- [ ] Verify no lingering references to old paths (search for `Profile/`, `calendarTheme`, etc.)

---

## Need Help?

If you encounter import errors after this migration:

1. **Check the path**: Use the migration map above
2. **Use barrel exports**: Import from `@/components/auth` instead of `@/components/auth/AuthInput`
3. **Update type usage**: Use `EventDB` for database, `EventUI` for UI
4. **Check constants**: All calendar constants are now SCREAMING_SNAKE_CASE

For questions, see [CODEBASE.md](./CODEBASE.md) or [ARCHITECTURE.md](./ARCHITECTURE.md).
