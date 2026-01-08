import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS } from '@/constants/colors';
import MentorshipInterstitial from '../../components/MentorshipInterstitial.native';

const INDUSTRIES = [
  'Aerospace',
  'Automotive',
  'Biotechnology',
  'Civil Infrastructure',
  'Consulting',
  'Construction',
  'Energy',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Pharmaceuticals',
  'Software/Tech',
  'Telecommunications',
  'Other',
];


export interface FormData {
  company: string;
  jobTitle: string;
  industry: string;
  mentorshipAvailable: boolean;
  mentorshipWays: string[];
}

interface AlumniProfessionalStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

export default function AlumniProfessionalStep({
  data,
  update,
  onNext,
}: AlumniProfessionalStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedIndustry, setSelectedIndustry] = useState(data.industry ?? '');
  const [error, setError] = useState<string | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);

  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    update({ industry });
    setError(null);
  };

  const handleMentorshipDecline = () => {
    setShowInterstitial(false);
    update({
      mentorshipAvailable: false,
      mentorshipWays: [],
    });
    onNext();
  };

  const handleMentorshipAccept = (selectedWays: string[]) => {
    setShowInterstitial(false);
    update({
      mentorshipAvailable: true,
      mentorshipWays: selectedWays,
    });
    onNext();
  };

  const handleNext = () => {
    // Validate required fields
    if (!data.company?.trim()) {
      setError('Company name is required');
      return;
    }
    if (!data.jobTitle?.trim()) {
      setError('Job title is required');
      return;
    }
    if (!selectedIndustry?.trim()) {
      setError('Please select an industry');
      return;
    }

    update({
      company: data.company?.trim(),
      jobTitle: data.jobTitle?.trim(),
      industry: selectedIndustry,
    });
    setError(null);

    // Show mentorship interstitial instead of navigating directly
    setShowInterstitial(true);
  };

  const isNextDisabled = !data.company?.trim() || !data.jobTitle?.trim() || !selectedIndustry?.trim();

  // Dynamic colors
  const colors = {
    background: isDark ? '#001339' : '#F7FAFF',
    surface: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)',
    text: isDark ? '#F5F8FF' : '#0B1630',
    textSecondary: isDark ? 'rgba(229, 239, 255, 0.75)' : 'rgba(22, 39, 74, 0.7)',
    border: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(11, 22, 48, 0.12)',
    borderGlow: SHPE_COLORS.accentBlueBright,
    primary: SHPE_COLORS.accentBlueBright,
    error: '#DC2626',
    pill: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
    pillActive: SHPE_COLORS.accentBlueBright,
  };

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          style={styles.keyboardView}
        >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Professional Details</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tell us about your current role and expertise.
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2', borderColor: isDark ? '#7F1D1D' : '#FCA5A5' }]}>
              <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Company Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Company</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.pill, borderColor: colors.border }]}>
              <Text style={styles.inputIcon}>🏢</Text>
              <TextInput
                value={data.company ?? ''}
                onChangeText={(text) => {
                  update({ company: text });
                  setError(null);
                }}
                placeholder="e.g., Google, Tesla, Self-Employed"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text }]}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Job Title Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Job Title</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.pill, borderColor: colors.border }]}>
              <Text style={styles.inputIcon}>💼</Text>
              <TextInput
                value={data.jobTitle ?? ''}
                onChangeText={(text) => {
                  update({ jobTitle: text });
                  setError(null);
                }}
                placeholder="e.g., Software Engineer, Project Manager"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text }]}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Industry Tags (Expertise) */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Your Industry Expertise</Text>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Select the industry that best describes your professional experience
            </Text>
            <View style={styles.pillsContainer}>
              {INDUSTRIES.map((industry) => {
                const isSelected = selectedIndustry === industry;
                return (
                  <TouchableOpacity
                    key={industry}
                    onPress={() => handleIndustrySelect(industry)}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.pill, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.pillActive, borderColor: colors.pillActive },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: colors.text },
                        isSelected && styles.pillTextActive,
                      ]}
                    >
                      {industry}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>
        </KeyboardAvoidingView>
      </MotiView>

      {/* Fixed Next Button - Outside KeyboardAvoidingView */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || SPACING.md }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={isNextDisabled}
          activeOpacity={0.8}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={isNextDisabled ? ['#94A3B8', '#64748B'] : GRADIENTS.accentButton}
            style={[styles.nextButton, isNextDisabled && { opacity: 0.5 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Mentorship Interstitial */}
      <MentorshipInterstitial
        visible={showInterstitial}
        onDecline={handleMentorshipDecline}
        onAccept={handleMentorshipAccept}
      />
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
    padding: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: SPACING.md,
    backgroundColor: 'transparent',
  },
  buttonWrapper: {
    width: '100%',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
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
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  nextButton: {
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
