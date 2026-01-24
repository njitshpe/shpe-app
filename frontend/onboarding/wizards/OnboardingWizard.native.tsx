import { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, Keyboard } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profile.service';
import { storageService } from '@/services/storage.service';
import { PendingCheckInService } from '@/services/pendingCheckIn.service';
import { CheckInTokenService } from '@/services/checkInToken.service';
import { SHADOWS, SPACING, RADIUS } from '@/constants/colors';
import BadgeUnlockOverlay from '@/components/shared/BadgeUnlockOverlay';
import WizardLayout from '../components/WizardLayout.native';
import IdentityStep from '../screens/shared/IdentityStep.native';
import AcademicsStep from '../screens/student/AcademicsStep.native';
import InterestsStep from '../screens/shared/InterestsStep.native';
import BioStep from '../screens/student/BioStep.native';
import AssetsStep from '../screens/student/AssetsStep.native';
import ReviewStep from '../screens/student/ReviewStep.native';
import { InterestType } from '@/types/userProfile'; // Ensure this type is imported
import { supabase } from '@/lib/supabase';

const DEFAULT_GRAD_YEAR = String(new Date().getFullYear());

interface OnboardingFormData {
  firstName: string;
  lastName: string;
  ucid: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  interests: string[];
  phoneNumber: string;
  resumeFile: DocumentPicker.DocumentPickerAsset | null;
  resumeUrl?: string;
  resumeName?: string;
  linkedinUrl: string;
  portfolioUrl: string;
  bio: string;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, updateUserMetadata } = useAuth();
  const { theme } = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);

  const shouldSkipIdentity = !!(user?.user_metadata?.first_name && user?.user_metadata?.last_name);
  const [currentStep, setCurrentStep] = useState(shouldSkipIdentity ? 1 : 0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Saving...');
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    ucid: '',
    major: '',
    graduationYear: DEFAULT_GRAD_YEAR,
    profilePhoto: null,
    interests: [],
    phoneNumber: '',
    resumeFile: null,
    resumeUrl: undefined,
    resumeName: undefined,
    linkedinUrl: '',
    portfolioUrl: '',
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
      const fallback = userType === 'alumni' ? '/alumni-onboarding' : userType === 'guest' ? '/guest-onboarding' : '/role-selection';
      router.replace(fallback);
    }
  }, [user, router]);

  const updateFormData = (fields: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const TOTAL_STEPS = 6;

  const nextStep = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const prevStep = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleBack = async () => {
    if (currentStep === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Exit Setup?',
        'You need a profile to join events. Are you sure?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: async () => {
              await updateUserMetadata({ user_type: null });
              router.replace('/role-selection');
            }
          }
        ]
      );
    } else {
      prevStep();
    }
  };

  const hasFormData = () => {
    return formData.firstName.trim() !== '' || formData.lastName.trim() !== '';
  };

  const handleBadgeCelebrationComplete = () => {
    setShowBadgeCelebration(false);
    confettiRef.current?.start();
    // Navigate after a brief confetti shower
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1500);
  };

  const handleFinish = async () => {
    if (!user) return;

    setIsSaving(true);
    setLoadingMessage("Minting your SHPE ID...");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. UPLOADS (Parallel if possible, but sequential for progress feedback)
      let profilePictureUrl: string | undefined;
      let resumeUrl: string | undefined;
      let resumeName: string | undefined;

      if (formData.profilePhoto) {
        setLoadingMessage("Processing photo...");
        const uploadResult = await storageService.uploadProfilePhoto(user.id, formData.profilePhoto);
        if (uploadResult.success) profilePictureUrl = uploadResult.data.url;
      }

      if (formData.resumeFile) {
        setLoadingMessage("Securing resume...");
        const response = await fetch(formData.resumeFile.uri);
        const arrayBuffer = await response.arrayBuffer();
        const storagePath = `${user.id}/resume.pdf`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(storagePath, arrayBuffer, {
            contentType: formData.resumeFile.mimeType || 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        resumeUrl = storagePath;
        resumeName = formData.resumeFile.name;
        updateFormData({ resumeUrl, resumeName });
      }

      setLoadingMessage("Finalizing profile...");

      // 2. DATA PREP (Refactored: Direct mapping)
      const gradYearInt = parseInt(formData.graduationYear, 10);

      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        ucid: formData.ucid.trim().toLowerCase(),
        major: formData.major.trim(),
        graduation_year: isNaN(gradYearInt) ? new Date().getFullYear() + 4 : gradYearInt,
        university: 'NJIT',
        bio: formData.bio?.trim() || '',
        // REFACTORED: Pass interests directly as they match the DB enum now
        interests: formData.interests as InterestType[],
        linkedin_url: formData.linkedinUrl?.trim() || undefined,
        portfolio_url: formData.portfolioUrl?.trim() || undefined,
        phone_number: formData.phoneNumber?.trim() || undefined,
        profile_picture_url: profilePictureUrl,
        resume_url: resumeUrl,
        resume_name: resumeName,
        user_type: 'student' as const,
      };

      // 3. API CALL
      console.log('Submitting Profile Data:', JSON.stringify(profileData, null, 2));

      let result = await profileService.createProfile(user.id, profileData);

      // If create fails because profile already exists, try update (idempotency)
      if (!result.success && result.error?.code === 'ALREADY_EXISTS') {
        console.log('Profile exists, updating instead...', result.error);
        result = await profileService.updateProfile(user.id, profileData);
      }

      if (!result.success) {
        console.error('FINAL SAVE ERROR:', result.error);
        // Show user-friendly error message
        const errorMessage = result.error?.code === 'UNIQUE_VIOLATION'
          ? result.error.message
          : (result.error?.message || "Database save failed");
        throw new Error(errorMessage);
      }

      // 4. PRE-LOAD APP STATE & SUCCESS
      await updateUserMetadata({ onboarding_completed: true });

      // Process pending check-in
      const pending = await PendingCheckInService.get();
      if (pending) {
        setLoadingMessage(`Checking in to ${pending.eventName}...`);
        try {
          const result = await CheckInTokenService.validateCheckIn(pending.token);
          if (result.success) {
            // We can optionally show toast or alert here, or just let them find out on home screen
            // But explicit confirmation is better
            Alert.alert('Check-in Successful! 🎟️', `You are now checked in to ${pending.eventName}!`);
          } else {
            Alert.alert('Check-in Failed', result.error || 'Could not verify check-in.');
          }
        } catch (err) {
          console.error('Pending check-in failed', err);
        }
        await PendingCheckInService.clear();
      }

      setIsSaving(false);
      setShowBadgeCelebration(true);

    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setIsSaving(false);
      Alert.alert('Save Failed', error.message || 'Please check your internet and try again.');
    }
  };

  const transitionConfig = {
    from: { opacity: 0, scale: 0.98, translateX: 10 },
    animate: { opacity: 1, scale: 1, translateX: 0 },
    exit: { opacity: 0, scale: 0.98, translateX: -10 },
    transition: { type: 'timing' as const, duration: 300 },
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      onBack={handleBack}
      hasFormData={hasFormData()}
      showConfirmation={currentStep === 0}
      variant="student"
      progressType="segmented"
    >
      <View style={styles.stepsContainer}>
        <AnimatePresence>
          {currentStep === 0 && (
            <MotiView key="step-0" {...transitionConfig} style={styles.stepWrapper}>
              <IdentityStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}
          {currentStep === 1 && (
            <MotiView key="step-1" {...transitionConfig} style={styles.stepWrapper}>
              <AcademicsStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
                showUcid={true}
              />
            </MotiView>
          )}
          {currentStep === 2 && (
            <MotiView key="step-2" {...transitionConfig} style={styles.stepWrapper}>
              <InterestsStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}
          {currentStep === 3 && (
            <MotiView key="step-3" {...transitionConfig} style={styles.stepWrapper}>
              <BioStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}
          {currentStep === 4 && (
            <MotiView key="step-4" {...transitionConfig} style={styles.stepWrapper}>
              <AssetsStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}
          {currentStep === 5 && (
            <MotiView key="step-5" {...transitionConfig} style={styles.stepWrapper}>
              <ReviewStep
                data={formData}
                onNext={handleFinish}
              />
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* Loading Overlay (Dark Glass Theme) */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEmoji}>✨</Text>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <Text style={styles.loadingSubtext}>Do not close the app</Text>
          </View>
        </View>
      )}

      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
      />

      <BadgeUnlockOverlay
        visible={showBadgeCelebration}
        badgeType="student"
        onComplete={handleBadgeCelebrationComplete}
        autoCompleteDelay={0}
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
    position: 'absolute',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.85)', // Dark background
  },
  loadingCard: {
    borderRadius: RADIUS.xl,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1E293B', // Dark Slate
    minWidth: 250,
    ...SHADOWS.large,
  },
  loadingEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
