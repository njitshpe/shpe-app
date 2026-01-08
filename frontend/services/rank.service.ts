import { supabase } from '../lib/supabase';
import {
  ServiceResponse,
  createError,
  mapSupabaseError,
} from '../types/errors';
import { UserRank, getRankFromPoints } from '../types/userProfile';

/**
 * Action types that can trigger points awards (aligned with award-points Edge Function)
 */
export type RankActionType =
  | 'attendance'
  | 'feedback'
  | 'photo_upload'
  | 'rsvp'
  | 'early_checkin'
  | 'committee_setup'
  | 'verified'
  | 'college_year';

/**
 * Photo types for multipliers
 */
export type PhotoType = 'alumni' | 'professional' | 'member_of_month';

/**
 * Metadata payload for award action requests
 * Fields are optional and depend on actionType
 */
export interface RankActionMetadata {
  /** Event ID for event-related actions */
  event_id?: string;
  /** Photo type for photo_upload multipliers */
  photoType?: PhotoType;
  /** Photo URL for storage reference */
  photoUrl?: string;
  /** User's college year for college_year action */
  college_year?: number;
  /** Minutes early for early_checkin multiplier */
  minutes_early?: number;
  /** Whether user is a committee member - required for committee_setup */
  committee_member?: boolean;
  /** Additional context for audit logging */
  [key: string]: unknown;
}

/**
 * Response from the award-points Edge Function
 */
export interface RankUpdateResponse {
  success: true;
  transaction: {
    id: string;
    userId: string;
    amount: number;
    reason: string;
    createdAt: string;
  };
  newBalance: number;
  rank: UserRank;
  reasons: string[];
}

/**
 * User's current rank data
 */
export interface UserRankData {
  rank_points: number;
  rank: UserRank;
}

/**
 * Rank Service - Manages user rank and points
 *
 * All business logic is handled by the Supabase Edge Function.
 * This service is presentation-layer only - it calls the Edge Function
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
   * Calls the award-points Edge Function which handles all business logic
   *
   * @param actionType - The type of action being performed
   * @param metadata - Additional data for the action (event_id, photoType, committee_member, etc.)
   * @returns ServiceResponse with updated rank data or error
   */
  async awardForAction(
    actionType: RankActionType,
    metadata: RankActionMetadata = {}
  ): Promise<ServiceResponse<RankUpdateResponse>> {
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
      const { data, error } = await supabase.functions.invoke('award-points', {
        body: {
          userId: userId,
          actionType: actionType,
          eventId: metadata.event_id,
          metadata,
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        return {
          success: false,
          error: createError(
            'Failed to award points. Please try again.',
            'RANK_UPDATE_FAILED',
            undefined,
            error.message
          ),
        };
      }

      if (data?.success === false) {
        return {
          success: false,
          error: createError(
            data.error || 'Failed to award points.',
            (data.code as any) || 'RANK_UPDATE_FAILED',
            undefined,
            data.debug || data.error
          ),
        };
      }

      return {
        success: true,
        data: data as RankUpdateResponse,
      };
    } catch (error) {
      console.error('Points award failed:', error);
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * Get current user's rank and points
   * Fetches directly from user_profiles table
   *
   * @returns ServiceResponse with current rank data or error
   */
  async getMyRank(): Promise<ServiceResponse<UserRankData>> {
    const userId = await this.getUserId();

    if (!userId) {
      return {
        success: false,
        error: createError(
          'You must be logged in to view your rank.',
          'UNAUTHORIZED'
        ),
      };
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('rank_points, rank')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch rank:', error);
        return {
          success: false,
          error: mapSupabaseError(error),
        };
      }

      // Handle case where rank columns don't exist yet or are null
      const rankPoints = data?.rank_points ?? 0;
      const rank = (data?.rank as UserRank) ?? getRankFromPoints(rankPoints);

      return {
        success: true,
        data: {
          rank_points: rankPoints,
          rank: rank,
        },
      };
    } catch (error) {
      console.error('Failed to fetch rank:', error);
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * Get rank data for a specific user (for viewing other profiles)
   *
   * @param userId - The user ID to fetch rank for
   * @returns ServiceResponse with rank data or error
   */
  async getUserRank(userId: string): Promise<ServiceResponse<UserRankData>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('rank_points, rank')
        .eq('id', userId)
        .single();

      if (error) {
        return {
          success: false,
          error: mapSupabaseError(error),
        };
      }

      const rankPoints = data?.rank_points ?? 0;
      const rank = (data?.rank as UserRank) ?? getRankFromPoints(rankPoints);

      return {
        success: true,
        data: {
          rank_points: rankPoints,
          rank: rank,
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
