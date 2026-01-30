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
    private superAdminStatusCache: Map<string, { isSuperAdmin: boolean; timestamp: number }> = new Map();
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
            // Use limit(1) instead of maybeSingle() to avoid errors with multiple roles
            // Only check for valid role types: event_manager and super_admin
            const { data, error } = await supabase
                .from('admin_roles')
                .select('id, role_type')
                .eq('user_id', targetUserId)
                .in('role_type', ['event_manager', 'super_admin'])
                .is('revoked_at', null)
                .limit(1);

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

            const isAdmin = data && data.length > 0;

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
     * Check if a user has super admin privileges
     *
     * @param userId - Optional user ID to check. If not provided, checks current user
     * @returns ServiceResponse with boolean indicating super admin status
     */
    async isUserSuperAdmin(userId?: string): Promise<ServiceResponse<boolean>> {
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
            const cached = this.superAdminStatusCache.get(targetUserId);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return { success: true, data: cached.isSuperAdmin };
            }

            // Query admin_roles table for super_admin role specifically
            const { data, error } = await supabase
                .from('admin_roles')
                .select('id, role_type')
                .eq('user_id', targetUserId)
                .eq('role_type', 'super_admin')
                .is('revoked_at', null)
                .limit(1);

            if (error) {
                console.error('Super admin check failed:', error);
                return {
                    success: false,
                    error: createError(
                        'Failed to check super admin status',
                        'DATABASE_ERROR',
                        undefined,
                        error.message
                    ),
                };
            }

            const isSuperAdmin = data && data.length > 0;

            // Update cache
            this.superAdminStatusCache.set(targetUserId, {
                isSuperAdmin,
                timestamp: Date.now(),
            });

            return { success: true, data: isSuperAdmin };
        } catch (error) {
            console.error('Super admin check error:', error);
            return {
                success: false,
                error: createError(
                    'Failed to check super admin status',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : String(error)
                ),
            };
        }
    }

    /**
     * Get current user's super admin status
     * Convenience method that calls isUserSuperAdmin() without parameters
     */
    async isCurrentUserSuperAdmin(): Promise<ServiceResponse<boolean>> {
        return this.isUserSuperAdmin();
    }

    /**
     * Clear the admin status cache
     * Useful after role changes or when forcing a fresh check
     */
    clearCache() {
        this.adminStatusCache.clear();
        this.superAdminStatusCache.clear();
    }

    /**
     * Clear cache for a specific user
     *
     * @param userId - User ID to clear from cache
     */
    clearUserCache(userId: string) {
        this.adminStatusCache.delete(userId);
        this.superAdminStatusCache.delete(userId);
    }
}

export const adminService = new AdminService();
