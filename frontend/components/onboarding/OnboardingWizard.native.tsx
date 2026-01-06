import { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AnimatePresence, MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profile.service';
import { storageService } from '@/services/storage.service';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS } from '@/constants/colors';
import BadgeUnlockOverlay from '../shared/BadgeUnlockOverlay';
import IdentityStep from './IdentityStep.native';
import InterestsStep from './InterestsStep.native';
import AssetsStep from './AssetsStep.native';
import ReviewStep from './ReviewStep.native';

// Master FormData interface combining all step fields
interface OnboardingFormData {
  // Step 1: Identity
  firstName: string;
  lastName: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  // Step 2: Interests + Phone
  interests: string[];
  phoneNumber: string;
  // Step 3: Assets
  resumeFile: DocumentPicker.DocumentPickerAsset | null;
  linkedinUrl: string;
  bio: string;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, updateUserMetadata, loadProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    // Step 1
    firstName: '',
    lastName: '',
    major: '',
    graduationYear: '',
    profilePhoto: null,
    // Step 2
    interests: [],
    phoneNumber: '',
    // Step 3
    resumeFile: null,
    linkedinUrl: '',
    bio: '',
  });

  useEffect(() => {
    if (!user) return;
    const userType = user.user_metadata?.user_type;
    if (!userType) {
      router.replace('/role-selection');
      return;
    }
    if (userType !== 'student') {
      const fallback =
        userType === 'alumni'
          ? '/alumni-onboarding'
          : userType === 'guest'
            ? '/guest-onboarding'
            : '/role-selection';
      router.replace(fallback);
    }
  }, [user, router]);

  // Helper function to merge partial data into main state
  const updateFormData = (fields: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // Navigation helpers
  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3)); // 4 steps now (0-3)
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle badge celebration completion
  const handleBadgeCelebrationComplete = () => {
    setShowBadgeCelebration(false);
    // Fire confetti
    confettiRef.current?.start();
    // Redirect to dashboard/home
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1500);
  };

  // Handle wizard completion
  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Error', 'No user found. Please sign in again.');
      return;
    }

    setIsSaving(true);

    try {
      let profilePictureUrl: string | undefined;
      let resumeUrl: string | undefined;
      let resumeName: string | undefined;

      // Upload profile photo if provided
      if (formData.profilePhoto) {
        const uploadResult = await storageService.uploadProfilePhoto(
          user.id,
          formData.profilePhoto
        );

        if (uploadResult.success) {
          profilePictureUrl = uploadResult.data.url;
        } else {
          // Show warning but continue
          Alert.alert(
            'Photo Upload Failed',
            'Your profile photo could not be uploaded. You can add it later in settings.',
            [{ text: 'OK' }]
          );
        }
      }

      // Upload resume if provided
      if (formData.resumeFile) {
        const uploadResult = await storageService.uploadResume(
          user.id,
          formData.resumeFile
        );

        if (uploadResult.success) {
          resumeUrl = uploadResult.data.url;
          resumeName = uploadResult.data.originalName;
        } else {
          // Show warning but continue
          Alert.alert(
            'Resume Upload Failed',
            'Your resume could not be uploaded. You can add it later in settings.',
            [{ text: 'OK' }]
          );
        }
      }

      // Map interests from IDs to the format expected by the database
      const interestMap: Record<string, any> = {
        'internships': 'career',
        'scholarships': 'career',
        'resume-help': 'career',
        'mental-health': 'workshops',
        'networking': 'networking',
        'leadership': 'workshops',
        'career-fairs': 'career',
        'community-service': 'volunteering',
      };

      const mappedInterests = formData.interests
        .map(id => interestMap[id])
        .filter((val, idx, arr) => arr.indexOf(val) === idx); // Remove duplicates

      // Create profile data object
      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        major: formData.major.trim(),
        expected_graduation_year: parseInt(formData.graduationYear, 10),
        university: 'NJIT', // Default university for NJIT students
        bio: formData.bio?.trim() || '',
        interests: mappedInterests,
        linkedin_url: formData.linkedinUrl?.trim() || undefined,
        phone_number: formData.phoneNumber?.trim() || undefined,
        profile_picture_url: profilePictureUrl,
        resume_url: resumeUrl,
        resume_name: resumeName,
        user_type: 'student' as const,
      };

      // Try to create the profile (will fail if exists, then we update)
      let result = await profileService.createProfile(user.id, profileData);

      if (!result.success) {
        // Profile might already exist, try updating instead
        result = await profileService.updateProfile(user.id, profileData);
      }

      if (!result.success) {
        console.error('Profile save error:', result.error);
        Alert.alert('Error', 'Failed to save profile. Please try again.');
        setIsSaving(false);
        return;
      }

      // Mark onboarding as complete in user metadata
      await updateUserMetadata({ onboarding_completed: true });

      // Reload the profile to update context (important for Traffic Cop)
      if (user?.id) {
        await loadProfile(user.id);
      }

      setIsSaving(false);

      // Show badge celebration
      setShowBadgeCelebration(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsSaving(false);
      Alert.alert('Unable to finish onboarding', 'Please try again.');
    }
  };

  const backgroundGradient = isDark ? GRADIENTS.darkBackground : GRADIENTS.lightBackground;

  return (
    <LinearGradient
      colors={backgroundGradient}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.container}>
          {/* Segmented Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.segmentedProgress}>
              {[0, 1, 2, 3].map((index) => (
                <MotiView
                  key={index}
                  animate={{
                    backgroundColor: index <= currentStep
                      ? SHPE_COLORS.accentBlueBright
                      : isDark
                        ? 'rgba(255, 255, 255, 0.2)'
                        : theme.border,
                  }}
                  transition={{ type: 'timing', duration: 400 }}
                  style={styles.progressSegment}
                />
              ))}
            </View>
            <Text style={[styles.progressText, { color: theme.subtext }]}>
              Step {currentStep + 1} of 4
            </Text>
          </View>

        {/* Step Rendering with AnimatePresence */}
        <View style={styles.stepsContainer}>
          <AnimatePresence exitBeforeEnter>
            {currentStep === 0 && (
              <MotiView
                key="step-0"
                from={{ translateX: 50, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ translateX: -50, opacity: 0 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.stepWrapper}
              >
                <IdentityStep
                  data={{
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    major: formData.major,
                    graduationYear: formData.graduationYear,
                    profilePhoto: formData.profilePhoto,
                  }}
                  update={updateFormData}
                  onNext={nextStep}
                />
              </MotiView>
            )}

            {currentStep === 1 && (
              <MotiView
                key="step-1"
                from={{ translateX: 50, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ translateX: -50, opacity: 0 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.stepWrapper}
              >
                <InterestsStep
                  data={{
                    interests: formData.interests,
                    phoneNumber: formData.phoneNumber,
                  }}
                  update={updateFormData}
                  onNext={nextStep}
                  onBack={prevStep}
                />
              </MotiView>
            )}

            {currentStep === 2 && (
              <MotiView
                key="step-2"
                from={{ translateX: 50, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ translateX: -50, opacity: 0 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.stepWrapper}
              >
                <AssetsStep
                  data={{
                    resumeFile: formData.resumeFile,
                    linkedinUrl: formData.linkedinUrl,
                    bio: formData.bio,
                  }}
                  update={updateFormData}
                  onNext={nextStep}
                  onBack={prevStep}
                />
              </MotiView>
            )}

            {currentStep === 3 && (
              <MotiView
                key="step-3"
                from={{ translateX: 50, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ translateX: -50, opacity: 0 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.stepWrapper}
              >
                <ReviewStep
                  data={formData}
                  onNext={handleFinish}
                  onBack={prevStep}
                />
              </MotiView>
            )}
          </AnimatePresence>
        </View>

        {/* Loading Overlay */}
        {isSaving && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: isDark ? 'rgba(0, 5, 18, 0.6)' : 'rgba(11, 22, 48, 0.2)' },
            ]}
          >
            <View style={[styles.loadingCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Saving your profile...
              </Text>
              <Text style={[styles.loadingSubtext, { color: theme.subtext }]}>
                This may take a moment
              </Text>
            </View>
          </View>
        )}

        {/* Confetti Cannon */}
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
        />

        {/* Badge Unlock Celebration */}
        <BadgeUnlockOverlay
          visible={showBadgeCelebration}
          badgeType="student"
          onComplete={handleBadgeCelebrationComplete}
          autoCompleteDelay={0} // Manual completion only
        />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  segmentedProgress: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  stepsContainer: {
    flex: 1,
    width: '100%',
  },
  stepWrapper: {
    flex: 1,
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  loadingSubtext: {
    fontSize: 14,
  },
});
