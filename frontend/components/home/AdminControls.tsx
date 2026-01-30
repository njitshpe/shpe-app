import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface AdminControlsProps {
  onDebug: () => void;
  onAdmin: () => void;
}

export function AdminControls({ onDebug, onAdmin }: AdminControlsProps) {
  const { theme, isDark } = useTheme();

  const gradientColors = isDark
    ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'] as const
    : ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.02)'] as const;

  // Accent color for admin controls (gold)
  const accentColor = '#FFD700';

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: theme.subtext }]}>ADMIN CONTROLS</Text>

      <View style={styles.row}>
        <TouchableOpacity activeOpacity={0.85} onPress={onDebug}>
          <LinearGradient
            colors={gradientColors}
            style={[styles.card, { borderColor: theme.border }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.iconHalo, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 215, 0, 0.2)' }]}>
              <Ionicons name="terminal" size={20} color={accentColor} />
            </View>
            <Text style={[styles.cardLabel, { color: theme.text }]}>DEBUG CONSOLE</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={onAdmin}>
          <LinearGradient
            colors={gradientColors}
            style={[styles.card, { borderColor: theme.border }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.iconHalo, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 215, 0, 0.2)' }]}>
              <Ionicons name="shield-checkmark" size={20} color={accentColor} />
            </View>
            <Text style={[styles.cardLabel, { color: theme.text }]}>ADMIN PANEL</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  header: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    width: 160,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  iconHalo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
