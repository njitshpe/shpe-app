import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SPACING, RADIUS } from '@/constants/colors';

const MAX_BIO_LENGTH = 140;

// --- INSPIRATION CHIPS FOR ALUMNI ---
const INSPIRATION_CHIPS = [
  '🏢 Career Journey',
  '💡 Advice for Students',
  '🌟 SHPE Impact',
];

interface AlumniImpactStepProps {
  data: {
    bio: string;
    isMentor: boolean;
  };
  update: (fields: Partial<{ bio: string; isMentor: boolean }>) => void;
  onNext: () => void;
}

export default function AlumniImpactStep({
  data,
  update,
  onNext,
}: AlumniImpactStepProps) {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const characterCount = data.bio?.length ?? 0;
  const remainingChars = MAX_BIO_LENGTH - characterCount;

  const handleMentorToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    update({ isMentor: !data.isMentor });
  };

  const handleNext = () => {
    if (isNavigating) return;

    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  // Bio is optional, so button is never disabled due to empty bio
  const isNextDisabled = remainingChars < 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outerContainer}
    >
      <TouchableOpacity
        style={styles.contentContainer}
        activeOpacity={1}
        onPress={Keyboard.dismiss}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={{ width: '100%', paddingHorizontal: SPACING.lg }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>YOUR IMPACT</Text>
            <Text style={styles.subtitle}>Share your story & give back.</Text>
          </View>

          {/* Glass Text Area for Bio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>BIO (OPTIONAL)</Text>
            <View
              style={[
                styles.glassContainer,
                isFocused && styles.glassFocused,
                remainingChars < 0 && styles.glassError,
              ]}
            >
              <TextInput
                value={data.bio}
                onChangeText={(t) => update({ bio: t })}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Share a bit about your journey since NJIT..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                style={styles.input}
                maxLength={MAX_BIO_LENGTH + 20}
              />

              {/* Character Counter */}
              <View style={styles.counterRow}>
                <Text
                  style={[
                    styles.counterText,
                    remainingChars < 10 && { color: '#FBBF24' },
                    remainingChars < 0 && { color: '#F87171' },
                  ]}
                >
                  {remainingChars}
                </Text>
              </View>
            </View>
          </View>

          {/* Inspiration Chips */}
          <View style={styles.chipsContainer}>
            <Text style={styles.chipsLabel}>IDEAS:</Text>
            <View style={styles.chipsRow}>
              {INSPIRATION_CHIPS.map((label, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Mentorship Toggle Card */}
          <View style={styles.mentorSection}>
            <Text style={styles.label}>MENTORSHIP</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleMentorToggle}
              style={[
                styles.mentorCard,
                data.isMentor && styles.mentorCardActive,
              ]}
            >
              <View style={styles.mentorContent}>
                <View
                  style={[
                    styles.mentorIconContainer,
                    data.isMentor && styles.mentorIconActive,
                  ]}
                >
                  <Ionicons
                    name={data.isMentor ? 'heart' : 'heart-outline'}
                    size={28}
                    color={data.isMentor ? '#000000' : '#94A3B8'}
                  />
                </View>
                <View style={styles.mentorTextContainer}>
                  <Text
                    style={[
                      styles.mentorTitle,
                      data.isMentor && styles.mentorTitleActive,
                    ]}
                  >
                    {data.isMentor
                      ? "I'm open to mentoring students."
                      : "I'm just browsing."}
                  </Text>
                  <Text style={styles.mentorSubtitle}>
                    {data.isMentor
                      ? 'Students can reach out for guidance.'
                      : 'Tap to enable mentorship.'}
                  </Text>
                </View>
              </View>

              {/* Toggle Indicator */}
              <View
                style={[
                  styles.toggleTrack,
                  data.isMentor && styles.toggleTrackActive,
                ]}
              >
                <MotiView
                  animate={{
                    translateX: data.isMentor ? 20 : 0,
                  }}
                  transition={{ type: 'timing', duration: 200 }}
                  style={[
                    styles.toggleThumb,
                    data.isMentor && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </MotiView>
      </TouchableOpacity>

      {/* Footer */}
      <MotiView
        from={{ translateY: 50, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={isNextDisabled || isNavigating}
          style={[
            styles.button,
            (isNextDisabled || isNavigating) && styles.buttonDisabled,
          ]}
        >
          <LinearGradient
            colors={isNextDisabled ? ['#333333', '#1A1A1A'] : ['#FFFFFF', '#E2E8F0']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={[styles.buttonText, isNextDisabled && { color: '#666666' }]}
            >
              {data.bio ? 'Next Step' : 'Skip for now'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={isNextDisabled ? '#666666' : '#000000'}
            />
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },

  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: { marginBottom: SPACING.lg },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  fieldContainer: { marginBottom: SPACING.lg },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 1,
  },

  glassContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.md,
    minHeight: 140,
  },
  glassFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
  },
  glassError: { borderColor: '#F87171' },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    textAlignVertical: 'top',
  },

  counterRow: { alignItems: 'flex-end', marginTop: 8 },
  counterText: { color: '#64748B', fontWeight: '700', fontSize: 12 },

  chipsContainer: { marginBottom: SPACING.xl },
  chipsLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

  // Mentorship Card
  mentorSection: { marginBottom: SPACING.lg },
  mentorCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mentorCardActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  mentorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mentorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mentorIconActive: {
    backgroundColor: '#FFFFFF',
  },
  mentorTextContainer: {
    flex: 1,
  },
  mentorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  mentorTitleActive: {
    color: '#FFFFFF',
  },
  mentorSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },

  // Toggle Switch
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 2,
    marginLeft: 12,
  },
  toggleTrackActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#64748B',
  },
  toggleThumbActive: {
    backgroundColor: '#000000',
  },

  footer: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  button: {
    width: '100%',
    borderRadius: RADIUS.full,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  buttonDisabled: { shadowOpacity: 0, elevation: 0 },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: RADIUS.full,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
