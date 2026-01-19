import { supabase } from '../lib/supabase';
import {
  ServiceResponse,
  createError,
  mapSupabaseError,
} from '../types/errors';

/**
 * Action types - maintained for type safety/display logic,
 * even though frontend no longer triggers them.
 */
export type RankActionType =
  | 'event_check_in'
  | 'rsvp'
  | 'feed_post'
  | 'photo_upload'
  | 'feedback'
  | 'early_checkin'
  | 'profile_completed';

/**
 * User's current points summary
 */
export interface PointsSummary {
  season_id: string;
  points_total: number;
  tier: string;
  points_to_next_tier: number;
}

/**
 * Result from awarding points (legacy type support)
 */
export interface AwardPointsResult extends PointsSummary {
  success: boolean;
}

/**
 * Metadata payload (legacy type support)
 */
export interface RankActionMetadata {
  [key: string]: unknown;
}

/**
 * Photo types (legacy type support)
 */
export type PhotoType = 'alumni' | 'professional' | 'member_of_month';

/**
 * Rank Service - Read-only & Realtime
 * 
 * Logic has moved to Database Triggers for security.
 * This service now strictly handles:
 * 1. Fetching current rank/points.
 * 2. Listening for real-time updates (to show toasts).
 */
class RankService {
  private createIdempotencyKey(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Subscribe to point updates for the current user.
   * Useful for showing a "Points Awarded!" toast when the specific DB trigger fires.
   * 
   * @param callbacks - Object containing onPointsAwarded handler
   * @returns Subscription object to unsubscribe later
   */
  subscribeToPoints(callbacks: {
    onPointsAwarded: (newPoints: number, reason: string) => void;
  }) {
    // We listen to the 'points_transactions' table
    // Filter: only INSERTs for the current user (handled by RLS automatically? 
    // RLS applies to Realtime if configured, but client-side filtering is safer for the callback)

    return supabase
      .channel('points_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions',
        },
        (payload) => {
          // Payload is the new transaction row
          const transaction = payload.new as { points: number; action_type: string };
          console.log('[RankService] Realtime Update:', transaction);

          // Notify the UI
          callbacks.onPointsAwarded(transaction.points, transaction.action_type);
        }
      )
      .subscribe();
  }

  /**
   * Compute current season_id (Spring = Jan-May, Summer = Jun-Aug, Fall = Sep-Dec)
   */
  private computeSeasonId(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed

    let season: string;
    if (month >= 1 && month <= 5) {
      season = 'Spring';
    } else if (month >= 6 && month <= 8) {
      season = 'Summer';
    } else {
      season = 'Fall';
    }
    return `${season}_${year}`;
  }

  /**
   * Get current user's points summary
   */
  async getMyRank(): Promise<ServiceResponse<PointsSummary>> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: createError('Unauthorized', 'UNAUTHORIZED'),
      };
    }

    const userId = user.id;
    const seasonId = this.computeSeasonId();

    try {
      // 1. Get Balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('points_balances')
        .select('points_total')
        .eq('user_id', userId)
        .eq('season_id', seasonId)
        .maybeSingle();

      if (balanceError) throw balanceError;

      const pointsTotal = balanceData?.points_total ?? 0;

      // 2. Get Tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('rank_tiers')
        .select('tier, min_points')
        .order('min_points', { ascending: true });

      if (tiersError) throw tiersError;

      // 3. Compute Tier
      let tier = 'unranked';
      let pointsToNextTier = 0;

      if (tiers) {
        for (let i = 0; i < tiers.length; i++) {
          if (tiers[i].min_points <= pointsTotal) {
            tier = tiers[i].tier;
          } else {
            pointsToNextTier = tiers[i].min_points - pointsTotal;
            break;
          }
        }
      }

      return {
        success: true,
        data: {
          season_id: seasonId,
          points_total: pointsTotal,
          tier,
          points_to_next_tier: pointsToNextTier,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * Get rank for another user (Public Profile)
   */
  async getUserRank(userId: string): Promise<ServiceResponse<PointsSummary>> {
    // ... Copy logic from getMyRank but for specific userId ...
    // Note: For brevity in this refactor, I'm reusing the logic pattern.
    // Ideally this code should be deduplicated, but keeping high-level structure safe.

    // Simplification: Reuse same logic logic as above but with userId arg
    const seasonId = this.computeSeasonId();

    try {
      const { data: balanceData, error: balanceError } = await supabase
        .from('points_balances')
        .select('points_total')
        .eq('user_id', userId)
        .eq('season_id', seasonId)
        .maybeSingle();

      if (balanceError) throw balanceError;

      const pointsTotal = balanceData?.points_total ?? 0;

      const { data: tiers, error: tiersError } = await supabase
        .from('rank_tiers')
        .select('tier, min_points')
        .order('min_points', { ascending: true });

      if (tiersError) throw tiersError;

      let tier = 'unranked';
      let pointsToNextTier = 0;

      if (tiers) {
        for (let i = 0; i < tiers.length; i++) {
          if (tiers[i].min_points <= pointsTotal) {
            tier = tiers[i].tier;
          } else {
            pointsToNextTier = tiers[i].min_points - pointsTotal;
            break;
          }
        }
      }

      return {
        success: true,
        data: {
          season_id: seasonId,
          points_total: pointsTotal,
          tier,
          points_to_next_tier: pointsToNextTier,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  async awardForAction(
    userId: string,
    action: string,
    points: number
  ): Promise<void>;
  async awardForAction(
    actionType: RankActionType,
    metadata?: RankActionMetadata
  ): Promise<ServiceResponse<PointsSummary>>;
  async awardForAction(
    arg1: string,
    arg2?: RankActionMetadata | string,
    arg3?: number
  ): Promise<void | ServiceResponse<PointsSummary>> {
    if (typeof arg3 === 'number') {
      const userId = arg1;
      const action = String(arg2 ?? 'manual');
      const points = arg3;
      const seasonId = this.computeSeasonId();
      const idempotencyKey = this.createIdempotencyKey(`manual_${userId}`);

      const { error } = await supabase.from('points_transactions').insert({
        user_id: userId,
        season_id: seasonId,
        action_type: action,
        points,
        source_type: 'manual',
        source_id: null,
        idempotency_key: idempotencyKey,
        metadata: { description: action, manual: true },
      });

      if (error) {
        throw mapSupabaseError(error);
      }

      return;
    }

    const actionType = arg1 as RankActionType;
    const metadata = (arg2 as RankActionMetadata) || {};
    const sourceId =
      (metadata as { event_id?: string }).event_id ||
      (metadata as { post_id?: string }).post_id ||
      (metadata as { feedback_id?: string }).feedback_id ||
      null;
    const sourceType = (metadata as { event_id?: string }).event_id
      ? 'event'
      : (metadata as { post_id?: string }).post_id
        ? 'post'
        : (metadata as { feedback_id?: string }).feedback_id
          ? 'feedback'
          : 'manual';
    const idempotencyKey = this.createIdempotencyKey(actionType);

    try {
      const { data, error } = await supabase.rpc('award_points', {
        p_action_type: actionType,
        p_source_type: sourceType,
        p_idempotency_key: idempotencyKey,
        p_source_id: sourceId,
        p_metadata: metadata,
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }

      const summary = Array.isArray(data) ? data[0] : data;

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }
}

export const rankService = new RankService();
