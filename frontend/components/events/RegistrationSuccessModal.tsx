import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateHeader, formatTime } from '@/utils';
import { Event } from '@/types/events';

interface RegistrationSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event;
  status?: string; // 'going' | 'pending' | 'waitlist'
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RegistrationSuccessModal({
  visible,
  onClose,
  event,
  status = 'going'
}: RegistrationSuccessModalProps) {
  const insets = useSafeAreaInsets();

  // Animations
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      // Reset is handled by on request close mostly, but if prop changes:
      // translateY.value = SCREEN_HEIGHT; 
    }
  }, [visible]);

  const handleClose = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  };

  // Gesture Logic
  const pan = Gesture.Pan()
    .onChange((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withTiming(0, { duration: 300 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT * 0.5],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Config based on Status
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          title: "Registration Pending",
          message: "Your registration has been received and is pending approval.",
          icon: "time",
          color: "#FBBF24", // Amber
          tintColor: "rgba(251, 191, 36, 0.15)",
        };
      case 'waitlist':
        return {
          title: "Waitlisted",
          message: "You have been added to the waitlist. We'll notify you if a spot opens up.",
          icon: "people",
          color: "#A78BFA", // Purple
          tintColor: "rgba(167, 139, 250, 0.15)",
        };
      case 'going':
      default:
        return {
          title: "You're In!",
          message: "You have successfully registered for this event. We hope to see you there!",
          icon: "checkmark-circle",
          color: "#4ADE80", // Green
          tintColor: "rgba(74, 222, 128, 0.15)",
        };
    }
  };

  const config = getStatusConfig();
  const TEXT_COLOR = '#FFFFFF';
  const SUBTEXT_COLOR = 'rgba(255,255,255, 0.6)';
  const GLASS_BG = 'rgba(255,255,255, 0.1)';

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
            <BlurView
              intensity={80}
              tint="dark"
              style={[
                styles.blurContent,
                {
                  paddingTop: insets.top + 20,
                  backgroundColor: 'rgba(20,20,20,0.6)'
                }
              ]}
            >
              {/* PILL HANDLE */}
              <View style={[styles.pillContainer, { top: insets.top + 10 }]}>
                <View style={styles.pill} />
              </View>

              {/* CONTENT */}
              <View style={styles.content}>

                <View style={styles.confirmContainer}>
                  <View style={[styles.iconContainer, { backgroundColor: config.tintColor }]}>
                    <Ionicons name={config.icon as any} size={64} color={config.color} />
                  </View>

                  <Text style={[styles.confirmTitle, { color: TEXT_COLOR }]}>
                    {config.title}
                  </Text>

                  <Text style={[styles.confirmText, { color: SUBTEXT_COLOR }]}>
                    {config.message}
                  </Text>


                </View>

              </View>

              {/* FOOTER */}
              <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 40 : 20 }]}>
                <AnimatedPressable
                  style={[
                    styles.doneButton,
                    { backgroundColor: TEXT_COLOR },
                    animatedButtonStyle
                  ]}
                  onPress={handleClose}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </AnimatedPressable>
              </View>

            </BlurView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContent: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  pillContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    zIndex: 10,
  },
  pill: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center', // Center vertically roughly
    paddingBottom: 100, // Space for footer
  },

  // Confirm Styles
  confirmContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  infoCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
  },

  footer: {
    padding: 24,
    // backgroundColor: 'rgba(0,0,0,0.2)', // Optional footer bg
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
