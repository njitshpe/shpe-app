import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../lib/notificationService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  NotificationPreferences,
  NotificationPermissionStatus,
  UserNotificationSettings,
} from '../types/notifications';

interface NotificationContextType {
  preferences: NotificationPreferences;
  permissionStatus: NotificationPermissionStatus;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  updatePreference: (type: keyof NotificationPreferences, enabled: boolean) => Promise<void>;
  updateAllPreferences: (enabled: boolean) => Promise<void>;
  refreshPermissionStatus: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  event_reminders: true,
  new_events: true,
  announcements: true,
  all_enabled: true,
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>({
    granted: false,
    canAskAgain: true,
    status: 'undetermined',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize notification listeners and load preferences
  useEffect(() => {
    initializeNotifications();

    // Register notification listeners
    const cleanup = notificationService.registerNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    return () => {
      cleanup();
    };
  }, []);

  // Load user preferences when user changes
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      // Reset to defaults if logged out
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, [user]);

  /**
   * Initialize notification system
   */
  const initializeNotifications = async () => {
    setIsLoading(true);
    try {
      // Check permission status
      const status = await notificationService.checkPermission();
      setPermissionStatus(status);

      // Clear badge count on app start
      await notificationService.clearBadgeCount();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load user preferences from Supabase
   */
  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        // Convert database format to app format
        setPreferences({
          event_reminders: data.event_reminders_enabled,
          new_events: data.new_events_enabled,
          announcements: data.announcements_enabled,
          all_enabled: data.notifications_enabled,
        });
      } else {
        // Create default preferences for new user
        await createDefaultPreferences();
      }
    } catch (error) {
      console.error('Error in loadUserPreferences:', error);
    }
  };

  /**
   * Create default preferences for new user
   */
  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('user_notification_settings').insert({
        user_id: user.id,
        event_reminders_enabled: true,
        new_events_enabled: true,
        announcements_enabled: true,
        notifications_enabled: true,
      });

      if (error) {
        console.error('Error creating default preferences:', error);
      }
    } catch (error) {
      console.error('Error in createDefaultPreferences:', error);
    }
  };

  /**
   * Request notification permission
   */
  const requestPermission = async (): Promise<boolean> => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);

    if (!status.granted) {
      notificationService.handlePermissionDenied(status.canAskAgain);
    }

    return status.granted;
  };

  /**
   * Refresh permission status
   */
  const refreshPermissionStatus = async () => {
    const status = await notificationService.checkPermission();
    setPermissionStatus(status);
  };

  /**
   * Update a specific notification preference
   */
  const updatePreference = async (
    type: keyof NotificationPreferences,
    enabled: boolean
  ): Promise<void> => {
    if (!user) return;

    try {
      // Update local state
      const newPreferences = { ...preferences, [type]: enabled };

      // If turning off a preference, check if all should be disabled
      if (!enabled) {
        const anyEnabled =
          (type !== 'event_reminders' && newPreferences.event_reminders) ||
          (type !== 'new_events' && newPreferences.new_events) ||
          (type !== 'announcements' && newPreferences.announcements);

        if (!anyEnabled) {
          newPreferences.all_enabled = false;
        }
      }

      // If turning on a preference, enable all_enabled
      if (enabled && type !== 'all_enabled') {
        newPreferences.all_enabled = true;
      }

      setPreferences(newPreferences);

      // Map to database column names
      const columnMap: Record<keyof NotificationPreferences, string> = {
        event_reminders: 'event_reminders_enabled',
        new_events: 'new_events_enabled',
        announcements: 'announcements_enabled',
        all_enabled: 'notifications_enabled',
      };

      // Update in database
      const { error } = await supabase
        .from('user_notification_settings')
        .update({
          [columnMap[type]]: enabled,
          ...(type !== 'all_enabled' && { notifications_enabled: newPreferences.all_enabled }),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preference:', error);
        // Revert local state on error
        setPreferences(preferences);
      }
    } catch (error) {
      console.error('Error in updatePreference:', error);
    }
  };

  /**
   * Update all preferences at once (master toggle)
   */
  const updateAllPreferences = async (enabled: boolean): Promise<void> => {
    if (!user) return;

    try {
      const newPreferences: NotificationPreferences = {
        event_reminders: enabled,
        new_events: enabled,
        announcements: enabled,
        all_enabled: enabled,
      };

      setPreferences(newPreferences);

      // Update in database
      const { error } = await supabase
        .from('user_notification_settings')
        .update({
          event_reminders_enabled: enabled,
          new_events_enabled: enabled,
          announcements_enabled: enabled,
          notifications_enabled: enabled,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating all preferences:', error);
        // Revert local state on error
        setPreferences(preferences);
      }

      // If disabling all, cancel scheduled notifications
      if (!enabled) {
        await notificationService.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error in updateAllPreferences:', error);
    }
  };

  /**
   * Handle notification received while app is in foreground
   */
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received in foreground:', notification);
    // You can add custom logic here, like updating UI or incrementing badge
  };

  /**
   * Handle notification tap/response
   */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('User tapped notification:', response);
    const data = response.notification.request.content.data;

    // Handle different notification types
    if (data.type === 'event_reminder') {
      // Navigate to event details (implement navigation later)
      console.log('Navigate to event:', data.eventName);
    } else if (data.type === 'new_event') {
      // Navigate to events list (implement navigation later)
      console.log('Navigate to events list');
    } else if (data.type === 'announcement') {
      // Show announcement (implement later)
      console.log('Show announcement');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        permissionStatus,
        isLoading,
        requestPermission,
        updatePreference,
        updateAllPreferences,
        refreshPermissionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
