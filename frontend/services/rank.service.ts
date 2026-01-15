import { supabase } from '../lib/supabase';
import {
  ServiceResponse,
  createError,
  mapSupabaseError,
} from '../types/errors';

/**
 * Action types that can trigger points awards (aligned with point_rules table)
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
 * Source types for points transactions
 */
export type PointsSourceType = 'event' | 'post' | 'profile' | 'admin';

/**
 * Photo types for multipliers
 */
export type PhotoType = 'alumni' | 'professional' | 'member_of_month';

/**
 * Metadata payload for award action requests
 * Fields are optional and depend on actionType
 */
export interface RankActionMetadata {
  /** User ID (required for idempotency key generation) */
  userId?: string;
  /** Event ID for event-related actions */
  event_id?: string;
  /** Post ID for post-related actions */
  post_id?: string;
  /** Feedback ID for general feedback submissions */
  feedback_id?: string;
  /** Photo type for photo_upload multipliers */
  photoType?: PhotoType;
  /** Photo URL for storage reference */
  photoUrl?: string;
  /** Minutes early for early_checkin multiplier */
  minutes_early?: number;
  /** Additional context for audit logging */
  [key: string]: unknown;
}

/**
 * User's current points summary (from points_balances + rank_tiers)
 */
export interface PointsSummary {
  season_id: string;
  points_total: number;
  tier: string;
  points_to_next_tier: number;
}

/**
 * Result from awarding points via the award_points RPC
 * Extends PointsSummary with success flag
 */
export interface AwardPointsResult extends PointsSummary {
  success: true;
}

/**
 * Generates a deterministic idempotency key for point transactions.
 * This prevents duplicate awards for the same action.
 *
 * Format: `${actionType}:${sourceType}:${sourceId}:${userId}`
 *
 * @param actionType - The action being performed
 * @param sourceType - The source entity type (event, post, profile, admin)
 * @param sourceId - The source entity ID (event_id, post_id, etc.) or null
 * @param userId - The user receiving points
 * @returns A deterministic idempotency key string
 */
export function generateIdempotencyKey(
  actionType: RankActionType,
  sourceType: PointsSourceType,
  sourceId: string | null | undefined,
  userId: string
): string {
  return `${actionType}:${sourceType}:${sourceId ?? 'none'}:${userId}`;
}

/**
 * Checks if a string is a valid UUID v4
 */
function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

/**
 * Maps action types to their corresponding source types
 */
function getSourceTypeForAction(
  actionType: RankActionType,
  metadata: RankActionMetadata
): PointsSourceType {
  switch (actionType) {
    case 'event_check_in':
    case 'rsvp':
    case 'early_checkin':
      return 'event';
    case 'feed_post':
    case 'photo_upload':
      return 'post';
    case 'profile_completed':
      return 'profile';
    case 'feedback':
      // Feedback is event-scoped only if event_id is a valid UUID
      return metadata.event_id && isUuid(metadata.event_id) ? 'event' : 'profile';
    default:
      return 'profile';
  }
}

/**
 * Extracts the source ID from metadata based on action type
 */
function getSourceIdFromMetadata(
  actionType: RankActionType,
  metadata: RankActionMetadata
): string | null {
  switch (actionType) {
    case 'event_check_in':
    case 'rsvp':
    case 'early_checkin':
      return metadata.event_id ?? null;
    case 'feedback':
      // Use event_id only if it's a valid UUID, otherwise fall back to feedback_id
      return metadata.event_id && isUuid(metadata.event_id)
        ? metadata.event_id
        : (metadata.feedback_id ?? null);
    case 'feed_post':
    case 'photo_upload':
      return metadata.post_id ?? null;
    case 'profile_completed':
      return null;
    default:
      return null;
  }
}

/**
 * Rank Service - Manages user rank and points
 *
 * All business logic is handled by the Supabase award_points RPC.
 * This service is presentation-layer only - it calls the RPC
 * and returns parsed responses.
 */
class RankService {
  /**
   * Get current user ID from Supabase auth or use a stub for development
   */
  private async getUserId(): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return user.id;
      }
    } catch (error) {
      console.log('Auth check failed:', error);
    }
    return null;
  }

  /**
   * Award points for a specific action
   * Calls the award_points RPC which handles all business logic including:
   * - Rule validation (action_type exists in point_rules)
   * - Anti-abuse checks (per_event_cap, cooldown_seconds, daily_cap)
   * - Idempotency (duplicate transactions are silently ignored)
   * - Balance updates (via trigger)
   *
   * @param actionType - The type of action being performed
   * @param metadata - Additional data for the action (event_id, post_id, etc.)
   * @returns ServiceResponse with updated rank data or error
   */
  async awardForAction(
    actionType: RankActionType,
    metadata: RankActionMetadata = {}
  ): Promise<ServiceResponse<AwardPointsResult>> {
    const userId = await this.getUserId();

    if (!userId) {
      return {
        success: false,
        error: createError(
          'You must be logged in to earn points.',
          'UNAUTHORIZED'
        ),
      };
    }

    try {
      // Determine source type and ID based on action
      const sourceType = getSourceTypeForAction(actionType, metadata);
      let sourceId = getSourceIdFromMetadata(actionType, metadata);

      // Validate sourceId is a UUID; nullify if not (p_source_id must be uuid)
      if (sourceId && !isUuid(sourceId)) {
        console.warn(
          `[RankService] Invalid sourceId for action="${actionType}", sourceId="${sourceId}" is not a UUID. Setting to null.`
        );
        sourceId = null;
      }

      // Generate deterministic idempotency key
      const idempotencyKey = generateIdempotencyKey(
        actionType,
        sourceType,
        sourceId,
        userId
      );

      // Build metadata object for the RPC (exclude internal fields)
      const rpcMetadata: Record<string, unknown> = { ...metadata };
      delete rpcMetadata.userId;

      // If event_id is not a UUID, move it to qr_code for audit purposes
      if (
        typeof rpcMetadata.event_id === 'string' &&
        !isUuid(rpcMetadata.event_id)
      ) {
        // Only set qr_code if not already present
        if (!rpcMetadata.qr_code) {
          rpcMetadata.qr_code = rpcMetadata.event_id;
        }
        delete rpcMetadata.event_id;
      }

      console.log('[award_points payload]', {
        actionType,
        sourceType,
        sourceId,
        idempotencyKey,
        meta_event_id: rpcMetadata.event_id,
        meta_feedback_id: rpcMetadata.feedback_id,
      });

      // Call the award_points RPC
      const { data, error } = await supabase.rpc('award_points', {
        p_action_type: actionType,
        p_source_type: sourceType,
        p_idempotency_key: idempotencyKey,
        p_source_id: sourceId ?? null,
        p_metadata: rpcMetadata,
      });

      if (error) {
        const errorMessage = error.message || 'Unknown error';
        console.error(
          `[RankService] award_points failed for action="${actionType}":`,
          errorMessage
        );

        // Map specific error patterns to user-friendly messages
        if (errorMessage.includes('Unknown action_type')) {
          return {
            success: false,
            error: createError(
              `This action is not configured for points.`,
              'INVALID_ACTION_TYPE',
              undefined,
              `action=${actionType}: ${errorMessage}`
            ),
          };
        }

        if (errorMessage.includes('disabled')) {
          return {
            success: false,
            error: createError(
              `Points for this action are temporarily disabled.`,
              'ACTION_DISABLED',
              undefined,
              `action=${actionType}: ${errorMessage}`
            ),
          };
        }

        if (
          errorMessage.includes('cap reached') ||
          errorMessage.includes('cap exceeded') ||
          errorMessage.includes('Cooldown active')
        ) {
          return {
            success: false,
            error: createError(
              'You have reached the points limit for this action. Try again later.',
              'RATE_LIMITED',
              undefined,
              `action=${actionType}: ${errorMessage}`
            ),
          };
        }

        // Default: surface the actual error message for debugging
        return {
          success: false,
          error: createError(
            `Could not award points: ${errorMessage}`,
            'RANK_UPDATE_FAILED',
            undefined,
            `action=${actionType}: ${errorMessage}`
          ),
        };
      }

      // RPC returns array of rows, get first result
      const result: PointsSummary | null = Array.isArray(data)
        ? data[0]
        : data;

      if (!result) {
        console.error(
          `[RankService] award_points returned empty for action="${actionType}"`
        );
        return {
          success: false,
          error: createError(
            'No response from points system. Please try again.',
            'RANK_UPDATE_FAILED',
            undefined,
            `action=${actionType}: empty response`
          ),
        };
      }

      // Map RPC response to AwardPointsResult
      return {
        success: true,
        data: {
          success: true,
          season_id: result.season_id,
          points_total: result.points_total,
          tier: result.tier,
          points_to_next_tier: result.points_to_next_tier,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[RankService] award_points exception for action="${actionType}":`,
        errorMessage
      );
      return {
        success: false,
        error: createError(
          `Could not award points: ${errorMessage}`,
          'RANK_UPDATE_FAILED',
          undefined,
          `action=${actionType}: ${errorMessage}`
        ),
      };
    }
  }

  /**
   * Compute current season_id using same logic as compute_season_id SQL function:
   * Spring = Jan-May, Summer = Jun-Aug, Fall = Sep-Dec
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
   * Fetches from points_balances and rank_tiers separately (no join)
   *
   * @returns ServiceResponse with current points summary or error
   */
  async getMyRank(): Promise<ServiceResponse<PointsSummary>> {
    // Fetch fresh auth state (not cached)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[getMyRank] auth error or no user:', authError);
      return {
        success: false,
        error: createError(
          'You must be logged in to view your rank.',
          'UNAUTHORIZED'
        ),
      };
    }

    const userId = user.id;
    const seasonId = this.computeSeasonId(new Date());
    console.log(`[getMyRank] userId=${userId} seasonId=${seasonId}`);

    try {
      // Debug: fetch ALL balances for this user (no season filter)
      const { data: allBalances } = await supabase
        .from('points_balances')
        .select('season_id, points_total, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      console.log(`[getMyRank] balancesByUser=${JSON.stringify(allBalances)}`);

      // Query points_balances for current user + season
      const { data: balanceData, error: balanceError } = await supabase
        .from('points_balances')
        .select('season_id, points_total')
        .eq('user_id', userId)
        .eq('season_id', seasonId)
        .maybeSingle();

      console.log(
        `[getMyRank] currentSeasonRow=${JSON.stringify(balanceData)} error=${balanceError ? JSON.stringify(balanceError) : 'null'}`
      );

      if (balanceError) {
        console.error('[getMyRank] Failed to fetch points_balances:', balanceError);
        return {
          success: false,
          error: mapSupabaseError(balanceError),
        };
      }

      const pointsTotal = balanceData?.points_total ?? 0;
      if (!balanceData) {
        console.log('[getMyRank] No row found for season, returning points_total=0');
      }

      // Query rank_tiers (flat table, no FK)
      const { data: tiers, error: tiersError } = await supabase
        .from('rank_tiers')
        .select('tier, min_points, sort_order')
        .order('min_points', { ascending: true });

      if (tiersError) {
        console.error('[getMyRank] Failed to fetch rank_tiers:', tiersError);
        return {
          success: false,
          error: mapSupabaseError(tiersError),
        };
      }

      // Compute tier: highest tier where min_points <= points_total
      let tier = 'unranked';
      let pointsToNextTier = 0;

      if (tiers && tiers.length > 0) {
        for (let i = 0; i < tiers.length; i++) {
          if (tiers[i].min_points <= pointsTotal) {
            tier = tiers[i].tier;
          } else {
            // This tier is the next one; compute points needed
            pointsToNextTier = tiers[i].min_points - pointsTotal;
            break;
          }
        }
      }

      const result = {
        season_id: seasonId,
        points_total: pointsTotal,
        tier,
        points_to_next_tier: pointsToNextTier,
      };
      console.log('[getMyRank] returning=', JSON.stringify(result));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[getMyRank] exception:', error);
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * Get points summary for a specific user (for viewing other profiles)
   *
   * @param userId - The user ID to fetch points for
   * @returns ServiceResponse with points summary or error
   */
  async getUserRank(userId: string): Promise<ServiceResponse<PointsSummary>> {
    try {
      const seasonId = this.computeSeasonId();

      // Query points_balances for user + season
      const { data: balanceData, error: balanceError } = await supabase
        .from('points_balances')
        .select('season_id, points_total')
        .eq('user_id', userId)
        .eq('season_id', seasonId)
        .maybeSingle();

      if (balanceError) {
        return {
          success: false,
          error: mapSupabaseError(balanceError),
        };
      }

      const pointsTotal = balanceData?.points_total ?? 0;

      // Query rank_tiers (flat table, no FK)
      const { data: tiers, error: tiersError } = await supabase
        .from('rank_tiers')
        .select('tier, min_points, sort_order')
        .order('min_points', { ascending: true });

      if (tiersError) {
        return {
          success: false,
          error: mapSupabaseError(tiersError),
        };
      }

      // Compute tier: highest tier where min_points <= points_total
      let tier = 'unranked';
      let pointsToNextTier = 0;

      if (tiers && tiers.length > 0) {
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
}

export const rankService = new RankService();
