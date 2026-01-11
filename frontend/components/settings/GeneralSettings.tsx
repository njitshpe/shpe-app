import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// --- IMPORTS ---
import { notificationService } from '@/services/notification.service';
import { supabase, supabaseAnonKey } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Disclaimer } from './Disclaimer';
import { LEGAL_URLS } from '@/constants/legal';
import { DeleteAccountModal } from './DeleteAccountModal';
import type { DeleteAccountResponse } from '@/types/deleteAccount';

export const GeneralSettings = () => {
  const router = useRouter();
  const { theme, isDark, setMode, mode } = useTheme();
  const [loading, setLoading] = useState(true);

  // State for single notification permission
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // State for delete account modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // --- 1. CHECK PERMISSION STATUS ---
  const checkPermissionStatus = async () => {
    try {
      const { granted } = await notificationService.checkPermission();
      setNotificationsEnabled(granted);
    } catch (error) {
      console.log('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HANDLE ENABLE REQUEST ---
  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Optional: If they want to turn it off, guide them to settings
      // since apps cannot revoke their own permissions programmatically.
      Alert.alert(
        "Notifications Enabled",
        "To turn off notifications, please go to your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
    } else {
      // Request permission
      const { granted } = await notificationService.requestPermission();
      setNotificationsEnabled(granted);

      if (!granted) {
        // If they denied it previously, we might need to send them to settings
        Alert.alert(
          "Permission Required",
          "Notifications are currently disabled. Please enable them in your device settings to receive updates.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
      }
    }
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure?", [
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

  // --- DELETE ACCOUNT ---
  const handleDeleteAccount = async () => {
    try {
      // Get current user session and refresh if needed
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at - now < 300) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            Alert.alert('Error', 'Session expired. Please log in again.');
            return;
          }
          session = refreshData.session;
        }
      }

      if (sessionError || !session?.access_token) {
        Alert.alert('Error', 'You must be logged in to delete your account.');
        return;
      }

      // Call the delete-account edge function
      // In React Native, we must explicitly pass the Authorization header
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
      };

      if (supabaseAnonKey) {
        headers.apikey = supabaseAnonKey;
      }

      const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(
        'delete-account',
        { headers }
      );

      if (error) {
        console.error('Delete account error:', error);
        Alert.alert(
          'Deletion Failed',
          'An error occurred while deleting your account. Please try again or contact support.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!data?.success) {
        console.error('Delete account failed:', data);
        Alert.alert(
          'Deletion Failed',
          data?.error || 'Unable to delete account. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Success - sign out and navigate to login
      console.log('Account deleted successfully:', data.deletionSummary);

      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. You will now be signed out.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await supabase.auth.signOut();
              router.dismissAll();
              router.replace('/(auth)/login');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Delete account exception:', error);
      Alert.alert(
        'Unexpected Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />;
  }

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

      {/* --- APPEARANCE --- */}
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
                <Text style={[styles.segmentText, { color: mode === m ? '#fff' : theme.subtext }]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* --- NOTIFICATIONS --- */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>NOTIFICATIONS</Text>
      </View>
      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity style={styles.row} onPress={handleToggleNotifications}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: notificationsEnabled ? '#DCFCE7' : '#F3F4F6' }]}>
              <Ionicons
                name={notificationsEnabled ? "notifications" : "notifications-off"}
                size={20}
                color={notificationsEnabled ? theme.success : theme.subtext}
              />
            </View>
            <View>
              <Text style={[styles.rowLabel, dynamicStyles.text]}>
                {notificationsEnabled ? "Notifications On" : "Enable Notifications"}
              </Text>
              <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>
                {notificationsEnabled
                  ? "Tap to manage in settings"
                  : "Tap to allow permission"}
              </Text>
            </View>
          </View>

          {/* Visual Indicator of state */}
          <Ionicons
            name={notificationsEnabled ? "checkmark-circle" : "chevron-forward"}
            size={24}
            color={notificationsEnabled ? theme.success : theme.subtext}
          />
        </TouchableOpacity>
      </View>

      {/* --- LEGAL --- */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>LEGAL</Text>
      </View>
      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.terms)}
        >
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#E8F5E9' }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.text} />
            </View>
            <Text style={[styles.rowLabel, dynamicStyles.text]}>Terms of Use</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
        </TouchableOpacity>

        <View style={[styles.divider, dynamicStyles.divider]} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}
        >
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#E3F2FD' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
            </View>
            <Text style={[styles.rowLabel, dynamicStyles.text]}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
        </TouchableOpacity>
      </View>

      {/* --- ACCOUNT --- */}
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

        <View style={[styles.divider, dynamicStyles.divider]} />

        <TouchableOpacity style={styles.row} onPress={() => setDeleteModalVisible(true)}>
          <View style={styles.labelContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: theme.error }]}>Delete Account</Text>
              <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>
                Permanently delete your account and data
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.error} />
        </TouchableOpacity>
      </View>

      {/* --- RETURN BUTTON --- */}
      <TouchableOpacity
        style={[styles.backButton, dynamicStyles.backButton]}
        onPress={() => router.replace('/(tabs)/profile')}
      >
        <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>Return to Profile</Text>
      </TouchableOpacity>

      <Disclaimer />

      <Text style={styles.versionText}>Version 1.0.0</Text>
      <View style={{ height: 40 }} />

      {/* --- DELETE ACCOUNT MODAL --- */}
      <DeleteAccountModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirmDelete={handleDeleteAccount}
      />
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  }
});
