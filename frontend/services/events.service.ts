import { supabase } from '../lib/supabase';
import type { EventDB, EventAttendance } from '../types/events';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

// EventsService class provides methods for interacting with events in the database.
// It handles all database operations related to events and attendance.

class EventsService {
  // Note: Check-in functionality has been moved to checkInToken.service.ts
  // and validate-check-in edge function for improved security and offline support

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
