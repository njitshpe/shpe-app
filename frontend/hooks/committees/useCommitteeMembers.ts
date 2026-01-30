import { useState, useEffect, useCallback } from 'react';
import { CommitteeMember, CommitteeMembersData } from '@/types/committeeMember';
import { committeeService } from '@/services';

/**
 * Hook to fetch committee members
 * @param committeeSlug - The committee slug (e.g., 'external-vp', 'marketing')
 * @returns CommitteeMembersData with members list, count, loading state, and error
 */
export function useCommitteeMembers(committeeSlug: string): CommitteeMembersData {
  const [data, setData] = useState<Omit<CommitteeMembersData, 'refetch'>>({
    totalCount: 0,
    members: [],
    isLoading: true,
    error: null,
  });

  const fetchMembers = useCallback(async () => {
    let mounted = true;

    try {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch count and list in parallel
      const [count, membersData] = await Promise.all([
        committeeService.getMemberCount(committeeSlug),
        committeeService.getMembers(committeeSlug, 50)
      ]);

      if (mounted) {
        // Map service data to UI format
        const members: CommitteeMember[] = membersData.map(m => ({
          id: m.user_id,
          name: m.profile ? `${m.profile.first_name} ${m.profile.last_name}` : 'SHPE Member',
          avatarUrl: m.profile?.profile_picture_url || undefined,
          major: (m.profile as any)?.major || undefined,
          year: (m.profile as any)?.year || undefined,
          role: 'Member',
          joinedAt: m.created_at,
        }));

        setData({
          totalCount: count,
          members,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error fetching committee members:', error);
      if (mounted) {
        setData({
          totalCount: 0,
          members: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load members',
        });
      }
    }

    return () => {
      mounted = false;
    };
  }, [committeeSlug]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    ...data,
    refetch: fetchMembers,
  };
}
