import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ViewToken,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboard } from '@/hooks/leaderboard';
import { SPACING } from '@/constants/colors';
import { NJIT_MAJORS } from '@/constants/majors';
import { Skeleton } from '@/components/ui/Skeleton';
import SearchableSelectionModal from '@/onboarding/components/SearchableSelectionModal';
import type { LeaderboardEntry, LeaderboardContext } from '@/types/leaderboard';
import {
  LeaderboardHeader,
  PodiumCard,
  LeaderboardListItem,
  RulesModal,
  styles,
} from '@/components/leaderboard';
import { loadPreviousRanks, savePreviousRanks, ITEM_HEIGHT } from '@/utils/leaderboard';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  
  // 1. Set Default Context to Semester (as requested)
  const [context, setContext] = useState<LeaderboardContext>('semester');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string | undefined>();
  const [selectedClassYear, setSelectedClassYear] = useState<number | undefined>();
  
  // Modal States
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [showClassYearModal, setShowClassYearModal] = useState(false);
  
  // UI States
  const [userRowVisible, setUserRowVisible] = useState(false);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // Data Hook
  const { entries, loading, error, filters, setFilters, refresh } = useLeaderboard(
    context,
    { major: selectedMajor, classYear: selectedClassYear }
  );

  // --- Filtering Logic (From Old Code) ---
  const filteredEntries = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return entries;

    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    const query = normalize(rawQuery);
    const tokens = query.split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return entries;

    return entries.filter((entry) => {
      const haystack = normalize(
        [
          entry.displayName,
          entry.major ?? '',
          entry.classYear ? String(entry.classYear) : '',
        ].join(' ')
      );

      return tokens.every((token) => haystack.includes(token));
    });
  }, [entries, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const topThree = isSearching ? [] : filteredEntries.slice(0, 3);
  const restOfList = isSearching ? filteredEntries : filteredEntries.slice(3);
  const currentUserEntry = filteredEntries.find((entry) => entry.id === user?.id);
  const currentUserEntryRaw = entries.find((entry) => entry.id === user?.id);

  const hasCompleteProfile = profile
    ? Boolean(profile.first_name && profile.last_name && profile.user_type)
    : Boolean(currentUserEntryRaw);

  const shouldShowProfileBanner =
    user && !loading && !currentUserEntryRaw && entries.length > 0 && !hasCompleteProfile;

  // --- Effects (From Old Code) ---
  useEffect(() => {
    const loadRanks = async () => {
      const ranks = await loadPreviousRanks(context);
      setPreviousRanks(ranks);
    };
    loadRanks();
  }, [context]);

  useEffect(() => {
    setFilters({ major: selectedMajor, classYear: selectedClassYear });
  }, [selectedMajor, selectedClassYear, setFilters]);

  useEffect(() => {
    if (entries.length > 0) {
      savePreviousRanks(entries, context);
    }
  }, [entries, context]);

  // Search Highlight Logic
  useEffect(() => {
    const rawQuery = searchQuery.trim();
    if (rawQuery && filteredEntries.length > 0) {
      const query = rawQuery.toLowerCase();
      const firstMatchIndex = filteredEntries.findIndex((entry) =>
        entry.displayName.toLowerCase().includes(query)
      );

      if (firstMatchIndex >= 0) {
        const listIndex = isSearching ? firstMatchIndex : firstMatchIndex - 3;
        if (!isSearching && firstMatchIndex < 3) return;
        
        try {
          flatListRef.current?.scrollToIndex({
            index: listIndex,
            animated: true,
            viewPosition: 0.2,
          });
        } catch (error) {
          flatListRef.current?.scrollToOffset({
            offset: listIndex * ITEM_HEIGHT,
            animated: true,
          });
        }

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
  }, [searchQuery, filteredEntries, highlightAnim, isSearching]);

  // --- Callbacks ---
  const scrollToUser = () => {
    if (!currentUserEntry) return;

    const userIndex = filteredEntries.findIndex((e) => e.id === user?.id);
    if (isSearching ? userIndex >= 0 : userIndex >= 3) {
      const listIndex = isSearching ? userIndex : userIndex - 3;
      try {
        flatListRef.current?.scrollToIndex({
          index: listIndex,
          animated: true,
          viewPosition: 0.3,
        });
      } catch (error) {
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

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const getItemLayout = useCallback(
    (data: ArrayLike<LeaderboardEntry> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: true,
        });
      }, 100);
    },
    []
  );

  const availableClassYears = useMemo(() => {
    const years = new Set<number>();
    entries.forEach((entry) => {
      if (entry.classYear) years.add(entry.classYear);
    });
    return Array.from(years).sort((a, b) => a - b).map(String);
  }, [entries]);

  // --- Render Helpers ---
  const renderListItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <LeaderboardListItem
      item={item}
      index={index}
      currentUserId={user?.id}
      previousRanks={previousRanks}
      isHighlighted={item.id === highlightedId}
      highlightAnim={highlightAnim}
    />
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Skeleton width="100%" height={120} borderRadius={12} />
      <Skeleton width="100%" height={120} borderRadius={12} style={{ marginTop: SPACING.md }} />
      <Skeleton width="100%" height={120} borderRadius={12} style={{ marginTop: SPACING.md }} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={theme.subtext} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No rankings yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
        {searchQuery
          ? 'No users match your search'
          : 'Start attending events to earn points!'}
      </Text>
    </View>
  );

  // --- Main Render ---
  return (
    <View style={styles.rootContainer}>
      {/* 2. BACKGROUND GRADIENT (Deep Void) */}
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#000000'] : ['#FFFFFF', '#F5F5F5']}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <SafeAreaView style={styles.container} edges={[]}>
        {/* Header */}
        <LeaderboardHeader
          context={context}
          onContextChange={setContext}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMajor={selectedMajor}
          selectedClassYear={selectedClassYear}
          onMajorPress={() => setShowMajorModal(true)}
          onClassYearPress={() => setShowClassYearModal(true)}
          onClearMajor={() => setSelectedMajor(undefined)}
          onClearClassYear={() => setSelectedClassYear(undefined)}
          onShowRules={() => setShowRulesModal(true)}
          topInset={insets.top}
        />

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: theme.error + '20' }]}>
              <Ionicons name="alert-circle" size={20} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {error.message}
              </Text>
            </View>
          )}

          {shouldShowProfileBanner && (
            <TouchableOpacity
              style={[styles.profileBanner, { backgroundColor: theme.info + '20' }]}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle-outline" size={24} color={theme.info} />
              <View style={styles.profileBannerContent}>
                <Text style={[styles.profileBannerTitle, { color: theme.info }]}>
                  Complete your profile
                </Text>
                <Text style={[styles.profileBannerSubtitle, { color: theme.subtext }]}>
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
                  {topThree.length === 3 && (
                    <View style={styles.heroBackdrop}>
                      <View style={styles.podiumHeroContainer}>
                        {/* Second Place */}
                        <View style={[styles.podiumSlotSide, styles.podiumSlotSecond]}>
                          <PodiumCard entry={topThree[1]} position="second" currentUserId={user?.id} />
                        </View>

                        {/* First Place */}
                        <View style={styles.podiumSlotCenter}>
                          <PodiumCard entry={topThree[0]} position="first" currentUserId={user?.id} />
                        </View>

                        {/* Third Place */}
                        <View style={[styles.podiumSlotSide, styles.podiumSlotThird]}>
                          <PodiumCard entry={topThree[2]} position="third" currentUserId={user?.id} />
                        </View>
                      </View>
                    </View>
                  )}
                </>
              }
            />
          )}

          {/* Floating Rank Chip */}
          {currentUserEntry && !userRowVisible && currentUserEntry.rank > 3 && (
            <BlurView
              intensity={isDark ? 25 : 15}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.yourRankChip,
                {
                  shadowColor: theme.primary,
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 8,
                }
              ]}
            >
              <TouchableOpacity
                style={styles.yourRankChipInner}
                onPress={scrollToUser}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-down" size={16} color={theme.primary} />
                <Text style={[styles.yourRankChipText, { color: theme.primary }]}>
                  Your rank: #{currentUserEntry.rank}
                </Text>
              </TouchableOpacity>
            </BlurView>
          )}

          <SearchableSelectionModal
            visible={showMajorModal}
            onClose={() => setShowMajorModal(false)}
            onSelect={(major) => setSelectedMajor(major)}
            options={NJIT_MAJORS}
            selectedValue={selectedMajor}
            title="Filter by Major"
            placeholder="Search majors..."
          />

          <SearchableSelectionModal
            visible={showClassYearModal}
            onClose={() => setShowClassYearModal(false)}
            onSelect={(year) => setSelectedClassYear(Number(year))}
            options={availableClassYears}
            selectedValue={selectedClassYear?.toString()}
            title="Filter by Class Year"
            placeholder="Search years..."
          />

        <RulesModal
          visible={showRulesModal}
          onClose={() => setShowRulesModal(false)}
        />
      </SafeAreaView>
    </View>
  );
}
