import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';

// 1. IMPORT YOUR PROVIDERS
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { EventsProvider } from '../context/EventsContext'; // The new calendar context
import { ErrorBoundary } from '../components/ErrorBoundary';

// 2. IMPORT YOUR SCREENS
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

// ----------------------------------------------------------------------
// COMPONENT 1: The "Guard"
// This decides: Show Login Screen OR Show the App (Calendar/Tabs)
// ----------------------------------------------------------------------
function RootLayoutNav() {
  const { session, isLoading, user } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // A. Loading State
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D35400" />
      </View>
    );
  }

  // B. Not Logged In? -> Show Login/Signup Flow
  if (!session) {
    if (authMode === 'login') {
      return (
        <LoginScreen
          onNavigateToSignup={() => setAuthMode('signup')}
        />
      );
    } else {
      return (
        <SignupScreen
          onNavigateToLogin={() => setAuthMode('login')}
        />
      );
    }
  }

  // C. Logged In? -> Check Onboarding
  const onboardingCompleted = user?.user_metadata?.onboarding_completed;
  if (!onboardingCompleted) {
     return (
        <OnboardingScreen 
           userType={user?.user_metadata?.user_type || 'student'}
           // Add || "" to provide a fallback just in case
           userId={user?.id || ""}
           email={user?.email || ""}
        />
     );
  }

  // D. Everything Good? -> RENDER THE APP (The "Stack")
  return (
    <EventsProvider>
      <Stack>
        {/* 'index' usually redirects to the calendar */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* Your main tabs (where the calendar lives) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Specific Event Pages */}
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="(modals)/event-form"
          options={{
            presentation: 'modal',
            title: 'Event Form',
            headerStyle: { backgroundColor: '#111827' },
            headerTintColor: '#F9FAFB',
          }}
        />
      </Stack>
    </EventsProvider>
  );
}

// ----------------------------------------------------------------------
// COMPONENT 2: The Root Wrapper
// Wraps the entire app in Providers
// ----------------------------------------------------------------------
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          {/* We call the Nav component INSIDE the providers */}
          <RootLayoutNav />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}