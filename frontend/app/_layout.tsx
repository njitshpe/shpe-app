import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useSegments, useRouter } from 'expo-router';

// Providers
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/shared';

// Services
import { eventNotificationHelper } from '@/services/eventNotification.helper';
import { notificationService } from '@/services/notification.service';

/**
 * Auth Guard Component
 * Handles redirects based on authentication state
 * AND manages notification subscriptions
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 1. NAVIGATION REDIRECTS
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const onboardingCompleted = user?.user_metadata?.onboarding_completed;

    if (!session && !inAuthGroup) {
      // Not logged in, redirect to login
      router.replace('/login');
    } else if (session && !onboardingCompleted && !inOnboarding) {
      // Logged in but onboarding not complete
      router.replace('/onboarding');
    } else if (session && onboardingCompleted && (inAuthGroup || inOnboarding)) {
      // Logged in and onboarded, but in auth/onboarding routes
      router.replace('/home');
    }
  }, [session, isLoading, segments, user]);

  // 2. NOTIFICATION SETUP
  useEffect(() => {
    if (!isLoading && session) {
      // --- USER IS LOGGED IN ---
      
      // A. Start the "Walkie-Talkie" (In-App updates via Supabase Realtime)
      eventNotificationHelper.startListening();

      // B. Save the "Address" (Push Token) to Supabase for background alerts
      notificationService.registerForPushNotificationsAsync();

    } else if (!session) {
      // --- USER LOGGED OUT ---
      eventNotificationHelper.stopListening();
    }

    // Cleanup when component unmounts
    return () => {
      eventNotificationHelper.stopListening();
    };
  }, [session, isLoading]);

  // Loading State
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' }}>
        <ActivityIndicator size="large" color="#D35400" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Root Layout
 * Wraps the app with all necessary providers
 * ThemeProvider is at the very top to prevent ErrorBoundary crashes
 */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <EventsProvider>
              <AuthGuard>
                <Slot />
              </AuthGuard>
            </EventsProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}