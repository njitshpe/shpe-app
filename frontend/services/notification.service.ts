import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { NotificationPermissionStatus } from '../types/notifications';

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  
  // --- MAIN: REGISTER & SAVE TOKEN ---
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      // 1. Check Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return null;
      }

      // 2. Get the Project ID
      // We look in two places to be safe.
      const projectId = 
        Constants?.expoConfig?.extra?.eas?.projectId ?? 
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error(" ERROR: Project ID is missing. Please run 'npx eas-cli init' in your terminal!");
        return;
      }
      
      try {
        // 3. Generate the Token
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log('Push Token Generated:', token);

        // 4. Save to Supabase
        await this.saveTokenToSupabase(token);
      } catch (e) {
        console.error("Error fetching push token:", e);
      }

    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // --- HELPER: SAVE TO DB (Fixed Table Name) ---
  private async saveTokenToSupabase(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update 'user_profiles' table with the new token
      const { error } = await supabase
        .from('user_profiles') // <--- FIXED: Was 'profiles'
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
        console.error("Error saving push token to Supabase:", error.message);
      } else {
        console.log("Push Token linked to User Profile!");
      }
    } catch (err) {
      console.log("Error in saveTokenToSupabase:", err);
    }
  }

  // --- PERMISSIONS ---
  async requestPermission(): Promise<NotificationPermissionStatus> {
    try {
      if (!Device.isDevice) {
        return { granted: false, canAskAgain: false, status: 'denied' };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        this.registerForPushNotificationsAsync(); 
      }

      return {
        granted: finalStatus === 'granted',
        canAskAgain: finalStatus === 'undetermined',
        status: finalStatus as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  }

  async checkPermission(): Promise<NotificationPermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain: status === 'undetermined',
        status: status as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  }

  handlePermissionDenied(canAskAgain: boolean): void {
    if (!canAskAgain) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in settings to receive updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }

  // --- SCHEDULING ---
  async scheduleNotification(title: string, body: string, trigger: Date | { seconds: number }, data?: any) {
    try {
      const { granted } = await this.checkPermission();
      if (!granted) return null;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger instanceof Date 
          ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger }
          : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: trigger.seconds },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async sendImmediateNotification(title: string, body: string, data?: any) {
    try {
      const { granted } = await this.checkPermission();
      if (!granted) return null;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return null;
    }
  }

  async sendNewEventNotification(eventName: string, eventTime: Date) {
    const formattedTime = eventTime.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    return await this.sendImmediateNotification(
      'New SHPE Event!',
      `${eventName} - ${formattedTime}`,
      { type: 'new_event', eventName, eventTime: eventTime.toISOString() }
    );
  }

  async sendAnnouncementNotification(title: string, message: string) {
    return await this.sendImmediateNotification(title, message, { type: 'announcement' });
  }

  // --- UTILS ---
  async cancelNotification(id: string) { await Notifications.cancelScheduledNotificationAsync(id); }
  async cancelAllNotifications() { await Notifications.cancelAllScheduledNotificationsAsync(); }
  async dismissAllNotifications() { await Notifications.dismissAllNotificationsAsync(); }
  async getBadgeCount() { return await Notifications.getBadgeCountAsync(); }
  async setBadgeCount(count: number) { await Notifications.setBadgeCountAsync(count); }
  async clearBadgeCount() { await this.setBadgeCount(0); }

  // --- LISTENERS ---
  registerNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        onNotificationResponse?.(response);
      }
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }
}

export const notificationService = new NotificationService();