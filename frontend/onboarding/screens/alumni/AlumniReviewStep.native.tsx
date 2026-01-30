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
import { SPACING, RADIUS } from '@/constants/colors';

const HOLD_DURATION = 1500; // 1.5 seconds

interface AlumniFormData {
  firstName: string;
  lastName: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  major: string;
  degreeType: string;
  graduationYear: string;
  company: string;
  jobTitle: string;
  industry: string;
  linkedinUrl: string;
  bio: string;
  isMentor: boolean;
}

interface AlumniReviewStepProps {
  data: AlumniFormData;
  onNext: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hold-to-Confirm Button (The "Ignition")
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
            {/* Black Fill over white background */}
            <View style={holdButtonStyles.fill} />
          </Animated.View>

          <View style={holdButtonStyles.content}>
            <Ionicons
              name="rocket"
              size={20}
              color="#000"
              style={holdButtonStyles.icon}
            />
            <Text style={holdButtonStyles.text}>HOLD TO LAUNCH</Text>
          </View>
        </View>
        <Text style={holdButtonStyles.hint}>Hold for 1.5s to confirm</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const holdButtonStyles = StyleSheet.create({
  wrapper: { width: '100%', alignItems: 'center' },
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
  fill: { flex: 1, backgroundColor: '#000000' },
  content: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  icon: { marginRight: 8 },
  text: { fontSize: 16, fontWeight: '800', color: '#000000', letterSpacing: 1 },
  hint: { fontSize: 11, color: '#64748B', marginTop: 8, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main AlumniReviewStep Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AlumniReviewStep({ data, onNext }: AlumniReviewStepProps) {
  const insets = useSafeAreaInsets();

  const profileSource = data.profilePhoto?.uri
    ? { uri: data.profilePhoto.uri }
    : null;

  const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase();

  const detailsLine = `Alumni • Class of ${data.graduationYear}`;
  const roleAtCompany = `${data.jobTitle} @ ${data.company}`;

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
          <View style={styles.header}>
            <Text style={styles.title}>READY TO LAUNCH</Text>
            <Text style={styles.subtitle}>Review your alumni profile.</Text>
          </View>

          {/* HERO CARD */}
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.cardContainer}
          >
            <View style={styles.summaryCard}>
              {/* Profile Image with White Halo */}
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
              <Text style={styles.summaryName}>
                {data.firstName} {data.lastName}
              </Text>

              {/* Alumni Status */}
              <Text style={styles.summaryDetails}>{detailsLine}</Text>

              {/* Job Title @ Company */}
              <Text style={styles.roleText}>{roleAtCompany}</Text>

              {/* Bio (if provided) */}
              {data.bio ? (
                <Text style={styles.summaryBio} numberOfLines={3}>
                  "{data.bio}"
                </Text>
              ) : null}
            </View>
          </MotiView>

          {/* STATS ROW */}
          <View style={styles.statsRow}>
            {/* Mentor Ready Badge */}
            {data.isMentor && (
              <View style={styles.mentorBadge}>
                <Ionicons name="heart" size={14} color="#FFFFFF" />
                <Text style={styles.mentorBadgeText}>Mentor Ready</Text>
              </View>
            )}

            {/* Industry Chip */}
            {data.industry && (
              <View style={styles.statChip}>
                <Ionicons name="layers" size={14} color="#FFF" />
                <Text style={styles.statText}>{data.industry}</Text>
              </View>
            )}

            {/* LinkedIn Chip */}
            {data.linkedinUrl && (
              <View style={styles.statChip}>
                <Ionicons name="logo-linkedin" size={14} color="#FFF" />
                <Text style={styles.statText}>LinkedIn</Text>
              </View>
            )}

            {/* Degree Chip */}
            <View style={styles.statChip}>
              <Ionicons name="school" size={14} color="#FFF" />
              <Text style={styles.statText}>
                {data.degreeType} {data.major ? `in ${data.major.split(' ')[0]}` : ''}
              </Text>
            </View>
          </View>
        </ScrollView>
      </MotiView>

      {/* FOOTER */}
      <MotiView
        from={{ translateY: 50, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ delay: 300 }}
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + SPACING.md }]}
      >
        <HoldToConfirmButton onComplete={onNext} />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 448, alignSelf: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 60 },

  header: { marginBottom: SPACING.xl, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  cardContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  summaryCard: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
  },
  profileHalo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#000',
  },
  initialsContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  summaryDetails: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  roleText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  summaryBio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statText: { fontSize: 12, fontWeight: '600', color: '#FFF' },

  // Mentor Badge - Highlighted with white glow
  mentorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  mentorBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  buttonContainer: { paddingHorizontal: SPACING.lg },
});
