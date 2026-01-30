import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface HomeHeaderProps {
  hasUnreadNotifications?: boolean;
}

export function HomeHeader({ hasUnreadNotifications = false }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

      {/* 1. Invisible Spacer (Left) */}
      <View style={styles.sideSection} />

      {/* 3. Right Indicator */}
      <View style={styles.sideSection}>
        {hasUnreadNotifications && <View style={[styles.notificationDot, { backgroundColor: theme.error }]} />}
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
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
