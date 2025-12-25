import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

// SHPE Brand Colors
const SHPE_COLORS = {
  darkBlue: '#002855',
  orange: '#FF5F05',
  white: '#FFFFFF',
  lightBlue: '#00A3E0',
  gray: '#F4F4F4',
  darkGray: '#666666',
};

interface NotificationSettingsScreenProps {
  onClose: () => void;
}

export function NotificationSettingsScreen({ onClose }: NotificationSettingsScreenProps) {
  const {
    preferences,
    permissionStatus,
    isLoading,
    requestPermission,
    updatePreference,
    updateAllPreferences,
    refreshPermissionStatus,
  } = useNotifications();

  const [updating, setUpdating] = useState(false);

  const handleEnableNotifications = async () => {
    if (!permissionStatus.granted) {
      const granted = await requestPermission();
      if (granted) {
        await updateAllPreferences(true);
      }
    } else {
      await handleToggleAll(!preferences.all_enabled);
    }
  };

  const handleToggleAll = async (enabled: boolean) => {
    setUpdating(true);
    try {
      await updateAllPreferences(enabled);
    } finally {
      setUpdating(false);
    }
  };

  const handleTogglePreference = async (
    type: 'event_reminders' | 'new_events' | 'announcements',
    enabled: boolean
  ) => {
    if (!permissionStatus.granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications first to manage individual preferences.',
        [{ text: 'OK' }]
      );
      return;
    }

    setUpdating(true);
    try {
      await updatePreference(type, enabled);
    } finally {
      setUpdating(false);
    }
  };

  const handleTestNotification = async () => {
    if (!permissionStatus.granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications first to send a test notification.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { notificationService } = await import('../lib/notificationService');
    await notificationService.sendImmediateNotification(
      'Test Notification',
      'This is a test notification from SHPE App!'
    );

    Alert.alert('Test Sent', 'Check your notifications!', [{ text: 'OK' }]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Permission Status */}
        <View style={styles.section}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Permission Status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>
                {permissionStatus.granted
                  ? 'Notifications Enabled'
                  : 'Notifications Disabled'}
              </Text>
              <View
                style={[
                  styles.statusIndicator,
                  permissionStatus.granted ? styles.statusActive : styles.statusInactive,
                ]}
              />
            </View>
            {!permissionStatus.granted && (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={handleEnableNotifications}
                disabled={updating}
              >
                <Text style={styles.enableButtonText}>Enable Notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Control</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>All Notifications</Text>
                <Text style={styles.settingDescription}>
                  Master toggle for all notification types
                </Text>
              </View>
              <Switch
                value={preferences.all_enabled && permissionStatus.granted}
                onValueChange={handleToggleAll}
                disabled={!permissionStatus.granted || updating}
                trackColor={{ false: SHPE_COLORS.gray, true: SHPE_COLORS.lightBlue }}
                thumbColor={
                  preferences.all_enabled ? SHPE_COLORS.orange : SHPE_COLORS.darkGray
                }
              />
            </View>
          </View>
        </View>

        {/* Individual Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          {/* Event Reminders */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Event Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get notified before events start
                </Text>
              </View>
              <Switch
                value={preferences.event_reminders}
                onValueChange={(value) => handleTogglePreference('event_reminders', value)}
                disabled={!permissionStatus.granted || !preferences.all_enabled || updating}
                trackColor={{ false: SHPE_COLORS.gray, true: SHPE_COLORS.lightBlue }}
                thumbColor={
                  preferences.event_reminders ? SHPE_COLORS.orange : SHPE_COLORS.darkGray
                }
              />
            </View>
          </View>

          {/* New Events */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>New Event Announcements</Text>
                <Text style={styles.settingDescription}>
                  Be notified when new events are created
                </Text>
              </View>
              <Switch
                value={preferences.new_events}
                onValueChange={(value) => handleTogglePreference('new_events', value)}
                disabled={!permissionStatus.granted || !preferences.all_enabled || updating}
                trackColor={{ false: SHPE_COLORS.gray, true: SHPE_COLORS.lightBlue }}
                thumbColor={
                  preferences.new_events ? SHPE_COLORS.orange : SHPE_COLORS.darkGray
                }
              />
            </View>
          </View>

          {/* General Announcements */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>General Announcements</Text>
                <Text style={styles.settingDescription}>
                  Important SHPE chapter updates
                </Text>
              </View>
              <Switch
                value={preferences.announcements}
                onValueChange={(value) => handleTogglePreference('announcements', value)}
                disabled={!permissionStatus.granted || !preferences.all_enabled || updating}
                trackColor={{ false: SHPE_COLORS.gray, true: SHPE_COLORS.lightBlue }}
                thumbColor={
                  preferences.announcements ? SHPE_COLORS.orange : SHPE_COLORS.darkGray
                }
              />
            </View>
          </View>
        </View>

        {/* Test Notification Button */}
        {permissionStatus.granted && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
              disabled={updating}
            >
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About Notifications</Text>
            <Text style={styles.infoText}>
              Stay updated with SHPE events and announcements. You can customize which
              notifications you receive and manage your preferences anytime.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SHPE_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: SHPE_COLORS.darkBlue,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SHPE_COLORS.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SHPE_COLORS.darkBlue,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: SHPE_COLORS.gray,
    borderRadius: 12,
    padding: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SHPE_COLORS.darkBlue,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: SHPE_COLORS.darkGray,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#F44336',
  },
  enableButton: {
    backgroundColor: SHPE_COLORS.orange,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  enableButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingCard: {
    backgroundColor: SHPE_COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SHPE_COLORS.gray,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SHPE_COLORS.darkBlue,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: SHPE_COLORS.darkGray,
  },
  testButton: {
    backgroundColor: SHPE_COLORS.lightBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: SHPE_COLORS.gray,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SHPE_COLORS.darkBlue,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: SHPE_COLORS.darkGray,
    lineHeight: 20,
  },
});
