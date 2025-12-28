import React, { useState } from 'react';
import { View, ActivityIndicator, Button, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';

// 1. IMPORT PROVIDERS
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { EventsProvider } from '../context/EventsContext'; 
import { ErrorBoundary } from '../components/ErrorBoundary';

// 2. IMPORT SUPABASE (For the temporary logout button)
import { supabase } from '../lib/supabase';

// 3. IMPORT SCREENS
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

// ----------------------------------------------------------------------
// COMPONENT: The Navigation Logic
// ----------------------------------------------------------------------
function RootLayoutNav() {
  const { session, isLoading, user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // A. Loading State
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D35400" />
      </View>
    );
  }

  // B. Not Logged In? -> Show Login or Signup
  if (!session) {
    if (authMode === 'login') {
      return <LoginScreen onNavigateToSignup={() => setAuthMode('signup')} />;
    } else {
      return <SignupScreen onNavigateToLogin={() => setAuthMode('login')} />;
    }
  }

  // C. Logged In? -> Check Onboarding Status
  // We check the metadata attached to the user account
  const onboardingCompleted = user?.user_metadata?.onboarding_completed;

  if (!onboardingCompleted) {
     return (
        <OnboardingScreen 
           // We use || "" to prevent crashes if these are temporarily null
           userType={user?.user_metadata?.user_type || 'student'}
           userId={user?.id || ""}
           email={user?.email || ""}
        />
     );
  }

  // D. Onboarding Done? -> Show the Main App (Calendar/Tabs)
  return (
    <EventsProvider>
      {/* --- TEMPORARY DEBUG BUTTON: DELETE THIS VIEW AFTER FIXING --- */}
      <SafeAreaView style={{ backgroundColor: 'red' }}>
        <Button 
          title="⚠️ DEBUG: FORCE LOGOUT (Reset Ghost User)" 
          color="white"
          onPress={async () => {
             console.log("Force logging out...");
             await supabase.auth.signOut();
          }} 
        />
      </SafeAreaView>
      {/* ------------------------------------------------------------- */}

      <Stack>
        {/* 'index' redirects to your (tabs) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* Main Tabs (Calendar lives here) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Event Details Page */}
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        
        {/* Event Form Modal */}
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
// ROOT WRAPPER
// ----------------------------------------------------------------------
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <RootLayoutNav />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}