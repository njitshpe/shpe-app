import { supabase } from '@/lib/supabase';
import { ServiceResponse, createError } from '@/types/errors';

export type QuestionType =
    | 'short_text'
    | 'long_text'
    | 'ucid'
    | 'phone'
    | 'file'
    | 'multi_select'
    | 'single_choice';

export interface EventQuestion {
    id: string;
    type: QuestionType;
    prompt: string;
    required: boolean;
    options?: string[];
}

/**
 * Data structure for creating a new event
 */
export interface CreateEventData {
    name: string;
    description?: string;
    location_name: string;
    location_address?: string; // Correct variable name
    start_time: string;
    end_time: string;
    cover_image_url?: string;
    tags?: string[];
    latitude?: number;
    longitude?: number;
    requires_rsvp: boolean; // Correct variable name
    event_limit?: number;

    // New Question interfaces
    registration_questions?: EventQuestion[];
}

class AdminEventsService {
    async createEvent(eventData: CreateEventData): Promise<ServiceResponse<any>> {
        try {
            // --- STRICT MAPPING LAYER ---
            const payload = {
                name: eventData.name,
                description: eventData.description,
                location_name: eventData.location_name,
                location_address: eventData.location_address,
                start_time: eventData.start_time,
                end_time: eventData.end_time,

                cover_image_url: eventData.cover_image_url,
                tags: eventData.tags,
                latitude: eventData.latitude,
                longitude: eventData.longitude,
                requires_rsvp: eventData.requires_rsvp,
                event_limit: eventData.event_limit,
                registration_questions: eventData.registration_questions || [],
            };

            const { data, error } = await supabase.functions.invoke('admin-event', {
                body: {
                    operation: 'create',
                    data: payload,
                },
            });

            if (error) {
                console.error('Event creation failed:', error);
                return {
                    success: false,
                    error: createError('Failed to create event', 'EVENT_CREATE_FAILED', undefined, error.message),
                };
            }

            if (!data?.success) {
                return {
                    success: false,
                    error: createError(data?.error || 'Failed to create event', data?.code || 'EVENT_CREATE_FAILED'),
                };
            }

            return { success: true, data: data.event };
        } catch (error) {
            console.error('Create event error:', error);
            return {
                success: false,
                error: createError('Failed to create event', 'UNKNOWN_ERROR', undefined, String(error)),
            };
        }
    }

    async updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<ServiceResponse<any>> {
        try {
            // Create the payload and map frontend names to database names
            const payload: any = { ...eventData };

            const { data, error } = await supabase.functions.invoke('admin-event', {
                body: {
                    operation: 'update',
                    eventId,
                    data: payload,
                },
            });

            if (error) {
                console.error('Edge Function Error:', error);
                return {
                    success: false,
                    error: createError('Failed to update event', 'EVENT_UPDATE_FAILED', undefined, error.message),
                };
            }

            if (!data?.success) {
                return {
                    success: false,
                    error: createError(data?.error || 'Failed to update event', data?.code || 'EVENT_UPDATE_FAILED'),
                };
            }

            return { success: true, data: data.event };
        } catch (error) {
            console.error('Update event catch block:', error);
            return {
                success: false,
                error: createError('Failed to update event', 'UNKNOWN_ERROR', undefined, String(error)),
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
                body: { operation: 'delete', eventId },
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error);
            return { success: true, data: undefined };
        } catch (error) {
            return { success: false, error: createError('Failed to delete event', 'EVENT_DELETE_FAILED', undefined, String(error)) };
        }
    }
}

export const adminEventsService = new AdminEventsService();