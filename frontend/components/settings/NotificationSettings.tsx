import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useNotificationSettings,
  type NotificationSettingKey,
} from '@/hooks/notifications/useNotificationSettings';

// ── Screen ──────────────────────────────────────────────────────────────

export function NotificationSettings() {
  const { theme, isDark } = useTheme();
  const { settings, loading, toggleSetting } = useNotificationSettings();

  const masterEnabled = settings?.notifications_enabled ?? false;

  // Match GeneralSettings card styling
  const dynamicStyles = useMemo(
    () => ({
      sectionTitle: { color: theme.subtext },
      card: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
        borderColor: isDark
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        ...(isDark
          ? null
          : {
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }),
      },
      text: { color: theme.text },
      subtext: { color: theme.subtext },
      divider: {
        backgroundColor: isDark
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.06)',
      },
    }),
    [isDark, theme],
  );

  if (loading || !settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const subDisabled = !masterEnabled;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Master toggle ──────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
          Notifications
        </Text>
      </View>

      <View style={[styles.card, dynamicStyles.card]}>
        <SettingRow
          icon={masterEnabled ? 'notifications' : 'notifications-off'}
          iconColor={masterEnabled ? '#34C759' : '#FF3B30'}
          label="Allow Notifications"
          description="Master control for all notification types"
          value={masterEnabled}
          onToggle={(v) => toggleSetting('notifications_enabled', v)}
          textStyle={dynamicStyles.text}
          subtextStyle={dynamicStyles.subtext}
        />
      </View>

      {/* ── Category toggles ───────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
          Categories
        </Text>
      </View>

      <View
        style={[
          styles.card,
          dynamicStyles.card,
          subDisabled && styles.disabledCard,
        ]}
      >
        <SettingRow
          icon="calendar-outline"
          iconColor="#007AFF"
          label="New Events"
          description="Get notified when a new event is posted"
          value={settings.new_events_enabled}
          onToggle={(v) => toggleSetting('new_events_enabled', v)}
          disabled={subDisabled}
          textStyle={dynamicStyles.text}
          subtextStyle={dynamicStyles.subtext}
        />

        <View style={[styles.divider, dynamicStyles.divider]} />

        <SettingRow
          icon="bookmark-outline"
          iconColor="#FF9500"
          label="My Event Updates"
          description="Reminders and updates for events you've saved"
          value={settings.event_reminders_enabled}
          onToggle={(v) => toggleSetting('event_reminders_enabled', v)}
          disabled={subDisabled}
          textStyle={dynamicStyles.text}
          subtextStyle={dynamicStyles.subtext}
        />

        <View style={[styles.divider, dynamicStyles.divider]} />

        <SettingRow
          icon="megaphone-outline"
          iconColor="#AF52DE"
          label="Announcements"
          description="Important announcements from SHPE NJIT"
          value={settings.announcements_enabled}
          onToggle={(v) => toggleSetting('announcements_enabled', v)}
          disabled={subDisabled}
          textStyle={dynamicStyles.text}
          subtextStyle={dynamicStyles.subtext}
        />
      </View>
    </ScrollView>
  );
}

// ── SettingRow ───────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  textStyle: { color: string };
  subtextStyle: { color: string };
}

function SettingRow({
  icon,
  iconColor,
  label,
  description,
  value,
  onToggle,
  disabled = false,
  textStyle,
  subtextStyle,
}: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon} size={22} color={iconColor} />
        <View style={styles.textContainer}>
          <Text style={[styles.rowLabel, textStyle]}>{label}</Text>
          <Text style={[styles.rowDescription, subtextStyle]}>
            {description}
          </Text>
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#767577', true: '#34C759' }}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  sectionHeader: {
    marginTop: 4,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    marginBottom: 4,
  },

  // Card
  card: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
  },
  disabledCard: {
    opacity: 0.4,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowDescription: {
    fontSize: 13,
  },

  // Divider
  divider: {
    height: 1,
    marginLeft: 18,
    marginRight: 18,
  },
});
