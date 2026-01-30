import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface EventActionBarProps {
  onRegisterPress: () => void;
  onCheckInPress: () => void;
  onMorePress: () => void;
  isRegistered?: boolean;
  isCheckInAvailable?: boolean;
  isRegisterAvailable?: boolean;
  isLoading?: boolean;
}

export const ACTION_BAR_BASE_HEIGHT = 68; // Height without safe area

export default function EventActionBar({
  onRegisterPress,
  onCheckInPress,
  onMorePress,
  isRegistered = false,
  isCheckInAvailable = true,
  isRegisterAvailable = true,
  isLoading = false,
}: EventActionBarProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const dynamicStyles = {
    container: { backgroundColor: theme.background, borderTopColor: theme.border },
    registerPill: { backgroundColor: theme.text }, // Inverted for contrast
    registerPillText: { color: theme.background }, // Inverted text
    contactPill: { backgroundColor: theme.background, borderColor: theme.text },
    contactPillText: { color: theme.text },
    moreCircle: { backgroundColor: theme.background, borderColor: theme.text },
    iconColorInverted: theme.background,
    iconColor: theme.text,
  };

  return (
    <View
      style={[
        styles.container,
        dynamicStyles.container,
        {
          paddingBottom: insets.bottom || 16,
          // iOS uses shadow, Android uses elevation
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
              borderTopWidth: 1,
              // borderTopColor handled in dynamicStyles
            },
          }),
        },
      ]}
    >
      <View style={styles.actionRow}>
        {/* Register Pill - Inverted Background */}
        <Pressable
          style={({ pressed }) => [
            styles.registerPill,
            dynamicStyles.registerPill,
            pressed && styles.pillPressed,
            (!isRegisterAvailable || isLoading) && styles.pillDisabled,
          ]}
          onPress={onRegisterPress}
          disabled={!isRegisterAvailable || isLoading}
        >
          <Ionicons
            name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
            size={20}
            color={dynamicStyles.iconColorInverted}
          />
          <Text style={[styles.registerPillText, dynamicStyles.registerPillText]}>
            {isRegistered ? 'Registered' : 'Register'}
          </Text>
        </Pressable>

        {/* Check-In Pill - Normal Background */}
        <Pressable
          style={({ pressed }) => [
            styles.contactPill,
            dynamicStyles.contactPill,
            pressed && styles.pillPressed,
            (!isCheckInAvailable || isLoading) && styles.pillDisabled,
          ]}
          onPress={onCheckInPress}
          disabled={!isCheckInAvailable || isLoading}
        >
          <Ionicons name="camera-outline" size={20} color={dynamicStyles.iconColor} />
          <Text style={[styles.contactPillText, dynamicStyles.contactPillText]}>Check-In</Text>
        </Pressable>

        {/* More Circle - Normal Background */}
        <Pressable
          style={({ pressed }) => [
            styles.moreCircle,
            dynamicStyles.moreCircle,
            pressed && styles.pillPressed,
            isLoading && styles.pillDisabled,
          ]}
          onPress={onMorePress}
          disabled={isLoading}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={dynamicStyles.iconColor} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor removed
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  registerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor removed
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  registerPillText: {
    // color removed
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor removed
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1.5,
    // borderColor removed
  },
  contactPillText: {
    // color removed
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  moreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    // backgroundColor removed
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    // borderColor removed
  },
  pillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  pillDisabled: {
    opacity: 0.5,
  },
});
