import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useSegments, useRouter, usePathname } from 'expo-router';

// Providers
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BlockProvider } from '@/contexts/BlockContext';
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
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inAlumniOnboarding = segments[0] === 'alumni-onboarding';
    const inGuestOnboarding = segments[0] === 'guest-onboarding';
    const inRoleSelection = segments[0] === 'role-selection';
    const inApp = segments[0] === '(app)' || segments.includes('(tabs)');

    const userType = user?.user_metadata?.user_type;
    const onboardingCompleted = user?.user_metadata?.onboarding_completed === true;

    const replaceIfNeeded = (target: string) => {
      if (pathname !== target) {
        router.replace(target);
      }
    };

    if (__DEV__) {
      console.log('[AuthGuard] Debug:', {
        hasSession: !!session,
        inAuthGroup,
        inApp,
        segment: segments[0],
        onboardingCompleted,
        userType,
      });
    }

    // Rule 1: No session → redirect to login
    if (!session && !inAuthGroup) {
      replaceIfNeeded('/login');
      return;
    }

    // Rule 2: Has session but NO profile + no user_type → must select role first
    // Only force role selection if onboarding is NOT complete.
    if (session && !profile && !userType && !inRoleSelection && !onboardingCompleted) {
      replaceIfNeeded('/role-selection');
      return;
    }

    // Rule 3: Has session + user_type but NO profile → route to appropriate onboarding
    // BUT only if onboarding is NOT already completed
    if (session && !profile && userType && !onboardingCompleted) {
      if (userType === 'student' && !inOnboarding) {
        replaceIfNeeded('/onboarding');
        return;
      } else if (userType === 'alumni' && !inAlumniOnboarding) {
        replaceIfNeeded('/alumni-onboarding');
        return;
      } else if (userType === 'guest' && !inGuestOnboarding) {
        replaceIfNeeded('/guest-onboarding');
        return;
      }
      // Already on correct onboarding page
      return;
    }

    // Rule 4: Has session + profile but onboarding NOT complete → route to onboarding
    if (session && profile && !onboardingCompleted) {
      const profileType = userType ?? profile.user_type;
      if (profileType === 'student' && !inOnboarding) {
        replaceIfNeeded('/onboarding');
        return;
      } else if (profileType === 'alumni' && !inAlumniOnboarding) {
        replaceIfNeeded('/alumni-onboarding');
        return;
      } else if (profileType === 'guest' && !inGuestOnboarding) {
        replaceIfNeeded('/guest-onboarding');
        return;
      } else if (!profileType && !inRoleSelection) {
        replaceIfNeeded('/role-selection');
        return;
      }
      return;
    }

    // Rule 5: Has session + onboarding completed → should be in app
    if (session && onboardingCompleted) {
      if (inAuthGroup || inOnboarding || inAlumniOnboarding || inGuestOnboarding || inRoleSelection) {
        replaceIfNeeded('/home');
        return;
      }
      // If we are not in app (e.g. root), go to home
      if (!inApp) {
        replaceIfNeeded('/home');
        return;
      }
    }
  }, [session, isLoading, segments, user, profile, pathname, router]);

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

  // Loading State - wait for auth to load
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
          <BlockProvider>
            <NotificationProvider>
              <EventsProvider>
                <AuthGuard>
                  <Slot />
                </AuthGuard>
              </EventsProvider>
            </NotificationProvider>
          </BlockProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
