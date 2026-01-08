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
import { pointsListener } from '@/services/pointsListener.service';

/**
 * Auth Guard Component
 * Handles redirects based on authentication state
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, user, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inAlumniOnboarding = segments[0] === 'alumni-onboarding';
    const inGuestOnboarding = segments[0] === 'guest-onboarding';
    const inRoleSelection = segments[0] === 'role-selection';
    const inApp = segments[0] === '(app)' || segments.includes('(tabs)');

    const userType = user?.user_metadata?.user_type;
    const onboardingCompleted = user?.user_metadata?.onboarding_completed === true;

    console.log('[AuthGuard] Debug:', {
      hasSession: !!session,
      inAuthGroup,
      inApp,
      segment: segments[0],
      onboardingCompleted,
      userType
    });

    // Rule 1: No session → redirect to login
    if (!session && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    // Rule 2: Has session but NO profile + no user_type → must select role first
    // FIX: Only force role selection if onboarding is NOT complete.
    if (session && !profile && !userType && !inRoleSelection && !onboardingCompleted) {
      router.replace('/role-selection');
      return;
    }

    // Rule 3: Has session + user_type but NO profile → route to appropriate onboarding
    if (session && !profile && userType) {
      if (userType === 'student' && !inOnboarding) {
        router.replace('/onboarding');
        return;
      } else if (userType === 'alumni' && !inAlumniOnboarding) {
        router.replace('/alumni-onboarding');
        return;
      } else if (userType === 'guest' && !inGuestOnboarding) {
        router.replace('/guest-onboarding');
        return;
      }
      // Already on correct onboarding page
      return;
    }

    // Rule 4: Has session + profile but onboarding NOT complete → route to onboarding
    if (session && profile && !onboardingCompleted) {
      const profileType = userType ?? profile.user_type;
      if (profileType === 'student' && !inOnboarding) {
        router.replace('/onboarding');
        return;
      } else if (profileType === 'alumni' && !inAlumniOnboarding) {
        router.replace('/alumni-onboarding');
        return;
      } else if (profileType === 'guest' && !inGuestOnboarding) {
        router.replace('/guest-onboarding');
        return;
      } else if (!profileType && !inRoleSelection) {
        router.replace('/role-selection');
        return;
      }
      return;
    }

    // Rule 5: Has session + onboarding completed → should be in app
    // FIX: Ensure we don't redirect if we are already in the app/tabs
    if (session && onboardingCompleted) {
      if (inAuthGroup || inOnboarding || inAlumniOnboarding || inGuestOnboarding || inRoleSelection) {
        router.replace('/home');
        return;
      }
      // If we are not in app (e.g. root), go to home
      if (!inApp) {
        router.replace('/home');
        return;
      }
      // If we are already in (app)/(tabs), do nothing.
      return;
    }
  }, [session, isLoading, segments, user, profile]);

  // 2. POINTS LISTENER (Notification logic is now in Context)
  useEffect(() => {
    if (!isLoading && session) {
      // Start listening for events to award points
      pointsListener.start();
    } else if (!session) {
      pointsListener.stop();
    }

    return () => {
      pointsListener.stop();
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
 * ThemeProvide  is at the top level so it prevents crashing.
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
