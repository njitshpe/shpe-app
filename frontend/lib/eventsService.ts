import { supabase } from './supabase';
import type { Event, EventAttendance, CheckInResponse } from '../types/events';

class EventsService {
  /**
   * Get event details by event_id (the simple ID from QR code)
   */
  async getEventByEventId(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getEventByEventId:', error);
      return null;
    }
  }

  /**
   * Check if user has already checked into an event
   */
  async hasCheckedIn(eventUuid: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('id')
        .eq('event_id', eventUuid)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows returned
        console.error('Error checking attendance:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasCheckedIn:', error);
      return false;
    }
  }

  /**
   * Validate if check-in is currently allowed for an event
   */
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

  /**
   * Check user into an event
   */
  async checkInToEvent(
    eventId: string,
    userId: string,
    latitude?: number,
    longitude?: number
  ): Promise<CheckInResponse> {
    try {
      // 1. Get event details
      const event = await this.getEventByEventId(eventId);

      if (!event) {
        return {
          success: false,
          error: 'Event not found',
          errorCode: 'EVENT_NOT_FOUND',
        };
      }

      // 2. Check if already checked in
      const alreadyCheckedIn = await this.hasCheckedIn(event.id, userId);

      if (alreadyCheckedIn) {
        return {
          success: false,
          error: 'You have already checked in to this event',
          errorCode: 'ALREADY_CHECKED_IN',
          event,
        };
      }

      // 3. Validate check-in time
      const timeValidation = this.validateCheckInTime(event);
      if (!timeValidation.valid) {
        return {
          success: false,
          error: timeValidation.reason || 'Check-in not allowed at this time',
          errorCode: 'CHECK_IN_CLOSED',
          event,
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
            error: 'Event is at maximum capacity',
            errorCode: 'EVENT_FULL',
            event,
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
        console.error('Error creating attendance:', insertError);
        return {
          success: false,
          error: 'Failed to check in. Please try again.',
          errorCode: 'UNAUTHORIZED',
        };
      }

      return {
        success: true,
        attendance,
        event,
      };
    } catch (error) {
      console.error('Error in checkInToEvent:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        errorCode: 'UNAUTHORIZED',
      };
    }
  }

  /**
   * Get user's attendance history
   */
  async getUserAttendance(userId: string): Promise<EventAttendance[]> {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error('Error fetching attendance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserAttendance:', error);
      return [];
    }
  }
}

export const eventsService = new EventsService();
