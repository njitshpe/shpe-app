import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import SearchableSelectionModal from '../../components/SearchableSelectionModal';
import { GlassInput } from '../../components/OnboardingComponents';
import { NJIT_MAJORS } from '@/constants/majors';
import { SPACING, RADIUS } from '@/constants/colors';

const CURRENT_YEAR = new Date().getFullYear() - 1;
const MIN_YEAR = 1960;
const YEAR_ITEM_HEIGHT = 44;

const DEGREE_TYPES = ['BS', 'MS', 'PhD', 'MBA'] as const;

// --- VALIDATION ---
const academicsSchema = z.object({
  major: z.string().trim().min(1, 'Select a major'),
  degreeType: z.string().trim().min(1, 'Select a degree type'),
  graduationYear: z.string().trim().regex(/^\d{4}$/),
});

// --- DEGREE TYPE SELECTOR ---
const DegreeTypeSelector = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>DEGREE TYPE</Text>
      <View style={styles.degreeRow}>
        {DEGREE_TYPES.map((degree) => {
          const isSelected = selected === degree;
          return (
            <TouchableOpacity
              key={degree}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(degree);
              }}
              style={[
                styles.degreeChip,
                isSelected && styles.degreeChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.degreeText,
                  isSelected && styles.degreeTextSelected,
                ]}
              >
                {degree}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface AlumniAcademicsStepProps {
  data: {
    major: string;
    degreeType: string;
    graduationYear: string;
  };
  update: (fields: Partial<{ major: string; degreeType: string; graduationYear: string }>) => void;
  onNext: () => void;
}

export default function AlumniAcademicsStep({
  data,
  update,
  onNext,
}: AlumniAcademicsStepProps) {
  const insets = useSafeAreaInsets();
  const yearScrollRef = useRef<ScrollView>(null);
  const [isMajorModalVisible, setIsMajorModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Generate years from MIN_YEAR to CURRENT_YEAR (descending for alumni - most recent first)
  const availableYears = Array.from(
    { length: CURRENT_YEAR - MIN_YEAR + 1 },
    (_, i) => String(CURRENT_YEAR - i)
  );

  // Auto-scroll to selected year on mount
  useEffect(() => {
    if (!data.graduationYear) {
      // Default to last year for alumni
      update({ graduationYear: String(CURRENT_YEAR - 1) });
    }

    setTimeout(() => {
      const index = availableYears.indexOf(data.graduationYear || String(CURRENT_YEAR - 1));
      if (index >= 0 && yearScrollRef.current) {
        yearScrollRef.current.scrollTo({
          y: index * YEAR_ITEM_HEIGHT,
          animated: false,
        });
      }
    }, 100);
  }, []);

  const handleScrollEnd = (ev: any) => {
    const index = Math.round(ev.nativeEvent.contentOffset.y / YEAR_ITEM_HEIGHT);
    const year = availableYears[index];
    if (year && year !== data.graduationYear) {
      Haptics.selectionAsync();
      update({ graduationYear: year });
    }
  };

  const handleNext = () => {
    if (isNavigating) return;

    const result = academicsSchema.safeParse(data);
    if (!result.success) {
      setError('Please complete all fields.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  const isNextDisabled = !data.major || !data.degreeType || !data.graduationYear;

  return (
    <View style={styles.outerContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
              <Text style={styles.title}>YOUR LEGACY</Text>
              <Text style={styles.subtitle}>Tell us about your NJIT journey.</Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* MAJOR INPUT */}
            <GlassInput
              label="MAJOR"
              value={data.major}
              placeholder="Select Major"
              icon="school-outline"
              readOnly
              onPress={() => setIsMajorModalVisible(true)}
            />

            {/* DEGREE TYPE SELECTOR */}
            <DegreeTypeSelector
              selected={data.degreeType}
              onSelect={(value) => update({ degreeType: value })}
            />

            {/* YEAR WHEEL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>CLASS OF</Text>
              <View style={styles.wheelContainer}>
                <LinearGradient
                  colors={[
                    'rgba(15, 23, 42, 0.9)',
                    'transparent',
                    'rgba(15, 23, 42, 0.9)',
                  ]}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.wheelHighlight} pointerEvents="none" />

                <ScrollView
                  ref={yearScrollRef}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={YEAR_ITEM_HEIGHT}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingVertical: YEAR_ITEM_HEIGHT }}
                  onMomentumScrollEnd={handleScrollEnd}
                  onScrollEndDrag={handleScrollEnd}
                >
                  {availableYears.map((item) => (
                    <View key={item} style={styles.yearItem}>
                      <Text
                        style={[
                          styles.yearText,
                          data.graduationYear === item && styles.yearTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </MotiView>

          <SearchableSelectionModal
            visible={isMajorModalVisible}
            onClose={() => setIsMajorModalVisible(false)}
            onSelect={(m) => update({ major: m })}
            options={NJIT_MAJORS}
            title="Select Major"
          />
        </ScrollView>

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

  fieldContainer: { marginBottom: SPACING.lg },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 1,
  },

  // Degree Type Selector
  degreeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  degreeChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  degreeChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  degreeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  degreeTextSelected: {
    color: '#000000',
  },

  // Year Wheel
  wheelContainer: {
    height: YEAR_ITEM_HEIGHT * 3,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  wheelHighlight: {
    position: 'absolute',
    top: YEAR_ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: YEAR_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  yearItem: {
    height: YEAR_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearText: { fontSize: 18, color: '#64748B', fontWeight: '500' },
  yearTextSelected: { fontSize: 20, color: '#FFF', fontWeight: '700' },

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
