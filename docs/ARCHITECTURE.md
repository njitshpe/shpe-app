# SHPE App Architecture

## Overview
This document outlines the frontend architecture for the SHPE NJIT mobile app. The stack consists of **React Native (Expo)** with **Expo Router** for navigation, and **Supabase** for the backend (Auth, DB, Storage).

The codebase is organized by **domain** (auth, events, profile, media, etc.) with clear separation between UI (components), business logic (hooks), and device APIs (services).

## Core Features

### 1. Authentication
- **Provider**: Supabase Auth
- **Implementation**: `AuthContext.tsx` manages the global auth state (user session, profile data).
- **Flow**:
    - Users sign up with Email/Password or Google OAuth.
    - Sign-up and login screens handle user registration and authentication.
    - **Duplicate Detection**: Relies on Supabase Auth to prevent duplicate accounts (email/UCID).

### 2. Profile Management
- **Data Source**: `user_profiles` table in Supabase.
- **Service**: `lib/profileService.ts` handles fetching and updating profile data.
- **Features**:
    - Profile viewing and editing (bio, major, links, photo)
    - Resume upload and management
    - Onboarding flow for new users
    - Interest/tag selection

### 3. Event Management
- **Data Source**: `shpe_events` table.
- **Service**: `lib/eventsService.ts`.
- **Type System**:
    - `EventDB`: Database schema (snake_case, matches Supabase)
    - `EventUI`: Frontend schema (camelCase, optimized for React Native)
    - Mapping utilities in `utils/events.ts` for conversions
- **Features**: Event listing, check-in via QR code, RSVP, attendee management.

## File Structure

```
frontend/
├── app/                # Expo Router (file-based navigation)
│   ├── (app)/          # Authenticated app routes
│   ├── (auth)/         # Auth screens (login, signup)
│   └── _layout.tsx     # Root layout with auth gating
├── components/         # Reusable UI components (domain-organized)
│   ├── auth/           # Authentication UI (AuthInput)
│   ├── events/         # Event components (AttendeesPreview, EventActionBar, etc.)
│   ├── media/          # Media components (ImageSourceModal, ResumeUploader)
│   ├── onboarding/     # Onboarding pages
│   ├── profile/        # Profile components (EditProfileScreen, InterestPicker, ProfileForm)
│   └── shared/         # Shared utilities (ErrorBoundary, MapPreview)
├── constants/          # App-wide constants
│   ├── calendar-theme.ts # Calendar theming (DAY_MODE_THEME, NEON_COLORS, etc.)
│   ├── colors.ts       # Centralized SHPE brand color palette
│   └── index.ts        # Barrel export
├── contexts/           # React Contexts for global state
│   ├── AuthContext.tsx # User session & profile state
│   └── NotificationContext.tsx
├── hooks/              # Custom React hooks (domain-organized)
│   ├── calendar/       # Calendar hooks (useAdaptiveTheme, useCalendarScroll)
│   ├── events/         # Event hooks (useEventAttendees, useEventRegistration)
│   ├── media/          # Media hooks (useProfilePhoto)
│   └── profile/        # Profile hooks (useProfile, useResume, useEditProfile)
├── lib/                # Supabase client & data services
│   ├── supabase.ts     # Supabase client (reads from .env)
│   ├── eventsService.ts
│   └── profileService.ts
├── services/           # Platform/device services (no business logic)
│   ├── camera.service.ts
│   ├── photo.service.ts
│   ├── deviceCalendar.service.ts
│   └── notification.service.ts
├── types/              # TypeScript definitions
│   ├── attendee.ts
│   ├── auth.ts
│   ├── calendar.ts
│   ├── errors.ts       # Standardized error types & mapping
│   ├── events.ts       # EventDB (database schema) & EventUI (frontend schema)
│   ├── notifications.ts
│   └── userProfile.ts  # User data interfaces
└── utils/              # Pure helper functions
    ├── date.ts
    ├── events.ts       # Type mapping (mapEventDBToUI, mapEventUIToDB)
    ├── phoneNumber.ts  # Phone formatting
    ├── validation.ts   # Pure validation (no side effects)
    └── index.ts        # Barrel export
```

## Key Technical Decisions

### Domain-Based Organization
- **Components, Hooks, Services**: Organized by feature domain (`auth/`, `events/`, `profile/`, `media/`, etc.)
- **Barrel Exports**: Each domain has an `index.ts` for cleaner imports
- **Separation of Concerns**: UI (components), logic (hooks), device APIs (services)

### Type Safety & Data Mapping
- **Dual Event Types**: `EventDB` (database schema, snake_case) and `EventUI` (frontend schema, camelCase)
- **Mapping Utilities**: `utils/events.ts` provides `mapEventDBToUI` and `mapEventUIToDB` for type-safe conversions
- **Pure Functions**: All utilities have no side effects (e.g., `validation.ts` returns errors, doesn't call `Alert`)

### Centralized Configuration
- **Colors**: All colors defined in `constants/colors.ts` (SHPE_COLORS)
- **Calendar Theming**: Separate file `constants/calendar-theme.ts` with SCREAMING_SNAKE_CASE exports
- **Error Handling**: Standardized `ServiceResponse` pattern and `AppError` type in `types/errors.ts`

### Performance Optimization
- **Lazy Loading**: Profile screen uses `React.lazy` and `Suspense` for deferred loading
- **Barrel Exports**: Reduced import complexity and improved tree-shaking

### Security
- **RLS (Row Level Security)**: Supabase RLS policies protect user data
- **Environment Variables**: Supabase credentials loaded from `frontend/.env` (not hardcoded)
- **Debug UI**: Wrapped in `__DEV__` to exclude from production builds

## Module Boundaries

### Components (`/components/`)
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Props in → UI out
- ✅ Fully reusable
- ✅ Domain-organized (auth, events, profile, media, shared)

### Hooks (`/hooks/`)
- ❌ No UI/JSX
- ✅ Business logic
- ✅ Supabase calls
- ✅ Returns data + loading states
- ✅ Domain-organized (calendar, events, media, profile)

### Services (`/services/`)
- ❌ No business logic
- ❌ No Supabase calls
- ✅ Device abstraction only (camera, notifications, etc.)
- ✅ Returns raw data/results

### Lib (`/lib/`)
- ✅ Supabase client initialization
- ✅ Data access layer (CRUD operations)
- ✅ Auth helpers
- ❌ No UI components

## Additional Technical Details

### Navigation
- **Routing**: Expo Router with file-based navigation
- **Structure**:
  - `(app)/` - Authenticated routes (tabs, calendar, events, profile)
  - `(auth)/` - Authentication routes (login, signup, onboarding)
  - Auth gating handled in root `_layout.tsx`

### State Management
- **Global State**: Managed via React Context API.
    - `AuthContext`: Holds `user` session, `profile` data, and auth methods (`signIn`, `signUp`, `signOut`).
    - `NotificationContext`: Manages push notification permissions and token registration.
- **Local State**: Screens use `useState` and `useEffect` for UI logic and data fetching.
- **Custom Hooks**: Domain-specific hooks encapsulate complex business logic.

### External Services & Native Modules
- **Supabase**: Backend-as-a-Service (Auth, DB, Storage).
- **Expo Camera**: Used for QR code scanning (event check-ins).
- **Expo Notifications**: Handles local and push notifications.
- **Expo Document Picker**: Used for resume uploads.
- **Expo Calendar**: Device calendar integration.

## Migration from Previous Structure

For developers familiar with the old structure, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for:
- Path migration map (old → new locations)
- Breaking changes (env vars, import updates)
- Updated import patterns with barrel exports
