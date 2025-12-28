# SHPE App Architecture

## Overview
This document outlines the frontend architecture for the SHPE NJIT mobile app. The stack consists of **React Native (Expo)** on the frontend and **Supabase** for the backend (Auth, DB, Storage).

The goal is to keep the codebase modular: `screens` handle UI, `lib` handles logic/API calls, and `contexts` manage global state.

## Core Features

### 1. Authentication
- **Provider**: Supabase Auth
- **Implementation**: `AuthContext.tsx` manages the global auth state (user session, profile data).
- **Flow**:
    - Users sign up with Email/Password or Google OAuth.
    - `SignupScreen.tsx` handles user registration, including specific logic for students (UCID validation) vs. non-students.
    - `LoginScreen.tsx` handles sign-in.
    - **Duplicate Detection**: Relies on Supabase Auth to prevent duplicate accounts (email/UCID).

### 2. Profile Management
- **Data Source**: `user_profiles` table in Supabase.
- **Service**: `lib/profileService.ts` handles fetching and updating profile data.
- **Screens**:
    - `ProfileScreen.tsx`: Displays user info, resume status, and links. Uses **Lazy Loading** for the settings modal to improve performance.
    - `EditProfileScreen.tsx`: Allows users to update their bio, major, links, and photo.
    - `OnboardingScreen.tsx`: Forces new users to complete their profile before accessing the app.

### 3. Event Management
- **Data Source**: `shpe_events` table.
- **Service**: `lib/eventsService.ts`.
- **Features**: Event listing, check-in via QR code (`QRScannerScreen.tsx`), and RSVP.

## File Structure

```
frontend/
├── components/         # Reusable UI components
│   ├── AuthInput.tsx
│   ├── Button.tsx
│   └── ...
├── constants/          # App-wide constants
│   └── colors.ts       # Centralized SHPE brand color palette
├── contexts/           # React Contexts for global state
│   ├── AuthContext.tsx # User session & profile state
│   └── NotificationContext.tsx
├── lib/                # Business logic and API services
│   ├── supabase.ts     # Supabase client configuration
│   ├── profileService.ts
│   ├── eventsService.ts
│   ├── cameraService.ts
│   └── notificationService.ts
├── screens/            # Application screens
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── EditProfileScreen.tsx
│   ├── NotificationSettingsScreen.tsx
│   └── QRScannerScreen.tsx
└── types/              # TypeScript definitions
    ├── auth.ts
    ├── camera.ts
    ├── errors.ts       # Standardized error types & mapping
    ├── events.ts
    ├── notifications.ts
    └── userProfile.ts  # User data interfaces
```

## Key Technical Decisions

### Centralized Configuration
- **Colors**: All colors are defined in `constants/colors.ts` to ensure brand consistency and easy theming updates.
- **Error Handling**: A standardized `ServiceResponse` pattern and `AppError` type (in `types/errors.ts`) are used across all services to provide consistent error feedback to users.

### Performance Optimization
- **Lazy Loading**: `ProfileScreen.tsx` uses `React.lazy` and `Suspense` to defer loading the `NotificationSettingsScreen` until it is actually needed. This reduces the initial bundle size and speeds up navigation.

### Security
- **RLS (Row Level Security)**: Supabase RLS policies protect user data. The frontend respects these boundaries (e.g., relying on Auth for duplicate checks instead of querying the DB directly).
- **Environment Variables**: Sensitive keys (Supabase URL/Anon Key) are loaded from `.env.local` and validated at runtime.

## Additional Technical Details

### Navigation
- **Routing**: Currently implemented via conditional rendering in `App.tsx` based on auth state (`user` ? `MainApp` : `AuthStack`).
- **Future**: Planned migration to `React Navigation` for more robust stack/tab routing.

### State Management
- **Global State**: Managed via React Context API.
    - `AuthContext`: Holds `user` session, `profile` data, and auth methods (`signIn`, `signUp`, `signOut`).
    - `NotificationContext`: Manages push notification permissions and token registration.
- **Local State**: Screens use `useState` and `useEffect` for UI logic and data fetching.

### External Services & Native Modules
- **Supabase**: Backend-as-a-Service (Auth, DB, Storage).
- **Expo Camera**: Used in `QRScannerScreen.tsx` for event check-ins.
- **Expo Notifications**: Handles local and push notifications.
- **Expo Document Picker**: Used for resume uploads.

