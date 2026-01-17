import { supabase } from '../lib/supabase';
import { ServiceResponse, createError } from '../types/errors';

/**
 * Data structure for creating a new event
 */
export interface CreateEventData {
    name: string;
    description?: string;
    location_name: string;
    location_address?: string; // Was 'location'
    start_time: string;
    end_time: string;
    cover_image_url?: string;
    tags?: string[];
    latitude?: number;
    longitude?: number;
    registration_questions?: any[];
}

/**
 * AdminEventsService - Manages admin event CRUD operations
 * 
 * All operations require admin privileges and are performed via the admin-event Edge Function.
 * This ensures proper authorization and audit logging.
 */
class AdminEventsService {
    /**
     * Create a new event
     * 
     * @param eventData - Event data to create
     * @returns ServiceResponse with created event data
     */
    async createEvent(eventData: CreateEventData): Promise<ServiceResponse<any>> {
        try {
            const { data, error } = await supabase.functions.invoke('admin-event', {
                body: {
                    operation: 'create',
                    data: eventData,
                },
            });

            if (error) {
                console.error('Event creation failed:', error);
                return {
                    success: false,
                    error: createError(
                        'Failed to create event',
                        'EVENT_CREATE_FAILED',
                        undefined,
                        error.message
                    ),
                };
            }

            if (!data?.success) {
                return {
                    success: false,
                    error: createError(
                        data?.error || 'Failed to create event',
                        data?.code || 'EVENT_CREATE_FAILED'
                    ),
                };
            }

            return { success: true, data: data.event };
        } catch (error) {
            console.error('Create event error:', error);
            return {
                success: false,
                error: createError(
                    'Failed to create event',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : String(error)
                ),
            };
        }
    }

    /**
     * Update an existing event
     * 
     * @param eventId - Event ID to update (the simple event_id, not UUID)
     * @param eventData - Partial event data to update
     * @returns ServiceResponse with updated event data
     */
    async updateEvent(
        eventId: string,
        eventData: Partial<CreateEventData>
    ): Promise<ServiceResponse<any>> {
        try {
            const { data, error } = await supabase.functions.invoke('admin-event', {
                body: {
                    operation: 'update',
                    eventId,
                    data: eventData,
                },
            });

            if (error) {
                console.error('Event update failed:', error);
                return {
                    success: false,
                    error: createError(
                        'Failed to update event',
                        'EVENT_UPDATE_FAILED',
                        undefined,
                        error.message
                    ),
                };
            }

            if (!data?.success) {
                return {
                    success: false,
                    error: createError(
                        data?.error || 'Failed to update event',
                        data?.code || 'EVENT_UPDATE_FAILED'
                    ),
                };
            }

            return { success: true, data: data.event };
        } catch (error) {
            console.error('Update event error:', error);
            return {
                success: false,
                error: createError(
                    'Failed to update event',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : String(error)
                ),
            };
        }
    }

    /**
     * Delete an event (hard delete as per new schema policy for 'delete' or just setting valid deleted_at if soft-delete is preferred, 
     * but schema supports hard delete via standard delete call. The edge function currently implements HARD DELETE based on recent code view, 
     * or at least the code I just wrote does).
     * 
     * @param eventId - Event ID to delete (the simple event_id, not UUID)
     * @returns ServiceResponse indicating success
     */
    async deleteEvent(eventId: string): Promise<ServiceResponse<void>> {
        try {
            const { data, error } = await supabase.functions.invoke('admin-event', {
                body: {
                    operation: 'delete',
                    eventId,
                },
            });

            if (error) {
                console.error('Event deletion failed:', error);
                return {
                    success: false,
                    error: createError(
                        'Failed to delete event',
                        'EVENT_DELETE_FAILED',
                        undefined,
                        error.message
                    ),
                };
            }

            console.log('Delete event response:', data);

            if (!data?.success) {
                console.error('Delete event failed with response:', data);
                return {
                    success: false,
                    error: createError(
                        data?.error || 'Failed to delete event',
                        data?.code || 'EVENT_DELETE_FAILED',
                        undefined,
                        data?.error
                    ),
                };
            }

            return { success: true, data: undefined };
        } catch (error) {
            console.error('Delete event error:', error);
            return {
                success: false,
                error: createError(
                    'Failed to delete event',
                    'UNKNOWN_ERROR',
                    undefined,
                    error instanceof Error ? error.message : String(error)
                ),
            };
        }
    }
}

export const adminEventsService = new AdminEventsService();
