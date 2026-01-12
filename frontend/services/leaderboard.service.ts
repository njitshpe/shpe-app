import { supabase } from '../lib/supabase';
import { ServiceResponse, mapSupabaseError } from '../types/errors';
import type {
  LeaderboardEntry,
  LeaderboardFilters,
  LeaderboardContext,
} from '../types/leaderboard';
import type { UserType } from '../types/userProfile';

/**
 * Database row structure from user_profiles query or RPC response
 */
interface UserProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  user_type: UserType | null;
  major?: string;
  expected_graduation_year?: number;
  graduation_year?: number;
  profile_picture_url?: string;
  rank_points?: number;
  created_at: string;
}

interface CompleteUserProfileRow extends UserProfileRow {
  first_name: string;
  last_name: string;
  user_type: UserType;
}

/**
 * Leaderboard Service - Manages leaderboard queries and ranking
 *
 * Fetches user profiles ordered by rank points and provides
 * stable ranking with tie-breaking based on created_at.
 */
class LeaderboardService {
  private cache = new Map<string, { data: LeaderboardEntry[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch leaderboard entries with optional filters and time context
   *
   * @param context - Time context: 'month', 'semester', or 'allTime'
   * @param filters - Optional filters for major and class year
   * @param forceRefresh - Whether to bypass cache and fetch fresh data
   * @returns ServiceResponse with array of LeaderboardEntry or error
   */
  async getLeaderboard(
    context: LeaderboardContext = 'allTime',
    filters: LeaderboardFilters = {},
    forceRefresh: boolean = false
  ): Promise<ServiceResponse<LeaderboardEntry[]>> {
    try {
      // Generate cache key
      const cacheKey = JSON.stringify({ context, filters });

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
      // Use RPC function for time-based aggregation
      const { data, error } = await supabase.rpc('get_leaderboard_by_context', {
        p_context: context,
        p_major: filters.major || null,
        p_class_year: filters.classYear || null,
      });

      if (error) {
        console.error('Failed to fetch leaderboard:', error);
        return {
          success: false,
          error: mapSupabaseError(error),
        };
      }

      // Map database rows to LeaderboardEntry
      const completedRows = (data as UserProfileRow[]).filter((row) =>
        this.isProfileComplete(row)
      );
      const entries: LeaderboardEntry[] = completedRows.map((row, index) =>
        this.mapToLeaderboardEntry(row, index + 1)
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
    const cacheKey = JSON.stringify({ context, filters });
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
   * Map a user_profiles row to a LeaderboardEntry
   *
   * @param row - Database row from user_profiles
   * @param rank - Position in the leaderboard (1-indexed)
   * @returns LeaderboardEntry with all required fields
   */
  private mapToLeaderboardEntry(
    row: CompleteUserProfileRow,
    rank: number
  ): LeaderboardEntry {
    // Construct display name from first and last name
    const displayName = `${row.first_name} ${row.last_name}`.trim();

    // Determine class year based on user type
    let classYear: number | undefined;
    if (row.user_type === 'student' && row.expected_graduation_year) {
      classYear = row.expected_graduation_year;
    } else if (row.user_type === 'alumni' && row.graduation_year) {
      classYear = row.graduation_year;
    }

    return {
      id: row.id,
      displayName,
      major: row.major,
      classYear,
      userType: row.user_type,
      avatarUrl: row.profile_picture_url,
      points: row.rank_points ?? 0,
      rank,
    };
  }

  private isProfileComplete(row: UserProfileRow): row is CompleteUserProfileRow {
    if (!row.user_type) return false;
    const firstName = row.first_name?.trim();
    const lastName = row.last_name?.trim();
    return Boolean(firstName && lastName);
  }
}

export const leaderboardService = new LeaderboardService();
