import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface AnnouncementsProps {
  title: string;
  message: string;
  onPress?: () => void;
}

export function Announcements({ title, message, onPress }: AnnouncementsProps) {
  const { theme, isDark } = useTheme();

  // Theme-aware accent color (gold for announcements)
  const accentColor = '#D4AF37';
  const gradientColors = isDark
    ? ['rgba(212, 175, 55, 0.18)', 'rgba(212, 175, 55, 0.05)'] as const
    : ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.03)'] as const;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionHeader, { color: theme.subtext }]}>ANNOUNCEMENTS</Text>

      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.card, { borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.4)' }]}
        >
          <View style={styles.iconColumn}>
            <View style={[styles.iconHalo, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.25)' }]}>
              <Ionicons name="megaphone" size={20} color={accentColor} />
            </View>
          </View>

          <View style={styles.textColumn}>
            <Text style={[styles.title, { color: accentColor }]}>{title.toUpperCase()}</Text>
            <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
              {message}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color={isDark ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.5)'} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  iconColumn: {
    justifyContent: 'center',
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});