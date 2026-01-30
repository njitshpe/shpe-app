import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RoleType = 'event_manager' | 'super_admin';

interface GrantRoleRequest {
    action: 'grant';
    userId: string;
    roleType: RoleType;
    notes?: string;
}

interface RevokeRoleRequest {
    action: 'revoke';
    userId: string;
    roleType: RoleType;
    notes?: string;
}

interface ListRolesRequest {
    action: 'list';
    includeRevoked?: boolean;
}

type AdminRoleRequest = GrantRoleRequest | RevokeRoleRequest | ListRolesRequest;

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client with user's auth token for verification
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        // Verify authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Unauthorized: Invalid or missing authentication token',
                    code: 'UNAUTHORIZED',
                }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Verify the requesting user is a super admin
        // Use limit(1) to avoid maybeSingle() errors with multiple roles
        const { data: adminRoles, error: roleError } = await supabase
            .from('admin_roles')
            .select('id, role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'super_admin')
            .is('revoked_at', null)
            .limit(1);

        // ENFORCE: Only super_admin role type can manage roles
        if (roleError || !adminRoles || adminRoles.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Forbidden: Super admin access required to manage roles',
                    code: 'FORBIDDEN',
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Parse request body
        const requestData: AdminRoleRequest = await req.json();

        // Create service role client for admin operations
        const serviceSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Route based on action
        switch (requestData.action) {
            case 'grant': {
                const { userId, roleType, notes } = requestData;

                // Validate role type
                const validRoleTypes: RoleType[] = ['event_manager', 'super_admin'];
                if (!validRoleTypes.includes(roleType)) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: `Invalid role type. Must be one of: ${validRoleTypes.join(', ')}`,
                            code: 'INVALID_INPUT',
                        }),
                        {
                            status: 400,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                // Check if user already has this active role
                const { data: existingRole } = await serviceSupabase
                    .from('admin_roles')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('role_type', roleType)
                    .is('revoked_at', null)
                    .maybeSingle();

                if (existingRole) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: `User already has active ${roleType} role`,
                            code: 'ROLE_ALREADY_EXISTS',
                        }),
                        {
                            status: 400,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                // Grant the role
                const { error: grantError } = await serviceSupabase
                    .from('admin_roles')
                    .insert({
                        user_id: userId,
                        role_type: roleType,
                        granted_by: user.id,
                        notes: notes || null,
                    });

                if (grantError) {
                    console.error('Error granting role:', grantError);
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Failed to grant role',
                            code: 'DATABASE_ERROR',
                            details: grantError.message,
                        }),
                        {
                            status: 500,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `Successfully granted ${roleType} role to user`,
                    }),
                    {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }

            case 'revoke': {
                const { userId, roleType, notes } = requestData;

                // Find the active role
                const { data: roleToRevoke } = await serviceSupabase
                    .from('admin_roles')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('role_type', roleType)
                    .is('revoked_at', null)
                    .maybeSingle();

                if (!roleToRevoke) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: `User does not have active ${roleType} role`,
                            code: 'ROLE_NOT_FOUND',
                        }),
                        {
                            status: 404,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                // Prevent revoking your own admin role
                if (userId === user.id) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Cannot revoke your own admin role',
                            code: 'FORBIDDEN',
                        }),
                        {
                            status: 403,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                // Revoke the role (soft delete)
                const updateData: any = {
                    revoked_at: new Date().toISOString(),
                };

                // Append to notes if provided
                if (notes) {
                    const currentNotes = await serviceSupabase
                        .from('admin_roles')
                        .select('notes')
                        .eq('id', roleToRevoke.id)
                        .single();

                    updateData.notes = currentNotes.data?.notes
                        ? `${currentNotes.data.notes}\n\nRevoked: ${notes}`
                        : `Revoked: ${notes}`;
                }

                const { error: revokeError } = await serviceSupabase
                    .from('admin_roles')
                    .update(updateData)
                    .eq('id', roleToRevoke.id);

                if (revokeError) {
                    console.error('Error revoking role:', revokeError);
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Failed to revoke role',
                            code: 'DATABASE_ERROR',
                            details: revokeError.message,
                        }),
                        {
                            status: 500,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `Successfully revoked ${roleType} role from user`,
                    }),
                    {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }

            case 'list': {
                const { includeRevoked } = requestData;

                let query = serviceSupabase
                    .from('admin_roles')
                    .select(`
                        id,
                        user_id,
                        role_type,
                        granted_by,
                        granted_at,
                        revoked_at,
                        notes
                    `)
                    .order('granted_at', { ascending: false });

                if (!includeRevoked) {
                    query = query.is('revoked_at', null);
                }

                const { data: roles, error: listError } = await query;

                if (listError) {
                    console.error('Error listing roles:', listError);
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Failed to list roles',
                            code: 'DATABASE_ERROR',
                            details: listError.message,
                        }),
                        {
                            status: 500,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        data: roles,
                    }),
                    {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }

            default:
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Invalid action. Must be one of: grant, revoke, list',
                        code: 'INVALID_ACTION',
                    }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
