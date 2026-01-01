import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface Registration {
  event_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Registration Service with Supabase + AsyncStorage fallback
 * Uses Supabase table `event_registrations` if available, otherwise falls back to AsyncStorage
 */
class RegistrationService {
  private STORAGE_PREFIX = 'registration:';

  /**
   * Get current user ID from Supabase auth or use a stub for development
   */
  private async getUserId(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return user.id;
      }
    } catch (error) {
      console.log('Auth not available, using stub user ID');
    }
    // Stub user for development
    return 'dev-user-001';
  }

  /**
   * Check if user is registered for an event
   */
  async isRegistered(eventId: string): Promise<boolean> {
    const userId = await this.getUserId();

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        return true;
      }
    } catch (error) {
      console.log('Supabase check failed, falling back to AsyncStorage:', error);
    }

    // Fallback to AsyncStorage
    try {
      const key = `${this.STORAGE_PREFIX}${eventId}:${userId}`;
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error('AsyncStorage check failed:', error);
      return false;
    }
  }

  /**
   * Register user for an event
   */
  async register(eventId: string): Promise<void> {
    const userId = await this.getUserId();

    // Check if already registered (idempotent)
    const alreadyRegistered = await this.isRegistered(eventId);
    if (alreadyRegistered) {
      console.log('Already registered, skipping duplicate registration');
      return;
    }

    // Try Supabase first
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      if (!error) {
        console.log('Registered via Supabase');
        // Also save to AsyncStorage as backup
        await this.saveToAsyncStorage(eventId, userId);
        return;
      } else {
        console.log('Supabase insert failed, falling back to AsyncStorage:', error);
      }
    } catch (error) {
      console.log('Supabase error, falling back to AsyncStorage:', error);
    }

    // Fallback to AsyncStorage
    await this.saveToAsyncStorage(eventId, userId);
    console.log('Registered via AsyncStorage');
  }

  /**
   * Cancel registration for an event
   */
  async cancel(eventId: string): Promise<void> {
    const userId = await this.getUserId();

    // Try Supabase first
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (!error) {
        console.log('Cancelled via Supabase');
        // Also remove from AsyncStorage
        await this.removeFromAsyncStorage(eventId, userId);
        return;
      } else {
        console.log('Supabase delete failed, falling back to AsyncStorage:', error);
      }
    } catch (error) {
      console.log('Supabase error, falling back to AsyncStorage:', error);
    }

    // Fallback to AsyncStorage
    await this.removeFromAsyncStorage(eventId, userId);
    console.log('Cancelled via AsyncStorage');
  }

  /**
   * Get registration count for an event (for attendees preview)
   */
  async getRegistrationCount(eventId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (!error && count !== null) {
        return count;
      }
    } catch (error) {
      console.log('Failed to get registration count:', error);
    }
    return 0;
  }

  /**
   * Private helper: Save to AsyncStorage
   */
  private async saveToAsyncStorage(eventId: string, userId: string): Promise<void> {
    const key = `${this.STORAGE_PREFIX}${eventId}:${userId}`;
    const registration: Registration = {
      event_id: eventId,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(registration));
  }

  /**
   * Private helper: Remove from AsyncStorage
   */
  private async removeFromAsyncStorage(eventId: string, userId: string): Promise<void> {
    const key = `${this.STORAGE_PREFIX}${eventId}:${userId}`;
    await AsyncStorage.removeItem(key);
  }
}

export const registrationService = new RegistrationService();
