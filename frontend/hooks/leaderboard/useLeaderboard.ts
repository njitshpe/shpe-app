import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [context, setContextState] = useState<LeaderboardContext>(initialContext);
  const [filters, setFiltersState] = useState<LeaderboardFilters>(initialFilters);
  const requestIdRef = useRef(0);
  const lastInitialContextRef = useRef(initialContext);

  // Client-side filtering
  const entries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (filters.major && entry.major !== filters.major) return false;
      if (filters.classYear && entry.classYear !== filters.classYear) return false;
      return true;
    }).map((entry, index) => ({
      ...entry,
      rank: index + 1 // Re-rank after filtering
    }));
  }, [allEntries, filters]);

  const fetchLeaderboard = useCallback(async (forceRefresh: boolean = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setError(null);

      // We pass empty filters to service because filtering is now client-side
      const response = await leaderboardService.getLeaderboard(
        context,
        {},
        forceRefresh
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (response.success && response.data) {
        setAllEntries(response.data);
      } else if (response.error) {
        setError(response.error);
        setAllEntries([]);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError({
        message: 'Failed to load leaderboard data.',
        code: 'UNKNOWN_ERROR',
      });
      setAllEntries([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [context]);

  const refresh = useCallback(async () => {
    await fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  const setContext = useCallback((newContext: LeaderboardContext) => {
    setContextState(newContext);
    setError(null);

    // Check cache synchronously
    const cached = leaderboardService.getCachedData(newContext, {});
    if (cached) {
      setAllEntries(cached);
      setLoading(false);
    } else {
      setAllEntries([]);
      setLoading(true);
    }
  }, []);

  const setFilters = useCallback((newFilters: LeaderboardFilters) => {
    setFiltersState(newFilters);
  }, []);

  useEffect(() => {
    if (initialContext !== lastInitialContextRef.current) {
      lastInitialContextRef.current = initialContext;
      setContextState(initialContext);
      setError(null);

      const cached = leaderboardService.getCachedData(initialContext, {});
      if (cached) {
        setAllEntries(cached);
        setLoading(false);
      } else {
        setAllEntries([]);
        setLoading(true);
      }
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
