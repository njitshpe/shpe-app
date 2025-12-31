import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- IMPORTS FROM YOUR LIB FOLDER ---
import { notificationService } from '@/services/notification.service';
import { eventNotificationHelper } from '@/services/eventNotification.helper';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export const GeneralSettings = () => {
  const router = useRouter();
  const { theme, isDark, setMode, mode } = useTheme();
  const [loading, setLoading] = useState(true);

  // State for your switches
  const [preferences, setPreferences] = useState({
    eventReminders: false,
    newEvents: false,
    announcements: false,
  });

  useEffect(() => {
    loadPreferences();
    initializePermissions();
  }, []);

  // --- 1. LOAD SAVED SETTINGS ---
  const loadPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('user_preferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. CHECK PERMISSIONS ON LOAD ---
  const initializePermissions = async () => {
    const { granted } = await notificationService.checkPermission();
    if (!granted) {
      await notificationService.requestPermission();
    }
  };

  // --- 3. SAVE SETTINGS WHEN TOGGLED ---
  const toggleSwitch = async (key: keyof typeof preferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);

    try {
      await AsyncStorage.setItem('user_preferences', JSON.stringify(newPrefs));
    } catch (error) {
      console.log('Error saving setting:', error);
    }
  };

  // --- 4. TEST: INSTANT NOTIFICATION ---
  const performInstantNotificationTest = async () => {
    const id = await notificationService.sendImmediateNotification(
      "🚀 Instant Test",
      "This notification happened right now!"
    );

    if (!id) {
      Alert.alert("Error", "Could not send. Check permissions.");
    }
  };

  // --- 5. TEST: DELAYED NOTIFICATION ---
  const performDelayedNotificationTest = async () => {
    const id = await notificationService.scheduleNotification(
      "⏳ Delayed Test",
      "This arrived after 3 seconds.",
      { seconds: 3 }
    );
    if (id) {
      Alert.alert("Scheduled", "Lock your phone now to see it appear in 3 seconds.");
    }
  };

  // --- 6. DATABASE CHECK TEST ---
  const performEventCheckTest = async () => {
    setLoading(true);
    try {
      await eventNotificationHelper.resetLastCheck();
      const result = await eventNotificationHelper.checkAndNotifyNewEvents();
      Alert.alert("Check Complete", `Found ${result.count} new events.`);
    } catch (error) {
      Alert.alert("Error", "Failed to check events.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.dismissAll();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />;
  }

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    sectionTitle: { color: theme.subtext },
    card: { backgroundColor: theme.card, shadowColor: isDark ? '#000' : '#000' },
    text: { color: theme.text },
    subtext: { color: theme.subtext },
    divider: { backgroundColor: theme.border },
    backButton: { backgroundColor: theme.card, borderColor: theme.border },
    backButtonText: { color: theme.text },
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>

      {/* --- APPEARANCE SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>APPEARANCE</Text>
      </View>
      <View style={[styles.card, dynamicStyles.card]}>
        <View style={styles.themeSelectorContainer}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
              <Ionicons name={mode === 'dark' ? "moon" : mode === 'light' ? "sunny" : "settings-sharp"} size={20} color={theme.text} />
            </View>
            <View>
              <Text style={[styles.rowLabel, dynamicStyles.text]}>App Theme</Text>
              <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>
                {mode === 'system' ? 'Follows device settings' : mode === 'dark' ? 'Dark mode always on' : 'Light mode always on'}
              </Text>
            </View>
          </View>

          <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
            {(['light', 'dark', 'system'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.segmentButton,
                  mode === m && { backgroundColor: theme.primary },
                  mode === m && styles.segmentButtonActive,
                ]}
                onPress={() => setMode(m)}
              >
                <Text style={[
                  styles.segmentText,
                  { color: mode === m ? '#fff' : theme.subtext }
                ]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* --- NOTIFICATIONS SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>NOTIFICATIONS</Text>
      </View>
      <View style={[styles.card, dynamicStyles.card]}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="calendar" size={20} color={theme.info} />
            </View>
            <View>
              <Text style={[styles.rowLabel, dynamicStyles.text]}>Event Reminders</Text>
              <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>Get notified before events start</Text>
            </View>
          </View>
          <Switch
            value={preferences.eventReminders}
            onValueChange={() => toggleSwitch('eventReminders')}
            trackColor={{ false: '#767577', true: theme.primary }}
          />
        </View>
        <View style={[styles.divider, dynamicStyles.divider]} />

        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="add-circle" size={20} color={theme.success} />
            </View>
            <View>
              <Text style={[styles.rowLabel, dynamicStyles.text]}>New Events</Text>
              <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>When new events are posted</Text>
            </View>
          </View>
          <Switch
            value={preferences.newEvents}
            onValueChange={() => toggleSwitch('newEvents')}
            trackColor={{ false: '#767577', true: theme.primary }}
          />
        </View>
      </View>

      {/* --- DEBUG / TESTS --- */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>DEBUG / TEST SERVICES</Text>
      </View>
      <View style={[styles.card, dynamicStyles.card]}>

        {/* Instant Test */}
        <TouchableOpacity style={styles.row} onPress={performInstantNotificationTest}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
              <Ionicons name="flash" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, dynamicStyles.text]}>Test Instant Notification</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </TouchableOpacity>

        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Delayed Test */}
        <TouchableOpacity style={styles.row} onPress={performDelayedNotificationTest}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
              <Ionicons name="timer" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, dynamicStyles.text]}>Test Delayed (3s)</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </TouchableOpacity>

        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Database Check */}
        <TouchableOpacity style={styles.row} onPress={performEventCheckTest}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
              <Ionicons name="server" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, dynamicStyles.text]}>Run "New Event" Check</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </TouchableOpacity>

      </View>

      {/* --- ACCOUNT SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>ACCOUNT</Text>
      </View>
      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.error} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.error }]}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* --- RETURN TO PROFILE BUTTON --- */}
      <TouchableOpacity
        style={[styles.backButton, dynamicStyles.backButton]}
        onPress={() => router.replace('/(tabs)/profile')}
      >
        <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>Return to Profile</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
  versionText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 10,
  },
  backButton: {
    marginTop: 30,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  themeSelectorContainer: {
    padding: 16,
    gap: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    height: 40,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  }
});