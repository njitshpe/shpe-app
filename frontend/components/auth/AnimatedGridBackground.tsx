import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GRID_PADDING_TOP = SCREEN_HEIGHT * 0.1;
const GRID_PADDING_BOTTOM = SCREEN_HEIGHT * 0.4;
const GRID_CONTENT_HEIGHT = SCREEN_HEIGHT - GRID_PADDING_TOP - GRID_PADDING_BOTTOM;
const IMAGE_WIDTH = 140;
const IMAGE_HEIGHT = 140;

const PATH_START = -IMAGE_WIDTH - 50;
const PATH_END = SCREEN_WIDTH + 50;

interface ImageConfig {
  source: any;
  y: number;
  speed: number;
  scale: number;
  initialProgress: number;
}

const IMAGES_CONFIG: ImageConfig[] = [
  // TRACK 1
  { source: require('@/assets/auth-grid/shpe-allies.webp'),    y: 0.02, speed: 45000, scale: 0.70, initialProgress: 0.05 },
  { source: require('@/assets/auth-grid/info-learn.webp'),     y: 0.12, speed: 45000, scale: 0.85, initialProgress: 0.30 },
  { source: require('@/assets/auth-grid/pre-college-25.webp'), y: 0.05, speed: 45000, scale: 0.75, initialProgress: 0.55 },
  { source: require('@/assets/auth-grid/bofa-info.webp'),      y: 0.15, speed: 45000, scale: 0.80, initialProgress: 0.80 },
  // TRACK 2
  { source: require('@/assets/auth-grid/hype-community.webp'), y: 0.30, speed: 38000, scale: 0.90, initialProgress: 0.15 },
  { source: require('@/assets/auth-grid/advocate.webp'),       y: 0.45, speed: 38000, scale: 0.95, initialProgress: 0.40 },
  { source: require('@/assets/auth-grid/gala-2025.webp'),      y: 0.35, speed: 38000, scale: 0.75, initialProgress: 0.65 },
  { source: require('@/assets/auth-grid/triple-awards.webp'),  y: 0.40, speed: 38000, scale: 0.85, initialProgress: 0.90 },
  // TRACK 3
  { source: require('@/assets/auth-grid/cds-award.webp'),      y: 0.60, speed: 42000, scale: 0.80, initialProgress: 0.00 },
  { source: require('@/assets/auth-grid/karaoke-25.webp'),     y: 0.75, speed: 42000, scale: 0.70, initialProgress: 0.25 },
  { source: require('@/assets/auth-grid/convention-25.webp'),  y: 0.65, speed: 42000, scale: 0.85, initialProgress: 0.50 },
  { source: require('@/assets/auth-grid/nyc-mixer.webp'),      y: 0.70, speed: 42000, scale: 0.90, initialProgress: 0.75 },
];

function triggerHaptic() {
  Haptics.selectionAsync();
}

interface FloatingImageProps {
  config: ImageConfig;
  index: number;
}

function FloatingImage({ config, index }: FloatingImageProps) {
  const { source, y, speed, scale, initialProgress } = config;

  const targetY = GRID_PADDING_TOP + (y * GRID_CONTENT_HEIGHT);
  const baseZIndex = Math.floor(scale * 100);

  const progress = useSharedValue(initialProgress);
  const verticalProgress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Interaction
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isPressed = useSharedValue(false);

  const staggerDelay = useMemo(() => index * 80, [index]);

  useEffect(() => {
    // 1. Fade In
    opacity.value = withDelay(
      staggerDelay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
    );

    // 2. Vertical Slide
    verticalProgress.value = withDelay(
      staggerDelay,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );

    // 3. Horizontal Loop
    const remainingProgress = 1 - initialProgress;
    const firstPassDuration = remainingProgress * speed;

    progress.value = withDelay(
      staggerDelay + 200,
      withSequence(
        withTiming(1, { duration: firstPassDuration, easing: Easing.linear }),
        withRepeat(
          withSequence(
            withTiming(0, { duration: 1 }),
            withTiming(1, { duration: speed, easing: Easing.linear })
          ),
          -1,
          false
        )
      )
    );

    return () => {
      cancelAnimation(progress);
      cancelAnimation(verticalProgress);
      cancelAnimation(opacity);
    };
  }, [index, initialProgress, speed, staggerDelay]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      isPressed.value = true;
      cancelAnimation(dragX);
      cancelAnimation(dragY);
      runOnJS(triggerHaptic)();
    })
    .onUpdate((e) => {
      'worklet';
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onFinalize(() => {
      'worklet';
      isPressed.value = false;
      // Revert to simple spring back (No decay/toss)
      dragX.value = withSpring(0, { damping: 20, stiffness: 200 });
      dragY.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [PATH_START, PATH_END]);
    const translateY = interpolate(verticalProgress.value, [0, 1], [-IMAGE_HEIGHT - 100, targetY]);

    const currentScale = isPressed.value
      ? withSpring(scale * 1.12, { damping: 15, stiffness: 300 })
      : withSpring(scale, { damping: 15, stiffness: 300 });

    const currentOpacity = opacity.value * (scale < 0.8 ? 0.6 : 1);

    return {
      opacity: currentOpacity,
      transform: [
        { translateX: translateX + dragX.value },
        { translateY: translateY + dragY.value },
        { scale: currentScale },
        // Removed rotation transform
      ],
      zIndex: isPressed.value ? 1000 : baseZIndex,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.floatingImage, animatedStyle]}>
        <Image
          source={source}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export function AnimatedGridBackground() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(205, 134, 20, 0.54)', 'transparent']}
        locations={[0, 1]}
        style={styles.gradient}
      />
      {IMAGES_CONFIG.map((config, index) => (
        <FloatingImage
          key={`floating-${index}`}
          config={config}
          index={index}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    zIndex: 0,
  },
  floatingImage: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 8,
  },
});