import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, TYPOGRAPHY } from '@/constants/colors';

const socialSchema = z.object({
  linkedinUrl: z
    .string()
    .trim()
    .url('Please enter a valid URL (e.g., https://linkedin.com/in/yourname)')
    .optional()
    .or(z.literal('')),
  professionalBio: z
    .string()
    .trim()
    .max(500, 'Bio must be 500 characters or less')
    .optional()
    .or(z.literal('')),
});

export interface FormData {
  linkedinUrl: string;
  professionalBio: string;
}

interface AlumniSocialStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

export default function AlumniSocialStep({ data, update, onNext }: AlumniSocialStepProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const linkedinRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  const handleNext = () => {
    const payload = {
      linkedinUrl: data.linkedinUrl?.trim() ?? '',
      professionalBio: data.professionalBio?.trim() ?? '',
    };

    const result = socialSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your input.');
      return;
    }

    update(payload);
    setError(null);
    onNext();
  };

  const bioCharCount = data.professionalBio?.length ?? 0;
  const bioMaxLength = 500;

  return (
    <View style={styles.outerContainer}>
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
          <Text style={[styles.title, { color: theme.text }]}>Your Professional Presence</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Share your LinkedIn profile and tell us about yourself.
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

        {/* LinkedIn URL - Prominent */}
        <View style={styles.fieldContainer}>
          <View style={styles.linkedinHeader}>
            <Text style={[styles.label, { color: theme.text }]}>LinkedIn Profile</Text>
            <Text style={[styles.linkedinBadge, { color: SHPE_COLORS.accentBlueBright }]}>✨ Helps Students Connect With You</Text>
          </View>
          <View style={[
            styles.filledInput,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
          ]}>
            <Text style={styles.inputIcon}>🔗</Text>
            <TextInput
              ref={linkedinRef}
              value={data.linkedinUrl ?? ''}
              onChangeText={(text) => {
                update({ linkedinUrl: text });
                setError(null);
              }}
              onFocus={() => setFocusedInput('linkedin')}
              onBlur={() => setFocusedInput(null)}
              placeholder="https://linkedin.com/in/yourname"
              placeholderTextColor={theme.subtext}
              style={[styles.inputWithPadding, { color: theme.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
              onSubmitEditing={() => bioRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <MotiView
            animate={{
              width: focusedInput === 'linkedin' ? '100%' : '0%',
              backgroundColor: SHPE_COLORS.accentBlueBright,
            }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.focusIndicator}
          />
          <Text style={[styles.helperText, { color: theme.subtext }]}>
            Optional but highly recommended
          </Text>
        </View>

        {/* Professional Bio - Optional */}
        <View style={styles.fieldContainer}>
          <View style={styles.bioHeader}>
            <Text style={[styles.label, { color: theme.text }]}>Professional Bio (Optional)</Text>
            <Text style={[styles.charCount, { color: bioCharCount > bioMaxLength ? '#DC2626' : theme.subtext }]}>
              {bioCharCount}/{bioMaxLength}
            </Text>
          </View>
          <View style={[
            styles.textAreaContainer,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
          ]}>
            <TextInput
              ref={bioRef}
              value={data.professionalBio ?? ''}
              onChangeText={(text) => {
                if (text.length <= bioMaxLength) {
                  update({ professionalBio: text });
                  setError(null);
                }
              }}
              onFocus={() => setFocusedInput('bio')}
              onBlur={() => setFocusedInput(null)}
              placeholder="Share a brief overview of your career journey, expertise, or what you're passionate about..."
              placeholderTextColor={theme.subtext}
              style={[styles.textArea, { color: theme.text }]}
              multiline
              numberOfLines={6}
              maxLength={bioMaxLength}
              returnKeyType="default"
              textAlignVertical="top"
            />
          </View>
          <MotiView
            animate={{
              width: focusedInput === 'bio' ? '100%' : '0%',
              backgroundColor: SHPE_COLORS.accentBlueBright,
            }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.focusIndicator}
          />
          <Text style={[styles.helperText, { color: theme.subtext }]}>
            Tell students about your career path and what drives you
          </Text>
        </View>

        </ScrollView>
        </KeyboardAvoidingView>
      </MotiView>

      {/* Fixed Next Button - Outside KeyboardAvoidingView */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || SPACING.md }]}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={GRADIENTS.accentButton}
            style={styles.nextButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.md,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    backgroundColor: 'transparent',
  },
  buttonWrapper: {
    width: '100%',
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
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
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
  linkedinHeader: {
    marginBottom: SPACING.sm,
  },
  linkedinBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  textAreaContainer: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  textArea: {
    fontSize: 16,
    minHeight: 120,
    maxHeight: 180,
  },
  nextButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
