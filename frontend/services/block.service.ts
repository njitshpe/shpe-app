import { supabase } from '../lib/supabase';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

/**
 * Service for managing user blocks
 */
class BlockService {
    /**
     * Fetch list of user IDs that the current user has blocked
     */
    async fetchBlockedUserIds(): Promise<ServiceResponse<string[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {
                    success: false,
                    error: createError('User not authenticated', 'UNAUTHORIZED'),
                };
            }

            const { data, error } = await supabase
                .from('user_blocks')
                .select('blocked_id')
                .eq('blocker_id', user.id);

            if (error) {
                return handleSupabaseError(null, error);
            }

            const blockedIds = data?.map(row => row.blocked_id) || [];
            return { success: true, data: blockedIds };
        } catch (error) {
            return {
                success: false,
                error: createError(
                    'Failed to fetch blocked users',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }

    /**
     * Block a user
     */
    async blockUser(targetUserId: string): Promise<ServiceResponse<void>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {
                    success: false,
                    error: createError('User not authenticated', 'UNAUTHORIZED'),
                };
            }

            if (user.id === targetUserId) {
                return {
                    success: false,
                    error: createError('Cannot block yourself', 'VALIDATION_ERROR'),
                };
            }

            const { error } = await supabase
                .from('user_blocks')
                .insert({
                    blocker_id: user.id,
                    blocked_id: targetUserId,
                });

            if (error) {
                // Handle duplicate block gracefully
                if (error.code === '23505') { // Unique constraint violation
                    return { success: true, data: undefined };
                }
                return handleSupabaseError(null, error);
            }

            return { success: true, data: undefined };
        } catch (error) {
            return {
                success: false,
                error: createError(
                    'Failed to block user',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }

    /**
     * Unblock a user
     */
    async unblockUser(targetUserId: string): Promise<ServiceResponse<void>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {
                    success: false,
                    error: createError('User not authenticated', 'UNAUTHORIZED'),
                };
            }

            const { error } = await supabase
                .from('user_blocks')
                .delete()
                .eq('blocker_id', user.id)
                .eq('blocked_id', targetUserId);

            if (error) {
                return handleSupabaseError(null, error);
            }

            return { success: true, data: undefined };
        } catch (error) {
            return {
                success: false,
                error: createError(
                    'Failed to unblock user',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }

    /**
     * Check if a specific user is blocked
     */
    async isUserBlocked(targetUserId: string): Promise<ServiceResponse<boolean>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { success: true, data: false };
            }

            const { data, error } = await supabase
                .from('user_blocks')
                .select('id')
                .eq('blocker_id', user.id)
                .eq('blocked_id', targetUserId)
                .maybeSingle();

            if (error) {
                return handleSupabaseError(null, error);
            }

            return { success: true, data: !!data };
        } catch (error) {
            return {
                success: false,
                error: createError(
                    'Failed to check block status',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                ),
            };
        }
    }
}

export const blockService = new BlockService();
