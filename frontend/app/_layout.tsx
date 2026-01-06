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
 * Auth Guard Component (Traffic Cop)
 * Handles redirects based on authentication state AND profile existence
 * AND manages notification subscriptions
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, isBootstrapping, user, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 1. TRAFFIC COP NAVIGATION LOGIC
  useEffect(() => {
    // Wait for auth + profile check to complete
    if (isLoading || isBootstrapping) {
      console.log('[AuthGuard] Still loading, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inAlumniOnboarding = segments[0] === 'alumni-onboarding';
    const inGuestOnboarding = segments[0] === 'guest-onboarding';
    const inRoleSelection = segments[0] === 'role-selection';
    const inApp = segments[0] === '(app)' || segments.includes('(tabs)');

    console.log('[AuthGuard] Traffic Cop Check:', {
      hasSession: !!session,
      hasProfile: !!profile,
      userType: user?.user_metadata?.user_type,
      metadata_completed: user?.user_metadata?.onboarding_completed,
      currentRoute: segments.join('/'),
      segments,
      inAuthGroup,
      inOnboarding,
      inAlumniOnboarding,
      inGuestOnboarding,
      inRoleSelection,
      inApp,
    });

    // Rule 1: No session → Must go to auth
    if (!session && !inAuthGroup) {
      console.log('[AuthGuard] ❌ No session, redirecting to login');
      router.replace('/login');
      return;
    }

    // Rule 2: Has session but NO profile and NO user_type → Must select role first
    // CRITICAL: This catches OAuth users who just signed in
    if (session && !profile && !user?.user_metadata?.user_type) {
      if (!inRoleSelection) {
        console.log('[AuthGuard] ⚠️ Session exists but no user type selected, redirecting to role selection');
        router.replace('/role-selection');
        return;
      }
      // Already on role selection page, let them stay
      console.log('[AuthGuard] ✓ User is on role selection page');
      return;
    }

    // Rule 3: Has session and user_type but NO profile → Must complete appropriate onboarding
    if (session && !profile && user?.user_metadata?.user_type) {
      const userType = user.user_metadata.user_type;

      // Check if already on the correct onboarding page
      if (userType === 'alumni' && !inAlumniOnboarding) {
        console.log('[AuthGuard] ⚠️ Alumni user without profile, redirecting to alumni onboarding');
        router.replace('/alumni-onboarding');
        return;
      } else if (userType === 'guest' && !inGuestOnboarding) {
        console.log('[AuthGuard] ⚠️ Guest user without profile, redirecting to guest onboarding');
        router.replace('/guest-onboarding');
        return;
      } else if (userType === 'student' && !inOnboarding) {
        console.log('[AuthGuard] ⚠️ Student user without profile, redirecting to onboarding');
        router.replace('/onboarding');
        return;
      }
      // Already on the correct onboarding page
      console.log('[AuthGuard] ✓ User is on correct onboarding page');
      return;
    }

    // Rule 4: Has session AND profile → Should be in app
    if (session && profile) {
      // If user has profile but is still on auth/onboarding/role pages, redirect to home
      if (inAuthGroup || inOnboarding || inAlumniOnboarding || inGuestOnboarding || inRoleSelection) {
        console.log('[AuthGuard] ✅ Authenticated with profile, redirecting to home');
        router.replace('/home');
        return;
      }
      // Already in the app, let them stay
      console.log('[AuthGuard] ✓ User is authenticated and in the app');
      return;
    }

    console.log('[AuthGuard] ✓ User is in correct location');
  }, [session, isLoading, isBootstrapping, segments, user, profile, router]);

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

  // Bootstrapping/Loading State - Show splash while checking auth AND profile
  if (isLoading || isBootstrapping) {
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