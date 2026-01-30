import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface RankProgressCardProps {
  pointsTotal: number;
  tier: string;
  rankColor: string;
  pointsToNextTier?: number;
}

export function RankProgressCard({
  pointsTotal,
  tier,
  rankColor,
  pointsToNextTier,
}: RankProgressCardProps) {
  const { isDark } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

  const content = (
    <View style={styles.content}>
      <View style={styles.section}>
        <View style={styles.pointsRow}>
          <Text style={[styles.pointsValue, { color: textColor }]}>
            {pointsTotal.toLocaleString()}
          </Text>
          <Ionicons name="sparkles" size={16} color={textColor} style={styles.sparkleIcon} />
        </View>
        <Text style={[styles.label, { color: labelColor }]}>POINTS</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      <View style={styles.section}>
        <Text style={[styles.tierValue, { color: rankColor }]}>
          {tier.toUpperCase()}
        </Text>
        <Text style={[styles.label, { color: labelColor }]}>TIER</Text>
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <Pressable onPress={handlePress}>
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.container, styles.containerBorder]}
        >
          {content}
        </BlurView>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <View
        style={[
          styles.container,
          styles.containerBorder,
          styles.androidContainer,
          { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.70)' },
        ]}
      >
        {content}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  androidContainer: {
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    flex: 1,
    alignItems: 'center',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  sparkleIcon: {
    marginLeft: 6,
  },
  tierValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  label: {
    fontSize: 10,
    letterSpacing: 2.5,
    marginTop: 4,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
});
