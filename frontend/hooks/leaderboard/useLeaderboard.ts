import { useState, useEffect, useCallback, useRef } from 'react';
import { leaderboardService } from '@/services';
import type {
  LeaderboardEntry,
  LeaderboardContext,
  LeaderboardFilters,
} from '@/types/leaderboard';
import type { AppError } from '@/types/errors';

export interface UseLeaderboardResult {
  /** Current leaderboard entries */
  entries: LeaderboardEntry[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: AppError | null;
  /** Current time context filter */
  context: LeaderboardContext;
  /** Current filters (major, classYear) */
  filters: LeaderboardFilters;
  /** Refresh leaderboard data */
  refresh: () => Promise<void>;
  /** Update time context */
  setContext: (context: LeaderboardContext) => void;
  /** Update filters */
  setFilters: (filters: LeaderboardFilters) => void;
}

/**
 * Hook to manage leaderboard state and data fetching
 *
 * Provides leaderboard entries with filtering by major and class year.
 * UI-agnostic - only manages data and filters, not presentation logic.
 *
 * @param initialContext - Initial time context (defaults to 'allTime')
 * @param initialFilters - Initial filters (defaults to no filters)
 *
 * @example
 * ```tsx
 * const { entries, loading, error, filters, setFilters, refresh } = useLeaderboard();
 *
 * // Display leaderboard
 * {entries.map(entry => (
 *   <LeaderboardRow key={entry.id} entry={entry} />
 * ))}
 *
 * // Filter by major
 * setFilters({ major: 'Computer Science' });
 *
 * // Refresh data
 * await refresh();
 * ```
 */
export function useLeaderboard(
  initialContext: LeaderboardContext = 'allTime',
  initialFilters: LeaderboardFilters = {}
): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [context, setContextState] = useState<LeaderboardContext>(initialContext);
  const [filters, setFiltersState] = useState<LeaderboardFilters>(initialFilters);
  const requestIdRef = useRef(0);
  const lastInitialContextRef = useRef(initialContext);

  const fetchLeaderboard = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setError(null);

      const response = await leaderboardService.getLeaderboard(context, filters);

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (response.success && response.data) {
        setEntries(response.data);
      } else if (response.error) {
        setError(response.error);
        setEntries([]);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError({
        message: 'Failed to load leaderboard data.',
        code: 'UNKNOWN_ERROR',
      });
      setEntries([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [context, filters]);

  const refresh = useCallback(async () => {
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  const setContext = useCallback((newContext: LeaderboardContext) => {
    setContextState(newContext);
    setEntries([]);
    setError(null);
  }, []);

  const setFilters = useCallback((newFilters: LeaderboardFilters) => {
    setFiltersState(newFilters);
  }, []);

  useEffect(() => {
    if (initialContext !== lastInitialContextRef.current) {
      lastInitialContextRef.current = initialContext;
      setContextState(initialContext);
      setEntries([]);
      setError(null);
    }
  }, [initialContext]);

  // Fetch leaderboard on mount and when filters or context change
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    loading,
    error,
    context,
    filters,
    refresh,
    setContext,
    setFilters,
  };
}
