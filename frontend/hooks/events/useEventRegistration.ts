import { useState, useEffect, useCallback } from 'react';
import { registrationService } from '@/services';

export interface UseEventRegistrationResult {
  isRegistered: boolean;
  loading: boolean;
  error: string | null;
  register: (answers?: Record<string, string>) => Promise<void>;
  cancel: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage event registration state
 * @param eventId - The event ID to manage registration for
 */
export function useEventRegistration(eventId: string): UseEventRegistrationResult {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check registration status
   */

  const register = useCallback(async (answers: Record<string, string> = {}) => {
    try {
      setLoading(true);
      setError(null);
      // UPDATE: Pass answers to the service
      await registrationService.register(eventId, answers); 
      setIsRegistered(true);
    } catch (err) {
      console.error('Failed to register:', err);
      setError(err instanceof Error ? err.message : 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [eventId]);
  
  const checkRegistration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const registered = await registrationService.isRegistered(eventId);
      setIsRegistered(registered);
    } catch (err) {
      console.error('Failed to check registration:', err);
      setError(err instanceof Error ? err.message : 'Failed to check registration');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  /**
   * Cancel registration
   */
  const cancel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await registrationService.cancel(eventId);
      setIsRegistered(false);
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel registration');
      throw err; // Re-throw so caller can handle
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  /**
   * Refresh registration status
   */
  const refresh = useCallback(async () => {
    await checkRegistration();
  }, [checkRegistration]);

  // Initial load
  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  return {
    isRegistered,
    loading,
    error,
    register,
    cancel,
    refresh,
  };
}
