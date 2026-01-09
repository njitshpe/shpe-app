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
   * FETCH-FIRST: Always try server first. Only use cache if connectivity is broken.
   */
  static async getCheckInToken(eventId: string): Promise<CheckInToken> {
    let serverReached = false;

    try {
      const { data, error } = await supabase.functions.invoke(
        `check-in-token/${eventId}`,
        {
          method: 'GET',
        }
      );

      // Set serverReached = true if:
      // 1. Data exists (server sent response body), OR
      // 2. error.name === 'FunctionsHttpError' (definitive 4xx/5xx response)
      if (data !== null && data !== undefined) {
        serverReached = true;
      } else if (error && error.name === 'FunctionsHttpError') {
        // FunctionsHttpError means server responded with 4xx/5xx
        serverReached = true;
      }

      if (error) {
        // Only clear cache if server actually responded (not pure network failure)
        if (serverReached) {
          await this.clearCachedToken(eventId);
        }

        // Throw original error to preserve name/code for offline detection
        throw error;
      }

      if (!data.success || !data.token) {
        // Server returned business logic error (401/403/time window/etc)
        // Clear cache - we know server responded since data exists
        await this.clearCachedToken(eventId);

        const errorMsg = data.error || 'Invalid response from server';
        const err: any = new Error(errorMsg);
        err.errorCode = data.errorCode;
        throw err;
      }

      // Success - cache the token for offline use
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
      // Only use cache if server was NOT reached (true offline/network error)
      if (!serverReached) {
        // Check for TRUE network/connectivity errors only using error.name:
        // - FunctionsFetchError: Supabase's network failure wrapper (DNS, timeout, no connection)
        // - TypeError: Fetch API network errors (connection refused, etc)
        // Plus known network error codes as fallback
        const isTrueNetworkError =
          error.name === 'FunctionsFetchError' ||
          error.name === 'TypeError' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNREFUSED';

        if (isTrueNetworkError) {
          console.log('Network error detected, attempting cache fallback');
          const cached = await this.getCachedToken(eventId);
          if (cached && this.isTokenValid(cached)) {
            console.log('Using cached token due to offline/network error');
            return {
              token: cached.token,
              event: cached.event,
            };
          }
        }
      }

      // Server was reached OR not a network error - throw original error
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
