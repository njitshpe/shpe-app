import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface RankTrajectoryProps {
  currentPoints: number;
  rankTitle: string;
  nextRankThreshold: number;
  onPress: () => void;
}

export function RankTrajectory({ currentPoints, rankTitle, nextRankThreshold, onPress }: RankTrajectoryProps) {
  const { theme, isDark } = useTheme();
  const progress = Math.min(Math.max(currentPoints / nextRankThreshold, 0), 1);
  const pointsNeeded = nextRankThreshold - currentPoints;

  const gradientColors = isDark
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as const
    : ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.01)'] as const;

  // Accent color for ranking (gold)
  const accentColor = '#FFD700';

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: theme.subtext }]}>RANK TRAJECTORY</Text>

      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <LinearGradient
          colors={gradientColors}
          style={[styles.card, { borderColor: theme.border }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top Row: Rank & Icon */}
          <View style={styles.topRow}>
            <View style={styles.rankInfo}>
              <View style={[styles.iconHalo, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.2)' }]}>
                <Ionicons name="trophy" size={16} color={accentColor} />
              </View>
              <Text style={[styles.rankTitle, { color: isDark ? accentColor : theme.primary }]}>{rankTitle.toUpperCase()}</Text>
            </View>
            <Text style={styles.pointsDisplay}>
              <Text style={{color: theme.text}}>{currentPoints}</Text>
              <Text style={{color: theme.subtext}}> / {nextRankThreshold} PTS</Text>
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>

          {/* Footer Text */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.subtext }]}>
              {pointsNeeded > 0
                ? `${pointsNeeded} POINTS TO NEXT TIER`
                : "MAXIMUM RANK ACHIEVED"}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
          </View>

        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl + 20,
  },
  header: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconHalo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pointsDisplay: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});