import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  useColorScheme,
} from 'react-native';
import { MotiView } from 'moti';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';

const MAJORS = [
  'Mechanical Engineering',
  'Computer Science',
  'Civil Engineering',
  'Biomedical Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Industrial Engineering',
  'Computer Engineering',
  'Information Systems',
  'Data Science',
  'Business Administration',
  'Architecture',
  'Mathematics',
  'Other',
];

const identitySchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  major: z.string().optional(),
  graduationYear: z
    .string()
    .optional()
    .refine(
      (year) => {
        if (!year) return true; // Optional field
        const numYear = parseInt(year, 10);
        return numYear >= 1980 && numYear <= 2030;
      },
      { message: 'Graduation year must be between 1980 and 2030' }
    ),
});

export interface FormData {
  firstName: string;
  lastName: string;
  major: string;
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

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const majorRef = useRef<TextInput>(null);
  const graduationYearRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [majorQuery, setMajorQuery] = useState(data.major ?? '');
  const [isMajorOpen, setIsMajorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-focus first input on mount
    setTimeout(() => firstNameRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    setMajorQuery(data.major ?? '');
  }, [data.major]);

  const filteredMajors = useMemo(() => {
    const query = majorQuery.trim().toLowerCase();
    if (!query) {
      return MAJORS;
    }
    return MAJORS.filter((major) => major.toLowerCase().includes(query));
  }, [majorQuery]);

  const handleMajorChange = (value: string) => {
    setMajorQuery(value);
    const matchedMajor = MAJORS.find(
      (major) => major.toLowerCase() === value.trim().toLowerCase()
    );
    update({ major: matchedMajor ?? value });
    setError(null);
  };

  const handleMajorSelect = (major: string) => {
    setMajorQuery(major);
    update({ major });
    setIsMajorOpen(false);
    setError(null);
    Keyboard.dismiss();
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
      major: data.major?.trim(),
      graduationYear: data.graduationYear?.trim(),
    };

    const result = identitySchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please complete required fields.');
      return;
    }

    update(payload);
    setError(null);
    onNext();
  };

  const isNextDisabled =
    !data.firstName?.trim() ||
    !data.lastName?.trim();

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? '#001339' : '#F7FAFF',
    surface: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)',
    text: isDark ? '#F5F8FF' : '#0B1630',
    textSecondary: isDark ? 'rgba(229, 239, 255, 0.75)' : 'rgba(22, 39, 74, 0.7)',
    border: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(11, 22, 48, 0.12)',
    borderGlow: isDark ? '#14B8A6' : '#0D9488',
    primary: '#0D9488',
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
              returnKeyType="next"
              onSubmitEditing={() => majorRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Major Input (Optional) */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            Major <Text style={[styles.optional, { color: colors.textSecondary }]}>(optional)</Text>
          </Text>
          <TextInput
            ref={majorRef}
            value={majorQuery}
            onChangeText={handleMajorChange}
            onFocus={() => {
              setIsMajorOpen(true);
              scrollToBottom();
            }}
            onBlur={() => setTimeout(() => setIsMajorOpen(false), 150)}
            placeholder="What did you study?"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            returnKeyType="done"
          />
          {isMajorOpen && (
            <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.borderGlow }]}>
              <ScrollView
                style={styles.dropdownScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {filteredMajors.length === 0 ? (
                  <Text style={[styles.dropdownEmpty, { color: colors.textSecondary }]}>No matches found.</Text>
                ) : (
                  filteredMajors.map((major) => (
                    <TouchableOpacity
                      key={major}
                      onPress={() => handleMajorSelect(major)}
                      style={[
                        styles.dropdownItem,
                        data.major === major && styles.dropdownItemSelected,
                      ]}
                    >
                      <MotiView
                        from={{ opacity: 0.5, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 150 }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: colors.text },
                            data.major === major && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {major}
                        </Text>
                      </MotiView>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Graduation Year (Optional) */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            Graduation Year <Text style={[styles.optional, { color: colors.textSecondary }]}>(optional)</Text>
          </Text>
          <TextInput
            ref={graduationYearRef}
            value={data.graduationYear ?? ''}
            onChangeText={(text) => {
              // Only allow numbers, max 4 digits
              const cleaned = text.replace(/\D/g, '').slice(0, 4);
              update({ graduationYear: cleaned });
              setError(null);
            }}
            onFocus={scrollToBottom}
            placeholder="e.g., 2015"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={4}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Year you graduated from NJIT
          </Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={isNextDisabled}
          style={[styles.nextButton, { backgroundColor: colors.primary }, isNextDisabled && styles.nextButtonDisabled]}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  optional: {
    fontWeight: '400',
    fontSize: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    maxHeight: 192,
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 192,
  },
  dropdownEmpty: {
    padding: 12,
    fontSize: 14,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemSelected: {
    backgroundColor: '#D1FAE5',
  },
  dropdownItemText: {
    fontSize: 14,
  },
  dropdownItemTextSelected: {
    color: '#065F46',
  },
  nextButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
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
