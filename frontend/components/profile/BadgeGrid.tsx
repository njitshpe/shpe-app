import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

export interface Badge {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

interface BadgeGridProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
}

export function BadgeGrid({ badges, onBadgePress }: BadgeGridProps) {
  const { theme, isDark } = useTheme();

  const glassBackground = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.05)';

  const handleBadgePress = (badge: Badge) => {
    Haptics.selectionAsync();
    onBadgePress?.(badge);
  };

  if (badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.ghostBadge, { backgroundColor: glassBackground }]}>
          <Ionicons
            name="ribbon-outline"
            size={28}
            color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
          />
        </View>
        <Text style={[styles.emptyText, { color: theme.subtext }]}>
          Earn Badges
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, badges.length < 4 && styles.containerCentered]}>
      {badges.map((badge) => (
        <TouchableOpacity
          key={badge.id}
          style={styles.badgeItem}
          onPress={() => handleBadgePress(badge)}
          activeOpacity={0.7}
          disabled={!onBadgePress}
        >
          <View style={[styles.badgeCircle, { backgroundColor: glassBackground }]}>
            <Ionicons name={badge.icon} size={28} color={badge.color} />
          </View>
          <Text
            style={[styles.badgeLabel, { color: theme.text }]}
            numberOfLines={1}
          >
            {badge.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  containerCentered: {
    justifyContent: 'center',
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 64,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  ghostBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 6,
  },
});
