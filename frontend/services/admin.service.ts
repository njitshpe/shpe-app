import { supabase } from '../lib/supabase';
import { ServiceResponse, createError } from '../types/errors';

/**
 * AdminService - Manages admin role checking and permissions
 * 
 * Provides methods to check if users have admin privileges.
 * Results are cached to minimize database queries, they are not permanent for security.
 */
class AdminService {
    private adminStatusCache: Map<string, { isAdmin: boolean; timestamp: number }> = new Map();
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Check if a user has admin privileges
     * 
     * @param userId - Optional user ID to check. If not provided, checks current user
     * @returns ServiceResponse with boolean indicating admin status
     */
    async isUserAdmin(userId?: string): Promise<ServiceResponse<boolean>> {
        try {
            let targetUserId = userId;

            // If no userId provided, get current user
            if (!targetUserId) {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    return { success: true, data: false };
                }
                targetUserId = user.id;
            }

            // Check cache first
            const cached = this.adminStatusCache.get(targetUserId);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return { success: true, data: cached.isAdmin };
            }

            // Query admin_roles table
            const { data, error } = await supabase
                .from('admin_roles')
                .select('id, role_type')
                .eq('user_id', targetUserId)
                .is('revoked_at', null)
                .maybeSingle();

            if (error) {
                console.error('Admin check failed:', error);
                return {
                    success: false,
                    error: createError(
                        'Failed to check admin status',
                        'DATABASE_ERROR',
                        undefined,
                        error.message
                    ),
                };
            }

            const isAdmin = !!data;

            // Update cache
            this.adminStatusCache.set(targetUserId, {
                isAdmin,
                timestamp: Date.now(),
            });

            return { success: true, data: isAdmin };
        } catch (error) {
            console.error('Admin check error:', error);
            return {
                success: false,
                error: createError(
                    'Failed to check admin status',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : String(error)
                ),
            };
        }
    }

    /**
     * Get current user's admin status
     * Convenience method that calls isUserAdmin() without parameters
     */
    async isCurrentUserAdmin(): Promise<ServiceResponse<boolean>> {
        return this.isUserAdmin();
    }

    /**
     * Clear the admin status cache
     * Useful after role changes or when forcing a fresh check
     */
    clearCache() {
        this.adminStatusCache.clear();
    }

    /**
     * Clear cache for a specific user
     * 
     * @param userId - User ID to clear from cache
     */
    clearUserCache(userId: string) {
        this.adminStatusCache.delete(userId);
    }
}

export const adminService = new AdminService();
