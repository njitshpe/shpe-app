import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmailSignInSheet } from '@/components/auth/EmailSignInSheet';
import { Toast } from '@/components/auth/Toast';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { WelcomeCurtain } from '@/components/auth/WelcomeCurtain';
import { AuthBottomSheet } from '@/components/auth/AuthBottomSheet';
import { GuestCheckInScanner } from '@/components/auth/GuestCheckInScanner';
import { useAuth } from '@/contexts/AuthContext';
import { PendingCheckInService, PendingCheckIn } from '@/services/pendingCheckIn.service';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function WelcomeScreen() {
  const router = useRouter();
  const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn | null>(null);
  const [pendingDeepLink, setPendingDeepLink] = useState<boolean>(false);
  const [isEmailSheetVisible, setEmailSheetVisible] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false);
  const [emailAuthError, setEmailAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });
  const { signInWithGoogle, signInWithApple, signIn, signUp, resetPassword } = useAuth();

  React.useEffect(() => {
    checkPendingStatus();
  }, []);

  const checkPendingStatus = async () => {
    const pending = await PendingCheckInService.get();
    setPendingCheckIn(pending);

    // Check for pending deep link
    const link = await AsyncStorage.getItem('pendingDeepLink');
    if (link && link.includes('/event/')) {
      setPendingDeepLink(true);
    }
  };

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

  const handleGuestScan = () => {
    setShowScanner(true);
  };

  const handleScanSuccess = (eventName: string) => {
    setShowScanner(false);
    checkPendingStatus(); // Refresh the pending check-in banner
    Alert.alert(
      'QR Code Saved! 🎟️',
      `Complete your sign-up now to confirm your check-in for ${eventName}.`
    );
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
          onGuestScan={handleGuestScan}
        />

        {/* Pending Check-In Banner */}
        {pendingCheckIn && (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>🎟️</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Check-in Pending</Text>
                <Text style={styles.bannerText}>
                  For: <Text style={styles.bannerHighlight}>{pendingCheckIn.eventName}</Text>
                </Text>
                <Text style={styles.bannerSubtext}>Sign in or sign up now to complete!</Text>
              </View>
            </View>
          </View>
        )}

        {/* Pending Deep Link Banner (only show if no pending check-in to avoid stacking) */}
        {pendingDeepLink && !pendingCheckIn && (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>📅</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Event Invitation</Text>
                <Text style={styles.bannerText}>
                  You've been invited to an event!
                </Text>
                <Text style={styles.bannerSubtext}>Sign in or sign up now to view details and RSVP.</Text>
              </View>
            </View>
          </View>
        )}

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

        {/* Guest Check-In Scanner Overlay */}
        <GuestCheckInScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
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
  bannerContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 100, // Above curtain
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  bannerText: {
    color: '#CCC',
    fontSize: 13,
  },
  bannerHighlight: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bannerSubtext: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
});
