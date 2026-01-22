import { supabase } from '../lib/supabase';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

export type RoleType = 'event_manager' | 'super_admin';

export interface AdminRole {
  id: string;
  user_id: string;
  role_type: RoleType;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  notes: string | null;
}

/**
 * Service for managing admin roles
 * Uses the manage-admin-roles edge function with service role access
 */
class AdminRoleService {
  private readonly FUNCTION_NAME = 'manage-admin-roles';

  /**
   * Grant an admin role to a user
   */
  async grantRole(
    userId: string,
    roleType: RoleType,
    notes?: string
  ): Promise<ServiceResponse<void>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: createError('User not authenticated', 'UNAUTHORIZED'),
        };
      }

      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          action: 'grant',
          userId,
          roleType,
          notes,
        },
      });

      if (error) {
        return handleSupabaseError<void>(null, error);
      }

      if (!data.success) {
        return {
          success: false,
          error: createError(
            data.error || 'Failed to grant role',
            data.code || 'FUNCTION_ERROR'
          ),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to grant admin role',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }

  /**
   * Revoke an admin role from a user
   */
  async revokeRole(
    userId: string,
    roleType: RoleType,
    notes?: string
  ): Promise<ServiceResponse<void>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: createError('User not authenticated', 'UNAUTHORIZED'),
        };
      }

      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          action: 'revoke',
          userId,
          roleType,
          notes,
        },
      });

      if (error) {
        return handleSupabaseError<void>(null, error);
      }

      if (!data.success) {
        return {
          success: false,
          error: createError(
            data.error || 'Failed to revoke role',
            data.code || 'FUNCTION_ERROR'
          ),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to revoke admin role',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }

  /**
   * List all admin roles
   * @param includeRevoked Whether to include revoked roles (default: false)
   */
  async listRoles(includeRevoked: boolean = false): Promise<ServiceResponse<AdminRole[]>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: createError('User not authenticated', 'UNAUTHORIZED'),
        };
      }

      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          action: 'list',
          includeRevoked,
        },
      });

      if (error) {
        return handleSupabaseError<AdminRole[]>(null, error);
      }

      if (!data.success) {
        return {
          success: false,
          error: createError(
            data.error || 'Failed to list roles',
            data.code || 'FUNCTION_ERROR'
          ),
        };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to list admin roles',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }
}

export const adminRoleService = new AdminRoleService();
