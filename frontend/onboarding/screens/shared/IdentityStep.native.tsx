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
  Image,
  Alert,
  useColorScheme,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchableSelectionModal from '../../components/SearchableSelectionModal';
import { NJIT_MAJORS } from '@/constants/majors';
import { UNIVERSITIES } from '@/constants/universities';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS } from '@/constants/colors';
import { useProfilePhoto } from '@/hooks/media/useProfilePhoto';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_GRAD_YEAR = CURRENT_YEAR + 8;
const YEAR_ITEM_HEIGHT = 36;
const YEAR_WHEEL_VISIBLE_ITEMS = 3;

const getIdentitySchema = (options: { isGuestMode: boolean }) => {
  const majorSchema = options.isGuestMode
    ? z.string().trim().min(2, 'Major is required')
    : z
        .string()
        .trim()
        .refine((value) => NJIT_MAJORS.includes(value as any), {
          message: 'Select a major from the list',
        });

  const shape: Record<string, z.ZodTypeAny> = {
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    major: majorSchema,
    graduationYear: z
      .string()
      .trim()
      .regex(/^\d{4}$/, 'Graduation year must be 4 digits')
      .refine(
        (year) => {
          const numYear = parseInt(year, 10);
          return numYear >= CURRENT_YEAR && numYear <= MAX_GRAD_YEAR;
        },
        { message: `Graduation year must be between ${CURRENT_YEAR} and ${MAX_GRAD_YEAR}` }
      ),
    // Base schema doesn't strictly require UCID yet, we refine it conditionally
    ucid: z.string().optional(),
  };

  if (options.isGuestMode) {
    shape.university = z.string().trim().min(2, 'University or organization is required');
  }

  return z.object(shape);
};

export interface FormData {
  firstName: string;
  lastName: string;
  university?: string;
  ucid?: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
}

interface IdentityStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
  showUcid?: boolean;
  isGuestMode?: boolean;
}

export default function IdentityStep({
  data,
  update,
  onNext,
  showUcid = false,
  isGuestMode = false,
}: IdentityStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const ucidRef = useRef<TextInput>(null);
  const majorRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isMajorModalVisible, setIsMajorModalVisible] = useState(false);
  const [isUniversityModalVisible, setIsUniversityModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableYears = Array.from(
    { length: MAX_GRAD_YEAR - CURRENT_YEAR + 1 },
    (_, index) => String(CURRENT_YEAR + index)
  );

  const scrollToYear = (index: number, animated = false) => {
    yearScrollRef.current?.scrollTo({
      y: index * YEAR_ITEM_HEIGHT,
      animated,
    });
  };

  const handleYearScrollEnd = (offsetY: number) => {
    // Clear any pending scroll updates to prevent glitches during fast scrolling
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Debounce the year update to ensure smooth scrolling
    scrollTimeout.current = setTimeout(() => {
      const index = Math.round(offsetY / YEAR_ITEM_HEIGHT);
      const selectedYear = availableYears[index];
      if (selectedYear && selectedYear !== data.graduationYear) {
        update({ graduationYear: selectedYear });
        setError(null);
      }
    }, 50);
  };

  useEffect(() => {
    // Auto-focus first input on mount
    setTimeout(() => firstNameRef.current?.focus(), 100);

    // Cleanup timeout on unmount
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!data.graduationYear || !availableYears.includes(data.graduationYear)) {
      update({ graduationYear: availableYears[0] });
      return;
    }

    const selectedIndex = availableYears.indexOf(data.graduationYear);
    if (selectedIndex >= 0) {
      setTimeout(() => scrollToYear(selectedIndex, false), 0);
    }
  }, [availableYears, data.graduationYear, update]);

  const { pickPhoto } = useProfilePhoto();

  const handleMajorSelect = (major: string) => {
    update({ major });
    setError(null);
  };

  const handleUniversitySelect = (university: string) => {
    update({ university });
    setError(null);
  };

  const handlePhotoOptions = () => {
    pickPhoto((uri) => {
      // Create a minimal asset object since the hook provides the URI
      // In a real app we might want to get dimensions etc but URI is enough for now
      update({
        profilePhoto: {
          uri,
          width: 500,
          height: 500,
          type: 'image',
          fileName: 'profile.jpg',
        } as ImagePicker.ImagePickerAsset
      });
    });
  };

  const handleNext = () => {
    const payload: Record<string, any> = {
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      ucid: data.ucid?.trim() ?? '',
      major: data.major?.trim() ?? '',
      graduationYear: data.graduationYear?.trim() ?? '',
    };

    // 1. Basic Schema Check
    if (isGuestMode) {
      payload.university = data.university?.trim() ?? '';
    }

    const result = getIdentitySchema({ isGuestMode }).safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please complete all fields.');
      return;
    }

    // 2. Conditional UCID Check
    if (showUcid) {
      const ucid = payload.ucid;
      // UCID Regex: Alphanumeric, at least 2 chars. Not strictly forcing 4 digits anymore.
      // e.g., "abc", "abc1234", "a1" are valid. "a" is too short.
      const ucidRegex = /^[a-zA-Z0-9]{2,}$/;
      if (!ucid || !ucidRegex.test(ucid)) {
        setError('Please enter a valid UCID (e.g., abc1234).');
        return;
      }

      // Limit to 5 numbers max
      const digitCount = (ucid.match(/\d/g) || []).length;
      if (digitCount > 5) {
        setError('UCID cannot have more than 5 numbers.');
        return;
      }
    }

    update(payload);
    setError(null);
    onNext();
  };

  const isNextDisabled =
    !data.firstName?.trim() ||
    !data.lastName?.trim() ||
    (showUcid && !data.ucid?.trim()) ||
    (isGuestMode && !data.university?.trim()) ||
    !data.major?.trim() ||
    !data.graduationYear?.trim();

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? '#001339' : '#F7FAFF',
    surface: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)',
    text: isDark ? '#F5F8FF' : '#0B1630',
    textSecondary: isDark ? 'rgba(229, 239, 255, 0.75)' : 'rgba(22, 39, 74, 0.7)',
    border: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(11, 22, 48, 0.12)',
    borderGlow: SHPE_COLORS.accentBlueBright,
    primary: SHPE_COLORS.accentBlueBright,
    error: '#DC2626',
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
            {/* Profile Photo Picker */}
            <View style={styles.photoContainer}>
              <TouchableOpacity onPress={handlePhotoOptions} style={styles.photoButton}>
                {data.profilePhoto ? (
                  <Image source={{ uri: data.profilePhoto.uri }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.photoPlaceholder, { borderColor: colors.borderGlow, backgroundColor: colors.surface }]}>
                    <Text style={styles.photoIcon}>📸</Text>
                    <Text style={[styles.photoText, { color: colors.textSecondary }]}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Let's get you set up.</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tell us a bit about yourself.</Text>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Name Inputs */}
            <View style={styles.nameRow}>
              <View style={styles.nameInputContainer}>
                <TextInput
                  ref={firstNameRef}
                  value={data.firstName ?? ''}
                  onChangeText={(text) => {
                    update({ firstName: text });
                    setError(null);
                  }}
                  placeholder="First Name"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.nameInputContainer}>
                <TextInput
                  ref={lastNameRef}
                  value={data.lastName ?? ''}
                  onChangeText={(text) => {
                    update({ lastName: text });
                    setError(null);
                  }}
                  placeholder="Last Name"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (showUcid) {
                      ucidRef.current?.focus();
                      return;
                    }
                    if (isGuestMode) {
                      majorRef.current?.focus();
                    }
                  }}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* University/Organization (Guest) */}
            {isGuestMode && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: colors.text }]}>University or Organization</Text>
                <TouchableOpacity
                  onPress={() => setIsUniversityModalVisible(true)}
                  style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text
                    style={[
                      styles.selectInputText,
                      { color: data.university ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {data.university || 'Select university or organization'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* University Selection Modal */}
            {isGuestMode && (
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
            )}

            {/* UCID Input */}
            {showUcid && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: colors.text }]}>NJIT UCID</Text>
                <TextInput
                  ref={ucidRef}
                  value={data.ucid ?? ''}
                  onChangeText={(text) => {
                    update({ ucid: text.toLowerCase() });
                    setError(null);
                  }}
                  placeholder="e.g. abc1234"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Your UCID (not your ID number)
                </Text>
              </View>
            )}

            {/* Major Selection */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Major</Text>
              {isGuestMode ? (
                <TextInput
                  ref={majorRef}
                  value={data.major ?? ''}
                  onChangeText={(text) => {
                    update({ major: text });
                    setError(null);
                  }}
                  placeholder="e.g., Computer Science"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                  ]}
                  returnKeyType="done"
                />
              ) : (
                <TouchableOpacity
                  onPress={() => setIsMajorModalVisible(true)}
                  style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text
                    style={[
                      styles.selectInputText,
                      { color: data.major ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {data.major || 'Select your major'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Major Selection Modal */}
            {!isGuestMode && (
              <SearchableSelectionModal
                visible={isMajorModalVisible}
                onClose={() => setIsMajorModalVisible(false)}
                onSelect={handleMajorSelect}
                options={NJIT_MAJORS}
                selectedValue={data.major}
                title="Select Your Major"
                placeholder="Search majors (e.g., Comp Sci)"
                emptyMessage="No majors found"
              />
            )}

            {/* Graduation Year */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Graduation Year</Text>
              <View style={[styles.yearWheel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScrollView
                  ref={yearScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={YEAR_ITEM_HEIGHT}
                  decelerationRate="fast"
                  contentContainerStyle={{
                    paddingVertical: YEAR_ITEM_HEIGHT * ((YEAR_WHEEL_VISIBLE_ITEMS - 1) / 2),
                  }}
                  onMomentumScrollEnd={(event) => handleYearScrollEnd(event.nativeEvent.contentOffset.y)}
                  onScrollEndDrag={(event) => handleYearScrollEnd(event.nativeEvent.contentOffset.y)}
                  nestedScrollEnabled
                >
                  {availableYears.map((item) => {
                    const isSelected = item === data.graduationYear;
                    return (
                      <View key={item} style={styles.yearItem}>
                        <Text
                          style={[
                            styles.yearText,
                            { color: isSelected ? colors.text : colors.textSecondary },
                            isSelected && styles.yearTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <View pointerEvents="none" style={styles.yearHighlight} />
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
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    width: 120,
    height: 120,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: SHPE_COLORS.accentBlueBright,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  photoText: {
    fontSize: 12,
    fontWeight: '500',
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  nameInputContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 0,
    borderBottomWidth: 0,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
    borderBottomWidth: 0,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
  },
  yearWheel: {
    borderWidth: 0,
    borderBottomWidth: 0,
    borderRadius: RADIUS.md,
    height: YEAR_ITEM_HEIGHT * YEAR_WHEEL_VISIBLE_ITEMS,
    overflow: 'hidden',
  },
  yearItem: {
    height: YEAR_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 18,
    fontWeight: '500',
  },
  yearTextSelected: {
    fontSize: 20,
    fontWeight: '700',
  },
  yearHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (YEAR_ITEM_HEIGHT * (YEAR_WHEEL_VISIBLE_ITEMS - 1)) / 2,
    height: YEAR_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(127, 179, 255, 0.4)',
    backgroundColor: 'rgba(127, 179, 255, 0.08)',
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
