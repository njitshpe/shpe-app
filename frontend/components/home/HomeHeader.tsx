import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SPACING } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface HomeHeaderProps {
  unreadCount?: number;
  hasUnreadNotifications?: boolean;
}

export function HomeHeader({
  unreadCount = 0,
  hasUnreadNotifications = false,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const showBadge = unreadCount > 0 || hasUnreadNotifications;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Left spacer */}
      <View style={styles.sideSection} />

      {/* Right: bell icon */}
      <View style={styles.sideSection}>
        <Pressable
          style={[
            styles.bellButton,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
          onPress={() => router.push('/notifications')}
          hitSlop={8}
        >
          <Ionicons
            name={showBadge ? 'notifications' : 'notifications-outline'}
            size={20}
            color={isDark ? '#FFFFFF' : '#1C1C1E'}
          />
          {showBadge && (
            <View
              style={[
                styles.badge,
                unreadCount === 0 && styles.badgeDotOnly,
              ]}
            >
              {unreadCount > 0 && (
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sideSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeDotOnly: {
    minWidth: 10,
    height: 10,
    borderRadius: 5,
    top: 0,
    right: -1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
