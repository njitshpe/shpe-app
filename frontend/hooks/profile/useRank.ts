import { useState, useEffect, useCallback } from 'react';
import {
  rankService,
  RankActionType,
  RankActionMetadata,
  UserRankData,
} from '@/services';
import { UserRank } from '@/types/userProfile';
import { AppError } from '@/types/errors';

export interface UseRankResult {
  rank: UserRank;
  rankPoints: number;
  loading: boolean;
  error: AppError | null;
  refreshRank: () => Promise<void>;
  awardForAction: (
    actionType: RankActionType,
    metadata?: RankActionMetadata
  ) => Promise<{
    success: boolean;
    pointsAwarded?: number;
    error?: AppError;
  }>;
}

/**
 * Hook to manage user rank state
 *
 * Provides current rank/points data and methods to refresh and award points.
 * All business logic is handled server-side by the update-rank Edge Function.
 *
 * @example
 * ```tsx
 * const { rank, rankPoints, loading, awardForAction } = useRank();
 *
 * // Display current rank
 * <Text>{rank} - {rankPoints} points</Text>
 *
 * // Award points after photo upload
 * await awardForAction('photo_upload', { photo_count: 1 });
 * ```
 */
export function useRank(): UseRankResult {
  const [rank, setRank] = useState<UserRank>('unranked');
  const [rankPoints, setRankPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);


  const fetchRank = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rankService.getMyRank();

      if (response.success && response.data) {
        setRank(response.data.rank);
        setRankPoints(response.data.rank_points);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error('Failed to fetch rank:', err);
      setError({
        message: 'Failed to load rank data.',
        code: 'UNKNOWN_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, []);


  const refreshRank = useCallback(async () => {
    await fetchRank();
  }, [fetchRank]);

  const awardForAction = useCallback(
    async (
      actionType: RankActionType,
      metadata: RankActionMetadata = {}
    ): Promise<{
      success: boolean;
      pointsAwarded?: number;
      error?: AppError;
    }> => {
      try {
        setLoading(true);
        setError(null);

        const response = await rankService.awardForAction(actionType, metadata);

        if (response.success && response.data) {
          setRank(response.data.rank);
          setRankPoints(response.data.newBalance);

          return {
            success: true,
            pointsAwarded: response.data.transaction.amount,
          };
        } else {
          setError(response.error || null);
          return {
            success: false,
            error: response.error,
          };
        }
      } catch (err) {
        console.error('Failed to award points:', err);
        const appError: AppError = {
          message: 'Failed to award points.',
          code: 'RANK_UPDATE_FAILED',
        };
        setError(appError);
        return {
          success: false,
          error: appError,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  return {
    rank,
    rankPoints,
    loading,
    error,
    refreshRank,
    awardForAction,
  };
}
