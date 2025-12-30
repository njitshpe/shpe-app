import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useSegments, useRouter } from 'expo-router';

// Providers
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { EventsProvider } from '../contexts/EventsContext';
import { ErrorBoundary } from '../components/shared';

/**
 * Auth Guard Component
 * Handles redirects based on authentication state
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
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

  // Loading State
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#D35400" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Root Layout
 * Wraps the app with all necessary providers
 * EventsProvider is at the top level so it's always available
 */
export default function RootLayout() {
  return (
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
  );
}