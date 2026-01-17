import { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile.service';
import { storageService } from '@/services/storage.service';
import BadgeUnlockOverlay from '@/components/shared/BadgeUnlockOverlay';
import WizardLayout from '../components/WizardLayout.native';
import AlumniIdentityStep from '../screens/alumni/AlumniIdentityStep.native';
import AlumniSocialStep from '../screens/alumni/AlumniSocialStep.native';
import AlumniProfessionalStep from '../screens/alumni/AlumniProfessionalStep.native';
import AlumniReviewStep from '../screens/alumni/AlumniReviewStep.native';

// Alumni-specific FormData interface
interface AlumniOnboardingFormData {
  // Step 1: Identity
  firstName: string;
  lastName: string;
  major: string;
  customMajor?: string;
  degreeType: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  // Step 2: Social & Professional Snapshot
  linkedinUrl: string;
  professionalBio: string;
  // Step 3: Professional Details
  company: string;
  jobTitle: string;
  industry: string;
  mentorshipAvailable: boolean;
  mentorshipWays: string[];
  // Step 4: Review (uses all above data)
}

export default function AlumniOnboardingWizard() {
  const router = useRouter();
  const { user, updateUserMetadata, loadProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const confettiRef = useRef<ConfettiCannon>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [formData, setFormData] = useState<AlumniOnboardingFormData>({
    // Step 1: Identity
    firstName: '',
    lastName: '',
    major: '',
    customMajor: '',
    degreeType: '',
    graduationYear: '',
    profilePhoto: null,
    // Step 2: Social & Professional Snapshot
    linkedinUrl: '',
    professionalBio: '',
    // Step 3: Professional Details
    company: '',
    jobTitle: '',
    industry: '',
    mentorshipAvailable: false,
    mentorshipWays: [],
  });

  // Helper function to merge partial data into main state
  const updateFormData = (fields: Partial<AlumniOnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  useEffect(() => {
    if (!user) return;
    const userType = user.user_metadata?.user_type;
    if (!userType) {
      router.replace('/role-selection');
      return;
    }
    if (userType !== 'alumni') {
      const fallback =
        userType === 'student'
          ? '/onboarding'
          : userType === 'guest'
            ? '/guest-onboarding'
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
      formData.graduationYear.trim() !== '' ||
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

      // Create profile data object for alumni
      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        major: formData.major.trim() || undefined,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear, 10) : undefined,
        university: 'NJIT', // Default university for NJIT alumni
        degree_type: formData.degreeType.trim() || undefined,
        company: formData.company?.trim() || undefined,
        job_title: formData.jobTitle?.trim() || undefined,
        industry: formData.industry?.trim() || undefined,
        linkedin_url: formData.linkedinUrl?.trim() || undefined,
        bio: formData.professionalBio?.trim() || undefined,
        mentorship_available: formData.mentorshipAvailable || false,
        mentorship_ways: formData.mentorshipWays || [],
        profile_picture_url: profilePictureUrl,
        user_type: 'alumni' as const,
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
      variant="alumni"
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
                <AlumniIdentityStep
                  data={{
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    major: formData.major,
                    customMajor: formData.customMajor,
                    degreeType: formData.degreeType,
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
                <AlumniSocialStep
                  data={{
                    linkedinUrl: formData.linkedinUrl,
                    professionalBio: formData.professionalBio,
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
                <AlumniProfessionalStep
                  data={{
                    company: formData.company,
                    jobTitle: formData.jobTitle,
                    industry: formData.industry,
                    mentorshipAvailable: formData.mentorshipAvailable,
                    mentorshipWays: formData.mentorshipWays,
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
                <AlumniReviewStep
                  data={formData}
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
        badgeType="alumni"
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
