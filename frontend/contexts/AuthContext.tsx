import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import type { AppError } from '../types/errors';
import { mapSupabaseError, validators, createError } from '../types/errors';

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
  signIn: (email: string, password: string) => Promise<{ error: AppError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AppError | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: AppError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   * Validates input and provides user-friendly error messages
   */
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

  /**
   * Sign up with email and password
   * Validates input and provides user-friendly error messages
   */
  const signUp = async (email: string, password: string) => {
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
      const { data, error } = await supabase.auth.signUp({ email, password });

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

  /**
   * Sign in with Google OAuth
   * Handles OAuth flow with proper error handling
   */
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}