import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  InteractionManager,
  PixelRatio,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Circle as SvgCircle,
} from 'react-native-svg';

// ============================================================================
// CONFIGURATION
// ============================================================================
let hasShownSplashThisSession = false;

const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

// Skia Import Logic (only for dev builds, not Expo Go)
let Canvas: any = null;
let Circle: any = null;
let RadialGradient: any = null;
let vec: any = null;
let Blur: any = null;
let Group: any = null;

if (!isExpoGo) {
  try {
    const Skia = require('@shopify/react-native-skia');
    Canvas = Skia.Canvas;
    Circle = Skia.Circle;
    RadialGradient = Skia.RadialGradient;
    vec = Skia.vec;
    Blur = Skia.Blur;
    Group = Skia.Group;
  } catch (e) {
    console.log("Skia load failed", e);
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// NEW COLORS (SHPE PALETTE)
const COLOR_AMBER = '#a53d00cb';  // Warm/Copper (Horizontal - Left/Right)
const COLOR_BLUE = '#0059cdc4';   // Cool/Blue (Vertical - Top/Bottom)

// ASSETS
const whiteLogo = require('@/assets/app-logo-white-transparent.png');
const coloredLogo = require('@/assets/app-logo-transparent.png');

// ANIMATION CONFIG
const EXPAND_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

// SIZING
const NATIVE_SPLASH_IMAGE_WIDTH = 120;
const LOGO_SIZE_INITIAL = PixelRatio.roundToNearestPixel(NATIVE_SPLASH_IMAGE_WIDTH);
const LOGO_ASSET_SOURCE = Image.resolveAssetSource(whiteLogo);
const LOGO_SOURCE_SIZE =
  Math.max(LOGO_ASSET_SOURCE?.width ?? 0, LOGO_ASSET_SOURCE?.height ?? 0) ||
  LOGO_SIZE_INITIAL;
const LOGO_BASE_SCALE = LOGO_SIZE_INITIAL / Math.max(1, LOGO_SOURCE_SIZE);

// GLOW CONSTANTS
const GLOW_RADIUS = SCREEN_WIDTH * 0.2;

interface AnimatedSplashProps {
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

// ============================================================================
// GLOW COMPONENT - Skia version (for dev builds)
// ============================================================================
const SkiaGlow = ({ opacity, scale }: { opacity: SharedValue<number>; scale: SharedValue<number> }) => {
  if (!Canvas) return null;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  // Offset for positioning the glow orbs away from center
  const glowOffset = GLOW_RADIUS * 0.6;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Blur blur={60} />
          {/* Blue Glow - Top (12 o'clock) */}
          <Circle cx={centerX} cy={centerY - glowOffset} r={GLOW_RADIUS}>
            <RadialGradient
              c={vec(centerX, centerY - glowOffset)}
              r={GLOW_RADIUS}
              colors={[`${COLOR_BLUE}80`, `${COLOR_BLUE}33`, 'transparent']}
              positions={[0, 0.5, 1]}
            />
          </Circle>
          {/* Blue Glow - Bottom (6 o'clock) */}
          <Circle cx={centerX} cy={centerY + glowOffset} r={GLOW_RADIUS}>
            <RadialGradient
              c={vec(centerX, centerY + glowOffset)}
              r={GLOW_RADIUS}
              colors={[`${COLOR_BLUE}80`, `${COLOR_BLUE}33`, 'transparent']}
              positions={[0, 0.5, 1]}
            />
          </Circle>
          {/* Amber Glow - Right (3 o'clock) */}
          <Circle cx={centerX + glowOffset} cy={centerY} r={GLOW_RADIUS}>
            <RadialGradient
              c={vec(centerX + glowOffset, centerY)}
              r={GLOW_RADIUS}
              colors={[`${COLOR_AMBER}80`, `${COLOR_AMBER}33`, 'transparent']}
              positions={[0, 0.5, 1]}
            />
          </Circle>
          {/* Amber Glow - Left (9 o'clock) */}
          <Circle cx={centerX - glowOffset} cy={centerY} r={GLOW_RADIUS}>
            <RadialGradient
              c={vec(centerX - glowOffset, centerY)}
              r={GLOW_RADIUS}
              colors={[`${COLOR_AMBER}80`, `${COLOR_AMBER}33`, 'transparent']}
              positions={[0, 0.5, 1]}
            />
          </Circle>
        </Group>
      </Canvas>
    </Animated.View>
  );
};

// ============================================================================
// GLOW COMPONENT - SVG Fallback (for Expo Go)
// ============================================================================
const FallbackGlow = ({ opacity, scale }: { opacity: SharedValue<number>; scale: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const glowOffset = GLOW_RADIUS * 0.6;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.glowContainer, animatedStyle]}>
      <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Blue gradient for vertical glows (Top/Bottom) */}
          <SvgRadialGradient
            id="blueGlowGradient"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor={COLOR_BLUE} stopOpacity="0.5" />
            <Stop offset="50%" stopColor={COLOR_BLUE} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={COLOR_BLUE} stopOpacity="0" />
          </SvgRadialGradient>
          {/* Amber gradient for horizontal glows (Left/Right) */}
          <SvgRadialGradient
            id="amberGlowGradient"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor={COLOR_AMBER} stopOpacity="0.5" />
            <Stop offset="50%" stopColor={COLOR_AMBER} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={COLOR_AMBER} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        {/* Blue Glow - Top (12 o'clock) */}
        <SvgCircle
          cx={centerX}
          cy={centerY - glowOffset}
          r={GLOW_RADIUS}
          fill="url(#blueGlowGradient)"
        />
        {/* Blue Glow - Bottom (6 o'clock) */}
        <SvgCircle
          cx={centerX}
          cy={centerY + glowOffset}
          r={GLOW_RADIUS}
          fill="url(#blueGlowGradient)"
        />
        {/* Amber Glow - Right (3 o'clock) */}
        <SvgCircle
          cx={centerX + glowOffset}
          cy={centerY}
          r={GLOW_RADIUS}
          fill="url(#amberGlowGradient)"
        />
        {/* Amber Glow - Left (9 o'clock) */}
        <SvgCircle
          cx={centerX - glowOffset}
          cy={centerY}
          r={GLOW_RADIUS}
          fill="url(#amberGlowGradient)"
        />
      </Svg>
    </Animated.View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
SplashScreen.preventAutoHideAsync().catch(() => {});

export function AnimatedSplash({ children, onAnimationComplete }: AnimatedSplashProps) {
  const shouldSkip = hasShownSplashThisSession;
  const [phase, setPhase] = useState<'waiting' | 'animating' | 'complete'>(
    shouldSkip ? 'complete' : 'waiting'
  );

  // Shared values - all start at 0/hidden
  const logoScale = useSharedValue(0);
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const whiteLogoOpacity = useSharedValue(0);
  const coloredLogoOpacity = useSharedValue(0);
  const splashContainerOpacity = useSharedValue(1);
  const appContentOpacity = useSharedValue(0);

  // Animated styles
  const containerTransform = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value * LOGO_BASE_SCALE }],
  }));

  const whiteLogoStyle = useAnimatedStyle(() => ({ opacity: whiteLogoOpacity.value }));
  const coloredLogoStyle = useAnimatedStyle(() => ({ opacity: coloredLogoOpacity.value }));

  const runAnimation = useCallback(() => {
    hasShownSplashThisSession = true;

    // ============================================================
    // TIMELINE
    // ============================================================
    // 0ms:        Screen is black, Scale = 0
    // 200ms:      Logo birth starts (0 -> 1)
    // 550ms:      Glow birth starts (0 -> 1)
    // 1150ms:     Coil/Dip starts (both shrink 1 -> 0.8)
    //             - White logo fades out, Colored logo fades in (crossfade)
    // 1400ms:     Ignition (glow shrinks to 0, logo explodes + fades)
    // ~1900ms:    Complete
    // ============================================================

    // TIMING CONSTANTS
    const T_LOGO_START = 200;
    const T_LOGO_GROW = 350;      // 200 -> 550

    const T_GLOW_START = 550;
    const T_GLOW_GROW = 600;      // 550 -> 1150

    const T_DIP_START = 1150;
    const T_DIP_DURATION = 250;   // 1150 -> 1400 (The Coil)

    const T_IGNITION = 1400;
    const T_EXPLODE = 600;        // Explosion duration
    const T_GLOW_SHRINK = 50;    // Glow shrinks to 0

    // ============================================================
    // LOGO SCALE: 0 -> 1 -> 0.8 -> 60
    // ============================================================
    logoScale.value = withDelay(T_LOGO_START,
      withSequence(
        // Phase 1: Birth (0 -> 1) with slight overshoot
        withTiming(1, { duration: T_LOGO_GROW, easing: Easing.out(Easing.back(1.5)) }),
        // Wait until Dip starts
        withDelay(T_DIP_START - T_LOGO_START - T_LOGO_GROW,
          withSequence(
            // Phase 2: Dip/Coil (1 -> 0.8)
            withTiming(0.8, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.cubic) }),
            // Phase 3: Explode (0.8 -> 60)
            withTiming(60, { duration: T_EXPLODE, easing: EXPAND_EASING })
          )
        )
      )
    );

    // ============================================================
    // GLOW SCALE: 0 -> 1 -> 0.8 -> 0 (shrinks to nothing at ignition)
    // ============================================================
    glowScale.value = withDelay(T_GLOW_START,
      withSequence(
        // Phase 1: Birth (0 -> 1)
        withTiming(1, { duration: T_GLOW_GROW, easing: Easing.out(Easing.back(1.2)) }),
        // Phase 2: Dip/Coil (1 -> 0.8) - shrinks with logo
        withTiming(0.8, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.cubic) }),
        // Phase 3: Shrink to 0 at ignition (instead of instant opacity cut)
        withTiming(0, { duration: T_GLOW_SHRINK, easing: Easing.in(Easing.cubic) })
      )
    );

    // ============================================================
    // GLOW OPACITY: 0 -> 1 (stays visible, scale handles disappearance)
    // ============================================================
    glowOpacity.value = withDelay(T_GLOW_START,
      withTiming(1, { duration: 200 })
    );

    // ============================================================
    // WHITE LOGO OPACITY: 0 -> 1 -> 0 (crossfade during Dip)
    // Both logos visible during crossfade for smooth transition
    // ============================================================
    whiteLogoOpacity.value = withDelay(T_LOGO_START,
      withSequence(
        // Fade in with logo birth
        withTiming(1, { duration: 150 }),
        // Hold until Dip starts
        withDelay(T_DIP_START - T_LOGO_START - 150,
          // Crossfade out during the Dip
          withTiming(0, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.quad) })
        )
      )
    );

    // ============================================================
    // COLORED LOGO OPACITY: 0 -> 1 (during Dip) -> 0 (during explode)
    // Crossfades in as white fades out, then fades during explosion
    // ============================================================
    coloredLogoOpacity.value = withDelay(T_DIP_START,
      withSequence(
        // Crossfade in during the Dip (synced with white fading out)
        withTiming(1, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.quad) }),
        // Fade out as it explodes
        withDelay(50,
          withTiming(0, { duration: T_EXPLODE - 100, easing: Easing.out(Easing.quad) })
        )
      )
    );

    // ============================================================
    // APP CONTENT: Fade in during explosion
    // ============================================================
    appContentOpacity.value = withDelay(T_IGNITION + 150,
      withTiming(1, { duration: 350 })
    );

    // ============================================================
    // SPLASH CONTAINER: Fade out at end
    // ============================================================
    splashContainerOpacity.value = withDelay(T_IGNITION + T_EXPLODE,
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setPhase)('complete');
          if (onAnimationComplete) runOnJS(onAnimationComplete)();
        }
      })
    );

  }, [onAnimationComplete]);

  useEffect(() => {
    if (shouldSkip) {
      SplashScreen.hideAsync();
      return;
    }

    const handle = InteractionManager.runAfterInteractions(() => {
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        setPhase('animating');
        runAnimation();
      }, 50);
    });

    return () => handle.cancel();
  }, [runAnimation]);

  if (phase === 'complete') {
    return <View style={styles.childrenContainer}>{children}</View>;
  }

  const GlowComponent = !isExpoGo && Canvas ? SkiaGlow : FallbackGlow;

  return (
    <View style={styles.container}>
      {/* APP CONTENT (fades in at end) */}
      <Animated.View style={[styles.appContent, { opacity: appContentOpacity }]}>
        {children}
      </Animated.View>

      {/* SPLASH OVERLAY */}
      <Animated.View
        style={[styles.overlay, { opacity: splashContainerOpacity }]}
        pointerEvents="none"
      >
        <View style={styles.blackBg} />

        {/* GLOW LAYER */}
        <GlowComponent opacity={glowOpacity} scale={glowScale} />

        {/* LOGO LAYER */}
        <Animated.View style={[styles.logoContainer, containerTransform]}>
          <Animated.Image
            source={whiteLogo}
            style={[styles.logoImage, whiteLogoStyle]}
            resizeMode="contain"
          />
          <Animated.Image
            source={coloredLogo}
            style={[styles.logoImage, coloredLogoStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  childrenContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  appContent: {
    flex: 1,
  },
  glowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: LOGO_SOURCE_SIZE,
    height: LOGO_SOURCE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
});

export default AnimatedSplash;
