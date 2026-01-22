import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- IMPORTS ---
import { notificationService } from '@/services/notification.service';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';
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
          router.replace('/(auth)/welcome');
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

      // Call the delete-account edge function using fetch directly
      // supabase.functions.invoke can fail to pass headers correctly in React Native
      const functionUrl = `${supabaseUrl}/functions/v1/delete-account`;

      // Force refresh the session to ensure we have a fresh token
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession.session) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      // Debug logging
      console.log('[delete-account] Function URL:', functionUrl);
      console.log('[delete-account] Token (first 20 chars):', refreshedSession.session.access_token.substring(0, 20));
      console.log('[delete-account] API Key present:', !!supabaseAnonKey);
      console.log('[delete-account] API Key (first 10 chars):', supabaseAnonKey?.substring(0, 10));

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshedSession.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
      });

      console.log('[delete-account] Response status:', response.status);

      const data: DeleteAccountResponse = await response.json();

      if (!response.ok) {
        console.error('Delete account error:', data);
        const errorMessage = (data as any)?.error || 'An error occurred while deleting your account. Please try again or contact support.';
        Alert.alert(
          'Deletion Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
        return;
      }

      if (!data?.success) {
        console.error('Delete account failed:', data);
        Alert.alert(
          'Deletion Failed',
          (data as any)?.error || 'Unable to delete account. Please try again.',
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
              router.replace('/(auth)/welcome');
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

  const appName = Constants.expoConfig?.name ?? 'SHPE NJIT';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    (Constants.expoConfig?.android?.versionCode
      ? String(Constants.expoConfig.android.versionCode)
      : undefined);
  const versionLabel = `Version ${version}`;

  const gradientColors = isDark
    ? (['#1a1a1a', '#000000'] as const)
    : (['#FFFFFF', '#F2F2F7'] as const);

  const dynamicStyles = {
    sectionTitle: { color: theme.subtext },
    card: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
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
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    },
    backButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
      ...(isDark
        ? null
        : {
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }),
    },
    backButtonText: { color: theme.text },
    segmentedControl: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F2F2F7',
    },
    segmentActive: isDark
      ? {
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
        }
      : {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 2,
        },
  };

  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle={statusBarStyle} translucent backgroundColor="transparent" />
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBarStyle} translucent backgroundColor="transparent" />
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>SETTINGS</Text>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* --- APPEARANCE --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>APPEARANCE</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.themeSelectorContainer}>
            <View style={styles.labelContainer}>
              <Ionicons
                name={mode === 'dark' ? "moon" : mode === 'light' ? "sunny" : "settings-sharp"}
                size={22}
                color={theme.text}
              />
              <View>
                <Text style={[styles.rowLabel, dynamicStyles.text]}>App Theme</Text>
              </View>
            </View>
            <View style={[styles.segmentedControl, dynamicStyles.segmentedControl]}>
              {(['light', 'dark', 'system'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.segmentButton,
                    mode === m && dynamicStyles.segmentActive,
                  ]}
                  onPress={() => setMode(m)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: mode === m ? theme.text : theme.subtext },
                    ]}
                  >
                    {m}
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
              <Ionicons
                name={notificationsEnabled ? "notifications" : "notifications-off"}
                size={22}
                color={theme.text}
              />
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
              size={22}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* --- SUPPORT --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>SUPPORT</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('mailto:njitshpe@gmail.com?subject=App Support Request')}
          >
            <View style={styles.labelContainer}>
              <Ionicons name="mail-outline" size={22} color={theme.text} />
              <View>
                <Text style={[styles.rowLabel, dynamicStyles.text]}>Contact Support</Text>
                <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>
                  Report or ask questions - njitshpe@gmail.com
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
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
              <Ionicons name="document-text-outline" size={22} color={theme.text} />
              <Text style={[styles.rowLabel, dynamicStyles.text]}>Terms of Use</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={[styles.divider, dynamicStyles.divider]} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}
          >
            <View style={styles.labelContainer}>
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.text} />
              <Text style={[styles.rowLabel, dynamicStyles.text]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* --- PRIVACY --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>PRIVACY</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(app)/settings/blocked-users')}
          >
            <View style={styles.labelContainer}>
              <Ionicons name="ban-outline" size={22} color={theme.text} />
              <View>
                <Text style={[styles.rowLabel, dynamicStyles.text]}>Blocked Users</Text>
                <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>
                  Manage users you have blocked
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={[styles.divider, dynamicStyles.divider]} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(app)/settings/my-reports')}
          >
            <View style={styles.labelContainer}>
              <Ionicons name="flag-outline" size={22} color={theme.text} />
              <View>
                <Text style={[styles.rowLabel, dynamicStyles.text]}>My Reports</Text>
                <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>
                  View reports you have submitted
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* --- ACCOUNT --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>ACCOUNT</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <View style={styles.labelContainer}>
              <Ionicons name="log-out-outline" size={22} color={theme.error} />
              <Text style={[styles.rowLabel, { color: theme.error }]}>Log Out</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, dynamicStyles.divider]} />

          <TouchableOpacity style={styles.row} onPress={() => setDeleteModalVisible(true)}>
            <View style={styles.labelContainer}>
              <Ionicons name="trash-outline" size={22} color={theme.error} />
              <View>
                <Text style={[styles.rowLabel, { color: theme.error }]}>Delete Account</Text>
                <Text style={[styles.rowSubLabel, dynamicStyles.subtext]}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.error} />
          </TouchableOpacity>
        </View>

        {/* --- RETURN BUTTON --- */}
        <TouchableOpacity
          style={[styles.backButton, dynamicStyles.backButton]}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>
            Return to Profile
          </Text>
        </TouchableOpacity>

        {/* --- FOOTER --- */}
        <View style={styles.footer}>
          <Text style={[styles.footerAppName, dynamicStyles.subtext]}>{appName}</Text>
          <Text style={[styles.footerVersion, dynamicStyles.subtext]}>{versionLabel}</Text>
          <View style={styles.footerDisclaimer}>
            <Disclaimer />
          </View>
        </View>

        {/* --- DELETE ACCOUNT MODAL --- */}
        <DeleteAccountModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirmDelete={handleDeleteAccount}
        />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginLeft: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    marginLeft: 18,
    marginRight: 18,
  },
  backButton: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  themeSelectorContainer: {
    padding: 16,
    gap: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerAppName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 13,
    marginBottom: 8,
  },
  footerDisclaimer: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
