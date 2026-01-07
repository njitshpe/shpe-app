import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/userProfile';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

class ProfileService {
    // Get user profile by user ID
    async getProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
        try {
            if (__DEV__) {
                console.log('[ProfileService] Fetching profile for user:', userId);
            }
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle() instead of single() to handle missing profiles gracefully

            if (__DEV__) {
                console.log('[ProfileService] Profile fetch result:', { hasData: !!data, error: error?.message });
            }

            // If no profile exists (data is null and no error), return success with null data
            if (!data && !error) {
                return {
                    success: true,
                    data: null as any, // Profile doesn't exist yet (e.g., during onboarding)
                };
            }

            return handleSupabaseError(data, error);
        } catch (error) {
            if (__DEV__) {
                console.error('[ProfileService] Exception in getProfile:', error);
            }
            return {
                success: false,
                error: createError(
                    'Failed to load profile',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }

    // Create a new user profile
    async createProfile(
        userId: string,
        profileData: Partial<UserProfile>
    ): Promise<ServiceResponse<UserProfile>> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    id: userId,
                    ...profileData,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            return handleSupabaseError(data, error);
        } catch (error) {
            return {
                success: false,
                error: createError(
                    'Failed to create profile',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }

    // Update an existing user profile
    async updateProfile(
        userId: string,
        updates: Partial<UserProfile>
    ): Promise<ServiceResponse<UserProfile>> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            return handleSupabaseError(data, error);
        } catch (error) {
            return {
                success: false,
                error: createError(
                    'Failed to update profile',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }

    // Delete a user profile (used for dev-only reset flows)
    async deleteProfile(userId: string): Promise<ServiceResponse<null>> {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', userId);

            return handleSupabaseError(null, error);
        } catch (error) {
            return {
                success: false,
                error: createError(
                    'Failed to delete profile',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }
}

export const profileService = new ProfileService();
