import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  RefreshControl,
  Animated,
  ViewToken,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboard } from '@/hooks/leaderboard';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/colors';
import { NJIT_MAJORS } from '@/constants/majors';
import { Skeleton } from '@/components/ui/Skeleton';
import SearchableSelectionModal from '@/onboarding/components/SearchableSelectionModal';
import type { LeaderboardEntry, LeaderboardContext } from '@/types/leaderboard';

const CONTEXT_OPTIONS: Array<{ value: LeaderboardContext; label: string }> = [
  { value: 'month', label: 'This Month' },
  { value: 'semester', label: 'This Semester' },
  { value: 'allTime', label: 'All-Time' },
];

/**
 * Get initials from display name
 * @param displayName - Full name of the user
 * @returns Two-letter initials (e.g., "John Doe" -> "JD")
 */
const getInitials = (displayName: string): string => {
  const names = displayName.trim().split(' ');
  if (names.length === 0) return '??';
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

interface RankChange {
  delta: number; // positive = up, negative = down, 0 = no change
  direction: 'up' | 'down' | 'same';
}

// Approximate height of each list row item (padding + content + margin)
// Used for getItemLayout optimization
const ITEM_HEIGHT = 80;

export default function LeaderboardScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user, profile } = useAuth();
  const [context, setContext] = useState<LeaderboardContext>('allTime');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string | undefined>();
  const [selectedClassYear, setSelectedClassYear] = useState<number | undefined>();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [showClassYearModal, setShowClassYearModal] = useState(false);
  const [userRowVisible, setUserRowVisible] = useState(false);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const searchInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // Get leaderboard data with filters
  const { entries, loading, error, filters, setFilters, refresh } = useLeaderboard(
    context,
    { major: selectedMajor, classYear: selectedClassYear }
  );

  // Client-side search filtering (by name and major)
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;

    const query = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      const nameMatch = entry.displayName.toLowerCase().includes(query);
      const majorMatch = entry.major?.toLowerCase().includes(query);
      return nameMatch || majorMatch;
    });
  }, [entries, searchQuery]);

  const topThree = filteredEntries.slice(0, 3);
  const restOfList = filteredEntries.slice(3);
  const currentUserEntry = filteredEntries.find((entry) => entry.id === user?.id);

  // Check current user in unfiltered entries (not affected by search/filters)
  const currentUserEntryRaw = entries.find((entry) => entry.id === user?.id);

  // Check if current user has incomplete profile based on actual profile data
  // Use profile from AuthContext or fallback to checking if user is in unfiltered entries
  const hasCompleteProfile = profile
    ? Boolean(profile.first_name && profile.last_name && profile.user_type)
    : Boolean(currentUserEntryRaw);

  // Show banner when:
  // - user is logged in
  // - leaderboard has loaded (not loading)
  // - user is NOT in unfiltered entries (missing from leaderboard)
  // - profile is incomplete
  const shouldShowProfileBanner =
    user && !loading && !currentUserEntryRaw && entries.length > 0 && !hasCompleteProfile;

  // Load previous ranks from AsyncStorage
  useEffect(() => {
    loadPreviousRanks();
  }, [context]);

  // Update filters when major/classYear changes
  useEffect(() => {
    setFilters({ major: selectedMajor, classYear: selectedClassYear });
  }, [selectedMajor, selectedClassYear, setFilters]);

  // Save current ranks when entries change
  useEffect(() => {
    if (entries.length > 0) {
      savePreviousRanks();
    }
  }, [entries, context]);

  // Scroll to first match when search query changes
  useEffect(() => {
    if (searchQuery && filteredEntries.length > 0) {
      const firstMatchIndex = filteredEntries.findIndex((entry) =>
        entry.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (firstMatchIndex >= 0 && firstMatchIndex >= 3) {
        // Only scroll if match is in the list (not in podium)
        const listIndex = firstMatchIndex - 3;
        try {
          flatListRef.current?.scrollToIndex({
            index: listIndex,
            animated: true,
            viewPosition: 0.2,
          });
        } catch (error) {
          console.warn('Failed to scroll to search result:', error);
          // Fallback to scrollToOffset if scrollToIndex fails
          flatListRef.current?.scrollToOffset({
            offset: listIndex * ITEM_HEIGHT,
            animated: true,
          });
        }

        // Highlight briefly
        const matchedEntry = filteredEntries[firstMatchIndex];
        setHighlightedId(matchedEntry.id);

        Animated.sequence([
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.delay(1000),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start(() => setHighlightedId(null));
      }
    }
  }, [searchQuery]);

  const loadPreviousRanks = async () => {
    try {
      const key = `leaderboard_prev_${context}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setPreviousRanks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load previous ranks:', error);
    }
  };

  const savePreviousRanks = async () => {
    try {
      const key = `leaderboard_prev_${context}`;
      const rankMap: Record<string, number> = {};
      entries.forEach((entry) => {
        rankMap[entry.id] = entry.rank;
      });
      await AsyncStorage.setItem(key, JSON.stringify(rankMap));
    } catch (error) {
      console.error('Failed to save previous ranks:', error);
    }
  };

  const getRankChange = (userId: string, currentRank: number): RankChange | null => {
    const prevRank = previousRanks[userId];
    if (prevRank === undefined) return null;

    const delta = prevRank - currentRank; // Positive if rank improved (lower number)

    if (delta > 0) return { delta, direction: 'up' };
    if (delta < 0) return { delta: Math.abs(delta), direction: 'down' };
    return { delta: 0, direction: 'same' };
  };

  const scrollToUser = () => {
    if (!currentUserEntry) return;

    const userIndex = filteredEntries.findIndex((e) => e.id === user?.id);
    if (userIndex >= 3) {
      const listIndex = userIndex - 3;
      try {
        flatListRef.current?.scrollToIndex({
          index: listIndex,
          animated: true,
          viewPosition: 0.3,
        });
      } catch (error) {
        console.warn('Failed to scroll to user:', error);
        // Fallback to scrollToOffset if scrollToIndex fails
        flatListRef.current?.scrollToOffset({
          offset: listIndex * ITEM_HEIGHT,
          animated: true,
        });
      }
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const userVisible = viewableItems.some((item) => item.item?.id === user?.id);
      setUserRowVisible(userVisible);
    },
    [user?.id]
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Optimize FlatList scrolling performance with getItemLayout
  const getItemLayout = useCallback(
    (_data: LeaderboardEntry[] | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Handle scroll to index failures gracefully
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      console.warn('Scroll to index failed:', info);
      // Wait for list to render, then try again with scrollToOffset
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: true,
        });
      }, 100);
    },
    []
  );

  // Derive unique class years from entries
  const availableClassYears = useMemo(() => {
    const years = new Set<number>();
    entries.forEach((entry) => {
      if (entry.classYear) years.add(entry.classYear);
    });
    return Array.from(years).sort((a, b) => a - b).map(String);
  }, [entries]);

  const dynamicStyles = {
    background: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    subtext: { color: theme.subtext },
    border: { borderColor: theme.border },
  };

  const renderPodiumCard = (entry: LeaderboardEntry, position: 'first' | 'second' | 'third') => {
    const isFirst = position === 'first';
    const isSecond = position === 'second';
    const isThird = position === 'third';
    const isCurrentUser = entry.id === user?.id;

    const medalColors = {
      first: '#FFD700',
      second: '#C0C0C0',
      third: '#CD7F32',
    };

    const medalIcons = {
      first: 'trophy',
      second: 'medal',
      third: 'medal',
    };

    // Gradient colors for podium surfaces
    const gradientColors = {
      first: isDark
        ? ['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']
        : ['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.08)'],
      second: isDark
        ? ['rgba(192, 192, 192, 0.1)', 'rgba(192, 192, 192, 0.03)']
        : ['rgba(192, 192, 192, 0.15)', 'rgba(192, 192, 192, 0.05)'],
      third: isDark
        ? ['rgba(205, 127, 50, 0.1)', 'rgba(205, 127, 50, 0.03)']
        : ['rgba(205, 127, 50, 0.15)', 'rgba(205, 127, 50, 0.05)'],
    };

    const delay = isSecond ? 100 : isThird ? 200 : 0;
    const rankChange = getRankChange(entry.id, entry.rank);

    return (
      <TouchableOpacity
        key={entry.id}
        onPress={() => router.push(`/profile/${entry.id}`)}
        activeOpacity={0.7}
        style={[
          styles.podiumCardWrapper,
          isFirst && styles.podiumFirstWrapper,
        ]}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100, delay }}
          style={[
            styles.podiumCard,
            isFirst && styles.podiumFirst,
            isSecond && styles.podiumSecond,
            isThird && styles.podiumThird,
          ]}
        >
          <LinearGradient
            colors={gradientColors[position]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.podiumGradient,
              isFirst && styles.podiumGradientFirst,
            ]}
          >
            {/* Rank Icon */}
            <View style={[
              styles.rankIcon,
              isFirst && styles.rankIconLarge,
              { backgroundColor: medalColors[position] }
            ]}>
              <Ionicons
                name={medalIcons[position]}
                size={isFirst ? 28 : 20}
                color="#FFF"
              />
            </View>

            {/* Avatar with ring/glow */}
            <View style={[
              styles.heroAvatarContainer,
              isFirst && styles.heroAvatarContainerLarge,
            ]}>
              <View
                style={[
                  styles.heroAvatarRing,
                  isFirst && styles.heroAvatarRingLarge,
                  {
                    borderColor: medalColors[position],
                    shadowColor: medalColors[position],
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroAvatar,
                    isFirst && styles.heroAvatarLarge,
                    { backgroundColor: isDark ? '#444' : '#E5E7EB' },
                  ]}
                >
                  {entry.avatarUrl ? (
                    <Image
                      source={{ uri: entry.avatarUrl }}
                      style={[
                        styles.heroAvatarImage,
                        isFirst && styles.heroAvatarImageLarge,
                      ]}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.heroAvatarInitials,
                        isFirst && styles.heroAvatarInitialsLarge,
                        dynamicStyles.text,
                      ]}
                    >
                      {getInitials(entry.displayName)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Name */}
            <Text
              style={[
                styles.heroName,
                dynamicStyles.text,
                isFirst && styles.heroNameLarge,
              ]}
              numberOfLines={1}
            >
              {entry.displayName}
            </Text>

            {/* Points */}
            <Text
              style={[
                styles.heroPoints,
                dynamicStyles.subtext,
                isFirst && styles.heroPointsLarge,
              ]}
            >
              {entry.points.toLocaleString()}
            </Text>
          </LinearGradient>
        </MotiView>
      </TouchableOpacity>
    );
  };

  const renderRankChangeIndicator = (change: RankChange) => {
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

  const renderListItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.id === user?.id;
    const isHighlighted = item.id === highlightedId;
    const rankChange = getRankChange(item.id, item.rank);

    // Subtle gradient colors for list items
    const cardGradientColors = isDark
      ? [theme.card, `${theme.card}CC`]
      : [`${theme.card}FF`, `${theme.card}F5`];

    const highlightGradientColors = isDark
      ? ['rgba(42, 42, 64, 1)', 'rgba(42, 42, 64, 0.8)']
      : ['rgba(239, 246, 255, 1)', 'rgba(239, 246, 255, 0.95)'];

    return (
      <View style={styles.listRowWrapper}>
        {/* Rank Number - Detached and Muted */}
        <Text style={[styles.rankNumberDetached, { color: theme.subtext }]}>
          {item.rank}
        </Text>

        <MotiPressable
          onPress={() => router.push(`/profile/${item.id}`)}
          animate={({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.97 : 1,
              opacity: pressed ? 0.9 : 1,
            };
          }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 400,
          }}
          style={{ flex: 1 }}
        >
          <MotiView
            animate={{
              backgroundColor: isHighlighted
                ? (isDark ? 'rgba(42, 42, 64, 0.5)' : 'rgba(239, 246, 255, 0.5)')
                : 'transparent',
            }}
            transition={{ type: 'timing', duration: 300 }}
            style={{ position: 'relative' }}
          >
            {/* Thin Accent Strip for Current User */}
            {isCurrentUser && (
              <View
                style={[
                  styles.currentUserAccentStrip,
                  { backgroundColor: theme.primary }
                ]}
              />
            )}

            <LinearGradient
              colors={
                isCurrentUser
                  ? (isDark
                    ? [`${theme.primary}15`, `${theme.primary}08`]
                    : [`${theme.primary}12`, `${theme.primary}06`])
                  : (isHighlighted ? highlightGradientColors : cardGradientColors)
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.listRow,
                isCurrentUser && styles.listRowCurrent,
              ]}
            >
              {/* Avatar */}
              <View style={styles.avatarSmallContainer}>
                <View
                  style={[
                    styles.avatarSmall,
                    { backgroundColor: isDark ? '#444' : '#E5E7EB' },
                  ]}
                >
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImageSmall} />
                  ) : (
                    <Text style={[styles.avatarInitialsSmall, dynamicStyles.text]}>
                      {getInitials(item.displayName)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.listInfo}>
                <Text style={[styles.listName, dynamicStyles.text]} numberOfLines={1}>
                  {item.displayName}
                  {isCurrentUser && ' (You)'}
                </Text>
                {item.major && (
                  <Text style={[styles.listMajor, dynamicStyles.subtext]} numberOfLines={1}>
                    {item.major}
                    {item.classYear && ` '${String(item.classYear).slice(-2)}`}
                  </Text>
                )}
              </View>

              {/* Rank Change - More Prominent */}
              {rankChange && (
                <View style={styles.rankChangeContainer}>
                  {renderRankChangeIndicator(rankChange)}
                </View>
              )}

              {/* Points - More Subtle */}
              <Text style={[styles.pointsTextLight, { color: theme.subtext }]}>
                {item.points.toLocaleString()}
              </Text>
            </LinearGradient>
          </MotiView>
        </MotiPressable>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Skeleton width="100%" height={120} borderRadius={RADIUS.lg} />
      <Skeleton width="100%" height={120} borderRadius={RADIUS.lg} style={{ marginTop: SPACING.md }} />
      <Skeleton width="100%" height={120} borderRadius={RADIUS.lg} style={{ marginTop: SPACING.md }} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={theme.subtext} />
      <Text style={[styles.emptyTitle, dynamicStyles.text]}>No rankings yet</Text>
      <Text style={[styles.emptySubtitle, dynamicStyles.subtext]}>
        {searchQuery
          ? 'No users match your search'
          : 'Start attending events to earn points and appear on the leaderboard!'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.background]} edges={['top']}>
      {/* Compact Header with Gradient Fade */}
      <LinearGradient
        colors={isDark
          ? [theme.background, `${theme.background}00`]
          : [theme.background, `${theme.background}00`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, dynamicStyles.text]}>Leaderboard</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowRulesModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* Row 1: Time Scope Pills */}
        <View style={styles.timeScopeRow}>
          {CONTEXT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeScopePill,
                context === option.value && [
                  styles.timeScopePillActive,
                  { backgroundColor: theme.primary }
                ],
              ]}
              onPress={() => setContext(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeScopeText,
                  context === option.value
                    ? styles.timeScopeTextActive
                    : { color: theme.subtext },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 2: Filters + Search (lighter, recessed) */}
        <View style={styles.filtersRow}>
          {/* Filter Pills - Subtle */}
          <TouchableOpacity
            style={[
              styles.filterPillSubtle,
              selectedMajor && [
                styles.filterPillSubtleActive,
                { backgroundColor: theme.primary + '20', borderColor: theme.primary }
              ],
            ]}
            onPress={() => setShowMajorModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="school-outline"
              size={14}
              color={selectedMajor ? theme.primary : theme.subtext}
              style={{ opacity: selectedMajor ? 1 : 0.5 }}
            />
            <Text
              style={[
                styles.filterTextSubtle,
                selectedMajor ? { color: theme.primary } : { color: theme.subtext, opacity: 0.6 },
              ]}
            >
              {selectedMajor || 'Major'}
            </Text>
            {selectedMajor && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedMajor(undefined);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={14} color={theme.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPillSubtle,
              selectedClassYear && [
                styles.filterPillSubtleActive,
                { backgroundColor: theme.primary + '20', borderColor: theme.primary }
              ],
            ]}
            onPress={() => setShowClassYearModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={selectedClassYear ? theme.primary : theme.subtext}
              style={{ opacity: selectedClassYear ? 1 : 0.5 }}
            />
            <Text
              style={[
                styles.filterTextSubtle,
                selectedClassYear ? { color: theme.primary } : { color: theme.subtext, opacity: 0.6 },
              ]}
            >
              {selectedClassYear ? `'${String(selectedClassYear).slice(-2)}` : 'Year'}
            </Text>
            {selectedClassYear && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedClassYear(undefined);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={14} color={theme.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Search Input - Recessed */}
          <View style={[styles.searchContainerInline, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <Ionicons name="search-outline" size={16} color={theme.subtext} style={{ opacity: 0.5 }} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInputInline, dynamicStyles.text]}
              placeholder="Search..."
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color={theme.subtext} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.error + '20' }]}>
          <Ionicons name="alert-circle" size={20} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error.message}
          </Text>
        </View>
      )}

      {/* Profile Completeness Banner */}
      {shouldShowProfileBanner && (
        <TouchableOpacity
          style={[styles.profileBanner, { backgroundColor: theme.info + '20' }]}
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle-outline" size={24} color={theme.info} />
          <View style={styles.profileBannerContent}>
            <Text style={[styles.profileBannerTitle, { color: theme.info }]}>
              Complete your profile to be ranked
            </Text>
            <Text style={[styles.profileBannerSubtitle, dynamicStyles.subtext]}>
              Tap to add your details
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.info} />
        </TouchableOpacity>
      )}

      {loading && entries.length === 0 ? (
        renderLoadingState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={restOfList}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={onScrollToIndexFailed}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListHeaderComponent={
            <>
              {/* Podium Hero Section */}
              {topThree.length === 3 && (
                <View style={styles.heroBackdrop}>
                  <BlurView
                    intensity={isDark ? 20 : 15}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.blurBackdrop}
                  >
                    <View style={styles.podiumHeroContainer}>
                      {/* Second Place - Left */}
                      <View style={styles.podiumSlotSide}>
                        {renderPodiumCard(topThree[1], 'second')}
                      </View>

                      {/* First Place - Center (Elevated) */}
                      <View style={styles.podiumSlotCenter}>
                        {renderPodiumCard(topThree[0], 'first')}
                      </View>

                      {/* Third Place - Right */}
                      <View style={styles.podiumSlotSide}>
                        {renderPodiumCard(topThree[2], 'third')}
                      </View>
                    </View>
                  </BlurView>
                </View>
              )}

              {/* List Header */}
              {restOfList.length > 0 && (
                <View style={styles.listHeaderContainer}>
                  <Text style={[styles.listHeaderText, dynamicStyles.subtext]}>
                    Rest of Rankings
                  </Text>
                </View>
              )}
            </>
          }
        />
      )}

      {/* Your Rank Chip - Show when user row is off-screen */}
      {currentUserEntry && !userRowVisible && currentUserEntry.rank > 3 && (
        <TouchableOpacity
          style={[styles.yourRankChip, { backgroundColor: theme.primary }, SHADOWS.large]}
          onPress={scrollToUser}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-down" size={16} color="#FFF" />
          <Text style={styles.yourRankChipText}>
            Your rank: #{currentUserEntry.rank}
          </Text>
        </TouchableOpacity>
      )}

      {/* Major Selection Modal */}
      <SearchableSelectionModal
        visible={showMajorModal}
        onClose={() => setShowMajorModal(false)}
        onSelect={(major) => setSelectedMajor(major)}
        options={NJIT_MAJORS}
        selectedValue={selectedMajor}
        title="Filter by Major"
        placeholder="Search majors..."
      />

      {/* Class Year Selection Modal */}
      <SearchableSelectionModal
        visible={showClassYearModal}
        onClose={() => setShowClassYearModal(false)}
        onSelect={(year) => setSelectedClassYear(Number(year))}
        options={availableClassYears}
        selectedValue={selectedClassYear?.toString()}
        title="Filter by Class Year"
        placeholder="Search years..."
      />

      {/* Rules Modal */}
      <Modal
        visible={showRulesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, dynamicStyles.background]} edges={['top']}>
          <View style={[styles.modalHeader, dynamicStyles.card]}>
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Ranking Rules</Text>
            <TouchableOpacity onPress={() => setShowRulesModal(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.ruleCard, dynamicStyles.card, SHADOWS.small]}>
              <Ionicons name="trophy" size={32} color={theme.primary} style={styles.ruleIcon} />
              <Text style={[styles.ruleTitle, dynamicStyles.text]}>How Rankings Work</Text>
              <Text style={[styles.ruleDescription, dynamicStyles.subtext]}>
                Members earn points by attending events, completing challenges, and engaging with
                the community. Your rank is determined by your total points.
              </Text>
            </View>

            <View style={[styles.ruleCard, dynamicStyles.card, SHADOWS.small]}>
              <Ionicons name="calendar" size={32} color={theme.primary} style={styles.ruleIcon} />
              <Text style={[styles.ruleTitle, dynamicStyles.text]}>Event Attendance</Text>
              <Text style={[styles.ruleDescription, dynamicStyles.subtext]}>
                Attend events and check in to earn points. Bonus points for early check-ins!
              </Text>
            </View>

            <View style={[styles.ruleCard, dynamicStyles.card, SHADOWS.small]}>
              <Ionicons name="time" size={32} color={theme.primary} style={styles.ruleIcon} />
              <Text style={[styles.ruleTitle, dynamicStyles.text]}>Time Periods</Text>
              <Text style={[styles.ruleDescription, dynamicStyles.subtext]}>
                View rankings for this month, this semester, or all-time to see how you compare.
              </Text>
            </View>

            <View style={[styles.ruleCard, dynamicStyles.card, SHADOWS.small]}>
              <Ionicons name="medal" size={32} color={theme.primary} style={styles.ruleIcon} />
              <Text style={[styles.ruleTitle, dynamicStyles.text]}>Rank Tiers</Text>
              <Text style={[styles.ruleDescription, dynamicStyles.subtext]}>
                Progress through Bronze (25+ pts), Silver (50+ pts), and Gold (75+ pts) tiers as
                you earn more points.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
  },
  iconButton: {
    padding: SPACING.xs,
  },
  timeScopeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  timeScopePill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    minWidth: 90,
    alignItems: 'center',
  },
  timeScopePillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timeScopeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    fontSize: 13,
  },
  timeScopeTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  filterPillSubtle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillSubtleActive: {
    borderWidth: 1,
  },
  filterTextSubtle: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainerInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  searchInputInline: {
    flex: 1,
    ...TYPOGRAPHY.small,
    fontSize: 12,
    paddingVertical: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  profileBannerContent: {
    flex: 1,
  },
  profileBannerTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileBannerSubtitle: {
    ...TYPOGRAPHY.caption,
  },
  loadingContainer: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  // Hero Podium Styles
  heroBackdrop: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  blurBackdrop: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  podiumHeroContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  podiumSlotSide: {
    flex: 1,
    transform: [{ perspective: 800 }],
  },
  podiumSlotCenter: {
    flex: 1.1,
    zIndex: 10,
  },
  podiumCardWrapper: {
    flex: 1,
  },
  podiumFirstWrapper: {
    transform: [{ scale: 1.05 }],
  },
  podiumCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    // Soft shadow without border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  podiumFirst: {
    // First place is taller
    minHeight: 220,
  },
  podiumSecond: {
    // Second place is shorter and angled
    minHeight: 180,
    transform: [{ rotateY: '3deg' }],
  },
  podiumThird: {
    // Third place is shorter and angled
    minHeight: 180,
    transform: [{ rotateY: '-3deg' }],
  },
  podiumGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumGradientFirst: {
    paddingVertical: SPACING.xl,
  },
  // Rank Icon (Trophy/Medal)
  rankIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rankIconLarge: {
    width: 52,
    height: 52,
    marginBottom: SPACING.lg,
  },
  // Hero Avatar Styles
  heroAvatarContainer: {
    marginBottom: SPACING.md,
  },
  heroAvatarContainerLarge: {
    marginBottom: SPACING.lg,
  },
  heroAvatarRing: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  heroAvatarRingLarge: {
    width: 100,
    height: 100,
    borderWidth: 4,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroAvatarLarge: {
    width: 92,
    height: 92,
  },
  heroAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
  },
  heroAvatarImageLarge: {
    width: 92,
    height: 92,
  },
  heroAvatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroAvatarInitialsLarge: {
    fontSize: 36,
  },
  // Name and Points (minimal text)
  heroName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  heroNameLarge: {
    fontSize: 19,
    marginBottom: SPACING.sm,
  },
  heroPoints: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
  heroPointsLarge: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.75,
  },
  // Keep other styles for list items
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  pointsPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  pointsText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
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
  rankChangeContainer: {
    marginLeft: SPACING.xs,
  },
  listHeaderContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  listHeaderText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.5,
  },
  listRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  rankNumberDetached: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    fontSize: 11,
    width: 24,
    opacity: 0.4,
    textAlign: 'right',
  },
  currentUserAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
    zIndex: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  listRowCurrent: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarSmallContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageSmall: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
  },
  avatarInitialsSmall: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 3,
  },
  listMajor: {
    ...TYPOGRAPHY.small,
    opacity: 0.6,
  },
  pointsTextLight: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
    marginLeft: SPACING.xs,
  },
  pointsPillSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginLeft: SPACING.sm,
  },
  pointsTextSmall: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  yourRankChip: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  yourRankChipText: {
    color: '#FFF',
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTitle: {
    ...TYPOGRAPHY.headline,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  ruleCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },
  ruleIcon: {
    marginBottom: SPACING.sm,
  },
  ruleTitle: {
    ...TYPOGRAPHY.title,
    marginBottom: SPACING.sm,
  },
  ruleDescription: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
});
