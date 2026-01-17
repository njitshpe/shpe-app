import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LeaderboardContext, LeaderboardEntry } from '@/types/leaderboard';

export interface RankChange {
  delta: number; // positive = up, negative = down, 0 = no change
  direction: 'up' | 'down' | 'same';
}

/**
 * Get initials from display name
 * @param displayName - Full name of the user
 * @returns Two-letter initials (e.g., "John Doe" -> "JD")
 */
export const getInitials = (displayName: string): string => {
  const names = displayName.trim().split(' ');
  if (names.length === 0) return '??';
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

/**
 * Load previous ranks from AsyncStorage
 */
export const loadPreviousRanks = async (
  context: LeaderboardContext
): Promise<Record<string, number>> => {
  try {
    const key = `leaderboard_prev_${context}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error('Failed to load previous ranks:', error);
    return {};
  }
};

/**
 * Save current ranks to AsyncStorage
 */
export const savePreviousRanks = async (
  entries: LeaderboardEntry[],
  context: LeaderboardContext
): Promise<void> => {
  try {
    const key = `leaderboard_prev_${context}`;
    const rankMap: Record<string, number> = {};
    entries.forEach((entry) => {
      rankMap[entry.id] = entry.rank;
    });
    await AsyncStorage.setItem(key, JSON.stringify(rankMap));
  } catch (error) {
    console.error('Failed to save previous ranks:', error);
  }
};

/**
 * Calculate rank change between previous and current rank
 */
export const getRankChange = (
  userId: string,
  currentRank: number,
  previousRanks: Record<string, number>
): RankChange | null => {
  const prevRank = previousRanks[userId];
  if (prevRank === undefined) return null;

  const delta = prevRank - currentRank; // Positive if rank improved (lower number)

  if (delta > 0) return { delta, direction: 'up' };
  if (delta < 0) return { delta: Math.abs(delta), direction: 'down' };
  return { delta: 0, direction: 'same' };
};

// Approximate height of each list row item (padding + content + margin)
// Used for getItemLayout optimization
export const ITEM_HEIGHT = 80;
