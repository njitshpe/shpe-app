import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface EventActionBarProps {
  onRegisterPress: () => void;
  onCheckInPress: () => void;
  onMorePress: () => void;
  isRegistered?: boolean;
  isCheckInAvailable?: boolean;
  isLoading?: boolean;
}

export const ACTION_BAR_BASE_HEIGHT = 68; // Height without safe area

export default function EventActionBar({
  onRegisterPress,
  onCheckInPress,
  onMorePress,
  isRegistered = false,
  isCheckInAvailable = true,
  isLoading = false,
}: EventActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
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
              borderTopColor: '#E8E5E0',
            },
          }),
        },
      ]}
    >
      <View style={styles.actionRow}>
        {/* Register Pill - Black Background */}
        <Pressable
          style={({ pressed }) => [
            styles.registerPill,
            pressed && styles.pillPressed,
            isLoading && styles.pillDisabled,
          ]}
          onPress={onRegisterPress}
          disabled={isLoading}
        >
          <Ionicons
            name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
            size={20}
            color="#FDFBF7"
          />
          <Text style={styles.registerPillText}>
            {isRegistered ? 'Registered' : 'Register'}
          </Text>
        </Pressable>

        {/* Check-In Pill - White Background */}
        <Pressable
          style={({ pressed }) => [
            styles.contactPill,
            pressed && styles.pillPressed,
            (!isCheckInAvailable || isLoading) && styles.pillDisabled,
          ]}
          onPress={onCheckInPress}
          disabled={!isCheckInAvailable || isLoading}
        >
          <Ionicons name="camera-outline" size={20} color="#1C1C1E" />
          <Text style={styles.contactPillText}>Check-In</Text>
        </Pressable>

        {/* More Circle - White Background */}
        <Pressable
          style={({ pressed }) => [
            styles.moreCircle,
            pressed && styles.pillPressed,
            isLoading && styles.pillDisabled,
          ]}
          onPress={onMorePress}
          disabled={isLoading}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#1C1C1E" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDFBF7',
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
    backgroundColor: '#1C1C1E',
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
    color: '#FDFBF7',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDFBF7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
  },
  contactPillText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  moreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDFBF7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
  },
  pillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  pillDisabled: {
    opacity: 0.5,
  },
});
