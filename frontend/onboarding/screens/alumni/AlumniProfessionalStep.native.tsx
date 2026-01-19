import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SPACING, RADIUS } from '@/constants/colors';
import { GlassInput } from '../../components/OnboardingComponents';

// --- INDUSTRIES LIST ---
const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Construction',
  'Energy',
  'Education',
  'Government',
  'Consulting',
  'Manufacturing',
  'Aerospace & Defense',
  'Telecommunications',
  'Retail',
  'Other',
] as const;

const professionalSchema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  industry: z.string().trim().min(1, 'Industry is required'),
});

// --- INDUSTRY SELECTION MODAL ---
const IndustryModal = ({
  visible,
  onClose,
  onSelect,
  selected,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (industry: string) => void;
  selected: string;
}) => {
  const insets = useSafeAreaInsets();

  const handleSelect = (industry: string) => {
    Haptics.selectionAsync();
    onSelect(industry);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[modalStyles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Select Industry</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={INDUSTRIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }}
          renderItem={({ item, index }) => {
            const isSelected = selected === item;
            return (
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 200, delay: index * 30 }}
              >
                <TouchableOpacity
                  style={[
                    modalStyles.option,
                    isSelected && modalStyles.optionSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      modalStyles.optionText,
                      isSelected && modalStyles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </MotiView>
            );
          }}
        />
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

interface AlumniProfessionalStepProps {
  data: {
    company: string;
    jobTitle: string;
    industry: string;
  };
  update: (
    fields: Partial<{
      company: string;
      jobTitle: string;
      industry: string;
    }>
  ) => void;
  onNext: () => void;
}

export default function AlumniProfessionalStep({
  data,
  update,
  onNext,
}: AlumniProfessionalStepProps) {
  const insets = useSafeAreaInsets();
  const [isIndustryModalVisible, setIsIndustryModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNext = () => {
    if (isNavigating) return;

    const result = professionalSchema.safeParse(data);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Please complete all fields.';
      setError(firstError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError(null);
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  const isNextDisabled = !data.company || !data.jobTitle || !data.industry;

  return (
    <View style={styles.outerContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={Keyboard.dismiss}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <View style={styles.header}>
                <Text style={styles.title}>YOUR CAREER</Text>
                <Text style={styles.subtitle}>
                  Where has your journey taken you?
                </Text>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* COMPANY INPUT */}
              <GlassInput
                label="COMPANY"
                value={data.company}
                placeholder="e.g. Google, Goldman Sachs"
                icon="business-outline"
                onChangeText={(t) => update({ company: t })}
              />

              {/* JOB TITLE INPUT */}
              <GlassInput
                label="JOB TITLE"
                value={data.jobTitle}
                placeholder="e.g. Software Engineer"
                icon="briefcase-outline"
                onChangeText={(t) => update({ jobTitle: t })}
              />

              {/* INDUSTRY SELECTOR */}
              <GlassInput
                label="INDUSTRY"
                value={data.industry}
                placeholder="Select Industry"
                icon="layers-outline"
                readOnly
                onPress={() => setIsIndustryModalVisible(true)}
              />
            </MotiView>
          </ScrollView>
        </TouchableOpacity>

        {/* FOOTER */}
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
                Next Step
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={isNextDisabled ? '#666666' : '#000000'}
              />
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        <IndustryModal
          visible={isIndustryModalVisible}
          onClose={() => setIsIndustryModalVisible(false)}
          onSelect={(industry) => update({ industry })}
          selected={data.industry}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  header: { marginBottom: SPACING.xl, marginTop: SPACING.md },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  errorText: { color: '#F87171', marginBottom: 10, fontSize: 13 },
  footer: { paddingHorizontal: SPACING.lg },
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
