import { supabase } from '@/lib/supabase';
import { ServiceResponse, mapSupabaseError } from '@/types/errors';
import { normalizeProfileData, UserProfile } from '@/types/userProfile';
import { getCommitteeInfo, CommitteeId } from '@/utils/committeeUtils';

export interface PendingCommitteeRequest {
  committee_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  created_at: string;
  application: Record<string, any> | null;
  committee_slug: string | null;
  committee_title: string;
  user_profile: UserProfile | null;
}

class AdminCommitteeService {
  async getPendingRequests(): Promise<ServiceResponse<PendingCommitteeRequest[]>> {
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select('committee_id, user_id, status, created_at, application')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return { success: true, data: [] };

      const committeeIds = Array.from(new Set(data.map((row: any) => row.committee_id)));
      const userIds = Array.from(new Set(data.map((row: any) => row.user_id)));

      const [{ data: committeesData, error: committeesError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase.from('committees').select('id, slug').in('id', committeeIds),
          supabase.from('user_profiles').select('*').in('id', userIds),
        ]);

      if (committeesError) throw committeesError;
      if (profilesError) throw profilesError;

      const committeesById = new Map(
        (committeesData || []).map((committee: any) => [committee.id, committee])
      );
      const profilesById = new Map(
        (profilesData || []).map((profile: any) => [profile.id, profile])
      );

      const requests = data.map((row: any) => {
        const committee = committeesById.get(row.committee_id);
        const slug = committee?.slug ?? null;
        const committeeInfo = slug ? getCommitteeInfo(slug as CommitteeId) : null;
        const rawProfile = profilesById.get(row.user_id) || null;
        const normalizedProfile = rawProfile ? normalizeProfileData(rawProfile.profile_data) : null;

        return {
          committee_id: row.committee_id,
          user_id: row.user_id,
          status: row.status,
          created_at: row.created_at,
          application: row.application ?? null,
          committee_slug: slug,
          committee_title: committeeInfo?.title || slug || 'Committee',
          user_profile: rawProfile
            ? ({
                ...rawProfile,
                ...normalizedProfile,
                profile_data: normalizedProfile,
              } as UserProfile)
            : null,
        } as PendingCommitteeRequest;
      });

      return { success: true, data: requests };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  }

  async processRequest(
    committeeId: string,
    userId: string,
    action: 'approve' | 'reject'
  ): Promise<ServiceResponse<boolean>> {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('committee_members')
        .update({
          status: newStatus,
          decided_at: new Date().toISOString(),
        })
        .eq('committee_id', committeeId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
  }
}

export const adminCommitteeService = new AdminCommitteeService();
