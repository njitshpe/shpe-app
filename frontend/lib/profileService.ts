import { supabase } from './supabase';
import type { UserProfile } from '../types/userProfile';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

class ProfileService {
    /**
     * Get user profile by user ID
     */
    async getProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            return handleSupabaseError(data, error);
        } catch (error) {
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

    /**
     * Create a new user profile
     */
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

    /**
     * Update an existing user profile
     */
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
}

export const profileService = new ProfileService();
