import { useState, useEffect, useCallback } from 'react';
import {
  rankService,
  RankActionType,
  RankActionMetadata,
  PointsSummary,
} from '@/services';
import { AppError } from '@/types/errors';

export interface UseRankResult {
  tier: string;
  pointsTotal: number;
  seasonId: string;
  pointsToNextTier: number;
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
 * const { tier, pointsTotal, loading, awardForAction } = useRank();
 *
 * // Display current tier
 * <Text>{tier} - {pointsTotal} points</Text>
 *
 * // Award points after photo upload
 * await awardForAction('photo_upload', { photo_count: 1 });
 * ```
 */
export function useRank(): UseRankResult {
  const [tier, setTier] = useState<string>('---');
  const [pointsTotal, setPointsTotal] = useState(0);
  const [seasonId, setSeasonId] = useState('');
  const [pointsToNextTier, setPointsToNextTier] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);


  const fetchRank = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rankService.getMyRank();

      if (response.success && response.data) {
        setTier(response.data.tier);
        setPointsTotal(response.data.points_total);
        setSeasonId(response.data.season_id);
        setPointsToNextTier(response.data.points_to_next_tier);
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
          setTier(response.data.tier);
          setPointsTotal(response.data.newBalance);
          setSeasonId(response.data.season_id);
          setPointsToNextTier(response.data.points_to_next_tier);

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
    tier,
    pointsTotal,
    seasonId,
    pointsToNextTier,
    loading,
    error,
    refreshRank,
    awardForAction,
  };
}
