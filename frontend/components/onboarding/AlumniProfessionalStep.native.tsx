import { useEffect, useRef, useState } from 'react';
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
import { MotiView } from 'moti';
import { z } from 'zod';

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

const professionalSchema = z.object({
  company: z.string().trim().min(1, 'Company name is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  industry: z.string().trim().min(1, 'Industry is required'),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const cleaned = val.replace(/\D/g, '');
        return cleaned.length === 10;
      },
      { message: 'Phone number must be 10 digits' }
    ),
});

export interface FormData {
  company: string;
  jobTitle: string;
  industry: string;
  phoneNumber: string;
}

interface AlumniProfessionalStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AlumniProfessionalStep({
  data,
  update,
  onNext,
  onBack,
}: AlumniProfessionalStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const companyRef = useRef<TextInput>(null);
  const jobTitleRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState(data.industry ?? '');

  useEffect(() => {
    setTimeout(() => companyRef.current?.focus(), 100);
  }, []);

  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    update({ industry });
    setError(null);
  };

  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    let formatted = cleaned;
    if (cleaned.length >= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (cleaned.length > 0) {
      formatted = `(${cleaned}`;
    }

    update({ phoneNumber: formatted });
    setError(null);
  };

  const handleNext = () => {
    const payload = {
      company: data.company?.trim() ?? '',
      jobTitle: data.jobTitle?.trim() ?? '',
      industry: selectedIndustry?.trim() ?? '',
      phoneNumber: data.phoneNumber?.replace(/\D/g, '') ?? '',
    };

    const result = professionalSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please complete all required fields.');
      return;
    }

    update(payload);
    setError(null);
    onNext();
  };

  const isNextDisabled =
    !data.company?.trim() ||
    !data.jobTitle?.trim() ||
    !selectedIndustry?.trim();

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Dynamic colors
  const colors = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#94A3B8' : '#6B7280',
    border: isDark ? '#334155' : '#E5E7EB',
    primary: '#0D9488',
    error: '#DC2626',
    pill: isDark ? '#1E293B' : '#F3F4F6',
    pillActive: '#0D9488',
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
            <Text style={[styles.title, { color: colors.text }]}>Your Professional Info</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tell us about your current role.
            </Text>
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Company */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Company</Text>
            <TextInput
              ref={companyRef}
              value={data.company ?? ''}
              onChangeText={(text) => {
                update({ company: text });
                setError(null);
              }}
              placeholder="e.g., Google, Tesla, Self-Employed"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              returnKeyType="next"
              onSubmitEditing={() => jobTitleRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Job Title */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Job Title</Text>
            <TextInput
              ref={jobTitleRef}
              value={data.jobTitle ?? ''}
              onChangeText={(text) => {
                update({ jobTitle: text });
                setError(null);
              }}
              placeholder="e.g., Software Engineer, Project Manager"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Industry Selection */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Industry</Text>
            <View style={styles.pillsContainer}>
              {INDUSTRIES.map((industry) => {
                const isSelected = selectedIndustry === industry;
                return (
                  <TouchableOpacity
                    key={industry}
                    onPress={() => handleIndustrySelect(industry)}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.pill },
                      isSelected && { backgroundColor: colors.pillActive },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: colors.textSecondary },
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

          {/* Phone Number (Optional) */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Phone Number <Text style={[styles.optional, { color: colors.textSecondary }]}>(optional)</Text>
            </Text>
            <TextInput
              ref={phoneRef}
              value={data.phoneNumber ?? ''}
              onChangeText={handlePhoneChange}
              onFocus={scrollToBottom}
              placeholder="(XXX) XXX-XXXX"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              keyboardType="phone-pad"
              returnKeyType="done"
              maxLength={14}
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              For networking purposes
            </Text>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              disabled={isNextDisabled}
              style={[
                styles.nextButton,
                { backgroundColor: colors.primary },
                isNextDisabled && styles.nextButtonDisabled,
              ]}
            >
              <Text style={styles.nextButtonText}>Next</Text>
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
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
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
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  optional: {
    fontWeight: '400',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
