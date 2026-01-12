import React from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { getInitials, getRankChange } from '../utils';
import { RankChangeIndicator } from './RankChangeIndicator';
import type { LeaderboardEntry } from '@/types/leaderboard';

interface LeaderboardListItemProps {
  item: LeaderboardEntry;
  index: number;
  currentUserId?: string;
  previousRanks: Record<string, number>;
  isHighlighted?: boolean;
  highlightAnim?: Animated.Value;
}

export const LeaderboardListItem: React.FC<LeaderboardListItemProps> = ({
  item,
  index,
  currentUserId,
  previousRanks,
  isHighlighted = false,
  highlightAnim,
}) => {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const isCurrentUser = item.id === currentUserId;
  const rankChange = getRankChange(item.id, item.rank, previousRanks);
  const staggerDelay = Math.min(index * 50, 500); // Max delay of 500ms

  const baseBackground = isCurrentUser
    ? isDark
      ? 'rgba(255, 255, 255, 0.04)'
      : 'rgba(0, 0, 0, 0.04)'
    : 'transparent';
  const highlightColor = isDark ? 'rgba(120, 160, 255, 0.25)' : 'rgba(80, 130, 255, 0.2)';
  const rowBackground =
    isHighlighted && highlightAnim
      ? highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [baseBackground, highlightColor],
        })
      : baseBackground;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: staggerDelay,
      }}
      style={styles.listRowWrapper}
    >
      <MotiPressable
        onPress={() => router.push(`/profile/${item.id}`)}
        animate={({ pressed }) => {
          'worklet';
          return {
            scale: pressed ? 0.98 : 1,
            opacity: pressed ? 0.7 : 1,
          };
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 400,
        }}
        style={styles.listRowPressable}
      >
        {/* Transparent Row with Divider */}
        <Animated.View
          style={[
            styles.listRowFlat,
            {
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              backgroundColor: rowBackground,
            },
          ]}
        >
          {/* Left: Rank Number */}
          <View style={styles.rankNumberContainerFlat}>
            <Text style={[styles.rankNumberFlat, { color: theme.subtext }]}>
              {item.rank}
            </Text>
          </View>

          {/* Middle: Avatar + Name/Major */}
          <View style={styles.profileSectionFlat}>
            {/* Avatar */}
            <View style={styles.avatarSmallContainerFlat}>
              <View
                style={[
                  styles.avatarSmallFlat,
                  { backgroundColor: isDark ? '#444' : '#E5E7EB' },
                ]}
              >
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatarImageSmallFlat} />
                ) : (
                  <Text style={[styles.avatarInitialsSmallFlat, { color: theme.text }]}>
                    {getInitials(item.displayName)}
                  </Text>
                )}
              </View>
            </View>

            {/* Text Column: Name + Major/Year */}
            <View style={styles.profileTextColumnFlat}>
              <Text style={[styles.listNameFlat, { color: theme.text }]} numberOfLines={1}>
                {item.displayName}
                {isCurrentUser && ' (You)'}
              </Text>
              <Text style={[styles.listSecondaryFlat, { color: theme.subtext }]} numberOfLines={1}>
                {item.major || 'No Major'}
                {item.classYear && ` '${String(item.classYear).slice(-2)}`}
              </Text>
            </View>
          </View>

          {/* Right: Points + Rank Delta */}
          <View style={styles.statsSectionFlat}>
            {/* Points with Icon */}
            <View style={styles.pointsRowFlat}>
              <Ionicons name="star" size={12} color={theme.primary} style={{ opacity: 0.6 }} />
              <Text style={[styles.pointsTextFlat, { color: theme.text }]}>
                {item.points.toLocaleString()}
              </Text>
            </View>

            {/* Rank Change Trend */}
            {rankChange && <RankChangeIndicator change={rankChange} />}
          </View>
        </Animated.View>
      </MotiPressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  listRowWrapper: {
    marginHorizontal: SPACING.md,
  },
  listRowPressable: {
    width: '100%',
  },
  listRowFlat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  rankNumberContainerFlat: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberFlat: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: 13,
    opacity: 0.5,
  },
  profileSectionFlat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarSmallContainerFlat: {},
  avatarSmallFlat: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageSmallFlat: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
  },
  avatarInitialsSmallFlat: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profileTextColumnFlat: {
    flex: 1,
    justifyContent: 'center',
  },
  listNameFlat: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  listSecondaryFlat: {
    ...TYPOGRAPHY.small,
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.6,
  },
  statsSectionFlat: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pointsRowFlat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsTextFlat: {
    ...TYPOGRAPHY.small,
    fontSize: 14,
    fontWeight: '600',
  },
});
