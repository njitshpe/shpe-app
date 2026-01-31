import React, { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react';
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
  withRepeat,
  cancelAnimation,
  Easing,
  runOnJS,
  SharedValue,
  useReducedMotion,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Asset } from 'expo-asset';
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Circle as SvgCircle,
} from 'react-native-svg';

// ============================================================================
// ASSET LOADING (AUDIO)
// ============================================================================
let IGNITION_SOUND: any = null;
try {
  IGNITION_SOUND = require('@/assets/ignition.mp3');
} catch (e) {
  console.log('Ignition sound asset not found - audio branding disabled');
}

// ============================================================================
// CONTEXT
// ============================================================================
interface SplashReadyContextType {
  setReady: () => void;
}

const SplashReadyContext = createContext<SplashReadyContextType | null>(null);

export function useSplashReady() {
  const context = useContext(SplashReadyContext);
  if (!context) return { setReady: () => {} };
  return context;
}

// ============================================================================
// CONFIGURATION
// ============================================================================
let hasShownSplashThisSession = false;
const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

// Skia Import Logic
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
  } catch (e) { console.log("Skia load failed", e); }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLOR_AMBER = '#a53d00cb';
const COLOR_BLUE = '#0059cdc4';
const whiteLogo = require('@/assets/app-logo-white-transparent.png');
const coloredLogo = require('@/assets/app-logo-transparent.png');
const EXPAND_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);
const NATIVE_SPLASH_IMAGE_WIDTH = 120;
const LOGO_SIZE_INITIAL = PixelRatio.roundToNearestPixel(NATIVE_SPLASH_IMAGE_WIDTH);
const LOGO_ASSET_SOURCE = Image.resolveAssetSource(whiteLogo);
const LOGO_SOURCE_SIZE = Math.max(LOGO_ASSET_SOURCE?.width ?? 0, LOGO_ASSET_SOURCE?.height ?? 0) || LOGO_SIZE_INITIAL;
const LOGO_BASE_SCALE = LOGO_SIZE_INITIAL / Math.max(1, LOGO_SOURCE_SIZE);
const GLOW_RADIUS = SCREEN_WIDTH * 0.2;

interface AnimatedSplashProps {
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

// ============================================================================
// GLOW COMPONENTS
// ============================================================================
const SkiaGlow = ({ opacity, scale }: { opacity: SharedValue<number>; scale: SharedValue<number> }) => {
  if (!Canvas) return null;
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const glowOffset = GLOW_RADIUS * 0.6;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Blur blur={60} />
          <Circle cx={centerX} cy={centerY - glowOffset} r={GLOW_RADIUS}><RadialGradient c={vec(centerX, centerY - glowOffset)} r={GLOW_RADIUS} colors={[`${COLOR_BLUE}80`, `${COLOR_BLUE}33`, 'transparent']} positions={[0, 0.5, 1]} /></Circle>
          <Circle cx={centerX} cy={centerY + glowOffset} r={GLOW_RADIUS}><RadialGradient c={vec(centerX, centerY + glowOffset)} r={GLOW_RADIUS} colors={[`${COLOR_BLUE}80`, `${COLOR_BLUE}33`, 'transparent']} positions={[0, 0.5, 1]} /></Circle>
          <Circle cx={centerX + glowOffset} cy={centerY} r={GLOW_RADIUS}><RadialGradient c={vec(centerX + glowOffset, centerY)} r={GLOW_RADIUS} colors={[`${COLOR_AMBER}80`, `${COLOR_AMBER}33`, 'transparent']} positions={[0, 0.5, 1]} /></Circle>
          <Circle cx={centerX - glowOffset} cy={centerY} r={GLOW_RADIUS}><RadialGradient c={vec(centerX - glowOffset, centerY)} r={GLOW_RADIUS} colors={[`${COLOR_AMBER}80`, `${COLOR_AMBER}33`, 'transparent']} positions={[0, 0.5, 1]} /></Circle>
        </Group>
      </Canvas>
    </Animated.View>
  );
};

const FallbackGlow = ({ opacity, scale }: { opacity: SharedValue<number>; scale: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const glowOffset = GLOW_RADIUS * 0.6;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.glowContainer, animatedStyle]}>
      <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgRadialGradient id="blueGlowGradient" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%"><Stop offset="0%" stopColor={COLOR_BLUE} stopOpacity="0.5" /><Stop offset="50%" stopColor={COLOR_BLUE} stopOpacity="0.2" /><Stop offset="100%" stopColor={COLOR_BLUE} stopOpacity="0" /></SvgRadialGradient>
          <SvgRadialGradient id="amberGlowGradient" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%"><Stop offset="0%" stopColor={COLOR_AMBER} stopOpacity="0.5" /><Stop offset="50%" stopColor={COLOR_AMBER} stopOpacity="0.2" /><Stop offset="100%" stopColor={COLOR_AMBER} stopOpacity="0" /></SvgRadialGradient>
        </Defs>
        <SvgCircle cx={centerX} cy={centerY - glowOffset} r={GLOW_RADIUS} fill="url(#blueGlowGradient)" />
        <SvgCircle cx={centerX} cy={centerY + glowOffset} r={GLOW_RADIUS} fill="url(#blueGlowGradient)" />
        <SvgCircle cx={centerX + glowOffset} cy={centerY} r={GLOW_RADIUS} fill="url(#amberGlowGradient)" />
        <SvgCircle cx={centerX - glowOffset} cy={centerY} r={GLOW_RADIUS} fill="url(#amberGlowGradient)" />
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
  const [phase, setPhase] = useState<'waiting' | 'breathing' | 'animating' | 'finishing' | 'complete'>(
    shouldSkip ? 'complete' : 'waiting'
  );
  const [isReady, setIsReady] = useState(false);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Accessibility & Audio Refs
  const shouldReduceMotion = useReducedMotion();
  const soundRef = useRef<Audio.Sound | null>(null);

  const setReady = useCallback(() => setIsReady(true), []);

  const playSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(0.01); // Subtle volume
        await soundRef.current.playFromPositionAsync(0);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  // Shared Values
  const logoScale = useSharedValue(0);
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const whiteLogoOpacity = useSharedValue(0);
  const coloredLogoOpacity = useSharedValue(0);
  const blackBgOpacity = useSharedValue(1);
  const splashContainerOpacity = useSharedValue(1);
  const appContentOpacity = useSharedValue(0);

  // Styles
  const containerTransform = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value * LOGO_BASE_SCALE }] }));
  const whiteLogoStyle = useAnimatedStyle(() => ({ opacity: whiteLogoOpacity.value }));
  const coloredLogoStyle = useAnimatedStyle(() => ({ opacity: coloredLogoOpacity.value }));
  const blackBgStyle = useAnimatedStyle(() => ({ opacity: blackBgOpacity.value }));

  // App Content Style - Stable Opacity Logic
  const appContentStyle = useAnimatedStyle(() => ({
    opacity: phase === 'complete' ? 1 : appContentOpacity.value
  }));

  const triggerHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const runExitAnimation = useCallback(() => {
    hasShownSplashThisSession = true;
    playSound();

    // --- REDUCED MOTION ---
    if (shouldReduceMotion) {
      logoScale.value = LOGO_BASE_SCALE > 0 ? 1 / LOGO_BASE_SCALE : 1;
      whiteLogoOpacity.value = withTiming(1, { duration: 300 });
      coloredLogoOpacity.value = withDelay(500, withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }));
      whiteLogoOpacity.value = withDelay(500, withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }));
      blackBgOpacity.value = withDelay(2200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
      appContentOpacity.value = withDelay(2200, withTiming(1, { duration: 500 }));
      splashContainerOpacity.value = withDelay(2700, withTiming(1, { duration: 1 }, (finished) => { if (finished) runOnJS(setPhase)('finishing'); }));
      return;
    }

    // --- FULL ANIMATION ---
    const T_LOGO_START = 200;
    const T_LOGO_GROW = 350;
    const T_GLOW_START = 550;
    const T_GLOW_GROW = 600;
    const T_DIP_START = 1150;
    const T_DIP_DURATION = 250;
    const T_IGNITION = 1400;
    const T_EXPLODE = 600;
    const T_GLOW_SHRINK = 50;

    logoScale.value = withDelay(T_LOGO_START, withSequence(withTiming(1, { duration: T_LOGO_GROW, easing: Easing.out(Easing.back(1.5)) }), withDelay(T_DIP_START - T_LOGO_START - T_LOGO_GROW, withSequence(withTiming(0.8, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.cubic) }), withTiming(60, { duration: T_EXPLODE, easing: EXPAND_EASING })))));
    glowScale.value = withDelay(T_GLOW_START, withSequence(withTiming(1, { duration: T_GLOW_GROW, easing: Easing.out(Easing.back(1.2)) }), withTiming(0.8, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.cubic) }), withTiming(0, { duration: T_GLOW_SHRINK, easing: Easing.in(Easing.cubic) })));
    glowOpacity.value = withDelay(T_GLOW_START, withTiming(1, { duration: 200 }));
    whiteLogoOpacity.value = withDelay(T_LOGO_START, withSequence(withTiming(1, { duration: 150 }), withDelay(T_DIP_START - T_LOGO_START - 150, withTiming(0, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.quad) }))));
    coloredLogoOpacity.value = withDelay(T_DIP_START, withSequence(withTiming(1, { duration: T_DIP_DURATION, easing: Easing.inOut(Easing.quad) }), withDelay(0, withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) }, (finished) => { if (finished) runOnJS(triggerHaptics)(); }))));
    blackBgOpacity.value = withDelay(T_IGNITION, withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) }));
    appContentOpacity.value = withDelay(T_IGNITION, withTiming(1, { duration: 350 }));
    splashContainerOpacity.value = withDelay(T_IGNITION + T_EXPLODE, withTiming(1, { duration: 1 }, (finished) => { if (finished) runOnJS(setPhase)('finishing'); }));
  }, [shouldReduceMotion, playSound]);

  // Breathing loop — subtle scale pulse while waiting for isReady
  const startBreathing = useCallback(() => {
    // Make the animated white logo visible at the same size as the static waiting frame
    whiteLogoOpacity.value = 1;
    // Snap to scale 1, then loop 1.0 → 1.05 → 1.0 indefinitely.
    // withSequence wrapping ensures the first keyframe anchors at 1.0 (from logoScale's
    // initial 0) before the repeat starts, avoiding any visible jump when the static
    // waiting frame unmounts.
    logoScale.value = withSequence(
      withTiming(1, { duration: 50 }),
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  useEffect(() => {
    if (phase !== 'complete') {
        safetyTimerRef.current = setTimeout(() => { setIsReady(true); }, 8000);
    }
    return () => { if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (shouldSkip) {
      SplashScreen.hideAsync();
      return;
    }
    const prepareResources = async () => {
      try {
        await Asset.loadAsync([whiteLogo, coloredLogo]);
        if (IGNITION_SOUND) {
           const { sound } = await Audio.Sound.createAsync(IGNITION_SOUND);
           soundRef.current = sound;
        }
      } catch (e) { console.warn("Splash asset error", e); }
      finally {
        await SplashScreen.hideAsync();
        // Start breathing loop — animation values set before phase change so the
        // animated logo is at scale 1 + visible before the static waiting frame unmounts.
        startBreathing();
        setPhase('breathing');
      }
    };
    const handle = InteractionManager.runAfterInteractions(() => { prepareResources(); });
    return () => handle.cancel();
  }, [startBreathing, shouldSkip]);

  // Exit trigger — stop breathing and run the exit animation once the app signals ready
  useEffect(() => {
    if (isReady && phase === 'breathing') {
      cancelAnimation(logoScale);
      setPhase('animating');
      runExitAnimation();
    }
  }, [isReady, phase, runExitAnimation]);

  useEffect(() => {
    if (phase === 'finishing' && isReady) {
      splashContainerOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setPhase)('complete');
          if (onAnimationComplete) runOnJS(onAnimationComplete)();
        }
      });
    }
  }, [phase, isReady, onAnimationComplete]);

  const contextValue = React.useMemo(() => ({ setReady }), [setReady]);
  const GlowComponent = FallbackGlow;

  return (
    <SplashReadyContext.Provider value={contextValue}>
      <View style={styles.container}>
        {/* CRITICAL FIX: The wrapper for children never changes */}
        <Animated.View style={[styles.appContent, appContentStyle]}>
          {children}
        </Animated.View>

        {phase !== 'complete' && (
          <Animated.View style={[styles.overlay, { opacity: splashContainerOpacity }]} pointerEvents="none">
            <StatusBar style="light" hidden={true} animated={true} />
            <Animated.View style={[styles.blackBg, blackBgStyle]} />

            {/* Static waiting frame — matches native splash exactly, no async/context deps */}
            {phase === 'waiting' && (
              <View style={styles.waitingFrame}>
                <Image source={whiteLogo} style={styles.waitingLogo} resizeMode="contain" />
              </View>
            )}

            <GlowComponent opacity={glowOpacity} scale={glowScale} />
            <Animated.View style={[styles.logoContainer, containerTransform]}>
              <Animated.Image source={whiteLogo} style={[styles.logoImage, whiteLogoStyle]} resizeMode="contain" />
              <Animated.Image source={coloredLogo} style={[styles.logoImage, coloredLogoStyle]} resizeMode="contain" />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </SplashReadyContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  blackBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  appContent: { flex: 1 },
  glowContainer: { justifyContent: 'center', alignItems: 'center' },
  logoContainer: { width: LOGO_SOURCE_SIZE, height: LOGO_SOURCE_SIZE, justifyContent: 'center', alignItems: 'center' },
  logoImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  waitingFrame: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  waitingLogo: { width: LOGO_SIZE_INITIAL, height: LOGO_SIZE_INITIAL },
});

export default AnimatedSplash;
