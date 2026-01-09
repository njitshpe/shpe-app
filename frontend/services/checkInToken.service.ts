import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CheckInToken {
  token: string;
  event: {
    id: string;
    name: string;
    checkInOpens: string;
    checkInCloses: string;
  };
}

export interface TokenCacheItem {
  token: string;
  event: {
    id: string;
    name: string;
    checkInOpens: string;
    checkInCloses: string;
  };
  cachedAt: string;
}

const TOKEN_CACHE_PREFIX = 'check_in_token_';

export class CheckInTokenService {
  /**
   * Fetch a check-in token for an event from the backend
   * This validates admin permissions and time windows server-side
   */
  static async getCheckInToken(eventId: string): Promise<CheckInToken> {
    try {
      const { data, error } = await supabase.functions.invoke(
        `check-in-token/${eventId}`,
        {
          method: 'GET',
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to fetch check-in token');
      }

      if (!data.success || !data.token) {
        // Server returned error (401/403/etc) - clear cache and throw
        if (data.errorCode === 'NOT_ADMIN' || data.errorCode === 'CHECK_IN_NOT_OPEN' || data.errorCode === 'CHECK_IN_CLOSED') {
          await this.clearCachedToken(eventId);
        }
        throw new Error(data.error || 'Invalid response from server');
      }

      // Cache the token for offline use
      await this.cacheToken(eventId, {
        token: data.token,
        event: data.event,
        cachedAt: new Date().toISOString(),
      });

      return {
        token: data.token,
        event: data.event,
      };
    } catch (error: any) {
      // Only fall back to cache for true network/offline errors
      // If error message indicates authorization/permission issue, don't use cache
      const isAuthError = error.message?.includes('Admin') ||
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('not opened') ||
                         error.message?.includes('closed');

      if (!isAuthError) {
        const cached = await this.getCachedToken(eventId);
        if (cached && this.isTokenValid(cached)) {
          console.log('Using cached token due to network error');
          return {
            token: cached.token,
            event: cached.event,
          };
        }
      }

      throw error;
    }
  }

  /**
   * Cache a token locally for offline fallback
   */
  private static async cacheToken(
    eventId: string,
    tokenData: TokenCacheItem
  ): Promise<void> {
    try {
      const key = `${TOKEN_CACHE_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify(tokenData));
    } catch (error) {
      console.error('Failed to cache token:', error);
      // Don't throw - caching is best effort
    }
  }

  /**
   * Retrieve a cached token
   */
  static async getCachedToken(eventId: string): Promise<TokenCacheItem | null> {
    try {
      const key = `${TOKEN_CACHE_PREFIX}${eventId}`;
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      return JSON.parse(cached) as TokenCacheItem;
    } catch (error) {
      console.error('Failed to retrieve cached token:', error);
      return null;
    }
  }

  /**
   * Check if a cached token is still valid based on time window
   */
  private static isTokenValid(tokenData: TokenCacheItem): boolean {
    const now = new Date();
    const checkInCloses = new Date(tokenData.event.checkInCloses);

    // Token is valid if check-in hasn't closed yet
    return now <= checkInCloses;
  }

  /**
   * Clear cached token for an event
   */
  static async clearCachedToken(eventId: string): Promise<void> {
    try {
      const key = `${TOKEN_CACHE_PREFIX}${eventId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear cached token:', error);
    }
  }

  /**
   * Clear all expired tokens from cache
   */
  static async clearExpiredTokens(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tokenKeys = keys.filter((key) => key.startsWith(TOKEN_CACHE_PREFIX));

      for (const key of tokenKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const tokenData = JSON.parse(cached) as TokenCacheItem;
          if (!this.isTokenValid(tokenData)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear expired tokens:', error);
    }
  }

  /**
   * Get the time-based state of an event for UI rendering
   */
  static getEventState(
    checkInOpens: string,
    checkInCloses: string
  ): 'not_open' | 'active' | 'closed' {
    const now = new Date();
    const opens = new Date(checkInOpens);
    const closes = new Date(checkInCloses);

    if (now < opens) return 'not_open';
    if (now > closes) return 'closed';
    return 'active';
  }

  /**
   * Validate a check-in token by submitting it to the backend
   * This is called when a student scans the QR code
   */
  static async validateCheckIn(
    token: string,
    latitude?: number,
    longitude?: number
  ): Promise<{
    success: boolean;
    attendance?: any;
    event?: any;
    error?: string;
    errorCode?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-check-in', {
        body: {
          token,
          latitude,
          longitude,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to validate check-in',
          errorCode: 'VALIDATION_ERROR',
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Check-in validation failed',
          errorCode: data.errorCode || 'UNKNOWN_ERROR',
        };
      }

      return {
        success: true,
        attendance: data.attendance,
        event: data.event,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }
}
