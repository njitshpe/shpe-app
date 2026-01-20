import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedGridBackground } from './AnimatedGridBackground';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Slide up to reveal ~50% of screen for login buttons
const SLIDE_DISTANCE = SCREEN_HEIGHT * 0.40;

// Content slides down to fill the gap left by arrow button
const CONTENT_OFFSET = SCREEN_HEIGHT * 0.18;

// SHPE NJIT brand colors
const BRAND_COLORS = ['#094c8f', '#D25627'] as const;

export function WelcomeCurtain() {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const contentTranslateY = useSharedValue(0);
  const arrowOpacity = useSharedValue(1);

  const handleArrowPress = () => {
    // Slide curtain up partially
    translateY.value = withTiming(-SLIDE_DISTANCE, {
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
    });
    // Slide content down to compensate for arrow removal
    contentTranslateY.value = withTiming(CONTENT_OFFSET, {
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
    });
    // Fade out arrow button
    arrowOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const animatedArrowStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
  }));

  // Home Indicator opacity is inverse of arrow opacity (cross-fade)
  const animatedHomeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: 1 - arrowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]} pointerEvents="box-none">
      <View style={styles.backgroundWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.gridContainer, animatedContentStyle]}>
          <AnimatedGridBackground />
        </Animated.View>
      </View>

      {/* Content Overlay - All content at bottom */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Bottom Content */}
        <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 16 }]}>
          <Animated.View style={[styles.textContainer, animatedContentStyle]}>
            <Image
              source={require('../../assets/shpe-horizontal.webp')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.mainText}>Una Familia</Text>
            <MaskedView
              maskElement={
                <Text style={styles.gradientText}>starts here</Text>
              }
            >
              <LinearGradient
                colors={[...BRAND_COLORS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.gradientText, styles.gradientTextHidden]}>
                  Starts Here
                </Text>
              </LinearGradient>
            </MaskedView>
            {/* Home Indicator Bar - follows text with padding, cross-fades with arrow */}
            <Animated.View style={[styles.homeIndicator, animatedHomeIndicatorStyle]} />
          </Animated.View>

          {/* Arrow Button with Gradient Background */}
          <Animated.View style={animatedArrowStyle}>
            <TouchableOpacity
              onPress={handleArrowPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...BRAND_COLORS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.arrowButton}
              >
                <Ionicons name="arrow-down" size={30} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  backgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  bottomContent: {
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  brandLogo: {
    width: 300,
    height: 100,
    marginBottom: -10,
  },
  mainText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 48,
  },
  gradientText: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gradientTextHidden: {
    opacity: 0,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIndicator: {
    width: 30,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    marginTop: 24,
  },
});
