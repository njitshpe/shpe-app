import { supabase } from '@/lib/supabase';
import { ServiceResponse, mapSupabaseError } from '../types/errors';
import { rankService, PointsSummary } from './rank.service';
import { EventDB } from '../types/events';
import { normalizeProfileData, UserProfile } from '@/types/userProfile';

export interface RSVPCardData {
  attendance_id: string;
  user_id: string;
  user_profile: UserProfile & { 
    linkedin_url?: string | null; 
    resume_url?: string | null; 
  };
  registration_answers: Record<string, any>;
  rank_data: PointsSummary;
  applied_at: string;
}

export interface PendingEventSummary {
  event: EventDB;
  pending_count: number;
}

const calculateTierFromPoints = (points: number): string => {
  if (points >= 1000) return 'Diamond';
  if (points >= 500) return 'Platinum';
  if (points >= 300) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Bronze';
};

class AdminRSVPService {
  // 1. GET PENDING EVENTS (Unchanged)
  async getEventsWithPendingRequests(): Promise<ServiceResponse<PendingEventSummary[]>> {
    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendance')
        .select('event_id')
        .eq('status', 'pending');

      if (attendanceError) throw attendanceError;
      if (!attendanceData || attendanceData.length === 0) return { success: true, data: [] };

      const countsByEvent: Record<string, number> = {};
      attendanceData.forEach((row) => {
        countsByEvent[row.event_id] = (countsByEvent[row.event_id] || 0) + 1;
      });

      const eventIds = Object.keys(countsByEvent);
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds) 
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      const result: PendingEventSummary[] = (events as any[]).map((event) => ({
        event: { ...event, title: event.name },
        pending_count: countsByEvent[event.id],
      }));
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  }

  // 2. GET THE "SWIPE DECK"
  async getPendingRSVPsForEvent(eventId: string): Promise<ServiceResponse<RSVPCardData[]>> {
    try {
      console.log("------------------------------------------------");
      console.log("🔍 FETCHING RSVPS FOR EVENT ID:", eventId);

      let actualUUID = eventId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      
      if (!isUUID) {
        const { data: eventData } = await supabase
          .from('events')
          .select('id, event_id')
          .or(`event_id.eq.${eventId}, id.eq.${eventId}`)
          .single();
        if (eventData) actualUUID = eventData.id;
        else return { success: true, data: [] };
      }

      // --- FETCH ATTENDANCE ---
      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', actualUUID)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!attendanceData || attendanceData.length === 0) return { success: true, data: [] };

      const userIds = attendanceData.map((row) => row.user_id);
      
      // --- DEBUG LOGS ---
      console.log("👥 User IDs found:", userIds);

      // --- FETCH PROFILES ---
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      const profileMap: Record<string, any> = {};
      if (profilesData) {
        profilesData.forEach((p) => { profileMap[p.id] = p; });
      }

      // --- FETCH POINTS (Directly from points_balances) ---
      const { data: pointsData, error: pointsError } = await supabase
        .from('points_balances')
        .select('user_id, points_total')
        .in('user_id', userIds);

      // 🔥 LOGGING THE RESULT TO CHECK RLS 🔥
      if (pointsError) console.error("❌ Points Fetch Error:", pointsError);
      console.log("💰 POINTS DATA FROM DB:", pointsData);

      const pointsMap: Record<string, number> = {};
      if (pointsData) {
        pointsData.forEach((row) => {
          // If user has multiple rows, take the largest points_total
          const currentMax = pointsMap[row.user_id] || 0;
          if (row.points_total > currentMax) {
            pointsMap[row.user_id] = row.points_total;
          }
        });
      }

      // --- ASSEMBLE CARDS ---
      const cards: RSVPCardData[] = attendanceData.map((row: any) => {
        const rawProfile = profileMap[row.user_id] || { 
          first_name: "Unknown", last_name: "User", email: "No Profile Found" 
        };

        const normalizedData = normalizeProfileData(rawProfile.profile_data);
        const linkedin = normalizedData.linkedin_url || rawProfile.linkedin_url || null;
        const resume = normalizedData.resume_url || rawProfile.resume_url || null;

        // Points Logic
        const realPoints = pointsMap[row.user_id] || 0;
        const calculatedTier = calculateTierFromPoints(realPoints);

        const rankData: PointsSummary = {
            season_id: 'current',
            points_total: realPoints,
            tier: calculatedTier,
            points_to_next_tier: 0
        };

        // Answer Logic (Handle string or JSON)
        let finalAnswers = row.answers || row.registration_answers || {};
        if (typeof finalAnswers === 'string') {
          try { finalAnswers = JSON.parse(finalAnswers); } 
          catch (e) { finalAnswers = {}; }
        }

        return {
          attendance_id: row.id,
          user_id: row.user_id,
          user_profile: { ...rawProfile, linkedin_url: linkedin, resume_url: resume },
          registration_answers: finalAnswers,
          rank_data: rankData,
          applied_at: row.created_at,
        };
      });

      return { success: true, data: cards };

    } catch (error) {
      console.error("💥 SERVICE ERROR:", error);
      return { success: false, error: mapSupabaseError(error) };
    }
  }

  // 3. PROCESS SWIPE (Unchanged)
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
      return { success: false, error: mapSupabaseError(error) };
    }
  }

  // 4. GLOBAL COUNT (Unchanged)
  async getTotalPendingCount(): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('event_attendance')
        .select('*', { count: 'exact', head: true }) 
        .eq('status', 'pending');
      if (error) throw error;
      return { success: true, data: count || 0 };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  }
}

export const adminRSVPService = new AdminRSVPService();