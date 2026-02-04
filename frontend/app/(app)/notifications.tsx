import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SectionList,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useInbox } from '@/hooks/notifications/useInbox';
import { SHPE_COLORS, SPACING } from '@/constants/colors';
import {
  groupNotificationsByTime,
  type NotificationSection,
} from '@/utils/notifications';
import type { InboxNotification } from '@/types/notifications';

// ── Category icon + color mapping ────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  announcement: { icon: 'megaphone', color: '#AF52DE' },
  new_event: { icon: 'calendar', color: '#007AFF' },
  event_update: { icon: 'refresh-circle', color: '#FF9500' },
  general: { icon: 'notifications', color: '#8E8E93' },
};

// ── Category filter ──────────────────────────────────────────────────────

type CategoryFilter = 'all' | 'new_event' | 'event_update' | 'announcement';

const CATEGORY_FILTERS: Array<{
  value: CategoryFilter;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'new_event', label: 'Events' },
  { value: 'event_update', label: 'Updates' },
  { value: 'announcement', label: 'Alerts' },
];

// ── Swipeable Row ────────────────────────────────────────────────────────

const DELETE_THRESHOLD = -80;

interface SwipeableRowProps {
  item: InboxNotification;
  onPress: (item: InboxNotification) => void;
  onDelete: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
  isDark: boolean;
}

function SwipeableNotificationRow({
  item,
  onPress,
  onDelete,
  isFirst,
  isLast,
  theme,
  isDark,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue<number | undefined>(undefined);
  const rowOpacity = useSharedValue(1);
  const hasTriggeredHaptic = useSharedValue(false);
  const measuredHeight = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const performDelete = () => {
    onDelete(item.id);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
      if (
        event.translationX < DELETE_THRESHOLD &&
        !hasTriggeredHaptic.value
      ) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-400, { duration: 200 });
        rowHeight.value = withTiming(0, { duration: 250 });
        rowOpacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(performDelete)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
      hasTriggeredHaptic.value = false;
    });

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: rowHeight.value,
    opacity: rowOpacity.value,
    overflow: 'hidden' as const,
  }));

  const deleteRevealStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.general;

  // Card border radius per position in section
  const borderRadiusStyle = {
    borderTopLeftRadius: isFirst ? 24 : 0,
    borderTopRightRadius: isFirst ? 24 : 0,
    borderBottomLeftRadius: isLast ? 24 : 0,
    borderBottomRightRadius: isLast ? 24 : 0,
  };

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  return (
    <Animated.View
      style={containerStyle}
      onLayout={(e) => {
        if (measuredHeight.value === 0) {
          measuredHeight.value = e.nativeEvent.layout.height;
          rowHeight.value = e.nativeEvent.layout.height;
        }
      }}
    >
      {/* Red delete background */}
      <Animated.View
        style={[styles.deleteBackground, borderRadiusStyle, deleteRevealStyle]}
      >
        <Ionicons name="trash-outline" size={22} color="#FFF" />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={slideStyle}>
          <Pressable
            onPress={() => onPress(item)}
            style={({ pressed }) => [
              styles.row,
              borderRadiusStyle,
              {
                backgroundColor: pressed
                  ? isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.04)'
                  : cardBg,
              },
            ]}
          >
            {/* Unread accent bar */}
            {!item.is_read && <View style={styles.unreadBar} />}

            {/* Category icon */}
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: `${meta.color}18` },
              ]}
            >
              <Ionicons name={meta.icon} size={18} color={meta.color} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTopLine}>
                <Text
                  style={[
                    styles.rowTitle,
                    { color: theme.text },
                    !item.is_read && styles.rowTitleUnread,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[styles.rowTime, { color: theme.subtext }]}>
                  {timeAgo}
                </Text>
              </View>

              <Text
                style={[styles.rowBody, { color: theme.subtext }]}
                numberOfLines={2}
              >
                {item.body}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
              style={styles.rowChevron}
            />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useInbox();

  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // ── Derived data ────────────────────────────────────────────────────
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const sections = useMemo(
    () => groupNotificationsByTime(filteredNotifications),
    [filteredNotifications],
  );

  // ── Handlers ────────────────────────────────────────────────────────
  const handlePress = useCallback(
    (item: InboxNotification) => {
      if (!item.is_read) markAsRead(item.id);

      const eventId = (item.data as Record<string, unknown> | null)?.eventId;
      if (typeof eventId === 'string') {
        router.push(`/event/${eventId}`);
      }
    },
    [markAsRead],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: InboxNotification;
      index: number;
      section: NotificationSection;
    }) => (
      <SwipeableNotificationRow
        item={item}
        onPress={handlePress}
        onDelete={deleteNotification}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        theme={theme}
        isDark={isDark}
      />
    ),
    [handlePress, deleteNotification, theme, isDark],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>
          {section.title}
        </Text>
      </View>
    ),
    [theme.subtext],
  );

  const renderSeparator = useCallback(
    () => (
      <View
        style={[
          styles.separator,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
      />
    ),
    [isDark],
  );

  // ── Empty state ─────────────────────────────────────────────────────
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconCircle,
            {
              backgroundColor: isDark
                ? 'rgba(59,130,246,0.1)'
                : 'rgba(59,130,246,0.06)',
            },
          ]}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={64}
            color={SHPE_COLORS.accentBlue}
            style={{ opacity: 0.7 }}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          All caught up!
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
          {activeFilter === 'all'
            ? "You have no notifications. We'll let you know when something comes up."
            : 'No notifications in this category.'}
        </Text>
      </View>
    ),
    [isDark, theme.text, theme.subtext, activeFilter],
  );

  // ── Dynamic styles ──────────────────────────────────────────────────
  const cardBorderColor = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.06)';

  const segmentBg = isDark ? 'rgba(0,0,0,0.2)' : '#F2F2F7';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: theme.background },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Inbox</Text>

        {unreadCount > 0 ? (
          <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons
              name="checkmark-done"
              size={22}
              color={SHPE_COLORS.accentBlue}
            />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* ── Segmented filter ───────────────────────────────────────── */}
      <View style={styles.filterWrapper}>
        <View style={[styles.segmentedControl, { backgroundColor: segmentBg }]}>
          {CATEGORY_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setActiveFilter(filter.value)}
                style={[
                  styles.segmentButton,
                  isActive &&
                    (isDark
                      ? {
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)',
                        }
                      : {
                          backgroundColor: '#FFFFFF',
                          ...Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOpacity: 0.1,
                              shadowRadius: 8,
                              shadowOffset: { width: 0, height: 2 },
                            },
                            android: { elevation: 2 },
                          }),
                        }),
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isActive ? theme.text : theme.subtext },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loading}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[
            styles.list,
            sections.length === 0 && styles.listEmpty,
          ]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={renderSeparator}
          SectionSeparatorComponent={() => null}
          ListEmptyComponent={renderEmpty}
          style={{ marginHorizontal: 20 }}
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  markAllButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented filter (matches settings page)
  filterWrapper: {
    paddingHorizontal: 20,
    paddingBottom: SPACING.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    height: 40,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Section headers (settings-style small label)
  sectionHeader: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },

  // List
  list: {
    paddingBottom: SPACING.xl,
  },
  listEmpty: {
    flexGrow: 1,
  },

  // Divider (settings-style inset)
  separator: {
    height: 1,
    marginLeft: 18,
    marginRight: 18,
  },

  // Row (settings-style)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: SHPE_COLORS.accentBlue,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  rowTitleUnread: {
    fontWeight: '600',
  },
  rowBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowTime: {
    fontSize: 12,
    flexShrink: 0,
  },
  rowChevron: {
    marginLeft: 4,
  },

  // Swipe delete
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: SPACING.lg,
  },

  // States
  loading: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingBottom: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});
