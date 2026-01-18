import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { EmailSignInSheet } from '@/components/EmailSignInSheet';
import { Toast } from '@/components/Toast';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { WelcomeCurtain } from '@/components/auth/WelcomeCurtain';
import { AuthBottomSheet } from '@/components/auth/AuthBottomSheet';
import { useAuth } from '@/contexts/AuthContext';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function WelcomeScreen() {
  const [isEmailSheetVisible, setEmailSheetVisible] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false);
  const [emailAuthError, setEmailAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });
  const { signInWithGoogle, signInWithApple, signIn, signUp, resetPassword } = useAuth();

  const showToast = (message: string, type: ToastState['type']) => {
    setToast({ visible: true, message, type });
  };

  const handleContinueWithPhone = () => {
    // TODO: Implement phone auth
    console.log('Continue with phone');
  };

  const handleContinueWithEmail = () => {
    setAuthMode('login');
    setShowAuthSheet(true);
  };

  const handleAppleLogin = async () => {
    try {
      const { error } = await signInWithApple();
      if (error) {
        Alert.alert('Apple Sign In Error', error.message);
      }
    } catch (err) {
      Alert.alert('Apple Sign In Error', 'An unexpected error occurred');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Google Sign In Error', error.message);
      }
    } catch (err) {
      Alert.alert('Google Sign In Error', 'An unexpected error occurred');
    }
  };

  const handleGuestLogin = () => {
    // TODO: Implement guest mode
    console.log('Guest login');
  };

  const handleEmailAuth = async ({
    email,
    password,
    confirmPassword,
    mode,
  }: {
    email: string;
    password: string;
    confirmPassword: string;
    mode: 'signIn' | 'signUp' | 'forgotPassword';
  }) => {
    setEmailAuthError(null);
    setIsEmailAuthLoading(true);
    try {
      if (mode === 'forgotPassword') {
        const { error } = await resetPassword(email);
        if (error) {
          setEmailAuthError(error.message);
          setIsEmailAuthLoading(false);
          return;
        }
        setIsEmailAuthLoading(false);
        showToast('Reset link sent to your email.', 'success');
        setEmailSheetVisible(false);
      } else if (mode === 'signUp') {
        if (password !== confirmPassword) {
          setEmailAuthError('Passwords do not match');
          setIsEmailAuthLoading(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          setEmailAuthError(error.message);
          setIsEmailAuthLoading(false);
          return;
        }
        setIsEmailAuthLoading(false);
        showToast('Account created! Check your email.', 'success');
        setEmailSheetVisible(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setEmailAuthError(error.message);
          setIsEmailAuthLoading(false);
          return;
        }
        setIsEmailAuthLoading(false);
        setEmailSheetVisible(false);
      }
    } catch (err) {
      setEmailAuthError('An unexpected error occurred');
      setIsEmailAuthLoading(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Base Layer - Login Screen (z-index 0) */}
        <LoginScreen
          onContinueWithPhone={handleContinueWithPhone}
          onContinueWithEmail={handleContinueWithEmail}
          onEmailLogin={() => setEmailSheetVisible(true)}
          onAppleLogin={handleAppleLogin}
          onGoogleLogin={handleGoogleLogin}
          onGuestLogin={handleGuestLogin}
        />

        {/* Top Layer - Welcome Curtain (slides up to reveal LoginScreen) */}
        <WelcomeCurtain />

        {/* Auth Bottom Sheet (for email/password entry) */}
        <AuthBottomSheet
          isOpen={showAuthSheet}
          onClose={() => setShowAuthSheet(false)}
          initialMode={authMode}
        />

        <EmailSignInSheet
          visible={isEmailSheetVisible}
          onClose={() => {
            setEmailSheetVisible(false);
            setEmailAuthError(null);
          }}
          onSubmit={handleEmailAuth}
          isLoading={isEmailAuthLoading}
          error={emailAuthError}
        />
      </View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
