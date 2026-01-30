import { useRef, useState } from 'react';
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
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SPACING, RADIUS } from '@/constants/colors';
import MentorshipInterstitial from '@/onboarding/components/MentorshipInterstitial.native';

const MAX_BIO_LENGTH = 140;

// --- INSPIRATION CHIPS FOR ALUMNI ---
const INSPIRATION_CHIPS = [
  '🏢 Career Journey',
  '💡 Advice for Students',
];

interface AlumniImpactStepProps {
  data: {
    bio: string;
    linkedinUrl: string;
    isMentor: boolean;
    mentorshipWays: string[];
  };
  update: (
    fields: Partial<{
      bio: string;
      linkedinUrl: string;
      isMentor: boolean;
      mentorshipWays: string[];
    }>
  ) => void;
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
  const [isLinkedinExpanded, setIsLinkedinExpanded] = useState(false);
  const linkedinInputRef = useRef<TextInput>(null);
  const [showMentorModal, setShowMentorModal] = useState(false);

  const characterCount = data.bio?.length ?? 0;
  const remainingChars = MAX_BIO_LENGTH - characterCount;
  const hasBio = !!data.bio?.trim();

  const proceedNext = () => {
    if (isNavigating) return;

    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  const handleNext = () => {
    setShowMentorModal(true);
  };

  // Bio is optional, so button is never disabled due to empty bio
  const isNextDisabled = remainingChars < 0;

  const toggleLinkedin = () => {
    Haptics.selectionAsync();
    if (isLinkedinExpanded) {
      setIsLinkedinExpanded(false);
      Keyboard.dismiss();
    } else {
      setIsLinkedinExpanded(true);
      setTimeout(() => linkedinInputRef.current?.focus(), 100);
    }
  };

  const handleMentorAccept = (selectedWays: string[]) => {
    update({ isMentor: true, mentorshipWays: selectedWays });
    setShowMentorModal(false);
    proceedNext();
  };

  const handleMentorDecline = () => {
    update({ isMentor: false, mentorshipWays: [] });
    setShowMentorModal(false);
    proceedNext();
  };

  const handleMentorDismiss = () => {
    setShowMentorModal(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outerContainer}
    >
      <TouchableOpacity
        style={styles.contentContainer}
        activeOpacity={1}
        onPress={() => {
          setIsLinkedinExpanded(false);
          Keyboard.dismiss();
        }}
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

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>LINKEDIN (OPTIONAL)</Text>
            <View
              style={[
                styles.cardContainer,
                isLinkedinExpanded && styles.cardFocused,
                !!data.linkedinUrl && !isLinkedinExpanded && styles.cardCompleted,
              ]}
            >
              <TouchableOpacity
                onPress={toggleLinkedin}
                style={[
                  styles.iconBox,
                  !!data.linkedinUrl && styles.iconBoxCompleted,
                ]}
              >
                <Ionicons
                  name="logo-linkedin"
                  size={22}
                  color={data.linkedinUrl ? '#000000' : '#FFFFFF'}
                />
              </TouchableOpacity>

              <View style={{ flex: 1, justifyContent: 'center' }}>
                <AnimatePresence exitBeforeEnter>
                  {isLinkedinExpanded ? (
                    <MotiView
                      key="linkedin-input"
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      exit={{ opacity: 0, translateX: -10 }}
                      transition={{ type: 'timing', duration: 200 }}
                      style={styles.inputWrapper}
                    >
                      <TextInput
                        ref={linkedinInputRef}
                        value={data.linkedinUrl}
                        onChangeText={(t) => update({ linkedinUrl: t })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        style={styles.textInput}
                        autoCapitalize="none"
                        keyboardType="url"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={toggleLinkedin}
                        style={styles.closeBtn}
                      >
                        <Ionicons name="checkmark" size={18} color="#000" />
                      </TouchableOpacity>
                    </MotiView>
                  ) : (
                    <MotiView
                      key="linkedin-label"
                      from={{ opacity: 0, translateX: 10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      exit={{ opacity: 0, translateX: 10 }}
                      transition={{ type: 'timing', duration: 200 }}
                    >
                      <TouchableOpacity onPress={toggleLinkedin}>
                        <Text style={styles.cardTitle}>LinkedIn</Text>
                        <Text
                          style={[
                            styles.cardSubtitle,
                            data.linkedinUrl && { color: '#FFFFFF' },
                          ]}
                        >
                          {data.linkedinUrl || 'Not Linked'}
                        </Text>
                      </TouchableOpacity>
                    </MotiView>
                  )}
                </AnimatePresence>
              </View>

              {!isLinkedinExpanded && (
                <TouchableOpacity onPress={toggleLinkedin}>
                  <Ionicons
                    name={data.linkedinUrl ? 'pencil' : 'chevron-forward'}
                    size={20}
                    color="rgba(255,255,255,0.3)"
                  />
                </TouchableOpacity>
              )}
            </View>
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
              {hasBio ? 'Next Step' : 'Skip for now'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={isNextDisabled ? '#666666' : '#000000'}
            />
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>

      <MentorshipInterstitial
        visible={showMentorModal}
        onDecline={handleMentorDecline}
        onAccept={handleMentorAccept}
        onDismiss={handleMentorDismiss}
      />
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

  fieldContainer: { marginBottom: SPACING.md },
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

  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 72,
    paddingHorizontal: 16,
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  cardCompleted: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconBoxCompleted: { backgroundColor: '#FFFFFF' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  cardSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  textInput: { flex: 1, color: '#FFF', fontSize: 16, height: '100%' },
  closeBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginLeft: 8,
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
