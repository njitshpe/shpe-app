import { supabase } from '../lib/supabase';
import { UserProfile, normalizeProfileData } from '../types/userProfile';

export interface Registration {
  event_id: string; // The UUID
  user_id: string;
  rsvp_at: string;
  status: 'going' | 'maybe' | 'not_going';
}

export interface Attendee {
  user_id: string;
  rsvp_at: string;
  profile: UserProfile | null;
}

/**
 * Registration Service - Manages Event RSVPs
 * Uses Supabase table `event_attendance` for real-time tracking.
 * Handles resolution of Event Slug (text) -> Event ID (UUID).
 */
class RegistrationService {
  // Cache for slug -> uuid resolution to reduce DB calls
  private idCache: Record<string, string> = {};

  async register(eventSlug: string, answers: Record<string, string> = {}): Promise<void> {
    const userId = await this.getUserId();
    const eventUUID = await this.getEventUUID(eventSlug);

    if (!eventUUID) throw new Error('Invalid event ID');

    // Use upsert to handle re-registration
    const { error } = await supabase
      .from('event_attendance')
      .upsert({
        event_id: eventUUID,
        user_id: userId,
        rsvp_at: new Date().toISOString(),
        status: 'going',
        answers: answers
      }, {
        onConflict: 'event_id, user_id'
      });

    if (error) {
      console.error('Supabase RSVP failed:', error);
      throw new Error(error.message);
    }
  }

  private flattenProfileData(profile: any): UserProfile {
    if (!profile) return profile;
    const { profile_data, ...rest } = profile;
    const normalizedProfileData = normalizeProfileData(profile_data);
    return {
      ...rest,
      ...normalizedProfileData,
      profile_data: normalizedProfileData,
    } as UserProfile;
  }

  /**
   * Helper: Resolve Event Slug to UUID
   */
  private async getEventUUID(eventSlug: string): Promise<string | null> {
    // If it looks like a UUID, return it directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(eventSlug)) {
      return eventSlug;
    }

    // Check cache
    if (this.idCache[eventSlug]) {
      return this.idCache[eventSlug];
    }

    const { data, error } = await supabase
      .from('events')
      .select('id')
      .eq('event_id', eventSlug)
      .single();

    if (error || !data) {
      console.error('Failed to resolve event ID:', error);
      return null;
    }

    // Cache and return
    this.idCache[eventSlug] = data.id;
    return data.id;
  }

  /**
   * Get current authenticated user ID
   */
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }

  /**
   * Check if user is registered (RSVP'd) for an event
   */
  async isRegistered(eventSlug: string): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      const eventUUID = await this.getEventUUID(eventSlug);

      if (!eventUUID) return false;

      const { data, error } = await supabase
        .from('event_attendance')
        .select('status')
        .eq('event_id', eventUUID)
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid error on no rows

      if (error) {
        console.error('Error checking registration:', error);
        return false;
      }

      return data?.status === 'going' || data?.status === 'confirmed';
    } catch (error) {
      console.error('Failed to check registration:', error);
      return false;
    }
  }

  /**
   * Cancel registration (Un-RSVP)
   */
  async cancel(eventSlug: string): Promise<void> {
    const userId = await this.getUserId();
    const eventUUID = await this.getEventUUID(eventSlug);

    if (!eventUUID) return;

    const { error } = await supabase
      .from('event_attendance')
      .delete()
      .eq('event_id', eventUUID)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase cancel failed:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Get registration count for an event
   */
  async getRegistrationCount(eventSlug: string): Promise<number> {
    const eventUUID = await this.getEventUUID(eventSlug);
    if (!eventUUID) return 0;

    const { count, error } = await supabase
      .from('event_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventUUID)
      .eq('status', 'going');

    if (error) {
      console.error('Failed to get registration count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get list of attendees with their profiles
   * Used for "Who's Going" preview
   * Performs manual join for reliability
   */
  async getAttendees(eventSlug: string, limit = 5): Promise<Attendee[]> {
    const eventUUID = await this.getEventUUID(eventSlug);
    if (!eventUUID) return [];

    // 1. Get attendees list from attendance table
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('user_id, rsvp_at')
      .eq('event_id', eventUUID)
      .eq('status', 'going')
      .order('rsvp_at', { ascending: false })
      .limit(limit);

    if (attendanceError || !attendanceData || attendanceData.length === 0) {
      if (attendanceError) console.error('Failed to get attendees:', attendanceError);
      return [];
    }

    // 2. Extract user IDs
    const userIds = attendanceData.map(a => a.user_id);

    // 3. Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Failed to fetch attendee profiles:', profilesError);
      // Return without profiles if fetch fails
      return attendanceData.map(a => ({
        user_id: a.user_id,
        rsvp_at: a.rsvp_at,
        profile: null
      }));
    }

    // 4. Map profiles to a lookup object
    const profilesMap = new Map(
      profilesData?.map(p => [p.id, this.flattenProfileData(p)])
    );

    // 5. Combine data
    return attendanceData.map(a => ({
      user_id: a.user_id,
      rsvp_at: a.rsvp_at,
      profile: (profilesMap.get(a.user_id) as UserProfile) || null
    }));
  }
}

export const registrationService = new RegistrationService();
