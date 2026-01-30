import { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, Keyboard } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
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

// --- SCREENS ---
import IdentityStep from '../screens/shared/IdentityStep.native'; // Re-used!
import AlumniAcademicsStep from '../screens/alumni/AlumniAcademicsStep.native';
import AlumniProfessionalStep from '../screens/alumni/AlumniProfessionalStep.native';
import AlumniImpactStep from '../screens/alumni/AlumniImpactStep.native';
import AlumniReviewStep from '../screens/alumni/AlumniReviewStep.native';

const DEFAULT_GRAD_YEAR = String(new Date().getFullYear() - 1); // Default to last year

interface AlumniFormData {
  firstName: string;
  lastName: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  // Academics
  major: string;
  degreeType: string; // 'BS', 'MS', 'PhD', etc.
  graduationYear: string;
  // Professional
  company: string;
  jobTitle: string;
  industry: string;
  linkedinUrl: string;
  // Impact
  bio: string;
  isMentor: boolean;
  mentorshipWays: string[];
}

export default function AlumniOnboardingWizard() {
  const router = useRouter();
  const { user, updateUserMetadata } = useAuth();
  const { theme } = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);

  const shouldSkipIdentity = !!(user?.user_metadata?.first_name && user?.user_metadata?.last_name);
  const [currentStep, setCurrentStep] = useState(shouldSkipIdentity ? 1 : 0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finalizing...');
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  const [formData, setFormData] = useState<AlumniFormData>({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    profilePhoto: null,
    major: '',
    degreeType: 'BS',
    graduationYear: DEFAULT_GRAD_YEAR,
    company: '',
    jobTitle: '',
    industry: '',
    linkedinUrl: '',
    bio: '',
    isMentor: false,
    mentorshipWays: [],
  });

  useEffect(() => {
    if (!user) return;
    // Security check: Ensure user is actually an alumni
    if (user.user_metadata?.user_type !== 'alumni') {
      router.replace('/role-selection');
    }
  }, [user, router]);

  const updateFormData = (fields: Partial<AlumniFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const TOTAL_STEPS = 5; // 0, 1, 2, 3, 4

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
        'Your profile will not be saved.',
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

  const hasFormData = () => formData.firstName.trim() !== '' || formData.lastName.trim() !== '';

  const handleBadgeCelebrationComplete = () => {
    setShowBadgeCelebration(false);
    confettiRef.current?.start();
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1500);
  };

  const handleFinish = async () => {
    if (!user) return;

    setIsSaving(true);
    setLoadingMessage("Verifying Alumni Status...");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. Upload Photo
      let profilePictureUrl: string | undefined;
      if (formData.profilePhoto) {
        setLoadingMessage("Processing photo...");
        const uploadResult = await storageService.uploadProfilePhoto(user.id, formData.profilePhoto);
        if (uploadResult.success) profilePictureUrl = uploadResult.data.url;
      }

      setLoadingMessage("Creating Professional ID...");

      // 2. Prepare Data
      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),

        // Alumni Specifics
        university: 'NJIT',
        major: formData.major.trim(),
        degree_type: formData.degreeType,
        graduation_year: parseInt(formData.graduationYear, 10),

        company: formData.company.trim(),
        job_title: formData.jobTitle.trim(),
        industry: formData.industry.trim(),
        linkedin_url: formData.linkedinUrl?.trim() || undefined,

        bio: formData.bio?.trim() || '',
        mentorship_available: formData.isMentor,
        mentorship_ways: formData.isMentor ? formData.mentorshipWays : [],

        profile_picture_url: profilePictureUrl,
        user_type: 'alumni' as const,
        interests: [], // Alumni might not select student interests, or we add a step later
      };

      // 3. API Call (Single clean call using upsert)
      console.log('Submitting Alumni Data:', JSON.stringify(profileData, null, 2));
      const result = await profileService.createProfile(user.id, profileData);

      if (!result.success) {
        console.error('ALUMNI SAVE ERROR:', result.error);
        setIsSaving(false);

        // Handle unique constraint errors with user-friendly messages
        if (result.error?.code === 'UNIQUE_VIOLATION') {
          Alert.alert('Profile Conflict', result.error.message);
          return;
        }

        Alert.alert('Save Failed', result.error?.message || 'Database save failed');
        return;
      }

      // 4. Success
      // 4. Success
      await updateUserMetadata({ onboarding_completed: true });

      // Process pending check-in
      const pending = await PendingCheckInService.get();
      if (pending) {
        setLoadingMessage(`Checking in to ${pending.eventName}...`);
        try {
          const result = await CheckInTokenService.validateCheckIn(pending.token);
          if (result.success) {
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
      setShowBadgeCelebration(true); // Triggers "Alumni" Badge

    } catch (error: any) {
      console.error('Error completing alumni onboarding:', error);
      setIsSaving(false);
      Alert.alert('Save Failed', error.message || 'Please check your connection.');
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
      variant="alumni"
      progressType="segmented"
    >
      <View style={styles.stepsContainer}>
        <AnimatePresence>

          {/* Step 0: Identity (Shared with Student) */}
          {currentStep === 0 && (
            <MotiView key="step-0" {...transitionConfig} style={styles.stepWrapper}>
              <IdentityStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 1: Legacy (Academics) */}
          {currentStep === 1 && (
            <MotiView key="step-1" {...transitionConfig} style={styles.stepWrapper}>
              <AlumniAcademicsStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 2: Professional (Company/Role) */}
          {currentStep === 2 && (
            <MotiView key="step-2" {...transitionConfig} style={styles.stepWrapper}>
              <AlumniProfessionalStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 3: Impact (Bio & Mentorship) */}
          {currentStep === 3 && (
            <MotiView key="step-3" {...transitionConfig} style={styles.stepWrapper}>
              <AlumniImpactStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <MotiView key="step-4" {...transitionConfig} style={styles.stepWrapper}>
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
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEmoji}>🎓</Text>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <Text style={styles.loadingSubtext}>Welcome back to the family.</Text>
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
        badgeType="alumni"
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
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  loadingCard: {
    borderRadius: RADIUS.xl,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1E293B',
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
