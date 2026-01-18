import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { WelcomeCurtain } from '@/components/auth/WelcomeCurtain';
import { AuthBottomSheet } from '@/components/auth/AuthBottomSheet';

export default function WelcomeScreen() {
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleContinueWithPhone = () => {
    // TODO: Implement phone auth
    console.log('Continue with phone');
  };

  const handleContinueWithEmail = () => {
    setAuthMode('login');
    setShowAuthSheet(true);
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple auth
    console.log('Apple login');
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google auth
    console.log('Google login');
  };

  const handleGuestLogin = () => {
    // TODO: Implement guest mode
    console.log('Guest login');
  };

  return (
    <View style={styles.container}>
      {/* Base Layer - Login Screen (z-index 0) */}
      <LoginScreen
        onContinueWithPhone={handleContinueWithPhone}
        onContinueWithEmail={handleContinueWithEmail}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
