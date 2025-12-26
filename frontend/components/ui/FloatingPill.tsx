import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface FloatingPillProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function FloatingPill({ children, style, intensity = 80 }: FloatingPillProps) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="dark" style={[styles.pill, styles.pillWithBorder, style]}>
        {children}
      </BlurView>
    );
  }

  // Android fallback: semi-transparent background with subtle border
  return (
    <View style={[styles.pill, styles.androidPill, styles.pillWithBorder, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 22,
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingVertical: 11,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  pillWithBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  androidPill: {
    backgroundColor: 'rgba(17, 24, 39, 0.70)',
  },
});
