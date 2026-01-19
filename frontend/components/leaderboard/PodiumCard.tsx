import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS } from '@/constants/colors';
import { getInitials } from '@/utils/leaderboard';
import type { LeaderboardEntry } from '@/types/leaderboard';

interface PodiumCardProps {
  entry: LeaderboardEntry;
  position: 'first' | 'second' | 'third';
  currentUserId?: string;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ entry, position, currentUserId }) => {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const isFirst = position === 'first';
  const isSecond = position === 'second';
  const isThird = position === 'third';

  const rankNumber = position === 'first' ? 1 : position === 'second' ? 2 : 3;

  const badgeColors = {
    first: '#FFD700',
    second: '#C0C0C0',
    third: '#CD7F32',
  };

  // Monochrome Luxury Gradients: Dark Crystal vs Porcelain
  const blockGradientColors: Record<'first' | 'second' | 'third', readonly [string, string, ...string[]]> = {
    first: isDark ? (['#222222', '#000000'] as const) : (['#FFFFFF', '#F2F2F7'] as const),
    second: isDark ? (['#222222', '#000000'] as const) : (['#FFFFFF', '#F2F2F7'] as const),
    third: isDark ? (['#222222', '#000000'] as const) : (['#FFFFFF', '#F2F2F7'] as const),
  };

  // Lid Colors: Deep Grey/Black vs Pure White
  const lidColor = isDark ? '#222222' : '#FFFFFF';
  
  // Number Color
  const pedestalNumberColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';

  const delay = isSecond ? 100 : isThird ? 200 : 0;
  const blockHeight = isFirst ? 180 : isSecond ? 140 : 120;

  return (
    <TouchableOpacity
      key={entry.id}
      onPress={() => router.push(`/profile/${entry.id}`)}
      activeOpacity={0.7}
      style={styles.podiumStackWrapper}
    >
      <View style={styles.podiumStack}>
        {/* Floating Avatar */}
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{
            type: 'spring',
            damping: 15,
            stiffness: 100,
            delay: delay + 150,
          }}
          style={styles.floatingAvatarContainer}
        >
          <View
            style={[
              styles.podiumAvatar,
              isFirst && styles.podiumAvatarLarge,
              {
                backgroundColor: isDark ? '#1a1a1a' : '#F9F9F9',
                // Diffused Fog Shadow
                shadowColor: isDark ? '#FFF' : '#000',
                shadowOpacity: 0.3,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 0 },
                elevation: 12,
              },
            ]}
          >
            {entry.avatarUrl ? (
              <Image
                source={{ uri: entry.avatarUrl }}
                style={[
                  styles.podiumAvatarImage,
                  isFirst && styles.podiumAvatarImageLarge,
                ]}
              />
            ) : (
              <Text
                style={[
                  styles.podiumAvatarInitials,
                  isFirst && styles.podiumAvatarInitialsLarge,
                  { color: isDark ? '#FFF' : '#000' },
                ]}
              >
                {getInitials(entry.displayName)}
              </Text>
            )}
          </View>

          {/* Rank Badge */}
          <View
            style={[
              styles.rankBadge,
              isFirst && styles.rankBadgeLarge,
              {
                backgroundColor: badgeColors[position],
                borderColor: isDark ? '#000' : '#FFF',
              },
            ]}
          >
            <Text
              style={[
                styles.rankBadgeText,
                isFirst && styles.rankBadgeTextLarge,
              ]}
            >
              {rankNumber}
            </Text>
          </View>
        </MotiView>

        {/* Floating Name + Points */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 400,
            delay: delay + 250,
          }}
          style={styles.floatingTextContainer}
        >
          <Text
            style={[
              styles.podiumName,
              isFirst && styles.podiumNameLarge,
              { color: isDark ? '#FFF' : '#000' },
            ]}
            numberOfLines={1}
          >
            {entry.displayName}
          </Text>
          <View style={styles.podiumPointsRow}>
            <Ionicons name="star" size={isFirst ? 14 : 12} color={badgeColors[position]} />
            <Text
              style={[
                styles.podiumPoints,
                isFirst && styles.podiumPointsLarge,
                { color: isDark ? '#FFF' : '#000' },
              ]}
            >
              {entry.points.toLocaleString()}
            </Text>
          </View>
        </MotiView>

        {/* Top Lid */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            damping: 18,
            stiffness: 120,
            delay: delay + 50,
          }}
          style={styles.topLidContainer}
        >
          <View
            style={[
              styles.topLid,
              isFirst && styles.topLidLarge,
              { borderBottomColor: lidColor }
            ]}
          />
        </MotiView>

        {/* Pedestal Block */}
        <MotiView
          from={{ opacity: 0, height: 0, scale: 0.9 }}
          animate={{ opacity: 1, height: blockHeight, scale: 1 }}
          transition={{
            type: 'spring',
            damping: 18,
            stiffness: 120,
            delay,
          }}
          style={styles.pedestalBlockContainer}
        >
          <LinearGradient
            colors={blockGradientColors[position]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.pedestalBlock}
          >
            {/* Watermark Number */}
            <Text
              style={[
                styles.pedestalBlockNumber,
                { color: pedestalNumberColor },
              ]}
            >
              {rankNumber}
            </Text>
          </LinearGradient>
        </MotiView>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  podiumStackWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  podiumStack: {
    width: '100%',
    alignItems: 'center',
  },
  floatingAvatarContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
    zIndex: 10,
  },
  podiumAvatar: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  podiumAvatarLarge: {
    width: 90,
    height: 90,
  },
  podiumAvatarImage: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.full,
  },
  podiumAvatarImageLarge: {
    width: 90,
    height: 90,
  },
  podiumAvatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  podiumAvatarInitialsLarge: {
    fontSize: 34,
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  rankBadgeLarge: {
    width: 32,
    height: 32,
    top: -6,
    right: -6,
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  rankBadgeTextLarge: {
    fontSize: 17,
  },
  floatingTextContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    zIndex: 5,
  },
  topLidContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  topLid: {
    width: '100%',
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderBottomWidth: 25,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  topLidLarge: {
    width: '100%',
    borderBottomWidth: 28,
    borderLeftWidth: 12,
    borderRightWidth: 12,
  },
  podiumName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  podiumNameLarge: {
    fontSize: 17,
    marginBottom: 6,
  },
  podiumPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  podiumPoints: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  podiumPointsLarge: {
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.75,
  },
  pedestalBlockContainer: {
    width: '100%',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pedestalBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestalBlockNumber: {
    fontSize: 100,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -4,
  },
});