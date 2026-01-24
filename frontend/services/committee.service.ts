import { supabase } from '../lib/supabase';
import { UserProfile, normalizeProfileData } from '../types/userProfile';

export interface CommitteeMemberRow {
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  created_at: string;
  decided_at: string | null;
  profile: UserProfile | null;
}

/**
 * Committee Service - Manages Committee Membership
 * Uses Supabase tables `committees` and `committee_members`
 */
class CommitteeService {
  // Cache for slug -> uuid resolution
  private idCache: Record<string, string> = {};

  /**
   * Helper: Resolve Committee Slug to UUID
   */
  private async getCommitteeUUID(committeeSlug: string): Promise<string | null> {
    // If it looks like a UUID, return it directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(committeeSlug)) {
      return committeeSlug;
    }

    // Check cache
    if (this.idCache[committeeSlug]) {
      return this.idCache[committeeSlug];
    }

    const { data, error } = await supabase
      .from('committees')
      .select('id')
      .eq('slug', committeeSlug)
      .single();

    if (error || !data) {
      console.error('Failed to resolve committee ID:', error);
      return null;
    }

    // Cache and return
    this.idCache[committeeSlug] = data.id;
    return data.id;
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
   * Get count of approved members in a committee
   */
  async getMemberCount(committeeSlug: string): Promise<number> {
    const committeeUUID = await this.getCommitteeUUID(committeeSlug);
    if (!committeeUUID) return 0;

    const { count, error } = await supabase
      .from('committee_members')
      .select('*', { count: 'exact', head: true })
      .eq('committee_id', committeeUUID)
      .eq('status', 'approved');

    if (error) {
      console.error('Failed to get member count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get list of approved committee members with their profiles
   */
  async getMembers(committeeSlug: string, limit = 50): Promise<CommitteeMemberRow[]> {
    const committeeUUID = await this.getCommitteeUUID(committeeSlug);
    if (!committeeUUID) return [];

    // 1. Get approved members from committee_members table
    const { data: membersData, error: membersError } = await supabase
      .from('committee_members')
      .select('user_id, status, created_at, decided_at')
      .eq('committee_id', committeeUUID)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (membersError || !membersData || membersData.length === 0) {
      if (membersError) console.error('Failed to get committee members:', membersError);
      return [];
    }

    // 2. Extract user IDs
    const userIds = membersData.map(m => m.user_id);

    // 3. Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Failed to fetch member profiles:', profilesError);
      // Return without profiles if fetch fails
      return membersData.map(m => ({
        user_id: m.user_id,
        status: m.status,
        created_at: m.created_at,
        decided_at: m.decided_at,
        profile: null
      }));
    }

    // 4. Map profiles to a lookup object
    const profilesMap = new Map(
      profilesData?.map(p => [p.id, this.flattenProfileData(p)])
    );

    // 5. Combine data
    return membersData.map(m => ({
      user_id: m.user_id,
      status: m.status,
      created_at: m.created_at,
      decided_at: m.decided_at,
      profile: (profilesMap.get(m.user_id) as UserProfile) || null
    }));
  }

  /**
   * Get the current user's membership status for a committee
   * Returns null if user is not a member (never applied)
   */
  async getUserMembershipStatus(
    committeeSlug: string,
    userId: string
  ): Promise<{ status: 'pending' | 'approved' | 'rejected' | 'revoked'; createdAt: string } | null> {
    const committeeUUID = await this.getCommitteeUUID(committeeSlug);
    if (!committeeUUID) return null;

    const { data, error } = await supabase
      .from('committee_members')
      .select('status, created_at')
      .eq('committee_id', committeeUUID)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Not found = user hasn't applied
      return null;
    }

    return {
      status: data.status,
      createdAt: data.created_at,
    };
  }

  /**
   * Request to join a committee (creates a pending membership)
   */
  async requestToJoin(
    committeeSlug: string,
    userId: string,
    answers?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    const committeeUUID = await this.getCommitteeUUID(committeeSlug);
    if (!committeeUUID) {
      return { success: false, error: 'Committee not found' };
    }

    const { error } = await supabase
      .from('committee_members')
      .insert({
        committee_id: committeeUUID,
        user_id: userId,
        status: 'pending',
        application: answers ?? null,
      });

    if (error) {
      console.error('Failed to request committee membership:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Cancel a pending membership request
   */
  async cancelRequest(committeeSlug: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const committeeUUID = await this.getCommitteeUUID(committeeSlug);
    if (!committeeUUID) {
      return { success: false, error: 'Committee not found' };
    }

    const { error } = await supabase
      .from('committee_members')
      .delete()
      .eq('committee_id', committeeUUID)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Failed to cancel membership request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}

export const committeeService = new CommitteeService();
