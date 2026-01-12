import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/colors';
import type { RankChange } from '../utils';

interface RankChangeIndicatorProps {
  change: RankChange;
}

export const RankChangeIndicator: React.FC<RankChangeIndicatorProps> = ({ change }) => {
  if (change.direction === 'same') {
    return (
      <View style={styles.rankChangePillProminent}>
        <Ionicons name="remove" size={14} color="#9CA3AF" />
      </View>
    );
  }

  const color = change.direction === 'up' ? '#34C759' : '#FF3B30';
  const icon = change.direction === 'up' ? 'arrow-up' : 'arrow-down';

  return (
    <View style={[styles.rankChangePillProminent, { backgroundColor: `${color}25` }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.rankChangeDeltaProminent, { color }]}>{change.delta}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  rankChangePillProminent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  rankChangeDeltaProminent: {
    ...TYPOGRAPHY.body,
    fontWeight: '800',
    fontSize: 13,
  },
});
