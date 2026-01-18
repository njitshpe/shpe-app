# Welcome Screen Implementation Context

This document summarizes the Luma-style auth gateway implementation for the SHPE app.

## Overview

Replaced the old login/signup screens with a new animated welcome gateway featuring:
- Animated grid background with horizontally scrolling images
- Gradient overlay with centered text
- Bottom sheet for login/signup forms
- Drag-and-drop interaction on floating images

## Files Created

### Components

1. **`components/auth/AnimatedGridBackground.tsx`**
   - Horizontally scrolling grid of event images
   - Uses local webp images from `assets/auth-grid/`
   - "Invisible Track" system with 3 bands to prevent image collisions
   - Staggered fade-in entrance animation (80ms delay per image)
   - Drag-and-drop interaction using `react-native-gesture-handler`
   - Premium spring-back animation when releasing dragged images
   - Scale-up effect (1.12x) and z-index boost when dragging

2. **`components/auth/WelcomeOverlay.tsx`**
   - Full-screen overlay with gradient fade (70% screen height)
   - "Delightful events" title in white
   - "start here" text with purple/pink gradient (`#C644FC` to `#5856D6`)
   - Single round gradient button with downward arrow
   - All content center-aligned

3. **`components/auth/AuthBottomSheet.tsx`**
   - Animated bottom sheet using `react-native-reanimated`
   - Spring animation for open/close (`damping: 20, stiffness: 90`)
   - Dark theme (`#1A1A1A` background)
   - Login/signup form with mode toggle
   - Integrated with `useAuth()` for Supabase authentication
   - Shows `ActivityIndicator` during loading
   - Accepts `initialEmail` prop for deep link handling

### Screens

4. **`app/(auth)/welcome.tsx`**
   - Main gateway screen combining all three components
   - Handles deep links via `useLocalSearchParams` for email confirmation
   - Opens bottom sheet automatically when email param is present

## Files Modified

### Routing Updates

1. **`app/index.tsx`**
   - Changed redirect from `/login` to `/(auth)/welcome` for unauthenticated users

2. **`app/_layout.tsx`**
   - Updated `inAuthGroup` check to use `/welcome` instead of `/login` or `/signup`
   - Changed Rule 1 redirect from `/login` to `/(auth)/welcome`

## Files Deleted

- `app/(auth)/login.tsx`
- `app/(auth)/signup.tsx`

## Dependencies Installed

```bash
npx expo install react-native-reanimated expo-image @react-native-masked-view/masked-view react-native-gesture-handler
```

- `react-native-reanimated` - Animations for grid background and bottom sheet
- `expo-image` - Optimized image loading for grid
- `@react-native-masked-view/masked-view` - Gradient text effect
- `react-native-gesture-handler` - Drag-and-drop interaction on floating images

## Assets Used

Images in `assets/auth-grid/`:
- shpe-allies.webp
- pre-college-25.webp
- info-learn.webp
- bofa-info.webp
- hype-community.webp
- advocate.webp
- gala-2025.webp
- triple-awards.webp
- cds-award.webp
- karaoke-25.webp
- convention-25.webp
- nyc-mixer.webp

## Color Palette

- Background: `#000000`
- Bottom sheet: `#1A1A1A`
- Gradient: `#C644FC` to `#5856D6` (purple/pink)
- Primary button: `#5856D6`
- Image frames: `rgba(255, 255, 255, 0.15)` border
- Top gradient overlay: `rgba(205, 134, 20, 0.54)` (gold/amber)

## Animation Details

### AnimatedGridBackground

**Layout System - "Invisible Tracks":**
- 3 horizontal bands to prevent image collisions
- Track 1 (Top, y: 0.0-0.2): Speed 45000ms
- Track 2 (Middle, y: 0.25-0.5): Speed 38000ms
- Track 3 (Bottom, y: 0.55-0.8): Speed 42000ms
- Images within same track share speed = never collide

**Entrance Animation:**
- Staggered delay: 80ms per image (cascading waterfall effect)
- Fade in: 800ms with `Easing.out(Easing.quad)`
- Vertical slide: 1000ms with `Easing.out(Easing.cubic)`
- Horizontal movement starts 200ms after fade begins

**Horizontal Movement:**
- Uses `withRepeat` + `withSequence` for seamless looping
- Progress-based interpolation (0→1) mapped to screen coordinates
- Path: -190px (off-left) to SCREEN_WIDTH+50 (off-right)

**Drag Interaction:**
- `Gesture.Pan()` from react-native-gesture-handler
- Scale up to 1.12x when pressed
- Z-index jumps to 1000 when dragging
- Spring-back: `damping: 20, stiffness: 200`

**Performance Optimizations:**
- `cancelAnimation()` on unmount prevents memory leaks
- `useMemo` on gesture to prevent recreation
- `cachePolicy="memory-disk"` and `priority="high"` on images
- Hardware-accelerated shadows via `elevation` and `shadowOffset`

### AuthBottomSheet
- Uses `withSpring` for open/close
- Spring config: `{ damping: 20, stiffness: 90 }`
- Translates from `SCREEN_HEIGHT` (hidden) to `0` (visible)

## Grid Padding Configuration

```typescript
const GRID_PADDING_TOP = SCREEN_HEIGHT * 0.1;    // 10% from top
const GRID_PADDING_BOTTOM = SCREEN_HEIGHT * 0.4; // 40% from bottom
const GRID_CONTENT_HEIGHT = SCREEN_HEIGHT - GRID_PADDING_TOP - GRID_PADDING_BOTTOM; // 50% active area
```

Images are constrained to the top 60% of the screen to leave room for the welcome overlay and bottom sheet.

## Auth Integration

The `AuthBottomSheet` integrates with the existing `AuthContext`:
- `signIn(email, password)` for login
- `signUp(email, password)` for signup
- Error handling with `Alert.alert()`
- Loading state with `ActivityIndicator`

## Deep Link Support

The welcome screen handles email confirmation redirects:
1. `useLocalSearchParams` extracts `email` param
2. If email exists, bottom sheet opens automatically
3. `initialEmail` prop pre-fills the email field
