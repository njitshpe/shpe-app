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
import { SHADOWS, RADIUS } from '@/constants/colors';
import { InterestType } from '@/types/userProfile';
import WizardLayout from '../components/WizardLayout.native';

// Screens
import IdentityStep from '../screens/shared/IdentityStep.native';
import GuestAffiliationStep from '../screens/guest/GuestAffiliationStep.native'; // NEW
import GuestIntentStep from '../screens/guest/GuestIntentStep.native';
import GuestReviewStep from '../screens/guest/GuestReviewStep.native';

interface GuestFormData {
  firstName: string;
  lastName: string;
  university: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  intent: string;
}

export default function GuestOnboardingWizard() {
  const router = useRouter();
  const { user, updateUserMetadata } = useAuth();
  const confettiRef = useRef<ConfettiCannon>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating Guest Pass...');

  const [formData, setFormData] = useState<GuestFormData>({
    firstName: '',
    lastName: '',
    university: '',
    major: '',
    graduationYear: new Date().getFullYear().toString(),
    profilePhoto: null,
    intent: '',
  });

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.user_type !== 'guest') {
      router.replace('/role-selection');
    }
  }, [user, router]);

  const updateFormData = (fields: Partial<GuestFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const TOTAL_STEPS = 4; // Increased to 4

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
        'You need a profile to continue.',
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

  const handleFinish = async () => {
    if (!user) return;

    setIsSaving(true);
    setLoadingMessage("Generating Guest ID...");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let profilePictureUrl: string | undefined;
      
      if (formData.profilePhoto) {
        setLoadingMessage("Uploading photo...");
        const uploadResult = await storageService.uploadProfilePhoto(user.id, formData.profilePhoto);
        if (uploadResult.success) profilePictureUrl = uploadResult.data.url;
      }

      setLoadingMessage("Finalizing...");

      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        university: formData.university.trim(),
        major: formData.major.trim(),
        graduation_year: parseInt(formData.graduationYear, 10) || 0,
        interests: [formData.intent] as InterestType[],
        profile_picture_url: profilePictureUrl,
        user_type: 'guest' as const,
        bio: `Guest: ${formData.intent}`,
      };

      // Single clean call using upsert
      const result = await profileService.createProfile(user.id, profileData);

      if (!result.success) {
        console.error('GUEST SAVE ERROR:', result.error);
        setIsSaving(false);

        // Handle unique constraint errors with user-friendly messages
        if (result.error?.code === 'UNIQUE_VIOLATION') {
          Alert.alert('Profile Conflict', result.error.message);
          return;
        }

        Alert.alert('Save Failed', result.error?.message || 'Database save failed');
        return;
      }

      await updateUserMetadata({ onboarding_completed: true });

      setIsSaving(false);
      confettiRef.current?.start();

      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1500);

    } catch (error: any) {
      console.error('Error completing guest onboarding:', error);
      setIsSaving(false);
      Alert.alert('Error', error.message || 'Save failed.');
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
      hasFormData={true}
      showConfirmation={currentStep === 0}
      variant="guest"
      progressType="segmented"
    >
      <View style={styles.stepsContainer}>
        <AnimatePresence>
          
          {/* Step 0: Identity */}
          {currentStep === 0 && (
            <MotiView key="step-0" {...transitionConfig} style={styles.stepWrapper}>
              <IdentityStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 1: Affiliation (NEW) */}
          {currentStep === 1 && (
            <MotiView key="step-1" {...transitionConfig} style={styles.stepWrapper}>
              <GuestAffiliationStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 2: Intent */}
          {currentStep === 2 && (
            <MotiView key="step-2" {...transitionConfig} style={styles.stepWrapper}>
              <GuestIntentStep
                data={formData}
                update={updateFormData}
                onNext={nextStep}
              />
            </MotiView>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <MotiView key="step-3" {...transitionConfig} style={styles.stepWrapper}>
              <GuestReviewStep
                data={formData}
                onNext={handleFinish}
              />
            </MotiView>
          )}

        </AnimatePresence>
      </View>

      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEmoji}>🎟️</Text>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
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
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
  stepsContainer: { flex: 1, width: '100%' },
  stepWrapper: { flex: 1, width: '100%', position: 'absolute' },
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
  loadingEmoji: { fontSize: 40, marginBottom: 16 },
  loadingText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});