import { useState, useEffect, useCallback } from 'react';
import { committeeService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';

export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'revoked' | null;

export interface CommitteeMembershipData {
  status: MembershipStatus;
  isApproved: boolean;
  isPending: boolean;
  isLoading: boolean;
  error: string | null;
  requestToJoin: (answers?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  cancelRequest: () => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

/**
 * Hook to check and manage user's membership status for a committee
 * @param committeeSlug - The committee slug (e.g., 'external-vp', 'marketing')
 * @returns CommitteeMembershipData with status, loading state, and actions
 */
export function useCommitteeMembership(committeeSlug: string): CommitteeMembershipData {
  const { user } = useAuth();
  const [status, setStatus] = useState<MembershipStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await committeeService.getUserMembershipStatus(committeeSlug, user.id);
      setStatus(result?.status ?? null);
    } catch (err) {
      console.error('Error fetching membership status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check membership');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [committeeSlug, user?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const requestToJoin = useCallback(async (answers?: Record<string, any>) => {
    if (!user?.id) {
      return { success: false, error: 'Not logged in' };
    }

    const result = await committeeService.requestToJoin(committeeSlug, user.id, answers);
    if (result.success) {
      setStatus('pending');
    }
    return result;
  }, [committeeSlug, user?.id]);

  const cancelRequest = useCallback(async () => {
    if (!user?.id) {
      return { success: false, error: 'Not logged in' };
    }

    const result = await committeeService.cancelRequest(committeeSlug, user.id);
    if (result.success) {
      setStatus(null);
    }
    return result;
  }, [committeeSlug, user?.id]);

  return {
    status,
    isApproved: status === 'approved',
    isPending: status === 'pending',
    isLoading,
    error,
    requestToJoin,
    cancelRequest,
    refetch: fetchStatus,
  };
}
