import { supabase } from '../lib/supabase';
import { ServiceResponse, createError, mapSupabaseError } from '../types/errors';
import { rankService, PointsSummary } from './rank.service';
import { EventDB } from '../types/events';
import { UserProfile } from '../types/userProfile';

// Type for the "Card" used in the Swipe UI
export interface RSVPCardData {
  attendance_id: string;
  user_id: string;
  user_profile: UserProfile;
  registration_answers: Record<string, any>; // The answers to the questions
  rank_data: PointsSummary;
  applied_at: string;
}

// Type for the Event Selector list
export interface PendingEventSummary {
  event: EventDB;
  pending_count: number;
}

class AdminRSVPService {
  /**
   * 1. GET PENDING EVENTS
   * Fetches only events that have at least one pending RSVP.
   * Used for the "Choose Event" screen.
   */
  async getEventsWithPendingRequests(): Promise<ServiceResponse<PendingEventSummary[]>> {
    try {
      // Step 1: Get all pending attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendance')
        .select('event_id')
        .eq('status', 'pending');

      if (attendanceError) throw attendanceError;

      if (!attendanceData || attendanceData.length === 0) {
        return { success: true, data: [] };
      }

      // Step 2: Calculate counts per event
      const countsByEvent: Record<string, number> = {};
      attendanceData.forEach((row) => {
        countsByEvent[row.event_id] = (countsByEvent[row.event_id] || 0) + 1;
      });

      const eventIds = Object.keys(countsByEvent);

      // Step 3: Fetch details for these specific events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds) 
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Step 4: Merge event data with counts
      const result: PendingEventSummary[] = (events as any[]).map((event) => ({
        event: {
            ...event,
            // 💡 HELPFUL HINT: 
            // If your UI expects "title", but DB has "name", we can polyfill it here:
            title: event.name, 
        },
        pending_count: countsByEvent[event.id], // changed from event.event_id to event.id
      }));

      return { success: true, data: result };

    } catch (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * 2. GET THE "SWIPE DECK"
   * Fetches all pending users for a specific event, including their profile and rank.
   */
  /**
   * 2. GET THE "SWIPE DECK" (MANUAL JOIN VERSION)
   * Fetches attendance and profiles separately to avoid Foreign Key errors.
   */
  async getPendingRSVPsForEvent(eventId: string): Promise<ServiceResponse<RSVPCardData[]>> {
    try {
      console.log("------------------------------------------------");
      console.log("🔍 FETCHING RSVPS FOR EVENT ID:", eventId);

      let actualUUID = eventId;

      // 1️⃣ TRANSLATION STEP (Slug -> UUID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      if (!isUUID) {
        const { data: eventData } = await supabase
          .from('events')
          .select('id, event_id')
          .or(`event_id.eq.${eventId}, id.eq.${eventId}`)
          .single();

        if (eventData) {
          actualUUID = eventData.id;
        } else {
          return { success: true, data: [] };
        }
      }

      // 2️⃣ FETCH ATTENDANCE (No Join yet)
      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .select('*') // Just get raw attendance data
        .eq('event_id', actualUUID)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (!attendanceData || attendanceData.length === 0) {
        return { success: true, data: [] };
      }

      // 3️⃣ FETCH PROFILES MANUALLY
      // Extract all user IDs from the attendance list
      const userIds = attendanceData.map((row) => row.user_id);

      // Fetch all profiles that match these IDs
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds); // Assuming 'user_id' is the column name in profiles table

      // Create a quick lookup map (ID -> Profile)
      const profileMap: Record<string, any> = {};
      if (profilesData) {
        profilesData.forEach((p) => {
          profileMap[p.user_id] = p;
        });
      }

      // 4️⃣ MERGE & FETCH RANK
      const cards: RSVPCardData[] = await Promise.all(
        attendanceData.map(async (row: any) => {
          const rankResponse = await rankService.getUserRank(row.user_id);
          
          const defaultRank: PointsSummary = {
            season_id: '',
            points_total: 0,
            tier: 'Unranked',
            points_to_next_tier: 0
          };

          // Grab profile from our manual map, or use fallback
          const userProfile = profileMap[row.user_id] || { 
            first_name: "Unknown", 
            last_name: "User", 
            email: "No Profile Found" 
          };

          return {
            attendance_id: row.id,
            user_id: row.user_id,
            user_profile: userProfile, 
            registration_answers: row.registration_answers || {},
            rank_data: rankResponse.success && rankResponse.data ? rankResponse.data : defaultRank,
            applied_at: row.created_at,
          };
        })
      );

      return { success: true, data: cards };

    } catch (error) {
      console.error("💥 CRASH IN SERVICE:", error);
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * 3. PROCESS SWIPE (APPROVE/REJECT)
   * Updates the status of a specific attendance record.
   */
  async processRSVP(attendanceId: string, action: 'approve' | 'reject'): Promise<ServiceResponse<boolean>> {
    try {
      const newStatus = action === 'approve' ? 'confirmed' : 'rejected';

      const { error } = await supabase
        .from('event_attendance')
        .update({ status: newStatus })
        .eq('id', attendanceId);

      if (error) throw error;

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * 4. GET GLOBAL COUNT (FOR RED DOT)
   * Returns the total number of pending requests across all events.
   */
  async getTotalPendingCount(): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('event_attendance')
        .select('*', { count: 'exact', head: true }) // head: true means don't return data, just count
        .eq('status', 'pending');

      if (error) throw error;

      return { success: true, data: count || 0 };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  }
}

export const adminRSVPService = new AdminRSVPService();