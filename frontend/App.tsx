import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { HomeScreen } from './screens/HomeScreen';

type AuthScreen = 'login' | 'signup';

function AppContent() {
  const { session, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D35400" />
      </View>
    );
  }

  // User is logged in
  if (session) {
    return <HomeScreen />;
  }

  // User is not logged in - show auth screens
  if (authScreen === 'login') {
    return <LoginScreen onNavigateToSignup={() => setAuthScreen('signup')} />;
  }

  return <SignupScreen onNavigateToLogin={() => setAuthScreen('login')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
