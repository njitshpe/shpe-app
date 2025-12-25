import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { makeRedirectUri } from 'expo-auth-session';

// Context Imports
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Brought in from V1

// Screen Imports
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen'; // Brought in from V1

// Optional: Keep this for debugging Auth setup
console.log('Redirect URI:', makeRedirectUri());

type AuthScreen = 'login' | 'signup';
type AppScreen = 'home' | 'profile';

function AppContent() {
  const { session, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [appScreen, setAppScreen] = useState<AppScreen>('home');

  // 1. Loading State
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D35400" />
      </View>
    );
  }

  // 2. Authenticated State (User is logged in)
  if (session) {
    if (appScreen === 'profile') {
      return <ProfileScreen onNavigateBack={() => setAppScreen('home')} />;
    }
    return <HomeScreen onNavigateToProfile={() => setAppScreen('profile')} />;
  }

  // 3. Unauthenticated State (User needs to log in)
  if (authScreen === 'login') {
    return <LoginScreen onNavigateToSignup={() => setAuthScreen('signup')} />;
  }

  return <SignupScreen onNavigateToLogin={() => setAuthScreen('login')} />;
}

export default function App() {
  return (
    // Wrap with AuthProvider first (usually needed for Notifications to know who the user is)
    <AuthProvider>
      <NotificationProvider>
        <StatusBar style="auto" />
        <AppContent />
      </NotificationProvider>
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