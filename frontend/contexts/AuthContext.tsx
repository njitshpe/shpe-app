import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';
import type { AppError } from '../types/errors';
import { mapSupabaseError, validators, createError } from '../types/errors';
import type { UserProfile } from '../types/userProfile';
import { profileService } from '../services/profile.service';

WebBrowser.maybeCompleteAuthSession();

// Authentication configuration constants
const AUTH_CONFIG = {
  REDIRECT_URI: 'shpe-app://',
  OAUTH_PROVIDER: 'google' as const,
  URL_FRAGMENT_SEPARATOR: '#',
  URL_PARAMS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
  },
} as const;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isBootstrapping: boolean; // True until initial auth check completes
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AppError | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AppError | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: AppError | null }>;
  signInWithApple: () => Promise<{ error: AppError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AppError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AppError | null }>;
  profile: UserProfile | null;
  loadProfile: (userId: string) => Promise<void>;
  updateUserMetadata: (metadata: Record<string, any>) => Promise<void>;
  showPasswordRecovery: boolean;
  setShowPasswordRecovery: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to add timeout to profile loading
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
    ),
  ]);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true); // Initial app load
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);

  // Track if we're currently loading a profile to avoid concurrent requests
  const loadingProfileRef = React.useRef(false);
  // Track the current user ID to detect user changes
  const currentUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Load initial session and profile
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        const onboardingCompleted = session?.user?.user_metadata?.onboarding_completed === true;
        // Load profile only after onboarding is complete
        if (session?.user?.id && onboardingCompleted) {
          currentUserIdRef.current = session.user.id;
          setProfileLoading(true);
          try {
            if (__DEV__) {
              console.log('[AuthContext] Loading profile for user:', session.user.id);
            }
            const result = await withTimeout(
              profileService.getProfile(session.user.id)
            );
            if (result.success && result.data) {
              setProfile(result.data);
              if (__DEV__) {
                console.log('[AuthContext] Profile loaded successfully');
              }
            } else {
              // Profile not found but session exists - account may be corrupted/deleted
              console.warn('[AuthContext] Critical: Session exists but profile missing on startup. Force signing out.');
              await supabase.auth.signOut();
              setProfile(null);
            }
          } catch (error) {
            if (__DEV__) {
              console.warn('[AuthContext] Failed to load profile on startup (may be normal during onboarding):', error);
            }
            setProfile(null);
          } finally {
            setProfileLoading(false);
          }
        } else {
          // No session, ensure profileLoading is false
          setProfileLoading(false);
          currentUserIdRef.current = null;
        }

        setIsLoading(false);
        setIsBootstrapping(false);
      })
      .catch((error) => {
        console.error('Failed to get session:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        setIsBootstrapping(false);
        setProfileLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle PASSWORD_RECOVERY event
        if (event === 'PASSWORD_RECOVERY') {
          if (__DEV__) {
            console.log('[AuthContext] PASSWORD_RECOVERY event received');
          }
          setShowPasswordRecovery(true);
        }

        setSession(session);
        setUser(session?.user ?? null);

        const onboardingCompleted = session?.user?.user_metadata?.onboarding_completed === true;
        // Load profile when auth state changes (only after onboarding is complete)
        if (session?.user?.id && onboardingCompleted) {
          // Skip if we're already loading a profile for the same user
          if (loadingProfileRef.current && currentUserIdRef.current === session.user.id) {
            if (__DEV__) {
              console.log('[AuthContext] Skipping profile load - already in progress for this user');
            }
            setIsLoading(false);
            return;
          }

          // If user changed, allow new load even if one is in progress
          currentUserIdRef.current = session.user.id;
          loadingProfileRef.current = true;
          setProfileLoading(true);
          try {
            const result = await withTimeout(
              profileService.getProfile(session.user.id)
            );
            if (result.success && result.data) {
              setProfile(result.data);
            } else {
              // Profile not found but session exists - account may be corrupted/deleted
              console.warn('[AuthContext] Critical: Session exists but profile missing. Force signing out.');
              await supabase.auth.signOut();
              setProfile(null);
            }
          } catch (error) {
            // Only log if it's not a timeout during onboarding
            if (__DEV__) {
              console.warn('[AuthContext] Profile load failed (may be normal during onboarding):', error);
            }
            setProfile(null);
          } finally {
            setProfileLoading(false);
            loadingProfileRef.current = false;
          }
        } else {
          // Clear profile when logged out or onboarding incomplete
          setProfile(null);
          setProfileLoading(false);
          loadingProfileRef.current = false;
          currentUserIdRef.current = session?.user?.id ?? null;
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  // Validates input and provides user-friendly error messages
  const signIn = async (email: string, password: string) => {
    try {
      // Validate email format
      if (!validators.isValidEmail(email)) {
        return {
          error: createError(
            'Please enter a valid email address.',
            'INVALID_EMAIL',
            'email'
          ),
        };
      }

      // Validate password
      const passwordValidation = validators.isValidPassword(password);
      if (!passwordValidation.valid) {
        return { error: passwordValidation.error! };
      }

      // Attempt sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: mapSupabaseError(error) };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        error: createError(
          'Unable to sign in. Please try again.',
          'UNKNOWN_ERROR',
          undefined,
          error.message
        ),
      };
    }
  };

  // Sign up with email and password
  // Validates input and provides user-friendly error messages
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      // Validate email format
      if (!validators.isValidEmail(email)) {
        return {
          error: createError(
            'Please enter a valid email address.',
            'INVALID_EMAIL',
            'email'
          ),
        };
      }

      // Validate password
      const passwordValidation = validators.isValidPassword(password);
      if (!passwordValidation.valid) {
        return { error: passwordValidation.error! };
      }

      // Attempt sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Store user type and other metadata
        },
      });

      if (error) {
        return { error: mapSupabaseError(error) };
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = !!(data.user && !data.session);

      return {
        error: null,
        needsEmailConfirmation
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        error: createError(
          'Unable to create account. Please try again.',
          'UNKNOWN_ERROR',
          undefined,
          error.message
        ),
      };
    }
  };

  // Sign in with Google OAuth
  // Handles OAuth flow with proper error handling
  const signInWithGoogle = async () => {
    try {
      const redirectUri = AUTH_CONFIG.REDIRECT_URI;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: AUTH_CONFIG.OAUTH_PROVIDER,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        return { error: mapSupabaseError(error) };
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );

      if (result.type === 'success') {
        const url = result.url;

        // Extract tokens from URL fragment
        const hashParams = url.split(AUTH_CONFIG.URL_FRAGMENT_SEPARATOR)[1];
        if (hashParams) {
          const params = new URLSearchParams(hashParams);
          const accessToken = params.get(AUTH_CONFIG.URL_PARAMS.ACCESS_TOKEN);
          const refreshToken = params.get(AUTH_CONFIG.URL_PARAMS.REFRESH_TOKEN);

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              return { error: mapSupabaseError(sessionError) };
            }
          }
        }
      } else if (result.type === 'cancel') {
        return {
          error: createError(
            'Google sign-in was cancelled.',
            'UNKNOWN_ERROR'
          ),
        };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      return {
        error: createError(
          'Unable to sign in with Google. Please try again.',
          'UNKNOWN_ERROR',
          undefined,
          error.message
        ),
      };
    }
  };



  const signInWithApple = async () => {
    try {
      console.log('[Apple Auth] Step 1: Checking availability...');
      // Check if Apple Authentication is available on this device
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('[Apple Auth] isAvailable:', isAvailable);
      if (!isAvailable) {
        return {
          error: createError(
            'Apple Sign In is not available on this device. Please use another sign-in method.',
            'AUTH_ERROR'
          )
        };
      }

      console.log('[Apple Auth] Step 2: Generating nonce...');
      // 1. Generate a random nonce
      const rawNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      console.log('[Apple Auth] Step 3: Hashing nonce...');
      // 2. Hash the nonce (SHA-256)
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      console.log('[Apple Auth] Nonce hashed successfully');

      console.log('[Apple Auth] Step 4: Requesting Apple credential...');
      // 3. Request credential from Apple with the HASHED nonce
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      console.log('[Apple Auth] Got credential, hasIdentityToken:', !!credential.identityToken);

      // Sign in via Supabase.
      if (credential.identityToken) {
        console.log('[Apple Auth] Step 5: Signing in with Supabase...');
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: rawNonce, // Send the RAW nonce to Supabase for verification
        });

        if (error) {
          console.log('[Apple Auth] Supabase error:', error.message);
          return { error: mapSupabaseError(error) };
        }

        console.log('[Apple Auth] Supabase sign in successful, user:', !!data.user);
        if (data.user) {
          // If we have full name from Apple (only on first sign in), update Supabase user metadata
          if (credential.fullName) {
            const nameData: Record<string, any> = {};
            if (credential.fullName.givenName) nameData.full_name = credential.fullName.givenName;
            if (credential.fullName.familyName) nameData.full_name += ` ${credential.fullName.familyName}`;

            // We can also store the raw name parts
            if (credential.fullName.givenName) nameData.first_name = credential.fullName.givenName;
            if (credential.fullName.familyName) nameData.last_name = credential.fullName.familyName;

            if (Object.keys(nameData).length > 0) {
              await supabase.auth.updateUser({
                data: nameData
              });
            }
          }
          return { error: null };
        }
      }

      return { error: createError('No identity token received from Apple', 'AUTH_ERROR') };
    } catch (e: any) {
      console.error('[Apple Auth] CAUGHT ERROR:', e);
      console.error('[Apple Auth] Error code:', e.code);
      console.error('[Apple Auth] Error message:', e.message);
      console.error('[Apple Auth] Full error object:', JSON.stringify(e, null, 2));
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled - not an error we need to show
        return { error: null };
      }
      // Handle specific Apple Authentication errors
      if (e.code === 'ERR_REQUEST_UNKNOWN') {
        return {
          error: createError(
            'Apple Sign In failed. Please check your Apple ID settings and try again.',
            'AUTH_ERROR'
          )
        };
      }
      return { error: createError(e.message || 'Apple Sign In Failed', 'AUTH_ERROR') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Reset password - sends a password reset email
  const resetPassword = async (email: string) => {
    try {
      // Validate email format
      if (!validators.isValidEmail(email)) {
        return {
          error: createError(
            'Please enter a valid email address.',
            'INVALID_EMAIL',
            'email'
          ),
        };
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${AUTH_CONFIG.REDIRECT_URI}reset-password`,
      });

      if (error) {
        return { error: mapSupabaseError(error) };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        error: createError(
          'Unable to send reset email. Please try again.',
          'UNKNOWN_ERROR',
          undefined,
          error.message
        ),
      };
    }
  };

  // Update password - called after PASSWORD_RECOVERY event
  const updatePassword = async (newPassword: string) => {
    try {
      // Validate password
      const passwordValidation = validators.isValidPassword(newPassword);
      if (!passwordValidation.valid) {
        return { error: passwordValidation.error! };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: mapSupabaseError(error) };
      }

      // Close the password recovery sheet on success
      setShowPasswordRecovery(false);
      return { error: null };
    } catch (error: any) {
      console.error('Update password error:', error);
      return {
        error: createError(
          'Unable to update password. Please try again.',
          'UNKNOWN_ERROR',
          undefined,
          error.message
        ),
      };
    }
  };

  const loadProfile = async (userId: string) => {
    // Skip if we're already loading a profile for the same user
    if (loadingProfileRef.current && currentUserIdRef.current === userId) {
      if (__DEV__) {
        console.log('[AuthContext] Skipping loadProfile - already in progress for this user');
      }
      return;
    }

    currentUserIdRef.current = userId;
    loadingProfileRef.current = true;
    setProfileLoading(true);
    try {
      const result = await withTimeout(
        profileService.getProfile(userId)
      );
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        // Profile not found - this could mean the account was deleted or corrupted
        // Check if we have an active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Session exists but profile is missing - force sign out to break the loop
          console.warn('[AuthContext] Critical: Session exists but profile missing. Force signing out.');
          await supabase.auth.signOut();
        }
        setProfile(null);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[AuthContext] Failed to load profile:', error);
      }
      setProfile(null);
    } finally {
      setProfileLoading(false);
      loadingProfileRef.current = false;
    }
  };

  const updateUserMetadata = async (metadata: Record<string, any>) => {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      console.error('Error updating user metadata:', error);
      throw error;
    }

    if (data.user) {
      setUser(data.user);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    isBootstrapping,
    profileLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    updatePassword,
    profile,
    loadProfile,
    updateUserMetadata,
    showPasswordRecovery,
    setShowPasswordRecovery,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
