import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventData {
    name: string;
    description?: string;
    location?: string;
    location_name: string;
    start_time: string;
    end_time: string;
    check_in_opens?: string;
    check_in_closes?: string;
    max_attendees?: number;
    cover_image_url?: string;
    host_name?: string;
    tags?: string[];
    price_label?: string;
    latitude?: number;
    longitude?: number;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client with user's auth token
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
                    error: 'Unauthorized',
                    code: 'UNAUTHORIZED',
                }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Verify admin role (event_manager or super_admin)
        const { data: adminRoles, error: roleError } = await supabase
            .from('admin_roles')
            .select('id, role_type')
            .eq('user_id', user.id)
            .in('role_type', ['event_manager', 'super_admin'])
            .is('revoked_at', null)
            .limit(1);

        if (roleError || !adminRoles || adminRoles.length === 0) {
            console.error('Admin role check failed:', roleError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Forbidden: Event manager or super admin access required',
                    code: 'FORBIDDEN',
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Parse request body
        const { operation, eventId, data } = await req.json();

        console.log(`Admin operation: ${operation} by user ${user.id}`);

        // Route to appropriate handler
        switch (operation) {
            case 'create':
                return await createEvent(supabase, user.id, data);
            case 'update':
                return await updateEvent(supabase, user.id, eventId, data);
            case 'delete':
                return await deleteEvent(supabase, eventId);
            default:
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Invalid operation',
                        code: 'INVALID_OPERATION',
                    }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
        }
    } catch (error) {
        console.error('Edge function error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                code: 'INTERNAL_ERROR',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});

async function createEvent(
    supabase: any,
    userId: string,
    eventData: EventData
) {
    try {
        // Validate required fields
        if (!eventData.name || !eventData.location_name || !eventData.start_time || !eventData.end_time) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Missing required fields: name, location_name, start_time, end_time',
                    code: 'VALIDATION_ERROR',
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Validate dates
        const startTime = new Date(eventData.start_time);
        const endTime = new Date(eventData.end_time);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid date format',
                    code: 'VALIDATION_ERROR',
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        if (endTime <= startTime) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'End time must be after start time',
                    code: 'VALIDATION_ERROR',
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Generate unique event_id
        const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Insert event
        const { data, error } = await supabase
            .from('events')
            .insert({
                event_id: eventId,
                created_by: userId,
                is_active: true,
                is_archived: false,
                ...eventData,
            })
            .select()
            .single();

        if (error) {
            console.error('Event creation failed:', error);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: 'DATABASE_ERROR',
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`Event created: ${eventId} by user ${userId}`);

        return new Response(
            JSON.stringify({
                success: true,
                operation: 'create',
                event: data,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Create event error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                code: 'INTERNAL_ERROR',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
}

async function updateEvent(
    supabase: any,
    userId: string,
    eventId: string,
    eventData: Partial<EventData>
) {
    try {
        if (!eventId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Event ID is required',
                    code: 'VALIDATION_ERROR',
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Validate dates if provided
        if (eventData.start_time && eventData.end_time) {
            const startTime = new Date(eventData.start_time);
            const endTime = new Date(eventData.end_time);

            if (endTime <= startTime) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'End time must be after start time',
                        code: 'VALIDATION_ERROR',
                    }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        // Update event (updated_by and updated_at are handled by trigger)
        const { data, error } = await supabase
            .from('events')
            .update(eventData)
            .eq('event_id', eventId)
            .select()
            .single();

        if (error) {
            console.error('Event update failed:', error);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: error.code === 'PGRST116' ? 'EVENT_NOT_FOUND' : 'DATABASE_ERROR',
                }),
                {
                    status: error.code === 'PGRST116' ? 404 : 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`Event updated: ${eventId} by user ${userId}`);

        return new Response(
            JSON.stringify({
                success: true,
                operation: 'update',
                event: data,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Update event error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                code: 'INTERNAL_ERROR',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
}

async function deleteEvent(supabase: any, eventId: string) {
    try {
        if (!eventId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Event ID is required',
                    code: 'VALIDATION_ERROR',
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Hard delete - permanently remove the event
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('event_id', eventId);

        if (error) {
            console.error('Event deletion failed:', error);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message,
                    code: error.code === 'PGRST116' ? 'EVENT_NOT_FOUND' : 'DATABASE_ERROR',
                }),
                {
                    status: error.code === 'PGRST116' ? 404 : 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`Event deleted (hard): ${eventId}`);

        return new Response(
            JSON.stringify({
                success: true,
                operation: 'delete',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Delete event error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                code: 'INTERNAL_ERROR',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
}