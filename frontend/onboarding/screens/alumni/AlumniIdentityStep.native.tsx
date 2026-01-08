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
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS } from '@/constants/colors';

const DEGREE_TYPES = ['B.S.', 'M.S.', 'Ph.D.'] as const;

const majorOptions = [...NJIT_MAJORS, 'Other'];

const identitySchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  major: z.string().trim().min(1, 'Major is required'),
  customMajor: z.string().optional(),
  degreeType: z.string().trim().min(1, 'Degree type is required'),
  graduationYear: z
    .string()
    .trim()
    .min(1, 'Graduation year is required')
    .regex(/^\d{4}$/, 'Graduation year must be 4 digits')
    .refine(
      (year) => {
        const numYear = parseInt(year, 10);
        return numYear >= 1980 && numYear <= 2030;
      },
      { message: 'Graduation year must be between 1980 and 2030' }
    ),
}).refine(
  (data) => {
    // If "Other" is selected, customMajor must be provided
    if (data.major === 'Other') {
      return !!data.customMajor?.trim();
    }
    return true;
  },
  {
    message: 'Please specify your major',
    path: ['customMajor'],
  }
);

export interface FormData {
  firstName: string;
  lastName: string;
  major: string;
  customMajor?: string;
  degreeType: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
}

interface AlumniIdentityStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

export default function AlumniIdentityStep({ data, update, onNext }: AlumniIdentityStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const graduationYearRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isMajorModalVisible, setIsMajorModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-focus first input on mount
    setTimeout(() => firstNameRef.current?.focus(), 100);
  }, []);

  const handleMajorSelect = (major: string) => {
    update({ major });
    setError(null);
    // Clear customMajor if user switches away from "Other"
    if (major !== 'Other') {
      update({ customMajor: '' });
    }
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
      customMajor: data.customMajor?.trim() ?? '',
      degreeType: data.degreeType?.trim() ?? '',
      graduationYear: data.graduationYear?.trim() ?? '',
    };

    const result = identitySchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please complete all required fields.');
      return;
    }

    // If "Other" is selected, use the custom major value
    const finalMajor = payload.major === 'Other' ? payload.customMajor : payload.major;
    update({ ...payload, major: finalMajor });
    setError(null);
    onNext();
  };

  const isNextDisabled =
    !data.firstName?.trim() ||
    !data.lastName?.trim() ||
    !data.major?.trim() ||
    (data.major === 'Other' && !data.customMajor?.trim()) ||
    !data.degreeType?.trim() ||
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
              <Image source={{ uri: data.profilePhoto.uri }} style={[styles.profileImage, { borderColor: colors.borderGlow }]} />
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
          <Text style={[styles.title, { color: colors.text }]}>Welcome back, Alumni!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Let's get your profile set up.</Text>
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
          options={majorOptions}
          selectedValue={data.major}
          title="Select Your Major"
          placeholder="Search majors (e.g., Comp Sci)"
          emptyMessage="No majors found"
        />

        {/* Custom Major Input - Show if "Other" is selected */}
        {data.major === 'Other' && (
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Specify Your Major</Text>
            <TextInput
              value={data.customMajor ?? ''}
              onChangeText={(text) => {
                update({ customMajor: text });
                setError(null);
              }}
              placeholder="Enter your major"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              returnKeyType="done"
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Please enter the name of your major
            </Text>
          </View>
        )}

        {/* Degree Type Selection */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Degree Type</Text>
          <View style={styles.pillsContainer}>
            {DEGREE_TYPES.map((degree) => {
              const isSelected = data.degreeType === degree;
              return (
                <TouchableOpacity
                  key={degree}
                  onPress={() => {
                    update({ degreeType: degree });
                    setError(null);
                  }}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: colors.text },
                      isSelected && styles.pillTextActive,
                    ]}
                  >
                    {degree}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Graduation Year (Required) */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Graduation Year</Text>
          <TextInput
            ref={graduationYearRef}
            value={data.graduationYear ?? ''}
            onChangeText={(text) => {
              // Only allow numbers, max 4 digits
              const cleaned = text.replace(/\D/g, '').slice(0, 4);
              update({ graduationYear: cleaned });
              setError(null);
            }}
            placeholder="e.g., 2015"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={4}
          />
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 15,
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
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
