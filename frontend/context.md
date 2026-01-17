# Animated Splash Screen Implementation

## Overview
Implemented a Luma-style animated splash screen that transitions seamlessly into the app. The splash follows a 5-frame choreography with GPU-accelerated glow effects using Skia, with a deterministic fallback glow in Expo Go.

## Files Modified/Created

### New Files
- `components/AnimatedSplash.tsx` - The main animated splash component

### Modified Files
- `app.json` - Updated splash screen config and added expo-splash-screen plugin
- `app/_layout.tsx` - Wrapped root layout with AnimatedSplash
- `package.json` - Added expo-splash-screen and @shopify/react-native-skia dependencies

## Dependencies Added
```json
"expo-splash-screen": "^31.0.13",
"@shopify/react-native-skia": "^2.4.14"
```

## Configuration Changes

### app.json
```json
"splash": {
  "image": "./assets/app-logo-white-transparent.png",
  "resizeMode": "contain",
  "backgroundColor": "#000000"
},
"plugins": [
  ["expo-splash-screen", {
    "backgroundColor": "#000000",
    "image": "./assets/app-logo-white-transparent.png",
    "imageWidth": 200
  }]
]
```

## Animation Sequence (5 Frames)

| Frame | Duration | Description |
|-------|----------|-------------|
| 1 | 200ms | White logo visible (seamless from native splash) |
| 2 | 350ms | Glow fades in with continuous breathing + subtle drift |
| 3 | 300ms | Switch to colored logo, dip to 0.88 early (coil), micro-hold, glow fades out |
| 4 | 450ms | Logo expands explosively to cover screen diagonal (aggressive burst easing) |
| 5 | 500ms | App UI fades in at 75% expansion, star becomes subtle tint (0.22) then fades |

**Total animation: ~1.8s**

## Key Implementation Details

### Layer Structure (Luma-accurate)
```
Base black background (always visible)
└── App content (underlay, fades in during Frame 5)
└── Splash overlay container (single container)
    ├── Backdrop black (fades last)
    ├── Glow layer (offset nebula gradients, breathing, subtle drift)
    └── Star/logo layer (fades to tint then out)
```

### Glow Effect
- **Skia (dev client)**: GPU-accelerated radial gradients with stronger blur and soft falloff
- **Fallback (Expo Go)**: `react-native-svg` radial gradients (no view shadows/elevation)
- Colors skew violet/magenta + ambient base (no hard circle edges)
- Continuous breathing animation (±2% scale)
- Subtle drift (no rotation)

### No White Flash
- Native splash uses `#000000` background
- First React frame renders black background with white logo
- `InteractionManager.runAfterInteractions()` + double `requestAnimationFrame()` ensures paint before hiding native splash

### Session Guard
- Module-level `hasShownSplashThisSession` flag
- Prevents replay on hot refresh / navigation
- Resets on full JS bundle reload (acceptable for dev)

### Scale Calculation
```typescript
const SCREEN_DIAGONAL = Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2);
const LOGO_SIZE_HUGE = SCREEN_DIAGONAL * 1.5; // Covers all aspect ratios
```

### Hi-Res Logo Strategy
```typescript
const LOGO_ASSET_SOURCE = Image.resolveAssetSource(whiteLogo);
const LOGO_SOURCE_SIZE = Math.max(LOGO_ASSET_SOURCE?.width ?? 0, LOGO_ASSET_SOURCE?.height ?? 0);
const LOGO_BASE_SCALE = LOGO_SIZE_INITIAL / Math.max(1, LOGO_SOURCE_SIZE);
```
- `styles.logo` uses `LOGO_SOURCE_SIZE` to keep pixel density high.
- `logoContainerStyle` applies `logoScale.value * LOGO_BASE_SCALE` once in both waiting + animating phases.

### Logo Size Alignment (Native ↔ RN)
```typescript
// Match native splash imageWidth (200 logical pixels) for seamless transition
const NATIVE_SPLASH_IMAGE_WIDTH = 200;
const LOGO_SIZE_INITIAL = PixelRatio.roundToNearestPixel(NATIVE_SPLASH_IMAGE_WIDTH);
```

## Assets Used
- `assets/app-logo-white-transparent.png` - White logo for native splash + Frames 1-2
- `assets/app-logo-transparent.png` - Colored/gradient logo for Frames 3-5

## Expo Go vs Dev Client
- **Expo Go**: Uses FallbackGlow (View-based shadows, no Skia)
- **Dev Client**: Uses SkiaGlow (GPU-accelerated radial gradients)

To test with full Skia glow:
```bash
npx expo run:ios
# or
npx expo run:android
```

## Animation Timing Details

### Reanimated SharedValue Best Practice
**Critical:** Each SharedValue must have only ONE assignment per timeline to avoid animation cancellation. Animations for multiple frames are chained using `withSequence()`:

```typescript
// CORRECT: Single chained animation
logoScale.value = withDelay(frame3Start, withSequence(
  withTiming(0.8, { duration: 105 }),  // Frame 3: dip
  withTiming(0.8, { duration: 195 }),  // Frame 3: hold
  withTiming(HUGE, { duration: 450 })  // Frame 4: expand
));

// WRONG: Multiple assignments cancel earlier animations
logoScale.value = withDelay(frame3Start, ...); // Gets cancelled!
logoScale.value = withDelay(frame4Start, ...); // Overwrites above
```

### Frame 3 Scale Dip (Luma-style "coil before spring")
- Brief hold at full size (30% of Frame 3 = 90ms)
- Dip to 0.88 scale (35% = 105ms) - more pronounced than before
- Micro-hold at dip (35% = 105ms) - builds tension before expansion

### Frame 4 Expansion
- Easing: `Easing.bezier(0.16, 1, 0.3, 1)` - aggressive burst then gentle finish
- Covers full screen diagonal with 1.5x margin

### Frame 5 Layer Fades
1. App content fades in (30% of Frame 5 = 150ms)
2. Star fades to 0.22 opacity (subtle tinted overlay)
3. Star fades to 0 (35% = 175ms)
4. Backdrop fades to 0 (after star is mostly gone)
5. Overlay container cleanup fade

## App Backgrounding Handling
- AppState listener detects when app returns to active during animation
- If backgrounded mid-splash, animation skips to complete on return
- Prevents animation desync and ensures clean state

## Android-Specific Considerations
- Avoided `elevation` and shadow-based glow on the fallback path to prevent brightness pulsing

## Acceptance Criteria Met
- [x] No white flash between native and RN splash
- [x] Native splash background matches first RN frame (#000000)
- [x] 5-frame choreography visible and smooth
- [x] GPU-friendly glow (Skia in dev client, fallback in Expo Go)
- [x] No loading text or spinners
- [x] App fully interactive after splash completes
- [x] Works with Expo Router navigation
- [x] Session guard prevents replay on dev reload
- [x] No SharedValue overwrite bugs (single assignment per timeline)
- [x] Logo size matches between native and RN (no jump)
- [x] Android flicker mitigated (no elevation on animated layers)
- [x] App backgrounding handled gracefully
- [x] Status bar hidden during splash and restored on unmount
