import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { FloatingPill } from './FloatingPill';

interface FloatingIconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function FloatingIconButton({ icon, onPress, style, intensity }: FloatingIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <FloatingPill style={[styles.pillContent, style]} intensity={intensity}>
        {icon}
      </FloatingPill>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // No extra styling needed, Pressable wraps pill
  },
  buttonPressed: {
    opacity: 0.65,
  },
  pillContent: {
    paddingHorizontal: 11,
    paddingVertical: 10,
    minHeight: 40,
    minWidth: 40,
  },
});
