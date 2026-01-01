import { supabase } from '@/lib/supabase';
import { notificationService } from './notification.service';
import { RealtimeChannel } from '@supabase/supabase-js';

class EventNotificationHelper {
  private subscription: RealtimeChannel | null = null;

  /**
   * --- START LISTENING ---
   * Call this ONCE when the app starts (e.g., in _layout.tsx).
   * It opens a websocket connection to Supabase to receive instant updates.
   */
  startListening() {
    if (this.subscription) {
      console.log(' Already listening for real-time event updates.');
      return;
    }

    console.log('Initializing Real-time Event Listener...');

    this.subscription = supabase
      .channel('public:events') // Unique channel name
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => this.handleRealtimeEvent(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(' Connected to Real-time Updates');
        }
      });
  }

  /**
   * --- STOP LISTENING ---
   * Good practice to call this on logout to prevent memory leaks.
   */
  stopListening() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      console.log(' Stopped listening for real-time updates.');
    }
  }

  /**
   * --- PRIVATE: LOGIC HANDLER ---
   * Decides which notification to send based on the database change.
   */
  private async handleRealtimeEvent(payload: any) {
    console.log(` Real-time payload received: ${payload.eventType}`);

    const newRecord = payload.new;
    // Note: 'old' record is usually empty unless REPLICA IDENTITY is set to FULL in Postgres.
    // We will rely on the 'new' record state.

    // 1. HANDLE INSERT (New Event Created)
    if (payload.eventType === 'INSERT') {
      if (newRecord.is_active) {
        console.log('   -> New Event Detected');
        await notificationService.sendNewEventNotification(
          newRecord.name,
          new Date(newRecord.start_time)
        );
      }
      return;
    }

    // 2. HANDLE UPDATE (Cancellation or Reschedule)
    if (payload.eventType === 'UPDATE') {
      
      // CASE A: CANCELLATION
      // If the event was just turned inactive
      if (newRecord.is_active === false) {
        console.log('   -> Cancellation Detected');
        await notificationService.sendImmediateNotification(
          ' Event Cancelled',
          `${newRecord.name} has been cancelled.`,
          { type: 'cancellation', eventId: newRecord.event_id }
        );
        return;
      }

      // CASE B: DETAILS UPDATE
      // If it is still active, it must be a reschedule or detail change
      if (newRecord.is_active === true) {
        console.log('   -> Event Update Detected');
        
        const eventDate = new Date(newRecord.start_time);
        
        // Format readable time
        const timeString = eventDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const dateString = eventDate.toLocaleDateString([], {
           month: 'short', 
           day: 'numeric' 
        });

        await notificationService.sendImmediateNotification(
          ' Event Update',
          `${newRecord.name} details have changed.\nNew time: ${dateString} at ${timeString}`,
          { type: 'update', eventId: newRecord.event_id }
        );
      }
    }
  }
}

export const eventNotificationHelper = new EventNotificationHelper();