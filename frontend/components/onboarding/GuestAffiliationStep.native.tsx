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
import { Ionicons } from '@expo/vector-icons';
import SearchableSelectionModal from '../shared/SearchableSelectionModal';
import { UNIVERSITIES } from '@/constants/universities';

const affiliationSchema = z.object({
  university: z.string().trim().min(2, 'University or organization is required'),
  major: z.string().optional(),
});

export interface FormData {
  university: string;
  major: string;
}

interface GuestAffiliationStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function GuestAffiliationStep({
  data,
  update,
  onNext,
  onBack,
}: GuestAffiliationStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const majorRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isUniversityModalVisible, setIsUniversityModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUniversitySelect = (university: string) => {
    update({ university });
    setError(null);
  };

  const handleNext = () => {
    const payload = {
      university: data.university?.trim() ?? '',
      major: data.major?.trim(),
    };

    const result = affiliationSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please complete required fields.');
      return;
    }

    update(payload);
    setError(null);
    onNext();
  };

  const isNextDisabled = !data.university?.trim();

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Dynamic colors
  const colors = {
    background: isDark ? '#001339' : '#F7FAFF',
    surface: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)',
    text: isDark ? '#F5F8FF' : '#0B1630',
    textSecondary: isDark ? 'rgba(229, 239, 255, 0.75)' : 'rgba(22, 39, 74, 0.7)',
    border: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(11, 22, 48, 0.12)',
    primary: isDark ? '#8B5CF6' : '#7C3AED', // Purple for guests
    error: '#DC2626',
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
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.backIconButton}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Your Affiliation</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tell us where you're coming from.
            </Text>
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* University/Organization */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>University or Organization</Text>
            <TouchableOpacity
              onPress={() => setIsUniversityModalVisible(true)}
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.selectInputText, { color: data.university ? colors.text : colors.textSecondary }]}>
                {data.university || 'Select university or organization'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              The university or company you're affiliated with
            </Text>
          </View>

          {/* University Selection Modal */}
          <SearchableSelectionModal
            visible={isUniversityModalVisible}
            onClose={() => setIsUniversityModalVisible(false)}
            onSelect={handleUniversitySelect}
            options={UNIVERSITIES}
            selectedValue={data.university}
            title="Select University or Organization"
            placeholder="Search universities (e.g., Rutgers)"
            emptyMessage="No universities found"
          />

          {/* Role/Major (Optional) */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Role or Major <Text style={[styles.optional, { color: colors.textSecondary }]}>(optional)</Text>
            </Text>
            <TextInput
              ref={majorRef}
              value={data.major ?? ''}
              onChangeText={(text) => {
                update({ major: text });
                setError(null);
              }}
              onFocus={scrollToBottom}
              placeholder="e.g., Computer Science, Student Ambassador"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              returnKeyType="done"
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Your major, job title, or role
            </Text>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              As an external member, you'll have access to SHPE events and networking opportunities. We're excited to have you in the familia!
            </Text>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonRow}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    flex: 1,
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
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  nextButton: {
    flex: 1,
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
