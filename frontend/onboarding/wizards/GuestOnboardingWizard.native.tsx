import { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile.service';
import { storageService } from '@/services/storage.service';
import BadgeUnlockOverlay from '@/components/shared/BadgeUnlockOverlay';
import WizardLayout from '../components/WizardLayout.native';
import IdentityStep from '../screens/shared/IdentityStep.native';
import GuestAffiliationStep from '../screens/guest/GuestAffiliationStep.native';
import InterestsStep from '../screens/shared/InterestsStep.native';
import GuestReviewStep from '../screens/guest/GuestReviewStep.native';

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_GRAD_YEAR = String(CURRENT_YEAR);

// Guest-specific FormData interface
interface GuestOnboardingFormData {
  // Step 1: Identity (reuse existing)
  firstName: string;
  lastName: string;
  major: string; // Will be used for "Role/Major" in affiliation
  graduationYear: string; // Not used for guests, but required by IdentityStep
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  // Step 2: Interests (reuse existing)
  interests: string[];
  phoneNumber: string;
  // Step 3: Affiliation (NEW)
  university: string;
}

export default function GuestOnboardingWizard() {
  const router = useRouter();
  const { user, updateUserMetadata, loadProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const confettiRef = useRef<ConfettiCannon>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [formData, setFormData] = useState<GuestOnboardingFormData>({
    // Step 1
    firstName: '',
    lastName: '',
    major: '', // Role/Major from affiliation step
    graduationYear: DEFAULT_GRAD_YEAR, // Dummy value for guests
    profilePhoto: null,
    // Step 2
    interests: [],
    phoneNumber: '',
    // Step 3
    university: '',
  });

  // Helper function to merge partial data into main state
  const updateFormData = (fields: Partial<GuestOnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  useEffect(() => {
    if (!user) return;
    const userType = user.user_metadata?.user_type;
    if (!userType) {
      router.replace('/role-selection');
      return;
    }
    if (userType !== 'guest') {
      const fallback =
        userType === 'student'
          ? '/onboarding'
          : userType === 'alumni'
            ? '/alumni-onboarding'
            : '/role-selection';
      router.replace(fallback);
    }
  }, [user, router]);

  // Navigation helpers
  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3)); // 4 steps (0-3)
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle back button press
  const handleBack = async () => {
    if (currentStep === 0) {
      // Exit to role selection (clear user_type first)
      try {
        await updateUserMetadata({ user_type: null });
        router.replace('/role-selection');
      } catch (error) {
        console.error('Failed to clear user type:', error);
        Alert.alert('Error', 'Unable to exit onboarding. Please try again.');
      }
    } else {
      // Go to previous step
      prevStep();
    }
  };

  // Check if user has entered any data
  const hasFormData = () => {
    return (
      formData.firstName.trim() !== '' ||
      formData.lastName.trim() !== '' ||
      formData.major.trim() !== '' ||
      (formData.graduationYear.trim() !== '' && formData.graduationYear !== DEFAULT_GRAD_YEAR) ||
      formData.profilePhoto !== null
    );
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

      // Upload profile photo if provided
      if (formData.profilePhoto) {
        const uploadResult = await storageService.uploadProfilePhoto(
          user.id,
          formData.profilePhoto
        );

        if (uploadResult.success) {
          profilePictureUrl = uploadResult.data.url;
        } else {
          Alert.alert(
            'Photo Upload Failed',
            'Your profile photo could not be uploaded. You can add it later in settings.',
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

      // Create profile data object for guest
      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        university: formData.university.trim(),
        major: formData.major?.trim() || undefined,
        expected_graduation_year: formData.graduationYear ? parseInt(formData.graduationYear, 10) : undefined,
        bio: '',
        interests: mappedInterests,
        phone_number: formData.phoneNumber?.trim() || undefined,
        profile_picture_url: profilePictureUrl,
        user_type: 'guest' as const,
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
      // This will trigger onAuthStateChange which will automatically load the profile
      await updateUserMetadata({ onboarding_completed: true });

      setIsSaving(false);

      // Show badge celebration
      setShowBadgeCelebration(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsSaving(false);
      Alert.alert('Unable to finish onboarding', 'Please try again.');
    }
  };

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? '#001339' : '#F7FAFF',
    text: isDark ? '#F5F8FF' : '#0B1630',
    textSecondary: isDark ? 'rgba(229, 239, 255, 0.75)' : 'rgba(22, 39, 74, 0.7)',
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={4}
      onBack={handleBack}
      hasFormData={hasFormData()}
      showConfirmation={currentStep === 0}
      variant="guest"
      progressType="segmented"
    >
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
                <GuestAffiliationStep
                  data={{
                    university: formData.university,
                    major: formData.major,
                  }}
                  update={updateFormData}
                  onNext={nextStep}
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
                <GuestReviewStep
                  data={{
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    major: formData.major,
                    university: formData.university,
                    profilePhoto: formData.profilePhoto,
                    interests: formData.interests,
                    phoneNumber: formData.phoneNumber,
                  }}
                  onNext={handleFinish}
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
          <View
            style={[
              styles.loadingCard,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Saving your profile...
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
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
        badgeType="guest"
        onComplete={handleBadgeCelebrationComplete}
        autoCompleteDelay={0} // Manual completion only
      />
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
  },
});
