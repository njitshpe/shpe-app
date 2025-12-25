import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  NotificationPermissionStatus,
  NotificationType,
  ScheduledNotification,
  EventReminderTrigger,
} from '../types/notifications';

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const STORAGE_KEYS = {
  PREFERENCES: '@notification_preferences',
  SCHEDULED_NOTIFICATIONS: '@scheduled_notifications',
};

class NotificationService {
  /**
   * Request notification permissions from the user
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return {
          granted: false,
          canAskAgain: false,
          status: 'denied',
        };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      const canAskAgain = finalStatus === 'undetermined';

      return {
        granted,
        canAskAgain,
        status: finalStatus as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  /**
   * Check current notification permission status without requesting
   */
  async checkPermission(): Promise<NotificationPermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted';
      const canAskAgain = status === 'undetermined';

      return {
        granted,
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  /**
   * Handle permission denial by showing appropriate message
   */
  handlePermissionDenied(canAskAgain: boolean): void {
    if (!canAskAgain) {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notifications in your device settings to receive event updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      Alert.alert(
        'Notification Permission Required',
        'Enable notifications to stay updated on SHPE events and announcements.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Date | { seconds: number },
    data?: any
  ): Promise<string | null> {
    try {
      const { granted } = await this.checkPermission();
      if (!granted) {
        console.warn('Notification permission not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger:
          trigger instanceof Date
            ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger }
            : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: trigger.seconds },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Schedule an event reminder notification
   */
  async scheduleEventReminder(
    eventName: string,
    eventTime: Date,
    reminderMinutesBefore: number = 30
  ): Promise<string | null> {
    const reminderTime = new Date(eventTime.getTime() - reminderMinutesBefore * 60 * 1000);

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      console.warn('Reminder time is in the past, not scheduling');
      return null;
    }

    return await this.scheduleNotification(
      'Event Reminder',
      `${eventName} starts in ${reminderMinutesBefore} minutes!`,
      reminderTime,
      {
        type: 'event_reminder',
        eventName,
        eventTime: eventTime.toISOString(),
      }
    );
  }

  /**
   * Send an immediate notification
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string | null> {
    try {
      const { granted } = await this.checkPermission();
      if (!granted) {
        console.warn('Notification permission not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // null means send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return null;
    }
  }

  /**
   * Send a new event announcement notification
   */
  async sendNewEventNotification(eventName: string, eventTime: Date): Promise<string | null> {
    const formattedTime = eventTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return await this.sendImmediateNotification(
      'New SHPE Event!',
      `${eventName} - ${formattedTime}`,
      {
        type: 'new_event',
        eventName,
        eventTime: eventTime.toISOString(),
      }
    );
  }

  /**
   * Send a general announcement notification
   */
  async sendAnnouncementNotification(
    title: string,
    message: string
  ): Promise<string | null> {
    return await this.sendImmediateNotification(title, message, {
      type: 'announcement',
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Dismiss all displayed notifications
   */
  async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing notifications:', error);
    }
  }

  /**
   * Get badge count (iOS)
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count (iOS)
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Register notification listeners
   * Returns cleanup function
   */
  registerNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    // Listener for notifications received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    // Listener for when user taps on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        onNotificationResponse?.(response);
      }
    );

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }
}

export const notificationService = new NotificationService();
