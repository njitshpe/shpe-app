import { supabase } from './supabase';
import type { Event, EventAttendance } from '../types/events';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

class EventsService {
  /**
   * Get event details by event_id (the simple ID from QR code)
   */
  async getEventByEventId(eventId: string): Promise<ServiceResponse<Event>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      return handleSupabaseError(data, error);
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to fetch event',
          'DATABASE_ERROR',
          undefined,
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  // Check if user has already checked into an event
  async hasCheckedIn(eventUuid: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('id')
        .eq('event_id', eventUuid)
        .eq('user_id', userId)
        .single();

      // PGRST116 = no rows returned (not an error, just not found)
      if (error && error.code !== 'PGRST116') {
        return {
          success: false,
          error: createError(
            'Failed to check attendance status',
            'DATABASE_ERROR',
            undefined,
            typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Unknown error'
          ),
        };
      }

      return { success: true, data: !!data };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to check attendance status',
          'DATABASE_ERROR',
          undefined,
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  // Validate if check-in is currently allowed for an event
  validateCheckInTime(event: Event): { valid: boolean; reason?: string } {
    const now = new Date();

    // Check if check-in window is specified
    if (event.check_in_opens) {
      const opensAt = new Date(event.check_in_opens);
      if (now < opensAt) {
        return {
          valid: false,
          reason: `Check-in opens at ${opensAt.toLocaleString()}`,
        };
      }
    }

    if (event.check_in_closes) {
      const closesAt = new Date(event.check_in_closes);
      if (now > closesAt) {
        return {
          valid: false,
          reason: 'Check-in period has closed',
        };
      }
    }

    // Default: allow check-in during event time
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) {
      return {
        valid: false,
        reason: 'Event has not started yet',
      };
    }

    if (now > endTime) {
      return {
        valid: false,
        reason: 'Event has already ended',
      };
    }

    return { valid: true };
  }

  // Check user into an event
  async checkInToEvent(
    eventId: string,
    userId: string,
    latitude?: number,
    longitude?: number
  ): Promise<ServiceResponse<{ attendance: EventAttendance; event: Event }>> {
    try {
      // 1. Get event details
      const eventResponse = await this.getEventByEventId(eventId);

      if (!eventResponse.success) {
        return {
          success: false,
          error: eventResponse.error,
        };
      }

      const event = eventResponse.data!;

      // 2. Check if already checked in
      const checkedInResponse = await this.hasCheckedIn(event.id, userId);

      if (!checkedInResponse.success) {
        return {
          success: false,
          error: checkedInResponse.error,
        };
      }

      if (checkedInResponse.data) {
        return {
          success: false,
          error: createError(
            'You have already checked in to this event',
            'ALREADY_CHECKED_IN'
          ),
        };
      }

      // 3. Validate check-in time
      const timeValidation = this.validateCheckInTime(event);
      if (!timeValidation.valid) {
        return {
          success: false,
          error: createError(
            timeValidation.reason || 'Check-in not allowed at this time',
            'CHECK_IN_CLOSED'
          ),
        };
      }

      // 4. Check max attendees (if specified)
      if (event.max_attendees) {
        const { count } = await supabase
          .from('event_attendance')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        if (count !== null && count >= event.max_attendees) {
          return {
            success: false,
            error: createError(
              'Event is at maximum capacity',
              'EVENT_FULL'
            ),
          };
        }
      }

      // 5. Create attendance record
      const { data: attendance, error: insertError } = await supabase
        .from('event_attendance')
        .insert({
          event_id: event.id,
          user_id: userId,
          check_in_method: 'qr_scan',
          latitude,
          longitude,
        })
        .select()
        .single();

      if (insertError) {
        return {
          success: false,
          error: createError(
            'Failed to check in. Please try again.',
            'DATABASE_ERROR',
            undefined,
            insertError.message
          ),
        };
      }

      return {
        success: true,
        data: { attendance, event },
      };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  // Get user's attendance history
  async getUserAttendance(userId: string): Promise<ServiceResponse<EventAttendance[]>> {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false });

      return handleSupabaseError(data, error);
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to fetch attendance history',
          'DATABASE_ERROR',
          undefined,
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }
}

export const eventsService = new EventsService();
