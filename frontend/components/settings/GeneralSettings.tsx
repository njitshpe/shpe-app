import React, { useEffect, useState, useMemo } from 'react';
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
  Animated,
  Image,
  LayoutAnimation,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, Stack } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { notificationService } from '@/services/notification.service';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Disclaimer } from './Disclaimer';
import { LEGAL_URLS } from '@/constants/legal';
import { DeleteAccountModal } from './DeleteAccountModal';
import type { DeleteAccountResponse } from '@/types/deleteAccount';
import { GRADIENTS } from '@/constants/colors';

export const GeneralSettings = () => {
  const router = useRouter();
  const { theme, isDark, setMode, mode } = useTheme();
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 44; // Standard iOS header height
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // Check permissions on mount
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

  const headerOptions = {
    headerShown: false,
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Guide user to settings since we cannot programmatically revoke permissions
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

      // We use fetch here instead of supabase.functions.invoke because the latter
      // sometimes fails to pass headers correctly in this specific React Native environment.
      const functionUrl = `${supabaseUrl}/functions/v1/delete-account`;

      // Force refresh the session to ensure we have a fresh token
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession.session) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshedSession.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
      });

      const data: DeleteAccountResponse = await response.json();

      if (!response.ok) {
        const errorMessage = (data as any)?.error || 'An error occurred while deleting your account. Please try again or contact support.';
        Alert.alert(
          'Deletion Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
        return;
      }

      if (!data?.success) {
        Alert.alert(
          'Deletion Failed',
          (data as any)?.error || 'Unable to delete account. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Success - sign out and navigate to login
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

  const gradientColors = useMemo(() => isDark
    ? (['#1a1a1a', '#000000'] as const)
    : (['#FFFFFF', '#F2F2F7'] as const), [isDark]);

  const dynamicStyles = useMemo(() => ({
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
  }), [isDark, theme]);

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

  const APP_STORE_URL = 'https://apps.apple.com/us/app/shpe-njit/id6757627370';
  const SHPE_WEBSITE_URL = 'https://www.shpenjit.org/';
  const INSTAGRAM_URL = 'https://www.instagram.com/njitshpe';
  const LINKEDIN_URL = 'https://www.linkedin.com/in/njitshpe/';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBarStyle} translucent backgroundColor="transparent" />
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />

      {/* Custom Header Container */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: headerHeight,
        zIndex: 100,
      }}>
        {/* Background Layer (Fades In) */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity: scrollY.interpolate({
              inputRange: [0, 40],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom border */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
        </Animated.View>

        {/* Foreground Layer (Directly in Header Container, always visible) */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                position: 'absolute',
                left: 16,
                padding: 4,
              }}
            >
              <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>

            {/* Title */}
            <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>Settings</Text>
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={headerOptions} />

        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: headerHeight + 10 }]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >

          {/* Account Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account Settings</Text>
          </View>
          <View style={[styles.card, dynamicStyles.card]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/(app)/(tabs)/profile/settings/blocked-users')}
            >
              <View style={styles.labelContainer}>
                <Ionicons name="ban-outline" size={22} color="#FF3B30" />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>Blocked Users</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push('/(app)/(tabs)/profile/settings/my-reports')}
            >
              <View style={styles.labelContainer}>
                <Ionicons name="flag-outline" size={22} color="#FF9500" />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>My Reports</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity style={styles.row} onPress={() => setDeleteModalVisible(true)}>
              <View style={styles.labelContainer}>
                <Ionicons name="trash-outline" size={22} color={theme.error} />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Preferences</Text>
          </View>
          <View style={[styles.card, dynamicStyles.card]}>
            <TouchableOpacity style={styles.row} onPress={handleToggleNotifications}>
              <View style={styles.labelContainer}>
                <Ionicons
                  name={notificationsEnabled ? "notifications" : "notifications-off"}
                  size={22}
                  color={notificationsEnabled ? "#00d220ff" : "#FF3B30"}
                />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>
                  {notificationsEnabled ? "Notifications On" : "Enable Notifications"}
                </Text>
              </View>

              {/* Visual Indicator of state */}
              <Ionicons
                name={notificationsEnabled ? "checkmark-circle" : "chevron-forward"}
                size={22}
                color={theme.subtext}
              />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <View style={styles.themeSelectorContainer}>
              <View style={styles.labelContainer}>
                <Ionicons
                  name={mode === 'dark' ? "moon" : mode === 'light' ? "sunny" : "settings-sharp"}
                  size={22}
                  color="#5856D6"
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

          {/* Resources Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Resources</Text>
          </View>
          <View style={[styles.card, dynamicStyles.card]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL('mailto:njitshpe@gmail.com?subject=App Support Request')}
            >
              <View style={styles.labelContainer}>
                <Ionicons name="mail-outline" size={22} color="#007AFF" />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>Contact Support</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(APP_STORE_URL)}
            >
              <View style={styles.labelContainer}>
                <Ionicons name="star-outline" size={22} color="#FFCC00" />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>Rate in App Store</Text>
              </View>
              <Feather name="arrow-up-right" size={22} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(SHPE_WEBSITE_URL)}
            >
              <View style={styles.labelContainer}>
                <Ionicons name="globe-outline" size={22} color="#FF9500" />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>SHPE NJIT Website</Text>
              </View>
              <Feather name="arrow-up-right" size={22} color={theme.subtext} />
            </TouchableOpacity>


            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(INSTAGRAM_URL)}
            >
              <View style={styles.labelContainer}>
                <Ionicons name="logo-instagram" size={22} color="#E1306C" />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>SHPE NJIT on Instagram</Text>
              </View>
              <Feather name="arrow-up-right" size={22} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(LINKEDIN_URL)}
            >
              <View style={styles.labelContainer}>
                <Ionicons name="logo-linkedin" size={22} color="#0073ffff" />
                <Text style={[styles.rowLabel, dynamicStyles.text]}>SHPE NJIT on LinkedIn</Text>
              </View>
              <Feather name="arrow-up-right" size={22} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* Footer Section - Sign Out, Logo, Version, Legal */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.signOutButton, dynamicStyles.card]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={theme.error} />
              <Text style={[styles.signOutText, { color: theme.error }]}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/shpe-horizontal.webp')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.footerVersion, dynamicStyles.subtext]}>{versionLabel}</Text>

            <View style={styles.legalLinksContainer}>
              <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.terms)}>
                <Text style={[styles.legalLink, dynamicStyles.subtext]}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={[styles.legalLinkSeparator, dynamicStyles.subtext]}>•</Text>
              <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}>
                <Text style={[styles.legalLink, dynamicStyles.subtext]}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={[styles.legalLinkSeparator, dynamicStyles.subtext]}>•</Text>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowDisclaimer(!showDisclaimer);
                }}
              >
                <Text style={[styles.legalLink, dynamicStyles.subtext]}>Disclaimer</Text>
              </TouchableOpacity>
            </View>

            {showDisclaimer && (
              <View style={styles.footerDisclaimer}>
                <Disclaimer />
              </View>
            )}
          </View>

          <DeleteAccountModal
            visible={deleteModalVisible}
            onClose={() => setDeleteModalVisible(false)}
            onConfirmDelete={handleDeleteAccount}
          />
        </Animated.ScrollView>
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
    paddingTop: 0,
    paddingBottom: 40,
  },
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
  card: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
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
  divider: {
    height: 1,
    marginLeft: 18,
    marginRight: 18,
  },
  backButton: {
    marginTop: 8,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
    marginTop: 12,
    paddingBottom: 40,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  logoContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 50,
  },
  footerAppName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 13,
    marginBottom: 16,
    opacity: 0.5,
    textAlign: 'center',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    opacity: 0.5,
  },
  legalLink: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  legalLinkSeparator: {
    marginHorizontal: 12,
    fontSize: 13,
  },
  footerDisclaimer: {
    width: '100%',
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
