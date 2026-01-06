/**
 * ============================================================================
 * AUTH CONTEXT - SHPE APP AUTHENTICATION FLOW
 * ============================================================================
 *
 * This context manages authentication state and profile loading with proper
 * error handling to prevent infinite loading spinners.
 *
 * CRITICAL SAFETY RULES:
 * 1. Loading states MUST always clear in finally blocks
 * 2. Profile fetch failures should set profile=null, NOT throw errors
 * 3. UI should proceed to onboarding if session exists but profile is null
 *
 * EXPECTED FLOWS:
 * ----------------
 * A) Valid session + profile exists:
 *    → Bootstrap loads both → Traffic Cop routes to /home
 *
 * B) Valid session + NO profile:
 *    → Bootstrap finds session but profile=null → Traffic Cop routes to onboarding
 *
 * C) No session:
 *    → Bootstrap clears loading → Traffic Cop routes to /login
 *
 * D) OAuth flow (Google):
 *    → Redirect to shpe-app:// → Extract tokens → Set session → Load profile
 *    → If profile missing, route to /role-selection
 *
 * OAUTH CONFIGURATION CHECKLIST:
 * ------------------------------
 * - app.json scheme: "shpe-app"
 * - AUTH_CONFIG.REDIRECT_URI: "shpe-app://"
 * - Supabase Dashboard → Authentication → URL Configuration:
 *   - Add "shpe-app://" to Redirect URLs
 *   - Add "shpe-app://" to Site URL (optional but recommended)
 *
 * ============================================================================
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
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
  isBootstrapping: boolean; // True while checking session AND profile
  signIn: (email: string, password: string) => Promise<{ error: AppError | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AppError | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: AppError | null }>;
  signOut: () => Promise<void>;
  profile: UserProfile | null;
  loadProfile: (userId: string) => Promise<void>;
  updateUserMetadata: (metadata: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Load profile when session exists
  useEffect(() => {
    const bootstrapAuth = async () => {
      console.log('[AuthContext] Bootstrapping auth...');
      setIsBootstrapping(true);

      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        // If we have a session, load the profile
        if (session?.user) {
          console.log('[AuthContext] Session found, loading profile for user:', session.user.id);
          await loadProfileInternal(session.user.id);
        } else {
          console.log('[AuthContext] No session found');
        }
      } catch (error) {
        console.error('[AuthContext] Bootstrap error:', error);
      } finally {
        setIsLoading(false);
        setIsBootstrapping(false);
        console.log('[AuthContext] Bootstrapping complete');
      }
    };

    bootstrapAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        // ========================================================================
        // SAFETY VALVE: Always clear loading states in finally block
        // This prevents infinite spinner if profile fetch fails
        // ========================================================================
        try {
          // Load profile when user signs in
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            console.log('[AuthContext] User signed in, loading profile');
            setIsBootstrapping(true);
            setIsLoading(true);
            await loadProfileInternal(session.user.id);
          }

          // Clear profile when user signs out
          if (event === 'SIGNED_OUT') {
            console.log('[AuthContext] User signed out, clearing profile');
            setProfile(null);
          }
        } catch (error) {
          console.error('[AuthContext] Auth state change error:', error);
          // Don't throw - allow UI to proceed even if profile fetch fails
        } finally {
          // CRITICAL: Always clear loading states, even on error
          setIsLoading(false);
          setIsBootstrapping(false);
          console.log('[AuthContext] Auth state change complete, loading states cleared');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Internal profile loader (doesn't modify loading states)
  // SAFETY: This function NEVER throws - always sets profile to data or null
  const loadProfileInternal = async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching profile from database for user:', userId);
      const result = await profileService.getProfile(userId);

      if (result.success && result.data) {
        console.log('[AuthContext] ✅ Profile loaded successfully:', {
          userType: result.data.user_type,
          hasUniversity: !!result.data.university,
        });
        setProfile(result.data);
      } else {
        console.log('[AuthContext] ⚠️ No profile found in database - user needs onboarding');
        setProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] ❌ Error loading profile:', error);
      console.error('[AuthContext] Setting profile to null and allowing UI to proceed');
      setProfile(null);
      // IMPORTANT: Don't re-throw - let the app route to onboarding
    }
  };

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

      // Verify redirect URI matches app scheme
      console.log('[AuthContext] OAuth Configuration:', {
        redirectUri,
        expectedScheme: 'shpe-app://',
        note: 'Ensure this matches Supabase OAuth redirect settings'
      });

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

      console.log('[AuthContext] Opening OAuth browser session...');
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );

      if (result.type === 'success') {
        const url = result.url;
        console.log('[AuthContext] OAuth redirect received:', url.substring(0, 50) + '...');

        // Extract tokens from URL fragment
        const hashParams = url.split(AUTH_CONFIG.URL_FRAGMENT_SEPARATOR)[1];
        if (hashParams) {
          const params = new URLSearchParams(hashParams);
          const accessToken = params.get(AUTH_CONFIG.URL_PARAMS.ACCESS_TOKEN);
          const refreshToken = params.get(AUTH_CONFIG.URL_PARAMS.REFRESH_TOKEN);

          if (accessToken && refreshToken) {
            console.log('[AuthContext] Tokens extracted, setting session...');

            // IMPORTANT: Manually set loading states before setting session
            // This ensures the UI shows loading during profile fetch
            setIsBootstrapping(true);
            setIsLoading(true);

            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              // Clear loading states on error
              setIsBootstrapping(false);
              setIsLoading(false);
              return { error: mapSupabaseError(sessionError) };
            }

            console.log('[AuthContext] ✅ Session set successfully');

            // Manually update session and user state immediately
            // This ensures they're available before onAuthStateChange fires
            if (sessionData.session) {
              setSession(sessionData.session);
              setUser(sessionData.session.user);

              // Try to load profile
              try {
                await loadProfileInternal(sessionData.session.user.id);
              } catch (error) {
                console.error('[AuthContext] Error loading profile after OAuth:', error);
                // Set profile to null so Traffic Cop can route to role-selection
                setProfile(null);
              } finally {
                // CRITICAL: Always clear loading states
                setIsBootstrapping(false);
                setIsLoading(false);
                console.log('[AuthContext] OAuth flow complete, loading states cleared');
              }
            }
          } else {
            console.error('[AuthContext] ❌ Missing tokens in OAuth redirect');
            return {
              error: createError(
                'OAuth tokens missing. Please try again.',
                'OAUTH_ERROR'
              ),
            };
          }
        } else {
          console.error('[AuthContext] ❌ No hash params in OAuth redirect URL');
          return {
            error: createError(
              'OAuth redirect failed. Please try again.',
              'OAUTH_ERROR'
            ),
          };
        }
      } else if (result.type === 'cancel') {
        console.log('[AuthContext] OAuth cancelled by user');
        return {
          error: createError(
            'Google sign-in was cancelled.',
            'OAUTH_CANCELLED'
          ),
        };
      }

      return { error: null };
    } catch (error: any) {
      console.error('[AuthContext] ❌ Google sign in error:', error);
      // Clear loading states on error
      setIsBootstrapping(false);
      setIsLoading(false);
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

  const signOut = async () => {
    console.log('[AuthContext] Signing out...');
    setProfile(null);
    await supabase.auth.signOut();
  };

  // Public profile loader (for manual refreshes)
  const loadProfile = async (userId: string) => {
    await loadProfileInternal(userId);
  };

  const updateUserMetadata = async (metadata: Record<string, any>) => {
    console.log('[AuthContext] Updating user metadata:', metadata);
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
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    profile,
    loadProfile,
    updateUserMetadata,
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