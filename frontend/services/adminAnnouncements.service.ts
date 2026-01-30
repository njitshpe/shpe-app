import { supabase } from '../lib/supabase';
import { ServiceResponse, createError } from '../types/errors';

class AdminAnnouncementsService {
    /**
     * Send a manual announcement to all users with push tokens.
     * @param title - The title of the notification (default: "Announcement")
     * @param message - The body/message content
     */
    async sendAnnouncement(title: string, message: string): Promise<ServiceResponse<void>> {
        try {
            const { data, error } = await supabase.functions.invoke('push-notifications', {
                body: {
                    type: 'ANNOUNCEMENT',
                    title,
                    body: message,
                },
            });

            if (error) {
                console.error('Announcement Error:', error);
                return {
                    success: false,
                    error: createError(error.message || 'Failed to send announcement', 'NOTIFICATION_FAILED')
                };
            }

            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData.user) {
                return {
                    success: false,
                    error: createError(
                        'Announcement sent but user session is missing',
                        'AUTH_ERROR',
                        undefined,
                        authError?.message
                    ),
                };
            }

            const { error: insertError } = await supabase
                .from('feed_posts')
                .insert({
                    user_id: authData.user.id,
                    title: title.trim(),
                    content: message.trim(),
                    image_urls: [],
                    event_id: null,
                    is_active: true,
                    is_announcement: true,
                });

            if (insertError) {
                console.error('Announcement insert error:', insertError);
                return {
                    success: false,
                    error: createError(
                        insertError.message || 'Failed to save announcement',
                        'DATABASE_ERROR'
                    ),
                };
            }

            // Check if the function itself returned an error in the JSON response
            // (Wait, invoke handles HTTP errors, but func might return explicit { error: ... })
            // Our function returns standard Response objects. supabase-js parses them.
            // If the function returns 4xx/5xx, invoke throws an error or returns verifyable error? 
            // supabase.functions.invoke normally handles non-2xx as error property unless specific config.

            return { success: true, data: undefined };
        } catch (error: any) {
            console.error('Exception sending announcement:', error);
            return {
                success: false,
                error: createError(error.message || 'Network error sending announcement', 'UNKNOWN_ERROR')
            };
        }
    }
}

export const adminAnnouncementsService = new AdminAnnouncementsService();
