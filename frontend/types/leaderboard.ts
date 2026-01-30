import { UserType } from './userProfile';

/**
 * Time context for leaderboard ranking
 */
export type LeaderboardContext = 'month' | 'semester' | 'allTime';

/**
 * Single entry in the leaderboard
 */
export interface LeaderboardEntry {
  /** User ID */
  id: string;
  /** Full display name (first + last name) */
  displayName: string;
  /** User's major (optional, present for students/alumni) */
  major?: string;
  /** Class year (graduation_year column) */
  classYear?: number;
  /** Type of user */
  userType: UserType;
  /** Profile picture URL */
  avatarUrl?: string;
  /** Total rank points */
  points: number;
  /** Position in the leaderboard (1-indexed) */
  rank: number;
}

/**
 * Filters for leaderboard queries
 */
export interface LeaderboardFilters {
  /** Filter by major */
  major?: string;
  /** Filter by class year */
  classYear?: number;
  /** Filter by user type (e.g., 'member', 'officer', 'alumni') */
  userType?: string;
}
