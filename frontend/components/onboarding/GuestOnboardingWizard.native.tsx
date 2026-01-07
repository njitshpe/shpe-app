import { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile.service';
import { storageService } from '@/services/storage.service';
import BadgeUnlockOverlay from '../shared/BadgeUnlockOverlay';
import IdentityStep from './IdentityStep.native';
import GuestAffiliationStep from './GuestAffiliationStep.native';
import InterestsStep from './InterestsStep.native';

const CURRENT_YEAR = new Date().getFullYear();

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
    graduationYear: String(CURRENT_YEAR), // Dummy value for guests
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
    setCurrentStep((prev) => Math.min(prev + 1, 2)); // 3 steps (0-2)
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

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / 3) * 100;

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? '#001339' : '#F7FAFF',
    progressTrack: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(11, 22, 48, 0.12)',
    progressFill: isDark ? '#8B5CF6' : '#7C3AED', // Purple for guests
    text: isDark ? '#F5F8FF' : '#0B1630',
    textSecondary: isDark ? 'rgba(229, 239, 255, 0.75)' : 'rgba(22, 39, 74, 0.7)',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
            <MotiView
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: 'timing', duration: 300 }}
              style={[styles.progressFill, { backgroundColor: colors.progressFill }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Step {currentStep + 1} of 3
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
                <GuestAffiliationStep
                  data={{
                    university: formData.university,
                    major: formData.major,
                  }}
                  update={updateFormData}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  progressTrack: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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
