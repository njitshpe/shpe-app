/**
 * Simple client-side rate limiter for post creation
 * MVP implementation using in-memory storage
 */

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store for rate limit tracking (per user)
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  maxPosts: 3,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Checks if a user can create a post based on rate limits
 * @param userId - The user's ID
 * @returns Object with canPost boolean and optional error message
 */
export function checkPostRateLimit(userId: string): { canPost: boolean; error?: string } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId) || { timestamps: [] };

  // Remove timestamps outside the time window
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  // Check if limit exceeded
  if (entry.timestamps.length >= RATE_LIMIT_CONFIG.maxPosts) {
    const oldestTimestamp = entry.timestamps[0];
    const waitTimeMs = oldestTimestamp + RATE_LIMIT_CONFIG.windowMs - now;
    const waitTimeSec = Math.ceil(waitTimeMs / 1000);

    return {
      canPost: false,
      error: `You're posting too quickly. Please wait ${waitTimeSec} seconds before posting again.`,
    };
  }

  return { canPost: true };
}

/**
 * Records a post creation for rate limiting
 * @param userId - The user's ID
 */
export function recordPostCreation(userId: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(userId) || { timestamps: [] };

  entry.timestamps.push(now);
  rateLimitStore.set(userId, entry);
}

/**
 * Clears rate limit data for a user (for testing or logout)
 * @param userId - The user's ID
 */
export function clearRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}
