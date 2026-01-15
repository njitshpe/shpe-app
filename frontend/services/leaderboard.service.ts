import { supabase } from '../lib/supabase';
import { ServiceResponse, mapSupabaseError } from '../types/errors';
import type {
  LeaderboardEntry,
  LeaderboardFilters,
  LeaderboardContext,
} from '../types/leaderboard';
import type { UserType } from '../types/userProfile';
import { resolveProfilePictureUrl } from '../utils/profilePicture';

/**
 * Row structure returned by get_leaderboard_current_season RPC
 */
interface LeaderboardRpcRow {
  user_id: string;
  first_name: string;
  last_name: string;
  user_type: string;
  major: string | null;
  graduation_year: number | null;
  profile_picture_url: string | null;
  season_id: string;
  points_total: number;
  tier: string;
  rank: number;
}

/**
 * Leaderboard Service - Manages leaderboard queries and ranking
 *
 * Fetches user profiles ordered by rank points for the current season.
 * Uses the get_leaderboard_current_season RPC which handles filtering,
 * ranking, and tier calculation server-side.
 */
class LeaderboardService {
  private cache = new Map<
    string,
    { data: LeaderboardEntry[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch leaderboard entries with optional filters
   *
   * @param context - Time context (currently ignored - RPC uses current season)
   * @param filters - Optional filters for major, class year, and user type
   * @param forceRefresh - Whether to bypass cache and fetch fresh data
   * @param limit - Maximum number of entries to return (default 100)
   * @param offset - Number of entries to skip for pagination (default 0)
   * @returns ServiceResponse with array of LeaderboardEntry or error
   */
  async getLeaderboard(
    context: LeaderboardContext = 'allTime',
    filters: LeaderboardFilters = {},
    forceRefresh: boolean = false,
    limit: number = 100,
    offset: number = 0
  ): Promise<ServiceResponse<LeaderboardEntry[]>> {
    try {
      // Generate cache key including pagination
      const cacheKey = JSON.stringify({ context, filters, limit, offset });

      // Check cache validity if not forcing refresh
      if (!forceRefresh) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          console.log('🔹 Cache HIT for:', context);
          return {
            success: true,
            data: cached.data,
          };
        }
      }

      console.log('🔸 Cache MISS for:', context);

      // Call get_leaderboard_current_season RPC with filters
      const { data, error } = await supabase.rpc(
        'get_leaderboard_current_season',
        {
          p_major: filters.major || null,
          p_class_year: filters.classYear || null,
          p_user_type: filters.userType || null,
          p_limit: limit,
          p_offset: offset,
        }
      );

      if (error) {
        console.error('Failed to fetch leaderboard:', error);
        return {
          success: false,
          error: mapSupabaseError(error),
        };
      }

      // Map RPC rows to LeaderboardEntry
      const entries: LeaderboardEntry[] = (data as LeaderboardRpcRow[]).map(
        (row) => this.mapRpcRowToEntry(row)
      );

      // Update cache
      this.cache.set(cacheKey, {
        data: entries,
        timestamp: Date.now(),
      });

      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }
  }

  /**
   * Synchronously check for valid cached data
   */
  getCachedData(
    context: LeaderboardContext,
    filters: LeaderboardFilters
  ): LeaderboardEntry[] | null {
    const cacheKey = JSON.stringify({ context, filters, limit: 100, offset: 0 });
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Clear all cached leaderboard data
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Map an RPC result row to a LeaderboardEntry
   *
   * @param row - Row from get_leaderboard_current_season RPC
   * @returns LeaderboardEntry with all required fields
   */
  private mapRpcRowToEntry(row: LeaderboardRpcRow): LeaderboardEntry {
    return {
      id: row.user_id,
      displayName: `${row.first_name} ${row.last_name}`.trim(),
      major: row.major ?? undefined,
      classYear: row.graduation_year ?? undefined,
      userType: row.user_type as UserType,
      avatarUrl: resolveProfilePictureUrl(row.profile_picture_url),
      points: row.points_total,
      rank: row.rank,
    };
  }
}

export const leaderboardService = new LeaderboardService();
