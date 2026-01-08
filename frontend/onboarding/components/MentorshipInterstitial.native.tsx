import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MENTORSHIP_WAYS = [
  { id: 'resume-reviews', label: 'Resume Reviews', icon: '📄' },
  { id: 'mock-interviews', label: 'Mock Interviews', icon: '🎤' },
  { id: 'coffee-chats', label: 'Coffee Chats', icon: '☕' },
  { id: 'company-tours', label: 'Company Tours', icon: '🏢' },
];

interface MentorshipInterstitialProps {
  visible: boolean;
  onDecline: () => void;
  onAccept: (selectedWays: string[]) => void;
}

export default function MentorshipInterstitial({
  visible,
  onDecline,
  onAccept,
}: MentorshipInterstitialProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [expanded, setExpanded] = useState(false);
  const [selectedWays, setSelectedWays] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  // Reset state when modal closes
  const handleModalClose = () => {
    setExpanded(false);
    setSelectedWays([]);
    setShowError(false);
  };

  const handleDecline = () => {
    handleModalClose();
    onDecline();
  };

  const handleYes = () => {
    setExpanded(true);
    setShowError(false);
  };

  const handleWayToggle = (wayId: string) => {
    setSelectedWays((prev) =>
      prev.includes(wayId)
        ? prev.filter((id) => id !== wayId)
        : [...prev, wayId]
    );
    setShowError(false);
  };

  const handleContinue = () => {
    if (selectedWays.length === 0) {
      setShowError(true);
      return;
    }
    handleModalClose();
    onAccept(selectedWays);
  };

  const colors = {
    background: isDark ? '#001339ff' : '#F7FAFF',
    surface: isDark ? 'rgba(0, 19, 57, .8)' : '#001339f',
    text: isDark ? '#F5F8FF' : '#0B1630',
    textSecondary: isDark ? 'rgba(229, 239, 255, 0.75)' : 'rgba(22, 39, 74, 0.7)',
    border: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(11, 22, 48, 0.12)',
    pill: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
    pillActive: SHPE_COLORS.accentBlueBright,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDecline}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Dimmed Backdrop - Inert (no dismiss on tap) */}
        <View style={styles.backdrop} pointerEvents="none">
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        </View>

        {/* Bottom Sheet */}
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ translateY: SCREEN_HEIGHT }}
              animate={{ translateY: 0 }}
              exit={{ translateY: SCREEN_HEIGHT }}
              transition={{ type: 'timing', duration: 300, damping: 20 }}
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.surface,
                  maxHeight: expanded ? SCREEN_HEIGHT * 0.75 : SCREEN_HEIGHT * 0.5,
                },
              ]}
            >
              {/* Handle Bar */}
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Headline */}
                <Text style={[styles.headline, { color: colors.text }]}>
                  Pass the Torch 🔥
                </Text>

                {/* Body */}
                <Text style={[styles.body, { color: colors.textSecondary }]}>
                  Your experience is invaluable. Would you be open to students connecting with you for
                  advice?
                </Text>

                {/* Initial Buttons (when not expanded) */}
                {!expanded && (
                  <View style={styles.buttonGroup}>
                    {/* Primary Button */}
                    <TouchableOpacity
                      onPress={handleYes}
                      activeOpacity={0.8}
                      style={styles.primaryButtonWrapper}
                    >
                      <LinearGradient
                        colors={GRADIENTS.accentButton}
                        style={styles.primaryButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.primaryButtonText}>Yes, count me in!</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Secondary Button */}
                    <TouchableOpacity
                      onPress={handleDecline}
                      activeOpacity={0.7}
                      style={styles.secondaryButton}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                        Maybe later
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Expanded Content */}
                <AnimatePresence>
                  {expanded && (
                    <MotiView
                      from={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'timing', duration: 300 }}
                    >
                      {/* Expanded Headline */}
                      <Text style={[styles.expandedHeadline, { color: colors.text }]}>
                        Great! How would you like to help?
                      </Text>

                      {/* Error Message */}
                      {showError && (
                        <MotiView
                          from={{ opacity: 0, translateY: -10 }}
                          animate={{ opacity: 1, translateY: 0 }}
                          style={[
                            styles.errorContainer,
                            {
                              backgroundColor: isDark
                                ? 'rgba(220, 38, 38, 0.15)'
                                : '#FEE2E2',
                              borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.errorText,
                              { color: isDark ? '#FCA5A5' : '#991B1B' },
                            ]}
                          >
                            ⚠️ Please select at least one option
                          </Text>
                        </MotiView>
                      )}

                      {/* Mentorship Chips */}
                      <View style={styles.chipsContainer}>
                        {MENTORSHIP_WAYS.map((way) => {
                          const isSelected = selectedWays.includes(way.id);
                          return (
                            <TouchableOpacity
                              key={way.id}
                              onPress={() => handleWayToggle(way.id)}
                              style={[
                                styles.chip,
                                {
                                  backgroundColor: colors.pill,
                                  borderColor: colors.border,
                                },
                                isSelected && {
                                  backgroundColor: colors.pillActive,
                                  borderColor: colors.pillActive,
                                },
                              ]}
                            >
                              <Text style={styles.chipIcon}>{way.icon}</Text>
                              <Text
                                style={[
                                  styles.chipText,
                                  { color: colors.text },
                                  isSelected && styles.chipTextActive,
                                ]}
                              >
                                {way.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Continue Button */}
                      <TouchableOpacity
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        style={styles.continueButtonWrapper}
                      >
                        <LinearGradient
                          colors={GRADIENTS.accentButton}
                          style={styles.continueButton}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.continueButtonText}>Continue</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </MotiView>
                  )}
                </AnimatePresence>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  buttonGroup: {
    gap: SPACING.md,
  },
  primaryButtonWrapper: {
    width: '100%',
  },
  primaryButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
    ...SHADOWS.accentGlow,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  expandedHeadline: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 8,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  continueButtonWrapper: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  continueButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
    ...SHADOWS.accentGlow,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
