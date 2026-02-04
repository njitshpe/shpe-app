import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { UserNotificationSettings } from '@/types/notifications';

export type NotificationSettingKey =
  | 'notifications_enabled'
  | 'new_events_enabled'
  | 'event_reminders_enabled'
  | 'announcements_enabled';

export interface UseNotificationSettingsResult {
  settings: UserNotificationSettings | null;
  loading: boolean;
  toggleSetting: (key: NotificationSettingKey, value: boolean) => Promise<void>;
}

/**
 * Hook to manage notification preferences from `user_notification_settings`.
 *
 * - Fetches the row on mount; auto-creates a default row if none exists.
 * - `toggleSetting` applies an optimistic update, then persists to Supabase.
 *   On failure the local state is reverted and an Alert is shown.
 * - Master toggle (`notifications_enabled`) cascades to all sub-preferences.
 */
export function useNotificationSettings(): UseNotificationSettingsResult {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch / Auto-create ──────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row — insert defaults (all enabled)
      const { data: created, error: insertErr } = await supabase
        .from('user_notification_settings')
        .insert({
          user_id: user.id,
          notifications_enabled: true,
          new_events_enabled: false,
          event_reminders_enabled: true,
          announcements_enabled: true,
        })
        .select()
        .single();

      if (!insertErr && created) setSettings(created);
      return;
    }

    if (error) {
      console.error('Failed to fetch notification settings:', error.message);
      return;
    }

    setSettings(data);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await fetchSettings();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchSettings]);

  // ── Toggle with optimistic update ────────────────────────────────────
  const toggleSetting = useCallback(
    async (key: NotificationSettingKey, value: boolean) => {
      if (!user?.id || !settings) return;

      const previous = settings;

      // Build the next state
      let next: UserNotificationSettings;

      if (key === 'notifications_enabled') {
        // Master toggle cascades to every sub-preference
        next = {
          ...settings,
          notifications_enabled: value,
          new_events_enabled: value,
          event_reminders_enabled: value,
          announcements_enabled: value,
        };
      } else {
        next = { ...settings, [key]: value };

        if (value) {
          // Turning on any sub-pref should ensure the master is on
          next.notifications_enabled = true;
        } else {
          // If every sub-pref is now off, turn master off
          const anyOn =
            (key !== 'new_events_enabled' && next.new_events_enabled) ||
            (key !== 'event_reminders_enabled' && next.event_reminders_enabled) ||
            (key !== 'announcements_enabled' && next.announcements_enabled);
          if (!anyOn) next.notifications_enabled = false;
        }
      }

      // Optimistic UI
      setSettings(next);

      // Persist
      const { error } = await supabase
        .from('user_notification_settings')
        .update({
          notifications_enabled: next.notifications_enabled,
          new_events_enabled: next.new_events_enabled,
          event_reminders_enabled: next.event_reminders_enabled,
          announcements_enabled: next.announcements_enabled,
        })
        .eq('user_id', user.id);

      if (error) {
        setSettings(previous);
        Alert.alert(
          'Update Failed',
          'Could not save your preference. Please try again.',
        );
      }
    },
    [user?.id, settings],
  );

  return { settings, loading, toggleSetting };
}
