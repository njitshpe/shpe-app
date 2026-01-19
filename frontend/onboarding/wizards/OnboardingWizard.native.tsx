import { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, Keyboard } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics'; // <--- NEW: Tactile feedback
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profile.service';
import { storageService } from '@/services/storage.service';
import { SHADOWS, SHPE_COLORS } from '@/constants/colors';
import BadgeUnlockOverlay from '@/components/shared/BadgeUnlockOverlay';
import WizardLayout from '../components/WizardLayout.native';
import IdentityStep from '../screens/shared/IdentityStep.native';
import AcademicsStep from '../screens/student/AcademicsStep.native';
import InterestsStep from '../screens/shared/InterestsStep.native';
import BioStep from '../screens/student/BioStep.native';
import AssetsStep from '../screens/student/AssetsStep.native';
import ReviewStep from '../screens/student/ReviewStep.native';

const DEFAULT_GRAD_YEAR = String(new Date().getFullYear());

// Master FormData interface
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
  linkedinUrl: string;
  portfolioUrl: string;
  bio: string;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, updateUserMetadata } = useAuth();
  const { theme, isDark } = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // NEW: Dynamic loading messages to build value
  const [loadingMessage, setLoadingMessage] = useState('Saving...'); 
  
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
    ucid: '',
    major: '',
    graduationYear: DEFAULT_GRAD_YEAR,
    profilePhoto: null,
    interests: [],
    phoneNumber: '',
    resumeFile: null,
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

  // --- NAVIGATION HELPERS ---
  // Total steps: 0=Identity, 1=Academics, 2=Interests, 3=Bio, 4=Assets, 5=Review
  const TOTAL_STEPS = 6;

  const nextStep = () => {
    Keyboard.dismiss(); // Clean up UI
    Haptics.selectionAsync(); // Tactile confirmation
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
    return (
      formData.firstName.trim() !== '' ||
      formData.lastName.trim() !== '' ||
      formData.ucid.trim() !== ''
    );
  };

  const handleBadgeCelebrationComplete = () => {
    setShowBadgeCelebration(false);
    confettiRef.current?.start();
    // Delay navigation slightly to let confetti fall
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2500);
  };

  // --- THE "SMART" SAVE PROCESS ---
  const handleFinish = async () => {
    if (!user) return;

    setIsSaving(true);
    setLoadingMessage("Minting your SHPE ID..."); // Step 1: Ego
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Artificial delay for psychology (800ms)
      await new Promise(r => setTimeout(r, 800));

      let profilePictureUrl: string | undefined;
      let resumeUrl: string | undefined;
      let resumeName: string | undefined;

      // Upload Photo
      if (formData.profilePhoto) {
        setLoadingMessage("Processing photo...");
        const uploadResult = await storageService.uploadProfilePhoto(user.id, formData.profilePhoto);
        if (uploadResult.success) profilePictureUrl = uploadResult.data.url;
      }

      // Upload Resume
      if (formData.resumeFile) {
        setLoadingMessage("Securing resume..."); // Step 2: Security
        const uploadResult = await storageService.uploadResume(user.id, formData.resumeFile);
        if (uploadResult.success) {
          resumeUrl = uploadResult.data.url;
          resumeName = uploadResult.data.originalName;
        }
      }

      setLoadingMessage("Finalizing profile..."); // Step 3: Completion

      // Map Interests
      const interestMap: Record<string, any> = {
        'internships': 'career', 'scholarships': 'career', 'resume-help': 'career',
        'mental-health': 'workshops', 'networking': 'networking', 'leadership': 'workshops',
        'career-fairs': 'career', 'community-service': 'volunteering',
      };
      const mappedInterests = formData.interests.map(id => interestMap[id]).filter((val, idx, arr) => arr.indexOf(val) === idx);

      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        ucid: formData.ucid.trim().toLowerCase(),
        major: formData.major.trim(),
        graduation_year: parseInt(formData.graduationYear, 10),
        university: 'NJIT',
        bio: formData.bio?.trim() || '',
        interests: mappedInterests,
        linkedin_url: formData.linkedinUrl?.trim() || undefined,
        portfolio_url: formData.portfolioUrl?.trim() || undefined,
        phone_number: formData.phoneNumber?.trim() || undefined,
        profile_picture_url: profilePictureUrl,
        resume_url: resumeUrl,
        resume_name: resumeName,
        user_type: 'student' as const,
      };

      let result = await profileService.createProfile(user.id, profileData);
      if (!result.success) result = await profileService.updateProfile(user.id, profileData);

      if (!result.success) throw new Error(result.error?.message);

      await updateUserMetadata({ onboarding_completed: true });

      setIsSaving(false);
      setShowBadgeCelebration(true); // Trigger the "Award" moment
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsSaving(false);
      Alert.alert('Save Failed', 'Please try again.');
    }
  };

  // --- TRANSITION CONFIG ---
  // A "Stacking" transition feels more premium than a simple slide
  const transitionConfig = {
    from: { opacity: 0, scale: 0.95, translateX: 20 },
    animate: { opacity: 1, scale: 1, translateX: 0 },
    exit: { opacity: 0, scale: 0.95, translateX: -20 },
    transition: { type: 'timing' as const, duration: 350 },
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
        {/* Remove exitBeforeEnter for a faster, snappier feel */}
        <AnimatePresence>
          {/* Step 0: Identity (Name/Photo) */}
          {currentStep === 0 && (
            <MotiView key="step-0" {...transitionConfig} style={styles.stepWrapper}>
              <IdentityStep
                data={{
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  profilePhoto: formData.profilePhoto,
                }}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 1: Academics (Major/Year/UCID) */}
          {currentStep === 1 && (
            <MotiView key="step-1" {...transitionConfig} style={styles.stepWrapper}>
              <AcademicsStep
                data={{
                  major: formData.major,
                  graduationYear: formData.graduationYear,
                  ucid: formData.ucid,
                }}
                update={updateFormData}
                onNext={nextStep}
                showUcid={true}
              />
            </MotiView>
          )}

          {/* Step 2: Interests */}
          {currentStep === 2 && (
            <MotiView key="step-2" {...transitionConfig} style={styles.stepWrapper}>
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

          {/* Step 3: Bio/Pitch */}
          {currentStep === 3 && (
            <MotiView key="step-3" {...transitionConfig} style={styles.stepWrapper}>
              <BioStep
                data={{
                  bio: formData.bio,
                }}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 4: Assets (Resume/Links) */}
          {currentStep === 4 && (
            <MotiView key="step-4" {...transitionConfig} style={styles.stepWrapper}>
              <AssetsStep
                data={{
                  resumeFile: formData.resumeFile,
                  linkedinUrl: formData.linkedinUrl,
                  portfolioUrl: formData.portfolioUrl,
                }}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 5: Review */}
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

      {/* ENHANCED LOADING OVERLAY */}
      {isSaving && (
        <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
          <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Simple Pulse Animation can be added here later */}
            <Text style={[styles.loadingEmoji]}>✨</Text>
            <Text style={[styles.loadingText, { color: theme.text }]}>
              {loadingMessage}
            </Text>
            <Text style={[styles.loadingSubtext, { color: theme.subtext }]}>
              Do not close the app
            </Text>
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
    position: 'absolute', // Allows cross-fading without layout jumps
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 250,
    ...SHADOWS.large,
  },
  loadingEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
});