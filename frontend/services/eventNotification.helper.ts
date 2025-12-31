import { supabase } from '../lib/supabase';
import { notificationService } from './notification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventDB } from '../types/events';

const LAST_CHECK_KEY = '@last_event_check';

class EventNotificationHelper {
  // Check for new events created since last check and send notifications for them
  async checkAndNotifyNewEvents(): Promise<{ count: number; events: EventDB[] }> {
    try {
      // Get last check timestamp
      const lastCheckStr = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const lastCheck = lastCheckStr ? new Date(lastCheckStr) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24h ago

      // Query events created since last check
      const { data: newEvents, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('created_at', lastCheck.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching new events:', error);
        return { count: 0, events: [] };
      }

      if (!newEvents || newEvents.length === 0) {
        console.log('No new events found');
        return { count: 0, events: [] };
      }

      // Send notification for each new event
      for (const event of newEvents) {
        await notificationService.sendNewEventNotification(
          event.name,
          new Date(event.start_time)
        );
      }

      // Update last check timestamp
      await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());

      return { count: newEvents.length, events: newEvents };
    } catch (error) {
      console.error('Error in checkAndNotifyNewEvents:', error);
      return { count: 0, events: [] };
    }
  }

  // Get an event from database by event_id and send notification
  // Useful for testing with specific events
  async notifyForEvent(eventId: string): Promise<boolean> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (error || !event) {
        console.error('Event not found:', error);
        return false;
      }

      await notificationService.sendNewEventNotification(
        event.name,
        new Date(event.start_time)
      );

      return true;
    } catch (error) {
      console.error('Error in notifyForEvent:', error);
      return false;
    }
  }

  // Schedule reminder for a specific event
  async scheduleReminderForEvent(
    eventId: string,
    minutesBefore: number = 30
  ): Promise<boolean> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (error || !event) {
        console.error('Event not found:', error);
        return false;
      }

      await notificationService.scheduleEventReminder(
        event.name,
        new Date(event.start_time),
        minutesBefore
      );

      return true;
    } catch (error) {
      console.error('Error in scheduleReminderForEvent:', error);
      return false;
    }
  }

  // Reset last check time (for testing)
  async resetLastCheck(): Promise<void> {
    await AsyncStorage.removeItem(LAST_CHECK_KEY);
  }
}

export const eventNotificationHelper = new EventNotificationHelper();
