/**
 * Event Bus Service
 * 
 * Centralized event system for app-wide action tracking.
 * Components emit events when actions happen (generic, not points-specific).
 * The PointsListener automatically evaluates rules and awards points.
 * 
 * @example
 * // In a component - just emit the event, no knowledge of points needed
 * eventBus.emit('user.checked_in', userId, { eventId: '123' });
 */

export type ActionType =
  | 'user.checked_in'
  | 'user.rsvp'
  | 'user.photo_uploaded'
  | 'user.feedback_submitted'
  | 'user.profile_updated'
  | 'user.profile_completed'
  | 'user.early_checkin';

export interface ActionEvent {
  type: ActionType;
  userId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

type EventCallback = (event: ActionEvent) => void;

class EventBus {
  private listeners: EventCallback[] = [];

  /**
   * Subscribe to all action events
   * @returns Unsubscribe function
   */
  subscribe(callback: EventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Emit an action event
   * Call this when any trackable action happens in the app.
   * The PointsListener will automatically evaluate rules.
   */
  emit(type: ActionType, userId: string, metadata?: Record<string, unknown>): void {
    const event: ActionEvent = {
      type,
      userId,
      metadata,
      timestamp: new Date(),
    };

    // Notify all listeners asynchronously (non-blocking)
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[EventBus] Listener error:', error);
      }
    });
  }
}

export const eventBus = new EventBus();
