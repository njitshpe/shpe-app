import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  InteractionManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

// Check if running in Expo Go (Skia requires dev client)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import Skia - only available in dev client builds
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
    // Skia not available, will use fallback
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Asset imports
const whiteLogo = require('@/assets/app-white-icon.png');
const coloredLogo = require('@/assets/app-icon.png');

// Animation timing constants (in ms)
const FRAME1_DURATION = 200;  // White logo visible
const FRAME2_DURATION = 350;  // White logo + glow appears
const FRAME3_DURATION = 250;  // Colored logo (small) - glow fades out
const FRAME4_DURATION = 400;  // Colored logo expands huge
const FRAME5_DURATION = 500;  // App fades in, overlay fades out

// Logo sizing
const LOGO_SIZE_INITIAL = SCREEN_WIDTH * 0.35;
const LOGO_SIZE_HUGE = SCREEN_WIDTH * 2.5;

// Glow configuration
const GLOW_COLOR_BLUE = 'rgba(0, 149, 255, 0.6)';
const GLOW_COLOR_ORANGE = 'rgba(255, 95, 5, 0.5)';

interface AnimatedSplashProps {
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

// Skia Glow Component (GPU-accelerated)
const SkiaGlow = ({ opacity }: { opacity: SharedValue<number> }) => {
  if (!Canvas || !Circle || !RadialGradient || !vec || !Blur || !Group) {
    return null;
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const glowRadius = SCREEN_WIDTH * 0.6;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Blur blur={40} />
          <Circle cx={centerX} cy={centerY - 30} r={glowRadius}>
            <RadialGradient
              c={vec(centerX, centerY - 30)}
              r={glowRadius}
              colors={[GLOW_COLOR_BLUE, 'transparent']}
            />
          </Circle>
          <Circle cx={centerX} cy={centerY + 30} r={glowRadius * 0.8}>
            <RadialGradient
              c={vec(centerX, centerY + 30)}
              r={glowRadius * 0.8}
              colors={[GLOW_COLOR_ORANGE, 'transparent']}
            />
          </Circle>
        </Group>
      </Canvas>
    </Animated.View>
  );
};

// Fallback Glow for Expo Go (simple View-based glow)
const FallbackGlow = ({ opacity }: { opacity: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.fallbackGlowContainer, animatedStyle]}>
      <View style={[styles.fallbackGlow, styles.fallbackGlowBlue]} />
      <View style={[styles.fallbackGlow, styles.fallbackGlowOrange]} />
    </Animated.View>
  );
};

// Prevent auto-hide at module level for fastest execution
SplashScreen.preventAutoHideAsync().catch(() => {});

export function AnimatedSplash({ children, onAnimationComplete }: AnimatedSplashProps) {
  // Phase states - driven entirely by JS timers
  const [phase, setPhase] = useState<'waiting' | 'animating' | 'complete'>('waiting');
  const [showColoredLogo, setShowColoredLogo] = useState(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  const animationStarted = useRef(false);

  // Animation shared values
  const glowOpacity = useSharedValue(0);
  const logoScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);
  const appContentOpacity = useSharedValue(0);

  // Animated styles - all opacity/transform driven by shared values
  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const appContentStyle = useAnimatedStyle(() => ({
    opacity: appContentOpacity.value,
  }));

  // Start the full animation sequence using JS timers for state + Reanimated for animations
  const startAnimationSequence = useCallback(() => {
    if (animationStarted.current) return;
    animationStarted.current = true;

    // Calculate frame start times
    const frame2Start = FRAME1_DURATION;
    const frame3Start = frame2Start + FRAME2_DURATION;
    const frame4Start = frame3Start + FRAME3_DURATION;
    const frame5Start = frame4Start + FRAME4_DURATION * 0.6;
    const totalDuration = frame5Start + FRAME5_DURATION + 50;

    // FRAME 1: White logo already visible (native splash just hidden)
    // Just wait for FRAME1_DURATION

    // FRAME 2: Glow fades in
    glowOpacity.value = withDelay(
      frame2Start,
      withTiming(1, {
        duration: FRAME2_DURATION * 0.6,
        easing: Easing.out(Easing.cubic)
      })
    );

    // FRAME 3: Switch to colored logo, glow fades out
    setTimeout(() => {
      if (isMounted.current) {
        setShowColoredLogo(true);
      }
    }, frame3Start);

    // Glow fades out during Frame 3
    glowOpacity.value = withDelay(
      frame3Start,
      withTiming(0, {
        duration: FRAME3_DURATION,
        easing: Easing.in(Easing.cubic)
      })
    );

    // FRAME 4: Logo expands huge
    logoScale.value = withDelay(
      frame4Start,
      withTiming(LOGO_SIZE_HUGE / LOGO_SIZE_INITIAL, {
        duration: FRAME4_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // FRAME 5: App content fades in, overlay fades out smoothly
    appContentOpacity.value = withDelay(
      frame5Start,
      withTiming(1, {
        duration: FRAME5_DURATION * 0.6,
        easing: Easing.out(Easing.cubic)
      })
    );

    // Overlay fades: first to semi-transparent, then fully out
    overlayOpacity.value = withDelay(
      frame5Start,
      withSequence(
        withTiming(0.3, {
          duration: FRAME5_DURATION * 0.3,
          easing: Easing.out(Easing.cubic)
        }),
        withTiming(0, {
          duration: FRAME5_DURATION * 0.5,
          easing: Easing.out(Easing.cubic)
        })
      )
    );

    // Animation complete - unmount splash overlay
    setTimeout(() => {
      if (isMounted.current) {
        setPhase('complete');
        onAnimationComplete?.();
      }
    }, totalDuration);
  }, [glowOpacity, logoScale, overlayOpacity, appContentOpacity, onAnimationComplete]);

  // Initialize: wait for first paint, then hide native splash and start animation
  useEffect(() => {
    isMounted.current = true;

    // Use InteractionManager to ensure we're after the first paint
    const handle = InteractionManager.runAfterInteractions(() => {
      // Additional requestAnimationFrame to ensure the React view is painted
      requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
          if (!isMounted.current) return;

          // Now it's safe to hide native splash - our black view is visible
          try {
            await SplashScreen.hideAsync();
          } catch (e) {
            // Already hidden or other error, continue anyway
          }

          if (isMounted.current) {
            setPhase('animating');
            startAnimationSequence();
          }
        });
      });
    });

    return () => {
      isMounted.current = false;
      handle.cancel();
    };
  }, [startAnimationSequence]);

  // While waiting for first paint, render black background that matches native splash
  if (phase === 'waiting') {
    return (
      <View style={styles.container}>
        <View style={styles.background} />
        {/* Render white logo in same position as native splash for seamless transition */}
        <View style={styles.initialLogoContainer}>
          <Image
            source={whiteLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  // After animation complete, just render children (splash unmounted)
  if (phase === 'complete') {
    return <>{children}</>;
  }

  // Animation phase - render both app content (fading in) and splash overlay (fading out)
  const GlowComponent = isExpoGo || !Canvas ? FallbackGlow : SkiaGlow;

  return (
    <View style={styles.container}>
      {/* App content underneath (fades in during Frame 5) */}
      <Animated.View style={[styles.appContent, appContentStyle]}>
        {children}
      </Animated.View>

      {/* Splash overlay - entirely controlled by animated opacity */}
      <Animated.View
        style={[styles.splashOverlay, overlayStyle]}
        pointerEvents="none"
      >
        {/* Black background */}
        <View style={styles.background} />

        {/* Glow layer (Frame 2, fades out in Frame 3) */}
        <GlowComponent opacity={glowOpacity} />

        {/* Logo layer - scale controlled by Reanimated */}
        <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
          <Image
            source={showColoredLogo ? coloredLogo : whiteLogo}
            style={styles.logo}
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
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  appContent: {
    flex: 1,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE_INITIAL,
    height: LOGO_SIZE_INITIAL,
  },
  fallbackGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  fallbackGlowBlue: {
    backgroundColor: 'rgba(0, 149, 255, 0.25)',
    top: SCREEN_HEIGHT / 2 - SCREEN_WIDTH * 0.5,
    shadowColor: '#0095FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 10,
  },
  fallbackGlowOrange: {
    backgroundColor: 'rgba(255, 95, 5, 0.2)',
    top: SCREEN_HEIGHT / 2 - SCREEN_WIDTH * 0.3,
    shadowColor: '#FF5F05',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 8,
  },
});

export default AnimatedSplash;
