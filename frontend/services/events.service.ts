import { supabase } from '../lib/supabase';
import type { EventDB, EventAttendance } from '../types/events';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

// EventsService class provides methods for interacting with events in the database.
// It handles all database operations related to events and attendance.

class EventsService {
  // Note: Check-in functionality has been moved to checkInToken.service.ts
  // and validate-check-in edge function for improved security and offline support

  async getUpcomingEvents(): Promise<ServiceResponse<EventDB[]>> {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('end_time', nowIso) // Include events that are currently happening
        .order('start_time', { ascending: true });

      return handleSupabaseError(data, error);
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to fetch upcoming events',
          'DATABASE_ERROR',
          undefined,
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  async getUserUpcomingEvents(userId: string): Promise<ServiceResponse<EventDB[]>> {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendance!inner(status, user_id)')
        .eq('event_attendance.user_id', userId)
        .in('event_attendance.status', ['going', 'confirmed'])
        .eq('is_active', true)
        .gte('end_time', nowIso) // Include events that are currently happening
        .order('start_time', { ascending: true });

      if (error) {
        return handleSupabaseError(null, error);
      }

      const events = (data ?? []).map((row: any) => {
        const { event_attendance, ...event } = row;
        return event as EventDB;
      });

      return { success: true, data: events };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to fetch your upcoming events',
          'DATABASE_ERROR',
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
