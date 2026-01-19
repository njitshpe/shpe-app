import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  useWindowDimensions,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPACING, RADIUS } from '@/constants/colors';
import { useProfilePhoto } from '@/hooks/media/useProfilePhoto';

// --- SCHEMAS (Unchanged) ---
const studentIdentitySchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
});

const getGuestIdentitySchema = () => {
  return z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    university: z.string().trim().min(2, 'University is required'),
    major: z.string().trim().min(2, 'Major is required'),
    graduationYear: z.string().trim().regex(/^\d{4}$/),
  });
};

export interface FormData {
  firstName: string;
  lastName: string;
  university?: string;
  ucid?: string;
  major?: string;
  graduationYear?: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
}

interface IdentityStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
  isGuestMode?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENT: Styled Input (White/Grey Accent)
// ─────────────────────────────────────────────────────────────────────────────
const StyledInput = ({ icon, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={[
      inputStyles.container,
      isFocused && inputStyles.focused,
      props.error && inputStyles.error
    ]}>
      {/* Icon Box: Turns White with Black Icon on Focus */}
      <View style={[inputStyles.iconContainer, isFocused && { backgroundColor: '#FFFFFF' }]}>
        <Ionicons 
          name={icon} 
          size={18} 
          color={isFocused ? '#000000' : '#94A3B8'} 
        />
      </View>
      <TextInput
        {...props}
        style={[inputStyles.input, props.style]}
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        onFocus={(e) => {
          setIsFocused(true);
          Haptics.selectionAsync();
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function IdentityStep({
  data,
  update,
  onNext,
  isGuestMode = false,
}: IdentityStepProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  const keyboardOpen = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      () => { keyboardOpen.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }); }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', 
      () => { keyboardOpen.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }); }
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ANIMATIONS
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(keyboardOpen.value, [0, 1], [1, 0.7]) }],
    opacity: interpolate(keyboardOpen.value, [0, 1], [1, 0.8]),
    marginTop: interpolate(keyboardOpen.value, [0, 1], [windowHeight * 0.1, windowHeight * 0.05]),
  }));

  const { pickPhoto } = useProfilePhoto();

  const handlePhotoOptions = () => {
    pickPhoto((uri) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      update({
        profilePhoto: { uri, width: 500, height: 500, type: 'image', fileName: 'profile.jpg' } as ImagePicker.ImagePickerAsset
      });
    });
  };

  const handleNext = () => {
    if (isNavigating) return;

    const schema = isGuestMode ? getGuestIdentitySchema() : studentIdentitySchema;
    const result = schema.safeParse(data);

    if (!result.success) {
      setError(result.error.issues[0]?.message || 'Please fill in all fields.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();

    // Safety release in case component doesn't unmount immediately
    setTimeout(() => setIsNavigating(false), 2000);
  };

  const isNextDisabled = !data.firstName?.trim() || !data.lastName?.trim();

  return (
    <View style={styles.outerContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* HEADER */}
          <MotiView 
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.headerContainer}
          >
            <Text style={styles.headerTitle}>
              {isGuestMode ? 'Welcome Guest' : 'Who are you?'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Let's get your profile set up.
            </Text>
          </MotiView>

          {/* AVATAR CENTERPIECE */}
          <Animated.View style={[styles.avatarContainer, avatarStyle]}>
            <TouchableOpacity onPress={handlePhotoOptions} activeOpacity={0.8}>
              <View style={[styles.avatarCircle, data.profilePhoto && styles.avatarFilled]}>
                {data.profilePhoto ? (
                  <Image source={{ uri: data.profilePhoto.uri }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.avatarGradient}
                  >
                    <Ionicons name="camera" size={40} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </LinearGradient>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={12} color="#000" />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* INPUTS */}
          <View style={styles.formContainer}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>FIRST NAME</Text>
                <StyledInput
                  ref={firstNameRef}
                  icon="person"
                  value={data.firstName}
                  onChangeText={(t: string) => { update({ firstName: t }); setError(null); }}
                  placeholder="First"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>LAST NAME</Text>
                <StyledInput
                  ref={lastNameRef}
                  icon="person"
                  value={data.lastName}
                  onChangeText={(t: string) => { update({ lastName: t }); setError(null); }}
                  placeholder="Last"
                  returnKeyType="done"
                  onSubmitEditing={() => !isNextDisabled && handleNext()}
                />
              </View>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <MotiView 
          from={{ translateY: 50, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={isNextDisabled || isNavigating}
            activeOpacity={0.8}
            style={[styles.button, (isNextDisabled || isNavigating) && styles.buttonDisabled]}
          >
            <LinearGradient
              // NEW: White Gradient for Active, Dark Grey for Disabled
              colors={isNextDisabled ? ['#333333', '#1A1A1A'] : ['#FFFFFF', '#E2E8F0']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.buttonText, isNextDisabled && { color: '#666666' }]}>
                Next Step
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={isNextDisabled ? '#666666' : '#000000'} // Black arrow on white button
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
  keyboardView: { flex: 1 },
  content: { flex: 1, alignItems: 'center' },
  
  headerContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },

  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarFilled: {
    borderColor: '#FFFFFF', // White border when filled
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  editBadge: {
    position: 'absolute',
    bottom: 8,
    right: 20,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF', // White badge
    borderRadius: 12,
    padding: 4,
  },

  formContainer: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  row: { flexDirection: 'row', gap: SPACING.md },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8', // Grey label
    marginBottom: 8,
    letterSpacing: 1,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontSize: 13,
  },

  footer: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  button: {
    borderRadius: RADIUS.full,
    shadowColor: '#FFFFFF', // White glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
    color: '#000000', // Black text
    letterSpacing: 0.5,
  },
});

const inputStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
    height: 56,
    overflow: 'hidden',
  },
  focused: {
    borderColor: '#FFFFFF', // White border on focus
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  error: { borderColor: '#FF6B6B' },
  iconContainer: {
    width: 40,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: '100%',
    paddingHorizontal: 12,
    fontWeight: '500',
  },
});