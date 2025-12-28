// Add this temporarily
console.log("DEBUG: ENV LOADING CHECK:", process.env);

import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { makeRedirectUri } from 'expo-auth-session';

// Context Imports
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Component Imports
import { ErrorBoundary } from './components/ErrorBoundary';

// Screen Imports
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

// Debugging
console.log('Redirect URI:', makeRedirectUri());

// Types for local navigation state
type AuthScreen = 'login' | 'signup';
type AppScreen = 'home' | 'profile';

function AppContent() {
  const { session, user, profile, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [appScreen, setAppScreen] = useState<AppScreen>('home');
  const [autofillCredentials, setAutofillCredentials] = useState<{ email: string; password: string } | null>(null);

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
    // Check if onboarding is needed
    // We check user_metadata first to avoid unnecessary DB reads
    const onboardingCompleted = user?.user_metadata?.onboarding_completed;

    if (!onboardingCompleted) {
      const userType = user?.user_metadata?.user_type || 'other';
      return (
        <OnboardingScreen
          userType={userType}
          userId={user!.id}
          email={user!.email!}
        />
      );
    }

    if (appScreen === 'profile') {
      return <ProfileScreen onNavigateBack={() => setAppScreen('home')} />;
    }
    return <HomeScreen onNavigateToProfile={() => setAppScreen('profile')} />;
  }

  // 3. Unauthenticated State (User needs to log in)
  if (authScreen === 'login') {
    return (
      <LoginScreen
        onNavigateToSignup={() => setAuthScreen('signup')}
        autofillEmail={autofillCredentials?.email}
        autofillPassword={autofillCredentials?.password}
      />
    );
  }

  return (
    <SignupScreen
      onNavigateToLogin={(email?: string, password?: string) => {
        if (email && password) {
          setAutofillCredentials({ email, password });
        }
        setAuthScreen('login');
      }}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <StatusBar style="auto" />
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
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
