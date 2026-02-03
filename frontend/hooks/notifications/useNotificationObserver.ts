import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

/**
 * Handles navigation when a user taps a push notification.
 *
 * Covers two scenarios:
 * - Warm start: app was in background, listener fires immediately.
 * - Cold start: app was killed, we check getLastNotificationResponseAsync on mount.
 *
 * Mount this once at the root level (inside AuthGuard) where useRouter() is available.
 */
export function useNotificationObserver() {
  const router = useRouter();
  const lastResponseId = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Warm start: fires when user taps notification while app is backgrounded
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    // Cold start: app was killed, check if it was opened via a notification tap.
    // The timeout gives Expo Router time to mount the navigator after a fresh launch.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        setTimeout(() => handleResponse(response), 500);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  function handleResponse(response: Notifications.NotificationResponse) {
    const identifier = response.notification.request.identifier;

    // Deduplicate: on cold start both the listener and getLastNotificationResponseAsync
    // can return the same notification. Only process it once.
    if (lastResponseId.current === identifier) return;
    lastResponseId.current = identifier;

    const data = response.notification.request.content.data;

    if (data?.eventId) {
      // Edge function sends { eventId: "uuid" } for event notifications
      router.push(`/event/${data.eventId}`);
    } else if (data?.type === 'announcement') {
      // Edge function sends { type: "announcement" } for announcements
      router.push('/notifications');
    }
  }
}
