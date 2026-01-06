import { useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile.service';
import { storageService } from '@/services/storage.service';
import BadgeUnlockOverlay from '../shared/BadgeUnlockOverlay';
import AlumniIdentityStep from './AlumniIdentityStep.native';
import AlumniProfessionalStep from './AlumniProfessionalStep.native';
import AssetsStep from './AssetsStep.native';
import ReviewStep from './ReviewStep.native';

// Alumni-specific FormData interface
interface AlumniOnboardingFormData {
  // Step 1: Identity
  firstName: string;
  lastName: string;
  graduationYear: string;
  major: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  // Step 2: Professional Info
  company: string;
  jobTitle: string;
  industry: string;
  phoneNumber: string;
  // Step 3: Assets
  resumeFile: DocumentPicker.DocumentPickerAsset | null;
  linkedinUrl: string;
  bio: string;
  // Step 4: Review (uses all above data)
  interests: string[];
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
    // Step 1
    firstName: '',
    lastName: '',
    graduationYear: '',
    major: '',
    profilePhoto: null,
    // Step 2
    company: '',
    jobTitle: '',
    industry: '',
    phoneNumber: '',
    // Step 3
    resumeFile: null,
    linkedinUrl: '',
    bio: '',
    // Default
    interests: [],
  });

  // Helper function to merge partial data into main state
  const updateFormData = (fields: Partial<AlumniOnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // Navigation helpers
  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3)); // 4 steps (0-3)
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
          Alert.alert(
            'Resume Upload Failed',
            'Your resume could not be uploaded. You can add it later in settings.',
            [{ text: 'OK' }]
          );
        }
      }

      // Create profile data object for alumni
      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        major: formData.major.trim() || undefined,
        expected_graduation_year: formData.graduationYear ? parseInt(formData.graduationYear, 10) : undefined,
        university: 'NJIT', // Default university for NJIT alumni
        bio: formData.bio?.trim() || '',
        company: formData.company?.trim() || undefined,
        job_title: formData.jobTitle?.trim() || undefined,
        industry: formData.industry?.trim() || undefined,
        linkedin_url: formData.linkedinUrl?.trim() || undefined,
        phone_number: formData.phoneNumber?.trim() || undefined,
        profile_picture_url: profilePictureUrl,
        resume_url: resumeUrl,
        resume_name: resumeName,
        user_type: 'alumni' as const,
        interests: formData.interests,
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
  const progressPercentage = ((currentStep + 1) / 4) * 100;

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    progressTrack: isDark ? '#1E293B' : '#F3F4F6',
    progressFill: '#0D9488', // Teal for alumni
    text: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#94A3B8' : '#6B7280',
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
                <AlumniIdentityStep
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
                <AlumniProfessionalStep
                  data={{
                    company: formData.company,
                    jobTitle: formData.jobTitle,
                    industry: formData.industry,
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
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
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
