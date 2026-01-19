import { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SPACING, RADIUS, SHADOWS } from '@/constants/colors';

const HOLD_DURATION = 1500; // 1.5 seconds

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface FormData {
  firstName: string;
  lastName: string;
  university: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  intent: string;
}

interface GuestReviewStepProps {
  data: FormData;
  onNext: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent Label Mapping
// ─────────────────────────────────────────────────────────────────────────────
const INTENT_LABELS: Record<string, string> = {
  recruiter: 'RECRUITER',
  student_other: 'VISITING STUDENT',
  family: 'FAMILY & FRIENDS',
  other: 'GUEST',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hold-to-Confirm Button Component
// ─────────────────────────────────────────────────────────────────────────────
function HoldToConfirmButton({ onComplete }: { onComplete: () => void }) {
  const progress = useSharedValue(0);
  const isHolding = useSharedValue(false);
  const scale = useSharedValue(1);
  const hapticInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerHaptic = useCallback(
    (intensity: 'light' | 'medium' | 'heavy') => {
      if (intensity === 'light')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (intensity === 'medium')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },
    []
  );

  const startHapticFeedback = useCallback(() => {
    triggerHaptic('light');
    let count = 0;
    hapticInterval.current = setInterval(() => {
      count++;
      triggerHaptic(count < 5 ? 'light' : count < 10 ? 'medium' : 'heavy');
    }, 150);
  }, [triggerHaptic]);

  const stopHapticFeedback = useCallback(() => {
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    stopHapticFeedback();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  }, [onComplete, stopHapticFeedback]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(0)
    .onStart(() => {
      'worklet';
      isHolding.value = true;
      scale.value = withTiming(0.95, { duration: 120 });
      runOnJS(startHapticFeedback)();
      progress.value = withTiming(1, { duration: HOLD_DURATION }, (finished) => {
        if (finished && isHolding.value) runOnJS(handleComplete)();
      });
    })
    .onFinalize(() => {
      'worklet';
      isHolding.value = false;
      scale.value = withTiming(1, { duration: 160 });
      runOnJS(stopHapticFeedback)();
      if (progress.value < 1) progress.value = withTiming(0, { duration: 200 });
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100], Extrapolate.CLAMP)}%`,
  }));

  return (
    <GestureDetector gesture={longPressGesture}>
      <Animated.View style={[holdButtonStyles.wrapper, animatedContainerStyle]}>
        {/* Track */}
        <View style={holdButtonStyles.track}>
          <Animated.View style={[holdButtonStyles.fillWrapper, animatedFillStyle]}>
            {/* Black Fill */}
            <View style={holdButtonStyles.fill} />
          </Animated.View>

          <View style={holdButtonStyles.content}>
            <Ionicons
              name="ticket"
              size={20}
              color="#000"
              style={holdButtonStyles.icon}
            />
            <Text style={holdButtonStyles.text}>HOLD TO CONFIRM</Text>
          </View>
        </View>
        <Text style={holdButtonStyles.hint}>Hold for 1.5s to get your pass</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const holdButtonStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    borderRadius: RADIUS.full,
    height: 56,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  fill: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1,
  },
  hint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function GuestReviewStep({ data, onNext }: GuestReviewStepProps) {
  const insets = useSafeAreaInsets();

  const profileSource = data.profilePhoto?.uri
    ? { uri: data.profilePhoto.uri }
    : null;

  const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase();
  const intentLabel = INTENT_LABELS[data.intent] || 'GUEST';
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.outerContainer}>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.header}
          >
            <Text style={styles.title}>Ready?</Text>
            <Text style={styles.subtitle}>Here is your guest pass.</Text>
          </MotiView>

          {/* Hero Card */}
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 200 }}
            style={styles.cardContainer}
          >
            <View style={styles.heroCard}>
              {/* Profile Photo with Halo */}
              <View style={styles.profileHalo}>
                {profileSource ? (
                  <Image source={profileSource} style={styles.profileImage} />
                ) : (
                  <View style={styles.initialsContainer}>
                    <Text style={styles.initials}>{initials}</Text>
                  </View>
                )}
              </View>

              {/* Name */}
              <Text style={styles.name}>
                {data.firstName} {data.lastName}
              </Text>

              {/* Intent Badge */}
              <View style={styles.intentBadge}>
                <Text style={styles.intentText}>{intentLabel}</Text>
              </View>

              {/* Details */}
              <Text style={styles.details}>
                Guest Access • {currentDate}
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Additional Info */}
              {data.university && (
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={16} color="#94A3B8" />
                  <Text style={styles.infoText}>{data.university}</Text>
                </View>
              )}
              {data.major && (
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={16} color="#94A3B8" />
                  <Text style={styles.infoText}>{data.major}</Text>
                </View>
              )}
            </View>
          </MotiView>

          {/* Helper Text */}
          <Text style={styles.helperText}>
            You can update your profile anytime in settings.
          </Text>
        </ScrollView>
      </MotiView>

      {/* Footer */}
      <MotiView
        from={{ translateY: 50, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ delay: 400 }}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
      >
        <HoldToConfirmButton onComplete={onNext} />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500',
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroCard: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    ...SHADOWS.large,
  },
  profileHalo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
  },
  initialsContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  intentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: SPACING.sm,
  },
  intentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  details: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.sm,
    width: '100%',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
  },
});
