import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { adminRSVPService, PendingEventSummary } from '@/services/adminRSVP.service';

export default function PendingRSVPsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PendingEventSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await adminRSVPService.getEventsWithPendingRequests();
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Failed to load pending events', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useFocusEffect ensures the list refreshes every time we navigate back from the Swipe screen
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const renderItem = ({ item }: { item: PendingEventSummary }) => {
    const { day, month, time } = formatDate(item.event.start_time);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/admin/pending-rsvps/${item.event.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Date Box */}
          <View style={[styles.dateBox, { backgroundColor: theme.background }]}>
            <Text style={[styles.dateMonth, { color: theme.primary }]}>{month}</Text>
            <Text style={[styles.dateDay, { color: theme.text }]}>{day}</Text>
          </View>

          {/* Event Details */}
          <View style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>
              {item.event.name}
            </Text>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color={theme.subtext} />
              <Text style={[styles.detailText, { color: theme.subtext }]}>{time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={theme.subtext} />
              <Text style={[styles.detailText, { color: theme.subtext }]} numberOfLines={1}>
                {item.event.location_name}
              </Text>
            </View>
          </View>

          {/* Pending Count Badge */}
          <View style={styles.rightSection}>
            <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.badgeText}>{item.pending_count}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} style={{ marginTop: 8 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom Header since this is a sub-stack */}
      <View style={[styles.header, { backgroundColor: theme.card, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Pending Requests</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-done-circle" size={64} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>All Caught Up!</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
            There are no pending RSVPs to review right now.
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.event.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 56,
    paddingLeft: 8,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});