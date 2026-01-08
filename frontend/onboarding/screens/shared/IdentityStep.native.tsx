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
import SearchableSelectionModal from './SearchableSelectionModal';
import { NJIT_MAJORS } from '@/constants/majors';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS } from '@/constants/colors';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_GRAD_YEAR = CURRENT_YEAR + 8;
const YEAR_ITEM_HEIGHT = 36;
const YEAR_WHEEL_VISIBLE_ITEMS = 3;

const identitySchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  major: z
    .string()
    .trim()
    .refine(
      (value) =>
        NJIT_MAJORS.includes(value as any),
      { message: 'Select a major from the list' }
    ),
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
});

export interface FormData {
  firstName: string;
  lastName: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
}

interface IdentityStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

export default function IdentityStep({ data, update, onNext }: IdentityStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isMajorModalVisible, setIsMajorModalVisible] = useState(false);
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

  const handleMajorSelect = (major: string) => {
    update({ major });
    setError(null);
  };

  const handlePickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to select a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        update({ profilePhoto: result.assets[0] });
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        update({ profilePhoto: result.assets[0] });
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickProfilePhoto },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleNext = () => {
    const payload = {
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      major: data.major?.trim() ?? '',
      graduationYear: data.graduationYear?.trim() ?? '',
    };

    const result = identitySchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please complete all fields.');
      return;
    }

    update(payload);
    setError(null);
    onNext();
  };

  const isNextDisabled =
    !data.firstName?.trim() ||
    !data.lastName?.trim() ||
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
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Major Selection */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Major</Text>
              <TouchableOpacity
                onPress={() => setIsMajorModalVisible(true)}
                style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.selectInputText, { color: data.major ? colors.text : colors.textSecondary }]}>
                  {data.major || 'Select your major'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Major Selection Modal */}
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
    borderBottomWidth: 1,
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
    borderBottomWidth: 1,
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
    borderBottomWidth: 1,
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
    ...SHADOWS.accentGlow,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
