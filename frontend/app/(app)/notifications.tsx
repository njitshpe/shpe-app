import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchAnnouncementPosts } from '@/lib/feedService';

interface AnnouncementItem {
  id: string;
  title?: string | null;
  content: string;
  createdAt: string;
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    const response = await fetchAnnouncementPosts(50);
    if (response.success) {
      setAnnouncements(response.data);
    } else {
      setError(response.error.message);
    }

    if (showLoading) setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAnnouncements(true);
  }, [loadAnnouncements]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAnnouncements(false);
    setIsRefreshing(false);
  };

  const renderItem = ({ item }: { item: AnnouncementItem }) => (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>
        {(item.title?.trim() || 'Announcement').toUpperCase()}
      </Text>
      <Text style={[styles.cardMessage, { color: theme.text }]} numberOfLines={3}>
        {item.content}
      </Text>
      <Text style={[styles.cardDate, { color: theme.subtext }]}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.background }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Alerts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loading} />
      ) : error ? (
        <Text style={[styles.emptyText, { color: theme.subtext }]}>{error}</Text>
      ) : announcements.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.subtext }]}>No alerts yet.</Text>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  loading: {
    marginTop: 40,
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
