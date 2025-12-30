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
import { notificationService } from '@/lib/notificationService';
import { eventNotificationHelper } from '@/lib/eventNotificationHelper';
import { supabase } from '@/lib/supabase';

const COLORS = {
  primary: '#D35400', 
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1F2937',
  subtext: '#6B7280',
  border: '#F3F4F6',
  destructive: '#EF4444',
  success: '#34C759',
  info: '#0284C7'
};

export const GeneralSettings = () => {
  const router = useRouter();
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
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      
      {/* --- NOTIFICATIONS SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="calendar" size={20} color={COLORS.info} />
            </View>
            <View>
              <Text style={styles.rowLabel}>Event Reminders</Text>
              <Text style={styles.rowSubLabel}>Get notified before events start</Text>
            </View>
          </View>
          <Switch
            value={preferences.eventReminders}
            onValueChange={() => toggleSwitch('eventReminders')}
            trackColor={{ false: '#767577', true: COLORS.primary }}
          />
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="add-circle" size={20} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.rowLabel}>New Events</Text>
              <Text style={styles.rowSubLabel}>When new events are posted</Text>
            </View>
          </View>
          <Switch
            value={preferences.newEvents}
            onValueChange={() => toggleSwitch('newEvents')}
            trackColor={{ false: '#767577', true: COLORS.primary }}
          />
        </View>
      </View>

      {/* --- DEBUG / TESTS --- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DEBUG / TEST SERVICES</Text>
      </View>
      <View style={styles.card}>
        
        {/* Instant Test (Black Text) */}
        <TouchableOpacity style={styles.row} onPress={performInstantNotificationTest}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>Test Instant Notification</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.subtext} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Delayed Test */}
        <TouchableOpacity style={styles.row} onPress={performDelayedNotificationTest}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="timer" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>Test Delayed (3s)</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.subtext} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Database Check */}
        <TouchableOpacity style={styles.row} onPress={performEventCheckTest}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="server" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>Run "New Event" Check</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.subtext} />
        </TouchableOpacity>

      </View>

      {/* --- ACCOUNT SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
      </View>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.destructive} />
            </View>
            <Text style={[styles.rowLabel, { color: COLORS.destructive }]}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* --- RETURN TO PROFILE BUTTON --- */}
      <TouchableOpacity 
        style={styles.backButton} 
        // THIS IS THE FIX: Point directly to the profile tab
        onPress={() => router.replace('/(tabs)/profile')} 
      >
        <Text style={styles.backButtonText}>Return to Profile</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60, 
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: COLORS.subtext,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
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
    color: COLORS.text,
  },
  rowSubLabel: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
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
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 16,
  }
});