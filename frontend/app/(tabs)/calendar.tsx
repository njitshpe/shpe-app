import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { EventCard } from '../../components/EventCard';
import eventsData from '../../data/events.mock.json';

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'Career' | 'Social' | 'Workshop' | 'General';
  points: number;
}

export default function CalendarScreen() {
  const router = useRouter();

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <EventCard
      id={item.id}
      title={item.title}
      startTime={item.startTime}
      endTime={item.endTime}
      location={item.location}
      type={item.type}
      onPress={() => handleEventPress(item.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Events</Text>
      <Text style={styles.headerSubtitle}>
        {eventsData.length} upcoming events
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No events available</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={eventsData}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
