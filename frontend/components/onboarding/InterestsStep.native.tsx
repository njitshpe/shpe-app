import { useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import * as Notifications from 'expo-notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/colors';

const INTEREST_OPTIONS = [
  { id: 'internships', label: 'Internships 💼' },
  { id: 'scholarships', label: 'Scholarships 🎓' },
  { id: 'resume-help', label: 'Resume Help 📄' },
  { id: 'mental-health', label: 'Mental Health 💙' },
  { id: 'networking', label: 'Networking 🤝' },
  { id: 'leadership', label: 'Leadership 🌟' },
  { id: 'career-fairs', label: 'Career Fairs 🧭' },
  { id: 'community-service', label: 'Community Service 🤲' },
];

const interestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(1, 'Select at least 1 interest')
    .max(3, 'Select up to 3 interests'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
});

export interface FormData {
  interests: string[];
  phoneNumber: string;
}

interface InterestsStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function InterestsStep({ data, update, onNext, onBack }: InterestsStepProps) {
  const { theme, isDark } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [maxLimitWarning, setMaxLimitWarning] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  const handleToggleInterest = (interestId: string) => {
    const currentInterests = data.interests ?? [];
    const isSelected = currentInterests.includes(interestId);

    if (isSelected) {
      // Remove interest
      const updatedInterests = currentInterests.filter((id) => id !== interestId);
      update({ interests: updatedInterests });
      setError(null);
      setMaxLimitWarning(false);
    } else {
      // Add interest (with max 3 validation)
      if (currentInterests.length >= 3) {
        setMaxLimitWarning(true);
        setTimeout(() => setMaxLimitWarning(false), 3000);
        return;
      }
      const updatedInterests = [...currentInterests, interestId];
      update({ interests: updatedInterests });
      setError(null);
      setMaxLimitWarning(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '');
    update({ phoneNumber: cleaned });
    setError(null);
  };

  // Format phone number for display (e.g., 1234567890 -> (123) 456-7890)
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleNext = async () => {
    const payload = {
      interests: data.interests ?? [],
      phoneNumber: data.phoneNumber?.trim() ?? '',
    };

    const result = interestsSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your inputs.');
      return;
    }

    setError(null);

    // Request notification permission (only prompts if status is undetermined)
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: nextStatus } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });

        if (nextStatus !== 'granted') {
          Alert.alert(
            'Enable Notifications',
            'You can turn on notifications later in Settings.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      // Continue anyway
    }

    onNext();
  };

  const isNextDisabled = !data.interests || data.interests.length === 0;

  return (
    <MotiView
      from={{ translateX: 50, opacity: 0 }}
      animate={{ translateX: 0, opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>What interests you?</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Select up to 3 areas of interest.
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={[
                styles.errorContainer,
                { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2', borderColor: isDark ? '#7F1D1D' : '#FCA5A5' },
              ]}
            >
              <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>⚠️ {error}</Text>
            </MotiView>
          ) : null}

          {/* Max Limit Warning */}
          {maxLimitWarning ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={[
                styles.warningContainer,
                { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FEF3C7', borderColor: isDark ? '#92400E' : '#FCD34D' },
              ]}
            >
              <Text style={[styles.warningText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                ⚠️ You can select up to 3 interests maximum.
              </Text>
            </MotiView>
          ) : null}

          {/* Interest Pills - Instagram Story Style */}
          <View style={styles.grid}>
            {INTEREST_OPTIONS.map((interest) => {
              const isActive = (data.interests ?? []).includes(interest.id);
              return (
                <Pressable
                  key={interest.id}
                  onPress={() => handleToggleInterest(interest.id)}
                >
                  <MotiView
                    animate={{
                      scale: isActive ? 1 : 0.98,
                    }}
                    transition={{
                      type: 'spring',
                      damping: 20,
                      stiffness: 300,
                    }}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={GRADIENTS.primaryButton}
                        style={[styles.interestPill, styles.interestPillActive]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.interestTextActive}>
                          {interest.label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={[
                        styles.interestPill,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                      ]}>
                        <Text style={[styles.interestText, { color: theme.subtext }]}>
                          {interest.label}
                        </Text>
                      </View>
                    )}
                  </MotiView>
                </Pressable>
              );
            })}
          </View>

          {/* Phone Number Input (Optional) - Filled Style */}
          <View style={styles.phoneContainer}>
            <Text style={[styles.phoneLabel, { color: theme.text }]}>Phone Number (Optional)</Text>
            <View
              style={[
                styles.filledInput,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
              ]}
            >
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                value={formatPhoneDisplay(data.phoneNumber ?? '')}
                onChangeText={handlePhoneChange}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                placeholder="(123) 456-7890"
                placeholderTextColor={theme.subtext}
                keyboardType="phone-pad"
                maxLength={14}
                style={[styles.inputWithPadding, { color: theme.text }]}
              />
            </View>
            <MotiView
              animate={{
                width: focusedInput ? '100%' : '0%',
                backgroundColor: SHPE_COLORS.sunsetOrange,
              }}
              transition={{ type: 'timing', duration: 200 }}
              style={styles.focusIndicator}
            />
            <Text style={[styles.helperText, { color: theme.subtext }]}>
              We'll only use this for important updates.
            </Text>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onBack}
              style={[
                styles.backButton,
                { borderColor: theme.border, backgroundColor: theme.card },
              ]}
            >
              <Text style={[styles.backButtonText, { color: theme.text }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              disabled={isNextDisabled}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isNextDisabled ? ['#94A3B8', '#64748B'] : GRADIENTS.primaryButton}
                style={[styles.nextButton, isNextDisabled && { opacity: 0.5 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.title,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
  },
  warningContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  warningText: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  // Rounded pill chips
  interestPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 120,
  },
  interestPillActive: {
    ...SHADOWS.primaryGlow,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  interestTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.primaryGlow,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  phoneContainer: {
    marginBottom: SPACING.lg,
  },
  phoneLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  filledInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  inputWithPadding: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  focusIndicator: {
    height: 2,
    borderRadius: RADIUS.full,
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    marginTop: SPACING.sm,
  },
});
