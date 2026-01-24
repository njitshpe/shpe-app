import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot, SplashScreen, useSegments, useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Providers
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BlockProvider } from '@/contexts/BlockContext';
import { ErrorBoundary } from '@/components/shared';
import { OfflineNotice } from '@/components/ui/OfflineNotice';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { AnimatedSplash, useSplashReady } from '@/components/auth/AnimatedSplash';
import { UpdatePasswordSheet } from '@/components/auth/UpdatePasswordSheet';

// Services
import { eventNotificationHelper } from '@/services/eventNotification.helper';
import { notificationService } from '@/services/notification.service';
import { rankService } from '@/services/rank.service';

void SplashScreen.preventAutoHideAsync();

/**
 * Helper to format action types into user-friendly text
 */
function formatActionLabel(actionType: string): string {
  const map: Record<string, string> = {
    event_check_in: 'Event Check-In',
    rsvp_confirmed_bonus: 'Confirmed RSVP',
    volunteer_bonus: 'Volunteer Bonus',
    feed_post_text: 'New Post',
    feed_post_photo: 'Photo Upload',
    referral_bonus: 'Referral',
    streak_bonus: 'Streak Bonus',
  };
  return map[actionType] || 'Points Awarded';
}

/**
 * Auth Guard Component
 * Handles redirects based on authentication state
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, isBootstrapping, user, profile, showPasswordRecovery, setShowPasswordRecovery, updatePassword } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const { setReady } = useSplashReady();

  // Toast State for Points
  const [toast, setToast] = React.useState({ visible: false, message: '' });

  // Password update state
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(null);

  const handleUpdatePassword = async (newPassword: string) => {
    setIsUpdatingPassword(true);
    setPasswordUpdateError(null);

    const { error } = await updatePassword(newPassword);

    setIsUpdatingPassword(false);

    if (error) {
      setPasswordUpdateError(error.message);
      return { error };
    }

    return { error: null };
  };

  const handleClosePasswordSheet = () => {
    setShowPasswordRecovery(false);
    setPasswordUpdateError(null);
  };

  // Signal to AnimatedSplash that the app is ready once bootstrapping is complete
  useEffect(() => {
    if (!isBootstrapping) {
      setReady();
    }
  }, [isBootstrapping, setReady]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // NOTE: Prefer pathname checks over segments for robustness across expo-router versions.
    const inAuthGroup = segments[0] === '(auth)' || pathname === '/welcome';
    const inOnboarding = segments[0] === 'onboarding' || pathname === '/onboarding';
    const inAlumniOnboarding = segments[0] === 'alumni-onboarding' || pathname === '/alumni-onboarding';
    const inGuestOnboarding = segments[0] === 'guest-onboarding' || pathname === '/guest-onboarding';
    const inRoleSelection = segments[0] === 'role-selection' || pathname === '/role-selection';
    const inRoot = pathname === '/';
    const inApp =
      (segments[0] === '(app)' || segments.includes('(tabs)')) &&
      !inRoot;
    const isNonAppRoute = inAuthGroup || inOnboarding || inAlumniOnboarding || inGuestOnboarding || inRoleSelection || inRoot;
    const isInApp = !isNonAppRoute || inApp;

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
        pathname,
        segments,
        inAuthGroup,
        inApp: isInApp,
        segment: segments[0],
        onboardingCompleted,
        userType,
      });
    }

    // Rule 1: No session → redirect to welcome
    if (!session && !inAuthGroup) {
      // Save the intended destination for deep link handling
      if (pathname && pathname !== '/' && !pathname.includes('welcome')) {
        AsyncStorage.setItem('pendingDeepLink', pathname).catch(err =>
          console.error('[AuthGuard] Failed to save pending deep link:', err)
        );
      }
      replaceIfNeeded('/(auth)/welcome');
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
        // Check for pending deep link after onboarding
        AsyncStorage.getItem('pendingDeepLink')
          .then(pendingLink => {
            if (pendingLink) {
              // Clear the saved link
              AsyncStorage.removeItem('pendingDeepLink');
              // Navigate to the saved destination
              router.replace(pendingLink);
            } else {
              replaceIfNeeded('/home');
            }
          })
          .catch(err => {
            console.error('[AuthGuard] Failed to retrieve pending deep link:', err);
            replaceIfNeeded('/home');
          });
        return;
      }
      // If we are not in app (e.g. root), go to home
      if (!isInApp) {
        replaceIfNeeded('/home');
        return;
      }
    }
  }, [session, isLoading, segments, user, profile, pathname, router]);

  // 2. POINTS LISTENER (Realtime)
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    if (!isLoading && session) {
      // Subscribe to Realtime Points
      subscription = rankService.subscribeToPoints({
        onPointsAwarded: (points, actionType) => {
          // Show the toast!
          const label = formatActionLabel(actionType);
          setToast({
            visible: true,
            message: `+${points}\n${label}`
          });
        }
      });
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [session, isLoading]);

  // 3. DEEP LINK LISTENER (Email Verification & Password Recovery)
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;

      // Supabase adds #access_token=...&type=signup or type=recovery to the URL
      if (url.includes('type=signup')) {
        setToast({
          visible: true,
          message: 'Verification Complete\nYour email has been verified successfully.'
        });
      } else if (url.includes('type=recovery')) {
        // For password recovery, we need to extract tokens and set the session
        // This triggers the PASSWORD_RECOVERY event in AuthContext
        try {
          const hashFragment = url.split('#')[1];
          if (hashFragment) {
            const params = new URLSearchParams(hashFragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              // Import supabase here to avoid circular dependencies
              const { supabase } = await import('@/lib/supabase');
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              // The PASSWORD_RECOVERY event will be triggered by onAuthStateChange in AuthContext
            }
          }
        } catch (error) {
          if (__DEV__) {
            console.error('[DeepLink] Error handling password recovery:', error);
          }
        }
      }
    };

    // Listen for incoming links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened initially via a link (Cold Start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // During initial bootstrap, render children but AnimatedSplash handles the visual loading state
  // After bootstrap, if still loading (e.g., profile refresh), show a subtle indicator
  if (isBootstrapping) {
    // Render children so they can initialize, but AnimatedSplash covers them
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <SuccessToast
        visible={toast.visible}
        message={toast.message}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
      <UpdatePasswordSheet
        visible={showPasswordRecovery}
        onClose={handleClosePasswordSheet}
        onSubmit={handleUpdatePassword}
        isLoading={isUpdatingPassword}
        error={passwordUpdateError}
      />
    </>
  );
}

/**
 * Root Layout
 * Wraps the app with all necessary providers
 * ThemeProvide  is at the top level so it prevents crashing.
 * AnimatedSplash wraps everything to provide the Luma-style splash animation.
 */
export default function RootLayout() {
  const onLayoutRootView = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AnimatedSplash>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <BlockProvider>
                <NotificationProvider>
                  <EventsProvider>
                    <AuthGuard>
                      <OfflineNotice />
                      <Slot />
                    </AuthGuard>
                  </EventsProvider>
                </NotificationProvider>
              </BlockProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </AnimatedSplash>
    </GestureHandlerRootView>
  );
}
