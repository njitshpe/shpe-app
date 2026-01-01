import { supabase } from '@/lib/supabase';
import { notificationService } from './notification.service';
import { RealtimeChannel } from '@supabase/supabase-js';

class EventNotificationHelper {
  private subscription: RealtimeChannel | null = null;

  /**
   * --- START LISTENING ---
   * Call this ONCE when the app starts.
   */
  startListening() {
    if (this.subscription) {
      console.log('Already listening for real-time event updates.');
      return;
    }

    console.log('Initializing Real-time Event Listener...');

    this.subscription = supabase
      .channel('public:events') 
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => this.handleRealtimeEvent(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Real-time Updates');
        }
      });
  }

  /**
   * --- STOP LISTENING ---
   */
  stopListening() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      console.log('Stopped listening for real-time updates.');
    }
  }

  /**
   * --- PRIVATE: LOGIC HANDLER ---
   * Handles database changes.
   * NOTE: Notifications are now handled by Supabase Edge Functions.
   * We keep this listener active in case we want to trigger UI refreshes later.
   */
  private async handleRealtimeEvent(payload: any) {
    console.log(` Real-time payload received: ${payload.eventType}`);

    // const newRecord = payload.new;

    // --- 1. HANDLE INSERT (New Event) ---
    if (payload.eventType === 'INSERT') {
      console.log(' -> New Event Detected (Notification handled by Server)');
      
      // TODO: If you want the list to update automatically, call your fetchEvents() here!
      return;
    }

    // --- 2. HANDLE UPDATE (Cancellation/Changes) ---
    if (payload.eventType === 'UPDATE') {
       console.log(' -> Event Update Detected (Notification handled by Server)');
    }
  }
}

export const eventNotificationHelper = new EventNotificationHelper();