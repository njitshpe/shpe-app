import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { useInbox } from '@/hooks/notifications/useInbox';
import { SHPE_COLORS, SPACING, RADIUS } from '@/constants/colors';
import type { InboxNotification } from '@/types/notifications';

// ── Row Item ────────────────────────────────────────────────────────────

interface NotificationRowProps {
  item: InboxNotification;
  onPress: (item: InboxNotification) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}

function NotificationRow({ item, onPress, theme }: NotificationRowProps) {
  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.border : theme.card },
      ]}
    >
      {/* Unread indicator */}
      {!item.is_read && <View style={styles.unreadDot} />}

      <View style={styles.rowContent}>
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

        <Text
          style={[styles.rowBody, { color: theme.subtext }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>

        <Text style={[styles.rowTime, { color: theme.subtext }]}>
          {timeAgo}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, refresh } =
    useInbox();

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

  const renderItem = useCallback(
    ({ item }: { item: InboxNotification }) => (
      <NotificationRow item={item} onPress={handlePress} theme={theme} />
    ),
    [handlePress, theme],
  );

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
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Inbox</Text>

        {unreadCount > 0 ? (
          <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={22} color={SHPE_COLORS.accentBlue} />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loading}
        />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color={theme.subtext}
          />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            All caught up!
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={false}
          onRefresh={refresh}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
          )}
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
    paddingBottom: SPACING.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
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

  // List
  list: {
    paddingVertical: SPACING.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SHPE_COLORS.accentBlue,
    marginTop: 5,
    marginRight: SPACING.sm + 4,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  rowTitleUnread: {
    fontWeight: '600',
  },
  rowBody: {
    fontSize: 14,
    lineHeight: 19,
  },
  rowTime: {
    fontSize: 12,
    marginTop: 2,
  },

  // States
  loading: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
