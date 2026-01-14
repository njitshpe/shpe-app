import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/userProfile';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';
import { prepareProfileUpdate } from '../types/userProfile';

class ProfileService {
    private inFlight: Map<string, Promise<ServiceResponse<UserProfile>>> = new Map();

    /**
     * Flattens profile_data JSONB fields into the profile object for backward compatibility.
     * Fields from profile_data take precedence over legacy column values.
     */
    private flattenProfileData(profile: any): UserProfile {
        if (!profile) return profile;

        const { profile_data = {}, ...rest } = profile;

        // Merge profile_data fields into the profile object
        // profile_data values take precedence over legacy columns
        return {
            ...rest,
            ...profile_data,
            profile_data, // Keep the original profile_data for reference
        } as UserProfile;
    }

    // Get user profile by user ID
    async getProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
        try {
            const existingRequest = this.inFlight.get(userId);
            if (existingRequest) {
                if (__DEV__) {
                    console.log('[ProfileService] Reusing in-flight profile request for user:', userId);
                }
                return await existingRequest;
            }

            const request = (async () => {
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

            // Flatten profile_data for backward compatibility
            const flattenedData = this.flattenProfileData(data);
            return handleSupabaseError(flattenedData, error);
            })();

            this.inFlight.set(userId, request);
            request.finally(() => {
                this.inFlight.delete(userId);
            });

            return await request;
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
            // Separate type-specific fields into profile_data JSONB column
            const { directUpdates, profileDataUpdates } = prepareProfileUpdate(profileData);

            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    id: userId,
                    ...directUpdates,
                    profile_data: profileDataUpdates,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            // Flatten profile_data for backward compatibility
            const flattenedData = this.flattenProfileData(data);
            return handleSupabaseError(flattenedData, error);
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
            // Separate type-specific fields into profile_data JSONB column
            const { directUpdates, profileDataUpdates } = prepareProfileUpdate(updates);

            // Fetch current profile_data to merge with updates
            const { data: currentProfile } = await supabase
                .from('user_profiles')
                .select('profile_data')
                .eq('id', userId)
                .single();

            // Merge existing profile_data with new updates
            const mergedProfileData = {
                ...(currentProfile?.profile_data || {}),
                ...profileDataUpdates,
            };

            const { data, error } = await supabase
                .from('user_profiles')
                .update({
                    ...directUpdates,
                    profile_data: mergedProfileData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            // Flatten profile_data for backward compatibility
            const flattenedData = this.flattenProfileData(data);
            return handleSupabaseError(flattenedData, error);
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
