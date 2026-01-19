import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/colors';

interface RankTrajectoryProps {
  currentPoints: number;
  rankTitle: string;
  nextRankThreshold: number;
  onPress: () => void;
}

export function RankTrajectory({ currentPoints, rankTitle, nextRankThreshold, onPress }: RankTrajectoryProps) {
  const progress = Math.min(Math.max(currentPoints / nextRankThreshold, 0), 1);
  const pointsNeeded = nextRankThreshold - currentPoints;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>RANK TRAJECTORY</Text>
      
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top Row: Rank & Icon */}
          <View style={styles.topRow}>
            <View style={styles.rankInfo}>
              <View style={styles.iconHalo}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
              </View>
              <Text style={styles.rankTitle}>{rankTitle.toUpperCase()}</Text>
            </View>
            <Text style={styles.pointsDisplay}>
              <Text style={{color: '#FFF'}}>{currentPoints}</Text>
              <Text style={{color: 'rgba(255,255,255,0.4)'}}> / {nextRankThreshold} PTS</Text>
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']} // Gold Gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>

          {/* Footer Text */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {pointsNeeded > 0 
                ? `${pointsNeeded} POINTS TO NEXT TIER` 
                : "MAXIMUM RANK ACHIEVED"}
            </Text>
            <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.3)" />
          </View>

        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl + 20, // Extra padding at bottom for scroll
  },
  header: {
    color: 'rgba(255,255,255,0.6)',
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTitle: {
    color: '#FFD700',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});