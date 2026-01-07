import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/colors';
import ResumePreview from '@/components/shared/ResumePreview';

const MOCK_BIO_TEMPLATE =
  'Mechanical Engineering student at NJIT passionate about automotive systems, sustainable design, and innovation. Experienced in CAD modeling and team collaboration through SHPE projects.';

// Note: File validation in RN uses a different approach
const assetsSchema = z.object({
  linkedinUrl: z
    .string()
    .trim()
    .url('Please enter a valid URL (e.g., https://linkedin.com/in/yourname)')
    .optional()
    .or(z.literal('')),
  portfolioUrl: z
    .string()
    .trim()
    .url('Please enter a valid URL (e.g., https://yourportfolio.com)')
    .optional()
    .or(z.literal('')),
  bio: z.string().optional(),
});

export interface FormData {
  resumeFile: DocumentPicker.DocumentPickerAsset | null;
  linkedinUrl: string;
  portfolioUrl: string;
  bio: string;
}

interface AssetsStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

export default function AssetsStep({ data, update, onNext }: AssetsStepProps) {
  const { theme, isDark } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check file size (5MB limit)
        if (file.size && file.size > 5 * 1024 * 1024) {
          setError('File size must be less than 5MB.');
          return;
        }

        update({ resumeFile: file });
        setError(null);
      }
    } catch (err) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleRemoveFile = () => {
    update({ resumeFile: null });
  };

  const handleAutoGenerateBio = () => {
    update({ bio: MOCK_BIO_TEMPLATE });
    setError(null);
  };

  const handleSkip = () => {
    onNext();
  };

  const handleNext = () => {
    const payload = {
      linkedinUrl: data.linkedinUrl?.trim() ?? '',
      portfolioUrl: data.portfolioUrl?.trim() ?? '',
      bio: data.bio?.trim() ?? '',
    };

    // Only validate if linkedinUrl or portfolioUrl has content
    if (payload.linkedinUrl || payload.portfolioUrl) {
      const result = assetsSchema.safeParse(payload);
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? 'Please check your inputs.');
        return;
      }
    }

    setError(null);
    onNext();
  };

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
        {/* Top Row: Skip Button */}
        <View style={styles.topRow}>
          <View style={styles.topRowSpacer} />
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: theme.subtext }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Unlock your Career Profile</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Upload your resume to stand out.
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

        {/* Resume Upload Zone */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Resume (Optional)</Text>
          {data.resumeFile ? (
            <MotiView
              from={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <ResumePreview file={data.resumeFile} showRemove onRemove={handleRemoveFile} />
            </MotiView>
          ) : (
            // Empty Upload State - Dashed Border Drop Zone
            <TouchableOpacity
              onPress={handlePickDocument}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isDark ? GRADIENTS.darkCard : ['rgba(255, 255, 255, 0.5)', 'rgba(249, 250, 251, 0.3)']}
                style={styles.uploadBox}
              >
                <View style={[styles.dashedBorder, { borderColor: theme.border }]} />
                <Text style={styles.uploadIcon}>📤</Text>
                <Text style={[styles.uploadTitle, { color: theme.text }]}>Tap to upload resume</Text>
                <Text style={[styles.uploadSubtitle, { color: theme.subtext }]}>
                  PDF only • Max 5MB
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* LinkedIn URL - Filled Style */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>LinkedIn Profile (Optional)</Text>
          <View style={[
            styles.filledInput,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
          ]}>
            <Text style={styles.inputIcon}>🔗</Text>
            <TextInput
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
            />
          </View>
          {/* Bottom line indicator */}
              <MotiView
                animate={{
                  width: focusedInput === 'linkedin' ? '100%' : '0%',
                  backgroundColor: SHPE_COLORS.accentBlueBright,
                }}
                transition={{ type: 'timing', duration: 200 }}
                style={styles.focusIndicator}
              />
        </View>

        {/* Portfolio / Website URL - Filled Style */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Portfolio / Website (Optional)</Text>
          <View style={[
            styles.filledInput,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
          ]}>
            <Text style={styles.inputIcon}>🌐</Text>
            <TextInput
              value={data.portfolioUrl ?? ''}
              onChangeText={(text) => {
                update({ portfolioUrl: text });
                setError(null);
              }}
              onFocus={() => setFocusedInput('portfolio')}
              onBlur={() => setFocusedInput(null)}
              placeholder="https://yourportfolio.com"
              placeholderTextColor={theme.subtext}
              style={[styles.inputWithPadding, { color: theme.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
          {/* Bottom line indicator */}
              <MotiView
                animate={{
                  width: focusedInput === 'portfolio' ? '100%' : '0%',
                  backgroundColor: SHPE_COLORS.accentBlueBright,
                }}
                transition={{ type: 'timing', duration: 200 }}
                style={styles.focusIndicator}
              />
        </View>

        {/* Bio Section - Filled Style */}
        <View style={styles.fieldContainer}>
          <View style={styles.bioHeader}>
            <Text style={[styles.label, { color: theme.text }]}>Professional Bio (Optional)</Text>
              <TouchableOpacity
              onPress={handleAutoGenerateBio}
              style={[
                styles.aiButton,
                { backgroundColor: isDark ? 'rgba(92, 141, 255, 0.18)' : 'rgba(92, 141, 255, 0.12)' }
              ]}
            >
              <Text style={[styles.aiButtonText, { color: SHPE_COLORS.accentBlueBright }]}>✨ Auto-generate</Text>
            </TouchableOpacity>
          </View>
          <View style={[
            styles.filledInput,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
          ]}>
            <TextInput
              value={data.bio ?? ''}
              onChangeText={(text) => {
                update({ bio: text });
                setError(null);
              }}
              onFocus={() => setFocusedInput('bio')}
              onBlur={() => setFocusedInput(null)}
              placeholder="Tell us about yourself, your interests, and career goals..."
              placeholderTextColor={theme.subtext}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.textArea, { color: theme.text }]}
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
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  topRowSpacer: {
    flex: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
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
  // Dashed border drop zone
  uploadBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dashedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
  },
  uploadIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  uploadSubtitle: {
    fontSize: 13,
  },
  // File selected preview uses ResumePreview component styles
  // Filled input style
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
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  aiButton: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textArea: {
    padding: SPACING.md,
    fontSize: 16,
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  nextButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
    ...SHADOWS.accentGlow,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
