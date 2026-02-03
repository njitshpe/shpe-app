import { Notification } from 'expo-notifications';

// Notification types that users can control
export type NotificationType = 'event_reminders' | 'new_events' | 'announcements';

// Notification preferences stored per user (this idea needs to be reviewed)
export interface NotificationPreferences {
  event_reminders: boolean;
  new_events: boolean;
  announcements: boolean;
  all_enabled: boolean; // Master toggle
}

// Notification permission status
export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

// Scheduled notification data
export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger: Date | { seconds: number };
  type: NotificationType;
}

// Notification trigger for event reminders, need to fix
export interface EventReminderTrigger {
  eventId: string;
  eventName: string;
  eventTime: Date;
  reminderTime: Date; // When to send the notification
}

// User notification settings in database
export interface UserNotificationSettings {
  id: string;
  user_id: string;
  event_reminders_enabled: boolean;
  new_events_enabled: boolean;
  announcements_enabled: boolean;
  notifications_enabled: boolean; // Master toggle for all 
  expo_push_token?: string; // For future push notification implementation
  created_at: string;
  updated_at: string;
}

// Received notification data
export interface ReceivedNotification {
  notification: Notification;
  type?: NotificationType;
}

// Row from public.notifications table (inbox history)
export interface InboxNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}